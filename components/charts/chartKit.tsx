'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import tokens from '@/schema/tokens.json';
import { ChartSkeleton } from './ChartSkeleton';

export { ChartSkeleton };

/**
 * Shared chart plumbing: theme pulled from tokens.json, a data hook that reads
 * the pre-baked extracts, and the card shell every module chart sits in.
 *
 * No colour or type value is defined here — they all come from tokens.json, so
 * a token change moves the charts too.
 */

export const CHART = {
  palette: tokens.color.chart,
  grid: tokens.color.border,
  axis: tokens.color.textMuted,
  ink: tokens.color.text,
  surface: tokens.color.surface,
  bg: tokens.color.bg,
  part: tokens.color.part,
  semantic: tokens.color.semantic,
  fontSize: 11,
  /** recharts wants numbers, and tokens are rem strings */
  tick: { fill: tokens.color.textMuted, fontSize: 11 },
} as const;

/** True when the visitor has asked for less motion. Re-checks on change. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return;
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  return reduced;
}

/** Fetches a pre-baked extract from /chart-data. */
export function useChartData<T>(file: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    fetch(`/chart-data/${file}`)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        return r.json();
      })
      .then((json) => live && setData(json as T))
      .catch((e: Error) => live && setError(e.message));
    return () => {
      live = false;
    };
  }, [file]);

  return { data, error };
}

/* ------------------------------------------------------------------- shell */

export function ChartFrame({
  title,
  caption,
  source,
  controls,
  readout,
  height = 260,
  children,
  accent = tokens.color.primary,
}: {
  title: string;
  /** the one line stating what to notice */
  caption: string;
  /** where the numbers came from */
  source?: string;
  controls?: ReactNode;
  readout?: ReactNode;
  height?: number;
  children: ReactNode;
  accent?: string;
}) {
  return (
    <figure className="widget not-prose card overflow-hidden">
      <figcaption className="border-b border-border bg-surface px-4 py-3">
        <h4 className="text-base font-semibold text-ink">{title}</h4>
        <p className="mt-1 text-sm text-muted">
          <span className="font-medium" style={{ color: accent }}>
            What to notice:
          </span>{' '}
          {caption}
        </p>
      </figcaption>

      {controls && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
          {controls}
        </div>
      )}

      {/* Fixed height keeps the chart from reflowing as data arrives. */}
      <div className="px-1 py-3 sm:px-3" style={{ height, minHeight: height }}>
        {children}
      </div>

      {readout && <div className="border-t border-border px-4 py-3">{readout}</div>}

      {source && (
        <p className="border-t border-border bg-surface/60 px-4 py-2 text-xs text-muted">
          Source: <code className="font-mono text-[0.95em]">{source}</code>
        </p>
      )}
    </figure>
  );
}


export function ChartError({ what, detail }: { what: string; detail?: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded-md border border-dashed border-warn/40 bg-warn/[0.05] px-4 text-center text-sm text-muted">
      Couldn&apos;t load {what}
      {detail ? ` — ${detail}` : ''}. The prose below still stands on its own.
    </div>
  );
}

/* ----------------------------------------------------------------- controls */

/** A segmented toggle. Real buttons, so Tab and Enter work. */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  accent = tokens.color.primary,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  accent?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</span>
      <div className="inline-flex overflow-hidden rounded-full border border-border" role="group" aria-label={label}>
        {options.map((o) => {
          const on = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
              aria-pressed={on}
              className={`px-3 py-1 text-xs font-semibold transition-colors duration-fast ease-token ${
                on ? 'text-white' : 'text-muted hover:bg-surface hover:text-ink'
              }`}
              style={on ? { background: accent } : undefined}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** A labelled range input with a live value readout. */
export function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format = (v: number) => String(v),
  accent = tokens.color.primary,
  id,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  accent?: string;
  id: string;
}) {
  return (
    <div className="min-w-[13rem] flex-1">
      <label htmlFor={id} className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</span>
        <span className="font-mono text-xs font-semibold tabular-nums text-ink">
          {format(value)}
        </span>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full"
        style={{ accentColor: accent }}
      />
    </div>
  );
}

/** Tooltip body shared by the charts, styled from tokens. */
export function tooltipStyle() {
  return {
    contentStyle: {
      background: tokens.color.bg,
      border: `1px solid ${tokens.color.border}`,
      borderRadius: tokens.radius.md,
      fontSize: 12,
      boxShadow: tokens.shadow.card,
      color: tokens.color.text,
    },
    labelStyle: { color: tokens.color.textMuted, fontSize: 11, marginBottom: 2 },
    itemStyle: { padding: 0 },
  } as const;
}

/** Small stat tiles used under several charts. */
export function Readout({ items }: { items: { label: string; value: string; hint?: string; tone?: string }[] }) {
  return (
    <dl className="grid gap-3 sm:grid-cols-3">
      {items.map((i) => (
        <div key={i.label} className="rounded-md border border-border bg-surface p-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{i.label}</dt>
          <dd className="mt-0.5 text-lg font-semibold tabular-nums" style={{ color: i.tone ?? tokens.color.text }}>
            {i.value}
          </dd>
          {i.hint && <dd className="text-xs text-muted">{i.hint}</dd>}
        </div>
      ))}
    </dl>
  );
}

export const fmt = {
  inr: (v: number, dp = 0) => `₹${v.toLocaleString('en-IN', { minimumFractionDigits: dp, maximumFractionDigits: dp })}`,
  cr: (v: number, dp = 0) => `₹${v.toLocaleString('en-IN', { minimumFractionDigits: dp, maximumFractionDigits: dp })} cr`,
  pct: (v: number, dp = 1) => `${v.toFixed(dp)}%`,
  num: (v: number, dp = 0) => v.toLocaleString('en-IN', { minimumFractionDigits: dp, maximumFractionDigits: dp }),
};

export function useMemoisedIds(prefix: string, n: number) {
  return useMemo(() => Array.from({ length: n }, (_, i) => `${prefix}-${i}`), [prefix, n]);
}
