'use client';

import { useState, type ReactNode } from 'react';
import { Icon } from '@/components/ui/Icon';
import { useProgress } from '@/components/progress/ProgressProvider';
import { APPENDIX_PROGRESS_KEY } from '@/lib/progress-keys';

/**
 * A "Try this" paragraph, turned into a guided card.
 *
 * Four parts in order: the task (the appendix's own text, rendered on the
 * server and passed in as children so not a word of it is retyped or
 * paraphrased), a hint, what a good answer looks like, and a tick.
 *
 * Both reveals are gated behind a click on purpose. The hint names the dataset
 * and the technique, and the model answer describes the *shape* of a good
 * answer — three lines lifted from that practice's page of the worked-samples
 * pack. Showing either one unprompted would turn an exercise into a
 * worked example, which is what the samples pack is already for.
 *
 * The tick is stored through ProgressProvider under the appendices pseudo-module
 * (`exercisesComplete`), so it is `localStorage`-backed and survives a reload,
 * and — like everything else on this page — stays outside the module completion
 * arithmetic.
 */
export function GuidedExercise({
  practice,
  hint,
  modelAnswer,
  samplePage,
  children,
}: {
  practice: string;
  hint: string[];
  modelAnswer: string[];
  samplePage: number;
  children: ReactNode;
}) {
  const { hydrated, has, toggle } = useProgress();
  const [showHint, setShowHint] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  const id = `${practice.toLowerCase().replace('.', '')}-try-this`;
  const done = hydrated && has(APPENDIX_PROGRESS_KEY, 'exercisesComplete', id);

  return (
    <section
      className="not-prose my-6 overflow-hidden rounded-lg border border-border"
      style={{
        background:
          'linear-gradient(160deg, color-mix(in srgb, var(--accent) 6%, transparent), transparent 60%)',
      }}
      aria-label={`Guided exercise for ${practice}`}
    >
      <header className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md accent-bg-soft accent-text">
          <Icon name="pencil" size={14} />
        </span>
        <h4 className="text-sm font-semibold text-ink">Try this</h4>
        <span className="font-mono text-[0.7rem] tabular-nums text-muted">{practice}</span>
        {done && (
          <span className="chip ml-auto bg-success/10 text-success">
            <Icon name="check" size={11} strokeWidth={3} /> Done
          </span>
        )}
      </header>

      <div className="px-4 py-4">
        {/* 1 — the task, exactly as the appendix writes it */}
        <div className="prose-course text-prose [&>*:first-child]:!mt-0 [&>*:last-child]:!mb-0">
          {children}
        </div>

        {/* 2 and 3 — the two reveals */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowHint((v) => !v)}
            aria-expanded={showHint}
            className="btn-secondary text-xs"
          >
            <Icon name={showHint ? 'eye' : 'search'} size={13} />
            {showHint ? 'Hide hint' : 'Show hint'}
          </button>

          <button
            type="button"
            onClick={() => setShowAnswer((v) => !v)}
            aria-expanded={showAnswer}
            className="btn-secondary text-xs"
          >
            <Icon name={showAnswer ? 'eye' : 'award'} size={13} />
            {showAnswer ? 'Hide it' : 'What good looks like'}
          </button>
        </div>

        {showHint && (
          <div className="mt-3 animate-slide-open rounded-md border-l-2 border-info bg-surface px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-info">Hint</p>
            <ul className="mt-1.5 space-y-1">
              {hint.map((line) => (
                <li key={line} className="text-sm leading-relaxed text-ink">
                  {line}
                </li>
              ))}
            </ul>
          </div>
        )}

        {showAnswer && (
          <div className="mt-3 animate-slide-open rounded-md border-l-2 border-success bg-surface px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-success">
              What good looks like
            </p>
            <ul className="mt-1.5 space-y-1">
              {modelAnswer.map((line) => (
                <li key={line} className="text-sm leading-relaxed text-ink">
                  {line}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted">
              The full worked version is page {samplePage} of the samples pack.
            </p>
          </div>
        )}

        {/* 4 — the tick */}
        <label className="mt-4 flex cursor-pointer items-center gap-2.5 border-t border-border pt-3 text-sm">
          <input
            type="checkbox"
            checked={done}
            disabled={!hydrated}
            onChange={() => toggle(APPENDIX_PROGRESS_KEY, 'exercisesComplete', id)}
            className="h-4 w-4 shrink-0 accent-part-appendix"
          />
          <span className={done ? 'font-semibold text-success' : 'text-muted'}>I did this</span>
          <span className="ml-auto text-xs text-muted">saved in this browser</span>
        </label>
      </div>
    </section>
  );
}
