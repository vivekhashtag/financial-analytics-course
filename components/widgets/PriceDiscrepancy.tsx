'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { useProgress } from '@/components/progress/ProgressProvider';
import tokens from '@/schema/tokens.json';

/**
 * "Three sources, three closing prices" — step through the reconciliation.
 *
 * The three figures are exactly the ones in the prose that follows this widget
 * in `03-sources.mdx`: ₹102.50, ₹102.50 and ₹101.87, where *the third* is the
 * unadjusted one. The gap is therefore ₹0.63, which is the dividend. The
 * sources are labelled A/B/C because the prose does not name them — inventing
 * "yfinance said X" would be putting words in a vendor's mouth.
 */

const QUOTED = [102.5, 102.5, 101.87] as const;
const DIVIDEND = Number((QUOTED[0] - QUOTED[2]).toFixed(2)); // 0.63

interface Step {
  title: string;
  why: string;
}

const STEPS: Step[] = [
  {
    title: 'Three sources, one stock, one day',
    why: 'Two agree, one is 63 paise lower. Nothing here says which is right.',
  },
  {
    title: 'The instinct: pick the majority',
    why: 'Two out of three is not evidence. A convention shared by two vendors is still a convention.',
  },
  {
    title: 'Ask what each number means',
    why: 'Source C reports the price as traded. A and B have already adjusted history for a corporate action.',
  },
  {
    title: 'Apply the dividend adjustment',
    why: `A ₹${DIVIDEND.toFixed(2)} dividend explains the whole gap. All three now agree — and none of them was wrong.`,
  },
];

const SOURCES = [
  { id: 'A', quoted: QUOTED[0], adjusted: true },
  { id: 'B', quoted: QUOTED[1], adjusted: true },
  { id: 'C', quoted: QUOTED[2], adjusted: false },
];

export function PriceDiscrepancy({
  exerciseId = 'm1-e-price',
  moduleId = '01-data-foundations',
}: {
  exerciseId?: string;
  moduleId?: string;
}) {
  const { hydrated, setWidget, getWidget } = useProgress();
  const [step, setStep] = useState(0);
  const [applied, setApplied] = useState(false);

  const teal = tokens.color.part.C;
  const atEnd = step === STEPS.length - 1;

  // The toggle only becomes available once the learner reaches the last step,
  // so the reveal lands after the reasoning rather than before it.
  const canApply = atEnd;
  const reconciled = applied && canApply;

  const advance = () => {
    const next = Math.min(step + 1, STEPS.length - 1);
    setStep(next);
    if (hydrated && next === STEPS.length - 1) {
      setWidget(moduleId, `priceDiscrepancy:${exerciseId}`, { reached: true });
    }
  };

  const done = hydrated
    ? !!getWidget<{ reached?: boolean }>(moduleId, `priceDiscrepancy:${exerciseId}`, {}).reached
    : false;

  return (
    <section className="widget not-prose card overflow-hidden">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-surface px-4 py-3">
        <div>
          <h4 className="flex items-center gap-2 text-base font-semibold text-ink">
            <Icon name="search" size={16} style={{ color: teal }} />
            Same stock, same day, three prices
          </h4>
          <p className="mt-1 text-sm text-muted">
            Step through the reconciliation. Nobody is wrong; the conventions differ.
          </p>
        </div>
        {done && (
          <span className="chip bg-success/10 text-success">
            <Icon name="check" size={12} strokeWidth={3} /> Walked through
          </span>
        )}
      </header>

      {/* the three quotes */}
      <div className="grid gap-3 px-4 py-4 sm:grid-cols-3">
        {SOURCES.map((s) => {
          const shown = reconciled && !s.adjusted ? QUOTED[0] : s.quoted;
          const isOdd = !s.adjusted;
          const highlight = step >= 2 && isOdd;

          return (
            <div
              key={s.id}
              className="rounded-md border p-3 transition-colors duration-base ease-token"
              style={{
                borderColor: reconciled ? teal : highlight ? tokens.color.semantic.warn : undefined,
                background: reconciled
                  ? `color-mix(in srgb, ${teal} 7%, white)`
                  : highlight
                    ? `color-mix(in srgb, ${tokens.color.semantic.warn} 8%, white)`
                    : undefined,
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Source {s.id}
              </p>
              <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-ink">
                ₹{shown.toFixed(2)}
              </p>
              <p className="mt-1 text-xs text-muted">
                {step < 2
                  ? 'reported close'
                  : s.adjusted
                    ? 'adjusted for corporate actions'
                    : 'as traded, unadjusted'}
              </p>

              {reconciled && !s.adjusted && (
                <p className="mt-2 flex items-center gap-1 text-xs font-medium animate-slide-open" style={{ color: teal }}>
                  <Icon name="check" size={12} strokeWidth={3} />
                  +₹{DIVIDEND.toFixed(2)} dividend
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* the step */}
      <div className="border-t border-border px-4 py-4">
        <div className="flex items-center gap-1.5" role="tablist" aria-label="Reconciliation steps">
          {STEPS.map((s, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === step}
              aria-label={`Step ${i + 1}: ${s.title}`}
              type="button"
              onClick={() => setStep(i)}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-fast ease-token ${
                i <= step ? '' : 'bg-surface-alt'
              }`}
              style={i <= step ? { background: teal } : undefined}
            />
          ))}
        </div>

        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted">
          Step {step + 1} of {STEPS.length}
        </p>
        <p className="mt-1 text-base font-semibold text-ink">{STEPS[step].title}</p>
        <p className="mt-1 text-sm text-muted">{STEPS[step].why}</p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="btn-secondary px-3 py-1.5 text-xs"
          >
            <Icon name="arrow-left" size={13} /> Back
          </button>

          {!atEnd ? (
            <button type="button" onClick={advance} className="btn-primary px-3 py-1.5 text-xs">
              Next <Icon name="arrow-right" size={13} />
            </button>
          ) : (
            <label className="flex cursor-pointer items-center gap-2.5 text-sm">
              <input
                type="checkbox"
                checked={applied}
                onChange={() => setApplied((v) => !v)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-sm border transition-all duration-fast ease-token ${
                  applied ? 'border-transparent text-white' : 'border-border bg-bg'
                }`}
                style={applied ? { background: teal } : undefined}
              >
                {applied && <Icon name="check" size={12} strokeWidth={3} />}
              </span>
              <span className="font-medium text-ink">Apply the dividend adjustment</span>
            </label>
          )}
        </div>
      </div>

      <footer className="border-t border-border bg-surface/60 px-4 py-3">
        <p className="text-xs text-muted">
          {reconciled
            ? 'All three agree at ₹102.50. The reconciliation was a question about definitions, not arithmetic.'
            : 'The professional question is never "what’s the price?" — it’s "according to which source, as of when?"'}
        </p>
      </footer>
    </section>
  );
}
