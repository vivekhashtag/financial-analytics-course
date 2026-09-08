'use client';

import { useId, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
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
  Segmented,
  Slider,
  fmt,
  tooltipStyle,
  useChartData,
  usePrefersReducedMotion,
} from './chartKit';

interface Payload {
  source: string;
  rows: number;
  series: { d: string; c: number }[];
}

/**
 * M4 · Chart intent explorer — NIFTY closes, four ways.
 *
 * Module 4's lesson is that the chart is chosen by the *question*, not the
 * data. Same series, four framings: line vs area, linear vs log, over any
 * window. Log scale is the one that matters — it makes equal *percentage*
 * moves equal distances, which is the only honest way to compare a 2021 move
 * with a 2025 one.
 */
export default function M4ChartIntent() {
  const { data, error } = useChartData<Payload>('m4-nifty-daily.json');
  const reduced = usePrefersReducedMotion();
  const [mark, setMark] = useState<'line' | 'area'>('line');
  const [scale, setScale] = useState<'linear' | 'log'>('linear');
  const [from, setFrom] = useState(0);
  const [span, setSpan] = useState(100);
  const fromId = useId();
  const spanId = useId();

  const accent = CHART.part.B;

  const view = useMemo(() => {
    if (!data) return [];
    const n = data.series.length;
    const start = Math.floor((from / 100) * (n - 1));
    const length = Math.max(30, Math.round((span / 100) * n));
    return data.series.slice(start, Math.min(n, start + length));
  }, [data, from, span]);

  if (error) return <ChartError what="the NIFTY series" detail={error} />;
  if (!data) return <ChartSkeleton height={300} />;

  const first = view[0];
  const last = view[view.length - 1];
  const changePct = first && last ? ((last.c / first.c - 1) * 100) : 0;

  const common = {
    data: view,
    margin: { top: 6, right: 10, left: 4, bottom: 4 },
  };

  const axes = (
    <>
      <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
      <XAxis
        dataKey="d"
        tick={CHART.tick}
        stroke={CHART.grid}
        minTickGap={48}
        tickFormatter={(d: string) => d.slice(0, 7)}
      />
      <YAxis
        tick={CHART.tick}
        stroke={CHART.grid}
        width={54}
        scale={scale}
        domain={scale === 'log' ? ['auto', 'auto'] : ['dataMin - 400', 'dataMax + 400']}
        allowDataOverflow
        tickFormatter={(v: number) => fmt.num(Math.round(v))}
      />
      <Tooltip
        {...tooltipStyle()}
        formatter={(v: number) => [fmt.num(v, 2), 'Close']}
        labelFormatter={(d) => `${d}`}
      />
    </>
  );

  return (
    <ChartFrame
      title="Same data, four questions"
      caption="switch to log scale — equal percentage moves become equal distances, and the early years stop looking flat."
      source={data.source}
      accent={accent}
      height={300}
      controls={
        <>
          <Segmented
            label="Mark"
            value={mark}
            accent={accent}
            onChange={setMark}
            options={[
              { value: 'line', label: 'Line' },
              { value: 'area', label: 'Area' },
            ]}
          />
          <Segmented
            label="Scale"
            value={scale}
            accent={accent}
            onChange={setScale}
            options={[
              { value: 'linear', label: 'Linear' },
              { value: 'log', label: 'Log' },
            ]}
          />
          <Slider
            id={fromId}
            label="Window start"
            value={from}
            min={0}
            max={95}
            step={1}
            accent={accent}
            onChange={setFrom}
            format={() => first?.d ?? '—'}
          />
          <Slider
            id={spanId}
            label="Window length"
            value={span}
            min={5}
            max={100}
            step={1}
            accent={accent}
            onChange={setSpan}
            format={(v) => `${v}% · ${view.length} days`}
          />
        </>
      }
      readout={
        <p className="text-sm text-muted">
          Showing <strong className="text-ink">{view.length}</strong> of {data.rows} sessions,{' '}
          <span className="font-mono tabular-nums">{first?.d}</span> to{' '}
          <span className="font-mono tabular-nums">{last?.d}</span> —{' '}
          <strong style={{ color: changePct >= 0 ? CHART.semantic.success : CHART.semantic.danger }}>
            {changePct >= 0 ? '+' : ''}
            {changePct.toFixed(1)}%
          </strong>{' '}
          over the window. Narrow it and the same series tells a different story: that is the
          chart crime Module 4 teaches you to spot.
        </p>
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        {mark === 'line' ? (
          <LineChart {...common}>
            {axes}
            <Line
              type="monotone"
              dataKey="c"
              stroke={accent}
              strokeWidth={1.6}
              dot={false}
              isAnimationActive={!reduced}
              animationDuration={400}
            />
          </LineChart>
        ) : (
          <AreaChart {...common}>
            {axes}
            <defs>
              <linearGradient id="m4-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={accent} stopOpacity={0.35} />
                <stop offset="100%" stopColor={accent} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="c"
              stroke={accent}
              strokeWidth={1.6}
              fill="url(#m4-fill)"
              isAnimationActive={!reduced}
              animationDuration={400}
            />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </ChartFrame>
  );
}
