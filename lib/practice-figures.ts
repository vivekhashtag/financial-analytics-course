/**
 * Numbers, hints and model answers for the Appendix D figures and exercise
 * cards.
 *
 * ## Provenance rule
 *
 * Every figure on that page teaches with numbers the appendix itself states.
 * Nothing here is invented, and where the source gives no number the figure
 * goes without one rather than filling the gap — a plausible-looking figure a
 * learner cannot trace back to the text is exactly the habit Module 1 spends
 * six pages arguing against. Each value below cites the line it came from, so
 * a content edit that moves a number shows up as a stale comment rather than a
 * silent divergence.
 *
 * Three deliberate gaps, all visible in the UI rather than papered over:
 *
 *  - D.5's published note ends "Maximum loss ₹X per lot" — a placeholder. The
 *    payoff needs a net credit to price anything, so the figure shows one as a
 *    labelled assumption and says so on screen.
 *  - D.6's maturity ladder has no per-year rupee amounts in the text, so the
 *    bars carry shape and no values. The shape is the whole lesson.
 *  - D.3's bridge totals ₹24 cr of adjustments but never splits them per
 *    line, so the three drops are drawn equal and only the total is labelled.
 */

export interface PracticeFigureMeta {
  /** headline above the figure */
  title: string;
  /** the one idea the picture exists to teach */
  caption: string;
}

export const FIGURES: Record<string, PracticeFigureMeta> = {
  'D.1': {
    title: 'How an estimate becomes a new target price',
    caption:
      'Results come in, estimates change, the target moves. The note exists to show that arithmetic.',
  },
  'D.2': {
    title: 'The life of a deal',
    caption:
      'A deal is a long, ordered process, and the analyst produces something at every stage.',
  },
  'D.3': {
    title: 'The Quality of Earnings bridge',
    caption:
      'Due diligence removes distortions one at a time, and each removal is worth real money.',
  },
  'D.4': {
    title: 'A thesis meets the evidence',
    caption:
      'An idea is tested against evidence over time, and the exit rule is written in advance.',
  },
  'D.5': {
    title: 'Play with a payoff',
    caption: 'With options you can know your worst case before you trade.',
  },
  'D.6': {
    title: 'The maturity ladder',
    caption: 'Running out of value and running out of cash are different deaths.',
  },
};

/* ------------------------------------------------------------------ D.1 */

/**
 * From D.1 Station 2's worked results note: "Revenue 3% above our estimate.
 * Margins missed by 0.8% … We cut our FY26 profit estimate by 4% … Target
 * price moves from ₹2,450 to ₹2,380."
 */
export const D1_RESULT = {
  revenueSurprise: '+3%',
  marginMiss: '0.8%',
  estimateCut: '4%',
  oldTarget: 2450,
  newTarget: 2380,
  rating: 'BUY, kept',
} as const;

/* ------------------------------------------------------------------ D.2 */

/** D.2's stations 0–5, with the artefact each one produces (from "The documents"). */
export const D2_STAGES = [
  { stage: 'Pitch', builds: 'Pitchbook' },
  { stage: 'Preparation', builds: 'CIM' },
  { stage: 'Marketing', builds: 'Teaser' },
  { stage: 'Diligence', builds: 'Data room' },
  { stage: 'Bids', builds: 'Bid table' },
  { stage: 'Closing', builds: 'Checklist' },
] as const;

/* ------------------------------------------------------------------ D.3 */

/**
 * D.3 Station 2: "Reported EBITDA ₹120 cr → Adjusted ₹96 cr … At a price of
 * 10× EBITDA, that one finding just moved the price by ₹240 crore."
 *
 * The drop labels are the first three distortion categories from the same
 * station's bullet list. The text never splits the ₹24 cr between them, so the
 * drops are equal and only the total is labelled — see the provenance note.
 */
export const D3_BRIDGE = {
  reported: 120,
  adjusted: 96,
  multiple: 10,
  priceImpact: 240,
  drops: ['One-off gain', 'Unpaid receivables', 'Related-party rent'],
} as const;

/* ------------------------------------------------------------------ D.4 */

/** D.4 Stations 2, 4 and 6: thesis, three supporting findings, the pre-written exit. */
export const D4_EVIDENCE = [
  { label: 'Evidence 1', state: 'holds' },
  { label: 'Evidence 2', state: 'holds' },
  { label: 'Evidence 3', state: 'weakened' },
] as const;

/* ------------------------------------------------------------------ D.5 */

/**
 * D.5 Station 3's published note: "We favour selling the 24,800–25,200
 * strangle, protected beyond 300 points."
 *
 * So: short put 24,800, short call 25,200, long wings 300 points beyond each —
 * an iron condor. (Station 1's 24,000 and 25,000 are the *open-interest*
 * levels in the positioning read, a different sentence and not the trade.)
 *
 * `assumedCredit` is the one number with no source: the note states its
 * maximum loss as "₹X per lot". It is surfaced on screen as an assumption so
 * the readout can be live without presenting a made-up figure as course data.
 */
export const D5_CONDOR = {
  shortPut: 24800,
  shortCall: 25200,
  wing: 300,
  assumedCredit: 100,
  ivPercentile: 78, // "IV at the 78th percentile before the event"
} as const;

