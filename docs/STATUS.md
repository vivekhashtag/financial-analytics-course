# Project status — where to pick up

Last updated at commit `75470e5`, plus the cleanup pass that follows it.

**Read this first, then `docs/UI-SPEC.md`** for why each UI decision was made and
what was deliberately left undone.

---

## 1. Start here

Nothing is blocking. The two items that opened this file for the last month —
the Colab environment variable and the unshipped `5a9716b` — are both done and
verified live. What remains is a short list of content gaps (§4) and two checks
that need a human at a browser (§5).

### Verified live on 2026-09-09

Checked against the deployed site, by content-type rather than status code:

| | |
|---|---|
| `NEXT_PUBLIC_COLAB_REPO` | **set** — a module page serves 12 real `colab.research.google.com` URLs and **0** "Colab link not configured" states |
| Deployed commit | `430284b` at the time of checking; `75470e5` and the cleanup pass followed |
| `/`, `/appendices`, `/appendices/the-work-itself`, `/appendices/excel-bridge`, `/progress` | all `200` |
| all 8 files in `public/templates/` | `200`, correct MIME (`application/pdf`, `…wordprocessingml.document`) |
| `notebooks/03a_dataframe_fundamentals.ipynb` | serves with the patched `os.path.exists` BASE line |
| Appendix D | figures, guided cards and the samples button all present in the live HTML |

### Still worth doing, when convenient

- **Find the short production domain.** The link below is still the git-branch
  alias (`…-git-main-…`), which is long and changes meaning if the branch is
  renamed. Vercel → Domains has the stable one.
- **`NEXT_PUBLIC_SITE_URL`** is still unset. Safe to leave: it only affects
  canonical URLs and the `pd.read_csv(BASE + …)` snippet on dataset pages, and
  since `60da56b` a malformed value cannot fail the build.

---

## 2. Current state

**Live:** https://financial-analytics-course-git-main-vivek-dhandapanis-projects.vercel.app
**Repo:** https://github.com/vivekhashtag/financial-analytics-course (public)
**Deployed commit:** whatever `main` last built · **Latest commit:** the cleanup pass below

---

## 3. What was built

16 modules · 4 appendices · 41 module MDX pages · 43 notebooks · 11 routes ·
96 components · 14 lib modules · 5 scripts · 8 work templates. Deps: `next`,
`react`, `next-mdx-remote`, `remark-gfm`, `recharts`, `ajv`, `clsx`. No new
dependency has been added since the first build.

**Shell and routing** — `/`, `/modules`, `/modules/[moduleId]`,
`/modules/[moduleId]/[pageSlug]`, `.../quiz`, `.../exercises`, `/data`,
`/data/[datasetId]`, `/progress`, and since `67e3d9a` `/appendices` and
`/appendices/[appendixSlug]`.

**Content pipeline** — `lib/content.ts` reads `content/modules/*`;
`lib/mdx-source.ts` prepares each MDX body. Two non-obvious fixes live there and
must not be removed: stray-`<` escaping (for prose like `P(NPV<0)`), and lifting
`code={…}` props out before MDX sees them (MDX's parser silently ate two spaces
of Python indentation). `readPreparedMdx` is the exported entry point, so the
appendices and Appendix D's parsed fragments go through the *same* pipeline
rather than a second reader that would skip those two fixes.

**Appendices** (`67e3d9a`) — `lib/appendices.ts` is the registry; there is no
`module.json` for them, deliberately, since they have no quiz, exercises or
badge. `/appendices` lists four cards; B, C and D render from
`content/appendices/*.md`; A is a page around the `appendix_a_excel_bridge`
notebook, which is what took that notebook off the orphan list. Progress is
tracked under an `appendices` pseudo-module (`lib/progress-keys.ts`) and is
deliberately outside module completion and the metro map.

**Appendix D, the flagship** (`01b522b`, `430284b`) — `lib/appendix-d.ts` parses
the six practices out of the markdown at build time: 34 stations, 41 day-timeline
entries, 33 course-mapping chips. It **never writes** `content/`. Every block
degrades: a section whose stations cannot be recovered renders as ordinary prose,
so a content edit can cost the page its stepper but never its text. On top of
that: a sticky scroll-spy section nav, six inline-SVG figures (one per practice),
six guided exercise cards, and the work-templates box.

**Figure provenance** — `lib/practice-figures.ts` holds the figure numbers, each
citing the line of the appendix it came from. Three gaps are visible in the UI
rather than filled in: D.3's ₹24 cr of adjustments is never split per line in the
text (so the drops are equal and only the total is labelled), D.6's ladder has no
per-year amounts (so the bars carry shape and no values), and D.5's note ends
"Maximum loss ₹X per lot" (so the net credit is shown on screen as a stated
assumption). Do not "finish" these by inventing figures.

