# UI specification

Working spec for the course site's UI layer. Point a future session at this file.

**Standing constraints for everything below:**

- Work within the existing design system (`schema/tokens.json`) — no new colours
  or fonts, keep the Part-accent scheme.
- **UI work never modifies `content/`.** The MDX, `module.json`, `quiz.json` and
  `exercises.json` files are the contract; the app bends around them. After any
  UI change, confirm `content/` is byte-identical.
  - **Exception:** deliberate, owner-requested content passes run through a
    repeatable script in `scripts/`, never by hand and never as a side effect of
    a UI change. `scripts/dedash.mjs` is the first of these — see the README.
    Such a script must default to a dry run and print a full report.
- Gating stays soft: prerequisites are suggested, never enforced. The one
  exception is the attempt-first solution gate.

**Verification loop for any change here:**

```bash
npm run check     # validate content schema + typecheck + lint
npm run build     # must generate all routes
# then confirm content/ unchanged:
find content -type f | sort | xargs sha256sum   # compare against a pre-change baseline
```

---

## 1. ML signpost — DONE

**Correction applied.** The linked course is *Introduction to Machine Learning* —
an intro, not the full sequel. A deeper Machine Learning & Deep Learning course
is planned separately, so the copy must not promise it.

- **(a)** All "sequel" language removed from app-authored copy. The card reads
  **"Next step: Introduction to Machine Learning →"** with one supporting line:
  *"This course stops at the ML border by design. The introductory ML course
  picks up exactly there."*
- **(b)** Renders in **exactly one place**: the full card after Module 6's
  content page (the Lesson 6.7 signpost the prose promises). Removed from the
  home-page honesty block, Modules 0/5/13 content pages, and all four module
  overviews.
- **(c)** Rendering is **hard-scoped** to `ML_SIGNPOST_PAGE` in `lib/links.ts`,
  not content-detected, so it cannot reappear elsewhere.
  `mentionsMlBorder()` in `lib/content.ts` is kept for internal use only:
  `npm run validate` warns if Module 6's content page ever stops mentioning the
  border, which would mean the card is pinned to the wrong page.
- The **"More courses by Vivek"** grid on the home page keeps the ML entry and is
  the only other home-page presence. Its title and one-liner were corrected to
  match — leaving *"The sequel to this course"* there would have contradicted (a).

Files: `lib/links.ts`, `components/widgets/MlNextStepCard.tsx` (renamed from
`MlSequelCard.tsx`), `app/modules/[moduleId]/[pageSlug]/page.tsx`,
`app/modules/[moduleId]/page.tsx`, `app/page.tsx`, `scripts/validate-content.mjs`.

**Known residue, not fixable from the app:** Module 0's
`pages/01-why-this-course.mdx` and `quiz.json` still say "the sequel" in their
own prose. Changing that means editing `content/`. Flagged for a content edit.

## 2. Clickable Part segments — DONE

- Each of the four Part blocks on the home page is a `Link` to
  `/modules#part-a` … `#part-capstone`, with cursor, `hover:-translate-y-0.5
  hover:shadow-lift`, a trailing accent arrow, and the default focus ring.
- Part group `<section>`s on `/modules` carry `id={partAnchor(part)}` plus
  `scroll-mt-20` so the sticky header doesn't cover the heading.
- `partAnchor()` in `lib/parts.ts` is the single source of the anchor format.
- **Metro map:** the *legend chips* are now Part links too (cheap, and they read
  as a key). The **coloured line segments inside the SVG are deliberately not
  clickable** — their hit areas would sit underneath the 26px station targets
  and steal clicks meant for a module. Stations remain individually clickable.

Files: `app/page.tsx`, `app/modules/page.tsx`, `lib/parts.ts`,
`components/widgets/CourseMetroMap.tsx`, `components/widgets/CourseMetroMapView.tsx`.

## 3. Global module navigation (hamburger) — DONE

`components/shell/ModuleMenu.tsx`, mounted in `SiteHeader` on every route
(verified on all 98 prerendered pages).

- Site links first, as a 2-column grid: Home, All modules, Datasets, My progress.
- Then all 16 modules grouped by Part (A/B/C/D/Capstone), each group headed with
  its accent colour and a colour bar.
- Each row shows number, title, and progress state from `ProgressProvider`:
  **Not started** / **In progress · N%** (with a mini bar) / **Complete** (a tick
  in the filled Part colour). State derives from `moduleCompletion()`.
- Clicking navigates to the module's **first page** via `firstPageHref()`, not
  the overview.
- Behaves as a modal dialog: `role="dialog"`, `aria-modal`, Esc closes, Tab and
  Shift+Tab cycle within the panel, focus moves in on open and returns to the
  trigger on close, background scroll locked, backdrop click closes, closes on
  navigation.
