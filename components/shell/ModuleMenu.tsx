'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@/components/ui/Icon';
import { moduleCompletion, useProgress } from '@/components/progress/ProgressProvider';
import { APPENDIX_PROGRESS_KEY } from '@/lib/progress-keys';

export interface MenuModule {
  id: string;
  number: string;
  title: string;
  /** first page of the module — where the menu navigates to */
  href: string;
  totals: { pages: number; notebooks: number; exercises: number; hasQuiz: boolean };
}

export interface MenuAppendix {
  slug: string;
  letter: string;
  title: string;
  href: string;
}

export interface MenuGroup {
  partId: string;
  label: string;
  color: string;
  modules: MenuModule[];
  /**
   * Set instead of `modules` for the appendices group. They are listed with a
   * read marker rather than a completion percentage — appendix progress is
   * deliberately outside the module arithmetic (see APPENDIX_PROGRESS_KEY), so
   * showing a percentage here would invent a number.
   */
  appendices?: MenuAppendix[];
}

const SITE_LINKS = [
  { href: '/', label: 'Home', icon: 'compass' },
  { href: '/modules', label: 'Modules', icon: 'layers' },
  { href: '/data', label: 'Datasets', icon: 'database' },
  { href: '/progress', label: 'My progress', icon: 'trending-up' },
];

const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Global module navigation, as a right-side drawer.
 *
 * The drawer is rendered through a portal onto document.body, and that is not
 * incidental: the site header uses `backdrop-blur`, and an ancestor with a
 * `backdrop-filter` becomes the containing block for `position: fixed`
 * descendants. Rendered in place, the drawer was being laid out inside the
 * 56px header box — a small clipped panel top-right, with a backdrop that only
 * covered the header strip. The portal escapes that containing block so
 * `fixed inset-y-0` means the viewport again.
 */
