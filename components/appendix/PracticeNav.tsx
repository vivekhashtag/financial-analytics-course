'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { PracticeIcon } from './PracticeIcon';
import { prefersReducedMotion } from '@/components/motion/Reveal';

export interface NavPractice {
  id: string;
  code: string;
  navLabel: string;
}

/**
 * In-page navigation for the six practices: a left rail from `lg` up, a
 * horizontally scrollable pill bar below that.
 *
 * Scroll-spy runs off a single IntersectionObserver over the six section
 * elements, with a top margin that matches the sticky site header, so the
 * "current" section is the one a reader is actually looking at rather than
 * whichever one technically touches the viewport edge. It only *reflects*
 * position — never rewrites the URL — because a scroll-driven `history`
 * replace fights the browser's own back button.
 *
 * Motion: smooth scrolling is opt-out. Reduced-motion users get an instant
 * jump, which is also what `scroll-behavior: auto` would give them.
 */
export function PracticeNav({ practices }: { practices: NavPractice[] }) {
  const [active, setActive] = useState<string | null>(practices[0]?.id ?? null);
  const pillsRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;

    const sections = practices
      .map((p) => document.getElementById(p.id))
      .filter((el): el is HTMLElement => !!el);
    if (!sections.length) return;

    // Track ratios rather than the last-crossed edge: with sections this long,
    // "most visible" is the only reading that matches what a reader sees.
    const ratios = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratios.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
        }
        let best: string | null = null;
        let bestRatio = 0;
        for (const [id, ratio] of ratios) {
          if (ratio > bestRatio) {
            best = id;
            bestRatio = ratio;
          }
        }
        if (best) setActive(best);
      },
      {
        // 56px sticky header, and a generous bottom cut so the section being
        // read wins over the one just appearing at the fold.
        rootMargin: '-64px 0px -55% 0px',
        threshold: [0, 0.05, 0.15, 0.3, 0.6, 1],
      },
    );

    for (const el of sections) observer.observe(el);
    return () => observer.disconnect();
  }, [practices]);

  // Keep the active pill in view on the mobile bar as the reader scrolls.
  useEffect(() => {
    const bar = pillsRef.current;
    if (!bar || !active) return;
    const pill = bar.querySelector<HTMLElement>(`[data-pill="${active}"]`);
    if (!pill) return;

    const left = pill.offsetLeft - bar.clientWidth / 2 + pill.clientWidth / 2;
    bar.scrollTo({ left, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }, [active]);

  const jump = useCallback((e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    const el = document.getElementById(id);
    if (!el) return; // let the anchor do its default thing

    e.preventDefault();
    el.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      block: 'start',
    });
    // Move focus so the keyboard and screen-reader position follows the eye.
    el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
    setActive(id);
  }, []);

  return (
    <nav aria-label="The six practices" className="lg:sticky lg:top-20">
      {/* mobile / tablet: scrollable pills */}
      <ul
        ref={pillsRef}
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 lg:hidden"
        style={{ scrollbarWidth: 'thin' }}
      >
        {practices.map((p) => {
          const current = p.id === active;
          return (
            <li key={p.id} className="shrink-0">
              <a
                href={`#${p.id}`}
                data-pill={p.id}
                onClick={(e) => jump(e, p.id)}
                aria-current={current ? 'true' : undefined}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold no-underline transition-colors duration-fast ease-token ${
                  current
                    ? 'border-transparent text-primary-fg'
                    : 'border-border bg-bg text-muted hover:text-ink'
                }`}
                style={current ? { backgroundColor: 'var(--accent)' } : undefined}
              >
                <PracticeIcon practice={p.code} size={14} />
                {p.navLabel}
              </a>
            </li>
          );
        })}
      </ul>

      {/* desktop: left rail */}
      <ul className="hidden lg:block lg:space-y-0.5">
        <li className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted">
          The six practices
        </li>
        {practices.map((p) => {
          const current = p.id === active;
          return (
            <li key={p.id}>
              <a
                href={`#${p.id}`}
                onClick={(e) => jump(e, p.id)}
                aria-current={current ? 'true' : undefined}
                className={`group flex items-start gap-2.5 rounded-md py-2 pl-2 pr-3 text-sm no-underline transition-colors duration-fast ease-token ${
                  current ? 'bg-surface' : 'hover:bg-surface'
                }`}
              >
                {/* The active marker is a scaled bar, not a width change, so
                    nothing in the rail reflows as the reader scrolls. */}
                <span
                  aria-hidden="true"
                  className="mt-1 h-4 w-0.5 shrink-0 origin-center rounded-full transition-transform duration-base ease-token"
                  style={{
                    backgroundColor: current ? 'var(--accent)' : 'transparent',
                    transform: current ? 'scaleY(1)' : 'scaleY(0.2)',
                  }}
                />
                <span
                  className="mt-0.5 shrink-0 transition-colors duration-fast"
                  style={{ color: current ? 'var(--accent)' : undefined }}
                >
                  <PracticeIcon practice={p.code} size={15} />
                </span>
                <span className="min-w-0">
                  <span
                    className={`block text-xs tabular-nums ${current ? '' : 'text-muted/70'}`}
                    style={current ? { color: 'var(--accent)' } : undefined}
                  >
                    {p.code}
                  </span>
                  <span
                    className={`block font-medium ${current ? 'text-ink' : 'text-muted group-hover:text-ink'}`}
                  >
                    {p.navLabel}
                  </span>
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
