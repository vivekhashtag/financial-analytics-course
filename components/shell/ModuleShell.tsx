import Link from 'next/link';
import type { ReactNode } from 'react';
import { Icon } from '@/components/ui/Icon';
import { part } from '@/lib/parts';
import { getExercises, getQuiz, moduleNeighbours } from '@/lib/content';
import type { CourseModule } from '@/lib/types';
import { ModuleSidebar, type SidebarEntry } from './ModuleSidebar';
import { ModuleProgressBar } from './ModuleProgressBar';
import { Breadcrumbs } from './Breadcrumbs';

export type ModuleSection = { kind: 'overview' } | { kind: 'page'; slug: string } | { kind: 'quiz' } | { kind: 'exercises' };

/**
 * The frame every module route renders inside: Part-coloured header, a sidebar
 * that doubles as the progress readout, and a prev/next footer that walks the
 * module's pages and then hands off to the next module.
 */
export function ModuleShell({
  mod,
  section,
  children,
}: {
  mod: CourseModule;
  section: ModuleSection;
  children: ReactNode;
}) {
  const meta = part(mod.part);
  const quiz = getQuiz(mod.id);
  const exercises = getExercises(mod.id);

  const entries: SidebarEntry[] = [
    { kind: 'overview', href: `/modules/${mod.id}`, label: 'Overview', slug: null },
    ...mod.pages.map((p) => ({
      kind: 'page' as const,
      href: `/modules/${mod.id}/${p.slug}`,
      label: p.title,
      slug: p.slug,
    })),
    ...(exercises.length
      ? [
          {
            kind: 'exercises' as const,
            href: `/modules/${mod.id}/exercises`,
            label: `Exercises (${exercises.length})`,
            slug: null,
          },
        ]
      : []),
    ...(quiz
      ? [
          {
            kind: 'quiz' as const,
            href: `/modules/${mod.id}/quiz`,
            label: `Quiz (${quiz.questions.length})`,
            slug: null,
          },
        ]
      : []),
  ];

  const activeHref =
    section.kind === 'page'
      ? `/modules/${mod.id}/${section.slug}`
      : section.kind === 'overview'
        ? `/modules/${mod.id}`
        : `/modules/${mod.id}/${section.kind}`;

  const flow = buildFlow(mod, entries, activeHref);

  return (
    <div style={{ '--accent': meta.color } as React.CSSProperties}>
      {/* Part-coloured header */}
      <header
        className="border-b border-border"
        style={{ background: `linear-gradient(150deg, ${meta.color}14, transparent 70%)` }}
      >
        <div className="mx-auto max-w-wide px-4 py-6">
          <Breadcrumbs mod={mod} leaf={crumbLeaf(mod, section)} />

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <span className="inline-flex items-center gap-1 text-muted">
              <Icon name="clock" size={13} />
              {formatMinutes(mod.estimatedMinutes)}
            </span>
            {mod.badge && (
              <>
                <span className="text-muted">·</span>
                <span className="inline-flex items-center gap-1 text-muted">
                  <Icon name={mod.badge.icon ?? 'award'} size={13} />
                  {mod.badge.label}
                </span>
              </>
            )}
          </div>

          <h1 className="mt-2 text-3xl font-bold text-ink">
            <span className="accent-text">{mod.number}</span>
            <span className="mx-2 text-border">/</span>
            {mod.title}
          </h1>
          {mod.subtitle && <p className="mt-1.5 text-lg text-muted">{mod.subtitle}</p>}

          <ModuleProgressBar
            moduleId={mod.id}
            totals={{
              pages: mod.pages.length,
              notebooks: mod.notebooks.length,
              exercises: exercises.length,
              hasQuiz: !!quiz,
            }}
          />
        </div>
      </header>

      {/* Stacks on mobile (toggle above the prose), two columns from lg up. */}
      <div className="mx-auto flex max-w-wide flex-col px-4 py-8 lg:flex-row lg:gap-8">
        <ModuleSidebar moduleId={mod.id} entries={entries} activeHref={activeHref} />

        <div className="min-w-0 flex-1">
          {children}

          {/* prev / next */}
          <nav className="mt-12 grid gap-3 border-t border-border pt-6 sm:grid-cols-2">
            {flow.prev ? (
              <Link
                href={flow.prev.href}
                className="card group flex items-center gap-3 p-4 no-underline transition-shadow duration-base ease-token hover:shadow-lift"
              >
                <Icon name="arrow-left" size={18} className="shrink-0 text-muted" />
                <span className="min-w-0">
                  <span className="block text-xs uppercase tracking-wide text-muted">
                    {flow.prev.hint}
                  </span>
                  <span className="block truncate text-sm font-semibold text-ink">
                    {flow.prev.label}
                  </span>
                </span>
              </Link>
            ) : (
              <span />
            )}

            {flow.next && (
              <Link
                href={flow.next.href}
                className="card group flex items-center justify-end gap-3 p-4 text-right no-underline transition-shadow duration-base ease-token hover:shadow-lift sm:col-start-2"
              >
                <span className="min-w-0">
                  <span className="block text-xs uppercase tracking-wide text-muted">
                    {flow.next.hint}
                  </span>
                  <span className="block truncate text-sm font-semibold text-ink">
                    {flow.next.label}
                  </span>
                </span>
                <Icon name="arrow-right" size={18} className="shrink-0 accent-text" />
              </Link>
            )}
          </nav>
        </div>
      </div>
    </div>
  );
}

/** The last breadcrumb: the page or section title, or nothing on the overview. */
function crumbLeaf(mod: CourseModule, section: ModuleSection): string | undefined {
  switch (section.kind) {
    case 'page':
      return mod.pages.find((p) => p.slug === section.slug)?.title ?? section.slug;
    case 'quiz':
      return 'Quiz';
    case 'exercises':
      return 'Exercises';
    default:
      return undefined;
  }
}

interface FlowLink {
  href: string;
  label: string;
  hint: string;
}

/** Walks the sidebar order, then steps into the neighbouring module. */
function buildFlow(mod: CourseModule, entries: SidebarEntry[], activeHref: string) {
  const i = entries.findIndex((e) => e.href === activeHref);
  const { prev: prevMod, next: nextMod } = moduleNeighbours(mod.id);

  const prev: FlowLink | null =
    i > 0
      ? { href: entries[i - 1].href, label: entries[i - 1].label, hint: 'Previous' }
      : prevMod
        ? {
            href: `/modules/${prevMod.id}`,
            label: `${prevMod.number} · ${prevMod.title}`,
            hint: 'Previous module',
          }
        : null;

  const next: FlowLink | null =
    i >= 0 && i < entries.length - 1
      ? { href: entries[i + 1].href, label: entries[i + 1].label, hint: 'Next' }
      : nextMod
        ? {
            href: `/modules/${nextMod.id}`,
            label: `${nextMod.number} · ${nextMod.title}`,
            hint: 'Next module',
          }
        : null;

  return { prev, next };
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}
