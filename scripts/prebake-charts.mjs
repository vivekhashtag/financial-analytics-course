#!/usr/bin/env node
/**
 * Pre-bakes the small JSON extracts the module charts read, into
 * public/chart-data/. Runs in prebuild, after sync-static.
 *
 * Everything here is derived from the real files in /data, or from parameters
 * stated in the course's own notebooks and prose. Nothing is made up. Each
 * extract records its `source` so the widget can cite it on screen.
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'public', 'chart-data');
fs.mkdirSync(OUT, { recursive: true });

const readCsv = (rel) => {
  const [head, ...lines] = fs.readFileSync(path.join(ROOT, rel), 'utf8').trim().split(/\r?\n/);
  const cols = head.split(',');
  return lines.map((l) => {
    const cells = l.split(',');
    return Object.fromEntries(cols.map((c, i) => [c, cells[i]]));
  });
};

const num = (v) => {
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : null;
};

const write = (name, data) => {
  const file = path.join(OUT, name);
  fs.writeFileSync(file, JSON.stringify(data));
  const kb = (fs.statSync(file).size / 1024).toFixed(1);
  console.log(`  ${name.padEnd(28)} ${kb.padStart(7)} kB`);
};

console.log('Pre-baking chart data:');

/* ------------------------------------------------- M4 · NIFTY daily closes */

const prices = readCsv('data/nifty50_prices.csv')
  .map((r) => ({ date: r.date, close: num(r.close) }))
  .filter((r) => r.date && r.close !== null);

write('m4-nifty-daily.json', {
  source: 'data/nifty50_prices.csv',
  units: 'index points',
  rows: prices.length,
  series: prices.map((r) => ({ d: r.date, c: Number(r.close.toFixed(2)) })),
});

/* --------------------------------------- M5 · MoneyMart P&L, all 10 years */

const fin = readCsv('data/company_financials.csv').map((r) => ({
  year: r.fiscal_year,
  revenue: num(r.revenue_cr),
  cogs: num(r.cogs_cr),
  gross: num(r.gross_profit_cr),
  employee: num(r.employee_cost_cr),
  marketing: num(r.marketing_cr),
  otherOpex: num(r.other_opex_cr),
  ebitda: num(r.ebitda_cr),
  stores: num(r.stores_count),
  ticket: num(r.avg_ticket_size_inr),
}));

write('m5-financials.json', {
  source: 'data/company_financials.csv',
  units: 'INR crore; ticket size in INR',
  years: fin,
});

/* ------------------------------------------- M6 · NIFTY month-end closes */

// Same resample the course's own notebooks use: last close of each month.
const monthly = [];
for (const r of prices) {
  const key = r.date.slice(0, 7);
  const last = monthly[monthly.length - 1];
  if (last && last.month === key) last.close = r.close;
  else monthly.push({ month: key, close: r.close });
}

write('m6-nifty-monthly.json', {
  source: 'data/nifty50_prices.csv, resampled to month-end close',
  units: 'index points',
  series: monthly.map((m) => ({ m: m.month, c: Number(m.close.toFixed(2)) })),
});

/* ---------------------------------- M9 · MoneyMart monthly sales (9A) */

/**
 * Structure lifted verbatim from notebooks/09a_decomposition.ipynb:
 *   trend    = 520 + 4.2 * i, 72 months from 2020-01-31
 *   seasonal = the notebook's twelve multiplicative indices
 *   noise    = normal(1.0, 0.03)
 *
 * The notebook draws its noise from numpy's PCG64 seeded at 9, which cannot be
 * reproduced bit-for-bit in JavaScript. Everything structural is identical; the
 * noise is a *seeded stand-in at the same 0.03 sigma*, and the widget says so
 * on screen rather than implying it is the notebook's exact draw.
 */
const SEASONAL = {
  1: 0.94, 2: 0.92, 3: 0.98, 4: 1.0, 5: 0.97, 6: 0.95,
  7: 0.98, 8: 1.02, 9: 1.05, 10: 1.22, 11: 1.14, 12: 0.83,
};

const mulberry32 = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

