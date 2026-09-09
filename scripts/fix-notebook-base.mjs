#!/usr/bin/env node
/**
 * Makes every notebook's data path work in Colab *and* locally.
 *
 * The problem: each notebook opens with `BASE = "data/"` and then
 * `pd.read_csv(BASE + "…")`. That is right locally, where the notebook sits
 * next to the repo's `data/` folder, and wrong in Colab, where the working
 * directory is empty — the learner's first cell raises FileNotFoundError before
 * they have written a line of their own.
 *
 * The fix, applied to the BASE line only:
 *
 *   import os
 *   BASE = "data/" if os.path.exists("data") else "<raw.githubusercontent…>/data/"
 *
 * so the notebook prefers a local checkout and falls back to reading the CSVs
 * straight from GitHub. Colab pulls notebooks from the same repo, so the two
 * always agree.
 *
 * ## Why this edits the file as text, not as JSON
 *
 * Round-tripping through `JSON.parse`/`JSON.stringify` would rewrite every byte
 * of a notebook — key order, indentation, unicode escaping, `outputs` payloads,
 * the trailing newline — turning a two-line change into a 500-line diff and
 * risking real damage to execution metadata. So the patch is a targeted
 * replacement in the raw text: the BASE line is found in its JSON-escaped form
 * and swapped in place. Everything else in the file, including cell ids,
 * metadata and stored outputs, is untouched by construction.
 *
 * The JSON is still parsed — before, to find the cells and check whether each
 * already imports `os`, and after, to prove the file is still valid and that no
 * cell other than the patched one changed. A file that fails either check is
 * left alone and reported.
 *
 * ## Idempotency
 *
 * A patched line contains escaped quotes inside its right-hand side, which the
 * match deliberately cannot cross, so a second run finds nothing to do. That is
 * asserted rather than assumed: `--write` twice reports ALREADY-PATCHED for
 * everything the first run touched.
 *
 * ## Usage
 *
 *   node scripts/fix-notebook-base.mjs            # dry run, report only
 *   node scripts/fix-notebook-base.mjs --write    # apply
 *   node scripts/fix-notebook-base.mjs --verbose  # show each replacement
 *
 * Dry run is the default, matching scripts/dedash.mjs. Any notebook added to
 * the course later gets the same treatment with one command.
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const NOTEBOOKS = path.join(ROOT, 'notebooks');

/**
 * Where the CSVs live when there is no local `data/`. The repo must be public
 * and the branch must hold `data/*.csv` — both true, and both checked by
 * `npm run validate` on the dataset side.
 */
const RAW_BASE =
  'https://raw.githubusercontent.com/vivekhashtag/financial-analytics-course/main/data/';

const args = new Set(process.argv.slice(2));
const WRITE = args.has('--write');
const VERBOSE = args.has('--verbose');

/* ------------------------------------------------------------------ matching */

// These match the *raw file text*, where a newline inside a JSON string is the
// two characters \ and n, and a quote is the two characters \ and ".
const NL = '\\n';
const Q = '\\"';

/**
 * The unpatched BASE line, as it appears in the raw .ipynb.
 *
 * Preceded by an escaped newline (source as one string) or by an opening quote
 * (source as an array of lines) — both are legal nbformat, so both are handled.
 * The tail allows a trailing comment but cannot cross a backslash, which is
 * what makes a patched line — whose right-hand side is full of escaped quotes —
 * unmatchable, and therefore what makes this script idempotent.
 */
const BASE_LINE = new RegExp(
  '(?<=\\\\n|")([ \\t]*)BASE[ \\t]*=[ \\t]*\\\\"data/\\\\"([^\\\\]*)(?=\\\\n|")',
  'g',
);

