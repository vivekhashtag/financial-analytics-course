'use client';

import { EASE, FigureFrame } from './FigureFrame';
import { D2_STAGES, FIGURES } from '@/lib/practice-figures';

/**
 * D.2 — the six stages of a sale, filling one after another.
 *
 * Each block's colour arrives as a `scaleX` on a clipped fill rather than a
 * width transition, which keeps the whole sequence on the compositor. The
 * artefact the analyst builds sits under each block, because that is the point
 * the section makes: there is a deliverable at every stage, and the analyst
 * builds most of them.
 *
 * Stages and artefacts are D.2's own Stations 0–5 and its "The documents" list.
 */

const W = 620;
const H = 130;
const GAP = 8;
const BLOCK_H = 34;
const BLOCK_Y = 30;

export function DealTimeline() {
  const meta = FIGURES['D.2'];
  const blockW = (W - 20 - GAP * (D2_STAGES.length - 1)) / D2_STAGES.length;

  return (
    <FigureFrame
      title={meta.title}
      caption={meta.caption}
      label={`Six deal stages in order: ${D2_STAGES.map((s) => s.stage).join(', ')}`}
    >
      {(inView) => (
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" style={{ maxHeight: 150 }}>
          {D2_STAGES.map((s, i) => {
            const x = 10 + i * (blockW + GAP);
            const delay = i * 200;
            const clipId = `deal-clip-${i}`;

            return (
              <g key={s.stage}>
                {/* empty track */}
                <rect
                  x={x}
                  y={BLOCK_Y}
                  width={blockW}
                  height={BLOCK_H}
                  rx={6}
                  fill="currentColor"
                  className="text-surface-alt"
                />

                {/* fill, scaled from the left edge inside a clip so the rounded
                    corners stay rounded while it grows */}
                <clipPath id={clipId}>
                  <rect x={x} y={BLOCK_Y} width={blockW} height={BLOCK_H} rx={6} />
                </clipPath>
                <g clipPath={`url(#${clipId})`}>
                  <rect
                    x={x}
                    y={BLOCK_Y}
                    width={blockW}
                    height={BLOCK_H}
                    fill="currentColor"
                    className="text-part-C"
                    style={{
                      transformOrigin: `${x}px ${BLOCK_Y}px`,
                      transform: inView ? 'scaleX(1)' : 'scaleX(0)',
                      transition: `transform 360ms ${EASE} ${delay}ms`,
                    }}
                  />
                </g>

                <text
                  x={x + blockW / 2}
                  y={BLOCK_Y + BLOCK_H / 2 + 4}
                  textAnchor="middle"
                  className="font-body text-[11px] font-semibold"
                  fill="#FFFFFF"
                  style={{
                    opacity: inView ? 1 : 0,
                    transition: `opacity 240ms ${EASE} ${delay + 180}ms`,
                  }}
                >
                  {s.stage}
                </text>

                {/* the stage label also readable before the fill lands */}
                <text
                  x={x + blockW / 2}
                  y={BLOCK_Y + BLOCK_H / 2 + 4}
                  textAnchor="middle"
                  className="fill-muted font-body text-[11px] font-semibold"
                  style={{
                    opacity: inView ? 0 : 1,
                    transition: `opacity 200ms ${EASE} ${delay}ms`,
                  }}
                >
                  {s.stage}
                </text>

                {/* connector */}
                {i < D2_STAGES.length - 1 && (
                  <path
                    d={`M${x + blockW + 1} ${BLOCK_Y + BLOCK_H / 2} l${GAP - 2} 0`}
                    stroke="currentColor"
                    className="text-border"
                    strokeWidth={1.5}
                  />
                )}

                {/* what the analyst builds here */}
                <g
                  style={{
                    opacity: inView ? 1 : 0,
                    transform: inView ? 'translate(0,0)' : 'translate(0,5px)',
                    transition: `opacity 280ms ${EASE} ${delay + 240}ms, transform 280ms ${EASE} ${delay + 240}ms`,
                  }}
                >
                  <line
                    x1={x + blockW / 2}
                    y1={BLOCK_Y + BLOCK_H + 4}
                    x2={x + blockW / 2}
                    y2={BLOCK_Y + BLOCK_H + 12}
                    stroke="currentColor"
                    className="text-border"
                    strokeWidth={1}
                  />
                  <text
                    x={x + blockW / 2}
                    y={BLOCK_Y + BLOCK_H + 26}
                    textAnchor="middle"
                    className="fill-ink font-body text-[10px] font-medium"
                  >
                    {s.builds}
                  </text>
                </g>
              </g>
            );
          })}

          <text x={10} y={16} className="fill-muted font-body text-[10px]">
            weeks 1 → 26, in order
          </text>
        </svg>
      )}
    </FigureFrame>
  );
}
