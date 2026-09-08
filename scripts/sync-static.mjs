#!/usr/bin/env node
/**
 * Mirrors the content package's downloadable assets into public/ so Next serves
 * them at the URLs the notebooks and module.json files already use:
 *
 *   data/*.csv        →  /data/*.csv        (notebooks fetch these by URL)
 *   notebooks/**.ipynb →  /notebooks/**.ipynb
 *   streamlit/*.py    →  /streamlit/*.py
 *
 * The originals stay at the repo root because Colab links point at
 * github.com/<org>/<repo>/blob/main/notebooks/… — same paths, same files.
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const PUBLIC = path.join(ROOT, 'public');

const TARGETS = [
  { from: 'data', include: /\.(csv|json|md)$/i },
  { from: 'notebooks', include: /\.ipynb$/i, recursive: true },
  { from: 'streamlit', include: /\.py$/i },
];

let copied = 0;
let skipped = 0;

for (const target of TARGETS) {
  const src = path.join(ROOT, target.from);
  if (!fs.existsSync(src)) continue;
  walk(src, path.join(PUBLIC, target.from), target);
}

function walk(srcDir, destDir, target) {
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const from = path.join(srcDir, entry.name);
    const to = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      if (target.recursive && entry.name !== '__pycache__') walk(from, to, target);
      continue;
    }
    if (!target.include.test(entry.name)) continue;

    // Skip files that are already up to date — keeps `next dev` restarts quick.
    const srcStat = fs.statSync(from);
    if (fs.existsSync(to)) {
      const destStat = fs.statSync(to);
      if (destStat.size === srcStat.size && destStat.mtimeMs >= srcStat.mtimeMs) {
        skipped += 1;
        continue;
      }
    }

    fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(from, to);
    copied += 1;
  }
}

console.log(`✔ Static assets synced to public/ — ${copied} copied, ${skipped} already current`);
