import { publicFileExists } from './content';

/**
 * The work templates that ship with Appendix D — the blank version of each
 * document the six practices actually produce.
 *
 * They live in `public/templates/` and are served as static files, so the
 * `href` here is also the URL. `available` is checked at build time rather than
 * assumed: a template that has not been uploaded renders as a disabled card
 * naming the missing file, the same honesty the `Download` widget applies to
 * the two missing posters.
 */

export interface WorkTemplate {
  /** the practice this belongs to: "D.1" … "D.6" */
  practice: string;
  /** short name, used on the button */
  name: string;
  /** what the document is for, one line, taken from the template's own subtitle */
  description: string;
  file: string;
}

export const WORK_TEMPLATES: WorkTemplate[] = [
  {
    practice: 'D.1',
    name: 'Results note',
    description:
      'Two pages at most, answer first: rating, old target to new, and what moved the numbers.',
    file: 'templates/template_results_note.docx',
  },
  {
    practice: 'D.2',
    name: 'Teaser',
    description:
      'Two anonymised pages with no company name anywhere. The goal is one reply: send the NDA.',
    file: 'templates/template_teaser.docx',
  },
  {
    practice: 'D.3',
    name: 'DD finding',
    description:
      'One finding per sheet, and every claim needs a source document and a rupee impact.',
    file: 'templates/template_dd_finding.docx',
  },
  {
    practice: 'D.4',
    name: 'IC memo',
    description:
      'One page when done: recommendation, thesis, three findings, the pre-mortem, the ask.',
    file: 'templates/template_ic_memo.docx',
  },
  {
    practice: 'D.5',
    name: 'Strategy note',
    description:
      'The desk’s published note. Every structure states its maximum loss before entry, not after.',
    file: 'templates/template_strategy_note.docx',
  },
  {
    practice: 'D.6',
    name: 'Rating rationale',
    description: 'Grade first, three drivers second, downgrade triggers third.',
    file: 'templates/template_rating_rationale.docx',
  },
];

/** The one printable: all six workflows on a page each. */
export const WORKFLOWS_CHEATSHEET = {
  name: 'Print the six workflows — PDF',
  description: 'All six processes on one page each, for the wall above your desk.',
  file: 'templates/workflows_cheatsheet.pdf',
};

/**
 * The same six documents, filled in.
 *
 * One page per practice in D.1–D.6 order, which is what makes `samplePage`
 * below a simple ordinal rather than a lookup table. Each page ends with a
 * "why this works" block, and those three lines are the model answers the
 * guided exercise cards reveal (see lib/practice-figures.ts) — so the card and
 * the pack cannot drift apart.
 */
export const SAMPLES_PACK = {
  name: 'See them filled in — six worked samples (PDF)',
  description:
    'The same six documents, completed on the course’s own data, each with a note on why it works.',
  file: 'templates/samples_pack.pdf',
};

/** Which page of the samples pack belongs to a practice. D.1 is page 1. */
export function samplePage(practice: string): number | null {
  const n = Number.parseInt(practice.replace(/^D\./, ''), 10);
  return Number.isInteger(n) && n >= 1 && n <= 6 ? n : null;
}

export interface ResolvedTemplate extends WorkTemplate {
  href: string;
  available: boolean;
}

function resolve<T extends { file: string }>(t: T): T & { href: string; available: boolean } {
  const href = `/${t.file}`;
  return { ...t, href, available: publicFileExists(href) };
}

export function getWorkTemplates(): ResolvedTemplate[] {
  return WORK_TEMPLATES.map(resolve);
}

export function getCheatsheet() {
  return resolve(WORKFLOWS_CHEATSHEET);
}

export function getSamplesPack() {
  return resolve(SAMPLES_PACK);
}

/** The template for one practice — used by the inline link at a section's end. */
export function templateForPractice(practice: string): ResolvedTemplate | null {
  const hit = WORK_TEMPLATES.find((t) => t.practice === practice);
  return hit ? resolve(hit) : null;
}