- Right-hand drawer: `w-full` on mobile, `23.5rem` from `sm` up, full height,
  with its own scroll container. **Rendered through a portal onto
  `document.body`** — the header sets `backdrop-filter`, which makes it the
  containing block for `position: fixed` descendants, so an in-place drawer was
  laid out inside the 56px header box (clipped panel, header-only backdrop).
  `z-[100]`, above the header's `z-30`.
- Course structure is built server-side in `app/layout.tsx` (`menuGroups()`) and
  passed as props, so no content loader ships to the browser.

## 4. Reading typography — DONE

Single-source change in `schema/tokens.json`: a new **`font.prose`** block, added
alongside the untouched `font.scale`.

```json
"prose": { "size": "1.0625rem", "lineHeight": "1.75", "code": "0.875em", "lead": "1.1875rem" }
```

- `tailwind.config.ts` exposes it as `text-prose`, `text-prose-lead`,
  `text-prose-code`.
- `.prose-course` in `app/globals.css` uses `text-prose` (was `text-base`).
- **UI chrome is untouched** — buttons, sidebar, badges, cards and the header all
  still resolve `text-base` to `1rem` (verified in the built CSS).
- Code and tables inside prose are **`em`-relative**, so they scale with the
  prose size instead of pinning to a rem value. `CodePeek`'s `<pre>` uses
  `text-[0.9em]`, so the same component reads correctly in prose *and* in UI
  panels like `ExerciseCard`. Note § 8 later retuned `font.prose.code` to
  0.875em for JetBrains Mono.

## 5. "Continue where you left off" — DONE

`components/shell/ContinueCard.tsx`, on the home page directly under the hero.

- Renders **nothing** when `ProgressProvider` has no history, so a first-time
  visitor keeps a single call to action. (It is therefore absent from the
  prerendered HTML by design and appears after hydration.)
- Picks the module **furthest along the course order**, not the most recently
  touched — dipping back into Module 1 must not lose your place in Module 6.
- Shows the next **unread** page of that module, the module name, a percentage
  bar in the Part accent, and a Resume button. If every page is read it says so
  and links to the module overview instead.
- The old hero `ResumeButton` was deleted rather than left alongside it.

## 6. Breadcrumbs — DONE

`components/shell/Breadcrumbs.tsx`, rendered by `ModuleShell`, so it appears on
all 88 module routes (overview, every page, quiz, exercises).

- **Part → Module → Page.** The Part crumb carries the accent and links to
  `/modules#part-x`; the Module crumb links to the overview; the current
  location is plain text with `aria-current="page"`.
- On the module overview the trailing crumb is omitted (Part → Module, current).
- Quiz and Exercises routes get "Quiz" / "Exercises" as the leaf.
- `text-xs`, muted, inside `<nav aria-label="Breadcrumb"><ol>`.

## 7. Per-module "what you'll need" strip — DONE

`components/shell/ModuleNeeds.tsx`, on each module's **first page** only
(16 pages, verified). Generated entirely from `module.json`, so it cannot drift.

