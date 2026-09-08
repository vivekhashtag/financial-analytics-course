# Project status — where to pick up

Last updated at commit `5a9716b`.

**Read this first, then `docs/UI-SPEC.md`** for why each UI decision was made and
what was deliberately left undone.

---

## 1. Start here tomorrow

Two items. **One redeploy handles both.**

### ① Set the Colab variable

```
Vercel → project → Settings → Environment Variables
  Name:  NEXT_PUBLIC_COLAB_REPO
  Value: vivekhashtag/financial-analytics-course
  Scope: Production
→ Save → Redeploy
```

Confirmed live on 2026-09-08: **0 real Colab URLs**, every notebook card showing
the inert *"Colab link not configured"* state. Downloads work regardless (3 per
notebook page). GitHub already serves the notebooks publicly (raw fetch → 200),
so the buttons start working the moment this is set.

`NEXT_PUBLIC_*` is inlined at build time — **the redeploy is required**, the
running deployment will not pick it up.

### ② Ship `5a9716b`

The live site is `60da56b`. Commit `5a9716b` (the `next-mdx-remote` v6 upgrade,
which clears a high-severity advisory) is on GitHub but **not deployed**. The
redeploy in ① brings it along.

### Optional, in the same visit

- `NEXT_PUBLIC_SITE_URL` = `https://<your production domain>` — used for
  canonical URLs and the `pd.read_csv(BASE + …)` snippet on dataset pages. Safe
  to leave unset. Since `60da56b` a malformed value can no longer fail the build.
- **Find the short production domain.** The current link is the git-branch alias
  (`…-git-main-…`), which is long and changes meaning if you rename the branch.
  Vercel → Domains has the stable one.

---

## 2. Current state

**Live:** https://financial-analytics-course-git-main-vivek-dhandapanis-projects.vercel.app
**Repo:** https://github.com/vivekhashtag/financial-analytics-course (public)
**Deployed commit:** `60da56b` · **Latest commit:** `5a9716b`

Verified live, checking content-types rather than just status codes:

| | |
|---|---|
| 11 routes sampled | all `200 text/html`, 22 kB–344 kB |
| `nifty50_prices.csv` | `text/csv`, 72,008 B |
| `nse_stock_universe.csv` | `text/csv`, 923,408 B |
| notebooks + solutions | correct type and size |
| `chart-data/*.json` | `application/json` |
| Streamlit `.py` | serves |
| widgets + charts | `DecisionTree`, `SourceTable`, `MissingCalendar`, `DistributionCompare`, M6 chart slot all rendering |

---

## 3. What was built

16 modules · 41 MDX pages · 44 notebooks · 8 routes · 78 components ·
9 lib modules · 4 scripts. Deps: `next`, `react`, `next-mdx-remote`,
`remark-gfm`, `recharts`, `ajv`, `clsx`.

**Shell and routing** — `/`, `/modules`, `/modules/[moduleId]`,
`/modules/[moduleId]/[pageSlug]`, `.../quiz`, `.../exercises`, `/data`,
`/data/[datasetId]`, `/progress`. `ModuleShell` gives every module route a
Part-coloured header, sidebar, breadcrumbs and prev/next.

**Content pipeline** — `lib/content.ts` reads `content/modules/*`;
`lib/mdx-source.ts` prepares each MDX body. Two non-obvious fixes live there and
must not be removed: stray-`<` escaping (for prose like `P(NPV<0)`), and lifting
`code={…}` props out before MDX sees them (MDX's parser silently ate two spaces
of Python indentation).

**Progress** — `ProgressProvider`, `localStorage` only, no backend. Pages read,
notebooks taken, exercises, quiz scores, badges, per-widget state.

**Widgets** — 45 files. All content-referenced widgets are real except
`StreamlitCard`. Includes the five that were placeholders until this session:
`SourceTable`, `PriceDiscrepancy`, `DistributionCompare`, `MissingCalendar`,
`CrisisChart` — all driven from real `/data` files via `lib/series.ts`.

