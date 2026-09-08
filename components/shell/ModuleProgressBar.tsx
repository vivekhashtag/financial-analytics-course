'use client';

import { Icon } from '@/components/ui/Icon';
import { moduleCompletion, useProgress } from '@/components/progress/ProgressProvider';

interface Totals {
  pages: number;
  notebooks: number;
  exercises: number;
  hasQuiz: boolean;
}

/** The module header's progress strip: one pill per tracked dimension. */
export function ModuleProgressBar({
  moduleId,
  totals,
}: {
  moduleId: string;
  totals: Totals;
}) {
  const { hydrated, moduleProgress } = useProgress();
  if (!hydrated) return <div className="mt-5 h-[38px]" aria-hidden="true" />;

  const p = moduleProgress(moduleId);
  const pct = moduleCompletion(p, totals);

  const pills = [
    { icon: 'book', label: 'pages', done: p.pagesRead.length, total: totals.pages },
    ...(totals.notebooks
      ? [
          {
            icon: 'notebook',
            label: 'notebooks',
            done: p.notebooksDownloaded.length,
            total: totals.notebooks,
          },
        ]
      : []),
    ...(totals.exercises
      ? [
          {
            icon: 'pencil',
            label: 'exercises',
            done: p.exercisesComplete.length,
            total: totals.exercises,
          },
        ]
      : []),
    ...(totals.hasQuiz
      ? [
          {
            icon: 'check-circle',
            label: 'quiz',
            done: p.quizPassed ? 1 : 0,
            total: 1,
          },
        ]
      : []),
  ];

  return (
    <div className="mt-5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <div className="h-2 w-32 overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full transition-[width] duration-slow ease-token"
              style={{ width: `${pct}%`, background: 'var(--accent)' }}
            />
          </div>
          <span className="text-xs font-semibold text-ink tabular-nums">{pct}%</span>
        </div>

        <ul className="flex flex-wrap gap-x-3 gap-y-1">
          {pills.map((pill) => (
            <li
              key={pill.label}
              className={`inline-flex items-center gap-1 text-xs ${
                pill.done >= pill.total ? 'text-success' : 'text-muted'
              }`}
            >
              <Icon name={pill.icon} size={13} />
              {pill.done}/{pill.total} {pill.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
