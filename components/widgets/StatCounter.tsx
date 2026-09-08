'use client';

import { useEffect, useRef, useState } from 'react';

export interface Stat {
  value: number;
  label: string;
  prefix?: string;
  suffix?: string;
  /** decimals to show; inferred from `value` when absent */
  decimals?: number;
}

/**
 * Count-up stat cards, animated once when they scroll into view.
 * Respects prefers-reduced-motion by jumping straight to the final value.
 */
export function StatCounter({ stats }: { stats: Stat[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [run, setRun] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setRun(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setRun(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="widget not-prose grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {stats.map((stat, i) => (
        <StatCard key={i} stat={stat} run={run} delay={i * 120} />
      ))}
    </div>
  );
}

function StatCard({ stat, run, delay }: { stat: Stat; run: boolean; delay: number }) {
  const decimals =
    stat.decimals ?? (Number.isInteger(stat.value) ? 0 : Math.min(2, String(stat.value).split('.')[1]?.length ?? 0));
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!run) return;

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (reduced) {
      setShown(stat.value);
      return;
    }

    let frame = 0;
    let start = 0;
    const duration = 1100;

    const timer = window.setTimeout(() => {
      const step = (now: number) => {
        if (!start) start = now;
        const t = Math.min(1, (now - start) / duration);
        // ease-out cubic: fast then settling, which reads as "counting up"
        setShown(stat.value * (1 - Math.pow(1 - t, 3)));
        if (t < 1) frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    }, delay);

    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, [run, stat.value, delay]);

  return (
    <div className="card flex flex-col gap-2 p-5 transition-shadow duration-base ease-token hover:shadow-lift">
      <div className="font-body text-3xl font-semibold tabular-nums accent-text">
        {stat.prefix}
        {shown.toLocaleString('en-IN', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })}
        {stat.suffix}
      </div>
      <p className="text-sm text-muted">{stat.label}</p>
    </div>
  );
}
