# Financial Analytics Course — Complete Content Package

India-first, theory + hands-on financial analytics course. Beginner-safe (no prior finance or coding assumed), Colab-first, NO machine learning (signposted for the sequel course).

## What's in this repo
- `BUILD_BRIEF.md` — **START HERE (Claude Code):** the full build specification for the Next.js course site
- `schema/` — CONTENT_SCHEMA.md, module.schema.json (all 16 module.json files validate ✓), tokens.json (design tokens)
- `content/modules/` — 16 modules (0 → 13): module.json + full learner text (MDX) + quiz.json + exercises.json
- `content/appendices/` — career map (Appendix B); Appendix A is a notebook
- `notebooks/` — 27 execution-tested notebooks + `solutions/` (10 solution notebooks)
- `streamlit/` — m4_price_dashboard.py and capstone_app.py (both smoke-tested)
- `data/` — 5 synthetic datasets + DATASET_REGISTRY.md + datasets.json + generator (seed 42, byte-reproducible)
- `sql/` — 01_schema.sql + 02_seed_core.sql for Neon/Supabase PostgreSQL (Module 3.5)

## Build order (per BUILD_BRIEF.md)
1. Shell + Module 2 vertical slice → 2. remaining modules render from content/ → 3. widgets → 4. deploy (Vercel).
Owner tasks: public GitHub repo (Colab links need it), Neon/Supabase for Module 3.5, Vercel deploy.

---

# The Next.js app

Phase 2 of `BUILD_BRIEF.md`. The app lives at the repo root so the content it
renders (`content/`, `data/`, `notebooks/`) stays exactly where Colab links
expect it: `github.com/<org>/<repo>/blob/main/notebooks/<file>.ipynb`.

## Run it

```bash
npm install
npm run dev          # validates content, mirrors static assets, starts on :3000
npm run build        # same gates, then a production build
npm run check        # validate + typecheck + lint
```

`predev` / `prebuild` run two scripts first:

- **`npm run validate`** — the CI gate the brief asks for. Runs
  `schema/module.schema.json` over all 16 `module.json` files, then checks the
  references JSON Schema can't: every page, notebook, solution, quiz, exercise
  and Streamlit file a module points at must exist; slugs must be unique and
  must not collide with the `quiz` / `exercises` routes; quiz answers must index
  real options. A schema failure exits non-zero and fails the build.
- **`npm run sync-static`** — mirrors `data/*.csv`, `notebooks/**/*.ipynb` and
  `streamlit/*.py` into `public/`, so they serve at `/data/*.csv`,
  `/notebooks/*.ipynb` and `/streamlit/*.py`. `public/data` and
  `public/notebooks` are generated and git-ignored.

## Deploy (Vercel)