Shows: estimated time (`formatMinutes`), notebook count (or "None — reading
only"), exercise count, Streamlit app count when present, database when present,
and the badge earned.

- **Database detection is a heuristic**, because `module.json` has no field for
  it: `usesDatabase()` matches `/sql/i` against the module id and its notebook
  ids. That hits Module 3.5 only. Deliberately narrow — a broader pattern would
  false-positive on every module that reads a CSV. If a second database module
  ever lands, add an explicit field to the schema instead.
- When Streamlit or a database is involved, a footnote explains that Streamlit
  runs locally and never embedded, and that the SQL notebooks fall back to a
  local database built from the course CSVs when no connection string is set.

---

## Deliberately not done

- **Metro-map line segments are not clickable** (see item 2). Legend chips and
  stations are.
- **No visual/browser verification.** Every item above was verified structurally
  — generated HTML, RSC payload, built CSS, route sweep — not by looking at a
  rendered page. Browser tooling was unavailable in the sessions that built this.
- **Module 0's "the sequel" prose** left in place (see item 1). Requires a
  `content/` edit.
- Items from earlier phases still outstanding: auth, database, certificates,
  in-browser Python, the Module 4+ chart widgets (`Frontier3D`,
  `MonteCarloPaths`, `OrderBookViewer`, `ForecastSlider`, `BiasCheckBlock`),
  `StreamlitCard`, and the five deferred Module 1 widgets (`SourceTable`,
  `PriceDiscrepancy`, `DistributionCompare`, `MissingCalendar`, `CrisisChart`).
  See the README's "Known content gaps" and "Not built in this phase".

---

## 8. Typography — three loaded faces — DONE

Loaded with `next/font/google` in `app/layout.tsx`, self-hosted into
`.next/static/media` (15 woff2 files, **zero** requests to fonts.gstatic.com),
`display: swap`, `subsets: ['latin']`.

| Face | Weights | Where |
|---|---|---|
| **Sora** | 600, 700 | `h1`–`h4`, and by inheritance the module and Part headers |
| **Inter** | 400, 500, 600 | prose, all UI, buttons, nav, and every figure |
| **JetBrains Mono** | 400, 500 | `CodePeek`, inline code, fenced blocks, notebook ids, quirk codes |

Single source is `schema/tokens.json` → `font.heading` / `font.body` /
`font.mono`, each resolving through the CSS variable next/font sets. Tailwind
exposes them as `font-heading` / `font-body` / `font-mono`; `font-sans` is kept
as an alias of body.

**No CLS by construction.** next/font emits a metric-adjusted fallback per
family — e.g. `@font-face{font-family:Sora Fallback;src:local("Arial");
ascent-override:85.29%;descent-override:25.50%;size-adjust:113.73%}`. Text
paints immediately in a local face scaled to the real one's metrics, so the swap
cannot reflow. (There are no `rel=preload` font hints; the faces are discovered
when the blocking stylesheet parses. One round trip later than a preload, but
irrelevant to CLS given the adjusted fallback.)

**Inter has no 700.** Tailwind's `font-bold` would render faux-bold, so all 15
non-heading `font-bold` sites moved to `font-semibold`. Heading sites keep
`font-bold` because Sora 700 is loaded. If you ever need Inter 700, add it to
the `weight` array — don't reintroduce `font-bold` on body text without it.

**Code/prose balance.** `font.prose.code` went 0.9em → **0.875em**: JetBrains
Mono has a taller x-height than the generic monospace this was first tuned
against, so it read a shade large next to Inter. Prose size is unchanged at
1.0625rem/1.75. Code sizes are `em`-relative, so `CodePeek` reads correctly both
inside prose and inside UI panels.

**Figures.** `tabular-nums` on every stat strip, KPI tile, percentage, module
number chip and metro-map station label, plus all `th`/`td`. Dataset shape chips
moved from mono to Inter+tabular — they're figures, not code.

## 9. Motion and visual system — DONE

Principles: animate meaning, never decorate. All colour from `tokens.json`.
CSS + inline SVG + IntersectionObserver only — no animation or icon library.
Transform/opacity only; nothing over 1.5s.

**Primitives**

- `components/motion/Reveal.tsx` — `Reveal`, `RevealGroup`, `useInView`,
  `prefersReducedMotion`. Fade-and-rise, 380ms, 14px travel, reveals **once**
  (observer disconnects on first intersection).
- `components/motion/Meter.tsx` — a bar that grows from zero on first view via
  `transform: scaleX()`. Deliberately **not** `width`: scaleX is compositor-only
  and cannot trigger layout.
- `components/visual/PartGeometry.tsx` — `PartGeometry` (one abstract mark per
  Part) and `HeroGeometry`. Data-geometry, not clip-art; all `aria-hidden`.

**Reduced motion.** One media block in `globals.css` zeroes every animation,
transition, delay, the hover lift and the press state. `Reveal` and `Meter`
additionally short-circuit their observers so content mounts in its final state
rather than waiting on an effect.

**Budget.** Exactly three looping animations exist, and no page runs more than
two: `halo` (metro map, home only), `breathe` (OrderBookMini), `flow-dash`
(DataPipelineFlow). The two diagram loops only run where content embeds them.

**MDX-embeddable diagrams**, registered in `components/mdx/MdxContent.tsx` so
future content can invoke them by name:

| Widget | What it shows |
|---|---|
| `<FourQuestionLadder />` | The four questions assembling rung by rung. Placed on the home page under the Parts section. |
| `<DataPipelineFlow />` | raw → clean → insight, with a pulse travelling the pipe. |
| `<OrderBookMini />` | A bid/ask ladder whose depth bars breathe. For Module 11. |

## 10. The five Module 1 widgets — DONE

Previously "coming in a later phase" placeholders; now built. All five are
registered in the widget registry (**no MDX was edited**), use tokens.json
colours only, are inline SVG + React state with no chart library, are keyboard
reachable, respect `prefers-reduced-motion`, and leave the static prose beneath
them untouched — the widget augments, never replaces.

Data comes from **`lib/series.ts`**, which derives everything from
`data/nifty50_prices.csv` at build time. Nothing is invented: the two problem
gap dates are parsed out of the dataset registry's own quirk text, and the
weekend session (2023-11-12, Diwali Muhurat) is *detected* in the file rather
than asserted.

| Widget | Interaction | Numbers |
|---|---|---|
| `SourceTable` | Sort by name/cost/type, filter to free-only or primary-only, click a row to expand | The eight rows of the prose table verbatim; `kind` classifies what the prose already says |
| `PriceDiscrepancy` | 4-step walkthrough, then a checkbox that applies the adjustment | ₹102.50 / ₹102.50 / ₹101.87 from the prose; the ₹0.63 dividend is their difference |
| `DistributionCompare` | Slider moves the tail threshold ±1σ → ±5σ | 1,276 real returns; σ 1.087%/day, 17.3% annualised; at 4σ, 1 observed vs 0.08 expected |
| `MissingCalendar` | Year tabs, hover/Tab a cell for its category, toggle naive forward-fill | 28 absent weekdays, of which 2 are the documented problem gaps |
| `CrisisChart` | Stepper walks peak → fall → low → recovery; toggle trims the window | −29.8%, peak 2023-01-25 (18,315) → trough 2024-07-10 (12,856), recovered 2025-05-09 |

**Two honest limits.** `SourceTable` does *not* show per-source adjustment
conventions or licence terms — the content package doesn't state them, so the
footer says so instead of fabricating them. `CrisisChart` plots this series'
own worst drawdown, not 2008 or March 2020: the data starts in 2021, and the
widget says as much on its face.

Only `StreamlitCard` remains a placeholder.

**Deliberately not done here:** metro-map line *segments* still aren't
clickable (see § 2). No scroll-linked or parallax effects — they fight the
reveal system and cost frames. No page-transition animation.

## 11. Module charts (M4–M12) — DONE

One signature interactive chart per module, on that module's content page,
placed from `app/modules/[moduleId]/[pageSlug]/page.tsx` via
`components/charts/ModuleChart.tsx`. **No MDX was edited.** `ModuleChart` is
also registered in the widget registry, so future content can invoke it inline.

Single added dependency: **recharts**. It is fully code-split — zero
occurrences in the 103 kB shared baseline — and every chart is a
`next/dynamic` import with `ssr: false`, so a module page the learner never
scrolls to pays nothing for it.

| Module | Chart | File | Data |
|---|---|---|---|
| 4 | Chart intent explorer | `M4ChartIntent.tsx` | `m4-nifty-daily.json` ← `data/nifty50_prices.csv` |
| 5 | Variance waterfall | `M5VarianceWaterfall.tsx` | `m5-financials.json` ← `data/company_financials.csv` |
| 6 | Forecast harness | `M6ForecastHarness.tsx` | `m6-nifty-monthly.json` ← `nifty50_prices.csv`, month-end |
| 7 | Break-even belief | `M7BreakEven.tsx` | none — the Lesson 7.4 payoffs are the content |
| 9 | Decomposition explorer | `M9Decomposition.tsx` | `m9-moneymart-monthly.json` ← `notebooks/09a_decomposition.ipynb` |
| 10 | Simulation fan | `M10SimulationFan.tsx` | `m10-walk-params.json` ← drift/vol from `nifty50_prices.csv` |
| 11 | Order book | `M11OrderBook.tsx` | `m11-orderbook.json` ← `notebooks/11a_order_book.ipynb` |
| 12 | Frontier + correlation dial | `M12Frontier.tsx` | `m12-two-asset.json` ← `data/nse_stock_universe.csv` |
| 8 | *skipped (map module)* | — | `DataPipelineFlow` placed on Module 3's overview instead |

Data is pre-baked by `scripts/prebake-charts.mjs` (runs in `prebuild`) into
`public/chart-data/` — 51 kB total, largest 40 kB, each fetched lazily by the
chart that needs it. `public/chart-data/` is generated and git-ignored. Every
extract records its own `source` string, which the chart prints on screen.

**Shared kit:** `chartKit.tsx` (theme from tokens.json, `useChartData`,
`ChartFrame`, `Segmented`, `Slider`, `Readout`, `usePrefersReducedMotion`) and
`ChartSkeleton.tsx` — the skeleton lives in its own module so `ModuleChart`'s
dynamic-import fallback doesn't drag the whole kit into the eager bundle.

**Conventions every chart follows:** hover tooltips; a one-line "what to
notice" caption; controls are real `<button>`/`<input>` so Tab and Enter work;
`isAnimationActive={!reduced}` from `usePrefersReducedMotion`;
`ResponsiveContainer` inside a fixed-height frame (so data arriving costs no
layout shift); source cited in the footer.

**Two derivation notes.** M10 runs its paths in `requestAnimationFrame` chunks
(5,000 × 252 = 1.26M draws would jank a synchronous loop) with a visible,
editable seed. M12 deliberately excludes `TATAMOTORS.NS`: its unadjusted 1:5
split is Module 11's planted landmine and would show as 87% "volatility".

**One honest caveat.** M9's series is *constructed* in notebook 9A, not stored
in `/data`. Its trend (`520 + 4.2i`), all twelve seasonal indices and σ = 0.03
are lifted verbatim; only the noise *draw* differs, because numpy's PCG64 at
seed 9 cannot be reproduced in JavaScript. The extract records this in a
`noiseNote` field.
