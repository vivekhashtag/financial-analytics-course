'use client';

import { useId, useMemo, useState } from 'react';
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
  Readout,
  Slider,
  fmt,
  tooltipStyle,
  useChartData,
  usePrefersReducedMotion,
} from './chartKit';

interface Payload {
  source: string;
  series: { m: string; c: number }[];
}

/**
 * M6 · Forecast harness — NIFTY monthly closes, naive vs trend.
 *
 * Module 6's rule: the split is a **date**, and naive is the floor. Both
 * forecasts are fitted on the training window only and scored on the test
 * window only, so nothing here has seen the future.
 *
 * Naive     : every test month = the last training close.
 * Trend     : ordinary least squares on the training window, extrapolated.
 *
 * The point of the slider is that the winner is not stable — move the split
 * and the ranking changes, which is why one split is one exam.
 */
export default function M6ForecastHarness() {
  const { data, error } = useChartData<Payload>('m6-nifty-monthly.json');
  const reduced = usePrefersReducedMotion();
  const [splitPct, setSplitPct] = useState(70);
  const sliderId = useId();

  const model = useMemo(() => {
    if (!data) return null;
    const s = data.series;
    const n = s.length;
    // Keep at least 12 months of training and 6 of test.
    const cut = Math.min(n - 6, Math.max(12, Math.round((splitPct / 100) * n)));

    const train = s.slice(0, cut);
    const test = s.slice(cut);

    // OLS on index → close, training window only.
    const meanX = (train.length - 1) / 2;
    const meanY = train.reduce((a, b) => a + b.c, 0) / train.length;
    let sxy = 0;
    let sxx = 0;
    train.forEach((p, i) => {
      sxy += (i - meanX) * (p.c - meanY);
      sxx += (i - meanX) ** 2;
    });
    const slope = sxx === 0 ? 0 : sxy / sxx;
    const intercept = meanY - slope * meanX;

    const naiveLevel = train[train.length - 1].c;

    const rows = s.map((p, i) => ({
      m: p.m,
      actual: p.c,
      naive: i >= cut ? naiveLevel : null,
      trend: i >= cut ? intercept + slope * i : null,
      fitted: i < cut ? intercept + slope * i : null,
    }));

    const err = (pick: (i: number) => number) => {
      let mae = 0;
      test.forEach((p, j) => {
        mae += Math.abs(p.c - pick(cut + j));
      });
      return mae / test.length;
    };

    const naiveMae = err(() => naiveLevel);
    const trendMae = err((i) => intercept + slope * i);

    return {
      rows,
      cut,
      splitMonth: s[cut].m,
      trainMonths: train.length,
      testMonths: test.length,
      naiveMae,
      trendMae,
      winner: trendMae < naiveMae ? 'Trend' : 'Naive',
      margin: Math.abs(trendMae - naiveMae),
    };
  }, [data, splitPct]);

  if (error) return <ChartError what="NIFTY monthly closes" detail={error} />;
  if (!data || !model) return <ChartSkeleton height={300} />;

  const naiveWins = model.winner === 'Naive';

  return (
    <ChartFrame
      title="Move the split, watch the winner change"
      caption="the split is a date, and one split is one exam — drag it and see the ranking flip."
      source={data.source}
      accent={CHART.part.B}
      height={300}
      controls={
        <Slider
          id={sliderId}
          label="Train / test split"
          value={splitPct}
          min={25}
          max={90}
          step={1}
          accent={CHART.part.B}
          onChange={setSplitPct}
          format={() => `${model.splitMonth} · ${model.trainMonths} train / ${model.testMonths} test`}
        />
      }
      readout={
        <>
          <Readout
            items={[
              {
                label: 'Naive MAE',
                value: fmt.num(model.naiveMae, 0),
                hint: 'tomorrow = today',
                tone: naiveWins ? CHART.semantic.success : undefined,
              },
              {
                label: 'Trend MAE',
                value: fmt.num(model.trendMae, 0),
                hint: 'OLS fitted on train only',
                tone: !naiveWins ? CHART.semantic.success : undefined,
              },
              {
                label: 'Winner',
                value: model.winner,
                hint: `by ${fmt.num(model.margin, 0)} index points`,
                tone: CHART.part.B,
              },
            ]}
          />
          <p className="mt-3 text-sm text-muted">
            {naiveWins ? (
              <>
                <strong className="text-ink">Naive is winning at this split.</strong> That is the
                module&apos;s floor doing its job: a model that loses to &quot;tomorrow = today&quot;
                is not a model, it is overhead.
              </>
            ) : (
              <>
                Trend edges it here — but move the split a few months and check whether that
                survives. A win at one split is <strong className="text-ink">one exam</strong>, not
                a result.
              </>
            )}
          </p>
        </>
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={model.rows} margin={{ top: 6, right: 12, left: 4, bottom: 4 }}>
          <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="m" tick={CHART.tick} stroke={CHART.grid} minTickGap={40} />
          <YAxis
            tick={CHART.tick}
            stroke={CHART.grid}
            width={54}
            domain={['dataMin - 600', 'dataMax + 600']}
            tickFormatter={(v: number) => fmt.num(Math.round(v))}
          />
          <Tooltip
            {...tooltipStyle()}
            formatter={(v: number, name: string) => [fmt.num(v, 0), name]}
          />
          <ReferenceLine
            x={model.splitMonth}
            stroke={CHART.semantic.danger}
            strokeDasharray="4 3"
            label={{ value: 'split', position: 'top', fill: CHART.semantic.danger, fontSize: 10 }}
          />
          <Line name="Actual" type="monotone" dataKey="actual" stroke={CHART.part.A} strokeWidth={1.8} dot={false} isAnimationActive={!reduced} animationDuration={350} />
          <Line name="Fit (train)" type="monotone" dataKey="fitted" stroke={CHART.axis} strokeWidth={1.2} strokeDasharray="2 3" dot={false} isAnimationActive={false} />
          <Line name="Naive" type="monotone" dataKey="naive" stroke={CHART.part.D} strokeWidth={2} dot={false} isAnimationActive={!reduced} animationDuration={350} />
          <Line name="Trend" type="monotone" dataKey="trend" stroke={CHART.part.capstone} strokeWidth={2} dot={false} isAnimationActive={!reduced} animationDuration={350} />
        </LineChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
