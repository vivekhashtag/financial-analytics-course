'use client';

import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { partColor } from '@/lib/parts';
import type { PartId } from '@/lib/types';

/**
 * Reveals the case-study beats as they scroll into view. Every beat is content
 * from `module.json` — nothing is written here — so a module with only a hook
 * still gets a clean two-beat opener.
 */
export function CaseStudyScrollView({
  title,
  hook,
  lesson,
  part,
}: {
  title: string;
  hook: string | null;
  lesson: string | null;
  part: PartId;
}) {
  const color = partColor(part);

  const beats: { kind: 'hook' | 'lesson'; text: string }[] = [];
  if (hook) beats.push({ kind: 'hook', text: hook });
  if (lesson) beats.push({ kind: 'lesson', text: lesson });

  return (
    <section
      className="not-prose overflow-hidden rounded-lg border"
      style={{ borderColor: `${color}40`, background: `linear-gradient(160deg, ${color}0D, transparent 60%)` }}
    >
      <div className="px-5 py-6 sm:px-8 sm:py-10">
        <Reveal>
          <p
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest"
            style={{ color }}
          >
            <Icon name="alert-triangle" size={14} />
            Case study
          </p>
          <h3 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">{title}</h3>
        </Reveal>

        {beats.map((beat, i) => (
          <Reveal key={i} delay={140 * (i + 1)}>
            {beat.kind === 'hook' ? (
              <p className="mt-6 text-xl font-medium leading-snug text-ink sm:text-2xl">
                {beat.text}
              </p>
            ) : (
              <div
                className="mt-6 flex items-start gap-3 rounded-md border-l-4 bg-bg/70 p-4"
                style={{ borderColor: color }}
              >
                <Icon name="target" size={18} className="mt-0.5 shrink-0" style={{ color }} />
                <p className="text-base text-ink">
                  <span className="font-semibold">The lesson: </span>
                  {beat.text}
                </p>
              </div>
            )}
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/** Fades a beat in the first time it enters the viewport. */
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="transition-all duration-slow ease-token"
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'none' : 'translateY(14px)',
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
