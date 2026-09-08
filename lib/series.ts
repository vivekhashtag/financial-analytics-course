import fs from 'node:fs';
import path from 'node:path';
import { cache } from 'react';
import { getDataset, ROOT } from './content';

/**
 * Derivations from the real price series in /data, computed on the server at
 * build time so the widgets that need them ship plain numbers to the browser.
 *
 * Nothing here is invented: every figure comes out of
 * `data/nifty50_prices.csv`, and the dates the registry documents as defects
 * are read from `data/datasets.json` rather than hardcoded.
 */

export interface Close {
  date: string;
  close: number;
}

/** Rows with a usable close, in file order. */
export const getCloses = cache((datasetId = 'nifty50_prices'): Close[] => {
  const ds = getDataset(datasetId);
  if (!ds) return [];

  const file = path.join(ROOT, ds.file);
  if (!fs.existsSync(file)) return [];

  const [header, ...lines] = fs.readFileSync(file, 'utf8').trim().split(/\r?\n/);
  const cols = header.split(',');
  const dateAt = cols.indexOf('date');
  const closeAt = cols.indexOf('close');
  if (dateAt === -1 || closeAt === -1) return [];

  return lines
    .map((line) => line.split(','))
    .map((c) => ({ date: c[dateAt], close: Number.parseFloat(c[closeAt]) }))
    .filter((r) => !!r.date && Number.isFinite(r.close));
});

/* ------------------------------------------------------- return distribution */

export interface DistributionBin {
  /** bin centre, in standard deviations from the mean */
  z: number;
  observed: number;
  /** what a normal curve with the same mean and sd would put here */
  normal: number;
}

export interface TailRow {
  k: number;
  observed: number;
  normal: number;
}

export interface ReturnDistribution {
  count: number;
  meanPct: number;
  sdPct: number;
  annualisedVolPct: number;
  bins: DistributionBin[];
  binWidth: number;
  tails: TailRow[];
  worst: { date: string; pct: number };
  best: { date: string; pct: number };
}

/** Standard normal CDF, via an Abramowitz–Stegun erf approximation. */
function normalCdf(z: number): number {
  const sign = Math.sign(z);
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * x);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t +
      0.254829592) *
      t *
      Math.exp(-x * x);
  return 0.5 * (1 + sign * y);
}

const TAIL_THRESHOLDS = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

export const getReturnDistribution = cache(
  (datasetId = 'nifty50_prices'): ReturnDistribution | null => {
    const rows = getCloses(datasetId);
    if (rows.length < 30) return null;

    const returns: { date: string; r: number }[] = [];
    for (let i = 1; i < rows.length; i += 1) {
      returns.push({ date: rows[i].date, r: Math.log(rows[i].close / rows[i - 1].close) });
    }

    const n = returns.length;
    const mean = returns.reduce((s, x) => s + x.r, 0) / n;
    const sd = Math.sqrt(returns.reduce((s, x) => s + (x.r - mean) ** 2, 0) / (n - 1));

    // Histogram in sigma units, ±5σ in quarter-sigma bins.
    const binWidth = 0.25;
    const limit = 5;
    const bins: DistributionBin[] = [];

    for (let edge = -limit; edge < limit; edge += binWidth) {
      const centre = edge + binWidth / 2;
      const observed = returns.filter((x) => {
        const z = (x.r - mean) / sd;
        return z >= edge && z < edge + binWidth;
      }).length;
      // Expected count = P(bin) × n, so the curve is directly comparable.
      const normal = (normalCdf(edge + binWidth) - normalCdf(edge)) * n;
      bins.push({ z: Number(centre.toFixed(3)), observed, normal: Number(normal.toFixed(2)) });
    }

    const tails: TailRow[] = TAIL_THRESHOLDS.map((k) => ({
      k,
      observed: returns.filter((x) => Math.abs((x.r - mean) / sd) >= k).length,
      normal: Number((2 * (1 - normalCdf(k)) * n).toFixed(2)),
    }));

    const sorted = [...returns].sort((a, b) => a.r - b.r);

    return {
      count: n,
      meanPct: Number((mean * 100).toFixed(4)),
      sdPct: Number((sd * 100).toFixed(3)),
      annualisedVolPct: Number((sd * Math.sqrt(252) * 100).toFixed(1)),
      bins,
      binWidth,
      tails,
      worst: { date: sorted[0].date, pct: Number((sorted[0].r * 100).toFixed(2)) },
      best: {
        date: sorted[sorted.length - 1].date,
        pct: Number((sorted[sorted.length - 1].r * 100).toFixed(2)),
      },
    };
  },
);

/* ------------------------------------------------------- trading calendar */

export type DayKind = 'trading' | 'special' | 'weekend' | 'holiday' | 'missing';

export interface CalendarDay {
  date: string;
  kind: DayKind;
  /** 0 = Sunday */
  weekday: number;
  /** ISO week index within the year, for the heatmap grid */
  week: number;
}

export interface TradingCalendar {
  years: number[];
  days: Record<number, CalendarDay[]>;
  counts: Record<DayKind, number>;
  /** dates the dataset registry documents as silently absent */
  documentedMissing: string[];
  /** sessions present on a weekend — the Muhurat trap */
  specialSessions: string[];
}

