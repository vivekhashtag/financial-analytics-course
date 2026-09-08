'use client';

import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
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

interface Year {
  year: string;
  revenue: number;
  stores: number;
  ticket: number;
}
interface Payload {
  source: string;
  years: Year[];
}

/**
 * M5 · Variance waterfall — MoneyMart's revenue bridge, year on year.
 *
 * Decomposed the way Lesson 5.2 does it: freeze one baseline at a time, and
 * the interaction term is what's left over. Here the two drivers are the ones
 * the data actually carries — store count and revenue per store — which is
 * exactly the "more stores or more sales per store?" question the prose asks.
 *
 * The bridge always reconciles: store + productivity + interaction = ΔRevenue.
 */
export default function M5VarianceWaterfall() {
  const { data, error } = useChartData<Payload>('m5-financials.json');
  const reduced = usePrefersReducedMotion();
  const [pairIndex, setPairIndex] = useState<string>('');
  const [isolated, setIsolated] = useState<string | null>(null);

  const pairs = useMemo(() => {
    if (!data) return [];
    return data.years.slice(1).map((y, i) => ({
      key: String(i),
      label: `${data.years[i].year} → ${y.year}`,
      from: data.years[i],
      to: y,
    }));
  }, [data]);

  // Default to the COVID year the prose keeps pointing at: the first fall.
  const defaultKey = useMemo(() => {
    const fall = pairs.find((p) => p.to.revenue < p.from.revenue);
    return fall?.key ?? pairs[pairs.length - 1]?.key ?? '0';
  }, [pairs]);

  const active = pairs.find((p) => p.key === (pairIndex || defaultKey));

  if (error) return <ChartError what="MoneyMart's P&L" detail={error} />;
  if (!data || !active) return <ChartSkeleton height={280} />;

  const { from, to } = active;
  const rpsFrom = from.revenue / from.stores;
  const rpsTo = to.revenue / to.stores;

  const storeEffect = (to.stores - from.stores) * rpsFrom;
  const productivityEffect = (rpsTo - rpsFrom) * from.stores;
  const interaction = (to.stores - from.stores) * (rpsTo - rpsFrom);
  const delta = to.revenue - from.revenue;

  // Waterfall via a transparent base bar plus the visible step.
  const steps = [
    { name: from.year, value: from.revenue, kind: 'total' as const },
    { name: 'Stores', value: storeEffect, kind: 'step' as const },
    { name: 'Per store', value: productivityEffect, kind: 'step' as const },
    { name: 'Interaction', value: interaction, kind: 'step' as const },
    { name: to.year, value: to.revenue, kind: 'total' as const },
  ];

  let running = 0;
  const bars = steps.map((s) => {
    if (s.kind === 'total') {
      running = s.value;
      return { ...s, base: 0, size: s.value, from: 0, to: s.value };
    }
    const start = running;
    running += s.value;
    return {
      ...s,
      base: Math.min(start, running),
      size: Math.abs(s.value),
      from: start,
      to: running,
    };
  });

  const shown = isolated ? bars.filter((b) => b.kind === 'total' || b.name === isolated) : bars;

  const colourFor = (b: (typeof bars)[number]) => {
    if (b.kind === 'total') return CHART.part.C;
    if (b.name === 'Interaction') return CHART.part.B;
    return b.value >= 0 ? CHART.semantic.success : CHART.semantic.danger;
  };

  const reconciles = Math.abs(storeEffect + productivityEffect + interaction - delta) < 0.01;

  return (
    <ChartFrame
      title="Why did revenue move?"
      caption="the two drivers plus their interaction must add up to the change exactly — that reconciliation is the whole discipline."
      source={data.source}
      accent={CHART.part.B}
      height={280}
      controls={
        <>
          <Segmented
            label="Years"
            value={pairIndex || defaultKey}
            accent={CHART.part.B}
            onChange={(v) => {
              setPairIndex(v);
              setIsolated(null);
            }}
            options={pairs.map((p) => ({ value: p.key, label: p.label.replace(/FY/g, '') }))}
          />
          {isolated && (
            <button type="button" onClick={() => setIsolated(null)} className="btn-ghost px-2 py-1 text-xs">
              Show all steps
            </button>
          )}
        </>
      }
      readout={
        <>
          <Readout
            items={[
              {
                label: 'More stores',
                value: `${storeEffect >= 0 ? '+' : ''}${fmt.cr(storeEffect, 0)}`,
                hint: `${from.stores} → ${to.stores} stores`,
                tone: storeEffect >= 0 ? CHART.semantic.success : CHART.semantic.danger,
              },
              {
                label: 'Per-store sales',
                value: `${productivityEffect >= 0 ? '+' : ''}${fmt.cr(productivityEffect, 0)}`,
                hint: `${fmt.cr(rpsFrom, 1)} → ${fmt.cr(rpsTo, 1)} each`,
                tone: productivityEffect >= 0 ? CHART.semantic.success : CHART.semantic.danger,
              },
              {
                label: 'Total change',
                value: `${delta >= 0 ? '+' : ''}${fmt.cr(delta, 0)}`,
                hint: reconciles ? 'bridge reconciles exactly' : 'bridge does NOT reconcile',
                tone: CHART.part.C,
              },
            ]}
          />
          <p className="mt-3 text-sm text-muted">
            Click any step to isolate it. The <strong className="text-ink">interaction</strong>{' '}
            term exists because new stores also earn the new per-store rate — it is the price of
            freezing one baseline at a time, not an error.
          </p>
        </>
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={shown} margin={{ top: 16, right: 10, left: 4, bottom: 4 }}>
          <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={CHART.tick} stroke={CHART.grid} interval={0} />
          <YAxis
            tick={CHART.tick}
            stroke={CHART.grid}
            width={58}
            tickFormatter={(v: number) => fmt.num(Math.round(v))}
          />
          <Tooltip
            {...tooltipStyle()}
            formatter={(_v: number, _n, item) => {
              const b = item?.payload as (typeof bars)[number];
              return [
                b.kind === 'total' ? fmt.cr(b.value, 1) : `${b.value >= 0 ? '+' : ''}${fmt.cr(b.value, 1)}`,
                b.kind === 'total' ? 'Revenue' : 'Contribution',
              ];
            }}
          />
          {/* invisible pedestal */}
          <Bar dataKey="base" stackId="w" fill="transparent" isAnimationActive={false} />
          <Bar
            dataKey="size"
            stackId="w"
            radius={[3, 3, 0, 0]}
            isAnimationActive={!reduced}
            animationDuration={400}
            onClick={(d) => {
              const b = d?.payload as (typeof bars)[number] | undefined;
              if (b && b.kind === 'step') setIsolated((cur) => (cur === b.name ? null : b.name));
            }}
            className="cursor-pointer"
          >
            {shown.map((b) => (
              <Cell key={b.name} fill={colourFor(b)} fillOpacity={isolated && b.name !== isolated && b.kind === 'step' ? 0.3 : 0.9} />
            ))}
            <LabelList
              dataKey="value"
              position="top"
              formatter={(v: number) => (Math.abs(v) > 40 ? Math.round(v).toLocaleString('en-IN') : '')}
              style={{ fill: CHART.axis, fontSize: 10 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
