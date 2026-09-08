'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { useProgress } from '@/components/progress/ProgressProvider';
import tokens from '@/schema/tokens.json';
import type { CrisisEpisode } from '@/lib/series';

/**
 * Annotated price line with a stepper. Each step highlights its own region of
 * the chart and carries one line of why it matters.
 *
 * A "trim the crisis" toggle redraws the line with the drawdown window cut out,
 * which is the point the prose is making: the trimmed series looks calmer and
 * is useless exactly when it is needed.
 */
export function CrisisChartView({
  episode,
  datasetTitle,
  datasetId,
}: {
  episode: CrisisEpisode;
  datasetTitle: string;
  datasetId: string;
}) {
  const { hydrated, setWidget } = useProgress();
  const [step, setStep] = useState(0);
  const [trimmed, setTrimmed] = useState(false);

  const accent = tokens.color.part.D;
  const danger = tokens.color.semantic.danger;

  const W = 640;
  const H = 210;
  const padL = 46;
  const padR = 12;
  const padT = 14;
  const padB = 28;

  const { series, peak, trough, recovery, drawdownPct, steps } = episode;

  const t0 = new Date(series[0].date).getTime();
  const t1 = new Date(series[series.length - 1].date).getTime();
  const lo = Math.min(...series.map((s) => s.close));
  const hi = Math.max(...series.map((s) => s.close));

  const xOf = (date: string) =>
    padL + ((new Date(date).getTime() - t0) / (t1 - t0)) * (W - padL - padR);
  const yOf = (v: number) => H - padB - ((v - lo) / (hi - lo)) * (H - padT - padB);

  // The drawdown window, and the series with it removed.
  const inWindow = (d: string) => d >= peak.date && d <= (recovery?.date ?? trough.date);
  const shown = useMemo(
    () => (trimmed ? series.filter((s) => !inWindow(s.date)) : series),
    [series, trimmed], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const line = shown
    .map((s, i) => `${i === 0 ? 'M' : 'L'} ${xOf(s.date).toFixed(1)} ${yOf(s.close).toFixed(1)}`)
    .join(' ');

  const current = steps[step];
  // Each step shades from the previous marker to its own.
  const regionFrom = step === 0 ? series[0].date : steps[step - 1].date;

  const go = (i: number) => {
    setStep(i);
    if (hydrated && i === steps.length - 1) {
      setWidget(datasetId === 'nifty50_prices' ? '01-data-foundations' : datasetId, 'crisisChart:walked', true);
    }
  };

  return (
    <figure className="widget not-prose card overflow-hidden">
      <figcaption className="border-b border-border bg-surface px-4 py-3">
        <h4 className="flex items-center gap-2 text-base font-semibold text-ink">
          <Icon name="flame" size={16} style={{ color: accent }} />
          The deepest drawdown in your own data
        </h4>
        <p className="mt-1 text-sm text-muted">
          {drawdownPct}% from peak to trough in{' '}
          <Link href={`/data/${datasetId}`} className="font-medium accent-text">
            {datasetTitle}
          </Link>
          . 2008 and March 2020 predate this series — this is the crisis it actually contains.
        </p>
      </figcaption>

      <div className="px-2 pt-3 sm:px-4">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full"
          role="img"
          aria-label={`Price line with the ${drawdownPct}% drawdown from ${peak.date} to ${trough.date} highlighted. Current step: ${current.label}.`}
        >
          <title>Drawdown episode</title>

          {/* the drawdown window */}
          {!trimmed && (
            <rect
              x={xOf(peak.date)}
              y={padT}
              width={xOf(recovery?.date ?? trough.date) - xOf(peak.date)}
              height={H - padT - padB}
              fill={danger}
              opacity="0.06"
            />
          )}

          {/* the current step's region */}
          <rect
            x={xOf(regionFrom)}
            y={padT}
            width={Math.max(2, xOf(current.date) - xOf(regionFrom))}
            height={H - padT - padB}
            fill={accent}
            opacity="0.14"
            style={{ transition: 'all 300ms cubic-bezier(.16,.84,.44,1)' }}
          />

          {/* axis */}
          <line x1={padL} y1={H - padB} x2={W - padR} y2={H - padB} stroke={tokens.color.border} />
          {[lo, (lo + hi) / 2, hi].map((v) => (
            <g key={v}>
              <line x1={padL} y1={yOf(v)} x2={W - padR} y2={yOf(v)} stroke={tokens.color.border} opacity="0.5" />
              <text x={padL - 6} y={yOf(v) + 3} textAnchor="end" className="font-body text-[9px] tabular-nums" fill={tokens.color.textMuted}>
                {Math.round(v).toLocaleString('en-IN')}
              </text>
            </g>
          ))}
          {[series[0].date, series[series.length - 1].date].map((d, i) => (
            <text
              key={d}
              x={i === 0 ? padL : W - padR}
              y={H - padB + 15}
              textAnchor={i === 0 ? 'start' : 'end'}
              className="font-body text-[9px] tabular-nums"
              fill={tokens.color.textMuted}
            >
              {d}
            </text>
          ))}

          {/* the line */}
          <path
            d={line}
            fill="none"
            stroke={trimmed ? tokens.color.textMuted : tokens.color.part.A}
            strokeWidth="1.8"
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeDasharray={trimmed ? '5 4' : undefined}
          />

          {/* every step marker, the current one enlarged */}
          {steps.map((s, i) => (
            <g key={s.date}>
              <circle
                cx={xOf(s.date)}
                cy={yOf(s.close)}
                r={i === step ? 6 : 3.5}
                fill={i === step ? accent : tokens.color.bg}
                stroke={accent}
                strokeWidth="2"
                style={{ transition: 'r 200ms cubic-bezier(.16,.84,.44,1)' }}
              />
            </g>
          ))}
        </svg>
      </div>

      {/* stepper */}
      <div className="border-t border-border px-4 py-4">
        <ol className="flex flex-wrap gap-1.5" role="tablist" aria-label="Episode steps">
          {steps.map((s, i) => (
            <li key={s.date}>
              <button
                role="tab"
                aria-selected={i === step}
                type="button"
                onClick={() => go(i)}
                className={
                  i === step
                    ? 'btn rounded-full px-3 py-1 text-xs text-white'
                    : 'btn rounded-full border border-border px-3 py-1 text-xs text-muted hover:bg-surface hover:text-ink'
                }
                style={i === step ? { background: accent } : undefined}
              >
                {s.label}
              </button>
            </li>
          ))}
        </ol>

        <div className="mt-3 rounded-md border-l-4 bg-surface p-3" style={{ borderColor: accent }}>
          <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink">
            {current.label}
            <span className="font-mono text-xs tabular-nums text-muted">
              {current.date} · {Math.round(current.close).toLocaleString('en-IN')}
            </span>
          </p>
          <p className="mt-1 text-sm text-muted">{current.note}</p>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => go(Math.max(0, step - 1))}
            disabled={step === 0}
            className="btn-secondary px-3 py-1.5 text-xs"
          >
            <Icon name="arrow-left" size={13} /> Back
          </button>
          <button
            type="button"
            onClick={() => go(Math.min(steps.length - 1, step + 1))}
            disabled={step === steps.length - 1}
            className="btn-primary px-3 py-1.5 text-xs"
          >
            Next <Icon name="arrow-right" size={13} />
          </button>
        </div>
      </div>

      <div className="border-t border-border bg-surface/60 px-4 py-3">
        <label className="flex cursor-pointer items-start gap-2.5 text-sm">
          <input
            type="checkbox"
            checked={trimmed}
            onChange={() => setTrimmed((v) => !v)}
            className="sr-only"
          />
          <span
            aria-hidden="true"
            className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-sm border transition-all duration-fast ease-token ${
              trimmed ? 'border-transparent text-white' : 'border-border bg-bg'
            }`}
            style={trimmed ? { background: danger } : undefined}
          >
            {trimmed && <Icon name="check" size={12} strokeWidth={3} />}
          </span>
          <span className="text-ink">
            Trim the crisis as an outlier
            <span className="block text-xs text-muted">
              What the series looks like once the &quot;anomalous&quot; window is removed.
            </span>
          </span>
        </label>

        {trimmed && (
          <p
            className="mt-3 rounded-md border-l-4 p-3 text-sm animate-slide-open"
            style={{
              borderColor: danger,
              background: `color-mix(in srgb, ${danger} 6%, white)`,
            }}
          >
            The line is calmer and the worst case has vanished. A risk model fitted to{' '}
            <em>this</em> series would price a {Math.abs(drawdownPct)}% fall as impossible — and
            it would be right up until the moment it mattered.
          </p>
        )}
      </div>
    </figure>
  );
}
