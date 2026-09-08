# Module 1 · Data Before Models: The Financial Data Landscape

**Prerequisite:** Module 0 complete (environment ready)
**Learner time:** ~3 hours
**Deliverables in webapp:** 6 content pages · 3 guided no-code exercises · 1 quiz (10 Qs) · "Four Biases" poster · dataset registry entry walkthrough
**Note:** This module is deliberately code-free. Learners diagnose data *by looking*, before they can program. Python starts in Module 2 — by then they'll know what the code is *for*.

---

## Page 1 — The Hook: Anatomy of a Disaster

**Story (webapp: scroll-driven narrative with illustrations):**

> In 2012, Knight Capital — one of the largest US trading firms — deployed new software. A stale configuration flag on one server caused old code to fire live orders. In **45 minutes**, the firm lost **$440 million** and nearly collapsed. The models were fine. The *data feeding the machine* — one flag, one server — was wrong.
>
> This is the pattern across finance: **most analytics failures are data failures wearing a model's clothes.** So before you write a single line of Python, this module teaches you to interrogate data like a professional: What is it? Where did it come from? Can it be trusted? What is it hiding?

**Module promise:** by the end you'll be able to look at any dataset and produce a *trust report* — before any code.

---

## Page 2 — The Three Buckets of Financial Data

**Interactive element:** drag-and-drop sorting game — 15 data examples, learner sorts them into three buckets, instant feedback.

### Bucket 1 · Quantitative (structured, numeric, model-ready)
| Type | Examples | Beginner translation |
|---|---|---|
| Market data | prices, returns, volumes, order books | "What things cost, minute by minute" |
| Financial statements | P&L, balance sheet, cash flow, ratios | "A company's report card" |
| Transactions & ledgers | payments, trades, positions | "The receipts — every single one" |
| Macro series | GDP, inflation (CPI), interest rates, FX | "The economy's vital signs" |
| Reference data | security identifiers, ratings, corporate actions | "The phonebook that says which stock is which" |

### Bucket 2 · Qualitative (unstructured, textual, judgment-laden)
- Filings narrative (the *story* a company tells around its numbers — MD&A, risk factors)
- Earnings calls (executives answering analyst questions — the *tone* matters)
- Analyst research, credit memos, news, regulatory notices, contracts, KYC documents

**Key teaching beat:** qualitative data is no longer un-analyzable. Modern NLP turns narrative into numbers — tone scores, topic shifts, "how much did the risk-factors section grow this year?" We won't build NLP here, but you must know this bucket exists because it's where much of the *why* lives.

### Bucket 3 · Alternative (the new frontier)
Satellite images of parking lots (forecast retail sales before earnings) · credit-card spending panels · web traffic & app downloads · job postings · shipping records.

**Stat card:** the alternative-data market grew from ~$1.6B (2020) to ~$10B (2024), with projections toward $100B+ — one of the fastest-growing corners of finance. *(Projection — treat with the skepticism this module teaches.)*

**Micro-exercise 1 (webapp, no code):** A hedge fund wants to predict a burger chain's quarterly sales. Learner is shown 8 possible data sources and tags each as quant/qual/alt AND rates likely usefulness. Model answer discusses *combination* beats any single source.

---

## Page 3 — Where Data Comes From (And What It Costs)

**The honest map for a student:**

| Source | What you get | Cost | Course usage |
|---|---|---|---|
| **yfinance** (Python) | NSE/BSE prices via `.NS`/`.BO` tickers (e.g. `RELIANCE.NS`), indices (`^NSEI`, `^BSESN`), fundamentals | Free | Our workhorse from Module 3 |
| **NSE / BSE websites** | Official prices, indices, corporate announcements, bhavcopy files | Free | Reference + Module 8 examples |
| **RBI Database on Indian Economy (DBIE)** | Repo rate, money supply, credit growth, FX reserves | Free | Modules 6, 9 |
| **MOSPI / data.gov.in** | CPI, IIP, GDP series | Free | Module 6 |
| Company filings (BSE/NSE announcements, annual reports) | Statements, narrative | Free | Module 8 examples |
| **FRED** (St. Louis Fed) | Global macro for comparisons | Free | Secondary |
| **Bloomberg / LSEG / FactSet / CapIQ** | Everything, curated, real-time | $$$ (≈ $25k+/yr/seat) | Concept only — know the names; every finance employer uses one |
| Data vendors (alt data) | Card panels, satellite, sentiment | $$$$ | Awareness only |

