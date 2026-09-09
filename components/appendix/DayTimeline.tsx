'use client';

import { useInView } from '@/components/motion/Reveal';
import { Icon } from '@/components/ui/Icon';
import type { DayEntry } from '@/lib/appendix-d';

/**
 * The "A Tuesday in results season" paragraph, as the shape it actually
 * describes: a day.
 *
 * Times sit in a fixed-width tabular column on the left so the clock reads as a
 * column rather than as ragged text, the activity sits on the right, and one
 * thin rule connects them. The whole block reveals once — per-entry staggering
 * on a nine-entry day turns a quiet reveal into a queue.
 */
export function DayTimeline({ heading, entries }: { heading: string; entries: DayEntry[] }) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.08 });
  const ease = 'cubic-bezier(.16,.84,.44,1)';

  return (
    <div ref={ref} className="not-prose mt-5">
      <div className="card overflow-hidden">
        <header className="flex items-center gap-2 border-b border-border bg-surface px-4 py-2.5">
          <span className="accent-text">
            <Icon name="clock" size={15} />
          </span>
          <h4 className="text-sm font-semibold text-ink">{heading}</h4>
        </header>

        <ol className="relative list-none px-4 py-4 pl-4">
          {/* the connecting rule, behind the rows */}
          <span
            aria-hidden="true"
            className="d-rail absolute left-[4.25rem] top-5 bottom-5 w-px origin-top"
            style={{
              backgroundColor: 'var(--accent)',
              opacity: 0.25,
              transform: inView ? 'scaleY(1)' : 'scaleY(0)',
              transition: `transform 400ms ${ease}`,
            }}
          />

          {entries.map((entry, i) => (
            <li
              key={`${entry.time}-${i}`}
              className="d-reveal relative flex gap-4 py-1.5"
              style={{
                opacity: inView ? 1 : 0,
                transform: inView ? 'none' : 'translate3d(0, 6px, 0)',
                transition: `opacity 340ms ${ease} ${Math.min(i * 35, 210)}ms, transform 340ms ${ease} ${Math.min(i * 35, 210)}ms`,
              }}
            >
              <time className="w-12 shrink-0 pt-0.5 text-right font-mono text-xs font-medium tabular-nums text-muted">
                {entry.time}
              </time>
              <span
                aria-hidden="true"
                className="relative z-10 mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full ring-2 ring-bg"
                style={{ backgroundColor: 'var(--accent)' }}
              />
              <span className="min-w-0 flex-1 text-sm leading-relaxed text-ink">{entry.text}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