/** The same line after patching — used only to classify, never to edit. */
const PATCHED_LINE = /BASE[ \t]*=[ \t]*"data\/"[ \t]+if[ \t]+os\.path\.exists\(/;
/** An unpatched assignment, tested against decoded cell source. */
const PLAIN_LINE = /^([ \t]*)BASE[ \t]*=[ \t]*"data\/"(.*)$/;
/**
 * An import that already binds `os` in this cell.
 *
 * Not just a bare `import os`: 035_solutions opens with `import os, pandas as
 * pd`, and the SQL notebooks with a plain `import os`. Both already have it, so
 * neither should gain a second one. `import os.path` counts (it binds `os`);
 * `from os import path` deliberately does not, and `import osmium` must not
 * match, which is what the trailing boundary is for.
 */
const OS_IMPORT = /^[ \t]*import[ \t]+(?:[A-Za-z0-9_.]+[ \t]*,[ \t]*)*os(?![A-Za-z0-9_])/m;

function cellSource(cell) {
  const src = cell?.source;
  if (typeof src === 'string') return src;
  if (Array.isArray(src)) return src.join('');
  return '';
}

/* ------------------------------------------------------------------- walking */

function findNotebooks(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...findNotebooks(full));
    else if (entry.isFile() && entry.name.endsWith('.ipynb')) out.push(full);
  }
  return out.sort();
}

/* ------------------------------------------------------------------ patching */

/**
 * Inspects one notebook's cells. Returns, in document order, the code cells
 * holding a BASE assignment — which is the order the raw-text matches appear
 * in, and how the two are paired.
 */
function inspect(nb) {
  const cells = [];
  (nb.cells ?? []).forEach((cell, index) => {
    if (cell.cell_type !== 'code') return;
    const src = cellSource(cell);
    const lines = src.split('\n');

    // Order matters: a patched line still satisfies PLAIN_LINE, because the
    // conditional trails the `"data/"` the plain pattern stops at. So "plain"
    // means "matches, and is not already the patched form" — without that, a
    // second run reads every patched notebook as unpatched-but-unmatchable and
    // reports 32 spurious failures.
    const patched = lines.some((line) => PATCHED_LINE.test(line));
    const plain = lines.some((line) => PLAIN_LINE.test(line) && !PATCHED_LINE.test(line));
    if (!plain && !patched) return;

    cells.push({ index, plain, patched, hasOsImport: OS_IMPORT.test(src) });
  });
  return cells;
}

/**
 * Confirms a patched notebook differs from the original in exactly the way
 * intended: same cell count, same ids, same metadata, and no cell's source
 * changed except by the substitution of the BASE line.
 */
function verify(before, after, patchedIndexes) {
  const a = before.cells ?? [];
  const b = after.cells ?? [];

  if (a.length !== b.length) return `cell count changed (${a.length} → ${b.length})`;
  if (before.nbformat !== after.nbformat || before.nbformat_minor !== after.nbformat_minor) {
    return 'nbformat version changed';
  }
  if (JSON.stringify(before.metadata) !== JSON.stringify(after.metadata)) {
    return 'notebook metadata changed';
  }

  for (let i = 0; i < a.length; i += 1) {
    if (a[i].id !== b[i].id) return `cell ${i}: id changed`;
    if (a[i].cell_type !== b[i].cell_type) return `cell ${i}: cell_type changed`;
    if (JSON.stringify(a[i].metadata) !== JSON.stringify(b[i].metadata)) {
      return `cell ${i}: metadata changed`;
    }
    if (JSON.stringify(a[i].outputs ?? null) !== JSON.stringify(b[i].outputs ?? null)) {
      return `cell ${i}: outputs changed`;
    }
    if (a[i].execution_count !== b[i].execution_count) {
      return `cell ${i}: execution_count changed`;
    }

    const sa = cellSource(a[i]);
    const sb = cellSource(b[i]);

    if (!patchedIndexes.has(i)) {
      if (sa !== sb) return `cell ${i}: source changed but was not a target`;
      continue;
    }

    // The target cell: every line must be identical except the BASE line, which
    // becomes the conditional (plus an `import os` where the cell lacked one).
    const la = sa.split('\n');
    const lb = sb.split('\n');
    const removed = la.filter((l) => !lb.includes(l));
    const added = lb.filter((l) => !la.includes(l));

    if (removed.length !== 1 || !PLAIN_LINE.test(removed[0])) {
      return `cell ${i}: expected exactly the BASE line to be replaced`;
    }
    if (!added.some((l) => PATCHED_LINE.test(l))) {
      return `cell ${i}: patched BASE line not found afterwards`;
    }
    if (added.length > 2) {
      return `cell ${i}: added ${added.length} lines, expected at most 2`;
    }
  }

  return null;
}

