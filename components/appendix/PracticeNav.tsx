'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { PracticeIcon } from './PracticeIcon';
import { prefersReducedMotion } from '@/components/motion/Reveal';

export interface NavPractice {
  id: string;
  code: string;
  navLabel: string;
}

/** Cleared by the sticky site header (h-14 = 56px) plus a little breathing room. */
const HEADER_OFFSET = 64;
/** Within this many px of the document end, the last section is the answer. */
const BOTTOM_SLACK = 100;

/**
 * In-page navigation for the six practices: a left rail from `lg` up, a
 * horizontally scrollable pill bar below that. Sticky at every width.
 *
 * ## Why this is a scroll handler and not an IntersectionObserver
 *
 * It was an observer, scored by `intersectionRatio`, and that was wrong twice
 * over. `intersectionRatio` is a fraction of the *target's* own size, so a
 * section taller than the viewport can never score above roughly
 * viewport/section — D.6 is long, and it lost every comparison against whatever
 * short section was clipping the fold. And the observer only fires when a
 * threshold is crossed, so the reading went stale between steps.
 *
 * Scoring visible *pixels* is the measure that actually matches "the section I
 * am looking at", and it needs a real geometry read, so: one rAF-throttled
 * scroll handler over six elements. Six `getBoundingClientRect` calls per frame
 * is nothing, and the logic is now something you can reason about.
 *
 * The last section gets an explicit rule. Even scored by area, D.6 can be
 * unreachable: once the page bottoms out, the sections below the fold stop
 * moving, and if the footer is tall enough the final section never wins. So
 * within `BOTTOM_SLACK` of the document end, the last item is force-activated.
 */
export function PracticeNav({ practices }: { practices: NavPractice[] }) {
  const [active, setActive] = useState<string | null>(practices[0]?.id ?? null);
  const pillsRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!practices.length) return;

    let frame = 0;

    const measure = () => {
      frame = 0;

      const doc = document.documentElement;

      // At the bottom of the page, the last section is the answer regardless of
      // how much of it happens to be on screen.
      if (window.scrollY + window.innerHeight >= doc.scrollHeight - BOTTOM_SLACK) {
        setActive(practices[practices.length - 1].id);
        return;
      }

      const top = HEADER_OFFSET;
      const bottom = window.innerHeight;

      let best: string | null = null;
      let bestVisible = 0;

      for (const p of practices) {
        const el = document.getElementById(p.id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        const visible = Math.min(rect.bottom, bottom) - Math.max(rect.top, top);
        if (visible > bestVisible) {
          bestVisible = visible;
          best = p.id;
        }
      }

      // Nothing intersecting (above the first section): keep the first item lit
      // rather than blanking the rail.
      setActive(best ?? practices[0].id);
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [practices]);

  // Keep the active pill in view on the mobile bar as the reader scrolls.
  useEffect(() => {
    const bar = pillsRef.current;
    if (!bar || !active) return;
    const pill = bar.querySelector<HTMLElement>(`[data-pill="${active}"]`);
    if (!pill) return;

    const left = pill.offsetLeft - bar.clientWidth / 2 + pill.clientWidth / 2;
    bar.scrollTo({ left: Math.max(left, 0), behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
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
    <nav
      aria-label="The six practices"
      // Sticky at every width. `top-14` clears the site header on mobile, where
      // the pill bar pins directly under it; `lg:top-20` gives the rail a little
      // more air. See WorkItselfPage for why the *parent* has to stretch.
      className="sticky top-14 z-20 lg:top-20"
    >
      {/* mobile / tablet: scrollable pills. Opaque, because it now sits over
          the article rather than above it. */}
      <div className="-mx-4 border-b border-border bg-bg/95 px-4 py-2 backdrop-blur lg:hidden">
        <ul
          ref={pillsRef}
          className="flex gap-2 overflow-x-auto pb-1"
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
                  {/* code, space, name — one text run, so the accessible name
                      and a copy-paste both read "D.1 Equity Research" */}
                  <span className="tabular-nums">{`${p.code} ${p.navLabel}`}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>

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
                  className="mt-1.5 h-4 w-0.5 shrink-0 origin-center rounded-full transition-transform duration-base ease-token"
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

                {/* One line: code, a real space, then the name. Previously these
                    were two `block` spans with no whitespace between the text
                    nodes, which looked stacked but read as "D.1Equity Research"
                    to a screen reader, to find-in-page and to a copy-paste. */}
                <span className="min-w-0">
                  <span
                    className={`font-medium ${current ? 'text-ink' : 'text-muted group-hover:text-ink'}`}
                  >
                    <span
                      className="tabular-nums"
                      style={current ? { color: 'var(--accent)' } : undefined}
                    >
                      {p.code}
                    </span>{' '}
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
