'use client';

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from 'react';

/**
 * Scroll-reveal: fade and rise a block into view, once.
 *
 * Budget, deliberately narrow so this reads as "the page settling" rather than
 * as animation: ≤400ms, ease-out, ≤16px of travel, transform and opacity only,
 * and it never re-triggers — the observer disconnects on first intersection.
 *
 * Under prefers-reduced-motion the element is rendered in its final state on
 * mount and no observer is created at all.
 */

/** Shared so a page can tell whether motion is wanted before it animates. */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Fires once when the element first scrolls into view. Returns `true`
 * immediately for reduced-motion users and when IntersectionObserver is absent,
 * so content is never gated behind an effect that might not run.
 */
export function useInView<T extends Element>(
  options: { threshold?: number; rootMargin?: string } = {},
) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  const { threshold = 0.15, rootMargin = '0px 0px -8% 0px' } = options;

  useEffect(() => {
    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }

    const el = ref.current;
    if (!el) return;

    // Already on screen at mount (above the fold): reveal without waiting.
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return { ref, inView };
}

interface RevealProps {
  children: ReactNode;
  /** stagger within a group, in ms; kept small so nothing feels slow */
  delay?: number;
  /** travel distance in px, capped at 16 */
  distance?: number;
  as?: ElementType;
  className?: string;
  id?: string;
  /** merged with the reveal's own transform/opacity styles */
  style?: CSSProperties;
}

export function Reveal({
  children,
  delay = 0,
  distance = 14,
  as: Tag = 'div',
  className,
  id,
  style,
}: RevealProps) {
  const { ref, inView } = useInView<HTMLElement>();
  const travel = Math.min(distance, 16);

  return (
    <Tag
      ref={ref}
      id={id}
      className={className}
      style={{
        ...style,
        opacity: inView ? 1 : 0,
        transform: inView ? 'none' : `translate3d(0, ${travel}px, 0)`,
        transition: `opacity 380ms cubic-bezier(.16,.84,.44,1) ${delay}ms, transform 380ms cubic-bezier(.16,.84,.44,1) ${delay}ms`,
        willChange: inView ? undefined : 'opacity, transform',
      }}
    >
      {children}
    </Tag>
  );
}

/**
 * Reveals a list's children in sequence. Used for card grids, where revealing
 * each card on its own observer would be both wasteful and visually noisy.
 */
export function RevealGroup({
  children,
  step = 60,
  className,
  as: Tag = 'div',
}: {
  children: ReactNode[];
  step?: number;
  className?: string;
  as?: ElementType;
}) {
  return (
    <Tag className={className}>
      {children.map((child, i) => (
        <Reveal key={i} delay={Math.min(i * step, 300)}>
          {child}
        </Reveal>
      ))}
    </Tag>
  );
}
