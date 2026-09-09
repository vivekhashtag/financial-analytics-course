'use client';

import { EASE, FigureFrame } from './FigureFrame';
import { D6_COVERAGE, D6_LADDER, FIGURES } from '@/lib/practice-figures';

/**
 * D.6 — the maturity ladder, and the year that only shows up once you draw it.
 *
 * Bars rise one at a time; FY28 is the tower, in the warning colour, because
 * D.6's Tuesday says "the FY28 refinancing bump is the story". Beside it, a
 * gauge settles on coverage 1.9× — the same day's "coverage slipped from 2.4×
 * to 1.9×" — with Station 4's stress floor of 1× marked, since the question
 * that section poses is whether coverage stays above it.
 *
 * The bars carry no rupee figures. The text names no per-year amounts, only
 * which year is the bump, so heights are relative and unlabelled. The brief
 * asked for coverage 4.1×; 1.9× is what the appendix states, and it is the more
 * interesting number — it sits nearer the floor.
 */

const W = 600;
const H = 210;
const BASE_Y = 158;
const TOP_Y = 30;
const BAR_W = 46;
const CHART_RIGHT = 350;

export function MaturityLadder() {
  const meta = FIGURES['D.6'];
  const gap = (CHART_RIGHT - 40 - D6_LADDER.length * BAR_W) / (D6_LADDER.length - 1);

  return (
    <FigureFrame
      title={meta.title}
      caption={meta.caption}
      label={`Debt maturity ladder for FY26 to FY29 with a tall FY28 refinancing tower, beside an interest coverage gauge at ${D6_COVERAGE.now} times`}
    >
      {(inView) => (
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" style={{ maxHeight: 240 }}>
          {/* ---------------- the ladder ---------------- */}
          <text x={30} y={18} className="fill-muted font-body text-[10px]">
            Debt due, by year
          </text>
          <line
            x1={26}
            y1={BASE_Y}
            x2={CHART_RIGHT - 24}
            y2={BASE_Y}
            stroke="currentColor"
            className="text-border"
            strokeWidth={1}
          />

          {D6_LADDER.map((bar, i) => {
            const x = 40 + i * (BAR_W + gap);
            const h = (BASE_Y - TOP_Y) * bar.weight;
            const top = BASE_Y - h;
            const delay = i * 220;

            return (
              <g key={bar.year}>
                <rect
                  x={x}
                  y={top}
                  width={BAR_W}
                  height={h}
                  rx={3}
                  fill="currentColor"
                  className={bar.tower ? 'text-warn' : 'text-part-A'}
                  opacity={bar.tower ? 1 : 0.55}
                  style={{
                    transformOrigin: `${x}px ${BASE_Y}px`,
                    transform: inView ? 'scaleY(1)' : 'scaleY(0)',
                    transition: `transform 400ms ${EASE} ${delay}ms`,
                  }}
                />
                <text
                  x={x + BAR_W / 2}
                  y={BASE_Y + 15}
                  textAnchor="middle"
                  className={`font-body text-[10px] tabular-nums ${
                    bar.tower ? 'fill-ink font-semibold' : 'fill-muted'
                  }`}
                >
                  {bar.year}
                </text>

                {bar.tower && (
                  <g
                    style={{
                      opacity: inView ? 1 : 0,
                      transition: `opacity 320ms ${EASE} ${delay + 320}ms`,
                    }}
                  >
                    <text
                      x={x + BAR_W / 2}
                      y={top - 8}
                      textAnchor="middle"
                      className="fill-warn font-body text-[10px] font-semibold"
                    >
                      The refinancing tower
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* ---------------- the coverage gauge ---------------- */}
          <g transform={`translate(${CHART_RIGHT + 40}, 24)`}>
            <text x={82} y={0} textAnchor="middle" className="fill-muted font-body text-[10px]">
              Interest coverage
            </text>

            {/* track */}
            <path
              d="M12 96 A 70 70 0 0 1 152 96"
              fill="none"
              stroke="currentColor"
              className="text-surface-alt"
              strokeWidth={12}
              strokeLinecap="round"
            />

            {/* the needle sweeps by rotation only */}
            <g
              style={{
                transformOrigin: '82px 96px',
                transform: inView ? `rotate(${needleAngle(D6_COVERAGE.now)}deg)` : 'rotate(-90deg)',
                transition: `transform 900ms ${EASE} 500ms`,
              }}
            >
              <line
                x1={82}
                y1={96}
                x2={82}
                y2={38}
                stroke="currentColor"
                className="text-part-A"
                strokeWidth={3}
                strokeLinecap="round"
              />
            </g>
            <circle cx={82} cy={96} r={5} fill="currentColor" className="text-part-A" />

            {/* the stress floor from Station 4 */}
            <g style={{ opacity: inView ? 1 : 0, transition: `opacity 300ms ${EASE} 900ms` }}>
              <g transform={`rotate(${needleAngle(D6_COVERAGE.floor)} 82 96)`}>
                <line
                  x1={82}
                  y1={44}
                  x2={82}
                  y2={30}
                  stroke="currentColor"
                  className="text-danger"
                  strokeWidth={2}
                />
              </g>
              <text x={6} y={112} className="fill-danger font-body text-[8px]">
                {D6_COVERAGE.floor}× floor
              </text>
            </g>

            <text
              x={82}
              y={84}
              textAnchor="middle"
              className="fill-ink font-body text-[19px] font-semibold tabular-nums"
              style={{ opacity: inView ? 1 : 0, transition: `opacity 300ms ${EASE} 1100ms` }}
            >
              {D6_COVERAGE.now}×
            </text>
            <text
              x={82}
              y={124}
              textAnchor="middle"
              className="fill-muted font-body text-[9px] tabular-nums"
              style={{ opacity: inView ? 1 : 0, transition: `opacity 300ms ${EASE} 1200ms` }}
            >
              was {D6_COVERAGE.was}× last quarter
            </text>
          </g>
        </svg>
      )}
    </FigureFrame>
  );
}

/**
 * Coverage → needle angle across a 180° sweep, 0× at the left and 5× at the
 * right. The top of the scale is the gauge's own, not a claim from the text.
 */
function needleAngle(coverage: number): number {
  const capped = Math.max(0, Math.min(coverage, 5));
  return -90 + (capped / 5) * 180;
}
