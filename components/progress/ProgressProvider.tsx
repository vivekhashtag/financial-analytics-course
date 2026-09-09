'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

/**
 * localStorage-backed progress. No backend in v1, so this is the only record of
 * what a learner has done — every write is immediately persisted, and reads are
 * gated on `hydrated` so server and first client render always match.
 */

const STORAGE_KEY = 'fac.progress.v1';

export interface ModuleProgress {
  pagesRead: string[];
  notebooksDownloaded: string[];
  /** "I've attempted this" — the gate in front of solutions */
  notebooksAttempted: string[];
  exercisesAttempted: string[];
  exercisesComplete: string[];
  quizScore: number | null;
  quizTotal: number | null;
  quizPassed: boolean;
  /** free-form widget state: sorting game, bias streaks, trust report answers */
  widgets: Record<string, unknown>;
  completedAt: string | null;
}

export interface ProgressState {
  version: 1;
  modules: Record<string, ModuleProgress>;
  badges: string[];
}

const emptyModule = (): ModuleProgress => ({
  pagesRead: [],
  notebooksDownloaded: [],
  notebooksAttempted: [],
  exercisesAttempted: [],
  exercisesComplete: [],
  quizScore: null,
  quizTotal: null,
  quizPassed: false,
  widgets: {},
  completedAt: null,
});

const emptyState = (): ProgressState => ({ version: 1, modules: {}, badges: [] });

type ListKey =
  | 'pagesRead'
  | 'notebooksDownloaded'
  | 'notebooksAttempted'
  | 'exercisesAttempted'
  | 'exercisesComplete';

interface ProgressApi {
  hydrated: boolean;
  state: ProgressState;
  moduleProgress: (moduleId: string) => ModuleProgress;
  has: (moduleId: string, key: ListKey, value: string) => boolean;
  add: (moduleId: string, key: ListKey, value: string) => void;
  remove: (moduleId: string, key: ListKey, value: string) => void;
  toggle: (moduleId: string, key: ListKey, value: string) => void;
  recordQuiz: (moduleId: string, score: number, total: number, passMark: number) => void;
  setWidget: (moduleId: string, widgetId: string, value: unknown) => void;
  getWidget: <T>(moduleId: string, widgetId: string, fallback: T) => T;
  awardBadge: (badgeId: string) => void;
  hasBadge: (badgeId: string) => boolean;
  resetModule: (moduleId: string) => void;
  resetAll: () => void;
}

const ProgressContext = createContext<ProgressApi | null>(null);

function load(): ProgressState {
  if (typeof window === 'undefined') return emptyState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as ProgressState;
    if (parsed?.version !== 1) return emptyState();
    return {
      version: 1,
      badges: Array.isArray(parsed.badges) ? parsed.badges : [],
      modules: Object.fromEntries(
        Object.entries(parsed.modules ?? {}).map(([id, m]) => [id, { ...emptyModule(), ...m }]),
      ),
    };
  } catch {
    return emptyState();
  }
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProgressState>(emptyState);
  const [hydrated, setHydrated] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    setState(load());
    setHydrated(true);
  }, []);

  // Persist on every change, and keep other open tabs in step.
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* quota or private mode — progress simply won't survive the reload */
    }
  }, [state, hydrated]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setState(load());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const update = useCallback(
    (moduleId: string, fn: (m: ModuleProgress) => ModuleProgress) => {
      setState((prev) => {
        const current = prev.modules[moduleId] ?? emptyModule();
        return { ...prev, modules: { ...prev.modules, [moduleId]: fn(current) } };
      });
    },
    [],
  );

  const api = useMemo<ProgressApi>(() => {
    const moduleProgress = (moduleId: string) =>
      stateRef.current.modules[moduleId] ?? emptyModule();

    return {
      hydrated,
      state,
      moduleProgress: (moduleId) => state.modules[moduleId] ?? emptyModule(),

      has: (moduleId, key, value) => (state.modules[moduleId]?.[key] ?? []).includes(value),

      add: (moduleId, key, value) =>
        update(moduleId, (m) =>
          m[key].includes(value) ? m : { ...m, [key]: [...m[key], value] },
        ),

      remove: (moduleId, key, value) =>
        update(moduleId, (m) => ({ ...m, [key]: m[key].filter((v) => v !== value) })),

      toggle: (moduleId, key, value) =>
        update(moduleId, (m) => ({
          ...m,
          [key]: m[key].includes(value)
            ? m[key].filter((v) => v !== value)
            : [...m[key], value],
        })),

      recordQuiz: (moduleId, score, total, passMark) => {
        const passed = score >= passMark;
        update(moduleId, (m) => ({
          ...m,
          // Never let a retake erase a better attempt.
          quizScore: m.quizScore === null ? score : Math.max(m.quizScore, score),
          quizTotal: total,
          quizPassed: m.quizPassed || passed,
          completedAt: m.completedAt ?? (passed ? new Date().toISOString() : null),
        }));
      },

      setWidget: (moduleId, widgetId, value) =>
        update(moduleId, (m) => ({ ...m, widgets: { ...m.widgets, [widgetId]: value } })),

      getWidget: <T,>(moduleId: string, widgetId: string, fallback: T): T => {
        const v = state.modules[moduleId]?.widgets?.[widgetId];
        return (v === undefined ? fallback : v) as T;
      },

      awardBadge: (badgeId) =>
        setState((prev) =>
          prev.badges.includes(badgeId)
            ? prev
            : { ...prev, badges: [...prev.badges, badgeId] },
        ),

      hasBadge: (badgeId) => state.badges.includes(badgeId),

      resetModule: (moduleId) => {
        void moduleProgress(moduleId);
        update(moduleId, () => emptyModule());
      },

      resetAll: () => setState(emptyState()),
    };
  }, [state, hydrated, update]);

  return <ProgressContext.Provider value={api}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressApi {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used inside <ProgressProvider>');
  return ctx;
}

/**
 * Percentage complete for a module, weighting pages, notebooks, exercises and
 * the quiz.
 *
 * Only ever called with a real module's totals, which is what keeps the
 * appendices out of it. Their pages are marked read against the
 * `APPENDIX_PROGRESS_KEY` pseudo-module (see lib/progress-keys.ts), and every
 * caller of this function — the drawer, the module cards, `/progress`, the
 * metro map — builds its list from `getAllModules()`, so the appendix bucket is
 * never one of the rows. Called with it anyway, `totals` would be all zeroes
 * and this returns 0 rather than a wrong number.
 */
export function moduleCompletion(
  p: ModuleProgress,
  totals: { pages: number; notebooks: number; exercises: number; hasQuiz: boolean },
): number {
  const parts: number[] = [];
  if (totals.pages) parts.push(Math.min(1, p.pagesRead.length / totals.pages));
  if (totals.notebooks) parts.push(Math.min(1, p.notebooksDownloaded.length / totals.notebooks));
  if (totals.exercises) parts.push(Math.min(1, p.exercisesComplete.length / totals.exercises));
  if (totals.hasQuiz) parts.push(p.quizPassed ? 1 : 0);
  if (!parts.length) return 0;
  return Math.round((parts.reduce((a, b) => a + b, 0) / parts.length) * 100);
}
