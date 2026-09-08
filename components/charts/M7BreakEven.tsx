'use client';

import { useId, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  CHART,
  ChartFrame,
  Readout,
  Slider,
  fmt,
  tooltipStyle,
  usePrefersReducedMotion,
} from './chartKit';

/**
 * M7 · Break-even belief — 7B's centrepiece chart.
 *
 * The scenario is stated exactly in Lesson 7.4: launch big now costs ₹120 cr
 * and returns ₹300 cr NPV if it works, ₹40 cr salvage if it flops; the pilot
 * costs ₹15 cr and buys the right to decide afterwards; doing nothing is zero.
 *
 *   Launch now : 300p + 40(1−p) − 120  =  260p − 80
 *   Pilot      : 180p − 15               (learn, then launch only if it works)
 *   Do nothing : 0
 *
 * Those give crossovers at p = 8.3% and p = 81.25%, which is exactly the
 * "below ~8%, do nothing … launch-now only overtakes near ~81%" the prose
 * states. No data file needed — the payoffs *are* the content.
 */

const COST_LAUNCH = 120;
const NPV_WORKS = 300;
const SALVAGE = 40;
const COST_PILOT = 15;

const emv = {
  launch: (p: number) => NPV_WORKS * p + SALVAGE * (1 - p) - COST_LAUNCH,
  pilot: (p: number) => (NPV_WORKS - COST_LAUNCH) * p - COST_PILOT,
  nothing: () => 0,
};

const BREAK_PILOT = COST_PILOT / (NPV_WORKS - COST_LAUNCH); // 0.0833
const BREAK_LAUNCH =
  (COST_LAUNCH - SALVAGE - COST_PILOT) / (NPV_WORKS - SALVAGE - (NPV_WORKS - COST_LAUNCH)); // 0.8125

const CHOICES = [
  { key: 'nothing', label: 'Do nothing', colour: CHART.axis },
  { key: 'launch', label: 'Launch big now', colour: CHART.part.D },
  { key: 'pilot', label: 'Pilot first', colour: CHART.part.C },
] as const;

export default function M7BreakEven() {
  const reduced = usePrefersReducedMotion();
  const [p, setP] = useState(0.55); // management's number
  const sliderId = useId();

  const rows = useMemo(
    () =>
      Array.from({ length: 101 }, (_, i) => {
        const prob = i / 100;
        return {
          p: prob,
          pLabel: `${i}%`,
          launch: Number(emv.launch(prob).toFixed(2)),
          pilot: Number(emv.pilot(prob).toFixed(2)),
          nothing: 0,
        };
      }),
    [],
  );

  const values = {
    launch: emv.launch(p),
    pilot: emv.pilot(p),
    nothing: emv.nothing(),
  };
  const best = (Object.entries(values) as [keyof typeof values, number][]).sort(
    (a, b) => b[1] - a[1],
  )[0];
  const bestChoice = CHOICES.find((c) => c.key === best[0])!;

  // The winning region for the current belief, for the shaded band.
  const region =
    p < BREAK_PILOT ? [0, BREAK_PILOT] : p < BREAK_LAUNCH ? [BREAK_PILOT, BREAK_LAUNCH] : [BREAK_LAUNCH, 1];

  return (
    <ChartFrame
      title="Stop arguing about the probability"
      caption="45% and 55% land on the same branch — the question is not “what is p?” but “is p above the break-even?”"
      source="Lesson 7.4 payoffs: ₹120 cr / ₹300 cr / ₹40 cr salvage / ₹15 cr pilot"
      accent={CHART.part.B}
      height={300}
      controls={
        <Slider
          id={sliderId}
          label="Belief: P(the concept works)"
          value={p}
          min={0}
          max={1}
          step={0.01}
          accent={CHART.part.B}
          onChange={setP}
          format={(v) => `${(v * 100).toFixed(0)}%`}
        />
      }
      readout={
        <>
          <Readout
            items={CHOICES.map((c) => ({
              label: c.label,
              value: `${values[c.key] >= 0 ? '+' : ''}${fmt.cr(values[c.key], 1)}`,
              hint: c.key === best[0] ? 'best at this belief' : '',
              tone: c.key === best[0] ? c.colour : undefined,
            }))}
          />
          <p className="mt-3 text-sm text-muted">
            Break-evens: below{' '}
            <strong className="text-ink tabular-nums">{(BREAK_PILOT * 100).toFixed(1)}%</strong> do
            nothing; between there and{' '}
            <strong className="text-ink tabular-nums">{(BREAK_LAUNCH * 100).toFixed(1)}%</strong>{' '}
            the pilot wins; only above that does launching now overtake it. Management said 55% —
            drag to 45% and the recommendation does not move.
          </p>
        </>
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 8, right: 14, left: 4, bottom: 4 }}>
          <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />

          {/* the region that currently wins */}
          <ReferenceArea
            x1={rows[Math.round(region[0] * 100)].pLabel}
            x2={rows[Math.round(region[1] * 100)].pLabel}
            fill={bestChoice.colour}
            fillOpacity={0.1}
          />

          <XAxis
            dataKey="pLabel"
            tick={CHART.tick}
            stroke={CHART.grid}
            minTickGap={28}
            label={{ value: 'P(works)', position: 'insideBottomRight', offset: -2, fill: CHART.axis, fontSize: 10 }}
          />
          <YAxis
            tick={CHART.tick}
            stroke={CHART.grid}
            width={56}
            tickFormatter={(v: number) => `${v}`}
            label={{ value: '₹ cr EMV', angle: -90, position: 'insideLeft', fill: CHART.axis, fontSize: 10 }}
          />
          <Tooltip
            {...tooltipStyle()}
            formatter={(v: number, name: string) => [fmt.cr(v, 1), name]}
            labelFormatter={(l) => `P(works) = ${l}`}
          />

          <ReferenceLine y={0} stroke={CHART.axis} strokeWidth={1} />
          {[BREAK_PILOT, BREAK_LAUNCH].map((b) => (
            <ReferenceLine
              key={b}
              x={rows[Math.round(b * 100)].pLabel}
              stroke={CHART.semantic.danger}
              strokeDasharray="4 3"
            />
          ))}

          {CHOICES.map((c) => (
            <Line
              key={c.key}
              name={c.label}
              type="linear"
              dataKey={c.key}
              stroke={c.colour}
              strokeWidth={c.key === best[0] ? 3 : 1.8}
              dot={false}
              isAnimationActive={!reduced}
              animationDuration={300}
            />
          ))}

          <ReferenceDot
            x={rows[Math.round(p * 100)].pLabel}
            y={values[best[0]]}
            r={5}
            fill={bestChoice.colour}
            stroke={CHART.bg}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
