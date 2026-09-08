'use client';

import { useInView } from '@/components/motion/Reveal';
import { partColor } from '@/lib/parts';

/**
 * raw → clean → insight, with a pulse travelling the pipe.
 *
 * MDX-embeddable: `<DataPipelineFlow />`. The moving pulse is a dashed stroke
 * animating its dashoffset — one of the two permitted looping effects, and
 * cheap because it animates a paint property on a 3-segment path, not layout.
 *
 * The labels under each stage are this course's own framing: the defects are
 * counted before cleaning (Module 1's Trust Report) and proved after (Module 3).
 */

const STAGES = [
  { key: 'raw', label: 'Raw', note: 'Eight planted defects', part: 'D' as const },
  { key: 'clean', label: 'Clean', note: 'Measure → fix → prove', part: 'A' as const },
  { key: 'insight', label: 'Insight', note: 'A number you can defend', part: 'C' as const },
];

export function DataPipelineFlow({ title }: { title?: string }) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.3 });

  return (
    <figure ref={ref} className="widget not-prose card overflow-hidden">
      <figcaption className="border-b border-border bg-surface px-4 py-2.5">
        <h4 className="text-sm font-semibold text-ink">{title ?? 'The pipeline'}</h4>
        <p className="mt-0.5 text-xs text-muted">
          Cleaning isn&apos;t preparation for analysis — it is analysis.
        </p>
      </figcaption>

      <div className="p-4">
        <svg viewBox="0 0 420 108" className="h-auto w-full" role="img" aria-label="Raw data flows through cleaning into insight">
          <title>Raw → clean → insight</title>

          {/* the pipe */}
          <path
            d="M58 40h124M238 40h124"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            className="text-border"
          />

          {/* the travelling pulse — only runs once visible */}
          {inView && (
            <path
              d="M58 40h124M238 40h124"
              stroke={partColor('A')}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray="10 18"
              className="animate-flow-dash"
              opacity=".85"
            />
          )}

          {STAGES.map((stage, i) => {
            const cx = 30 + i * 180;
            const color = partColor(stage.part);
            return (
              <g
                key={stage.key}
                style={{
                  opacity: inView ? 1 : 0,
                  transform: inView ? 'none' : 'scale(.9)',
                  transformOrigin: `${cx}px 40px`,
                  transition: `opacity 320ms ease-out ${i * 140}ms, transform 320ms ease-out ${i * 140}ms`,
                }}
              >
                <circle cx={cx} cy="40" r="26" fill="#FFFFFF" stroke={color} strokeWidth="2.5" />
                <circle cx={cx} cy="40" r="26" fill={color} opacity=".08" />

                {/* a stage-specific mark: scatter, filter, checkmark */}
                {i === 0 && (
                  <g fill={color} opacity=".8">
                    <circle cx={cx - 8} cy="34" r="2.6" />
                    <circle cx={cx + 6} cy="30" r="2.6" />
                    <circle cx={cx - 2} cy="46" r="2.6" />
                    <circle cx={cx + 9} cy="45" r="2.6" />
                    <circle cx={cx - 11} cy="45" r="2.6" />
                  </g>
                )}
                {i === 1 && (
                  <path
                    d={`M${cx - 11} 31h22l-8 9v9l-6 3v-12z`}
                    fill={color}
                    opacity=".8"
                  />
                )}
                {i === 2 && (
                  <path
                    d={`M${cx - 9} 40l6 6 12-13`}
                    fill="none"
                    stroke={color}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                <text
                  x={cx}
                  y="84"
                  textAnchor="middle"
                  className="font-body text-[12px] font-semibold"
                  fill="#0F172A"
                >
                  {stage.label}
                </text>
                <text
                  x={cx}
                  y="99"
                  textAnchor="middle"
                  className="font-body text-[10px]"
                  fill="#5B6B84"
                >
                  {stage.note}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </figure>
  );
}
