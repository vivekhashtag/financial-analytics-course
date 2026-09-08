#!/usr/bin/env node
/**
 * dedash — mechanically replace em dashes in prose across
 * content/modules/<id>/pages/*.mdx.
 *
 *   node scripts/dedash.mjs              # dry run: report only, no writes
 *   node scripts/dedash.mjs --write      # apply the replacements
 *   node scripts/dedash.mjs --verbose    # also print every replacement
 *   node scripts/dedash.mjs --protect-headings-strict
 *                                        # never touch a `#` line, even the
 *                                        # first-line / "Module … · … —" case
 *
 * No editorial judgment per instance. The rules below decide everything, and
 * anything they do not cover is left alone and reported as unhandled.
 *
 * PROTECTED (never rewritten)
 *   - fenced code blocks (``` / ~~~), including the fence lines
 *   - inline code spans (`…`)
 *   - JSX template-literal props (`code={`…`}`) — that is taught source code
 *   - YAML frontmatter
 *   - table lines (any line containing `|`)
 *   - heading lines (`#…`), except the rule-2 carve-out below
 *   - a leading "— " at line start (attribution)
 *   - en dashes (–) anywhere; only U+2014 is in scope
 *   - everything outside .mdx: module.json, quiz.json, exercises.json, notebooks
 *
 * REPLACEMENTS, applied in this order
 *   1. paired aside      `— aside —`        →  `, aside,`
 *   2. heading separator  first line of the file, or a line matching
 *                         `Module … · … —`  →  `:`
 *   3. single spaced      ` — ` + lowercase →  `, `
 *                         ` — ` + uppercase/digit → `: `
 *   4. unspaced           `word—word`       →  `word, word`
 *
 * Rule 3 tie-breaker: to classify the next character, leading markdown
 * wrappers (* _ ` " ' “ ‘ [ () are skipped to reach the first alphanumeric.
 * Still mechanical — it just looks through emphasis rather than at it.
 *
 * NOTE ON RULE 2: the protection list says never touch a heading, but rule 2
 * targets "the first line of a file", which in this content is always a
 * heading (`# Module 4 · … — …`). Read strictly, rule 2 would never fire, so
 * it is treated as a carve-out from the heading protection. Pass
 * --protect-headings-strict to invert that reading.
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const EM = '—'; // em dash, the only character in scope
const EN = '–'; // en dash, explicitly out of scope

const argv = process.argv.slice(2);
const WRITE = argv.includes('--write');
const VERBOSE = argv.includes('--verbose');
const STRICT_HEADINGS = argv.includes('--protect-headings-strict');
const NAIVE_PAIRS = argv.includes('--naive-pairs');

const ROOT = process.cwd();
const MODULES_DIR = path.join(ROOT, 'content', 'modules');

/** Markdown wrappers rule 3 looks through to find the next real character. */
const WRAPPERS = new Set(['*', '_', '`', '"', "'", '“', '‘', '[', '(']);

/**
 * Precondition on rule 1, and a deliberate deviation from the literal spec.
 *
 * Taken literally, "paired em dashes around an aside" matches *any* two spaced
 * em dashes on a line — including two independent ones in different sentences:
 *
 *   …every line in a company's annual report — data. The people who can
 *   *read* this data — clean it…
 *
 * Pairing those merges two sentences into one wrong clause. So a span only
 * counts as an aside if it holds no sentence boundary and is not absurdly
 * long. Both tests are mechanical — no per-instance judgment. A span that
 * fails falls through to rule 3, which handles each dash on its own and gets
 * the right answer. Pass --naive-pairs for the literal reading.
 */
const MAX_ASIDE = 120;

