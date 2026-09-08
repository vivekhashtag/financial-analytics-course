'use client';

import { useEffect, useMemo, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { useProgress } from '@/components/progress/ProgressProvider';

interface Scenario {
  text: string;
  answer: string;
  why?: string;
}

/** The four biases plus whatever else the content lists as a correct answer. */
const CANONICAL = ['Look-ahead', 'Survivorship', 'Point-in-time', 'Regime change'];

export function BiasDetectiveView({
  moduleId,
  exerciseId,
  title,
  brief,
  points,
  scenarios,
}: {
  moduleId: string;
  exerciseId: string;
  title: string;
  brief?: string;
  points?: number;
  scenarios: Scenario[];
}) {
  const { hydrated, add, has } = useProgress();

  const options = useMemo(() => {
    const fromContent = [...new Set(scenarios.map((s) => s.answer))];
    return [...new Set([...CANONICAL, ...fromContent])];
  }, [scenarios]);

  const [index, setIndex] = useState(0);
  const [given, setGiven] = useState<(string | null)[]>(() => scenarios.map(() => null));
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);

  const scenario = scenarios[index];
  const answer = given[index];
  const answered = answer !== null;
  const correct = answered && answer === scenario.answer;

  const score = given.filter((g, i) => g === scenarios[i].answer).length;
  const allAnswered = given.every((g) => g !== null);
  const complete = hydrated && has(moduleId, 'exercisesComplete', exerciseId);

  useEffect(() => {
    if (allAnswered && hydrated) {
      add(moduleId, 'exercisesAttempted', exerciseId);
      if (score === scenarios.length) add(moduleId, 'exercisesComplete', exerciseId);
    }
  }, [allAnswered, score, hydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  const choose = (option: string) => {
    if (answered) return;
    setGiven((prev) => prev.map((g, i) => (i === index ? option : g)));

    if (option === scenario.answer) {
      const next = streak + 1;
      setStreak(next);
      setBest((b) => Math.max(b, next));
    } else {
      setStreak(0);
    }
  };

  const restart = () => {
    setGiven(scenarios.map(() => null));
    setIndex(0);
    setStreak(0);
  };

  return (
    <section className="widget not-prose card overflow-hidden">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-surface px-4 py-3">
        <div>
          <h4 className="flex items-center gap-2 text-base font-semibold text-ink">
            <Icon name="search" size={16} className="text-primary" />
            {title}
          </h4>
          {brief && <p className="mt-1 text-sm text-muted">{brief}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {points ? <span className="chip accent-bg-soft accent-text">{points} pts</span> : null}
          <span
            className={`chip ${streak >= 2 ? 'bg-warn/12 text-warn' : 'bg-surface-alt text-muted'}`}
            title="Consecutive correct answers"
          >
            <Icon name="flame" size={13} />
            Streak {streak}
            {best > streak && ` · best ${best}`}
          </span>
          {complete && (
            <span className="chip bg-success/10 text-success">
              <Icon name="check" size={12} strokeWidth={3} /> Done
            </span>
          )}
        </div>
      </header>

      {/* progress dots */}
      <div className="flex items-center gap-1.5 px-4 pt-3">
        {scenarios.map((s, i) => {
          const g = given[i];
          const tone =
            g === null
              ? i === index
                ? 'bg-primary'
                : 'bg-surface-alt'
              : g === s.answer
                ? 'bg-success'
                : 'bg-danger';
          return (
            <button
              key={i}
              type="button"
              aria-label={`Scenario ${i + 1}`}
              aria-current={i === index}
              onClick={() => setIndex(i)}
              className={`h-2 flex-1 rounded-full transition-colors duration-fast ease-token ${tone} ${
                i === index ? 'ring-2 ring-primary/30 ring-offset-1' : ''
              }`}
            />
          );
        })}
      </div>

      <div className="px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          Scenario {index + 1} of {scenarios.length}
        </p>
        <p className="mt-2 text-base text-ink">{scenario.text}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {options.map((option) => {
            const isRight = option === scenario.answer;
            const isPicked = option === answer;

            let tone = 'border-border bg-bg text-ink hover:bg-surface';
            if (answered) {
              if (isRight) tone = 'border-success/50 bg-success/10 text-success';
              else if (isPicked) tone = 'border-danger/50 bg-danger/10 text-danger';
              else tone = 'border-border bg-bg text-muted opacity-70';
            }

            return (
              <button
                key={option}
                type="button"
                disabled={answered}
                onClick={() => choose(option)}
                className={`btn rounded-full border px-3.5 py-1.5 text-xs ${tone}`}
              >
                {answered && (isRight || isPicked) && (
                  <Icon name={isRight ? 'check' : 'x'} size={12} strokeWidth={3} />
                )}
                {option}
              </button>
            );
          })}
        </div>

        {answered && (
          <div
            className={`mt-4 rounded-md border-l-4 p-3 text-sm animate-fade-up ${
              correct
                ? 'border-success bg-success/[0.06]'
                : 'border-danger bg-danger/[0.06]'
            }`}
          >
            <p className="font-semibold text-ink">
              {correct ? 'Correct' : `Not quite — it's ${scenario.answer}`}
            </p>
            {scenario.why && <p className="mt-1 text-muted">{scenario.why}</p>}
          </div>
        )}
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-surface/60 px-4 py-3">
        <span className="text-sm text-muted">
          {score}/{scenarios.length} correct
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            className="btn-secondary px-3 py-1.5 text-xs"
          >
            <Icon name="arrow-left" size={13} /> Back
          </button>
          {index < scenarios.length - 1 ? (
            <button
              type="button"
              onClick={() => setIndex((i) => Math.min(scenarios.length - 1, i + 1))}
              className="btn-primary px-3 py-1.5 text-xs"
            >
              Next <Icon name="arrow-right" size={13} />
            </button>
          ) : (
            <button type="button" onClick={restart} className="btn-secondary px-3 py-1.5 text-xs">
              <Icon name="refresh-cw" size={13} /> Play again
            </button>
          )}
        </div>
      </footer>
    </section>
  );
}
