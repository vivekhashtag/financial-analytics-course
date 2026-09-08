# Module 0 · Orientation: How This Course Works & How to Learn With AI

**Audience:** Complete beginners — no finance background, no coding background assumed.
**Learner time:** ~2 hours (reading + setup + first notebook)
**Deliverables in webapp:** 5 content pages · 1 setup-check notebook · 1 quiz (8 Qs) · AI Charter poster (downloadable PDF)

---

## Page 1 — Why This Course Exists (The Hook)

**Opening stat cards (animated counters in webapp):**
- **~75%** of US stock trading volume is executed by computer algorithms, not humans
- **1 billion+** trade and quote records collected *per day* by the SEC's market-analysis system
- **Microseconds** — the timescale on which modern trades are matched (a blink of an eye is ~300,000 microseconds)

**Narrative (webapp copy):**

> Imagine trying to read a billion messages a day. No human can — but modern financial markets produce exactly that. Every price change, every trade, every company filing is data. The people who can *read* this data — clean it, question it, chart it, model it — are the ones who understand what markets are actually doing.
>
> This course teaches you to become one of those people. Not by memorizing finance jargon, and not by becoming a software engineer — but by learning just enough of both worlds to be dangerous: **Python for the hands, finance for the head, and analytics for the judgment in between.**

