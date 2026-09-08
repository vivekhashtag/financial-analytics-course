'use client';

import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { moduleCompletion, useProgress } from '@/components/progress/ProgressProvider';
import { Meter } from '@/components/motion/Meter';

export interface ResumeModule {
  id: string;
  /** course order, so "furthest" is well defined */
  order: number;
  number: string;
  title: string;
  part: string;
  color: string;
  pages: { slug: string; title: string }[];
  totals: { pages: number; notebooks: number; exercises: number; hasQuiz: boolean };
}

/**
 * "Continue where you left off" — the next unread page of the furthest module
 * with any history. Renders nothing for a first-time visitor, so the hero keeps
 * a single call to action.
 */
export function ContinueCard({ modules }: { modules: ResumeModule[] }) {
  const { hydrated, moduleProgress } = useProgress();
  if (!hydrated) return null;

  const touched = modules
    .map((mod) => ({ mod, p: moduleProgress(mod.id) }))
    .filter(
      ({ p }) =>
        p.pagesRead.length > 0 ||
        p.notebooksDownloaded.length > 0 ||
        p.exercisesComplete.length > 0 ||
        p.quizScore !== null,
    );

  if (touched.length === 0) return null;

  // Furthest along the course, not most recently touched — a learner dipping
  // back into Module 1 shouldn't lose their place in Module 6.
  const { mod, p } = touched.sort((a, b) => b.mod.order - a.mod.order)[0];

  const nextPage = mod.pages.find((page) => !p.pagesRead.includes(page.slug));
  const pct = moduleCompletion(p, mod.totals);
  const done = !nextPage;

  const href = done
    ? `/modules/${mod.id}`
    : `/modules/${mod.id}/${nextPage.slug}`;

  return (
    <section
      className="mx-auto -mt-6 max-w-wide px-4"
      style={{ '--accent': mod.color } as React.CSSProperties}
      aria-labelledby="continue-heading"
    >
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-4 p-5">
          <div className="min-w-0 flex-1">
            <p
              id="continue-heading"
              className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest accent-text"
            >
              <Icon name="play" size={13} />
              Continue where you left off
            </p>

            <p className="mt-2 text-lg font-semibold text-ink">
              {done ? (
                <>Every page of {mod.number} · {mod.title} is read</>
              ) : (
                nextPage.title
              )}
            </p>

            <p className="mt-0.5 text-sm text-muted">
              {done
                ? 'Take the quiz or move on to the next module.'
                : `Module ${mod.number} · ${mod.title}`}
            </p>

            <div className="mt-3 flex items-center gap-2.5">
              <Meter value={pct} className="h-1.5 w-32" />
              <span className="text-xs font-semibold tabular-nums text-muted">
                {pct}% of this module
              </span>
            </div>
          </div>

          <Link href={href} className="btn-primary shrink-0 px-5 py-2.5 text-base no-underline">
            {done ? 'Back to the module' : 'Resume'}
            <Icon name="arrow-right" size={17} />
          </Link>
        </div>
      </div>
    </section>
  );
}