let rngState = 9;
const nextUniform = () => {
  rngState = (rngState * 1664525 + 1013904223) % 4294967296;
  return mulberry32(rngState)();
};
const nextNormal = () => {
  const u = Math.max(1e-12, nextUniform());
  const v = nextUniform();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

const sales = [];
for (let i = 0; i < 72; i += 1) {
  const d = new Date(Date.UTC(2020, i + 1, 0)); // month-end
  const month = d.getUTCMonth() + 1;
  const trend = 520 + 4.2 * i;
  const seasonal = SEASONAL[month];
  const noise = 1 + 0.03 * nextNormal();
  sales.push({
    d: d.toISOString().slice(0, 10),
    month,
    observed: Number((trend * seasonal * noise).toFixed(1)),
    trend: Number(trend.toFixed(1)),
    seasonal,
    noise: Number(noise.toFixed(4)),
  });
}

write('m9-moneymart-monthly.json', {
  source: 'notebooks/09a_decomposition.ipynb — trend and seasonal indices verbatim',
  noiseNote: 'noise is a seeded stand-in at the notebook’s own sigma of 0.03',
  units: 'INR crore per month',
  seasonalIndex: SEASONAL,
  series: sales,
});

/* -------------------------------- M10 · random-walk parameters from NIFTY */

const dailyLogReturns = [];
for (let i = 1; i < prices.length; i += 1) {
  dailyLogReturns.push(Math.log(prices[i].close / prices[i - 1].close));
}
const mu = dailyLogReturns.reduce((a, b) => a + b, 0) / dailyLogReturns.length;
const sd = Math.sqrt(
  dailyLogReturns.reduce((s, r) => s + (r - mu) ** 2, 0) / (dailyLogReturns.length - 1),
);

write('m10-walk-params.json', {
  source: 'data/nifty50_prices.csv — drift and volatility estimated from its own daily log returns',
  muDaily: Number(mu.toFixed(8)),
  sigmaDaily: Number(sd.toFixed(8)),
  annualisedDriftPct: Number((mu * 252 * 100).toFixed(2)),
  annualisedVolPct: Number((sd * Math.sqrt(252) * 100).toFixed(1)),
  startLevel: Number(prices[prices.length - 1].close.toFixed(2)),
  startDate: prices[prices.length - 1].date,
  horizonDays: 252,
});

/* --------------------------------------------- M11 · the 11A toy book */

write('m11-orderbook.json', {
  source: 'notebooks/11a_order_book.ipynb — the toy book, verbatim',
  units: 'INR; qty in shares',
  bids: [
    { price: 99.95, qty: 400 },
    { price: 99.9, qty: 900 },
    { price: 99.85, qty: 1500 },
    { price: 99.8, qty: 2200 },
    { price: 99.75, qty: 3000 },
  ],
  asks: [
    { price: 100.05, qty: 350 },
    { price: 100.1, qty: 800 },
    { price: 100.15, qty: 1400 },
    { price: 100.2, qty: 2100 },
    { price: 100.25, qty: 2900 },
  ],
});

/* ------------------------------------------ M12 · two-asset frontier inputs */

const universe = readCsv('data/nse_stock_universe.csv').map((r) => ({
  date: r.date,
  ticker: r.ticker,
  sector: r.sector,
  close: num(r.close),
}));

const seriesFor = (ticker) =>
  universe
    .filter((r) => r.ticker === ticker && r.close !== null)
    .sort((a, b) => (a.date < b.date ? -1 : 1));

const statsFor = (ticker) => {
  const rows = seriesFor(ticker);
  const rets = [];
  for (let i = 1; i < rows.length; i += 1) rets.push(Math.log(rows[i].close / rows[i - 1].close));
  const m = rets.reduce((a, b) => a + b, 0) / rets.length;
  const s = Math.sqrt(rets.reduce((acc, r) => acc + (r - m) ** 2, 0) / (rets.length - 1));
  return {
    ticker,
    sector: rows[0].sector,
    rets,
    annReturnPct: Number((m * 252 * 100).toFixed(1)),
    annVolPct: Number((s * Math.sqrt(252) * 100).toFixed(1)),
  };
};

// Two different sectors, both with a positive drift, and neither is
// TATAMOTORS — that ticker carries the registry's unadjusted 1:5 split, which
// is Module 11's landmine and would make its 87% "volatility" a data artefact.
const A = statsFor('NESTLEIND.NS');
const B = statsFor('SBIN.NS');

const n = Math.min(A.rets.length, B.rets.length);
const ra = A.rets.slice(-n);
const rb = B.rets.slice(-n);
const ma = ra.reduce((a, b) => a + b, 0) / n;
const mb = rb.reduce((a, b) => a + b, 0) / n;
let cov = 0;
let va = 0;
let vb = 0;
for (let i = 0; i < n; i += 1) {
  cov += (ra[i] - ma) * (rb[i] - mb);
  va += (ra[i] - ma) ** 2;
  vb += (rb[i] - mb) ** 2;
}
const observedCorr = cov / Math.sqrt(va * vb);

write('m12-two-asset.json', {
  source: 'data/nse_stock_universe.csv — annualised from each ticker’s own daily log returns',
  note: 'TATAMOTORS excluded: its unadjusted 1:5 split (registry quirk a) inflates measured volatility.',
  observedCorrelation: Number(observedCorr.toFixed(3)),
  assets: [
    { ticker: A.ticker, sector: A.sector, annReturnPct: A.annReturnPct, annVolPct: A.annVolPct },
    { ticker: B.ticker, sector: B.sector, annReturnPct: B.annReturnPct, annVolPct: B.annVolPct },
  ],
});

console.log('✔ chart data pre-baked into public/chart-data/');