/** Dates named in a dataset's quirk descriptions, so nothing is hardcoded. */
function documentedMissingDates(datasetId: string): string[] {
  const ds = getDataset(datasetId);
  const quirk = ds?.quirks.find((q) => /absent/i.test(q.quirk));
  return quirk ? [...quirk.quirk.matchAll(/\d{4}-\d{2}-\d{2}/g)].map((m) => m[0]) : [];
}

export const getTradingCalendar = cache(
  (datasetId = 'nifty50_prices'): TradingCalendar | null => {
    const rows = getCloses(datasetId);
    if (rows.length === 0) return null;

    const present = new Set(rows.map((r) => r.date));
    const documentedMissing = documentedMissingDates(datasetId);

    const days: Record<number, CalendarDay[]> = {};
    const counts: Record<DayKind, number> = {
      trading: 0,
      special: 0,
      weekend: 0,
      holiday: 0,
      missing: 0,
    };
    const specialSessions: string[] = [];

    const start = new Date(`${rows[0].date}T00:00:00Z`);
    const end = new Date(`${rows[rows.length - 1].date}T00:00:00Z`);
    const firstOfYear: Record<number, Date> = {};

    for (const d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
      const iso = d.toISOString().slice(0, 10);
      const year = d.getUTCFullYear();
      const weekday = d.getUTCDay();
      const isWeekend = weekday === 0 || weekday === 6;
      const here = present.has(iso);

      let kind: DayKind;
      if (here && isWeekend) {
        kind = 'special'; // a session on a weekend: the Muhurat trap
        specialSessions.push(iso);
      } else if (here) kind = 'trading';
      else if (isWeekend) kind = 'weekend';
      else if (documentedMissing.includes(iso)) kind = 'missing';
      else kind = 'holiday';

      counts[kind] += 1;

      firstOfYear[year] ??= new Date(Date.UTC(year, 0, 1));
      const dayOfYear = Math.floor(
        (d.getTime() - firstOfYear[year].getTime()) / 86_400_000,
      );
      const week = Math.floor((dayOfYear + firstOfYear[year].getUTCDay()) / 7);

      (days[year] ??= []).push({ date: iso, kind, weekday, week });
    }

    return {
      years: Object.keys(days).map(Number).sort(),
      days,
      counts,
      documentedMissing,
      specialSessions,
    };
  },
);

/* ---------------------------------------------------------- drawdown episode */

export interface CrisisStep {
  label: string;
  date: string;
  close: number;
  note: string;
}

export interface CrisisEpisode {
  /** the whole series, thinned for plotting */
  series: Close[];
  peak: Close;
  trough: Close;
  recovery: Close | null;
  drawdownPct: number;
  /** trading days from peak to trough */
  fallDays: number;
  /** trading days from trough back to the old high, null if never */
  recoveryDays: number | null;
  steps: CrisisStep[];
}

export const getCrisisEpisode = cache(
  (datasetId = 'nifty50_prices'): CrisisEpisode | null => {
    const rows = getCloses(datasetId);
    if (rows.length < 60) return null;

    let runPeak = -Infinity;
    let runPeakDate = rows[0].date;
    let worst = 0;
    let peak: Close = rows[0];
    let trough: Close = rows[0];

    for (const r of rows) {
      if (r.close > runPeak) {
        runPeak = r.close;
        runPeakDate = r.date;
      }
      const dd = r.close / runPeak - 1;
      if (dd < worst) {
        worst = dd;
        peak = { date: runPeakDate, close: runPeak };
        trough = r;
      }
    }

    const peakIndex = rows.findIndex((r) => r.date === peak.date);
    const troughIndex = rows.findIndex((r) => r.date === trough.date);
    const recovery = rows.slice(troughIndex).find((r) => r.close >= peak.close) ?? null;
    const recoveryIndex = recovery ? rows.findIndex((r) => r.date === recovery.date) : -1;

    const drawdownPct = Number((worst * 100).toFixed(1));
    const fallDays = troughIndex - peakIndex;
    const recoveryDays = recovery ? recoveryIndex - troughIndex : null;

    // Every figure below is read off the series above.
    const steps: CrisisStep[] = [
      {
        label: 'The high',
        date: peak.date,
        close: peak.close,
        note: 'The last time the index was worth this much. Every drawdown is measured from a peak like this one.',
      },
      {
        label: 'The fall',
        date: rows[Math.floor((peakIndex + troughIndex) / 2)].date,
        close: rows[Math.floor((peakIndex + troughIndex) / 2)].close,
        note: `Halfway down. ${fallDays} trading days separate the high from the low — slow enough that each single day looks survivable.`,
      },
      {
        label: 'The low',
        date: trough.date,
        close: trough.close,
        note: `${drawdownPct}% below the peak. These are the rows an outlier filter would delete, and the only rows that tell you what the strategy costs when it is wrong.`,
      },
      ...(recovery
        ? [
            {
              label: 'Back to even',
              date: recovery.date,
              close: recovery.close,
              note: `${recoveryDays} trading days after the low to reclaim the old high. Trim the fall and the recovery has nothing to recover from.`,
            },
          ]
        : []),
    ];

    // Thin to roughly weekly so the path stays small without changing shape.
    const stride = Math.max(1, Math.round(rows.length / 320));
    const series = rows.filter(
      (r, i) =>
        i % stride === 0 ||
        r.date === peak.date ||
        r.date === trough.date ||
        r.date === recovery?.date ||
        i === rows.length - 1,
    );

    return { series, peak, trough, recovery, drawdownPct, fallDays, recoveryDays, steps };
  },
);
