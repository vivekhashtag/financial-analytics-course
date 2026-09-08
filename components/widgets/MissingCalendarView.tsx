'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import tokens from '@/schema/tokens.json';
import type { CalendarDay, DayKind, TradingCalendar } from '@/lib/series';

/**
 * A year of trading days as a week × weekday grid, plus a naive-fill toggle
 * that shows what forward-filling the gaps would fabricate.
 *
 * Keyboard: each gap day is a real button, so Tab reaches every one and the
 * explanation appears on focus as well as hover.
 */

const KIND: Record<DayKind, { label: string; colour: string; why: string; expected: boolean }> = {
  trading: {
    label: 'Traded',
    colour: tokens.color.part.A,
    why: 'A normal session. The file has a row for this day.',
    expected: true,
  },
  special: {
    label: 'Weekend session',
    colour: tokens.color.part.capstone,
    why: 'A session on a weekend — the Diwali Muhurat trap. Looks like an error, is real data. A rule that stripped non-weekday rows would delete it.',
    expected: true,
  },
  weekend: {
    label: 'Weekend',
    colour: tokens.color.border,
    why: 'Expected gap. The market is shut; there is nothing to fill.',
    expected: true,
  },
  holiday: {
    label: 'Holiday',
    colour: tokens.color.semantic.warn,
    why: 'Expected gap. A weekday with no session — an exchange holiday. You need the trading calendar to know that.',
    expected: true,
  },
  missing: {
    label: 'Problem gap',
    colour: tokens.color.semantic.danger,
    why: 'A weekday the exchange was open and the file has no row for. Invisible unless you check against the calendar. The registry documents this one.',
    expected: false,
  },
};

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function MissingCalendarView({
  calendar,
  datasetTitle,
  datasetId,
}: {
  calendar: TradingCalendar;
  datasetTitle: string;
  datasetId: string;
}) {
  const [year, setYear] = useState(
    // Open on the year that contains the first documented gap, so the point is
    // visible without hunting for it.
    calendar.documentedMissing[0]
      ? Number(calendar.documentedMissing[0].slice(0, 4))
      : calendar.years[0],
  );
  const [naiveFill, setNaiveFill] = useState(false);
  const [active, setActive] = useState<CalendarDay | null>(null);

  const days = calendar.days[year] ?? [];
  const weeks = Math.max(...days.map((d) => d.week)) + 1;

  const cell = 13;
  const gap = 2;
  const padTop = 16;
  const padLeft = 18;
  const W = padLeft + weeks * (cell + gap);
  const H = padTop + 7 * (cell + gap);

  const fillable = days.filter((d) => d.kind === 'holiday' || d.kind === 'missing');
  const yearMissing = days.filter((d) => d.kind === 'missing');

  return (
    <figure className="widget not-prose card overflow-hidden">
      <figcaption className="border-b border-border bg-surface px-4 py-3">
        <h4 className="flex items-center gap-2 text-base font-semibold text-ink">
          <Icon name="table" size={16} className="text-primary" />
          Which days are actually there?
        </h4>
        <p className="mt-1 text-sm text-muted">
          Every calendar day in{' '}
          <Link href={`/data/${datasetId}`} className="font-medium accent-text">
            {datasetTitle}
          </Link>
          , coloured by what it is. Hover or Tab to a cell for the reason.
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {calendar.years.map((y) => (
            <button
              key={y}
              type="button"
              onClick={() => setYear(y)}
              aria-pressed={y === year}
              className={
                y === year
                  ? 'btn rounded-full bg-primary px-3 py-1 text-xs tabular-nums text-white'
                  : 'btn rounded-full border border-border px-3 py-1 text-xs tabular-nums text-muted hover:bg-surface hover:text-ink'
              }
            >
              {y}
            </button>
          ))}
        </div>
      </figcaption>

      <div className="overflow-x-auto px-4 pt-4">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width={W}
          height={H}
          className="max-w-full"
          role="img"
          aria-label={`${year}: ${days.filter((d) => d.kind === 'trading' || d.kind === 'special').length} sessions, ${yearMissing.length} problem gaps`}
        >
          {WEEKDAYS.map((w, i) => (
            <text
              key={i}
              x={padLeft - 6}
              y={padTop + i * (cell + gap) + cell - 3}
              textAnchor="end"
              className="font-body text-[8px]"
              fill={tokens.color.textMuted}
            >
              {i % 2 === 1 ? w : ''}
            </text>
          ))}

          {days.map((d) => {
            const meta = KIND[d.kind];
            const filled = naiveFill && (d.kind === 'holiday' || d.kind === 'missing');
            const isActive = active?.date === d.date;
            const interactive = d.kind !== 'weekend';

            return (
              <g key={d.date}>
                <rect
                  x={padLeft + d.week * (cell + gap)}
                  y={padTop + d.weekday * (cell + gap)}
                  width={cell}
                  height={cell}
                  rx="2.5"
                  fill={filled ? tokens.color.part.A : meta.colour}
                  opacity={filled ? 0.45 : d.kind === 'weekend' ? 0.5 : 0.9}
                  stroke={isActive ? tokens.color.text : filled ? tokens.color.semantic.danger : 'none'}
                  strokeWidth={isActive ? 1.5 : filled ? 1.2 : 0}
                  strokeDasharray={filled && !isActive ? '2 2' : undefined}
                />
                {interactive && (
                  <rect
                    x={padLeft + d.week * (cell + gap)}
                    y={padTop + d.weekday * (cell + gap)}
                    width={cell}
                    height={cell}
                    fill="transparent"
                    tabIndex={0}
                    role="button"
                    aria-label={`${d.date}: ${meta.label}`}
                    className="cursor-pointer focus:outline-none"
                    onMouseEnter={() => setActive(d)}
                    onFocus={() => setActive(d)}
                    onMouseLeave={() => setActive((a) => (a?.date === d.date ? null : a))}
                    onBlur={() => setActive((a) => (a?.date === d.date ? null : a))}
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* readout */}
      <div className="px-4 pb-1 pt-3">
        {active ? (
          <div
            className="rounded-md border-l-4 bg-surface p-3 animate-slide-open"
            style={{ borderColor: KIND[active.kind].colour }}
          >
            <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink">
              <span className="font-mono tabular-nums">{active.date}</span>
              <span className="chip" style={{ background: `${KIND[active.kind].colour}1f`, color: KIND[active.kind].colour }}>
                {KIND[active.kind].label}
              </span>
              {!KIND[active.kind].expected && (
                <span className="text-xs font-medium" style={{ color: tokens.color.semantic.danger }}>
                  not expected
                </span>
              )}
            </p>
            <p className="mt-1 text-sm text-muted">{KIND[active.kind].why}</p>
          </div>
        ) : (
          <p className="rounded-md border border-dashed border-border p-3 text-sm text-muted">
            Hover or Tab to any coloured cell to see which category the day falls into.
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 px-4 py-3 text-xs">
        {(Object.entries(KIND) as [DayKind, (typeof KIND)[DayKind]][]).map(([kind, meta]) => (
          <span key={kind} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: meta.colour, opacity: 0.9 }} aria-hidden="true" />
            {meta.label}
            <span className="tabular-nums text-muted/70">
              ({days.filter((d) => d.kind === kind).length})
            </span>
          </span>
        ))}
      </div>

      {/* the naive-fill toggle */}
      <div className="border-t border-border bg-surface/60 px-4 py-3">
        <label className="flex cursor-pointer items-start gap-2.5 text-sm">
          <input
            type="checkbox"
            checked={naiveFill}
            onChange={() => setNaiveFill((v) => !v)}
            className="sr-only"
          />
          <span
            aria-hidden="true"
            className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-sm border transition-all duration-fast ease-token ${
              naiveFill ? 'border-transparent text-white' : 'border-border bg-bg'
            }`}
            style={naiveFill ? { background: tokens.color.semantic.danger } : undefined}
          >
            {naiveFill && <Icon name="check" size={12} strokeWidth={3} />}
          </span>
          <span className="text-ink">
            Show what a naive forward-fill would do
            <span className="block text-xs text-muted">
              &quot;Reindex to every weekday and carry the last price forward&quot; — the one-liner
              that looks like cleaning.
            </span>
          </span>
        </label>

        {naiveFill && (
          <p
            className="mt-3 rounded-md border-l-4 p-3 text-sm animate-slide-open"
            style={{
              borderColor: tokens.color.semantic.danger,
              background: `color-mix(in srgb, ${tokens.color.semantic.danger} 6%, white)`,
            }}
          >
            <span className="font-semibold text-ink">
              {fillable.length} fabricated rows in {year}
            </span>{' '}
            — {days.filter((d) => d.kind === 'holiday').length} exchange holidays the market was
            shut, plus {yearMissing.length} genuine gap
            {yearMissing.length === 1 ? '' : 's'}. Each carries the previous close, so each
            reports a <strong>0% return</strong> on a day that never traded. That understates
            volatility, invents a price nobody could have dealt at, and hides the one defect worth
            finding.
          </p>
        )}
      </div>
    </figure>
  );
}
