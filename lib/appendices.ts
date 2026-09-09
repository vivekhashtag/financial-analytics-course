import fs from 'node:fs';
import path from 'node:path';
import { cache } from 'react';
import { ROOT, readPreparedMdx } from './content';
import type { PreparedMdx } from './mdx-source';
import type { ModuleNotebook } from './types';

/**
 * The appendices: enrichment material that sits beside the course rather than
 * inside it.
 *
 * Unlike modules, these have no `module.json` — there is no quiz, no exercise
 * bank, no badge and no place on the metro map, so a schema would be four
 * fields of nothing. The registry below *is* the contract, and
 * `npm run validate` cross-checks it against `content/appendices/` in both
 * directions: a file referenced here that does not exist fails the build, and a
 * file on disk that nothing here references is reported as unreachable. That
 * second check is the one that matters — an appendix the UI never links to is
 * exactly the bug this section was built to fix.
 */

export type AppendixKind = 'page' | 'notebook';

export interface Appendix {
  /** route segment: /appendices/<slug> */
  slug: string;
  letter: 'A' | 'B' | 'C' | 'D';
  /** card and navigation label */
  title: string;
  /** one line, on the card and in the page header */
  blurb: string;
  kind: AppendixKind;
  /** prose appendices: the source file, relative to the repo root */
  file?: string;
  /** notebook appendices: shaped like a module.json notebook so NotebookCard takes it as-is */
  notebook?: ModuleNotebook;
  /**
   * Reading time as each document states it in its own standfirst — not
   * estimated here. Null where the source gives none, and the card says
   * "notebook" instead of inventing a number.
   */
  estimatedMinutes: number | null;
}

export const APPENDICES: Appendix[] = [
  {
    slug: 'excel-bridge',
    letter: 'A',
    title: 'The Excel ↔ Python Bridge',
    blurb:
      'Read the messy kind of workbook into pandas, then write boss-ready formatted Excel back out.',
    kind: 'notebook',
    notebook: {
      id: 'appendix_a_excel_bridge',
      title: 'Appendix A · The Excel ↔ Python Bridge',
      file: 'notebooks/appendix_a_excel_bridge.ipynb',
      colabEnabled: true,
      datasets: ['client_book'],
      packages: ['pandas', 'numpy', 'openpyxl'],
      // No appendix solutions notebook ships with the course.
      solutionFile: null,
    },
    estimatedMinutes: null,
  },
  {
    slug: 'career-map',
    letter: 'B',
    title: 'The Career Map',
    blurb:
      'Role by role: which of your notebooks proves you can do the job, and what each door looks like from outside.',
    kind: 'page',
    file: 'content/appendices/APPENDIX-B-CAREER-MAP.md',
    estimatedMinutes: 40, // stated in the file's standfirst
  },
  {
    slug: 'ship-it',
    letter: 'C',
    title: 'Ship It — Git, GitHub & Deployment',
    blurb:
      'How a capstone on your laptop becomes a link you can send. Git, GitHub and free hosting, all of it free.',
    kind: 'page',
    file: 'content/appendices/APPENDIX-C-SHIP-IT.md',
    estimatedMinutes: 45, // stated in the file's standfirst, plus about an hour of doing
  },
  {
    slug: 'the-work-itself',
    letter: 'D',
    title: 'The Work Itself — Six Jobs Up Close',
    blurb:
      'Six finance jobs as a numbered process: the typical day, the documents produced, who pays for it, the India angle.',
    kind: 'page',
    file: 'content/appendices/APPENDIX-D-THE-WORK-ITSELF.md',
    estimatedMinutes: 90, // stated in the file's standfirst
  },
];

export function getAppendices(): Appendix[] {
  return APPENDICES;
}

export function getAppendix(slug: string): Appendix | null {
  return APPENDICES.find((a) => a.slug === slug) ?? null;
}

/** Previous / next appendix, so the four read as a sequence like a module's pages. */
export function appendixNeighbours(slug: string) {
  const i = APPENDICES.findIndex((a) => a.slug === slug);
  return {
    prev: i > 0 ? APPENDICES[i - 1] : null,
    next: i >= 0 && i < APPENDICES.length - 1 ? APPENDICES[i + 1] : null,
  };
}

export interface AppendixSource extends PreparedMdx {
  slug: string;
  /** the document's own H1, lifted out so the shell can render it as the page title */
  documentTitle: string | null;
}

/**
 * Prose body for an appendix, through the same pipeline as a module page —
 * `readPreparedMdx` carries the stray-`<` escaping and the `code={`…`}` lifting
 * that the module content depends on, and these files get it for free.
 *
 * The leading H1 is removed: the shell renders it as the page heading, and
 * leaving it in the body would print the title twice. Every other heading stays
 * put, including Appendix D's six `# D.n` section titles.
 */
export const getAppendixPage = cache((slug: string): AppendixSource | null => {
  const appendix = getAppendix(slug);
  if (!appendix?.file) return null;

  const file = path.join(ROOT, appendix.file);
  if (!fs.existsSync(file)) return null;

  const { title, body } = splitLeadingH1(fs.readFileSync(file, 'utf8'));
  const prepared = readPreparedMdx(body);

  return { slug, documentTitle: title, ...prepared };
});

/** Splits `# Title` off the top of a document, if that is how it opens. */
function splitLeadingH1(raw: string): { title: string | null; body: string } {
  const cleaned = raw.replace(/^﻿/, '').replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
  const match = /^\s*#[ \t]+(.+?)[ \t]*(\r?\n|$)/.exec(cleaned);
  if (!match) return { title: null, body: cleaned };
  return { title: match[1], body: cleaned.slice(match[0].length) };
}
