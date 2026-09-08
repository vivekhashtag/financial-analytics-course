'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  CHART,
  ChartError,
  ChartFrame,
  ChartSkeleton,
  Readout,
  Segmented,
  fmt,
  tooltipStyle,
  useChartData,
  usePrefersReducedMotion,
} from './chartKit';

interface Payload {
  source: string;
  muDaily: number;
  sigmaDaily: number;
  annualisedDriftPct: number;
  annualisedVolPct: number;
  startLevel: number;
  startDate: string;
  horizonDays: number;
}

/** Deterministic PRNG — seed discipline is Module 10's own rule. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PCTS = [5, 25, 50, 75, 95] as const;
const SIZES = [
  { value: '100', label: '100' },
  { value: '1000', label: '1,000' },
  { value: '5000', label: '5,000' },
] as const;

/**
 * M10 · Simulation fan — paths grown from the real series' own parameters.
 *
 * Prices compound, so paths are built multiplicatively: S(t+1) = S(t)·exp(r),
 * r ~ Normal(mu, sigma) with mu and sigma estimated from nifty50_prices.csv.
 * The seed is fixed and shown, because a result you can't reproduce isn't one.
 *
 * The run is chunked across animation frames — 5,000 paths × 252 steps is
 * 1.26M draws, which would jank the main thread in one synchronous loop.
 */