**Posters** — `public/posters/ai-charter.pdf` and `four-biases.pdf`, generated
by `scripts/make_posters.py` from the *same pages that offer them*: the charter's
do/don't lists are Module 0's `aiSidebar`, the four biases and their "Always ask"
questions are headings and blockquotes in `05-four-biases.mdx`. Nothing is
retyped, so a lesson edit plus a re-run reprints a correct poster. Needs
`python -m pip install reportlab`, and is **not** part of `prebuild` — the Vercel
build is Node-only, so the PDFs are committed. Helvetica has no rupee glyph, so
the script rewrites `₹` as `Rs` the way the docx templates already do.

**Work templates** — 8 files in `public/templates/`, 6 `.docx` plus two PDFs
(the workflows cheat-sheet and the six worked samples). **Not git-ignored** —
unlike `public/data`, `public/notebooks` and `public/streamlit`, these are source
files with no generator. The samples pack's per-page "why this works" block is
the source of the model answers the guided cards reveal, so the two cannot drift.

**Notebooks** (`6984258`) — every notebook's `BASE` now auto-detects:
`"data/"` locally, the raw GitHub URL in Colab. Before this, the first cell of
32 notebooks raised `FileNotFoundError` in Colab.

**Progress** — `ProgressProvider`, `localStorage` only, no backend.

**Widgets** — every content-referenced widget is real except `StreamlitCard`,
the last remaining placeholder. The five that were placeholders in the first
build (`SourceTable`, `PriceDiscrepancy`, `DistributionCompare`,
`MissingCalendar`, `CrisisChart`) have been real since `01b522b`'s predecessor
and are driven from `/data` files via `lib/series.ts`.

**Charts** — 8 signature charts, M4–M12, recharts, lazily loaded, fully
code-split — **zero occurrences in the shared baseline**. Appendix D's six
figures are hand-rolled inline SVG rather than recharts, which keeps that route
off the chart bundle entirely.

**Typography** — Sora / Inter / JetBrains Mono via `next/font`, self-hosted,
metric-adjusted fallbacks → CLS zero by construction. Inter loads 400/500/600
only, so **non-heading text must use `font-semibold`, not `font-bold`**.

**Motion** — scroll-reveal, animated meters, metro-map draw-on, the Appendix D
steppers, timelines and figures. Transform/opacity only. See §5 for the one
subtlety about how reduced motion is handled in two different ways.

**CI** — `.github/workflows/ci.yml` runs validate → typecheck → lint → build.
`npm run validate` fails the build on a malformed `module.json`, and since
`67e3d9a` also cross-checks the appendix registry against `content/appendices/`
in *both* directions — a referenced file that is missing is an error, and a file
on disk that nothing links to is a warning. It also warns when a
`<Download file="/…" />` in the lesson text points at a file that does not ship,
which is the check whose absence let the two posters stay missing. That second direction is the check
whose absence let Appendix A's notebook sit unreachable for weeks.

**Bundle** — shared baseline **103 kB**, unchanged across every commit in this
run.

---

## 4. Known gaps

Each renders a labelled placeholder or degrades visibly rather than breaking.
`npm run validate` reports the first as a warning on every run.

| Gap | Effect |
|---|---|
| `m1-e03.modelReport: pages/model-trust-report.mdx` **missing** | Trust Report still diffs against per-field `modelAnswer` |
| `StreamlitCard` | the last remaining placeholder widget |
| Appendix lettering disagrees with the blueprint | `financial-analytics-course-blueprint.md` calls the Excel bridge Appendix B and the career map Appendix C. On disk and in the app: **A** Excel bridge, **B** career map, **C** Ship It, **D** The Work Itself. The app is self-consistent; the blueprint is the stale one |

**Not built:** auth, database, certificates, in-browser Python, the Module 4+
lab widgets (`Frontier3D`, `MonteCarloPaths`, `OrderBookViewer`,
`ForecastSlider`, `BiasCheckBlock`), Module 3.5's hosted database.

**Resolved since the last revision of this file:** the Colab variable; shipping
`5a9716b`; the career map having no content at all (now Appendix B);
`content/appendices/` not existing; Appendix A's notebook being unreachable;
the README claiming five built widgets were placeholders; `BASE = "data/"`
breaking every notebook in Colab; the last orphan notebook; `datasets.json`'s
six stale `usedIn` ids; quiz pass marks being stored two different ways; the two
posters the prose offered but could not serve; the Knight Capital case study
existing only as metadata; and Module 0 calling the ML course "the sequel".

---

## 5. Operational gotchas

**If a deploy fails while the build log is green, do a no-cache redeploy before
changing any code.** Several deployments failed at the deploy stage with a
perfectly green build. The fix was a no-cache redeploy of the *same commit*. Two
code theories were chased and both were wrong — `vercel.json` header patterns
(they parse fine) and `next-mdx-remote@5` (the same commit deployed fine on it).

**Verify with content-types, not status codes.** A failed Vercel deployment
serves `200 text/html` for *every* path, including `.csv` and `.pdf` — status
codes alone will report a broken site as healthy.

**`.gitattributes` exists for a reason — do not delete it.** This repo is worked
on with `core.autocrlf=true`. With no attributes file, git classified
`workflows_cheatsheet.pdf` as *text* and would have injected CRLF into it on a
fresh Windows clone, producing a PDF that no longer opens. It survived only
because that file happens to contain zero CR bytes. PDFs, Office files and fonts
are now marked binary, and notebooks/CSVs pinned to `eol=lf`.

