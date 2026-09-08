# Financial Analytics — Theory + Hands-On Course Blueprint

**Format:** Interactive web app · downloadable Jupyter notebooks · AI-assisted learning woven throughout
**Scope guard:** No machine learning (separate course). Everything here stays within statistics, simulation, optimisation, and classical analytics.
**Source material:** Builds on "The Role of Data Science in Securities Markets" (motivation/context) and "Financial Analytics — The Complete Landscape" (theoretical spine).

---

## Course Arc (the story in one line)

**Data → Code → Analysis → The Four Questions → The Finance Map → Four Deep-Dive Labs → Capstone**

First we make learners fluent in *data*, then give them *Python* as the instrument, then *pandas* as the analysis engine, then climb the *analytics ladder* (descriptive → diagnostic → predictive → prescriptive), then place it all on the *map of finance* (4 streams × 2 horizontals), and finally go deep hands-on on four flagship problems: **time series, Monte Carlo simulation, HFT/algo trading, portfolio optimisation**.

---

## Module Plan — 12 Modules + Capstone

### PART A — FOUNDATIONS

**Module 0 · Orientation: How This Course Works & How to Learn With AI**
- Why financial analytics (hook: 75% of US equity volume is algorithmic; markets run on data)
- The course map, how notebooks work, how to set up (Colab / Anaconda / VS Code — zero-install path first)
- **AI-assisted learning charter:** how to use ChatGPT/Claude/Copilot properly — prompt patterns for "explain this code", "debug this error", "generate test data", "critique my analysis"; where AI helps vs. where it hallucinates (numbers, citations, financial figures)
- Deliverable: setup-check notebook (runs one cell, confirms environment)

**Module 1 · Data Before Models: The Financial Data Landscape**
- Quantitative vs qualitative vs alternative data (market data, statements, ledgers, macro, filings text, satellite/card-spend)
- The six pillars of data quality: accuracy, completeness, consistency, timeliness, lineage, auditability
- **The four biases that ruin financial models:** look-ahead, survivorship, point-in-time, regime change (this becomes a recurring "bias check" ritual in every later lab)
- Where data comes from: yfinance, FRED, exchange data, Bloomberg/LSEG (concept only), open datasets
- Hands-on: inspect three raw datasets (prices CSV, a messy ledger, an earnings-call transcript) and diagnose their problems — *before any code*, using a guided web UI exercise
- AI sidebar: using AI to profile an unfamiliar dataset

**Module 1.5 · Finance Refresher** *(optional — most learners already know this; keep as a safety net)*
- Opens with a 10-question self-check ("Can you skip this?"). Score 8+ → skip straight to Module 2 with a badge; below 8 → the refresher unlocks
- Quick-reference content only: the three statements at a glance (annotated one-pager on a real Indian annual report), money math cheat-sheet (simple vs compound, CAGR, returns vs log returns, NPV/IRR), market mechanics in one diagram
- Web app: presented as reference cards + the interactive compound-interest slider — not a taught module; always available later from the help menu as the course glossary/cheat-sheet

**Module 2 · Python Foundations I**
- Data types (int, float, str, bool, None) · data structures (list, tuple, dict, set) · operators · conditions · loops · functions · comprehensions · basic error handling · reading files
- Every example uses a finance object: a portfolio as a dict, tickers as a list, a compound-interest function, a loop over trading days
- 3 notebooks: (a) types & structures, (b) control flow & functions, (c) mini-project — build a simple position tracker in pure Python
- AI sidebar: "rubber-duck with AI" — pasting errors, asking for step-by-step traces
- Exercise bank: ~25 graded micro-exercises with auto-check cells

**Module 3 · Pandas for Data Analysis (+ just enough NumPy)**
- Series & DataFrames, indexing, filtering, groupby, merge/join, pivot, datetime handling, resampling, rolling windows, missing data, apply vs vectorisation
- EDA in practice: distributions, fat tails, outlier vs genuine extreme event, log vs level, winsorising, correlation instability, segment cuts
- 4 notebooks: (a) DataFrame fundamentals on stock prices, (b) cleaning a messy transactions file, (c) groupby/merge on a client book, (d) full EDA walkthrough on an index — returns, drawdowns, rolling volatility
- AI sidebar: generating pandas snippets with AI and *verifying* them
- Exercise bank: ~20 exercises + one "clean this horror CSV" challenge