export const D5_LONG_PUT = D5_CONDOR.shortPut - D5_CONDOR.wing; // 24,500
export const D5_LONG_CALL = D5_CONDOR.shortCall + D5_CONDOR.wing; // 25,500
/** Max loss per unit, in index points: the wing width less the credit taken in. */
export const D5_MAX_LOSS = D5_CONDOR.wing - D5_CONDOR.assumedCredit;

/** Iron condor P&L at expiry, in index points per unit. */
export function condorPayoff(spot: number): number {
  const { shortPut, shortCall, wing, assumedCredit } = D5_CONDOR;
  const putSide = Math.min(Math.max(shortPut - spot, 0), wing);
  const callSide = Math.min(Math.max(spot - shortCall, 0), wing);
  return assumedCredit - putSide - callSide;
}

/* ------------------------------------------------------------------ D.6 */

/**
 * D.6's Tuesday: "coverage slipped from 2.4× to 1.9×" and "the FY28
 * refinancing bump is the story". Station 4 sets the floor the stress case
 * must clear: "does coverage stay above 1?"
 *
 * The bars carry no rupee values because the text states none — only that FY28
 * is the bump. `weight` is relative height, not an amount, and no figure is
 * printed on any bar.
 */
export interface LadderBar {
  year: string;
  /** relative height, not an amount — the text gives no per-year figures */
  weight: number;
  tower?: boolean;
}

export const D6_LADDER: LadderBar[] = [
  { year: 'FY26', weight: 0.28 },
  { year: 'FY27', weight: 0.34 },
  { year: 'FY28', weight: 1, tower: true },
  { year: 'FY29', weight: 0.22 },
];

export const D6_COVERAGE = {
  was: 2.4,
  now: 1.9,
  floor: 1,
} as const;

/* --------------------------------------------------- guided exercise text */

export interface GuidedExercise {
  /** one or two lines pointing at the right notebook or technique */
  hint: string[];
  /**
   * What a good answer looks like — the shape, not the content. Taken from the
   * "Why this works — read like a reviewer" block on that practice's page of
   * public/templates/samples_pack.pdf, so the card and the pack agree.
   */
  modelAnswer: string[];
}

export const GUIDED: Record<string, GuidedExercise> = {
  'D.1': {
    hint: [
      'The revenue, EBITDA and PAT columns for MoneyMart are already in company_financials.csv — you need no new data.',
      'Build the variance table as a 5A decomposition, then write the headline last, once you know what actually changed.',
    ],
    modelAnswer: [
      'The headline states the change and its cause in one sentence: a reader who stops there still got it.',
      'Every estimate cut is tied to a named driver with a number, and the rating change shows its arithmetic.',
      'The revisit trigger is pre-committed, not decided later.',
    ],
  },
  'D.2': {
    hint: [
      'Pull the FY21-25 revenue and store economics straight from company_financials.csv — the growth story is in the numbers you already have.',
      'Write it so the sector is obvious and the company is not: that tension is the whole craft of a teaser.',
    ],
    modelAnswer: [
      'Every highlight carries a number; adjectives do no load-bearing work.',
      'Anonymised but verifiable in spirit: a serious buyer can triangulate the sector without the name leaking.',
      'The buyer list gives why-them logic, not just names.',
    ],
  },
  'D.3': {
    hint: [
      'Use the FY20-21 restatement in company_financials.csv (₹3,511 cr → ₹3,366 cr) — the numbers are already there.',
      'Structure it like a 5A decomposition, and write both explanations before you believe the accusatory one.',
    ],
    modelAnswer: [
      'Both explanations are written before the accusatory one is believed.',
      'Every claim names a document, and one requested document is the test that separates the two explanations.',
      'Impact is stated as a range with its condition: a finding, not a verdict.',
    ],
  },
  'D.4': {
    hint: [
      'Four sentences, no model: what you believe, why the market disagrees, what closes the gap, what would prove you wrong.',
      'If you cannot name why the mispricing exists, you have optimism rather than a thesis.',
    ],
    modelAnswer: [
      'The thesis names why the mispricing exists — without that it is just optimism.',
      'The load-bearing assumption is one clause, and its failure is priced rather than hand-waved.',
      'Exits are defined by thesis evidence, not by price levels.',
    ],
  },
  'D.5': {
    hint: [
      'Realised volatility is 10C’s one-line calculation on the NIFTY closes you already have.',
      'Compare it with today’s India VIX, then say which is higher and what the gap is paying for.',
    ],
    modelAnswer: [
      'The view is typed honestly as volatility; direction never enters the note.',
      'Max loss is computed and sized before entry, with profit-taking and time exits pre-written.',
      'Attribution by Greek answers 6B’s question: right for the stated reason, or just lucky?',
    ],
  },
  'D.6': {
    hint: [
      'Debt ÷ EBITDA and interest coverage come straight from the debt and interest columns of company_financials.csv.',
      'Grade first, then the driver, then one numeric trigger — the 12.5 pyramid, in four lines.',
    ],
    modelAnswer: [
      'Grade first, with its basis in the same breath.',
      'The ladder finds the binding constraint and says so plainly; ratios alone would have missed it.',
      'Triggers are numeric and dated, so surveillance can be run by someone other than the author.',
    ],
  },
};