**`public/templates/` is committed; the other `public/` subfolders are not.**
`public/data`, `public/notebooks` and `public/streamlit` are mirrors regenerated
by `scripts/sync-static.mjs` in `prebuild` and are git-ignored. `templates/` has
no generator — the files are sources. Do not add it to `.gitignore`.

**Appendix D's section rail depends on its parent stretching — do not add
`items-start` back.** The rail unpinned partway down the article, and the cause
was `lg:items-start` on the two-column row: it made the rail column shrink to
the height of the nav itself, and `position: sticky` can only travel inside its
containing block. The row now uses the default `stretch` with an explicit
`lg:self-stretch` on the rail column. Below `lg` the wrapper is
`display: contents`, which takes it out of the box tree so the pill bar's
containing block becomes the full-height row instead of its own short wrapper.
Any change to that row's alignment will silently unpin the nav again — the
symptom is subtle, because the rail looks fine for the first screenful.

**The scroll-spy scores visible pixels, not `intersectionRatio`.** It used an
IntersectionObserver scored by ratio, which is a fraction of the *target's* own
height: a section taller than the viewport can never score above roughly
viewport/section, so the long sections lost to whichever short one was clipping
the fold. It is now one rAF-throttled scroll handler measuring visible pixels
across the six sections, plus an explicit rule that force-activates the last
item within 100px of the document end — otherwise D.6 can be unreachable once
the page bottoms out. If you reintroduce an observer, the ratio trap comes back.

**`quiz.passingScore` is a percentage, always.** It used to be an absolute
count in Modules 0–3.5 and a percentage in 4+, and `getQuiz` guessed between
them by treating anything larger than the question count as a percentage — which
worked only by luck of the numbers, since a 70-question quiz with a 70% pass mark
would have read as "70 of 70". All 16 modules now store a percentage,
`module.schema.json` enforces `1..100`, and the interpretation is
unconditional. Downstream code only ever sees the derived absolute `passMark`.
Converting cost no learner anything: every module's threshold is unchanged
(6/8, 7/10 ×4, 5/6 ×11).

**Reduced motion is handled two different ways, on purpose.** The global rule in
`globals.css` collapses every transition to `0.01ms !important`, which beats
inline styles for that longhand. On top of that, the steppers and timelines carry
`.d-reveal` / `.d-rail` classes that force their finished state *in the
stylesheet*, because those elements start at `opacity: 0` and would otherwise be
invisible until JS ran. The six Appendix D figures deliberately do **not** get
those classes: they animate several different transforms (`scaleY`, `rotate`,
`translate`), so a blanket `transform: none` would park D.1's arrow at the top
and D.6's coverage needle at zero. They reach their true final values from the
observer instead, which fires immediately under reduced motion.

**`next-mdx-remote` v6 blocks JS in MDX by default.** `blockJS: false` is set in
`components/mdx/MdxContent.tsx` because this content depends on expression props
(`tree={[…]}`, `stats={[…]}`, `codeIndex={n}`). `blockDangerousJS` stays `true`.
If MDX ever becomes user-supplied, this must revert and those props move into
`module.json`.

**`.next` was being cleared mid-session** on this Windows machine, producing an
all-zero bundle report. Add the project folder to antivirus exclusions. If bundle
sizes read `0 B`, `rm -rf .next && npm run build`.

**Two checks still need a human at a browser.** Neither has been verified by
anything but code inspection and a simulated round-trip:

1. **The Colab click-through.** Open in Colab from the live site, confirm the
   first cell shows the `os.path.exists` line, run it, see a DataFrame. What
   *has* been verified: GitHub serves the patched notebooks, and running the
   patched logic from a directory with no `data/` loads real DataFrames off the
   raw URL (1,277×6 for `nifty50_prices`).
2. **Appendix D's interactions.** Scrolling the figures, dragging the D.5
   slider, and ticking an "I did this" box then reloading. What *has* been
   verified: the DOM contains all six figures, the slider and its live readout,
   and six complete guided cards; and the `localStorage` contract was exercised
   with the real `STORAGE_KEY` and the real `load`/`toggle` semantics — tick two,
   reload, both present; untick one, reload, correct one remains.

---

## 6. Commands

```bash
npm run dev        # validate + sync-static + prebake-charts, then dev server
npm run build      # same gates, then production build
npm run check      # validate + typecheck + lint
npm run validate   # content schema + appendix registry gate on its own

node scripts/dedash.mjs                    # em-dash pass (dry run)
node scripts/fix-notebook-base.mjs         # notebook BASE pass (dry run)
```

Both content scripts default to a dry run and print a report; pass `--write` to
apply. `fix-notebook-base.mjs` is idempotent and reports
PATCHED / ALREADY-PATCHED / NO-BASE-FOUND with counts — run it after adding any
notebook, then `npm run sync-static`.

After any change, confirm `content/` is untouched:

```bash
git status --porcelain content/    # must be empty
```