Set these environment variables — until the first is present, Open-in-Colab
buttons explain themselves instead of linking somewhere broken:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_COLAB_REPO` | `org/repo` of the **public** GitHub repo. Colab reads the notebook from there. |
| `NEXT_PUBLIC_COLAB_BRANCH` | Defaults to `main`. |
| `NEXT_PUBLIC_SITE_URL` | Production origin, no trailing slash. Used for canonical URLs, the `pd.read_csv(BASE + …)` snippet on dataset pages, and as the Colab fallback. |

See `.env.example`.

## How content reaches the page

```
content/modules/<id>/module.json   → lib/content.ts  → routes + nav + gating
content/modules/<id>/pages/*.mdx   → lib/mdx-source.ts → components/mdx/MdxContent.tsx
content/modules/<id>/quiz.json     → <Quiz moduleId>
content/modules/<id>/exercises.json→ <ExerciseList moduleId> (+ SortingGame / BiasDetective / TrustReportForm)
data/datasets.json                 → /data, /data/[datasetId], <DatasetTable>, <DatasetPreview>
schema/tokens.json                 → tailwind.config.ts (the only source of colour, type, spacing)
```

`lib/mdx-source.ts` does two things to each MDX body before compilation, and
both are worth knowing about:

1. **Escapes stray `<`.** Pages contain prose like `P(NPV<0)` — valid Markdown,
   invalid MDX. A JSX-aware scanner escapes only those, never touching fenced
   blocks, inline code, JSX tags or JSX expressions.
2. **Lifts `code={`…`}` props out of the source.** MDX's expression parser
   strips two spaces from every continuation line of a multi-line template
   literal, which silently turned this course's four-space Python into
   two-space Python. Code props are extracted verbatim and handed to
   `<CodePeek />` by index instead.

`lib/highlight.ts` is a small hand-rolled highlighter rather than a grammar
library, because the content uses `//` as an output-annotation marker inside
Python (`closes[0]     // 3450.75`) and every real Python grammar colours that
as floor division.

## Progress

`components/progress/ProgressProvider.tsx` — `localStorage` only, no backend,
no auth. Tracks pages read, notebooks downloaded, notebooks and exercises
attempted, exercises complete, quiz scores, per-widget state and badges.
Gating is soft everywhere except the attempt-first solution gate, which is the
one wall the course means to keep. `/progress` shows everything and can reset
a module or the lot.

## Where things stand

**`docs/STATUS.md`** — current deployment state, an inventory of what is built,
the known gaps, the operational gotchas, and the exact next actions. Start there
after a break, then read `docs/UI-SPEC.md` for the UI decisions.

## UI specification

`docs/UI-SPEC.md` is the working spec for the UI layer — what each piece does,
why it works that way, and what was deliberately left undone. Point a new
session at that file rather than re-deriving the decisions.

## Known content gaps

Flagged rather than papered over — the app renders a labelled placeholder in
each case:

| Gap | Effect |
|---|---|
| `01-data-foundations` → `caseStudy.file: pages/case-knight-capital.mdx` missing | `<CaseStudyScroll />` builds its beats from `module.json` and links to Lesson 1.1 in the full module text. |
| `01-data-foundations` → `m1-e03.modelReport: pages/model-trust-report.mdx` missing | The Trust Report still diffs against the per-field `modelAnswer` values, which are present. |
| `/posters/ai-charter.pdf`, `/posters/four-biases.pdf` referenced by `<Download />` | Renders an inert card naming the missing file, not a 404 link. |
| `SourceTable`, `PriceDiscrepancy`, `DistributionCompare`, `MissingCalendar`, `CrisisChart` | Deferred by the brief. Labelled placeholders; the prose around each already explains the point. |
| `datasets.json` `usedIn` uses pre-final module ids (`04-descriptive`, `09-lab-timeseries`, `10-lab-simulation`, `11-lab-hft`, `08a-four-streams`, `08b-investment-banking`) | Resolved by number prefix, and the dataset page says how many ids it could not match. |
| Modules 4+ set `quiz.passingScore: 70` where Modules 0–3.5 use an absolute count | Read as a percentage when it exceeds the question count. |
| `notebooks/09c_seasonal_forecasting.ipynb` and `notebooks/appendix_a_excel_bridge.ipynb` are referenced by no `module.json` | Downloadable by URL but unreachable from the UI. |

## Not built in this phase

Auth, database, certificates, in-browser Python, Module 4+ chart widgets
(`Frontier3D`, `MonteCarloPaths`, `OrderBookViewer`, `ForecastSlider`,
`BiasCheckBlock`), `StreamlitCard` (module overviews already render the
download + run command), and the Module 3.5 hosted database.

## Content passes

Bulk, rule-driven edits to `content/` live in `scripts/` so the rule set is
repeatable and reviewable. They default to a **dry run** and print a report;
pass `--write` to apply.

### `scripts/fix-notebook-base.mjs`

Makes every notebook's data path work in Colab **and** locally. Each notebook
opened with `BASE = "data/"`, which is right locally and raises
`FileNotFoundError` in Colab, where there is no `data/` folder. The script
replaces that one line with:

```python
import os
BASE = "data/" if os.path.exists("data") else "https://raw.githubusercontent.com/vivekhashtag/financial-analytics-course/main/data/"
```

```bash
node scripts/fix-notebook-base.mjs            # report only
node scripts/fix-notebook-base.mjs --write    # apply
node scripts/fix-notebook-base.mjs --verbose  # list every notebook, not just changes
```

It edits the raw `.ipynb` text rather than round-tripping the JSON, so cell ids,
metadata and stored outputs are byte-preserved; the JSON is parsed before and
after to prove the file is still valid and that no cell other than the target
changed. Idempotent — a second run reports `ALREADY-PATCHED`. It skips a
duplicate `import os` where the cell already has one (including
`import os, pandas as pd`), preserves indentation (the SQL notebooks assign
`BASE` inside an `else:` block), and reports any notebook with no `BASE` line
rather than guessing. Run `npm run sync-static` afterwards so `public/notebooks/`
matches.

### `scripts/dedash.mjs`

Replaces em dashes with commas or colons in prose across
`content/modules/*/pages/*.mdx`. No per-instance judgment — the rules decide,
and anything they don't cover is left alone and reported as unhandled.

```bash
node scripts/dedash.mjs                          # report only
node scripts/dedash.mjs --write                  # apply
node scripts/dedash.mjs --verbose                # print every replacement
node scripts/dedash.mjs --protect-headings-strict  # leave all `#` lines alone
node scripts/dedash.mjs --naive-pairs            # literal rule 1 (see below)
```

**Protected:** fenced code blocks, inline code spans, JSX template-literal props
(`code={...}` — that's taught source), YAML frontmatter, table lines, heading
lines, a leading `— ` attribution, en dashes, and everything outside `.mdx`.

**Rules, in order:** paired aside → commas · heading separator → colon · single
spaced dash → comma before lowercase, colon before uppercase/digit · unspaced
dash between word characters → comma.

Two documented deviations from a literal reading, both flagged in the script's
header comment:

1. **Rule 1 needs a precondition.** Read literally, "paired dashes around an
   aside" matches *any* two spaced dashes on a line, including two independent
   ones in different sentences — which merges them into one wrong clause. A span
   only counts as an aside if it holds no sentence boundary and is under 120
   characters. Spans that fail fall through to rule 3, which handles each dash
   correctly. `--naive-pairs` restores the literal behaviour.
2. **Rule 2 overrides the heading protection.** Rule 2 targets "the first line
   of the file", which in this content is always an `# …` heading, so read
   strictly it could never fire. `--protect-headings-strict` inverts that.

The pass is idempotent: a second run reports 0 replacements.
