'use client';

import { useId, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  ReferenceDot,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import {
  CHART,
  ChartError,
  ChartFrame,
  ChartSkeleton,
  Readout,
  Slider,
  fmt,
  tooltipStyle,
  useChartData,
  usePrefersReducedMotion,
} from './chartKit';

interface Asset {
  ticker: string;
  sector: string;
  annReturnPct: number;
  annVolPct: number;
}
interface Payload {
  source: string;
  note: string;
  observedCorrelation: number;
  assets: Asset[];
}

/**
 * M12 · Two-asset frontier with a correlation dial.
 *
 * Exactly 12A's opening move: two real stocks, mixed in every proportion, then
 * the correlation dial is turned. At ρ = +1 the locus is a straight line and
 * mixing buys nothing; as ρ falls the line bows leftward, and portfolios appear
 * with less risk than either ingredient. That bend *is* diversification.
 *
 * Returns and volatilities are annualised from each ticker's own daily log
 * returns; only ρ is overridden by the slider, and the observed value is marked
 * so the learner can see how far they have moved from reality.
 */
export default function M12Frontier() {
  const { data, error } = useChartData<Payload>('m12-two-asset.json');
  const reduced = usePrefersReducedMotion();
  const [rho, setRho] = useState<number | null>(null);
  const rhoId = useId();

  const model = useMemo(() => {
    if (!data) return null;
    const [a, b] = data.assets;
    const r = rho ?? data.observedCorrelation;

    const sa = a.annVolPct / 100;
    const sb = b.annVolPct / 100;
    const ra = a.annReturnPct / 100;
    const rb = b.annReturnPct / 100;

    const points = Array.from({ length: 101 }, (_, i) => {
      const w = i / 100; // weight in asset A
      const variance = (w * sa) ** 2 + ((1 - w) * sb) ** 2 + 2 * w * (1 - w) * sa * sb * r;
      return {
        w,
        risk: Number((Math.sqrt(Math.max(0, variance)) * 100).toFixed(3)),
        ret: Number(((w * ra + (1 - w) * rb) * 100).toFixed(3)),
      };
    });

    // Closed-form minimum-variance weight for two assets.
    const denom = sa ** 2 + sb ** 2 - 2 * sa * sb * r;
    const wMin = denom === 0 ? 0.5 : Math.min(1, Math.max(0, (sb ** 2 - sa * sb * r) / denom));
    const minVar = points.reduce((best, p) => (p.risk < best.risk ? p : best), points[0]);

    return { a, b, r, points, wMin, minVar, sa: a.annVolPct, sb: b.annVolPct };
  }, [data, rho]);

  if (error) return <ChartError what="the two-asset stats" detail={error} />;
  if (!data || !model) return <ChartSkeleton height={300} />;

  const { a, b, r, points, minVar } = model;
  const lowerThanBoth = minVar.risk < Math.min(a.annVolPct, b.annVolPct) - 0.05;
  const isObserved = rho === null;

  return (
    <ChartFrame
      title="Turn the dial, watch the line bow"
      caption="at ρ = +1 the locus is straight and mixing buys nothing; drag ρ down and portfolios appear with less risk than either stock."
      source={data.source}
      accent={CHART.part.D}
      height={300}
      controls={
        <>
          <Slider
            id={rhoId}
            label="Correlation ρ"
            value={r}
            min={-1}
            max={1}
            step={0.05}
            accent={CHART.part.D}
            onChange={setRho}
            format={(v) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}${isObserved ? ' (observed)' : ''}`}
          />
          {!isObserved && (
            <button type="button" onClick={() => setRho(null)} className="btn-ghost px-2 py-1 text-xs">
              Back to observed {data.observedCorrelation >= 0 ? '+' : ''}
              {data.observedCorrelation}
            </button>
          )}
        </>
      }
      readout={
        <>
          <Readout
            items={[
              {
                label: 'Minimum variance',
                value: `${minVar.risk.toFixed(1)}% risk`,
                hint: `${Math.round(minVar.w * 100)}% ${a.ticker.replace('.NS', '')} / ${Math.round((1 - minVar.w) * 100)}% ${b.ticker.replace('.NS', '')}`,
                tone: CHART.part.C,
              },
              {
                label: a.ticker.replace('.NS', ''),
                value: `${a.annVolPct}% risk`,
                hint: `${a.annReturnPct}% return · ${a.sector}`,
              },
              {
                label: b.ticker.replace('.NS', ''),
                value: `${b.annVolPct}% risk`,
                hint: `${b.annReturnPct}% return · ${b.sector}`,
              },
            ]}
          />
          <p className="mt-3 text-sm text-muted">
            {lowerThanBoth ? (
              <>
                The calmest mix is{' '}
                <strong className="text-ink">
                  {(Math.min(a.annVolPct, b.annVolPct) - minVar.risk).toFixed(1)} points less risky
                </strong>{' '}
                than the safer of the two stocks — at no cost in expected return that either one
                gave you. That is the free lunch, bought purely with structure.
              </>
            ) : (
              <>
                At ρ = {r.toFixed(2)} the wobbles no longer cancel: the best you can do is a
                weighted average of the two risks. Push ρ below +1 and the bend returns.
              </>
            )}
          </p>
          <p className="mt-2 text-xs text-muted">{data.note}</p>
        </>
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 18, left: 4, bottom: 8 }}>
          <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="risk"
            name="Risk"
            tick={CHART.tick}
            stroke={CHART.grid}
            domain={[0, 'dataMax + 3']}
            tickFormatter={(v: number) => `${v}%`}
            label={{ value: 'annualised volatility', position: 'insideBottom', offset: -6, fill: CHART.axis, fontSize: 10 }}
          />
          <YAxis
            type="number"
            dataKey="ret"
            name="Return"
            tick={CHART.tick}
            stroke={CHART.grid}
            width={52}
            domain={['dataMin - 2', 'dataMax + 2']}
            tickFormatter={(v: number) => `${v}%`}
          />
          <ZAxis range={[24, 24]} />
          <Tooltip
            {...tooltipStyle()}
            formatter={(v: number, name: string) => [`${v.toFixed(1)}%`, name]}
            labelFormatter={() => ''}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as { w: number; risk: number; ret: number };
              return (
                <div
                  style={{
                    background: CHART.bg,
                    border: `1px solid ${CHART.grid}`,
                    borderRadius: 10,
                    padding: '8px 10px',
                    fontSize: 12,
                  }}
                >
                  <div style={{ color: CHART.axis, marginBottom: 2 }}>
                    {Math.round(p.w * 100)}% {a.ticker.replace('.NS', '')} /{' '}
                    {Math.round((1 - p.w) * 100)}% {b.ticker.replace('.NS', '')}
                  </div>
                  <div style={{ color: CHART.ink }}>
                    risk {p.risk.toFixed(1)}% · return {p.ret.toFixed(1)}%
                  </div>
                </div>
              );
            }}
          />

          <Scatter
            data={points}
            line={{ stroke: CHART.part.D, strokeWidth: 2.5 }}
            shape={() => <g />}
            isAnimationActive={!reduced}
            animationDuration={300}
          />

          {/* the two ingredients */}
          <ReferenceDot x={a.annVolPct} y={a.annReturnPct} r={6} fill={CHART.part.A} stroke={CHART.bg} strokeWidth={2} label={{ value: a.ticker.replace('.NS', ''), position: 'right', fill: CHART.axis, fontSize: 10 }} />
          <ReferenceDot x={b.annVolPct} y={b.annReturnPct} r={6} fill={CHART.part.B} stroke={CHART.bg} strokeWidth={2} label={{ value: b.ticker.replace('.NS', ''), position: 'right', fill: CHART.axis, fontSize: 10 }} />

          {/* the calmest point */}
          <ReferenceDot x={minVar.risk} y={minVar.ret} r={7} fill={CHART.part.C} stroke={CHART.bg} strokeWidth={2} label={{ value: 'min-variance', position: 'left', fill: CHART.part.C, fontSize: 10 }} />
        </ScatterChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
