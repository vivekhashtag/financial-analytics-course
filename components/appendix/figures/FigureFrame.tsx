'use client';

import type { ReactNode } from 'react';
import { useInView } from '@/components/motion/Reveal';

/**
 * Shared chrome for the six Appendix D figures: a titled card, the drawing, and
 * the one-line idea underneath.
 *
 * `useInView` is exposed to the figure through a render prop rather than each
 * one wiring its own observer, so all six reveal on the same trigger and share
 * one reduced-motion story. Under reduced motion `inView` is true from the
 * first effect and the `.d-reveal` / `.d-rail` classes in globals.css force the
 * finished state in the stylesheet, so the picture is simply *there* — drawn,
 * static, and not waiting on JS.
 *
 * Everything the figures animate is transform or opacity. No width, height, x,
 * y, r or stroke-dashoffset transitions: those hit layout or paint, and on a
 * page this long several of them scrolling at once is exactly where a cheap
 * animation starts costing frames.
 */
export function FigureFrame({
  title,
  caption,
  children,
  /** aria description for the drawing */
  label,
}: {
  title: string;
  caption: string;
  label: string;
  children: (inView: boolean) => ReactNode;
}) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.2 });

  return (
    <figure ref={ref} className="not-prose my-6">
      <div className="card overflow-hidden">
        <div className="border-b border-border bg-surface px-4 py-2.5">
          <h4 className="text-sm font-semibold text-ink">{title}</h4>
        </div>
        <div className="px-4 py-5" role="img" aria-label={label}>
          {children(inView)}
        </div>
      </div>
      <figcaption className="mt-2 text-xs leading-relaxed text-muted">{caption}</figcaption>
    </figure>
  );
}

/** The transition every figure element uses, so the timing is defined once. */
export const EASE = 'cubic-bezier(.16,.84,.44,1)';

export function reveal(inView: boolean, delay: number, extra = '') {
  return {
    opacity: inView ? 1 : 0,
    transform: inView ? `translate3d(0,0,0) ${extra}`.trim() : `translate3d(0,6px,0) ${extra}`.trim(),
    transition: `opacity 340ms ${EASE} ${delay}ms, transform 340ms ${EASE} ${delay}ms`,
  } as const;
}