**Charts** — 8 signature charts, M4–M12 (M8 skipped as the map module; its
pipeline diagram sits on M3's overview). recharts, lazily loaded, **fully
code-split — zero occurrences in the 103 kB shared baseline**. Data pre-baked by
`scripts/prebake-charts.mjs` into git-ignored `public/chart-data/` (51 kB).

**Typography** — Sora / Inter / JetBrains Mono via `next/font`, self-hosted,
metric-adjusted fallbacks → CLS zero by construction. Inter loads 400/500/600
only, so **non-heading text must use `font-semibold`, not `font-bold`**.

**Motion** — scroll-reveal, animated meters, metro-map draw-on and station halo,
quiz/badge micro-interactions. Transform/opacity only. All off under
`prefers-reduced-motion`.

**Content pass** — `scripts/dedash.mjs` replaced 1,091 em dashes across 41 MDX
files by mechanical rule. Idempotent; defaults to a dry run.

**CI** — `.github/workflows/ci.yml` runs validate → typecheck → lint → build.
`npm run validate` fails the build on a malformed `module.json`.

---

## 4. Known gaps

Each renders a labelled placeholder rather than breaking:

| Gap | Effect |
|---|---|
| `01-data-foundations` → `caseStudy.file: pages/case-knight-capital.mdx` **missing** | `CaseStudyScroll` builds beats from `module.json`, links to Lesson 1.1 |
| `m1-e03.modelReport: pages/model-trust-report.mdx` **missing** | Trust Report still diffs against per-field `modelAnswer` |
| `/posters/ai-charter.pdf`, `/posters/four-biases.pdf` | `Download` renders inert, names the missing file |
| `StreamlitCard` | last remaining placeholder |
| Module 0 prose still says **"the sequel"** | needs a `content/` edit — the app can't fix it |
| `datasets.json` `usedIn` uses pre-final module ids | resolved by number prefix |
| Modules 4+ `quiz.passingScore: 70` is a percentage | read as % when it exceeds the question count |
| `09c_seasonal_forecasting.ipynb`, `appendix_a_excel_bridge.ipynb` | referenced by no `module.json` |

**Not built:** auth, database, certificates, in-browser Python, the Module 4+
lab widgets (`Frontier3D`, `MonteCarloPaths`, `OrderBookViewer`,
`ForecastSlider`, `BiasCheckBlock`), Module 3.5's hosted database.

---

## 5. Operational gotchas

**If a deploy fails while the build log is green, do a no-cache redeploy before
changing any code.** Several deployments failed at the deploy stage with a
perfectly green build. The fix was a no-cache redeploy of the *same commit*. Two
code theories were chased and both were wrong — `vercel.json` header patterns
(they parse fine) and `next-mdx-remote@5` (the same commit deployed fine on it).

**`.next` was being cleared mid-session** on this Windows machine, producing an
all-zero bundle report and an empty-directory audit. Add the project folder to
antivirus exclusions. If bundle sizes read `0 B`, `rm -rf .next && npm run build`.

**`next-mdx-remote` v6 blocks JS in MDX by default.** `blockJS: false` is set in
`components/mdx/MdxContent.tsx` because this content depends on expression props
(`tree={[…]}`, `stats={[…]}`, `codeIndex={n}`). `blockDangerousJS` stays `true`.
If MDX ever becomes user-supplied, this must revert and those props move into
`module.json`.

**`public/data`, `public/notebooks`, `public/streamlit` are git-ignored** — they
are mirrors regenerated by `scripts/sync-static.mjs` in `prebuild`. Colab reads
the root `notebooks/`, so Open-in-Colab is unaffected.

**Verify with content-types, not status codes.** A failed Vercel deployment
serves `200 text/html` for *every* path, including `.csv` — status codes alone
will report a broken site as healthy.

---

## 6. Commands

```bash
npm run dev        # validate + sync-static + prebake-charts, then dev server
npm run build      # same gates, then production build
npm run check      # validate + typecheck + lint
npm run validate   # content schema gate on its own

node scripts/dedash.mjs          # dry run (report only)
node scripts/dedash.mjs --write  # apply
```

After any change, confirm `content/` is untouched:

```bash
find content -type f | sort | xargs sha256sum   # compare to a pre-change baseline
```
