'use client';

import { useInView } from '@/components/motion/Reveal';
import tokens from '@/schema/tokens.json';

/**
 * A bid/ask ladder whose depth bars breathe.
 *
 * MDX-embeddable: `<OrderBookMini />`. Intended for Module 11, where the real
 * `OrderBookViewer` eventually lives; this is the small, honest version — a
 * static ladder that looks alive, not a simulation pretending to be live data.
 *
 * The breathing is a scaleX transform on 10 bars, staggered so the book looks
 * like it is being worked. One of the two permitted looping effects.
 */

const LEVELS = [
  { px: 18412.4, bid: 0.92, ask: 0.44 },
  { px: 18412.2, bid: 0.68, ask: 0.61 },
  { px: 18412.0, bid: 0.81, ask: 0.35 },
  { px: 18411.8, bid: 0.47, ask: 0.78 },
  { px: 18411.6, bid: 0.6, ask: 0.52 },
];

export function OrderBookMini({ title }: { title?: string }) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.3 });

  const bid = tokens.color.semantic.success;
  const ask = tokens.color.semantic.danger;

  return (
    <figure ref={ref} className="widget not-prose card overflow-hidden">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border bg-surface px-4 py-2.5">
        <h4 className="text-sm font-semibold text-ink">{title ?? 'The order book'}</h4>
        <p className="text-xs text-muted">
          Bids below, asks above — the spread is the price of immediacy.
        </p>
      </figcaption>

      <div className="p-4">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-3 gap-y-1.5">
          <span className="text-right text-[0.7rem] font-semibold uppercase tracking-wide" style={{ color: bid }}>
            Bid size
          </span>
          <span className="text-center text-[0.7rem] font-semibold uppercase tracking-wide text-muted">
            Price
          </span>
          <span className="text-[0.7rem] font-semibold uppercase tracking-wide" style={{ color: ask }}>
            Ask size
          </span>

          {LEVELS.map((level, i) => (
            <Row
              key={level.px}
              level={level}
              index={i}
              active={inView}
              bidColor={bid}
              askColor={ask}
            />
          ))}
        </div>

        <p className="mt-4 border-t border-border pt-3 text-xs text-muted">
          Illustrative depth, not live data. The real ladder — and what happens
          to it when a large order arrives — is Module 11.
        </p>
      </div>
    </figure>
  );
}

function Row({
  level,
  index,
  active,
  bidColor,
  askColor,
}: {
  level: { px: number; bid: number; ask: number };
  index: number;
  active: boolean;
  bidColor: string;
  askColor: string;
}) {
  return (
    <>
      <div className="flex h-4 justify-end">
        <span
          className={`block h-full rounded-l-sm ${active ? 'animate-breathe' : ''}`}
          style={{
            width: `${level.bid * 100}%`,
            backgroundColor: bidColor,
            opacity: 0.22 + level.bid * 0.3,
            transformOrigin: 'right center',
            animationDelay: `${index * 210}ms`,
          }}
        />
      </div>

      <span className="min-w-[5.5rem] text-center font-mono text-xs tabular-nums text-ink">
        {level.px.toFixed(1)}
      </span>

      <div className="flex h-4">
        <span
          className={`block h-full rounded-r-sm ${active ? 'animate-breathe' : ''}`}
          style={{
            width: `${level.ask * 100}%`,
            backgroundColor: askColor,
            opacity: 0.22 + level.ask * 0.3,
            transformOrigin: 'left center',
            animationDelay: `${index * 210 + 105}ms`,
          }}
        />
      </div>
    </>
  );
}
