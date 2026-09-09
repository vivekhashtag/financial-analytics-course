import fs from 'node:fs';
import path from 'node:path';
import { cache } from 'react';
import { ROOT, getAllModules } from './content';
import { getAppendix } from './appendices';

/**
 * Structural parser for Appendix D, "The Work Itself".
 *
 * The appendix is written as six parallel job walk-throughs with an identical
 * internal shape, and the flagship page renders that shape as steppers,
 * timelines and chips instead of a wall of prose. This file recovers the shape
 * *by reading* the markdown. It never writes it: `content/` is the spec, and a
 * presentation upgrade is not a licence to reshape the source into whatever
 * would have been convenient to render.
 *
 * The shape it relies on, per section:
 *
 *   # D.n — Title
 *   <intro paragraphs>
 *   ## The process — …          → **Station n · Title.** body…
 *   ## A <Weekday> …            → "7:15 activity · 8:00 activity · …"
 *   ## The documents…           → prose
 *   ## Who pays                 → prose
 *   ## The India angle          → prose
 *   ## Your course, in miniature→ "thing = <code>'s thing · thing = …"
 *                                 followed by a **Try this:** paragraph
 *
 * Every parse step degrades rather than throws. A section whose stations cannot
 * be recovered keeps `parsed: false` and the page renders its raw markdown as
 * ordinary prose — the reader loses the stepper, never the content.
 */

export interface Station {
  /** as written: "0" exists (D.2 opens with Station 0) */
  n: string;
  title: string;
  /** raw markdown — lists and emphasis inside a station body are real */
  body: string;
}

export interface DayEntry {
  time: string;
  text: string;
}

export interface DayBlock {
  heading: string;
  entries: DayEntry[];
}

export interface CourseChip {
  /** the course reference as written ("5A", "12.5", "3C+5B"), null when none */
  code: string | null;
  label: string;
  /** set only when exactly one existing module is referenced */
  href: string | null;
  moduleTitle: string | null;
}

export interface Miniature {
  chips: CourseChip[];
  /** trailing prose that was part of the mapping paragraph but is not a mapping */
  note: string | null;
}

export interface Subsection {
  heading: string;
  body: string;
}

export interface Practice {
  /** "d1" — the scroll-spy target and DOM id */
  id: string;
  /** "D.1" */
  code: string;
  /** short label for the section nav, from the registry below */
  navLabel: string;
  /** the full heading text after "D.n — " */
  title: string;
  intro: string;
  processHeading: string | null;
  stations: Station[];
  day: DayBlock | null;
  /** the day block's prose, kept for the fallback when times could not be read */
  dayFallback: Subsection | null;
  subsections: Subsection[];
  miniature: Miniature | null;
  tryThis: string | null;
  /** the whole section verbatim — rendered as prose when `parsed` is false */
  raw: string;
  /** false when the stepper could not be built and prose should be used instead */
  parsed: boolean;
}

export interface WorkItself {
  /** the standfirst above D.1 */
  preamble: string;
  practices: Practice[];
  /** "Closing the Appendix — …", a document-level block, not part of D.6 */
  closing: Subsection | null;
}

/**
 * Short nav labels and the template each practice hands the learner. The
 * markdown headings are far too long for a nav rail ("Equity Research: The
 * Person Behind \"Buy, Target ₹2,450\""), so the labels live here — keyed by
 * code, so a renumbered section fails loudly rather than silently mislabelling.
 */
export const PRACTICE_LABELS: Record<string, string> = {
  'D.1': 'Equity Research',
  'D.2': 'IB Execution',
  'D.3': 'Due Diligence',
  'D.4': 'Buy-Side Analysis',
  'D.5': 'Derivatives Research',
  'D.6': 'Credit & Ratings',
};

/* ------------------------------------------------------------------- parse */

export const getWorkItself = cache((): WorkItself | null => {
  const appendix = getAppendix('the-work-itself');
  if (!appendix?.file) return null;

  const file = path.join(ROOT, appendix.file);
  if (!fs.existsSync(file)) return null;

  return parseWorkItself(fs.readFileSync(file, 'utf8'));
});