function isAside(span) {
  if (span.length === 0 || span.length > MAX_ASIDE) return false;
  if (/[.!?]["'”’)\]]?\s/.test(span)) return false; // spans a sentence boundary
  if (span.includes('\n')) return false;
  return true;
}

const RULES = ['paired', 'heading', 'spaced-comma', 'spaced-colon', 'unspaced'];

/* ------------------------------------------------------------------ masking */

/**
 * Per-character protection mask, plus which lines rule 2 may rewrite.
 */
function analyse(src) {
  const n = src.length;
  const mask = new Array(n).fill(false);

  const lineStarts = [0];
  for (let i = 0; i < n; i += 1) if (src[i] === '\n') lineStarts.push(i + 1);

  const lineOf = new Array(n).fill(0);
  for (let l = 0; l < lineStarts.length; l += 1) {
    const start = lineStarts[l];
    const end = l + 1 < lineStarts.length ? lineStarts[l + 1] - 1 : n;
    for (let i = start; i < end; i += 1) lineOf[i] = l;
  }

  const lines = src.split('\n');
  const reasons = new Map(); // offset -> reason, for the report

  const protectRange = (from, to, reason) => {
    for (let i = Math.max(0, from); i < Math.min(n, to); i += 1) {
      if (!mask[i]) {
        mask[i] = true;
        if (src[i] === EM) reasons.set(i, reason);
      }
    }
  };

  // -- frontmatter ---------------------------------------------------------
  if (src.startsWith('---\n')) {
    const close = src.indexOf('\n---', 4);
    if (close !== -1) protectRange(0, close + 4, 'frontmatter');
  }

  // -- JSX template-literal props: prop={`…`} ------------------------------
  // Run first: these span lines, so the per-line inline-code pass below would
  // mis-pair their backticks.
  for (let i = 0; i < n - 2; i += 1) {
    if (src[i] === '=' && src[i + 1] === '{' && src[i + 2] === '`') {
      let j = i + 3;
      while (j < n) {
        if (src[j] === '\\') {
          j += 2;
          continue;
        }
        if (src[j] === '`') break;
        j += 1;
      }
      protectRange(i, Math.min(j + 1, n), 'code-prop');
      i = j;
    }
  }

  // -- fenced code blocks --------------------------------------------------
  let fenceChar = null;
  for (let l = 0; l < lines.length; l += 1) {
    const line = lines[l];
    const start = lineStarts[l];
    const fence = /^ {0,3}(`{3,}|~{3,})/.exec(line);

    if (fence) {
      if (fenceChar === null) fenceChar = fence[1][0];
      else if (fence[1][0] === fenceChar) fenceChar = null;
      protectRange(start, start + line.length, 'code-fence');
      continue;
    }
    if (fenceChar !== null) protectRange(start, start + line.length, 'code-fence');
  }

  // -- inline code spans (within a line, outside anything already masked) --
  for (let l = 0; l < lines.length; l += 1) {
    const line = lines[l];
    const start = lineStarts[l];
    if (mask[start]) continue;

    let i = 0;
    while (i < line.length) {
      if (line[i] !== '`') {
        i += 1;
        continue;
      }
      const ticks = /^`+/.exec(line.slice(i))[0];
      const close = line.indexOf(ticks, i + ticks.length);
      if (close === -1) break;
      protectRange(start + i, start + close + ticks.length, 'inline-code');
      i = close + ticks.length;
    }
  }

  // -- table lines, heading lines, attribution -----------------------------
  const rule2Lines = new Set();

  for (let l = 0; l < lines.length; l += 1) {
    const line = lines[l];
    const start = lineStarts[l];

    // Rule 2 applies to the first line of the file, or a "Module … · … —" line.
    const isRule2Line =
      !STRICT_HEADINGS &&
      line.includes(EM) &&
      (l === 0 || /Module\s[^\n]*·[^\n]*—/.test(line));
    if (isRule2Line) rule2Lines.add(l);

    if (line.includes('|')) {
      protectRange(start, start + line.length, 'table');
      continue;
    }

    if (/^ {0,3}#/.test(line) && !isRule2Line) {
      protectRange(start, start + line.length, 'heading');
      continue;
    }

    // Attribution: the line's content begins with "— " (after any "> " quote
    // markers). Protect just that dash.
    const lead = /^(\s*(?:>\s*)*)—\s/.exec(line);
    if (lead) protectRange(start + lead[1].length, start + lead[1].length + 1, 'attribution');
  }

  return { mask, lineOf, lines, lineStarts, rule2Lines, reasons };
}

/* -------------------------------------------------------------- rewriting */

function dedash(src) {
  const { mask, lineOf, lines, rule2Lines, reasons } = analyse(src);
  const n = src.length;

  const counts = { found: 0, replaced: 0, protectedCount: 0, unhandled: 0 };
  const byRule = Object.fromEntries(RULES.map((r) => [r, 0]));
  const byReason = {};
  const changes = [];
  const unhandled = [];
  const declinedPairs = [];

  let out = '';
  let i = 0;

  /** Trim one trailing space from `out` — the space before a dash we replaced. */
  const dropTrailingSpace = () => {
    if (out.endsWith(' ')) out = out.slice(0, -1);
  };

  const excerpt = (idx) => {
    const line = lines[lineOf[idx]] ?? '';
    return line.trim().slice(0, 120);
  };

  while (i < n) {
    const ch = src[i];

    if (ch !== EM) {
      out += ch;
      i += 1;
      continue;
    }

    counts.found += 1;

    if (mask[i]) {
      const reason = reasons.get(i) ?? 'protected';
      byReason[reason] = (byReason[reason] ?? 0) + 1;
      counts.protectedCount += 1;
      out += ch;
      i += 1;
      continue;
    }

    const line = lineOf[i];
    const spaceBefore = i > 0 && src[i - 1] === ' ';
    const spaceAfter = src[i + 1] === ' ';

    /* -- rule 1: paired aside ------------------------------------------- */
    if (spaceBefore && spaceAfter) {
      let j = i + 2;
      let closing = -1;
      while (j < n && src[j] !== '\n') {
        if (src[j] === EM) {
          // Same-line partner, unprotected, spaced on both sides.
          if (!mask[j] && src[j - 1] === ' ' && src[j + 1] === ' ') closing = j;
          break;
        }
        j += 1;
      }

      if (closing !== -1 && !NAIVE_PAIRS && !isAside(src.slice(i + 2, closing - 1))) {
        // Two independent dashes on one line, not a pair. Fall through to
        // rule 3, which handles each on its own.
        declinedPairs.push({ line, text: excerpt(i) });
        closing = -1;
      }

      if (closing !== -1) {
        const aside = src.slice(i + 2, closing - 1);
        dropTrailingSpace();
        out += `, ${aside},`;
        changes.push({ rule: 'paired', line, before: excerpt(i), aside });
        byRule.paired += 1;
        counts.replaced += 2; // opening and closing dash both consumed
        counts.found += 1; //   the closing dash, counted here not on arrival
        i = closing + 1;
        continue;
      }
    }

    /* -- rule 2: heading-style separator -------------------------------- */
    if (rule2Lines.has(line)) {
      dropTrailingSpace();
      out += ':';
      changes.push({ rule: 'heading', line, before: excerpt(i) });
      byRule.heading += 1;
      counts.replaced += 1;
      i += 1;
      continue;
    }

    /* -- rule 3: single spaced em dash ---------------------------------- */
    if (spaceBefore && spaceAfter) {
      let k = i + 1;
      while (k < n && src[k] !== '\n' && (src[k] === ' ' || WRAPPERS.has(src[k]))) k += 1;
      const next = k < n ? src[k] : '';

      if (/[a-z]/.test(next)) {
        dropTrailingSpace();
        out += ',';
        changes.push({ rule: 'spaced-comma', line, before: excerpt(i) });
        byRule['spaced-comma'] += 1;
        counts.replaced += 1;
        i += 1;
        continue;
      }
      if (/[A-Z0-9]/.test(next)) {
        dropTrailingSpace();
        out += ':';
        changes.push({ rule: 'spaced-colon', line, before: excerpt(i) });
        byRule['spaced-colon'] += 1;
        counts.replaced += 1;
        i += 1;
        continue;
      }

      unhandled.push({ line, reason: `next char ${JSON.stringify(next)}`, text: excerpt(i) });
      counts.unhandled += 1;
      out += ch;
      i += 1;
      continue;
    }

    /* -- rule 4: unspaced between word characters ----------------------- */
    if (!spaceBefore && !spaceAfter && /\w/.test(src[i - 1] ?? '') && /\w/.test(src[i + 1] ?? '')) {
      out += ', ';
      changes.push({ rule: 'unspaced', line, before: excerpt(i) });
      byRule.unspaced += 1;
      counts.replaced += 1;
      i += 1;
      continue;
    }

    /* -- anything else: leave it, report it ----------------------------- */
    unhandled.push({
      line,
      reason: spaceBefore || spaceAfter ? 'half-spaced' : 'adjacent to punctuation',
      text: excerpt(i),
    });
    counts.unhandled += 1;
    out += ch;
    i += 1;
  }

  return { text: out, counts, byRule, byReason, changes, unhandled, declinedPairs };
}

/* ----------------------------------------------------------------- driver */

if (!fs.existsSync(MODULES_DIR)) {
  console.error(`No such directory: ${MODULES_DIR}`);
  process.exit(1);
}

const total = { files: 0, touched: 0, found: 0, replaced: 0, protectedCount: 0, unhandled: 0 };
const totalByRule = Object.fromEntries(RULES.map((r) => [r, 0]));
const totalByReason = {};
const reviewQueue = [];
const allUnhandled = [];
const allDeclinedPairs = [];

console.log(WRITE ? 'dedash — APPLYING changes\n' : 'dedash — DRY RUN (pass --write to apply)\n');

for (const moduleId of fs.readdirSync(MODULES_DIR).sort()) {
  const pagesDir = path.join(MODULES_DIR, moduleId, 'pages');
  if (!fs.existsSync(pagesDir)) continue;

  const files = fs.readdirSync(pagesDir).filter((f) => f.endsWith('.mdx')).sort();
  if (files.length === 0) continue;

  const rows = [];
  const moduleTotals = { found: 0, replaced: 0, protectedCount: 0, unhandled: 0 };

  for (const file of files) {
    const full = path.join(pagesDir, file);
    const src = fs.readFileSync(full, 'utf8');
    const result = dedash(src);

    total.files += 1;
    for (const key of ['found', 'replaced', 'protectedCount', 'unhandled']) {
      total[key] += result.counts[key];
      moduleTotals[key] += result.counts[key];
    }
    for (const r of RULES) totalByRule[r] += result.byRule[r];
    for (const [k, v] of Object.entries(result.byReason)) {
      totalByReason[k] = (totalByReason[k] ?? 0) + v;
    }

    // A colon followed by a lowercase word is the rule-2 output most likely to
    // read oddly. Surfaced for human review, never auto-corrected.
    for (const c of result.changes) {
      if (c.rule === 'heading') reviewQueue.push({ file: `${moduleId}/${file}`, ...c });
    }
    for (const u of result.unhandled) allUnhandled.push({ file: `${moduleId}/${file}`, ...u });
    for (const d of result.declinedPairs) {
      allDeclinedPairs.push({ file: `${moduleId}/${file}`, ...d });
    }

    if (result.counts.found > 0) {
      rows.push(
        `    ${file.padEnd(24)} found ${String(result.counts.found).padStart(3)}` +
          `  →  replaced ${String(result.counts.replaced).padStart(3)}` +
          `  protected ${String(result.counts.protectedCount).padStart(3)}` +
          `  unhandled ${String(result.counts.unhandled).padStart(2)}`,
      );
    }

    if (result.text !== src) {
      total.touched += 1;
      if (WRITE) fs.writeFileSync(full, result.text, 'utf8');
    }

    if (VERBOSE) {
      for (const c of result.changes) {
        console.log(`      [${c.rule}] ${moduleId}/${file}:${c.line + 1}  ${c.before}`);
      }
    }
  }

  if (moduleTotals.found > 0) {
    console.log(`  ${moduleId}`);
    rows.forEach((r) => console.log(r));
    console.log(
      `    ${'module total'.padEnd(24)} found ${String(moduleTotals.found).padStart(3)}` +
        `  →  replaced ${String(moduleTotals.replaced).padStart(3)}` +
        `  protected ${String(moduleTotals.protectedCount).padStart(3)}` +
        `  unhandled ${String(moduleTotals.unhandled).padStart(2)}\n`,
    );
  }
}

console.log('─'.repeat(78));
console.log(
  `GRAND TOTAL  files ${total.files}  changed ${total.touched}  ` +
    `found ${total.found}  replaced ${total.replaced}  ` +
    `protected ${total.protectedCount}  unhandled ${total.unhandled}`,
);

console.log('\nby rule');
for (const r of RULES) console.log(`  ${r.padEnd(16)} ${totalByRule[r]}`);

console.log('\nprotected by reason');
for (const [k, v] of Object.entries(totalByReason).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k.padEnd(16)} ${v}`);
}

if (reviewQueue.length) {
  console.log(`\nrule 2 (heading → colon) — ${reviewQueue.length} line(s), worth an eyeball:`);
  for (const c of reviewQueue) console.log(`  ${c.file}:${c.line + 1}\n    ${c.before}`);
}

if (allDeclinedPairs.length) {
  console.log(
    `\nrule 1 declined — ${allDeclinedPairs.length} line(s) had two spaced dashes that are ` +
      'not one aside (sentence boundary or over ' +
      `${MAX_ASIDE} chars). Each dash was handled by rule 3 instead:`,
  );
  for (const d of allDeclinedPairs.slice(0, 12)) {
    console.log(`  ${d.file}:${d.line + 1}\n    ${d.text}`);
  }
  if (allDeclinedPairs.length > 12) {
    console.log(`  … and ${allDeclinedPairs.length - 12} more (--verbose for all)`);
  }
}

if (allUnhandled.length) {
  console.log(`\nunhandled — left exactly as written (${allUnhandled.length}):`);
  for (const u of allUnhandled) {
    console.log(`  ${u.file}:${u.line + 1}  (${u.reason})\n    ${u.text}`);
  }
}

// Sanity: en dashes must be untouched by construction, but say so out loud.
const enCount = fs
  .readdirSync(MODULES_DIR)
  .flatMap((m) => {
    const d = path.join(MODULES_DIR, m, 'pages');
    return fs.existsSync(d)
      ? fs.readdirSync(d).filter((f) => f.endsWith('.mdx')).map((f) => path.join(d, f))
      : [];
  })
  .reduce((sum, f) => sum + (fs.readFileSync(f, 'utf8').split(EN).length - 1), 0);

console.log(`\nen dashes (${EN}) present and out of scope: ${enCount}`);
console.log(WRITE ? '\nFiles written.' : '\nNothing written. Re-run with --write to apply.');