**Teaching beat — the golden source concept:** professionals never ask "what's the price?" — they ask "what's the price *according to which source, as of when*?" The same stock can show different closing prices across free sources (different exchanges, adjustment conventions, time zones). This motivates the reconciliation habit.

**Micro-exercise 2 (webapp):** learner is shown the "same" closing price for one stock from three sources — 102.50, 102.50, 101.87 — plus each source's fine print. Task: find why the third differs (it's unadjusted for a dividend). Introduces *adjusted vs unadjusted prices* gently — this exact trap returns with code in Module 3.

---

## Page 4 — The Six Pillars of Data Quality

**Webapp element:** six pillar cards, each flips to reveal a finance mini-scandal caused by its absence.

1. **Accuracy** — does the value match reality? *Reconcile to a golden source.* (Flip: fat-finger trades — an order entered as ¥610,000 for 1 share instead of 1 share at ¥610,000 cost Mizuho ~$225M in 2005.)
2. **Completeness** — missing rows and missing fields are different diseases. A missing *day* of prices vs a missing *field* in every row need different cures.
3. **Consistency** — same entity, same definition, everywhere. Is "revenue" pre- or post-returns? Is the customer "HDFC Bank" or "HDFC BANK LTD"? (Entity mess = analytics mess.)
4. **Timeliness** — available *when the decision is made*? A perfect risk report delivered after the market closes is trivia.
5. **Lineage** — can you trace a number back through every transformation to its source? ("Where did this 4.7% come from?" is the most common question in any finance meeting.)
6. **Auditability** — reproducible, versioned, defensible to a regulator. If you can't re-produce last month's number, you don't have analytics — you have anecdotes.

**Beginner bridge:** relate to student life — Accuracy = your marksheet has the right marks; Completeness = no subject missing; Consistency = your name spelled the same on every certificate; Timeliness = results before the admission deadline; Lineage = the exam paper + your answer sheet still exist; Auditability = re-totaling gives the same result.

---

## Page 5 — The Four Biases That Ruin Financial Models ⭐ (The Heart of the Module)

**Framing:** these four appear in *every* lab later. This page earns its own poster.

### 1. Look-Ahead Bias — "using tomorrow's newspaper"
Using information that was **not available at decision time**.
*Story:* a backtest "buys stocks with strong annual earnings" using earnings for the year — but earnings are announced *months after* year-end. The strategy is time-traveling. Real version: countless published "profitable" strategies die on this alone.
*The question to always ask:* **"On the morning of the decision, was this number actually knowable?"**

### 2. Survivorship Bias — "interviewing only the winners"
Failed, delisted, merged entities silently dropped from history.
*Story:* "Average mutual fund returned 9%!" — computed only on funds that still exist. The ones that lost money were shut down and vanished from the database. WWII bomber armor analogy (Abraham Wald): armor the places where returning planes have *no* bullet holes — the planes hit there never came back.
*The question:* **"Who is missing from this dataset, and did they leave randomly?"**

### 3. Point-in-Time Bias — "history, quietly rewritten"
Using restated/revised figures as if they were the original print.
*Story:* GDP and company financials get revised. A model trained on today's *revised* GDP series "predicts" beautifully — because it saw cleaner numbers than anyone had at the time. The fix has a name: *point-in-time databases*, storing what was believed **as of each date**.
*The question:* **"Is this the number as originally reported, or as later corrected?"**

### 4. Regime Change — "fitting through an earthquake"
Fitting one model across a structural break as though the world never changed.
*Story:* a deposit-behavior model trained on 2010–2019 (near-zero rates) deployed into 2022–2023 (fastest hikes in 40 years) — customers behaved "irrationally" per the model; actually the *regime* changed. Also: pre/post-2008, pre/post-COVID, pre/post-demonetization 2016 — the flagship example for our Indian datasets.
*The question:* **"Did the world change somewhere inside my data's timespan?"**

**The Bias Check ritual (recurs every lab):** a 4-line checklist stamped at the top of every lab notebook from Module 9 onward. Learners fill it before running any analysis.

**Webapp element:** "Four Biases" poster (PDF download) + an interactive detective game — 6 short scenario cards, learner names the bias, streak counter. *(Sample scenario: "A study of the best 50 companies of the decade finds they all had charismatic CEOs." → survivorship.)*

