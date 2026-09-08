'use client';

import { useEffect, useMemo, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { useProgress } from '@/components/progress/ProgressProvider';
import tokens from '@/schema/tokens.json';

interface SortItem {
  label: string;
  bucket: string;
}

/**
 * Drag an item into a bucket, or tap it and then tap a bucket — the tap path
 * exists because drag-and-drop is unusable on touch and with a keyboard.
 */
export function SortingGameView({
  moduleId,
  exerciseId,
  title,
  brief,
  points,
  items,
}: {
  moduleId: string;
  exerciseId: string;
  title: string;
  brief?: string;
  points?: number;
  items: SortItem[];
}) {
  const { hydrated, setWidget, getWidget, add, has } = useProgress();

  const buckets = useMemo(() => [...new Set(items.map((i) => i.bucket))], [items]);
  const palette = tokens.color.chart;

  const [placed, setPlaced] = useState<Record<number, string>>({});
  const [picked, setPicked] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [dragOver, setDragOver] = useState<string | null>(null);

  // Restore a part-finished attempt.
  useEffect(() => {
    if (!hydrated) return;
    const saved = getWidget<Record<number, string> | null>(moduleId, `sort:${exerciseId}`, null);
    if (saved && Object.keys(saved).length) setPlaced(saved);
    // Only on hydration — later renders must not clobber in-progress work.
  }, [hydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  const persist = (next: Record<number, string>) => {
    setPlaced(next);
    setChecked(false);
    if (hydrated) setWidget(moduleId, `sort:${exerciseId}`, next);
  };

  const place = (index: number, bucket: string) => {
    persist({ ...placed, [index]: bucket });
    setPicked(null);
  };

  const unplace = (index: number) => {
    const next = { ...placed };
    delete next[index];
    persist(next);
  };

  const unplacedItems = items.map((item, i) => ({ ...item, i })).filter(({ i }) => !placed[i]);
  const correctCount = items.filter((item, i) => placed[i] === item.bucket).length;
  const allPlaced = unplacedItems.length === 0;
  const allCorrect = correctCount === items.length;
  const complete = hydrated && has(moduleId, 'exercisesComplete', exerciseId);

  useEffect(() => {
    if (checked && allCorrect && hydrated) {
      add(moduleId, 'exercisesAttempted', exerciseId);
      add(moduleId, 'exercisesComplete', exerciseId);
    }
  }, [checked, allCorrect, hydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section className="widget not-prose card overflow-hidden">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-surface px-4 py-3">
        <div>
          <h4 className="flex items-center gap-2 text-base font-semibold text-ink">
            <Icon name="layers" size={16} className="text-primary" />
            {title}
          </h4>
          {brief && <p className="mt-1 text-sm text-muted">{brief}</p>}
        </div>
        <div className="flex items-center gap-2">
          {points ? <span className="chip accent-bg-soft accent-text">{points} pts</span> : null}
          {complete && (
            <span className="chip bg-success/10 text-success">
              <Icon name="check" size={12} strokeWidth={3} /> Done
            </span>
          )}
        </div>
      </header>

      {/* the unsorted pile */}
      <div className="border-b border-border px-4 py-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          To sort ({unplacedItems.length})
        </p>
        {allPlaced ? (
          <p className="text-sm text-muted">Everything is in a bucket.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {unplacedItems.map(({ label, i }) => (
              <li key={i}>
                <button
                  type="button"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', String(i));
                    setPicked(i);
                  }}
                  onDragEnd={() => setDragOver(null)}
                  onClick={() => setPicked(picked === i ? null : i)}
                  aria-pressed={picked === i}
                  className={`btn cursor-grab rounded-full border px-3 py-1.5 text-xs active:cursor-grabbing ${
                    picked === i
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-bg text-ink hover:bg-surface'
                  }`}
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        )}
        {picked !== null && (
          <p className="mt-2 text-xs accent-text">
            Now choose a bucket below (or drag it there).
          </p>
        )}
      </div>

      {/* the buckets */}
      <div className="grid gap-3 p-4 sm:grid-cols-3">
        {buckets.map((bucket, b) => {
          const color = palette[b % palette.length];
          const contents = items
            .map((item, i) => ({ ...item, i }))
            .filter(({ i }) => placed[i] === bucket);

          return (
            <div
              key={bucket}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(bucket);
              }}
              onDragLeave={() => setDragOver((d) => (d === bucket ? null : d))}
              onDrop={(e) => {
                e.preventDefault();
                const i = Number(e.dataTransfer.getData('text/plain'));
                if (Number.isInteger(i)) place(i, bucket);
                setDragOver(null);
              }}
              className={`min-h-[150px] rounded-md border-2 border-dashed p-3 transition-colors duration-fast ease-token ${
                dragOver === bucket ? 'bg-surface' : 'bg-bg'
              }`}
              style={{ borderColor: dragOver === bucket ? color : `${color}45` }}
            >
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold" style={{ color }}>
                  {bucket}
                </p>
                <span className="text-xs text-muted">{contents.length}</span>
              </div>

              {picked !== null && (
                <button
                  type="button"
                  onClick={() => place(picked, bucket)}
                  className="mb-2 w-full rounded-sm border border-dashed border-border py-1 text-xs text-muted hover:bg-surface"
                >
                  Drop here
                </button>
              )}

              <ul className="space-y-1.5">
                {contents.map(({ label, i, bucket: right }) => {
                  const ok = right === bucket;
                  return (
                    <li key={i}>
                      <button
                        type="button"
                        onClick={() => unplace(i)}
                        title="Remove"
                        className={`flex w-full items-start gap-1.5 rounded-sm px-2 py-1.5 text-left text-xs transition-colors duration-fast ease-token ${
                          checked
                            ? ok
                              ? 'bg-success/10 text-success'
                              : 'bg-danger/10 text-danger'
                            : 'bg-surface text-ink hover:bg-surface-alt'
                        }`}
                      >
                        {checked && (
                          <Icon
                            name={ok ? 'check' : 'x'}
                            size={12}
                            strokeWidth={3}
                            className="mt-0.5 shrink-0"
                          />
                        )}
                        <span className="min-w-0 flex-1">{label}</span>
                      </button>
                      {checked && !ok && (
                        <p className="pl-2 pt-0.5 text-[11px] text-muted">
                          belongs in <strong className="font-semibold">{right}</strong>
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      <footer className="flex flex-wrap items-center gap-3 border-t border-border bg-surface/60 px-4 py-3">
        <button
          type="button"
          disabled={!allPlaced}
          onClick={() => setChecked(true)}
          className="btn-primary px-3 py-1.5 text-xs"
        >
          Check my sorting
        </button>
        <button
          type="button"
          onClick={() => persist({})}
          className="btn-ghost px-2 py-1 text-xs"
        >
          <Icon name="refresh-cw" size={13} /> Reset
        </button>

        {checked && (
          <p
            className={`text-sm font-semibold animate-fade-up ${
              allCorrect ? 'text-success' : 'text-warn'
            }`}
          >
            {correctCount}/{items.length} in the right bucket
            {allCorrect ? ' — all of them.' : '. Move the flagged ones and check again.'}
          </p>
        )}
        {!allPlaced && !checked && (
          <p className="text-xs text-muted">Sort every item to check your answers.</p>
        )}
      </footer>
    </section>
  );
}
