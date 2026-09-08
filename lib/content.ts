import fs from 'node:fs';
import path from 'node:path';
import { cache } from 'react';
import { prepareMdx, type PreparedMdx } from './mdx-source';
import { colabBranch, colabRepo, siteUrl } from './env';
import type {
  CourseModule,
  Dataset,
  Exercise,
  Exercises,
  ModuleNotebook,
  Quiz,
  QuizQuestion,
} from './types';

export const ROOT = process.cwd();
const MODULES_DIR = path.join(ROOT, 'content', 'modules');

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, 'utf8')) as T;
}

function tryReadJson<T>(file: string): T | null {
  try {
    return readJson<T>(file);
  } catch {
    return null;
  }
}

/** Every module, ordered by display number (0, 1, … 3.5, 4 … 12.5, 13). */
export const getAllModules = cache((): CourseModule[] => {
  const ids = fs
    .readdirSync(MODULES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  const modules = ids.map((id) => {
    const raw = readJson<Partial<CourseModule>>(path.join(MODULES_DIR, id, 'module.json'));
    // The schema lets most of these be absent; normalise so components need no guards.
    return {
      prerequisites: [],
      learningOutcomes: [],
      notebooks: [],
      streamlitApps: [],
      quiz: null,
      exercises: null,
      biasCheck: null,
      aiSidebar: null,
      streamConnector: null,
      badge: null,
      caseStudy: null,
      widgets: [],
      ...raw,
    } as CourseModule;
  });

  return modules.sort((a, b) => numeric(a.number) - numeric(b.number));
});

function numeric(n: string): number {
  const v = Number.parseFloat(n);
  return Number.isFinite(v) ? v : Number.MAX_SAFE_INTEGER;
}

export const getModule = cache((moduleId: string): CourseModule | null => {
  return getAllModules().find((m) => m.id === moduleId) ?? null;
});

/** The page a module opens on — where "go to this module" should land. */
export function firstPageHref(mod: CourseModule): string {
  const first = mod.pages[0];
  return first ? `/modules/${mod.id}/${first.slug}` : `/modules/${mod.id}`;
}

/**
 * Does this module involve a database?
 *
 * module.json has no field for it, so this is inferred from the module id and
 * its notebook ids — Module 3.5 ships `035a_sql_first_queries` and friends and
 * is the only database module in the course. Narrow on purpose: a broader
 * pattern would false-positive on any module that merely reads a CSV.
 */
export function usesDatabase(mod: CourseModule): boolean {
  return (
    /sql/i.test(mod.id) || mod.notebooks.some((nb) => /sql/i.test(`${nb.id} ${nb.file}`))
  );
}

/** Previous / next module in course order. */
export function moduleNeighbours(moduleId: string) {
  const all = getAllModules();
  const i = all.findIndex((m) => m.id === moduleId);
  return {
    prev: i > 0 ? all[i - 1] : null,
    next: i >= 0 && i < all.length - 1 ? all[i + 1] : null,
  };
}

/* ------------------------------------------------------------------ pages */

export interface PageSource extends PreparedMdx {
  moduleId: string;
  slug: string;
  title: string;
}

const FRONTMATTER = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/;

function readMdxFile(file: string): PreparedMdx | null {
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, 'utf8').replace(/^﻿/, '').replace(FRONTMATTER, '');
  return prepareMdx(raw);
}

export const getPage = cache((moduleId: string, slug: string): PageSource | null => {
  const mod = getModule(moduleId);
  const page = mod?.pages.find((p) => p.slug === slug);
  if (!mod || !page) return null;

  const prepared = readMdxFile(path.join(MODULES_DIR, moduleId, page.file));
  if (!prepared) return null;

  return { moduleId, slug, title: page.title, ...prepared };
});

/** Reads an MDX file referenced from module.json (case study, model report). */
export const getModuleMdx = cache((moduleId: string, relFile: string): PreparedMdx | null => {
  return readMdxFile(path.join(MODULES_DIR, moduleId, relFile));
});

/**
 * Does this page's prose raise the machine-learning border?
 *
 * Not used to decide where the hand-off card renders — that is hard-scoped to
 * `ML_SIGNPOST_PAGE`. This exists so `npm run validate` can warn if Module 6's
 * content page ever stops mentioning the border, which would mean the card is
 * now pinned to the wrong page.
 */
const ML_BORDER =
  /\bML border\b|\bML course\b|not a machine learning course|machine learning course/i;

export function mentionsMlBorder(body: string): boolean {
  return ML_BORDER.test(body);
}

export function pageNeighbours(mod: CourseModule, slug: string) {
  const i = mod.pages.findIndex((p) => p.slug === slug);
  return {
    prev: i > 0 ? mod.pages[i - 1] : null,
    next: i >= 0 && i < mod.pages.length - 1 ? mod.pages[i + 1] : null,
    index: i,
  };
}

/* ------------------------------------------------------------------- quiz */

/**
 * `passingScore` is expressed two ways across the content: an absolute number
 * of questions (Modules 0–3.5) and a percentage (Modules 4+, all `70`).
 * Anything larger than the question count is read as a percentage.
 */
