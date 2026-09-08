'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { moduleCompletion, useProgress } from '@/components/progress/ProgressProvider';
import type { Badge, PartId } from '@/lib/types';

export interface ModuleRow {
  id: string;
  number: string;
  title: string;
  part: PartId;
  color: string;
  badge: Badge | null;
  totals: { pages: number; notebooks: number; exercises: number; hasQuiz: boolean };
  quizTotal: number | null;
  passMark: number | null;
}

export function ProgressDashboard({ rows }: { rows: ModuleRow[] }) {
  const { hydrated, state, moduleProgress, resetAll, resetModule } = useProgress();
  const [confirming, setConfirming] = useState(false);

  if (!hydrated) {
    return <p className="mt-8 text-sm text-muted">Reading your progress…</p>;
  }

  const badges = rows
    .map((r) => r.badge)
    .filter((b): b is Badge => !!b)
    .map((b) => ({ ...b, earned: state.badges.includes(b.id) }));

  const overall = Math.round(
    rows.reduce((sum, r) => sum + moduleCompletion(moduleProgress(r.id), r.totals), 0) /
      Math.max(1, rows.length),
  );

  const pagesRead = rows.reduce((s, r) => s + moduleProgress(r.id).pagesRead.length, 0);
  const notebooks = rows.reduce((s, r) => s + moduleProgress(r.id).notebooksDownloaded.length, 0);
  const exercises = rows.reduce((s, r) => s + moduleProgress(r.id).exercisesComplete.length, 0);
  const quizzes = rows.filter((r) => moduleProgress(r.id).quizPassed).length;

  return (
    <div className="mt-8 space-y-10">
      {/* headline numbers */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: 'Course complete', value: `${overall}%`, icon: 'trending-up' },
          { label: 'Pages read', value: String(pagesRead), icon: 'book' },
          { label: 'Notebooks taken', value: String(notebooks), icon: 'notebook' },
          { label: 'Exercises done', value: String(exercises), icon: 'pencil' },
          { label: 'Quizzes passed', value: String(quizzes), icon: 'check-circle' },
        ].map((s) => (
          <div key={s.label} className="card p-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Icon name={s.icon} size={16} />
            </span>
            <p className="mt-2.5 text-2xl font-bold text-ink tabular-nums">{s.value}</p>
            <p className="text-xs text-muted">{s.label}</p>
          </div>
        ))}
      </section>

      {/* badges */}
      {badges.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-ink">
            Badges{' '}
            <span className="text-sm font-normal text-muted">
              {badges.filter((b) => b.earned).length} of {badges.length}
            </span>
          </h2>
          <ul className="mt-4 flex flex-wrap gap-3">
            {badges.map((b) => (
              <li
                key={b.id}
                className={`flex items-center gap-2.5 rounded-full border px-3.5 py-2 ${
                  b.earned
                    ? 'border-success/40 bg-success/[0.07]'
                    : 'border-border bg-surface opacity-70'
                }`}
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full ${
                    b.earned ? 'bg-success text-white' : 'bg-surface-alt text-muted'
                  }`}
                >
                  <Icon name={b.earned ? (b.icon ?? 'award') : 'lock'} size={14} />
                </span>
                <span className={`text-sm font-semibold ${b.earned ? 'text-ink' : 'text-muted'}`}>
                  {b.label}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* per-module table */}
      <section>
        <h2 className="text-xl font-semibold text-ink">By module</h2>
        <div className="mt-4 overflow-x-auto rounded-lg border border-border">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-surface">
              <tr>
                {['Module', 'Pages', 'Notebooks', 'Exercises', 'Quiz', 'Done', ''].map((h) => (
                  <th
                    key={h}
                    className="whitespace-nowrap border-b border-border px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const p = moduleProgress(r.id);
                const pct = moduleCompletion(p, r.totals);

                return (
                  <tr key={r.id} className="border-b border-border last:border-b-0">
                    <td className="px-3 py-3">
                      <Link
                        href={`/modules/${r.id}`}
                        className="flex items-center gap-2 no-underline"
                      >
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: r.color }}
                        />
                        <span className="font-medium text-ink hover:underline">
                          {r.number} · {r.title}
                        </span>
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 tabular-nums text-muted">
                      {p.pagesRead.length}/{r.totals.pages}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 tabular-nums text-muted">
                      {r.totals.notebooks
                        ? `${p.notebooksDownloaded.length}/${r.totals.notebooks}`
                        : '—'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 tabular-nums text-muted">
                      {r.totals.exercises
                        ? `${p.exercisesComplete.length}/${r.totals.exercises}`
                        : '—'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      {!r.totals.hasQuiz ? (
                        <span className="text-muted">—</span>
                      ) : p.quizScore === null ? (
                        <span className="text-muted">not taken</span>
                      ) : (
                        <span
                          className={p.quizPassed ? 'font-semibold text-success' : 'text-warn'}
                        >
                          {p.quizScore}/{p.quizTotal ?? r.quizTotal}
                          {!p.quizPassed && r.passMark && ` (need ${r.passMark})`}
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-alt">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, backgroundColor: r.color }}
                          />
                        </div>
                        <span className="tabular-nums text-xs text-muted">{pct}%</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right">
                      {pct > 0 && (
                        <button
                          type="button"
                          onClick={() => resetModule(r.id)}
                          className="btn-ghost px-2 py-1 text-xs"
                          title={`Reset progress for module ${r.number}`}
                        >
                          <Icon name="refresh-cw" size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card p-4">
        <h2 className="text-base font-semibold text-ink">Start over</h2>
        <p className="mt-1 text-sm text-muted">
          Clears pages read, notebooks, exercises, quiz scores and badges for every module.
        </p>
        <div className="mt-3 flex items-center gap-2">
          {confirming ? (
            <>
              <button
                type="button"
                onClick={() => {
                  resetAll();
                  setConfirming(false);
                }}
                className="btn px-3 py-1.5 text-xs bg-danger text-white hover:brightness-110"
              >
                Yes, erase everything
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="btn-ghost px-3 py-1.5 text-xs"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="btn-secondary px-3 py-1.5 text-xs"
            >
              <Icon name="refresh-cw" size={13} />
              Reset all progress
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
