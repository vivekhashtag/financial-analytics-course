'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { useProgress } from '@/components/progress/ProgressProvider';
import type { ExerciseField } from '@/lib/types';

type Value = string | string[];

export function TrustReportFormView({
  moduleId,
  exerciseId,
  title,
  brief,
  points,
  fields,
  datasetTitle,
  datasetId,
}: {
  moduleId: string;
  exerciseId: string;
  title: string;
  brief?: string;
  points?: number;
  fields: ExerciseField[];
  datasetTitle: string | null;
  datasetId: string | null;
}) {
  const { hydrated, setWidget, getWidget, add, has } = useProgress();

  const [values, setValues] = useState<Record<string, Value>>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    const saved = getWidget<Record<string, Value> | null>(moduleId, `form:${exerciseId}`, null);
    if (saved && Object.keys(saved).length) {
      setValues(saved);
      setSubmitted(true);
    }
  }, [hydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  const complete = hydrated && has(moduleId, 'exercisesComplete', exerciseId);

  const set = (id: string, value: Value) => {
    setValues((prev) => ({ ...prev, [id]: value }));
    setSubmitted(false);
  };

  const filled = fields.every((f) => {
    const v = values[f.id];
    return Array.isArray(v) ? v.length > 0 : typeof v === 'string' && v.trim() !== '';
  });

  const submit = () => {
    setSubmitted(true);
    if (!hydrated) return;
    setWidget(moduleId, `form:${exerciseId}`, values);
    add(moduleId, 'exercisesAttempted', exerciseId);
    add(moduleId, 'exercisesComplete', exerciseId);
  };

  return (
    <section className="not-prose card overflow-hidden">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-surface px-4 py-3">
        <div>
          <h4 className="flex items-center gap-2 text-base font-semibold text-ink">
            <Icon name="file-text" size={16} className="text-primary" />
            {title}
          </h4>
          {brief && <p className="mt-1 text-sm text-muted">{brief}</p>}
          {datasetTitle && datasetId && (
            <p className="mt-1 text-xs text-muted">
              Auditing{' '}
              <Link href={`/data/${datasetId}`} className="accent-text font-medium">
                {datasetTitle}
              </Link>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {points ? <span className="chip accent-bg-soft accent-text">{points} pts</span> : null}
          {complete && (
            <span className="chip bg-success/10 text-success">
              <Icon name="check" size={12} strokeWidth={3} /> Submitted
            </span>
          )}
        </div>
      </header>

      <div className="divide-y divide-border">
        {fields.map((field) => (
          <FieldRow
            key={field.id}
            field={field}
            value={values[field.id]}
            submitted={submitted}
            onChange={(v) => set(field.id, v)}
          />
        ))}
      </div>

      <footer className="flex flex-wrap items-center gap-3 border-t border-border bg-surface/60 px-4 py-3">
        {!submitted ? (
          <>
            <button
              type="button"
              disabled={!filled}
              onClick={submit}
              className="btn-primary px-4 py-2 text-sm"
            >
              Submit Trust Report
            </button>
            <p className="text-xs text-muted">
              {filled
                ? 'The model answer appears next to yours once you submit.'
                : 'Answer every field to submit.'}
            </p>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="btn-secondary px-3 py-1.5 text-xs"
            >
              <Icon name="pencil" size={13} /> Revise my answers
            </button>
            <p className="text-xs text-muted">
              Your answers and the model answer are shown side by side above.
            </p>
          </>
        )}
      </footer>
    </section>
  );
}

function FieldRow({
  field,
  value,
  submitted,
  onChange,
}: {
  field: ExerciseField;
  value: Value | undefined;
  submitted: boolean;
  onChange: (v: Value) => void;
}) {
  const model = field.modelAnswer;

  return (
    <div className="px-4 py-4">
      <p className="text-sm font-semibold text-ink">{field.label}</p>

      <div className="mt-3">
        {field.type === 'multiselect' && (
          <MultiSelect
            options={field.options ?? []}
            selected={Array.isArray(value) ? value : []}
            model={Array.isArray(model) ? model : null}
            submitted={submitted}
            onChange={onChange}
          />
        )}

        {field.type === 'single' && (
          <div className="flex flex-wrap gap-2">
            {(field.options ?? []).map((option) => {
              const picked = value === option;
              const isModel = typeof model === 'string' && model === option;
              let tone = picked
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-bg text-ink hover:bg-surface';
              if (submitted && isModel) tone = 'border-success/50 bg-success/10 text-success';
              else if (submitted && picked) tone = 'border-warn/50 bg-warn/10 text-warn';

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => onChange(option)}
                  className={`btn rounded-full border px-3.5 py-1.5 text-xs ${tone}`}
                >
                  {option}
                  {submitted && isModel && <Icon name="check" size={12} strokeWidth={3} />}
                </button>
              );
            })}
          </div>
        )}

        {field.type === 'text' && (
          <textarea
            rows={4}
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Write your answer — a few sentences is plenty."
            className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-ink outline-none transition-colors duration-fast ease-token focus:border-primary"
          />
        )}
      </div>

      {/* The diff: your answer vs the model answer, never scored automatically —
          judgement questions do not have one right string. */}
      {submitted && model && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-border bg-surface p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Yours</p>
            <p className="mt-1.5 text-sm text-ink">
              {Array.isArray(value) ? value.join(', ') || '—' : value || '—'}
            </p>
          </div>
          <div className="rounded-md border border-success/30 bg-success/[0.05] p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-success">
              Model answer
            </p>
            <p className="mt-1.5 text-sm text-ink">
              {Array.isArray(model) ? model.join(', ') : model}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function MultiSelect({
  options,
  selected,
  model,
  submitted,
  onChange,
}: {
  options: string[];
  selected: string[];
  model: string[] | null;
  submitted: boolean;
  onChange: (v: string[]) => void;
}) {
  const toggle = (option: string) =>
    onChange(
      selected.includes(option) ? selected.filter((s) => s !== option) : [...selected, option],
    );

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const picked = selected.includes(option);
        const inModel = model?.includes(option) ?? false;

        let tone = picked
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border bg-bg text-ink hover:bg-surface';
        if (submitted) {
          if (picked && inModel) tone = 'border-success/50 bg-success/10 text-success';
          else if (picked && !inModel) tone = 'border-warn/50 bg-warn/10 text-warn';
          else if (!picked && inModel) tone = 'border-dashed border-success/60 bg-bg text-success';
          else tone = 'border-border bg-bg text-muted opacity-70';
        }

        return (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            className={`btn rounded-full border px-3.5 py-1.5 text-xs ${tone}`}
          >
            {option}
            {submitted && picked && inModel && <Icon name="check" size={12} strokeWidth={3} />}
            {submitted && !picked && inModel && <span className="text-[10px]">missed</span>}
          </button>
        );
      })}
    </div>
  );
}
