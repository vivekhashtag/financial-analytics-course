'use client';

import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
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
  fmt,
  tooltipStyle,
  useChartData,
  usePrefersReducedMotion,
} from './chartKit';

interface Payload {
  source: string;
  noiseNote: string;
  seasonalIndex: Record<string, number>;
  series: { d: string; month: number; observed: number; trend: number; seasonal: number; noise: number }[];
}

const LAYERS = [
  { key: 'observed', label: 'Observed', colour: CHART.part.A, width: 1.6 },
  { key: 'trendEst', label: 'Trend (12-mo centred MA)', colour: CHART.semantic.danger, width: 2 },
  { key: 'seasonalLine', label: 'Trend × seasonal', colour: CHART.part.D, width: 1.6 },
  { key: 'residual', label: 'Residual', colour: CHART.part.B, width: 1.2 },
] as const;

type LayerKey = (typeof LAYERS)[number]['key'];

/**
 * M9 · Decomposition explorer — MoneyMart monthly sales.
 *
 * observed = trend × seasonal × noise, the multiplicative world 9A builds.
 * The trend line here is the same estimator the notebook uses — a *centred*
 * 12-month moving average — which is why it goes blank at both ends. That
 * missing edge is not a bug in the chart; it is the honest defect the prose
 * calls out: the most recent trend is exactly what this estimator can't see.
 *
 * Deseasonalising divides the observation by its month's index, which is the
 * defence against "sales fell 30% from November, panic?"
 */
export default function M9Decomposition() {
  const { data, error } = useChartData<Payload>('m9-moneymart-monthly.json');
  const reduced = usePrefersReducedMotion();
  const [on, setOn] = useState<Record<LayerKey, boolean>>({
    observed: true,
    trendEst: true,
    seasonalLine: false,
    residual: false,
  });
  const [deseasonalised, setDeseasonalised] = useState(false);

  const rows = useMemo(() => {
    if (!data) return [];
    const s = data.series;

    // Centred 12-month moving average: blank until six months in, and blank
    // again for the last six. Matching the notebook exactly.
    const trendEst = s.map((_, i) => {
      if (i < 6 || i > s.length - 7) return null;
      let sum = 0;
      for (let k = i - 6; k <= i + 5; k += 1) sum += s[k].observed;
      return sum / 12;
    });

    return s.map((p, i) => {
      const t = trendEst[i];
      const shown = deseasonalised ? p.observed / p.seasonal : p.observed;
      return {
        d: p.d.slice(0, 7),
        observed: Number(shown.toFixed(1)),
        trendEst: t === null ? null : Number(t.toFixed(1)),
        seasonalLine: t === null ? null : Number((t * (deseasonalised ? 1 : p.seasonal)).toFixed(1)),
        residual: t === null ? null : Number(((p.observed / (t * p.seasonal)) * 100).toFixed(2)),
        seasonal: p.seasonal,
      };
    });
  }, [data, deseasonalised]);

  if (error) return <ChartError what="the sales series" detail={error} />;
  if (!data) return <ChartSkeleton height={300} />;

  const octIndex = data.seasonalIndex['10'];
  const decIndex = data.seasonalIndex['12'];
  const residualOn = on.residual;

  return (
    <ChartFrame
      title="Every series is a sentence"
      caption="the centred moving average goes blank at both ends — the most recent trend is precisely what it cannot see."
      source={data.source}
      accent={CHART.part.D}
      height={300}
      controls={
        <>
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">Layers</span>
          {LAYERS.map((l) => (
            <label
              key={l.key}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs"
              style={on[l.key] ? { borderColor: l.colour, color: l.colour } : undefined}
            >
              <input
                type="checkbox"
                checked={on[l.key]}
                onChange={() => setOn((o) => ({ ...o, [l.key]: !o[l.key] }))}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className="h-2 w-3.5 rounded-full"
                style={{ background: on[l.key] ? l.colour : CHART.grid }}
              />
              {l.label}
            </label>
          ))}

          <label className="ml-1 inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs"
            style={deseasonalised ? { borderColor: CHART.part.C, color: CHART.part.C } : undefined}
          >
            <input
              type="checkbox"
              checked={deseasonalised}
              onChange={() => setDeseasonalised((v) => !v)}
              className="sr-only"
            />
            Deseasonalise
          </label>
        </>
      }
      readout={
        <p className="text-sm text-muted">
          {deseasonalised ? (
            <>
              <strong className="text-ink">Deseasonalised.</strong> Each month is divided by its own
              index, so October&apos;s {octIndex} and December&apos;s {decIndex} stop shouting. The
              festive spike is gone and what remains is the trend you can actually judge — this is
              the answer to &quot;sales fell 30% from November, panic?&quot;
            </>
          ) : residualOn ? (
            <>
              The residual (right-hand scale, as % of expected) should be{' '}
              <strong className="text-ink">structureless wobble</strong>. If it still shows waves,
              the decomposition missed something and modelling should not proceed.
            </>
          ) : (
            <>
              October runs <strong className="text-ink">{Math.round((octIndex - 1) * 100)}% above</strong>{' '}
              trend and December <strong className="text-ink">{Math.round((1 - decIndex) * 100)}% below</strong>.
              Turn on &quot;trend × seasonal&quot; to see how much of the wiggle is just the calendar.
            </>
          )}
        </p>
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 6, right: 14, left: 4, bottom: 4 }}>
          <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="d" tick={CHART.tick} stroke={CHART.grid} minTickGap={36} />
          <YAxis
            yAxisId="level"
            tick={CHART.tick}
            stroke={CHART.grid}
            width={54}
            domain={['dataMin - 60', 'dataMax + 60']}
            tickFormatter={(v: number) => fmt.num(Math.round(v))}
          />
          {residualOn && (
            <YAxis
              yAxisId="resid"
              orientation="right"
              tick={CHART.tick}
              stroke={CHART.grid}
              width={44}
              domain={[85, 115]}
              tickFormatter={(v: number) => `${v}%`}
            />
          )}
          <Tooltip
            {...tooltipStyle()}
            formatter={(v: number, name: string) =>
              name === 'Residual' ? [`${v}%`, name] : [`${fmt.cr(v, 0)}`, name]
            }
          />
          {residualOn && <ReferenceLine yAxisId="resid" y={100} stroke={CHART.axis} strokeDasharray="3 3" />}

          {LAYERS.filter((l) => on[l.key]).map((l) => (
            <Line
              key={l.key}
              yAxisId={l.key === 'residual' ? 'resid' : 'level'}
              name={l.label}
              type="monotone"
              dataKey={l.key}
              stroke={l.colour}
              strokeWidth={l.width}
              dot={false}
              connectNulls={false}
              isAnimationActive={!reduced}
              animationDuration={350}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
