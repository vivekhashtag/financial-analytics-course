'use client';

import { useEffect, useMemo, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { useProgress } from '@/components/progress/ProgressProvider';
import type { Badge, QuizQuestion } from '@/lib/types';

interface QuizViewProps {
  moduleId: string;
  moduleTitle: string;
  questions: QuizQuestion[];
  passMark: number;
  badge: Badge | null;
}

/** One answer, shaped by question type. */
type Answer = number | number[] | string | Record<number, string> | null;

export function QuizView({ moduleId, moduleTitle, questions, passMark, badge }: QuizViewProps) {
  const { recordQuiz, awardBadge, moduleProgress, hydrated } = useProgress();

  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [attempt, setAttempt] = useState(0);

  const results = useMemo(
    () =>
      Object.fromEntries(
        questions.map((q) => [q.id, isCorrect(q, answers[q.id] ?? null)] as const),
      ),
    [questions, answers],
  );

  const checkedCount = questions.filter((q) => checked[q.id]).length;
  const score = questions.filter((q) => checked[q.id] && results[q.id]).length;
  const allChecked = checkedCount === questions.length;
  const passed = score >= passMark;

  // Persist once the whole quiz has been checked.
  useEffect(() => {
    if (!allChecked || !hydrated) return;
    recordQuiz(moduleId, score, questions.length, passMark);
    if (passed && badge) awardBadge(badge.id);
    // `attempt` re-runs this after a retake.
  }, [allChecked, hydrated, attempt]); // eslint-disable-line react-hooks/exhaustive-deps

  const saved = hydrated ? moduleProgress(moduleId) : null;

  const setAnswer = (id: string, value: Answer) => {
    if (checked[id]) return;
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const retake = () => {
    setAnswers({});
    setChecked({});
    setAttempt((a) => a + 1);
  };

  return (
    <section className="widget not-prose" id="quiz">
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold text-ink">Quiz</h3>
          <p className="mt-1 text-sm text-muted">
            {questions.length} questions · pass mark {passMark}/{questions.length}. Instant
            feedback on every answer.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saved && saved.quizScore !== null && (
            <span className="chip bg-surface-alt text-muted">
              Best so far: {saved.quizScore}/{saved.quizTotal ?? questions.length}
            </span>
          )}
          <span className="chip accent-bg-soft accent-text">
            {checkedCount}/{questions.length} answered
          </span>
        </div>
      </header>

      <ol className="space-y-4">
        {questions.map((q, i) => (
          <QuestionCard
            key={q.id}
            index={i}
            question={q}
            answer={answers[q.id] ?? null}
            checked={!!checked[q.id]}
            correct={results[q.id]}
            onAnswer={(v) => setAnswer(q.id, v)}
            onCheck={() => setChecked((prev) => ({ ...prev, [q.id]: true }))}
          />
        ))}
      </ol>

      {allChecked && (
        <div
          className={`mt-6 rounded-lg border p-5 animate-fade-up ${
            passed ? 'border-success/35 bg-success/[0.06]' : 'border-warn/40 bg-warn/[0.06]'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-full text-white ${
                  passed ? 'bg-success' : 'bg-warn'
                }`}
              >
                <Icon name={passed ? 'check' : 'refresh-cw'} size={22} strokeWidth={2.5} />
              </span>
              <div>
                <p className="text-lg font-semibold text-ink">
                  {score}/{questions.length} — {passed ? 'passed' : 'not quite'}
                </p>
                <p className="text-sm text-muted">
                  {passed
                    ? `${moduleTitle} quiz cleared (pass mark ${passMark}).`
                    : `You need ${passMark} to pass. Re-read the pages behind the ones you missed, then retake.`}
                </p>
              </div>
            </div>
            <button type="button" onClick={retake} className="btn-secondary">
              <Icon name="refresh-cw" size={15} />
              Retake
            </button>
          </div>

          {passed && badge && (
            <div className="mt-4 flex items-center gap-3 rounded-md border border-success/25 bg-bg px-4 py-3">
              {/* one-time spring: the badge arriving is the payoff of the module */}
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-success/12 text-success animate-spring-pop">
                <Icon name={badge.icon ?? 'award'} size={20} />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Badge earned
                </p>
                <p className="text-base font-semibold text-ink">{badge.label}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------------- */

function QuestionCard({
  index,
  question,
  answer,
  checked,
  correct,
  onAnswer,
  onCheck,
}: {
  index: number;
  question: QuizQuestion;
  answer: Answer;
  checked: boolean;
  correct: boolean;
  onAnswer: (v: Answer) => void;
  onCheck: () => void;
}) {
  const answerable = hasAnswer(question, answer);

  return (
    <li
      className={`card overflow-hidden transition-colors duration-base ease-token ${
        checked
          ? correct
            ? 'border-success/40 animate-pulse-correct'
            : 'border-danger/40'
          : ''
      }`}
    >
      <div className="flex items-start gap-3 px-4 pt-4">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-alt text-xs font-semibold tabular-nums text-muted">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-base font-medium text-ink">
            <InlineCode text={question.prompt} />
          </p>
          {question.difficulty && (
            <span className="mt-1.5 inline-block text-xs font-medium uppercase tracking-wide text-muted">
              {question.difficulty}
              {question.type === 'multi' && ' · select all that apply'}
              {question.type === 'match' && ' · match every row'}
            </span>
          )}
        </div>
        {checked && (
          <span
            className={`chip shrink-0 ${
              correct ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
            }`}
          >
            <Icon name={correct ? 'check' : 'x'} size={12} strokeWidth={3} />
            {correct ? 'Correct' : 'Not this one'}
          </span>
        )}
      </div>

      <div className="px-4 py-3">
        <QuestionBody
          question={question}
          answer={answer}
          checked={checked}
          onAnswer={onAnswer}
        />
      </div>

      {!checked ? (
        <div className="border-t border-border bg-surface/60 px-4 py-2.5">
          <button
            type="button"
            onClick={onCheck}
            disabled={!answerable}
            className="btn-primary px-3 py-1.5 text-xs"
          >
            Check answer
          </button>
        </div>
      ) : (
        question.explanation && (
          <div className="border-t border-border bg-surface/60 px-4 py-3 text-sm text-ink animate-slide-open">
            <span className="font-semibold">Why: </span>
            <InlineCode text={question.explanation} />
          </div>
        )
      )}
    </li>
  );
}

function QuestionBody({
  question,
  answer,
  checked,
  onAnswer,
}: {
  question: QuizQuestion;
  answer: Answer;
  checked: boolean;
  onAnswer: (v: Answer) => void;
}) {
  const type = question.type ?? 'single';

  if (type === 'match') return <MatchBody question={question} answer={answer} checked={checked} onAnswer={onAnswer} />;

  if (type === 'numeric') {
    const value = typeof answer === 'string' ? answer : '';
    const ok = isCorrect(question, answer);
    return (
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="number"
          inputMode="decimal"
          step="any"
          value={value}
          disabled={checked}
          onChange={(e) => onAnswer(e.target.value)}
          placeholder="Your answer"
          className={`w-40 rounded-md border px-3 py-2 font-mono text-sm outline-none transition-colors duration-fast ease-token disabled:bg-surface ${
            checked ? (ok ? 'border-success' : 'border-danger') : 'border-border focus:border-primary'
          }`}
        />
        {question.unit && <span className="text-sm text-muted">{question.unit}</span>}
        {checked && !ok && (
          <span className="text-sm text-success">
            Correct answer: <strong className="font-mono">{String(question.answer)}</strong>
          </span>
        )}
      </div>
    );
  }

  const options = question.options ?? [];
  const multi = type === 'multi';
  const selected = multi
    ? Array.isArray(answer)
      ? answer
      : []
    : typeof answer === 'number'
      ? [answer]
      : [];
  const correctSet = new Set(
    multi
      ? Array.isArray(question.answer)
        ? question.answer
        : []
      : typeof question.answer === 'number'
        ? [question.answer]
        : [],
  );

  return (
    <ul className="space-y-2">
      {options.map((option, i) => {
        const isSelected = selected.includes(i);
        const isRight = correctSet.has(i);

        let tone = 'border-border bg-bg hover:bg-surface';
        if (checked) {
          if (isRight) tone = 'border-success/50 bg-success/[0.07]';
          else if (isSelected) tone = 'border-danger/50 bg-danger/[0.07]';
          else tone = 'border-border bg-bg opacity-70';
        } else if (isSelected) {
          tone = 'border-primary bg-primary/[0.07]';
        }

        return (
          <li key={i}>
            <label
              className={`flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2.5 text-sm transition-colors duration-fast ease-token ${tone} ${
                checked ? 'cursor-default' : ''
              }`}
            >
              <input
                type={multi ? 'checkbox' : 'radio'}
                name={question.id}
                checked={isSelected}
                disabled={checked}
                onChange={() => {
                  if (multi) {
                    const next = new Set(selected);
                    if (next.has(i)) next.delete(i);
                    else next.add(i);
                    onAnswer([...next].sort((a, b) => a - b));
                  } else {
                    onAnswer(i);
                  }
                }}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={`mt-px flex h-[18px] w-[18px] shrink-0 items-center justify-center border ${
                  multi ? 'rounded-sm' : 'rounded-full'
                } ${
                  isSelected || (checked && isRight)
                    ? checked
                      ? isRight
                        ? 'border-transparent bg-success text-white'
                        : 'border-transparent bg-danger text-white'
                      : 'border-transparent bg-primary text-white'
                    : 'border-border bg-bg'
                }`}
              >
                {(isSelected || (checked && isRight)) && (
                  <Icon
                    name={checked && isSelected && !isRight ? 'x' : 'check'}
                    size={11}
                    strokeWidth={3.5}
                  />
                )}
              </span>
              <span className="text-ink">
                <InlineCode text={option} />
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}

function MatchBody({
  question,
  answer,
  checked,
  onAnswer,
}: {
  question: QuizQuestion;
  answer: Answer;
  checked: boolean;
  onAnswer: (v: Answer) => void;
}) {
  const pairs = question.pairs ?? [];
  const choices = [...new Set(pairs.map((p) => p.right))].sort();
  const current = (answer && typeof answer === 'object' && !Array.isArray(answer)
    ? answer
    : {}) as Record<number, string>;

  return (
    <ul className="space-y-2">
      {pairs.map((pair, i) => {
        const value = current[i] ?? '';
        const right = value === pair.right;

        return (
          <li
            key={i}
            className={`flex flex-wrap items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm ${
              checked
                ? right
                  ? 'border-success/50 bg-success/[0.07]'
                  : 'border-danger/50 bg-danger/[0.07]'
                : 'border-border'
            }`}
          >
            <span className="min-w-0 flex-1 text-ink">{pair.left}</span>
            <div className="flex items-center gap-2">
              <select
                value={value}
                disabled={checked}
                onChange={(e) => onAnswer({ ...current, [i]: e.target.value })}
                className="rounded-md border border-border bg-bg px-2 py-1.5 text-sm text-ink outline-none focus:border-primary disabled:bg-surface"
              >
                <option value="">Choose…</option>
                {choices.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {checked && !right && (
                <span className="text-xs font-semibold text-success">{pair.right}</span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/* ------------------------------------------------------------- answer logic */

function hasAnswer(q: QuizQuestion, a: Answer): boolean {
  const type = q.type ?? 'single';
  if (type === 'multi') return Array.isArray(a) && a.length > 0;
  if (type === 'numeric') return typeof a === 'string' && a.trim() !== '';
  if (type === 'match') {
    const pairs = q.pairs ?? [];
    const given = (a && typeof a === 'object' && !Array.isArray(a) ? a : {}) as Record<
      number,
      string
    >;
    return pairs.every((_, i) => !!given[i]);
  }
  return typeof a === 'number';
}

/** One point per question; `match` is all-or-nothing so the score stays out of N. */
export function isCorrect(q: QuizQuestion, a: Answer): boolean {
  const type = q.type ?? 'single';

  if (type === 'multi') {
    const expected = Array.isArray(q.answer) ? [...q.answer].sort((x, y) => x - y) : [];
    const got = Array.isArray(a) ? [...a].sort((x, y) => x - y) : [];
    return expected.length > 0 && expected.length === got.length && expected.every((v, i) => v === got[i]);
  }

  if (type === 'numeric') {
    if (typeof a !== 'string' || a.trim() === '') return false;
    const got = Number.parseFloat(a);
    const expected = typeof q.answer === 'number' ? q.answer : NaN;
    if (!Number.isFinite(got) || !Number.isFinite(expected)) return false;
    const tol = q.tolerance ?? Math.max(Math.abs(expected) * 0.001, 1e-9);
    return Math.abs(got - expected) <= tol;
  }

  if (type === 'match') {
    const pairs = q.pairs ?? [];
    const given = (a && typeof a === 'object' && !Array.isArray(a) ? a : {}) as Record<
      number,
      string
    >;
    return pairs.length > 0 && pairs.every((p, i) => given[i] === p.right);
  }

  return typeof a === 'number' && a === q.answer;
}

/**
 * Quiz prompts and options are plain strings that contain Markdown backticks
 * (`0.1 + 0.2 == 0.3`). Render those spans as code without pulling MDX in.
 */
export function InlineCode({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('`') && part.endsWith('`') && part.length > 2 ? (
          <code
            key={i}
            className="rounded-sm bg-surface-alt px-1 py-0.5 font-mono text-[0.9em] text-ink"
          >
            {part.slice(1, -1)}
          </code>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}
