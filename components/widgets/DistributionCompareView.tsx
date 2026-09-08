'use client';

import Link from 'next/link';
import { useId, useMemo, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import tokens from '@/schema/tokens.json';
import type { ReturnDistribution } from '@/lib/series';

/**
 * Histogram of daily returns in sigma units, with the normal curve laid over
 * it, and a threshold slider that counts the tails on both sides.
 *
 * Inline SVG and a range input — no chart library. The bars and the curve are
 * the same units (expected count), so they are directly comparable by eye.
 */
export function DistributionCompareView({
  dist,
  datasetTitle,
  datasetId,
}: {
  dist: ReturnDistribution;
  datasetTitle: string;
  datasetId: string;
}) {
  const sliderId = useId();
  const [k, setK] = useState(3);

  const observed = tokens.color.part.A;
  const normal = tokens.color.part.D;
  const danger = tokens.color.semantic.danger;

  const tail = useMemo(
    () => dist.tails.find((t) => t.k === k) ?? dist.tails[dist.tails.length - 1],
    [dist.tails, k],
  );

  // Plot geometry. Fixed viewBox so the SVG scales without reflowing.
  const W = 640;
  const H = 240;
  const padL = 44;
  const padR = 12;
  const padT = 12;
  const padB = 34;

  const maxCount = Math.max(...dist.bins.map((b) => Math.max(b.observed, b.normal)));
  const xOf = (z: number) => padL + ((z + 5) / 10) * (W - padL - padR);
  const yOf = (c: number) => H - padB - (c / maxCount) * (H - padT - padB);
  const barW = ((W - padL - padR) / 10) * dist.binWidth;

  const curve = dist.bins
    .map((b, i) => `${i === 0 ? 'M' : 'L'} ${xOf(b.z).toFixed(1)} ${yOf(b.normal).toFixed(1)}`)
    .join(' ');

  const ratio = tail.normal > 0 ? tail.observed / tail.normal : 0;
  const years = Number((dist.count / 252).toFixed(1));
  // "One in N trading days" under each model, expressed in years for scale.
  const normalYears =
    tail.normal > 0 ? Number((dist.count / tail.normal / 252).toFixed(1)) : Infinity;
  const observedYears =
    tail.observed > 0 ? Number((dist.count / tail.observed / 252).toFixed(1)) : Infinity;

  return (
    <figure className="widget not-prose card overflow-hidden">
      <figcaption className="border-b border-border bg-surface px-4 py-3">
        <h4 className="flex items-center gap-2 text-base font-semibold text-ink">
          <Icon name="trending-up" size={16} style={{ color: observed }} />
          Real returns vs the bell curve
        </h4>
        <p className="mt-1 text-sm text-muted">
          {dist.count.toLocaleString('en-IN')} daily returns from{' '}
          <Link href={`/data/${datasetId}`} className="font-medium accent-text">
            {datasetTitle}
          </Link>{' '}
          — about {years} years. Daily σ {dist.sdPct}%, annualised {dist.annualisedVolPct}%.
        </p>
      </figcaption>

      <div className="px-2 pt-3 sm:px-4">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Histogram of daily returns with a normal curve overlaid. Beyond ${k} sigma, ${tail.observed} days observed against ${tail.normal} expected.`}>
          <title>Return distribution vs normal</title>

          {/* tail shading for the current threshold */}
          <rect x={xOf(-5)} y={padT} width={xOf(-k) - xOf(-5)} height={H - padT - padB} fill={danger} opacity="0.07" />
          <rect x={xOf(k)} y={padT} width={xOf(5) - xOf(k)} height={H - padT - padB} fill={danger} opacity="0.07" />

          {/* axes */}
          <line x1={padL} y1={H - padB} x2={W - padR} y2={H - padB} stroke={tokens.color.border} />
          {[-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5].map((z) => (
            <g key={z}>
              <line x1={xOf(z)} y1={H - padB} x2={xOf(z)} y2={H - padB + 4} stroke={tokens.color.border} />
              <text x={xOf(z)} y={H - padB + 16} textAnchor="middle" className="font-body text-[10px] tabular-nums" fill={tokens.color.textMuted}>
                {z}σ
              </text>
            </g>
          ))}
          <text x={padL - 8} y={yOf(maxCount) + 4} textAnchor="end" className="font-body text-[10px] tabular-nums" fill={tokens.color.textMuted}>
            {Math.round(maxCount)}
          </text>
          <text x={padL - 8} y={H - padB} textAnchor="end" className="font-body text-[10px]" fill={tokens.color.textMuted}>
            0
          </text>

          {/* observed bars */}
          {dist.bins.map((b) => {
            const inTail = Math.abs(b.z) >= k;
            const h = Math.max(0, H - padB - yOf(b.observed));
            return (
              <rect
                key={b.z}
                x={xOf(b.z) - barW / 2}
                y={yOf(b.observed)}
                width={Math.max(1, barW - 1)}
                height={h}
                fill={inTail ? danger : observed}
                opacity={inTail ? 0.85 : 0.5}
                rx="1"
              />
            );
          })}

          {/* the normal curve, in the same units */}
          <path d={curve} fill="none" stroke={normal} strokeWidth="2.5" strokeLinejoin="round" />

          {/* threshold markers */}
          {[-k, k].map((z) => (
            <line key={z} x1={xOf(z)} y1={padT} x2={xOf(z)} y2={H - padB} stroke={danger} strokeWidth="1.5" strokeDasharray="4 3" />
          ))}
        </svg>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 px-4 pb-1 text-xs">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-4 rounded-sm" style={{ background: observed, opacity: 0.5 }} aria-hidden="true" />
          Observed
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-[3px] w-4 rounded-full" style={{ background: normal }} aria-hidden="true" />
          Normal curve, same mean and σ
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-4 rounded-sm" style={{ background: danger, opacity: 0.85 }} aria-hidden="true" />
          Beyond ±{k}σ
        </span>
      </div>

      {/* the control */}
      <div className="border-t border-border px-4 py-4">
        <label htmlFor={sliderId} className="text-xs font-semibold uppercase tracking-wide text-muted">
          Tail threshold — ±{k}σ
        </label>
        <input
          id={sliderId}
          type="range"
          min={1}
          max={5}
          step={0.5}
          value={k}
          onChange={(e) => setK(Number(e.target.value))}
          className="mt-2 w-full accent-[--accent]"
          style={{ accentColor: danger }}
        />

        <dl className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border border-border bg-surface p-3">
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
              Normal expects
            </dt>
            <dd className="mt-0.5 text-lg font-semibold tabular-nums text-ink">
              {tail.normal < 1 ? tail.normal.toFixed(2) : Math.round(tail.normal)} days
            </dd>
            <dd className="text-xs text-muted">
              {Number.isFinite(normalYears) ? `about one every ${normalYears} years` : 'effectively never'}
            </dd>
          </div>

          <div
            className="rounded-md border p-3"
            style={{ borderColor: `${danger}55`, background: `color-mix(in srgb, ${danger} 6%, white)` }}
          >
            <dt className="text-xs font-semibold uppercase tracking-wide" style={{ color: danger }}>
              Actually observed
            </dt>
            <dd className="mt-0.5 text-lg font-semibold tabular-nums text-ink">
              {tail.observed} days
            </dd>
            <dd className="text-xs text-muted">
              {Number.isFinite(observedYears) ? `about one every ${observedYears} years` : 'none in this series'}
            </dd>
          </div>

          <div className="rounded-md border border-border bg-surface p-3">
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
              Reality / model
            </dt>
            <dd className="mt-0.5 text-lg font-semibold tabular-nums text-ink">
              {tail.normal > 0 ? `${ratio.toFixed(1)}×` : '—'}
            </dd>
            <dd className="text-xs text-muted">
              {ratio >= 1.5
                ? 'the bell curve is understating this tail'
                : ratio <= 0.75
                  ? 'thinner than normal here'
                  : 'close to normal at this threshold'}
            </dd>
          </div>
        </dl>

        <p className="mt-3 text-xs text-muted">
          Worst day in the series: {dist.worst.pct}% on {dist.worst.date}. Best: +{dist.best.pct}%
          on {dist.best.date}. Push the slider past 3σ and watch the ratio move — that gap is what
          Module 10 exists to model.
        </p>
      </div>
    </figure>
  );
}
