'use client';

import type { ReactNode } from 'react';
import { useInView } from '@/components/motion/Reveal';

/**
 * One station in a practice's process, as a step in a connected vertical
 * stepper.
 *
 * The connecting line is an absolutely positioned rail that scales from its top
 * edge, so it *draws* downward as each step comes into view and costs no layout
 * — a height animation here would reflow the station body on every frame. The
 * circle and the text ride the same reveal with a small stagger, and everything
 * is transform/opacity only.
 *
 * Reduced motion: `useInView` returns true immediately and the transitions are
 * dropped, so the whole stepper is simply *there*, fully drawn, on first paint.
 *
 * The body arrives as children, already rendered on the server through the
 * course MDX pipeline — the station text carries real markdown (nested lists in
 * D.1, bold runs everywhere) and re-implementing that here would fork the
 * typography.
 */
export function StationStep({
  n,
  title,
  isLast,
  index,
  children,
}: {
  n: string;
  title: string;
  isLast: boolean;
  index: number;
  children: ReactNode;
}) {
  const { ref, inView } = useInView<HTMLLIElement>({ threshold: 0.12 });

  // Capped so a six-station process never feels like it is waiting on itself.
  const delay = Math.min(index * 60, 180);
  const ease = 'cubic-bezier(.16,.84,.44,1)';

  return (
    <li ref={ref} className="relative pb-8 pl-12 last:pb-0">
      {/* the rail, drawn top-down */}
      {!isLast && (
        <span
          aria-hidden="true"
          className="d-rail absolute left-[15px] top-9 bottom-0 w-0.5 origin-top rounded-full"
          style={{
            backgroundColor: 'var(--accent)',
            opacity: 0.28,
            transform: inView ? 'scaleY(1)' : 'scaleY(0)',
            transition: `transform 380ms ${ease} ${delay + 80}ms`,
          }}
        />
      )}

      {/* the numbered circle */}
      <span
        aria-hidden="true"
        className="d-reveal absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold tabular-nums"
        style={{
          backgroundColor: 'var(--accent)',
          color: '#FFFFFF',
          opacity: inView ? 1 : 0,
          transform: inView ? 'scale(1)' : 'scale(.86)',
          transition: `opacity 260ms ${ease} ${delay}ms, transform 260ms ${ease} ${delay}ms`,
        }}
      >
        {n}
      </span>

      <div
        className="d-reveal"
        style={{
          opacity: inView ? 1 : 0,
          transform: inView ? 'none' : 'translate3d(0, 8px, 0)',
          transition: `opacity 380ms ${ease} ${delay}ms, transform 380ms ${ease} ${delay}ms`,
        }}
      >
        <h4 className="!mt-0 !mb-2 text-base font-semibold text-ink">
          <span className="text-muted">Station {n} · </span>
          {title}
        </h4>
        <div className="station-body">{children}</div>
      </div>
    </li>
  );
}

/** The stepper's list wrapper — kept here so the two stay in step. */
export function StationList({ children }: { children: ReactNode }) {
  return <ol className="not-prose mt-5 list-none pl-0">{children}</ol>;
}
