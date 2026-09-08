'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';

export interface DecisionNode {
  q: string;
  /** an answer, or the literal "next" to fall through to the following question */
  yes: string;
  no: string;
}

/**
 * A small branching list. Module 2 uses it once — "choosing between lists,
 * dicts, tuples and sets" — so it stays deliberately simple: walk the questions
 * top to bottom, and a non-"next" answer ends the walk.
 */
export function DecisionTree({ tree, title }: { tree: DecisionNode[]; title?: string }) {
  const [answers, setAnswers] = useState<Record<number, 'yes' | 'no'>>({});

  const isNext = (v: string) => v.trim().toLowerCase() === 'next';

  // Which questions are still live, and what has been landed on.
  let active = 0;
  let outcome: string | null = null;
  for (let i = 0; i < tree.length; i += 1) {
    const answer = answers[i];
    if (!answer) {
      active = i;
      break;
    }
    const value = answer === 'yes' ? tree[i].yes : tree[i].no;
    if (!isNext(value)) {
      outcome = value;
      active = i;
      break;
    }
    active = i + 1;
  }

  const reset = () => setAnswers({});

  return (
    <div className="widget not-prose card overflow-hidden">
      <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-2.5">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Icon name="git-branch" size={15} className="text-primary" />
          {title ?? 'Which one should I use?'}
        </h4>
        {Object.keys(answers).length > 0 && (
          <button type="button" onClick={reset} className="btn-ghost px-2 py-1 text-xs">
            <Icon name="refresh-cw" size={13} /> Start over
          </button>
        )}
      </div>

      <ol className="divide-y divide-border">
        {tree.map((node, i) => {
          const answer = answers[i];
          const reached = i <= active;
          const value = answer === 'yes' ? node.yes : answer === 'no' ? node.no : null;
          const landed = value && !isNext(value) ? value : null;

          return (
            <li
              key={i}
              className={`px-4 py-3 transition-opacity duration-base ease-token ${
                reached ? 'opacity-100' : 'pointer-events-none opacity-40'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="flex-1 text-sm text-ink">
                  <span className="mr-2 font-mono text-xs text-muted">{i + 1}.</span>
                  {node.q}
                </p>

                <div className="flex shrink-0 gap-2">
                  {(['yes', 'no'] as const).map((choice) => (
                    <button
                      key={choice}
                      type="button"
                      disabled={!reached}
                      onClick={() =>
                        setAnswers((prev) => {
                          // Answering a question invalidates everything below it.
                          const next: Record<number, 'yes' | 'no'> = {};
                          for (const [k, v] of Object.entries(prev)) {
                            if (Number(k) < i) next[Number(k)] = v;
                          }
                          next[i] = choice;
                          return next;
                        })
                      }
                      className={
                        answer === choice
                          ? 'btn rounded-full bg-primary px-3 py-1 text-xs text-white'
                          : 'btn rounded-full border border-border px-3 py-1 text-xs text-muted hover:bg-surface hover:text-ink'
                      }
                    >
                      {choice === 'yes' ? 'Yes' : 'No'}
                    </button>
                  ))}
                </div>
              </div>

              {landed && (
                <p className="mt-3 flex items-center gap-2 rounded-md bg-success/[0.08] px-3 py-2 text-sm font-semibold text-success animate-pop-in">
                  <Icon name="check-circle" size={15} />
                  Use a <code className="font-mono">{landed}</code>
                </p>
              )}
              {value && isNext(value) && (
                <p className="mt-2 text-xs text-muted">→ next question</p>
              )}
            </li>
          );
        })}
      </ol>

      {outcome && (
        <div className="border-t border-border bg-success/[0.06] px-4 py-3 text-sm">
          <span className="font-semibold text-success">Answer:</span>{' '}
          <code className="font-mono text-ink">{outcome}</code>
        </div>
      )}
    </div>
  );
}