export function ModuleMenu({ groups }: { groups: MenuGroup[] }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname() ?? '/';
  const panelId = useId();

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  // createPortal needs a DOM; on the server there is none.
  useEffect(() => setMounted(true), []);

  // Close on navigation.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Esc closes; Tab cycles within the drawer.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== 'Tab') return;

      const panel = panelRef.current;
      if (!panel) return;

      const items = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (el) => el.offsetParent !== null,
      );
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && (active === first || !panel.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !panel.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, close]);

  // Focus in on open, restore to the trigger on close, lock background scroll.
  useEffect(() => {
    if (!open) return;

    const trigger = triggerRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      trigger?.focus();
    };
  }, [open]);

  const currentModuleId = /^\/modules\/([^/]+)/.exec(pathname)?.[1] ?? null;
  const currentAppendixSlug = /^\/appendices\/([^/]+)/.exec(pathname)?.[1] ?? null;
  const moduleCount = groups.reduce((n, g) => n + g.modules.length, 0);
  const appendixCount = groups.reduce((n, g) => n + (g.appendices?.length ?? 0), 0);

  const drawer = (
    <div className="fixed inset-0 z-[100]">
      {/* backdrop */}
      <button
        type="button"
        onClick={close}
        tabIndex={-1}
        aria-label="Close menu"
        className="absolute inset-0 h-full w-full cursor-default bg-ink/40"
      />

      <div
        id={panelId}
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Course navigation"
        className="absolute inset-y-0 right-0 flex h-full w-full flex-col border-l border-border bg-bg shadow-lift sm:w-[23.5rem]"
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-ink">Course navigation</p>
            <p className="text-xs text-muted">
              {moduleCount} modules
              {appendixCount > 0 && ` · ${appendixCount} appendices`}
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close menu"
            className="btn-ghost px-2 py-1.5"
          >
            <Icon name="x" size={17} />
          </button>
        </header>

        {/* the only scroll container — the drawer scrolls, never clips */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          <ul className="grid grid-cols-2 gap-2">
            {SITE_LINKS.map((link) => {
              const active =
                link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium no-underline transition-colors duration-fast ease-token ${
                      active
                        ? 'border-primary/30 bg-primary/[0.07] text-primary'
                        : 'border-border bg-bg text-ink hover:bg-surface'
                    }`}
                  >
                    <Icon name={link.icon} size={15} />
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <nav aria-label="Modules" className="mt-6 space-y-6">
            {groups.map((group) => (
              <section key={group.partId}>
                <h2
                  className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide"
                  style={{ color: group.color }}
                >
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-5 shrink-0 rounded-full"
                    style={{ backgroundColor: group.color }}
                  />
                  {group.label}
                </h2>

                <ul className="mt-2 space-y-0.5">
                  {group.appendices
                    ? group.appendices.map((a) => (
                        <AppendixMenuRow
                          key={a.slug}
                          appendix={a}
                          color={group.color}
                          current={a.slug === currentAppendixSlug}
                        />
                      ))
                    : group.modules.map((mod) => (
                        <MenuRow
                          key={mod.id}
                          mod={mod}
                          color={group.color}
                          current={mod.id === currentModuleId}
                        />
                      ))}
                </ul>
              </section>
            ))}
          </nav>
        </div>

        <footer className="shrink-0 border-t border-border px-4 py-3">
          <p className="text-xs text-muted">
            Prerequisites are suggested, never enforced — jump anywhere.
          </p>
        </footer>
      </div>
    </div>
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="dialog"
        aria-label="Course menu"
        className="btn-ghost gap-2 px-2.5 py-1.5"
      >
        <span aria-hidden="true" className="flex h-3.5 w-4 flex-col justify-between">
          <span className="h-[2px] w-full rounded-full bg-current" />
          <span className="h-[2px] w-full rounded-full bg-current" />
          <span className="h-[2px] w-full rounded-full bg-current" />
        </span>
        <span className="hidden text-sm sm:inline">Menu</span>
      </button>

      {open && mounted && createPortal(drawer, document.body)}
    </>
  );
}

const STATE_ICON = {
  'not-started': 'dot',
  'in-progress': 'clock',
  complete: 'check-circle',
} as const;

function MenuRow({
  mod,
  color,
  current,
}: {
  mod: MenuModule;
  color: string;
  current: boolean;
}) {
  const { hydrated, moduleProgress } = useProgress();

  const pct = hydrated ? moduleCompletion(moduleProgress(mod.id), mod.totals) : 0;
  const state = !hydrated || pct === 0 ? 'not-started' : pct >= 100 ? 'complete' : 'in-progress';

  const label = {
    'not-started': 'Not started',
    'in-progress': `In progress · ${pct}%`,
    complete: 'Complete',
  }[state];

  return (
    <li>
      <Link
        href={mod.href}
        aria-current={current ? 'page' : undefined}
        className={`flex items-center gap-3 rounded-md px-2 py-2 no-underline transition-colors duration-fast ease-token ${
          current ? 'bg-surface ring-1 ring-inset' : 'hover:bg-surface'
        }`}
        style={current ? { '--tw-ring-color': `${color}66` } as React.CSSProperties : undefined}
      >
        <span
          aria-hidden="true"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-semibold tabular-nums"
          style={{
            backgroundColor: state === 'complete' ? color : `${color}18`,
            color: state === 'complete' ? '#FFFFFF' : color,
          }}
        >
          {mod.number}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-ink">{mod.title}</span>
          <span
            className={`block text-xs ${
              state === 'complete'
                ? 'text-success'
                : state === 'in-progress'
                  ? 'text-muted'
                  : 'text-muted/70'
            }`}
          >
            {label}
          </span>
        </span>

        <span
          aria-hidden="true"
          className={`shrink-0 ${
            state === 'complete'
              ? 'text-success'
              : state === 'in-progress'
                ? 'text-warn'
                : 'text-border'
          }`}
          title={label}
        >
          <Icon name={STATE_ICON[state]} size={state === 'not-started' ? 18 : 15} />
        </span>
      </Link>
    </li>
  );
}

/**
 * An appendix in the drawer. Same shape as MenuRow so the group does not read
 * as a different kind of list, but the status line is read / not read: there is
 * no percentage to show, by design.
 */
function AppendixMenuRow({
  appendix,
  color,
  current,
}: {
  appendix: MenuAppendix;
  color: string;
  current: boolean;
}) {
  const { hydrated, has } = useProgress();
  const read = hydrated && has(APPENDIX_PROGRESS_KEY, 'pagesRead', appendix.slug);

  return (
    <li>
      <Link
        href={appendix.href}
        aria-current={current ? 'page' : undefined}
        className={`flex items-center gap-3 rounded-md px-2 py-2 no-underline transition-colors duration-fast ease-token ${
          current ? 'bg-surface ring-1 ring-inset' : 'hover:bg-surface'
        }`}
        style={current ? ({ '--tw-ring-color': `${color}66` } as React.CSSProperties) : undefined}
      >
        <span
          aria-hidden="true"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-semibold"
          style={{
            backgroundColor: read ? color : `${color}18`,
            color: read ? '#FFFFFF' : color,
          }}
        >
          {appendix.letter}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-ink">{appendix.title}</span>
          <span className={`block text-xs ${read ? 'text-success' : 'text-muted/70'}`}>
            {read ? 'Read' : 'Not read yet'}
          </span>
        </span>

        <span
          aria-hidden="true"
          className={`shrink-0 ${read ? 'text-success' : 'text-border'}`}
          title={read ? 'Read' : 'Not read yet'}
        >
          <Icon name={read ? 'check-circle' : 'dot'} size={read ? 15 : 18} />
        </span>
      </Link>
    </li>
  );
}
