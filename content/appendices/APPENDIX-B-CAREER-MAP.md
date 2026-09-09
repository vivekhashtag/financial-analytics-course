# Appendix B · The Career Map: From This Course to a First Role

*Reading time: about 40 minutes. Module 8 mapped the industry; this appendix points the map at your next twelve months. It is written for the course's actual audience — a student in India, no finance work experience, this course's skills in hand — and it is deliberately honest about what each door looks like from the outside.*

---

## B.1 — How to Read This Appendix

Three principles before the tables:

**First: your notebooks are your experience.** With no work history, "proof of skill" is the whole game — and you now hold something most applicants don't: 25+ working notebooks and a capstone repo. The core move of this appendix is mapping *role → the notebook that proves you can do it*, so that "I have no experience" becomes "here is me doing the job, in code, with a README."

**Second: apply to problems, not titles.** The same work hides under many names — "MIS analyst," "business analyst," "decision scientist," "analytics associate." Read the JD's *verbs* (reconcile, forecast, segment, monitor) and match them to modules; ignore the noun in the title.

**Third: the fresher door in India is wider than the famous door.** Everyone aims at the five brand-name firms; meanwhile GCCs, NBFCs, AMC ops, fintechs and Big-4 analytics teams hire fresher analysts at scale, feed them real data on week one, and become the experience that opens the famous doors two years later. This appendix weights accordingly.

---

## B.2 — The Role Table

For each: what the day actually contains, where it lives on Module 8's map, **the proof notebook**, and the honest note nobody puts in the JD.

### FP&A / Business Finance Analyst — *Stream 1 · the widest fresher door*
**The day:** monthly close support, variance analysis (actuals vs plan), building the management pack, budget consolidation. **Proof notebooks:** 5A (price/volume + cost bridge — this IS the job), 4B (waterfall), Appendix A (the pack, automated). **Where:** every large company; massively at **GCCs** in Bengaluru/Hyderabad/Pune/Gurgaon running FP&A for global firms. **Honest note:** the work is 70% Module 5 and 30% stakeholder patience; Excel fluency is assumed, and your Python is the differentiator that gets you promoted, not hired — lead with both.

### Credit Analyst / Credit Risk (Retail or SME) — *Stream 3 · India's deepest analytics market*
**The day:** portfolio monitoring (delinquency by vintage and segment), scorecard tracking, policy analysis ("what if we tighten the income cutoff?"), ECL data prep. **Proof notebooks:** 5B (cohorts + adjusted comparisons = vintage analysis), 3B (the cleaning — bureau data is a horror file), 6A (point-in-time discipline, which interviewers in this field genuinely probe). **Where:** banks, NBFCs, fintech lenders, bureaus. **Honest note:** the vocabulary test is real — vintages, roll rates, PIT vs TTC, ECL stages; Lesson 8.4 plus one evening of reading closes the gap. SQL (Module 3.5) is non-negotiable here.

### Wealth / Client Analytics — *Stream 2 · the course's home turf*
**The day:** segment reporting, churn and cross-sell analysis, RM dashboards, campaign measurement. **Proof notebooks:** 3C + 5B (literally the daily work), the Track-A capstone if you chose it, m4 dashboard. **Where:** AMCs, wealth platforms, broker-fintechs, bancassurance teams. **Honest note:** the SIP boom made this the fastest-growing niche; the differentiator interviewers reward is exactly 5B's discipline — mix adjustment and the refusal to over-claim causality.

### Business Intelligence / MIS Analyst — *cross-stream · the volume hirer*
**The day:** dashboards (Looker/Power BI/Tableau), SQL against the warehouse, metric definitions, ad-hoc "can you pull…" requests. **Proof notebooks:** 3.5A/B (SQL is the interview), 4A (chart grammar), the Looker walkthrough. **Where:** everywhere, especially fintechs and e-commerce-adjacent finance. **Honest note:** entry is easy and the ceiling is set by whether you climb from *reporting* to *analysis* — your Modules 5–7 are precisely that ladder; mention them or be typecast.