/** Exported for the sake of being testable without touching the filesystem. */
export function parseWorkItself(raw: string): WorkItself {
  const text = raw.replace(/^﻿/, '').replace(/\r\n/g, '\n');

  const SECTION = /^#[ \t]+D\.(\d+)[ \t]*[—–-][ \t]*(.+?)[ \t]*$/;

  const preambleLines: string[] = [];
  const chunks: { code: string; title: string; lines: string[] }[] = [];

  for (const line of text.split('\n')) {
    const hit = SECTION.exec(line);
    if (hit) {
      chunks.push({ code: `D.${hit[1]}`, title: hit[2], lines: [] });
    } else if (chunks.length) {
      chunks[chunks.length - 1].lines.push(line);
    } else {
      preambleLines.push(line);
    }
  }

  let closing: Subsection | null = null;

  const practices = chunks.map((chunk) => {
    const body = chunk.lines.join('\n');
    const practice = parsePractice(chunk.code, chunk.title, body);

    // "Closing the Appendix" trails the last section but belongs to the
    // document, not to D.6. Lift it out of whichever section swallowed it.
    const i = practice.subsections.findIndex((s) => /^Closing the Appendix/i.test(s.heading));
    if (i !== -1) {
      closing = practice.subsections[i];
      practice.subsections.splice(i, 1);
    }

    return practice;
  });

  return {
    preamble: stripLeadingH1(preambleLines.join('\n')),
    practices,
    closing,
  };
}

