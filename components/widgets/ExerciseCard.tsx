'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { useProgress } from '@/components/progress/ProgressProvider';
import { CodePeek } from './CodePeek';
import type { Exercise } from '@/lib/types';

/**
 * One exercise: brief, copyable starter code, the assert cell it must satisfy,
 * hints revealed one at a time, and a solution behind the attempt gate.
 *
 * There is no in-browser Python in v1 — the assert cell runs in the learner's
 * notebook, and completion is self-reported the way CONTENT_SCHEMA describes.
 */
export function ExerciseCard({
  moduleId,
  exercise,
  index,
  notebookTitle,
}: {
  moduleId: string;
  exercise: Exercise;
  index: number;
  notebookTitle: string | null;
}) {
  const { hydrated, has, toggle, add } = useProgress();
  const [hintsShown, setHintsShown] = useState(0);

  const attempted = hydrated && has(moduleId, 'exercisesAttempted', exercise.id);
  const complete = hydrated && has(moduleId, 'exercisesComplete', exercise.id);

  const hints = exercise.hints ?? [];

  return (
    <article
      className={`card overflow-hidden transition-colors duration-base ease-token ${
        complete ? 'border-success/40' : ''
      }`}
    >
      <header className="flex flex-wrap items-start gap-3 border-b border-border bg-surface px-4 py-3">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-alt text-xs font-semibold tabular-nums text-muted">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <h4 className="text-base font-semibold text-ink">{exercise.title}</h4>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
            <code className="font-mono">{exercise.id}</code>
            {exercise.points ? (
              <span className="chip accent-bg-soft accent-text">{exercise.points} pts</span>
            ) : null}
            {notebookTitle && (
              <span className="inline-flex items-center gap-1">
                <Icon name="notebook" size={12} />
                {notebookTitle}
              </span>
            )}
            {exercise.notebookRef && !notebookTitle && (
              <span className="inline-flex items-center gap-1">
                <Icon name="notebook" size={12} />
                {exercise.notebookRef}
              </span>
            )}
          </div>
        </div>
        {complete && (
          <span className="chip shrink-0 bg-success/10 text-success">
            <Icon name="check" size={12} strokeWidth={3} /> Done
          </span>
        )}
      </header>

      <div className="space-y-4 px-4 py-4">
        {exercise.brief ? (
          <p className="text-sm text-ink">{exercise.brief}</p>
        ) : (
          <p className="text-sm text-muted">
            This one lives in the notebook — open it, do the exercise, then mark it here.
          </p>
        )}

        {exercise.starterCode && (
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
              Starter code
            </p>
            <CodePeek code={exercise.starterCode} lang="python" />
          </div>
        )}

        {exercise.checkCode && (
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
              Your answer must pass this
            </p>
            <CodePeek code={exercise.checkCode} lang="python" title="paste as the next cell" />
          </div>
        )}

        {hints.length > 0 && (
          <div className="rounded-md border border-border bg-surface/60 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Hints ({hintsShown}/{hints.length} revealed)
              </p>
              {hintsShown < hints.length && (
                <button
                  type="button"
                  onClick={() => setHintsShown((n) => n + 1)}
                  className="btn-ghost px-2 py-1 text-xs"
                >
                  <Icon name="eye" size={13} />
                  {hintsShown === 0 ? 'Show a hint' : 'Next hint'}
                </button>
              )}
            </div>
            {hintsShown > 0 && (
              <ol className="mt-2 space-y-1.5">
                {hints.slice(0, hintsShown).map((hint, i) => (
                  <li key={i} className="flex gap-2 text-sm text-ink animate-fade-up">
                    <span className="font-mono text-xs text-muted">{i + 1}.</span>
                    {hint}
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}

        {/* The attempt gate. Soft everywhere else in the app; here it is the point. */}
        <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3">
          <label className="flex cursor-pointer items-center gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={attempted}
              onChange={() => toggle(moduleId, 'exercisesAttempted', exercise.id)}
              className="sr-only"
            />
            <span
              aria-hidden="true"
              className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-sm border transition-all duration-fast ease-token ${
                attempted ? 'border-transparent bg-primary text-white' : 'border-border bg-bg'
              }`}
            >
              {attempted && <Icon name="check" size={12} strokeWidth={3} />}
            </span>
            <span className="text-ink">I&apos;ve attempted this</span>
          </label>

          <button
            type="button"
            onClick={() => toggle(moduleId, 'exercisesComplete', exercise.id)}
            onMouseDown={() => {
              if (!attempted) add(moduleId, 'exercisesAttempted', exercise.id);
            }}
            className={complete ? 'btn-secondary px-3 py-1.5 text-xs' : 'btn-primary px-3 py-1.5 text-xs'}
          >
            <Icon name={complete ? 'refresh-cw' : 'check-circle'} size={14} />
            {complete ? 'Mark not done' : 'Mark complete'}
          </button>
        </div>

        {exercise.solution && (
          <div>
            {attempted ? (
              <div className="animate-fade-up">
                <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-success">
                  <Icon name="unlock" size={13} /> Solution
                </p>
                <CodePeek code={exercise.solution} lang="python" />
              </div>
            ) : (
              <div className="flex items-center gap-2.5 rounded-md border border-dashed border-border bg-surface p-3 text-sm text-muted">
                <Icon name="lock" size={15} />
                Tick <strong className="font-semibold text-ink">I&apos;ve attempted this</strong> to
                unlock the solution.
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