### Risk Analyst (Market / Liquidity / Op) — *Stream 4 · the quiet professional's route*
**The day:** VaR and ES production, limit monitoring, stress-test runs, model-validation support. **Proof notebooks:** 10C (VaR/ES + the backtest — a junior market-risk analyst's actual toolkit), 9B (vol clustering), 12B (the fragility instinct validators are paid for). **Where:** banks' risk departments, broker risk desks, the risk GCCs of global banks (a huge, underrated fresher intake). **Honest note:** temperamentally suits the skeptical; the course's bias-check reflex is the job's core competence wearing a syllabus.

### Markets / Execution / Surveillance Analyst — *Stream 4 · the hardest door, honestly*
**The day:** TCA reports, algo-parameter monitoring, surveillance alert triage, desk support analytics. **Proof notebooks:** 11A (the order book — the interview IS this notebook), 11B (the honest backtest, including the nuanced verdict, which is the culture test). **Where:** brokers, exchanges, prop shops, the odd buy-side desk. **Honest note:** few seats, network-heavy, and the fresher route usually runs through operations or risk first; 11B's honesty is your differentiator because this industry has been burned by every dishonest backtest already.

### Data Analyst at a Fintech — *cross-stream · the generalist's playground*
**The day:** everything above in miniature — funnels, cohorts, fraud triage, pricing experiments — with small teams and real ownership early. **Proof notebooks:** the whole of Module 3, 5B, plus the capstone repo as evidence you finish things. **Honest note:** the best learning-per-month of any option and the least structure; the Module 5 experiment-mindset ("what would separate these mechanisms?") is disproportionately valued because fintechs actually run the experiments.

### Two adjacent doors worth knowing
**Model validation / model risk** (checking others' models — Modules 1+6+12B *as a career*; hires skeptics, undersubscribed, great training). **Analytics consulting / Big-4** (variety at speed; the deliverable culture of Module 12.5 is half the job — your one-page memo skill is a genuine edge in these interviews).

---

## B.3 — The Application Kit

**The CV's project line** (the capstone, rendered for the board room):
> *"Built an end-to-end [wealth-retention / FP&A-outlook / …] analysis in Python & SQL — data audit through recommendation — shipped as an interactive Streamlit app with reproducible pipeline. [repo link]"*
One line, four proofs (finishes things, full ladder, ships software, reproducible). Adjacent lines: the honest-backtest verdict for markets roles; the VaR backtest for risk; the cleaned horror-file with its measured before/after for anything data-heavy.

**The GitHub minimum:** pinned capstone repo with the five-minute README; one more repo of your three best course notebooks *with your own exercise solutions* (proof of hands, not copying); profile README of three lines, not an autobiography.

**The interview mapping** — where course lessons ARE the standard questions: *"walk me through a data-cleaning project"* → 3B, told measure-fix-prove; *"revenue fell 8%, how do you investigate?"* → 5A's decomposition + 5B's suspect-list-and-test-plan close; *"how would you forecast X?"* → Module 6's harness speech (floor, honest split, cone, regime sentence); *"tell me about a time analysis changed a decision"* → your capstone's prescriptive close, with the flip; *"what's your view on [market thing]?"* → Module 12.5's uncertainty structures keep you honest AND confident. And the question you ask *them* that signals seniority beyond your years: "what's the golden source for [their core metric], and who owns its definition?" — Module 1, weaponised politely.

**The honest gaps to close per target** (this course is a foundation, not a costume): credit roles → the vocabulary evening (B.2); markets/quant-leaning roles → the ML course this one signposted; BI-heavy roles → one weekend actually building in Power BI or Tableau (the concepts transfer 1:1 from Module 4; the clicks don't); accounting-heavy FP&A → a basics-of-financial-statements refresher if Module 1.5 was skipped.

---

## B.4 — The Twelve-Month Shape

A realistic sequence, not a promise: **Months 0–1** — capstone polished, kit assembled, 15 applications/week into the *wide* doors (GCC FP&A, NBFC credit, fintech DA, BI) alongside any famous-door shots. **Months 1–3** — interviews as feedback loops: every stumble maps to a module; revisit, retry. **Months 3–12, employed** — the quiet compounding: automate one recurring thing (Appendix A pattern) in your first 90 days, volunteer for the data-quality mess nobody wants (Module 1 made you the person who *can*), and keep the disclosure habit — the analyst whose numbers reconcile and whose methods are stated becomes, quietly and quickly, the one trusted with decisions. That trust, not any title, is the actual first rung.

*Final honesty: markets shift, titles mutate, and no appendix survives contact with a specific Tuesday. The streams, the proofs, and the disciplines transfer; the rest is navigation — which, as of the capstone, is a skill you demonstrably have.*
