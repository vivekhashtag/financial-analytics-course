import Link from 'next/link';
import type { ReactNode } from 'react';
import { Icon } from '@/components/ui/Icon';
import { PageReadMarker } from '@/components/shell/PageReadMarker';
import { formatMinutes } from '@/lib/format';
import { partColor } from '@/lib/parts';
import { APPENDIX_PROGRESS_KEY } from '@/lib/progress-keys';
import { appendixNeighbours, type Appendix } from '@/lib/appendices';

/**
 * The frame the appendix routes render inside — deliberately a quieter
 * `ModuleShell`.
 *
 * No sidebar, no progress bar, no badge: an appendix is reference material a
 * learner dips into, and dressing it as a module would imply a completion
 * target it does not have. What it keeps is the part that makes long prose
 * readable — the accent-tinted header, the `--accent` variable that drives
 * `prose-course` links and list markers, and a prev/next footer so the four
 * read as a sequence. The accent is the neutral slate of the appendix Part
 * token, so these pages read as beside the course rather than inside any Part.
 */
export function AppendixShell({
  appendix,
  children,
}: {
  appendix: Appendix;
  children: ReactNode;
}) {
  const accent = partColor('appendix');
  const { prev, next } = appendixNeighbours(appendix.slug);

  return (
    <div style={{ '--accent': accent } as React.CSSProperties}>
      <PageReadMarker moduleId={APPENDIX_PROGRESS_KEY} slug={appendix.slug} />

      <header
        className="border-b border-border"
        style={{ background: `linear-gradient(150deg, ${accent}14, transparent 70%)` }}
      >
        <div className="mx-auto max-w-wide px-4 py-6">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs">
              <li>
                <Link
                  href="/appendices"
                  className="font-semibold no-underline accent-text hover:underline"
                >
                  Appendices
                </Link>
              </li>
              <li aria-hidden="true" className="text-border">
                /
              </li>
              <li className="min-w-0">
                <span className="text-muted" aria-current="page">
                  {appendix.letter} · {appendix.title}
                </span>
              </li>
            </ol>
          </nav>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <span className="inline-flex items-center gap-1 text-muted">
              <Icon name={appendix.kind === 'notebook' ? 'notebook' : 'book'} size={13} />
              {appendix.kind === 'notebook' ? 'Notebook' : 'Reference reading'}
            </span>
            {appendix.estimatedMinutes !== null && (
              <>
                <span className="text-muted">·</span>
                <span className="inline-flex items-center gap-1 text-muted">
                  <Icon name="clock" size={13} />
                  {formatMinutes(appendix.estimatedMinutes)}
                </span>
              </>
            )}
          </div>

          <h1 className="mt-2 text-3xl font-bold text-ink">
            <span className="accent-text">Appendix {appendix.letter}</span>
            <span className="mx-2 text-border">/</span>
            {appendix.title}
          </h1>
          <p className="mt-1.5 max-w-content text-lg text-muted">{appendix.blurb}</p>
        </div>
      </header>

      <div className="mx-auto max-w-wide px-4 py-8">
        {children}

        <nav className="mt-12 grid gap-3 border-t border-border pt-6 sm:grid-cols-2">
          {prev ? (
            <Link
              href={`/appendices/${prev.slug}`}
              className="card group flex items-center gap-3 p-4 no-underline transition-shadow duration-base ease-token hover:shadow-lift"
            >
              <Icon name="arrow-left" size={18} className="shrink-0 text-muted" />
              <span className="min-w-0">
                <span className="block text-xs uppercase tracking-wide text-muted">
                  Previous appendix
                </span>
                <span className="block truncate text-sm font-semibold text-ink">
                  {prev.letter} · {prev.title}
                </span>
              </span>
            </Link>
          ) : (
            <Link
              href="/appendices"
              className="card group flex items-center gap-3 p-4 no-underline transition-shadow duration-base ease-token hover:shadow-lift"
            >
              <Icon name="arrow-left" size={18} className="shrink-0 text-muted" />
              <span className="min-w-0">
                <span className="block text-xs uppercase tracking-wide text-muted">Back to</span>
                <span className="block truncate text-sm font-semibold text-ink">
                  All appendices
                </span>
              </span>
            </Link>
          )}

          {next && (
            <Link
              href={`/appendices/${next.slug}`}
              className="card group flex items-center justify-end gap-3 p-4 text-right no-underline transition-shadow duration-base ease-token hover:shadow-lift sm:col-start-2"
            >
              <span className="min-w-0">
                <span className="block text-xs uppercase tracking-wide text-muted">
                  Next appendix
                </span>
                <span className="block truncate text-sm font-semibold text-ink">
                  {next.letter} · {next.title}
                </span>
              </span>
              <Icon name="arrow-right" size={18} className="shrink-0 accent-text" />
            </Link>
          )}
        </nav>
      </div>
    </div>
  );
}
