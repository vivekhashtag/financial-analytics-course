# Build Brief — Phase 2 Vertical Slice

**For:** Claude Code
**Goal:** a deployed Next.js course app that renders **Module 2 completely**, plus Modules 0 and 1, from the content files in this package. Everything the app needs already exists — do not invent content.

---

## Stack (decided, don't re-litigate)

- **Next.js** (App Router) + TypeScript
- **Tailwind CSS**, configured from `schema/tokens.json` — light mode, colourful, student-friendly
- **MDX** via `next-mdx-remote` or `@next/mdx` for page bodies
- **Deploy:** Vercel
- **No** in-browser Python runtime. Notebooks are download / Open-in-Colab only.
- **Streamlit apps are never embedded** — they're downloadable `.py` files with run instructions (none in Modules 0–2; the pattern arrives in Module 4).

## What's in this package

```
schema/
  CONTENT_SCHEMA.md      ← read this first. The full contract.
  module.schema.json     ← JSON Schema; validate every module.json in CI
  tokens.json            ← design tokens: colours, type scale, spacing, radii
content/modules/
  00-orientation/        module.json · quiz.json · pages/*.mdx (5)
  01-data-foundations/   module.json · quiz.json · exercises.json · pages/*.mdx (6)
  02-python-foundations/ module.json · quiz.json · exercises.json · pages/*.mdx (6)
notebooks/
  00_setup_check.ipynb
  02a_types_structures.ipynb
  02b_control_flow_functions.ipynb
  02c_position_tracker.ipynb
  solutions/02_solutions.ipynb
data/
  *.csv (5 datasets) · datasets.json · DATASET_REGISTRY.md
sql/
  01_schema.sql · 02_seed_core.sql   ← for Module 3.5 later, not this phase
```

All three `module.json` files **validate** against `module.schema.json`. All five notebooks **execute cleanly** end to end — verified. Don't "fix" notebook code.

---

## Required routes

| Route | Renders |
|---|---|
| `/` | Landing: course promise, the metro map, "Start Module 0" |
| `/modules` | All modules as cards, grouped and coloured by Part |
| `/modules/[moduleId]` | Module overview: outcomes, page list, notebooks, badge, est. time |
| `/modules/[moduleId]/[pageSlug]` | An MDX page with prev/next navigation |
| `/modules/[moduleId]/quiz` | Quiz from `quiz.json` |
| `/modules/[moduleId]/exercises` | Exercises from `exercises.json` |
| `/data` | Dataset registry from `datasets.json`, with download links |
| `/data/[datasetId]` | One dataset: grain, units, columns, **quirks table**, preview, download |

Static files: serve `data/*.csv` at `/data/*.csv` (notebooks fetch these by URL) and notebooks at `/notebooks/*.ipynb`.

---

## Components to build (this phase)

**Infrastructure**
- `ModuleShell` — sidebar (page list + progress), Part-coloured header, prev/next footer
- `CourseMetroMap` — SVG journey, Parts colour-coded from tokens, current position marked, clickable
- `Progress` provider — `localStorage`-backed: pages read, notebooks downloaded, quiz scores, badges earned. **No backend in v1.**

**Used by Module 2 (the priority — these prove the app works)**
- `NotebookCard` — title, package list, **Download** + **Open in Colab**, solution locked until `attempted` is set for that notebook
- `CodePeek` — read-only syntax-highlighted block, copy button, optional `annotations` array rendering callout pins
- `ExerciseList` — renders `exercises.json`: brief, starter code (copyable), progressive hints (reveal one at a time), solution gated behind "I've attempted this", points tally
- `Quiz` — handles `single`, `multi`, `truefalse`, `match`, `numeric`; instant per-question feedback with `explanation`; score vs `passingScore`
- `AISidebarInline` — green/red lists from the module's `aiSidebar` field
- `Callout` — `info` / `warn` / `danger` variants
- `DecisionTree` — small branching list (used once, keep it simple)

**Used by Modules 0 and 1**
- `StatCounter` — count-up on scroll
- `Checklist`, `IconRow`, `Download`
- `AICharterCards` — green/red flip cards
- `DatasetTable` / `DatasetPreview` — from `datasets.json`, with quirk annotations
- `SortingGame` — drag-and-drop into 3 buckets (`m1-e01`)
- `FlipCards` — six quality pillars (`m1-e...` none; content is inline in MDX props)
- `BiasDetective` — scenario cards, answer buttons, streak counter (`m1-e02`)
- `TrustReportForm` — guided form, then diff against `modelAnswer` per field (`m1-e03`)
- `CaseStudyScroll` — scroll-driven narrative for Knight Capital

**Stub acceptably for now** (referenced in Module 1 MDX, low priority — render a labelled placeholder card rather than blocking):
`SourceTable`, `PriceDiscrepancy`, `DistributionCompare`, `MissingCalendar`, `CrisisChart`

---

## Colab integration

The Open-in-Colab URL pattern, once the repo is public:

```
https://colab.research.google.com/github/<org>/<repo>/blob/main/notebooks/<file>.ipynb
```

Notebooks load data by **URL, not local path**, so they behave identically in Colab and locally. When the production domain is known, set `NEXT_PUBLIC_DATA_BASE_URL` and update the notebooks' first cell to point at it.

---

## Acceptance criteria

A learner can, without touching a terminal:

1. Land on `/`, see the metro map, click into Module 0
2. Read all 5 Module 0 pages, download + open `00_setup_check.ipynb` in Colab, run it, see a chart
3. Take the Module 0 quiz, score it, earn the **Environment Ready** badge
4. Work through Module 1's six pages, play the sorting game and bias detective, submit a Trust Report and see the model answer, earn **Data Skeptic**
5. Work through Module 2's six pages, download all three notebooks, complete exercises with hints, unlock solutions only after marking attempted, pass the quiz, earn **Speaks Python**
6. Browse `/data`, read the quirks for `messy_transactions`, download the CSV
7. Reload the browser and find all progress intact

Plus: `module.schema.json` validation runs in CI and fails the build on a malformed `module.json`.

---

## Deliberate non-goals for this phase

Auth · database · certificates · in-browser Python · the 3D frontier and other lab widgets · Modules 3+ content · mobile-perfect polish (responsive is enough).

---

## Notes on judgement

- If a component's data shape in the MDX doesn't match what you'd naturally build, **the MDX is the spec** — match it, or flag the mismatch rather than silently changing content.
- Gating is **soft** everywhere: suggest prerequisites, never hard-block. Students abandon walls.
- Read `CONTENT_SCHEMA.md` before writing any component. It documents fields this brief only summarises.