---

## Page 6 — EDA Preview: Looking Before Computing

A visual-only preview of what Exploratory Data Analysis (Module 3) will formalize. Shown as four "before code, use eyes" habits with example images:

1. **Look at the shape** — histogram of daily stock returns vs a normal bell curve overlay: *fat tails are the norm in finance*. A "once in 10,000 years" event under the bell curve happens every few years in real markets. (Foreshadows Module 10.)
2. **Look for holes** — a calendar heatmap with missing days. Weekends/holidays are *expected* gaps; a random missing Tuesday is a *problem* gap.
3. **Look for the impossible** — negative volumes, prices of 0, a transaction dated 1970 (the classic Unix-epoch default — teach that "1-1-1970" almost always means "missing timestamp," not time travel).
4. **A crisis is not an outlier** — 2008/2020 crash points on a chart: a statistician's instinct says trim them; a finance professional knows *those are the observations that matter most*.

---

## Guided Exercise Set: "The Trust Report" (Capstone of the Module — no code)

Learner receives three datasets *as rendered tables/images in the webapp* and produces a structured Trust Report for each via a guided form (dropdowns + short text):

**Dataset A — `nifty50_prices.csv` (looks clean)**
Hidden issues: two missing trading days (one is Diwali Muhurat-trading confusion — a *half* session, not a gap); one obvious price spike (fat-finger or index rebalance?); volume column blank for the first year.

**Dataset B — `messy_transactions.csv` (visibly dirty)**
Hidden issues: duplicated rows; three date formats (`12/01/2024`, `2024-01-12`, `Jan 12, 24` — is it Jan 12 or Dec 1?); one amount in a different currency; missing categories; a ₹0 transaction.

**Dataset C — "Star Fund Performance Study" (a one-page report, not raw data)**
Hidden issues: survivorship (only live funds), look-ahead (uses full-year data for mid-year decisions), a projection presented as history.

**Trust Report template (per dataset):** What is this data? · Where might it come from? · Which pillars look violated? · Which of the four biases could apply? · Would you trust a decision based on it — and what one check would you run first?

Auto-feedback compares learner answers to the annotated model report. Completing all three = badge **"Data Skeptic"**.

---

## AI Sidebar (Module 1)
**Green pattern:** *"I'm looking at a dataset with columns: [list]. Generate 10 skeptical questions a data-quality auditor would ask about it."* — AI is excellent at expanding your checklist.
**Red pattern:** asking AI *"Is this dataset reliable?"* by pasting a sample — it cannot know the lineage, the source, or what's missing. Reliability is established by *provenance*, not by inspection of 20 rows. (This distinction is quizzed.)

---

## Quiz (10 questions — samples)
1. Match five examples to quant/qual/alt buckets.
2. A backtest uses annual earnings on Jan 1 of the same year. Which bias? (Look-ahead)
3. Why did Wald recommend armoring where returning planes had NO holes? (Survivorship logic)
4. "1-1-1970" timestamps usually mean what? (Unix-epoch default → missing value)
5. Adjusted vs unadjusted price: which changed after the dividend and why?
6. Which pillar is violated when you can't explain where a KPI came from? (Lineage)
7. True/False: extreme crisis observations should be removed as outliers. (False — often the point)
8. A model trained across 2019–2023 without accounting for COVID risks which bias? (Regime change)
9. Why can't AI certify a dataset as "reliable" from a pasted sample? (Provenance ≠ inspection)
10. Name two free sources this course uses for Indian prices and macro data. (yfinance with .NS tickers; RBI DBIE / MOSPI)

---

## Stream Connector
Where does Module 1 bite hardest in the real world? · **Corporate finance:** inconsistent revenue definitions wreck variance analysis · **Asset management:** survivorship inflates every fund comparison · **Banking:** non-point-in-time data invalidates credit models (regulators check!) · **Markets:** look-ahead is the #1 killer of "profitable" backtests. *(One hover-card per stream in webapp.)*

## Webapp Build Notes
- Scroll narrative for Knight Capital story (parallax, 4 scenes)
- Drag-and-drop bucket-sorting game (15 items)
- Six flip-cards (quality pillars with scandal reveals)
- Bias detective game (6 scenarios, streak counter, shareable score)
- Trust Report guided form with model-answer diff view
- Two downloadable posters: Six Pillars, Four Biases
- Badge: "Data Skeptic"