export const getQuiz = cache((moduleId: string): Quiz | null => {
  const mod = getModule(moduleId);
  if (!mod?.quiz) return null;

  const data = tryReadJson<{ questions: QuizQuestion[] }>(
    path.join(MODULES_DIR, moduleId, mod.quiz.file),
  );
  if (!data?.questions?.length) return null;

  const total = data.questions.length;
  const raw = mod.quiz.passingScore ?? Math.ceil(total * 0.7);
  const passMark = raw > total ? Math.ceil((total * raw) / 100) : raw;

  return { questions: data.questions, passMark, passingScoreRaw: raw };
});

/* -------------------------------------------------------------- exercises */

export const getExercises = cache((moduleId: string): Exercise[] => {
  const mod = getModule(moduleId);
  if (!mod?.exercises) return [];
  const data = tryReadJson<Exercises>(path.join(MODULES_DIR, moduleId, mod.exercises.file));
  return data?.exercises ?? [];
});

/** Finds an exercise anywhere in the course — MDX references them by id alone. */
export const findExercise = cache(
  (exerciseId: string): { moduleId: string; exercise: Exercise } | null => {
    for (const mod of getAllModules()) {
      const hit = getExercises(mod.id).find((e) => e.id === exerciseId);
      if (hit) return { moduleId: mod.id, exercise: hit };
    }
    return null;
  },
);

export function totalPoints(list: Exercise[]): number {
  return list.reduce((sum, e) => sum + (e.points ?? 0), 0);
}

/* -------------------------------------------------------------- notebooks */

/** Finds a notebook by id across all modules (MDX uses `<NotebookCard id="…" />`). */
export const findNotebook = cache(
  (notebookId: string): { moduleId: string; notebook: ModuleNotebook } | null => {
    for (const mod of getAllModules()) {
      const hit = mod.notebooks.find((n) => n.id === notebookId);
      if (hit) return { moduleId: mod.id, notebook: hit };
    }
    return null;
  },
);

// Normalised and never-throwing — see lib/env.ts. A malformed value disables
// the feature it powers; it must never be able to fail the build.
const COLAB_REPO = colabRepo();
const COLAB_BRANCH = colabBranch();
const SITE_URL = siteUrl();

/** Download path — notebooks are mirrored into public/ by scripts/sync-static.mjs. */
export function assetHref(file: string): string {
  return '/' + file.replace(/^\.?\//, '');
}

/**
 * Open-in-Colab wants a public GitHub repo. Until NEXT_PUBLIC_COLAB_REPO is set
 * we fall back to Colab's URL importer against the deployed site, and return
 * null when neither is configured so the button can explain itself.
 */
export function colabHref(file: string): string | null {
  const rel = file.replace(/^\.?\//, '');
  if (COLAB_REPO) {
    return `https://colab.research.google.com/github/${COLAB_REPO}/blob/${COLAB_BRANCH}/${rel}`;
  }
  if (SITE_URL) {
    return `https://colab.research.google.com/#create=true&url=${encodeURIComponent(
      `${SITE_URL}/${rel}`,
    )}`;
  }
  return null;
}

/** True when a URL path resolves to a real file (public/, or data//notebooks/ at the root). */
export function publicFileExists(urlPath: string): boolean {
  const rel = urlPath.replace(/^\//, '').split('?')[0];
  if (!rel || rel.includes('..')) return false;
  return fs.existsSync(path.join(ROOT, 'public', rel)) || fs.existsSync(path.join(ROOT, rel));
}

/* --------------------------------------------------------------- datasets */

export const getDatasets = cache((): Dataset[] => {
  const data = tryReadJson<{ datasets: Dataset[] }>(path.join(ROOT, 'data', 'datasets.json'));
  return data?.datasets ?? [];
});

export const getDataset = cache((id: string): Dataset | null => {
  return getDatasets().find((d) => d.id === id) ?? null;
});

export interface CsvPreview {
  columns: string[];
  rows: string[][];
  totalRows: number;
}

/** First `limit` data rows of a dataset, for on-page previews. */
export const getCsvPreview = cache((datasetId: string, limit = 8): CsvPreview | null => {
  const ds = getDataset(datasetId);
  if (!ds) return null;

  const file = path.join(ROOT, ds.file);
  if (!fs.existsSync(file)) return null;

  const lines: string[] = [];
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (line.trim() === '') continue;
    lines.push(line);
    if (lines.length > limit) break;
  }
  if (!lines.length) return null;

  const [header, ...body] = lines;
  return {
    columns: splitCsvLine(header),
    rows: body.slice(0, limit).map(splitCsvLine),
    totalRows: ds.rows,
  };
});

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (quoted) {
      if (ch !== '"') cur += ch;
      else if (line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else quoted = false;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

/**
 * Which modules use a dataset. `usedIn` predates the final folder names
 * ("04-descriptive" vs "04-descriptive-viz"), so fall back to the number prefix.
 */
export function datasetModules(ds: Dataset): CourseModule[] {
  const all = getAllModules();
  const seen = new Set<string>();
  const found: CourseModule[] = [];

  for (const needle of ds.usedIn) {
    const hit =
      all.find((m) => m.id === needle) ??
      all.find((m) => m.id.split('-')[0] === needle.split('-')[0]);
    if (hit && !seen.has(hit.id)) {
      seen.add(hit.id);
      found.push(hit);
    }
  }
  return found;
}
