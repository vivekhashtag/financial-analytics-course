'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import tokens from '@/schema/tokens.json';

export interface FlipCardSpec {
  title: string;
  front: string;
  back: string;
}

/**
 * Module 1's six quality pillars. The card content is inline in the MDX
 * (`<FlipCards cards={[…]} />`), so this component owns presentation only.
 */
export function FlipCards({ cards }: { cards: FlipCardSpec[] }) {
  const [open, setOpen] = useState<Set<number>>(new Set());
  const palette = tokens.color.chart;

  const toggle = (i: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  const allOpen = open.size === cards.length;

  return (
    <section className="widget not-prose">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs text-muted">
          {open.size}/{cards.length} revealed
        </p>
        <button
          type="button"
          onClick={() => setOpen(allOpen ? new Set() : new Set(cards.map((_, i) => i)))}
          className="btn-ghost px-2 py-1 text-xs"
        >
          <Icon name={allOpen ? 'x' : 'eye'} size={13} />
          {allOpen ? 'Hide all' : 'Reveal all'}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, i) => {
          const color = palette[i % palette.length];
          const revealed = open.has(i);

          return (
            <button
              key={i}
              type="button"
              aria-expanded={revealed}
              onClick={() => toggle(i)}
              className="card flex h-full min-h-[190px] flex-col p-4 text-left transition-shadow duration-base ease-token hover:shadow-lift"
              style={revealed ? { borderColor: `${color}55` } : undefined}
            >
              <div className="flex items-center gap-2">
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-md text-xs font-semibold tabular-nums"
                  style={{ backgroundColor: `${color}18`, color }}
                >
                  {i + 1}
                </span>
                <h4 className="text-base font-semibold text-ink">{card.title}</h4>
              </div>

              <p className="mt-3 text-sm font-medium text-ink">{card.front}</p>

              {revealed ? (
                <p
                  className="mt-3 border-t pt-3 text-sm text-muted animate-fade-up"
                  style={{ borderColor: `${color}30` }}
                >
                  {card.back}
                </p>
              ) : (
                <p className="mt-auto flex items-center gap-1.5 pt-3 text-xs font-medium" style={{ color }}>
                  <Icon name="refresh-cw" size={12} />
                  Flip for the scandal
                </p>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