function parsePractice(code: string, title: string, body: string): Practice {
  const blocks = splitH2(body);

  const raw = body.trim();
  const base: Practice = {
    id: code.toLowerCase().replace('.', ''),
    code,
    navLabel: PRACTICE_LABELS[code] ?? title.split(':')[0].trim(),
    title,
    intro: blocks.intro,
    processHeading: null,
    stations: [],
    day: null,
    dayFallback: null,
    subsections: [],
    miniature: null,
    tryThis: null,
    raw,
    parsed: false,
  };

  for (const block of blocks.sections) {
    if (/^The process\b/i.test(block.heading)) {
      base.processHeading = block.heading;
      base.stations = parseStations(block.body);
      // Stations unrecoverable: keep the prose so nothing is lost.
      if (base.stations.length < 2) {
        base.stations = [];
        base.subsections.push(block);
      }
      continue;
    }

    if (/^A\s+(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/i.test(block.heading)) {
      const entries = parseDay(block.body);
      if (entries.length >= 2) base.day = { heading: block.heading, entries };
      else base.dayFallback = block;
      continue;
    }

    if (/^Your course, in miniature/i.test(block.heading)) {
      const { miniature, tryThis } = parseMiniature(block.body);
      base.miniature = miniature;
      base.tryThis = tryThis;
      if (!miniature) base.subsections.push(block);
      continue;
    }

    base.subsections.push(block);
  }

  // The stepper is the whole point of the upgrade. Without it, this section is
  // better served by the plain prose path.
  base.parsed = base.stations.length >= 2;

  return base;
}

/** Splits a section body into its leading prose plus its `## ` blocks. */
function splitH2(body: string): { intro: string; sections: Subsection[] } {
  const introLines: string[] = [];
  const sections: Subsection[] = [];

  for (const line of body.split('\n')) {
    const hit = /^##[ \t]+(.+?)[ \t]*$/.exec(line);
    if (hit) {
      sections.push({ heading: hit[1], body: '' });
    } else if (sections.length) {
      const last = sections[sections.length - 1];
      last.body = last.body ? `${last.body}\n${line}` : line;
    } else {
      introLines.push(line);
    }
  }

  return {
    intro: stripRules(introLines.join('\n')).trim(),
    sections: sections.map((s) => ({ heading: s.heading, body: stripRules(s.body).trim() })),
  };
}

/**
 * `**Station n · Title.** body…` — the title is inside the bold run, the body
 * starts on the same line and continues until the next station or the end.
 */
function parseStations(body: string): Station[] {
  const START = /^\*\*Station[ \t]+(\d+)[ \t]*·[ \t]*(.+?)\*\*(.*)$/;
  const stations: Station[] = [];

  for (const line of body.split('\n')) {
    const hit = START.exec(line);
    if (hit) {
      stations.push({
        n: hit[1],
        title: hit[2].trim().replace(/[.:]$/, ''),
        body: hit[3].trim(),
      });
    } else if (stations.length) {
      const last = stations[stations.length - 1];
      last.body = last.body ? `${last.body}\n${line}` : line;
    }
    // Anything before the first station is dropped on purpose: in this content
    // there is never any, and inventing a home for it would be guesswork.
  }

  return stations.map((s) => ({ ...s, body: s.body.trim() }));
}

/**
 * `7:15 activity · 8:00 activity · …` on one line.
 *
 * A fragment that does not open with a clock time is appended to the previous
 * entry rather than dropped, so a stray "·" inside an activity cannot shear the
 * timeline in half.
 */
function parseDay(body: string): DayEntry[] {
  const paragraph = body.split(/\n{2,}/)[0]?.replace(/\n/g, ' ').trim();
  if (!paragraph) return [];

  const entries: DayEntry[] = [];

  for (const fragment of paragraph.split(/[ \t]+·[ \t]+/)) {
    const hit = /^(\d{1,2}:\d{2})[ \t]+(.+)$/s.exec(fragment.trim());
    if (hit) {
      entries.push({ time: hit[1], text: hit[2].trim() });
    } else if (entries.length) {
      const last = entries[entries.length - 1];
      last.text = `${last.text} · ${fragment.trim()}`;
    } else {
      return [];
    }
  }

  return entries;
}

/* --------------------------------------------------------- course mapping */

/**
 * Course references as the appendix writes them, in three forms:
 *   - a lesson code: 5A, 8B, 3C, 10C …  (digits immediately followed by A–D)
 *   - a decimal module: 12.5, 3.5
 *   - spelled out: "Module 1", "Modules 3+5+6", "Modules 10+12"
 *
 * Anything that resolves to no module is ignored; a mapping that resolves to
 * more than one is left unlinked, because "3C+5B" points at two places and
 * picking one would send the learner to the wrong notebook half the time.
 */
function findModuleRefs(value: string): { codes: string[]; moduleIds: string[] } {
  // Collected with their offset and sorted, so "Module 1 plus 6A" reads
  // "1+6A" on the chip rather than in whichever order the passes ran.
  const found: { at: number; code: string; number: string }[] = [];
  const seen = new Set<string>();

  const take = (at: number, code: string, number: string) => {
    if (seen.has(number)) return;
    seen.add(number);
    found.push({ at, code, number });
  };

  for (const m of value.matchAll(/\b(\d{1,2}(?:\.\d)?)([A-D])\b/g)) {
    take(m.index ?? 0, `${m[1]}${m[2]}`, m[1]);
  }

  for (const m of value.matchAll(/\b(\d{1,2}\.\d)\b/g)) {
    take(m.index ?? 0, m[1], m[1]);
  }

  for (const m of value.matchAll(/\bModules?[ \t]+([\d.+\s]+)/g)) {
    const listed = m[1].split('+').map((n) => n.trim());
    for (const n of listed) {
      if (n) take(m.index ?? 0, n, n);
    }
  }

  found.sort((a, b) => a.at - b.at);

  const byNumber = new Map(getAllModules().map((mod) => [mod.number, mod.id]));
  const moduleIds: string[] = [];
  for (const f of found) {
    const id = byNumber.get(f.number);
    if (id && !moduleIds.includes(id)) moduleIds.push(id);
  }

  return { codes: found.map((f) => f.code), moduleIds };
}

function parseMiniature(body: string): { miniature: Miniature | null; tryThis: string | null } {
  const paragraphs = body.split(/\n{2,}/).map((p) => p.replace(/\n/g, ' ').trim());

  const mapping = paragraphs.find((p) => p.includes('=')) ?? null;
  const tryThis = paragraphs.find((p) => /^\*\*Try this/i.test(p)) ?? null;

  if (!mapping) return { miniature: null, tryThis };

  const modulesByNumber = new Map(getAllModules().map((m) => [m.id, m]));
  const chips: CourseChip[] = [];
  const notes: string[] = [];

  for (const item of mapping.split(/[ \t]+·[ \t]+/)) {
    const trimmed = item.trim();
    if (!trimmed) continue;

    const eq = trimmed.indexOf('=');
    if (eq === -1) {
      // Not a mapping at all — trailing commentary in the same paragraph.
      notes.push(clean(trimmed));
      continue;
    }

    const label = clean(trimmed.slice(0, eq));
    let value = trimmed.slice(eq + 1).trim();

    // The last mapping often runs on into a closing sentence. Keep the
    // sentence as a note instead of letting it pollute the chip.
    const sentence = /\.\s+(?=[A-Z])/.exec(value);
    if (sentence) {
      notes.push(clean(value.slice(sentence.index + sentence[0].length)));
      value = value.slice(0, sentence.index);
    }

    const { codes, moduleIds } = findModuleRefs(value);
    const single = moduleIds.length === 1 ? modulesByNumber.get(moduleIds[0]) : undefined;

    chips.push({
      code: codes.length ? codes.join('+') : null,
      label: label ? label[0].toUpperCase() + label.slice(1) : value,
      href: single ? `/modules/${single.id}` : null,
      moduleTitle: single ? `${single.number} · ${single.title}` : null,
    });
  }

  if (!chips.length) return { miniature: null, tryThis };

  return {
    miniature: { chips, note: notes.length ? notes.join(' ') : null },
    tryThis,
  };
}

/* ------------------------------------------------------------------ tidying */

/** Strips inline emphasis and trailing punctuation from a chip label. */
function clean(s: string): string {
  return s
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/^[·\s]+|[·\s]+$/g, '')
    .replace(/[.,;:]$/, '')
    .trim();
}

/** Drops the `---` rules that separate sections in the source. */
function stripRules(s: string): string {
  return s
    .split('\n')
    .filter((line) => !/^[ \t]*---[ \t]*$/.test(line))
    .join('\n');
}

function stripLeadingH1(s: string): string {
  return stripRules(s.replace(/^\s*#[ \t]+.+?(\n|$)/, '')).trim();
}
