'use client';

import { useId, useState } from 'react';
import { Icon } from '@/components/ui/Icon';

/**
 * A tickable list. Used on Module 0's "what you'll be able to do" — ticking is
 * a self-assessment gesture, not tracked progress, so it stays component-local.
 */
export function Checklist({ items, title }: { items: string[]; title?: string }) {
  const [ticked, setTicked] = useState<Set<number>>(new Set());
  const id = useId();

  const toggle = (i: number) =>
    setTicked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <div className="widget not-prose card p-4">
      {title && <h4 className="mb-3 text-sm font-semibold text-ink">{title}</h4>}
      <ul className="space-y-1">
        {items.map((item, i) => {
          const on = ticked.has(i);
          return (
            <li key={i}>
              <label
                htmlFor={`${id}-${i}`}
                className="flex cursor-pointer items-start gap-3 rounded-md px-2 py-1.5 transition-colors duration-fast ease-token hover:bg-surface"
              >
                <input
                  id={`${id}-${i}`}
                  type="checkbox"
                  checked={on}
                  onChange={() => toggle(i)}
                  className="sr-only"
                />
                <span
                  aria-hidden="true"
                  className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-sm border transition-all duration-fast ease-token ${
                    on ? 'border-transparent bg-success text-white' : 'border-border bg-bg'
                  }`}
                >
                  {on && <Icon name="check" size={12} strokeWidth={3} />}
                </span>
                <span
                  className={`text-sm transition-colors duration-fast ease-token ${
                    on ? 'text-muted line-through' : 'text-ink'
                  }`}
                >
                  {item}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 border-t border-border pt-2 text-xs text-muted">
        {ticked.size} of {items.length} ticked
      </p>
    </div>
  );
}