function patch(file) {
  const raw = fs.readFileSync(file, 'utf8');

  let nb;
  try {
    nb = JSON.parse(raw);
  } catch (e) {
    return { status: 'INVALID-JSON', detail: e.message };
  }

  const targets = inspect(nb);

  if (!targets.length) return { status: 'NO-BASE-FOUND' };
  if (targets.every((t) => t.patched && !t.plain)) return { status: 'ALREADY-PATCHED' };

  // Pair raw-text matches with the inspected cells, in order.
  const pending = targets.filter((t) => t.plain);
  const replacements = [];
  let cursor = 0;

  const next = raw.replace(BASE_LINE, (whole, indent, tail) => {
    const target = pending[cursor];
    cursor += 1;
    if (!target) return whole; // more matches than cells: leave it alone

    const conditional =
      `BASE = ${Q}data/${Q} if os.path.exists(${Q}data${Q}) ` +
      `else ${Q}${RAW_BASE}${Q}`;

    const lines = target.hasOsImport
      ? [indent + conditional]
      : [`${indent}import os`, indent + conditional];

    replacements.push({
      cell: target.index,
      droppedComment: tail.trim() || null,
      addedImport: !target.hasOsImport,
      indent: indent.length,
    });

    return lines.join(NL + '');
  });

  if (cursor !== pending.length) {
    return {
      status: 'SKIPPED',
      detail: `found ${cursor} text match(es) for ${pending.length} BASE cell(s) — the raw form is unexpected, so nothing was changed`,
    };
  }
  if (next === raw) return { status: 'SKIPPED', detail: 'nothing replaced' };

  let after;
  try {
    after = JSON.parse(next);
  } catch (e) {
    return { status: 'SKIPPED', detail: `patch produced invalid JSON — ${e.message}` };
  }

  const problem = verify(nb, after, new Set(replacements.map((r) => r.cell)));
  if (problem) return { status: 'SKIPPED', detail: problem };

  if (WRITE) fs.writeFileSync(file, next);

  return { status: 'PATCHED', replacements };
}

/* -------------------------------------------------------------------- report */

if (!fs.existsSync(NOTEBOOKS)) {
  console.error('No notebooks/ directory here — run this from the repo root.');
  process.exit(1);
}

const files = findNotebooks(NOTEBOOKS);
const counts = {};
const noBase = [];
const skipped = [];
const notes = [];

for (const file of files) {
  const rel = path.relative(ROOT, file).split(path.sep).join('/');
  const result = patch(file);

  counts[result.status] = (counts[result.status] ?? 0) + 1;

  if (result.status === 'NO-BASE-FOUND') noBase.push(rel);
  if (result.status === 'SKIPPED' || result.status === 'INVALID-JSON') {
    skipped.push(`${rel} — ${result.detail}`);
  }

  for (const r of result.replacements ?? []) {
    if (r.droppedComment) {
      notes.push(`${rel}: trailing comment removed with the old line — ${r.droppedComment}`);
    }
    if (!r.addedImport) {
      notes.push(`${rel}: cell ${r.cell} already imports os, no duplicate added`);
    }
    if (r.indent) {
      notes.push(`${rel}: BASE is indented ${r.indent} spaces, indentation preserved`);
    }
  }

  const label = result.status.padEnd(15);
  if (result.status === 'PATCHED' || VERBOSE || result.status === 'SKIPPED') {
    console.log(`  ${label} ${rel}`);
  }
}

console.log('');
for (const [status, n] of Object.entries(counts).sort()) {
  console.log(`  ${String(n).padStart(3)}  ${status}`);
}
console.log(`  ${String(files.length).padStart(3)}  total notebooks`);

if (noBase.length) {
  console.log(`\nNo BASE line — reported, not guessed at (${noBase.length}):`);
  for (const f of noBase) console.log(`  ${f}`);
}

if (notes.length) {
  console.log('\nNotes:');
  for (const n of [...new Set(notes)]) console.log(`  ${n}`);
}

if (skipped.length) {
  console.log('\nSkipped — left exactly as they were:');
  for (const s of skipped) console.log(`  ${s}`);
}

if (!WRITE) {
  console.log('\nDry run. Nothing was written — pass --write to apply.');
}

process.exit(skipped.length ? 1 : 0);
