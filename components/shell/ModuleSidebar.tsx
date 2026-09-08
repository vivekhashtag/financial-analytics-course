'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { useProgress } from '@/components/progress/ProgressProvider';

export interface SidebarEntry {
  kind: 'overview' | 'page' | 'quiz' | 'exercises';
  href: string;
  label: string;
  /** page slug, for the read-state tick */
  slug: string | null;
}

/**
 * The module's page list, doubling as the progress readout. Sticky on desktop;
 * a collapsible strip on mobile so it never pushes the prose off-screen.
 */
export function ModuleSidebar({
  moduleId,
  entries,
  activeHref,
}: {
  moduleId: string;
  entries: SidebarEntry[];
  activeHref: string;
}) {
  const { hydrated, moduleProgress } = useProgress();
  const [open, setOpen] = useState(false);

  const p = hydrated ? moduleProgress(moduleId) : null;

  const stateFor = (entry: SidebarEntry): 'done' | 'todo' => {
    if (!p) return 'todo';
    if (entry.kind === 'page' && entry.slug) return p.pagesRead.includes(entry.slug) ? 'done' : 'todo';
    if (entry.kind === 'quiz') return p.quizPassed ? 'done' : 'todo';
    if (entry.kind === 'exercises') return p.exercisesComplete.length > 0 ? 'done' : 'todo';
    return 'todo';
  };

  const list = (
    <ol className="space-y-0.5">
      {entries.map((entry) => {
        const active = entry.href === activeHref;
        const done = stateFor(entry) === 'done';

        return (
          <li key={entry.href}>
            <Link
              href={entry.href}
              aria-current={active ? 'page' : undefined}
              className={`flex items-start gap-2.5 rounded-md px-2.5 py-2 text-sm no-underline transition-colors duration-fast ease-token ${
                active
                  ? 'accent-bg-soft font-semibold text-ink'
                  : 'text-muted hover:bg-surface hover:text-ink'
              }`}
            >
              <span
                aria-hidden="true"
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[9px] ${
                  done
                    ? 'border-transparent bg-success text-white'
                    : active
                      ? 'accent-border bg-bg'
                      : 'border-border bg-bg'
                }`}
              >
                {done && <Icon name="check" size={9} strokeWidth={4} />}
              </span>
              <span className="min-w-0">{entry.label}</span>
            </Link>
          </li>
        );
      })}
    </ol>
  );

  return (
    <>
      <aside className="hidden w-sidebar shrink-0 lg:block">
        <nav
          aria-label="Module contents"
          className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-2"
        >
          <p className="mb-2 px-2.5 text-xs font-semibold uppercase tracking-wide text-muted">
            In this module
          </p>
          {list}
        </nav>
      </aside>

      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="btn-secondary mb-4 w-full justify-between"
        >
          <span className="flex items-center gap-2">
            <Icon name="layers" size={15} />
            Module contents
          </span>
          <Icon name={open ? 'chevron-down' : 'chevron-right'} size={15} />
        </button>
        {open && (
          <nav aria-label="Module contents" className="mb-6 card p-2">
            {list}
          </nav>
        )}
      </div>
    </>
  );
}