export default function M10SimulationFan() {
  const { data, error } = useChartData<Payload>('m10-walk-params.json');
  const reduced = usePrefersReducedMotion();
  const [size, setSize] = useState<'100' | '1000' | '5000'>('1000');
  const [seed, setSeed] = useState(42);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    bands: Record<string, number>[];
    belowStart: number;
    n: number;
    seed: number;
    median: number;
    p5: number;
    p95: number;
  } | null>(null);
  const cancel = useRef(false);
  const seedId = useId();

  const run = useCallback(
    (n: number, useSeed: number) => {
      if (!data) return;
      cancel.current = false;
      setProgress(0);
      setResult(null);

      const steps = data.horizonDays;
      const rand = mulberry32(useSeed);
      // Sampling grid: keep ~40 columns rather than 252, so the chart stays light.
      const gridEvery = Math.max(1, Math.round(steps / 40));
      const gridIdx: number[] = [];
      for (let t = 0; t <= steps; t += gridEvery) gridIdx.push(t);
      if (gridIdx[gridIdx.length - 1] !== steps) gridIdx.push(steps);

      const samples: Float64Array[] = gridIdx.map(() => new Float64Array(n));
      const finals = new Float64Array(n);

      let done = 0;
      const CHUNK = Math.max(20, Math.floor(n / 40));

      const step = () => {
        if (cancel.current) return;
        const until = Math.min(n, done + CHUNK);

        for (let i = done; i < until; i += 1) {
          let level = data.startLevel;
          let g = 0;
          if (gridIdx[0] === 0) {
            samples[0][i] = level;
            g = 1;
          }
          for (let t = 1; t <= steps; t += 1) {
            // Box–Muller from the seeded uniform stream.
            const u = Math.max(1e-12, rand());
            const v = rand();
            const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
            level *= Math.exp(data.muDaily + data.sigmaDaily * z);
            if (g < gridIdx.length && gridIdx[g] === t) {
              samples[g][i] = level;
              g += 1;
            }
          }
          finals[i] = level;
        }

        done = until;
        setProgress(Math.round((done / n) * 100));

        if (done < n) {
          requestAnimationFrame(step);
          return;
        }

        const quantile = (arr: Float64Array, q: number) => {
          const sorted = Array.from(arr).sort((a, b) => a - b);
          const idx = Math.min(sorted.length - 1, Math.floor((q / 100) * sorted.length));
          return sorted[idx];
        };

        const bands = gridIdx.map((t, gi) => {
          const row: Record<string, number> = { day: t };
          for (const p of PCTS) row[`p${p}`] = Number(quantile(samples[gi], p).toFixed(1));
          // Areas are stacked, so store widths not levels.
          row.lo = row.p5;
          row.band5to25 = row.p25 - row.p5;
          row.band25to75 = row.p75 - row.p25;
          row.band75to95 = row.p95 - row.p75;
          return row;
        });

        const below = Array.from(finals).filter((f) => f < data.startLevel).length;

        setResult({
          bands,
          belowStart: (below / n) * 100,
          n,
          seed: useSeed,
          median: quantile(finals, 50),
          p5: quantile(finals, 5),
          p95: quantile(finals, 95),
        });
      };

      requestAnimationFrame(step);
    },
    [data],
  );

  // First run once the parameters land.
  useEffect(() => {
    if (data) run(Number(size), seed);
    return () => {
      cancel.current = true;
    };
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) return <ChartError what="the simulation parameters" detail={error} />;
  if (!data) return <ChartSkeleton height={300} />;

  return (
    <ChartFrame
      title="Ten thousand futures, one at a time"
      caption="the fan is not a forecast — it is the range the same assumptions permit, and half of it is below where you started."
      source={data.source}
      accent={CHART.part.D}
      height={300}
      controls={
        <>
          <Segmented
            label="Paths"
            value={size}
            accent={CHART.part.D}
            onChange={(v) => {
              setSize(v);
              run(Number(v), seed);
            }}
            options={SIZES.map((s) => ({ value: s.value, label: s.label }))}
          />
          <div className="flex items-center gap-2">
            <label htmlFor={seedId} className="text-xs font-semibold uppercase tracking-wide text-muted">
              Seed
            </label>
            <input
              id={seedId}
              type="number"
              value={seed}
              min={1}
              max={9999}
              onChange={(e) => setSeed(Number(e.target.value) || 1)}
              className="w-20 rounded-md border border-border bg-bg px-2 py-1 font-mono text-xs tabular-nums text-ink outline-none focus:border-primary"
            />
          </div>
          <button type="button" onClick={() => run(Number(size), seed)} className="btn-primary px-3 py-1.5 text-xs">
            Run
          </button>
          {progress > 0 && progress < 100 && (
            <span className="text-xs tabular-nums text-muted">simulating… {progress}%</span>
          )}
        </>
      }
      readout={
        result ? (
          <>
            <Readout
              items={[
                {
                  label: 'P(end below start)',
                  value: fmt.pct(result.belowStart, 1),
                  hint: `of ${fmt.num(result.n)} paths`,
                  tone: CHART.semantic.danger,
                },
                {
                  label: 'Median outcome',
                  value: fmt.num(result.median, 0),
                  hint: `started at ${fmt.num(data.startLevel, 0)}`,
                },
                {
                  label: '5th – 95th',
                  value: `${fmt.num(result.p5, 0)} – ${fmt.num(result.p95, 0)}`,
                  hint: 'one year out',
                },
              ]}
            />
            <p className="mt-3 text-sm text-muted">
              Drift {data.annualisedDriftPct}% and volatility {data.annualisedVolPct}% a year, both
              estimated from the series itself. Seed{' '}
              <code className="font-mono">{result.seed}</code> — change it and the numbers move a
              little; if they move a lot, your reporting policy is too precise for your sample.
            </p>
          </>
        ) : (
          <p className="text-sm text-muted">Simulating {fmt.num(Number(size))} paths…</p>
        )
      }
    >
      {result ? (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={result.bands} margin={{ top: 6, right: 12, left: 4, bottom: 4 }}>
            <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="day"
              tick={CHART.tick}
              stroke={CHART.grid}
              minTickGap={36}
              tickFormatter={(d: number) => `${d}d`}
            />
            <YAxis
              tick={CHART.tick}
              stroke={CHART.grid}
              width={56}
              tickFormatter={(v: number) => fmt.num(Math.round(v))}
            />
            <Tooltip
              {...tooltipStyle()}
              formatter={(v: number, name: string) => [fmt.num(v, 0), name]}
              labelFormatter={(d) => `Day ${d}`}
            />
            <ReferenceLine
              y={data.startLevel}
              stroke={CHART.semantic.danger}
              strokeDasharray="4 3"
              label={{ value: 'start', position: 'right', fill: CHART.semantic.danger, fontSize: 10 }}
            />

            <Area name="p5" dataKey="lo" stackId="fan" stroke="none" fill="transparent" isAnimationActive={false} />
            <Area name="5–25%" dataKey="band5to25" stackId="fan" stroke="none" fill={CHART.part.D} fillOpacity={0.14} isAnimationActive={!reduced} animationDuration={450} />
            <Area name="25–75%" dataKey="band25to75" stackId="fan" stroke="none" fill={CHART.part.D} fillOpacity={0.3} isAnimationActive={!reduced} animationDuration={450} />
            <Area name="75–95%" dataKey="band75to95" stackId="fan" stroke="none" fill={CHART.part.D} fillOpacity={0.14} isAnimationActive={!reduced} animationDuration={450} />
            <Line name="Median" type="monotone" dataKey="p50" stroke={CHART.part.D} strokeWidth={2} dot={false} isAnimationActive={!reduced} animationDuration={450} />
          </ComposedChart>
        </ResponsiveContainer>
      ) : (
        <ChartSkeleton height={280} label={`Simulating ${fmt.num(Number(size))} paths… ${progress}%`} />
      )}
    </ChartFrame>
  );
}