**Module 3.5 · SQL for Financial Analysts (PostgreSQL)** *(full module — "SQL: still the core skill")*
- Why SQL: in real finance teams the data lives in a database, not a CSV; pandas begins where SQL ends
- Core skills on PostgreSQL: SELECT/WHERE/ORDER BY → aggregations with GROUP BY/HAVING → JOINs (the client_book joined to transactions — same course data, now as tables) → subqueries & CTEs → window functions intro (running totals, moving averages — the SQL twin of Module 3's rolling windows)
- The pandas ↔ SQL Rosetta Stone: every query shown next to its exact pandas equivalent — learners realize they already know the *concepts*, only the syntax is new
- Environment (two paths, consistent with Colab-first): **default** — hosted read-only course PostgreSQL instance (free tier: Neon/Supabase), connect from any notebook via SQLAlchemy/psycopg2, zero install; **optional local** — install PostgreSQL + pgAdmin, load the course dump, for learners who want the full DBA-lite experience
- 2 notebooks: (a) query the course database from Python — SELECT through JOINs, (b) window functions + "answer these 5 business questions in SQL, then verify each in pandas"
- Exercise bank: ~15 query challenges with auto-check (result-set comparison)
- AI sidebar: using AI to translate "the business question" → SQL, and the verify habit (run it, check row counts, test on a slice you can hand-count)

### PART B — THE FOUR QUESTIONS (Analytics Ladder)

**Module 4 · Descriptive Analytics & Visualisation** — *What happened?*
- KPIs, ratio analysis, variance reporting; one message per exhibit
- Chart grammar: trend, composition, distribution, relationship, ranking, uncertainty, flow
- Finance-specific exhibits: waterfall/bridge, candlestick, drawdown/underwater curve, correlation heatmap, tornado, efficient frontier (preview)
- Tools track: **matplotlib → seaborn** (notebooks) → **Streamlit** (build a mini price dashboard) → **Looker Studio** (no-code dashboard on the same data — connect a Google Sheet, build exec/analyst/operational tiers)
- Deliverables: 2 notebooks + 1 Streamlit starter app + 1 guided Looker dashboard walkthrough (GIF/video)

**Module 5 · Diagnostic Analytics** — *Why did it happen?*
- Drill-down, attribution, root cause, cohort analysis, driver trees
- Worked examples: price/volume/mix decomposition of a revenue variance; why did the portfolio underperform (allocation vs selection — simple Brinson); correlation vs causation; where the average hides two populations
- 2 notebooks: variance walk builder; cohort analysis on customer/loan data
- Interactive web element: click-through driver tree (expand revenue → volume/price/mix)

**Module 6 · Predictive Analytics (Concepts & Statistical Methods — No ML)** — *What is likely?*
- What "predictive" means without ML: baselines, moving averages, linear regression & trend fitting, seasonality, simple exponential smoothing
- The evaluation discipline: train/test split that respects time, walk-forward thinking, MAPE/RMSE, honest baselines, prediction intervals > point forecasts
- Backtesting mindset & the four biases revisited
- 2 notebooks: regression on fundamentals; naive vs smoothed forecast bake-off
- Explicit signpost: "Everything beyond this line (trees, boosting, deep learning) = the ML course"

**Module 7 · Prescriptive Analytics** — *What should we do?*
- What prescriptive actually is: optimisation, allocation, pricing, scenario-based recommendation; the emerging fifth rung (autonomous/agentic analytics — awareness only)
- What it requires: an objective, constraints, decision variables, and trusted inputs
- Toolbox overview: linear/quadratic programming (scipy.optimize intro), scenario weighting, decision trees (decision-analysis kind, not ML kind), sensitivity analysis
- 1 notebook: tiny cash-allocation LP solved with scipy — "given constraints, where should the money go?"
- Tools & techniques panorama: SQL, Excel/Power Query, Python stack, BI tools, where each fits (from the "working stack" slide)

### PART C — THE FINANCE MAP

**Module 8A · The Four Streams**
- Stream 1 Corporate Finance: cash flow & working capital, capital budgeting/NPV, FP&A & variance, capital structure
- Stream 2 Asset Management & Advisory: portfolio construction, performance & attribution, client analytics, valuation & deals
- Stream 3 Banking: credit risk & scorecards (Ind AS 109 / IFRS 9 context), fraud/AML, customer & pricing, ALM & RBI stress testing
- Stream 4 Financial Institutions & Markets: market risk, strategy research & backtesting, pricing & derivatives, microstructure & execution
- Format: interactive 4×4 map (stream × problem-area hover cards), one "spot the technique" quiz per stream
- Each stream ends with: "which of our four labs applies here"

**Module 8B · The Cross-Section: Investment Banking** ⭐ *(deep dive, not a footnote)*
- Why IB proves the map matters: it advises clients (a banking relationship) while pricing and distributing through markets (a markets discipline) — its analytics inherit from both
- The four IB analytics stations: **Deal origination** (target/buyer screening, ownership & relationship graphs, trigger-event monitoring) → **Valuation & pitch** (comparables, precedents, DCF, football-field ranges, accretion/dilution) → **Capital markets** (IPO & bond pricing, book-building demand curves, aftermarket performance — anchored on recent Indian IPOs learners know: Zomato, LIC, Tata Technologies) → **Risk & distribution** (underwriting/inventory risk, syndication allocation, league tables & wallet share)
- **The core teaching point (recurs as a banner):** the same technique changes meaning by stream — a regression on spreads is a pricing tool in markets, a credit decision in banking, a cost-of-debt input in corporate finance. *Context defines the model, not the other way round.*
- **Hands-on:** the course's first valuation notebook — build a simple DCF + comparables table for an NSE-listed company in Python, output a football-field chart. (Sensitivity/tornado version returns in Lab 2 with Monte Carlo.)
- Web app element: interactive Venn of the streams with IB at the overlap; football-field chart builder

**Module 8C · The Two Horizontals**
- AI in every stream — the four layers (data / prediction / language / agentic) + the failure-mode list (unexplainable models in regulated decisions, hallucinated figures, non-point-in-time training data...)
- Sustainability as an analytics problem — emissions accounting, climate stress testing, ESG rating divergence; the hard part is the *data* (self-reported, sparse, rarely point-in-time — Module 1's lessons, weaponized)
- "What else exists" panorama (awareness-level cards only): fraud/AML & financial crime, RegTech, insurance & actuarial, graph/network analytics, causal inference, real-time streaming, digital assets & on-chain, model risk & validation

### PART D — FOUR HANDS-ON LABS (the heart of the course)

**Module 9 · Lab 1: Time Series (kept deliberately simple)**
- Concepts: trend, seasonality, stationarity (intuition only), autocorrelation, moving averages, simple exponential smoothing, a gentle ARIMA (fit-and-forecast, not theory-heavy)
- Datasets: monthly revenue series, daily stock closes, deposit balances
- 3 notebooks: decompose a series → rolling stats & MA crossover → forecast with smoothing/auto-ARIMA + prediction intervals
- Web app element: animated decomposition (GIF), interactive forecast slider (change horizon, see intervals widen)

**Module 10 · Lab 2: Simulation — Monte Carlo in Practice**
- Concepts: sampling from distributions, random walks & GBM for prices, running 10,000 futures, reading the *shape of the tail* not the average
- Practical scenarios: (a) retirement/goal adequacy — will the corpus last?, (b) NPV distribution for a project instead of a single base case, (c) VaR of a small portfolio, (d) reverse question — what breaks us?
- 3 notebooks: dice-to-distributions warmup → GBM stock path simulator → project-NPV Monte Carlo with tornado sensitivity
- Web app element: live path-simulation animation (paths fanning out), 3D surface of outcome distribution vs assumptions

**Module 11 · Lab 3: Algorithmic & High-Frequency Trading (concept-heavy, code-light)**
- Concepts: what algos actually do — signals, execution slicing (VWAP/TWAP), market making, stat-arb/pairs intuition, the order book, latency & colocation, kill switches & regulation (MiFID II, Reg NMS, SEBI norms), why this is a data-engineering problem
- Cautionary tale: 2010 Flash Crash
- 2 notebooks: build & backtest a simple moving-average crossover strategy (with honest costs/slippage assumptions and a bias checklist) → toy order-book simulator (visualise bid/ask, spread, a market order eating the book)
- Web app element: animated order book (GIF/interactive), strategy backtest playground with parameter sliders
- Explicit framing: educational simulation, not trading advice

**Module 12 · Lab 4: Portfolio Optimisation**
- Concepts: risk & return, diversification, covariance, mean-variance & the efficient frontier, constraints (weights, concentration), why optimisers amplify estimation error, glimpse of risk parity & Black-Litterman (concept cards only)
- 3 notebooks: 2-asset intuition builder → efficient frontier with N assets (scipy/PyPortfolioOpt) → add real constraints & transaction-cost awareness, compare rebalancing policies
- Web app element: **3D efficient frontier / risk-return-weight surface**, interactive weight sliders showing portfolio point moving on the frontier

### CAPSTONE

**Module 12.5 · Data Storytelling & the Analyst's Voice** *(new — short module before capstone)*
- One message per exhibit; the "so what" test; executive summary in 5 sentences; presenting uncertainty honestly (ranges, not points)
- Anti-patterns gallery: chart crimes (truncated axes, dual-axis abuse, 3D pie charts), spurious-correlation hall of fame
- Exercise: take one of your own Lab outputs and rewrite it three ways — for an executive, for an analyst peer, for a client
- This is deliberately last-before-capstone: the capstone is graded as much on communication as on code

**Module 13 · Capstone: One Problem, Full Ladder**
- Learner picks a stream (corp fin / asset mgmt / banking / markets) and takes one dataset through all four questions: describe → diagnose → predict (simple) → prescribe — and presents it as a Streamlit mini-app
- Rubric + AI-usage disclosure requirement (must document how AI assisted)
- Optional showcase gallery in the web app

---

## Enrichment Layer (appendices + threads woven through modules)

**Appendix B · Excel ↔ Python Bridge (expanded)** — students live in Excel; real finance teams do too ("Excel — still the delivery layer"). Full mini-module, not a footnote:
- Reading real-world workbooks: `read_excel` with multiple sheets, skiprows/headers, merged-cell traps, Excel's date system quirks (the 1900 problem), Indian number formats (₹, lakh/crore separators)
- Writing back beautifully: `to_excel` → then `openpyxl`/`xlsxwriter` for formatted stakeholder output — currency formats, conditional color scales, frozen panes, a chart sheet
- The migration pattern: take a typical analyst Excel workflow (VLOOKUP + pivot + chart) and rebuild it in pandas step by step — a Rosetta table mapping every Excel action to its pandas equivalent
- Automation payoff demo: a monthly report that takes 2 hours in Excel refreshed in one cell run
- When Excel wins (quick looks, stakeholder delivery) and when it breaks (row limits, no lineage, no reproducibility — Module 1 pillars revisited)
- 2 notebooks + one downloadable formatted .xlsx template learners generate themselves

**Appendix C · Career Map** — each module → real job titles it feeds: FP&A analyst (M4–5, 8A-S1), credit risk analyst (M8A-S3, labs), market/quant risk analyst (M8A-S4, Labs 2+4), wealth & product analyst (M8A-S2, M5), IB analyst (M8B), data analyst in fintech (M3–7). Strongest motivator for a student audience; doubles as marketing content for the course itself.

**Failure Case-Study Thread** — kept deliberately simple: each is a one-page, plain-language story (no jargon, no legal detail) in the format *what happened → why it matters → the one lesson*. If a story needs finance vocabulary to make sense, we simplify the story, not the reader:
- Part A: **Knight Capital 2012** — "one wrong setting on one computer lost $440M in 45 minutes" → the lesson: check the data/config before trusting the machine → Module 1
- Part B: **Harshad Mehta 1992** — "one man moved the whole market using fake bank receipts, and no one was watching the data" → the lesson: this is why surveillance analytics exists → Module 5/8
- Part C: **IL&FS 2018** — "a giant with a top safety rating collapsed in weeks" → the lesson: a rating is data too — ask how fresh and how honest it is → Module 8A banking stream
- Part D: **Flash Crash 2010** — "the market fell 9% in minutes because algorithms copied each other" → the lesson: speed amplifies mistakes → Lab 3 (HFT)

**Deliberately excluded (and why):** deep econometrics (kills beginners; belongs in an advanced sequel), crypto/on-chain analytics (dates fast; awareness card in 8C only), machine learning (the sequel course — signposted at the Module 6 border).

---

## Per-Module Standard Template (applies to every module)

1. **Hook** — one real market/finance story or stat (from the securities-markets deck)
2. **Theory** — visual-first web pages (diagrams, animations, GIFs; 3D where it genuinely helps)
3. **Watch it work** — short animated walkthrough of the key idea
4. **Notebook(s)** — downloadable .ipynb + open-in-Colab button; solution notebooks unlocked after attempt
5. **AI sidebar** — one concrete "do this with AI / never trust AI for this" pattern per module
6. **Exercise bank** — auto-checkable micro-exercises + one open challenge
7. **Bias check** — recurring ritual: which of the four biases could poison this analysis?
8. **Quiz** — 8–10 questions, instant feedback
9. **Stream connector** — where this skill shows up across the four streams

---

## Web App — Feature Plan (build phase, after content freeze)

**Learner experience**
- Module map as an interactive journey (progress tracking, unlockable path)
- In-browser code peeks (read-only cells with copy button) + download/Colab for real work
- Interactive widgets per module: forecast sliders, Monte Carlo path animator, order-book viewer, 3D efficient frontier (three.js / Plotly 3D)
- GIF/short-loop animations for every core concept (decomposition, random walk, diversification)
- Dark-mode financial-terminal aesthetic option

**Content system**
- Each module = structured content (MDX/JSON) so text, notebooks, quizzes, datasets version together
- Dataset registry: every dataset documented (source, licence, known quirks — practicing what Module 1 preaches)

**Assessment & AI layer**
- Auto-graded quizzes and exercise cells; capstone rubric
- Embedded "Ask-AI" helper pattern (prompt templates per module, optionally wired to an LLM API later)

**Suggested build order:** freeze syllabus (this doc) → write Modules 0–3 content + notebooks → prototype web app shell with Module 2 as the pilot → then batch-produce remaining modules → labs last (they need the most interactive engineering) → capstone & polish.

---

## Locked Decisions ✅

1. **Audience:** Students — beginners at both finance and coding. Zero assumed knowledge; every term defined on first use; analogies before formulas.
2. **Environment:** Colab-first (zero install). Local path = plain `pip install notebook` for Jupyter — no Anaconda anywhere in the course.
3. **Dashboards (Module 4):** Looker Studio (free, no-code path) **+** Streamlit (code path) — learners build the same dashboard both ways.
4. **Data context: India-first.** All primary examples use Indian market data — NIFTY 50 / SENSEX indices, NSE/BSE-listed stocks (Reliance, TCS, HDFC Bank, Infosys, etc. via yfinance `.NS` tickers), ₹ currency, RBI/MOSPI macro series (repo rate, CPI), SEBI as the regulatory frame. Global data (S&P 500, Fed) appears only as secondary comparison where pedagogically useful.

## Still Open (decide before the build phase)

1. **Duration target** — self-paced total hours? (Current plan ≈ 35–45 learner-hours.)
2. **Certification/assessment** — completion certificate? Proctored quiz? Affects app scope.
3. **HFT lab depth** — keep it concept + toy simulation (recommended), or add a paper-trading API exercise?
