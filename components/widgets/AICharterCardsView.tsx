'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import type { AiGreen, AiRed } from '@/lib/types';

type Side = 'green' | 'red';

/**
 * Flip cards: the front states the situation, the back gives the prompt (green)
 * or the reason plus the rule (red). Click or keyboard-activate to flip; the
 * flip is CSS-only so it degrades to a plain reveal without motion.
 */
export function AICharterCardsView({ green, red }: { green: AiGreen[]; red: AiRed[] }) {
  const [side, setSide] = useState<Side>('green');

  const cards =
    side === 'green'
      ? green.map((g) => ({ title: g.situation, back: g.prompt, footer: null }))
      : red.map((r) => ({ title: r.danger, back: r.why, footer: r.rule }));

  return (
    <section className="widget not-prose">
      <div
        role="tablist"
        aria-label="AI Learning Charter"
        className="mb-4 inline-flex rounded-full border border-border bg-surface p-1"
      >
        {(['green', 'red'] as const).map((s) => (
          <button
            key={s}
            role="tab"
            aria-selected={side === s}
            type="button"
            onClick={() => setSide(s)}
            className={`btn rounded-full px-4 py-1.5 text-xs ${
              side === s
                ? s === 'green'
                  ? 'bg-success text-white'
                  : 'bg-danger text-white'
                : 'text-muted hover:text-ink'
            }`}
          >
            <Icon name={s === 'green' ? 'check-circle' : 'alert'} size={14} />
            {s === 'green' ? `Green list (${green.length})` : `Red list (${red.length})`}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, i) => (
          <FlipCard key={`${side}-${i}`} side={side} {...card} />
        ))}
      </div>

      <p className="mt-3 text-xs text-muted">
        Click a card to turn it over.
      </p>
    </section>
  );
}

function FlipCard({
  side,
  title,
  back,
  footer,
}: {
  side: Side;
  title: string;
  back: string;
  footer: string | null;
}) {
  const [flipped, setFlipped] = useState(false);
  const isGreen = side === 'green';

  return (
    <button
      type="button"
      aria-expanded={flipped}
      onClick={() => setFlipped((f) => !f)}
      className="group h-full min-h-[168px] [perspective:1200px]"
    >
      <div
        className="relative h-full w-full text-left transition-transform duration-slow ease-token [transform-style:preserve-3d]"
        style={{ transform: flipped ? 'rotateY(180deg)' : undefined }}
      >
        {/* front */}
        <div
          className={`absolute inset-0 flex flex-col justify-between rounded-lg border bg-bg p-4 shadow-card [backface-visibility:hidden] ${
            side === 'green' ? 'border-success/30' : 'border-danger/30'
          }`}
        >
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-md ${
              isGreen ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
            }`}
          >
            <Icon name={side === 'green' ? 'sparkles' : 'alert-triangle'} size={16} />
          </span>
          <p className="mt-3 text-base font-semibold text-ink">{title}</p>
          <p className="mt-2 flex items-center gap-1 text-xs text-muted">
            <Icon name="refresh-cw" size={12} /> flip
          </p>
        </div>

        {/* back */}
        <div
          className={`absolute inset-0 flex flex-col overflow-auto rounded-lg border p-4 shadow-card [backface-visibility:hidden] [transform:rotateY(180deg)] ${
            side === 'green'
              ? 'border-success/40 bg-success/[0.06]'
              : 'border-danger/40 bg-danger/[0.06]'
          }`}
        >
          <p
            className={`text-sm ${
              side === 'green' ? 'font-mono text-xs leading-relaxed text-ink' : 'text-ink'
            }`}
          >
            {back}
          </p>
          {footer && (
            <p
              className={`mt-auto pt-3 text-sm font-semibold ${
                isGreen ? 'text-success' : 'text-danger'
              }`}
            >
              {footer}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
