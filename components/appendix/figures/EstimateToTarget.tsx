'use client';

import { EASE, FigureFrame } from './FigureFrame';
import { D1_RESULT, FIGURES } from '@/lib/practice-figures';

/**
 * D.1 — an estimate meets an actual, and the target price moves.
 *
 * Three markers appear in sequence (estimate → actual → new target), then an
 * arrow slides from the old target down to the new one. The slide is a
 * `translateY` on a group, not a change of `y`, so nothing re-lays out.
 *
 * The numbers are the ones D.1 Station 2 publishes in its worked results note
 * (₹2,450 → ₹2,380, revenue 3% ahead, margin miss 0.8%, estimate cut 4%). The
 * brief suggested generic labels; the text had real figures, and the rule is
 * to use what the text states.
 */

const W = 560;
const H = 200;

// Plot band for the two target prices.
const PLOT = { top: 34, bottom: 150, left: 250, right: 470 };

const MARKERS = [
  { x: 70, label: 'Estimate', sub: 'what we published', tone: 'muted' as const },
  { x: 150, label: `Actual ${D1_RESULT.revenueSurprise}`, sub: `margin miss ${D1_RESULT.marginMiss}`, tone: 'warn' as const },
  { x: 218, label: `Estimate cut ${D1_RESULT.estimateCut}`, sub: 'the model changes', tone: 'ink' as const },
];

export function EstimateToTarget() {
  const meta = FIGURES['D.1'];

  return (
    <FigureFrame
      title={meta.title}
      caption={meta.caption}
      label={`Results arrive, estimates are cut ${D1_RESULT.estimateCut}, and the target price moves from ₹${D1_RESULT.oldTarget} to ₹${D1_RESULT.newTarget}`}
    >
      {(inView) => (
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" style={{ maxHeight: 220 }}>
          {/* baseline */}
          <line
            x1={40}
            y1={PLOT.bottom + 22}
            x2={W - 30}
            y2={PLOT.bottom + 22}
            stroke="currentColor"
            className="text-border"
            strokeWidth={1}
          />

          {/* the three sequenced markers */}
          {MARKERS.map((m, i) => (
            <g
              key={m.label}
              style={{
                opacity: inView ? 1 : 0,
                transform: inView ? 'translate(0,0)' : 'translate(0,8px)',
                transition: `opacity 300ms ${EASE} ${i * 280}ms, transform 300ms ${EASE} ${i * 280}ms`,
              }}
            >
              <circle
                cx={m.x}
                cy={PLOT.bottom + 22}
                r={5}
                fill="currentColor"
                className={
                  m.tone === 'warn' ? 'text-warn' : m.tone === 'ink' ? 'text-ink' : 'text-muted'
                }
              />
              <text
                x={m.x}
                y={PLOT.bottom + 44}
                textAnchor="middle"
                className="fill-ink font-body text-[11px] font-semibold"
              >
                {m.label}
              </text>
              <text
                x={m.x}
                y={PLOT.bottom + 58}
                textAnchor="middle"
                className="fill-muted font-body text-[9px]"
              >
                {m.sub}
              </text>
            </g>
          ))}

          {/* old target, always present as the reference */}
          <g>
            <line
              x1={PLOT.left}
              y1={PLOT.top}
              x2={PLOT.right}
              y2={PLOT.top}
              stroke="currentColor"
              className="text-border"
              strokeWidth={1.5}
              strokeDasharray="4 3"
            />
            <text
              x={PLOT.right + 6}
              y={PLOT.top + 4}
              className="fill-muted font-body text-[10px] tabular-nums"
            >
              ₹{D1_RESULT.oldTarget.toLocaleString('en-IN')}
            </text>
            <text x={PLOT.left} y={PLOT.top - 8} className="fill-muted font-body text-[9px]">
              old target
            </text>
          </g>

          {/* new target, revealed with the third marker */}
          <g
            style={{
              opacity: inView ? 1 : 0,
              transition: `opacity 320ms ${EASE} 900ms`,
            }}
          >
            <line
              x1={PLOT.left}
              y1={PLOT.bottom}
              x2={PLOT.right}
              y2={PLOT.bottom}
              stroke="currentColor"
              className="text-part-A"
              strokeWidth={2}
            />
            <text
              x={PLOT.right + 6}
              y={PLOT.bottom + 4}
              className="fill-ink font-body text-[10px] font-semibold tabular-nums"
            >
              ₹{D1_RESULT.newTarget.toLocaleString('en-IN')}
            </text>
            <text x={PLOT.left} y={PLOT.bottom + 16} className="fill-muted font-body text-[9px]">
              new target · {D1_RESULT.rating}
            </text>
          </g>

          {/* the arrow: slides from the old line down to the new one */}
          <g
            style={{
              opacity: inView ? 1 : 0,
              transform: inView
                ? `translate(0, ${PLOT.bottom - PLOT.top - 18}px)`
                : 'translate(0, 0px)',
              transition: `opacity 200ms ${EASE} 940ms, transform 620ms ${EASE} 1000ms`,
            }}
          >
            <line
              x1={PLOT.left + 78}
              y1={PLOT.top + 4}
              x2={PLOT.left + 78}
              y2={PLOT.top + 16}
              stroke="currentColor"
              className="text-part-A"
              strokeWidth={2}
            />
            <path
              d={`M${PLOT.left + 73} ${PLOT.top + 12} l5 6 l5 -6`}
              fill="none"
              stroke="currentColor"
              className="text-part-A"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <text
              x={PLOT.left + 88}
              y={PLOT.top + 16}
              className="fill-part-A font-body text-[10px] font-semibold"
            >
              Target ↓
            </text>
          </g>
        </svg>
      )}
    </FigureFrame>
  );
}
