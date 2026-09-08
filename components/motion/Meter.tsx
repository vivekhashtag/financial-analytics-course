'use client';

import { useEffect, useState } from 'react';
import { prefersReducedMotion, useInView } from './Reveal';

/**
 * A progress bar that grows to its value the first time it is seen.
 *
 * Animates `transform: scaleX()`, not `width` — scaleX runs on the compositor
 * and never triggers layout, which is what keeps this off the main thread and
 * keeps CLS at zero. The track has fixed dimensions, so nothing around it can
 * move regardless.
 *
 * Reduced motion: renders at its final value with no transition.
 */
export function Meter({
  value,
  color = 'var(--accent)',
  className = 'h-1.5 w-full',
  trackClassName = 'bg-surface-alt',
  label,
}: {
  /** 0–100 */
  value: number;
  color?: string;
  /** sizing for the track */
  className?: string;
  trackClassName?: string;
  /** accessible name; omit for bars whose value is already stated in text */
  label?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.4 });
  const [grown, setGrown] = useState(false);

  useEffect(() => {
    if (!inView) return;
    if (prefersReducedMotion()) {
      setGrown(true);
      return;
    }
    // One frame at zero, so the transition has somewhere to travel from.
    const id = requestAnimationFrame(() => setGrown(true));
    return () => cancelAnimationFrame(id);
  }, [inView]);

  return (
    <div
      ref={ref}
      className={`overflow-hidden rounded-full ${trackClassName} ${className}`}
      {...(label
        ? { role: 'progressbar', 'aria-label': label, 'aria-valuenow': pct, 'aria-valuemin': 0, 'aria-valuemax': 100 }
        : { 'aria-hidden': true })}
    >
      <div
        className="h-full w-full rounded-full origin-left"
        style={{
          background: color,
          transform: `scaleX(${grown ? pct / 100 : 0})`,
          transition: 'transform 700ms cubic-bezier(.16,.84,.44,1)',
        }}
      />
    </div>
  );
}
