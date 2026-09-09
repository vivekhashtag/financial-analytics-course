#!/usr/bin/env node
/**
 * Validates every module.json under content/modules against
 * schema/module.schema.json, then runs the referential checks JSON Schema
 * cannot express (do the files a module points at actually exist?).
 *
 * Schema failures and missing page files are ERRORS — they fail the build.
 * Missing optional extras (a case-study MDX, a poster PDF) are WARNINGS.
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ROOT = process.cwd();
const MODULES_DIR = path.join(ROOT, 'content', 'modules');

const errors = [];
const warnings = [];

const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const exists = (rel) => fs.existsSync(path.join(ROOT, rel));

/* ------------------------------------------------------------- JSON Schema */

const schema = readJson(path.join(ROOT, 'schema', 'module.schema.json'));
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);

const moduleDirs = fs
  .readdirSync(MODULES_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

if (moduleDirs.length === 0) err('content/modules is empty');

const modules = [];
const schemaFailures = new Set();

for (const dir of moduleDirs) {
  const jsonPath = path.join('content', 'modules', dir, 'module.json');

  if (!exists(jsonPath)) {
    err(`${dir}: module.json is missing`);
    continue;
  }

  let mod;
  try {
    mod = readJson(path.join(ROOT, jsonPath));
  } catch (e) {
    err(`${jsonPath}: not parseable JSON — ${e.message}`);
    continue;
  }

  if (mod.id !== dir) err(`${jsonPath}: id "${mod.id}" does not match folder "${dir}"`);

  if (!validate(mod)) {
    for (const e of validate.errors ?? []) {
      err(`${jsonPath}: ${e.instancePath || '/'} ${e.message}`);
    }
    // Skip the referential checks — the shape is wrong, so anything they said
    // would be noise. The id is still registered below so a *valid* module
    // naming this one as a prerequisite doesn't get blamed for it.
    schemaFailures.add(dir);
  }

  modules.push({ dir, mod });
}

/* ------------------------------------------------- referential integrity */

const ids = new Set(modules.map((m) => m.mod.id));
const notebookIds = new Map();
const exerciseIds = new Map();

for (const { dir, mod } of modules) {
  if (schemaFailures.has(dir)) continue;

  const inModule = (rel) => path.posix.join('content/modules', dir, rel);

  // Pages must exist and have unique slugs — the router depends on both.
  const slugs = new Set();
  for (const page of mod.pages) {
    if (slugs.has(page.slug)) err(`${dir}: duplicate page slug "${page.slug}"`);
    slugs.add(page.slug);
    if (!exists(inModule(page.file))) err(`${dir}: page file missing — ${page.file}`);
  }
  for (const reserved of ['quiz', 'exercises']) {
    if (slugs.has(reserved)) err(`${dir}: page slug "${reserved}" collides with a route`);
  }

  // Prerequisites must name real modules.
  for (const pre of mod.prerequisites ?? []) {
    if (!ids.has(pre)) err(`${dir}: prerequisite "${pre}" is not a module id`);
  }

  // Notebooks: files must exist, ids must be unique course-wide.
  for (const nb of mod.notebooks ?? []) {
    if (notebookIds.has(nb.id)) {
      err(`${dir}: notebook id "${nb.id}" already used by ${notebookIds.get(nb.id)}`);
    }
    notebookIds.set(nb.id, dir);
    if (!exists(nb.file)) err(`${dir}: notebook file missing — ${nb.file}`);
    if (nb.solutionFile && !exists(nb.solutionFile)) {
      err(`${dir}: solution notebook missing — ${nb.solutionFile}`);
    }
  }

  for (const app of mod.streamlitApps ?? []) {
    if (!exists(app.file)) err(`${dir}: streamlit app missing — ${app.file}`);
  }

  // Quiz.
  if (mod.quiz) {
    const quizPath = inModule(mod.quiz.file);
    if (!exists(quizPath)) {
      err(`${dir}: quiz file missing — ${mod.quiz.file}`);
    } else {
      const quiz = readJson(path.join(ROOT, quizPath));
      if (!Array.isArray(quiz.questions) || quiz.questions.length === 0) {
        err(`${dir}: quiz.json has no questions`);
      } else {
        quiz.questions.forEach((q, i) => checkQuestion(dir, q, i));
      }
    }
  }

  // Exercises.
  if (mod.exercises) {
    const exPath = inModule(mod.exercises.file);
    if (!exists(exPath)) {
      err(`${dir}: exercises file missing — ${mod.exercises.file}`);
    } else {
      const data = readJson(path.join(ROOT, exPath));
      if (!Array.isArray(data.exercises)) {
        err(`${dir}: exercises.json has no "exercises" array`);
      } else {
        for (const ex of data.exercises) {
          if (!ex.id) err(`${dir}: an exercise has no id`);
          else if (exerciseIds.has(ex.id) && ex.id.startsWith('m')) {
            err(`${dir}: exercise id "${ex.id}" already used by ${exerciseIds.get(ex.id)}`);
          } else exerciseIds.set(ex.id, dir);

          if (ex.notebook && !notebookIdWillExist(ex.notebook, modules)) {
            warn(`${dir}/${ex.id}: references unknown notebook "${ex.notebook}"`);
          }
          if (ex.modelReport && !exists(inModule(ex.modelReport))) {
            warn(`${dir}/${ex.id}: modelReport file missing — ${ex.modelReport}`);
          }
        }
      }
    }
  }

  // Case study prose is optional; the card renders from module.json either way.
  if (mod.caseStudy?.file && !exists(inModule(mod.caseStudy.file))) {
    warn(`${dir}: caseStudy.file missing — ${mod.caseStudy.file} (card renders without it)`);
  }
}

function notebookIdWillExist(id, mods) {
  return mods.some(({ mod }) => (mod.notebooks ?? []).some((nb) => nb.id === id));
}

function checkQuestion(dir, q, i) {
  const at = `${dir}/quiz q${i + 1}${q.id ? ` (${q.id})` : ''}`;
  if (!q.id) err(`${at}: missing id`);
  if (!q.prompt) err(`${at}: missing prompt`);

  const type = q.type ?? 'single';
  const n = Array.isArray(q.options) ? q.options.length : 0;

  if (type === 'single' || type === 'truefalse') {
    if (n < 2) err(`${at}: ${type} needs at least 2 options`);
    if (typeof q.answer !== 'number' || q.answer < 0 || q.answer >= n) {
      err(`${at}: answer ${JSON.stringify(q.answer)} is not a valid option index`);
    }
  } else if (type === 'multi') {
    if (!Array.isArray(q.answer) || q.answer.some((a) => a < 0 || a >= n)) {
      err(`${at}: multi answer must be an array of valid option indices`);
    }
  } else if (type === 'numeric') {
    if (typeof q.answer !== 'number') err(`${at}: numeric answer must be a number`);
  } else if (type === 'match') {
    if (!Array.isArray(q.pairs) || q.pairs.length < 2) {
      err(`${at}: match needs at least 2 pairs`);
    } else if (q.pairs.some((p) => !p.left || !p.right)) {
      err(`${at}: every match pair needs left and right`);
    }
  } else {
    err(`${at}: unsupported question type "${type}"`);
  }
}

/* --------------------------------------------------------- the ML signpost */

/**
 * The "next step: Introduction to Machine Learning" card is pinned to one page
 * (see ML_SIGNPOST_PAGE in lib/links.ts) rather than detected from prose. Warn
 * if that page stops existing or stops raising the border, which would mean the
 * card is now pinned to the wrong place.
 */
const SIGNPOST = { moduleId: '06-predictive', slug: 'content' };
const ML_BORDER = /\bML border\b|\bML course\b|not a machine learning course|machine learning course/i;

{
  const owner = modules.find(({ mod }) => mod.id === SIGNPOST.moduleId);
  const page = owner?.mod.pages.find((p) => p.slug === SIGNPOST.slug);

  if (!owner || !page) {
    warn(
      `ML signpost: no page "${SIGNPOST.moduleId}/${SIGNPOST.slug}" — ` +
        'update ML_SIGNPOST_PAGE in lib/links.ts',
    );
  } else {
    const file = path.join(ROOT, 'content', 'modules', SIGNPOST.moduleId, page.file);
    if (fs.existsSync(file) && !ML_BORDER.test(fs.readFileSync(file, 'utf8'))) {
      warn(
        `ML signpost: ${SIGNPOST.moduleId}/${page.file} no longer mentions the ML border — ` +
          'the hand-off card may be on the wrong page',
      );
    }
  }
}

/* --------------------------------------------------------------- appendices */

/**
 * The appendices have no module.json, so lib/appendices.ts is their registry.
 * Cross-check it against content/appendices/ in both directions by reading the
 * paths out of that source: a referenced file that does not exist is an error,
 * and a file on disk that nothing references is a warning.
 *
 * That second direction is the check that matters. Appendix A's notebook sat in
 * the package for weeks, downloadable by URL and reachable from nowhere in the
 * UI, precisely because nothing was watching for content the app never links
 * to. This is the watch.
 */
{
  const registryPath = path.join(ROOT, 'lib', 'appendices.ts');

  if (!fs.existsSync(registryPath)) {
    err('lib/appendices.ts is missing — the appendix routes read their registry from it');
  } else {
    const source = fs.readFileSync(registryPath, 'utf8');
    const referenced = new Set(
      [...source.matchAll(/'((?:content\/appendices|notebooks)\/[^']+)'/g)].map((m) => m[1]),
    );

    if (referenced.size === 0) {
      err('lib/appendices.ts references no content files — the appendix pages would be empty');
    }

    for (const rel of referenced) {
      if (!exists(rel)) err(`appendix registry: file missing — ${rel}`);
    }

    const dir = path.join(ROOT, 'content', 'appendices');
    const onDisk = fs.existsSync(dir)
      ? fs
          .readdirSync(dir)
          .filter((f) => /\.(md|mdx)$/i.test(f))
          .map((f) => `content/appendices/${f}`)
      : [];

    if (onDisk.length === 0) warn('content/appendices holds no .md files');

    for (const rel of onDisk) {
      if (!referenced.has(rel)) {
        warn(`${rel}: on disk but not in lib/appendices.ts — unreachable from the UI`);
      }
    }
  }
}

/* ---------------------------------------------------- datasets + notebooks */

const datasetsPath = path.join(ROOT, 'data', 'datasets.json');
if (!fs.existsSync(datasetsPath)) {
  err('data/datasets.json is missing');
} else {
  const { datasets } = readJson(datasetsPath);
  for (const ds of datasets ?? []) {
    if (!exists(ds.file)) err(`dataset ${ds.id}: file missing — ${ds.file}`);
    if (ds.rawUrl !== `/${ds.file}`) {
      warn(`dataset ${ds.id}: rawUrl "${ds.rawUrl}" does not mirror file "${ds.file}"`);
    }
  }
}

/* ------------------------------------------------------------------ report */

for (const w of warnings) console.warn(`  warn  ${w}`);

if (errors.length) {
  console.error(`\n✖ Content validation failed — ${errors.length} error(s):\n`);
  for (const e of errors) console.error(`  error ${e}`);
  console.error('');
  process.exit(1);
}

console.log(
  `✔ Content valid — ${modules.length} modules, ${notebookIds.size} notebooks, ` +
    `${exerciseIds.size} exercises${warnings.length ? `, ${warnings.length} warning(s)` : ''}`,
);