**What you will be able to do by the end** (checklist, becomes the learner's progress tracker):
- [ ] Take any messy financial dataset and clean, explore, and summarize it in Python
- [ ] Build charts and dashboards (Streamlit + Looker Studio) that tell one clear story
- [ ] Answer the four analytics questions: what happened, why, what's next, what should we do
- [ ] Place any finance problem on the map: corporate finance, asset management, banking, or markets
- [ ] Run four real labs: forecast a time series, simulate 10,000 futures with Monte Carlo, backtest a trading strategy, and build an optimized portfolio
- [ ] Use AI tools as a learning accelerator — without being fooled by them

**What this course is NOT:**
- ❌ Not a machine learning course (that's the sequel — we deliberately stop at the ML border and put up a signpost)
- ❌ Not investment advice — every strategy we build is educational simulation
- ❌ Not a math-heavy quant course — intuition first, formulas only where they earn their place

---

## Page 2 — The Course Map (Interactive in webapp)

Visual: a metro-map style journey with four colored lines converging at the capstone.

| Part | Modules | The one-line promise |
|---|---|---|
| **A · Foundations** | 0–3 | Data literacy → Python → pandas: the instrument |
| **B · Four Questions** | 4–7 | Describe → Diagnose → Predict → Prescribe: the method |
| **C · Finance Map** | 8 | Four streams, two horizontals: the territory |
| **D · Labs** | 9–12 | Time series · Monte Carlo · Algo trading · Portfolio optimization: the craft |
| **Capstone** | 13 | One dataset, full ladder, your own mini-app |

**How each module works (the standard template — show as icons):**
Hook → Theory (visual) → Watch-it-work animation → Notebook(s) → AI sidebar → Exercises → Bias check → Quiz → Stream connector

**Rules of the road:**
1. Notebooks are where learning happens. Reading is 30%; typing is 70%.
2. Every module's exercises unlock the next module (webapp gating — soft, skippable with a warning).
3. Solution notebooks unlock only after you submit an attempt.
4. The "four biases" ritual (you'll meet them in Module 1) repeats in every lab. By Module 12 it should be reflex.

---

## Page 3 — Setting Up (Colab-First, Zero Install)

### Path A (default): Google Colab — nothing to install
1. Have a Google account.
2. Click any "Open in Colab" button in this course → the notebook opens in your browser.
3. Press **Runtime → Run all**. That's it. Python runs on Google's computers, not yours.

**Colab survival kit (GIF walkthroughs in webapp):**
- Running a cell: `Shift + Enter`
- Adding a cell: `+ Code` / `+ Text` buttons
- Saving your work: **File → Save a copy in Drive** (do this FIRST every time, or your edits vanish)
- Uploading a dataset: folder icon (left sidebar) → upload — *note: files vanish when the session ends; we'll teach the `!wget` pattern to re-fetch data instead*
- When things freeze: **Runtime → Restart runtime**

### Path B (optional): Local Jupyter — one command, no Anaconda
For learners who want everything on their own machine:

```bash
# 1. Install Python from python.org (3.10+), ticking "Add to PATH"
# 2. Then in a terminal:
pip install notebook pandas numpy matplotlib seaborn
# 3. Launch:
jupyter notebook
```

That's the entire local setup. We deliberately avoid Anaconda — it's a 4 GB download to get what two commands give you. Later modules add packages one at a time as needed (`pip install yfinance`, `pip install streamlit`, etc.), and every notebook's first cell lists its own requirements.

### The Setup-Check Notebook (Deliverable)
`00_setup_check.ipynb` — the learner's first notebook. It:
1. Prints "Hello, financial analyst" (first taste of `print`)
2. Imports pandas/numpy/matplotlib and reports versions with ✅/❌ per package
3. Downloads a tiny CSV (10 rows of stock prices) from the course data repo and displays it
4. Draws one line chart of those prices
5. Ends with: "If you can see a chart above, you are ready. See you in Module 1."

*(Notebook file ships with this module — see `notebooks/00_setup_check.ipynb`.)*

---

## Page 4 — The AI Learning Charter (Core Innovation of This Course)

**Framing for students:**

> You have access to something no previous generation of students had: an infinitely patient tutor that never sleeps. Used well, AI (ChatGPT, Claude, Gemini, Copilot) can halve your learning time. Used badly, it can make you feel like you're learning while you learn nothing. This page is the contract.

### The Green List — always use AI for these

| Situation | Prompt pattern (copy-paste templates in webapp) |
|---|---|
| **Explain code** | "Explain this Python code line by line as if I'm a beginner: `[paste code]`" |
| **Decode errors** | "I got this error: `[paste full error]`. Here's my code: `[paste]`. Explain what went wrong in simple terms, then show the fix." |
| **Analogy on demand** | "Explain [stationarity / standard deviation / a DataFrame] using a real-life analogy, no math." |
| **Generate practice data** | "Give me Python code to create a fake dataset of 100 bank transactions with columns: date, amount, category — include some missing values and one obvious outlier." |
| **Quiz me** | "Ask me 5 questions about pandas groupby, one at a time. Tell me if my answer is right before the next one." |
| **Critique my work** | "Here's my analysis conclusion: `[paste]`. Play devil's advocate — what could make this conclusion wrong?" |

### The Red List — never trust AI blindly for these

| Danger zone | Why | The rule |
|---|---|---|
| **Financial figures & statistics** | LLMs confidently invent numbers ("the market returned 11.3% in 2019") | Every number needs a source you can click |
| **Citations & references** | AI fabricates plausible-looking papers and URLs | If you can't open it, it doesn't exist |
| **"Just give me the answer" on exercises** | You'll pass the exercise and fail the capstone | Attempt first, AI second — that's why solutions unlock after submission |
| **Generated code you don't understand** | Code that works for the wrong reason fails silently later | Rule: *you may only run AI code you can explain line by line* — and you can use AI to reach that explanation |
| **Financial advice** | Legal + practical: it doesn't know your situation and this course is simulation | Never |

### The Verify Habit (taught as a 3-step reflex)
1. **Ask** AI for the code/explanation.
2. **Interrogate**: "What assumptions does this make? When would this be wrong?"
3. **Verify** on a case where you already know the answer (we call this a *tracer bullet* — e.g., test the average-calculator on `[1, 2, 3]` where you know the answer is 2).

### AI-usage disclosure (course policy)
Every submitted exercise and the capstone include a one-line disclosure: *"AI assisted with: ___ / AI was not used."* Not to punish use — to build the professional habit. In real finance jobs, undisclosed AI use in a model is a compliance incident.

**Webapp element:** downloadable one-page "AI Charter" poster (PDF) with the Green/Red lists.

---

## Page 5 — Meet the Cast (Recurring Datasets)

To reduce cognitive load, the same few datasets recur throughout the course, growing with the learner:

| Dataset | Contents | First appears | Used in |
|---|---|---|---|
| `nifty50_prices.csv` | 5 years of daily NIFTY 50 index levels (via yfinance `^NSEI`) | Module 0 | 3, 4, 6, 9, 10 |
| `messy_transactions.csv` | 5,000 UPI/bank transactions in ₹, deliberately dirty (duplicates, missing values, mixed date formats, one USD amount slipped in) | Module 1 | 1, 3, 5 |
| `client_book.csv` | 1,000 wealth-management clients across Indian metros: portfolio value (₹), product holdings, tenure, churn flag | Module 3 | 3, 5, 8 |
| `company_financials.csv` | 10 years of P&L lines for a fictional Indian retailer "MoneyMart India" (₹ crore) | Module 4 | 4, 5, 6 |
| `nse_stock_universe.csv` | Daily prices for 20 NSE stocks across sectors — Reliance, TCS, HDFC Bank, Infosys, ITC, Tata Motors, etc. (yfinance `.NS` tickers) | Module 9 | 9, 11, 12 |

**India-first, globally aware:** primary examples use Indian markets (NIFTY, NSE/BSE, ₹, RBI rates, SEBI rules). Where a comparison teaches something — e.g., NIFTY vs S&P 500 correlation in Module 3 — global data appears as the supporting act.

All datasets are synthetic or from free sources (yfinance/FRED), documented in the dataset registry with source, license, and *known quirks* — practicing Module 1's lesson from day one.

---

## Quiz (8 questions, instant feedback — samples)

1. What fraction of US equity trading volume is algorithmic? (~75%)
2. In Colab, what must you do before editing a course notebook so your work is saved? (Save a copy in Drive)
3. True/False: This course teaches machine learning. (False — signposted for the sequel)
4. Which is on the AI Red List: (a) explaining an error message (b) generating a fake practice dataset (c) providing a statistic without a source (✓ c)
5. What is a "tracer bullet"? (Testing code on a case where you already know the answer)
6. What's the local install command for Jupyter in this course? (`pip install notebook`)
7. Why do solution notebooks unlock only after an attempt? (Attempt-first learning)
8. What is the AI-usage disclosure and why does it exist? (One-line statement; professional habit / compliance mindset)

---

## Webapp Build Notes for This Module
- Animated stat counters on Page 1 (count-up on scroll)
- Metro-map course journey (SVG, clickable, doubles as global navigation)
- GIFs: Colab run-cell, save-a-copy, upload-file (record once, reuse in help center)
- AI Charter: interactive flip-cards (Green/Red), PDF export
- Setup-check completion = the learner's first progress badge ("Environment Ready")
