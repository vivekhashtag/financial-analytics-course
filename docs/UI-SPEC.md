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
- Right-hand sheet, `max-w-[26rem]`, full-height scroll — same component on
  mobile and desktop.
- Course structure is built server-side in `app/layout.tsx` (`menuGroups()`) and
  passed as props, so no content loader ships to the browser.

## 4. Reading typography — DONE

Single-source change in `schema/tokens.json`: a new **`font.prose`** block, added
alongside the untouched `font.scale`.

```json
"prose": { "size": "1.0625rem", "lineHeight": "1.75", "code": "0.9em", "lead": "1.1875rem" }
```

- `tailwind.config.ts` exposes it as `text-prose`, `text-prose-lead`,
  `text-prose-code`.
- `.prose-course` in `app/globals.css` uses `text-prose` (was `text-base`).
- **UI chrome is untouched** — buttons, sidebar, badges, cards and the header all
  still resolve `text-base` to `1rem` (verified in the built CSS).
- Code and tables inside prose are now **`em`-relative** (`0.9em`), so they scale
  with the prose size instead of pinning to `0.9rem`. `CodePeek`'s `<pre>` uses
  `text-[0.9em]`, which means the same component reads correctly in prose *and*
  in UI panels like `ExerciseCard`.

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
