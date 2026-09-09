'use client';

import { EASE, FigureFrame } from './FigureFrame';
import { D4_EVIDENCE, FIGURES } from '@/lib/practice-figures';

/**
 * D.4 — a thesis tested against its evidence, with the exit written first.
 *
 * Two evidence boxes settle green (the thesis holds), one settles grey (that
 * leg weakened), and the gate on the right is the pre-written exit trigger.
 * That asymmetry is the section's argument: the position survives on evidence,
 * and the sell rule was decided at Station 4, before any of it happened.
 *
 * Colour and opacity only. The "slowly turns grey" is a longer colour
 * transition on the same trigger, not a separate animation loop.
 */

const W = 600;
const H = 210;
const THESIS = { x: 24, y: 76, w: 118, h: 58 };
const EV = { x: 236, w: 150, h: 42 };
const GATE = { x: 476, w: 100, h: 58, y: 76 };

export function ThesisEvidence() {
  const meta = FIGURES['D.4'];
  const rows = D4_EVIDENCE.map((e, i) => ({ ...e, y: 26 + i * 66 }));

  return (
    <FigureFrame
      title={meta.title}
      caption={meta.caption}
      label="A thesis connected to three pieces of evidence, two holding and one weakened, with a pre-written exit trigger"
    >
      {(inView) => (
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" style={{ maxHeight: 240 }}>
          {/* connectors, scaled out from the thesis box */}
          {rows.map((r, i) => {
            const y1 = THESIS.y + THESIS.h / 2;
            const y2 = r.y + EV.h / 2;
            const midX = (THESIS.x + THESIS.w + EV.x) / 2;
            return (
              <path
                key={`c${i}`}
                d={`M${THESIS.x + THESIS.w} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${EV.x} ${y2}`}
                fill="none"
                stroke="currentColor"
                className={r.state === 'weakened' ? 'text-border' : 'text-part-B'}
                strokeWidth={1.5}
                style={{
                  opacity: inView ? (r.state === 'weakened' ? 0.5 : 0.75) : 0,
                  transition: `opacity 420ms ${EASE} ${240 + i * 140}ms`,
                }}
              />
            );
          })}

          {/* thesis */}
          <g style={{ opacity: inView ? 1 : 0, transition: `opacity 300ms ${EASE}` }}>
            <rect
              x={THESIS.x}
              y={THESIS.y}
              width={THESIS.w}
              height={THESIS.h}
              rx={8}
              fill="currentColor"
              className="text-part-B"
            />
            <text
              x={THESIS.x + THESIS.w / 2}
              y={THESIS.y + 26}
              textAnchor="middle"
              fill="#FFFFFF"
              className="font-body text-[13px] font-semibold"
            >
              Thesis
            </text>
            <text
              x={THESIS.x + THESIS.w / 2}
              y={THESIS.y + 42}
              textAnchor="middle"
              fill="#FFFFFF"
              className="font-body text-[9px]"
              opacity={0.85}
            >
              three sentences
            </text>
          </g>

          {/* evidence */}
          {rows.map((r, i) => {
            const held = r.state === 'holds';
            const delay = 520 + i * 260;
            return (
              <g
                key={r.label}
                style={{
                  opacity: inView ? 1 : 0,
                  transform: inView ? 'translate(0,0)' : 'translate(-6px,0)',
                  transition: `opacity 300ms ${EASE} ${delay}ms, transform 300ms ${EASE} ${delay}ms`,
                }}
              >
                <rect
                  x={EV.x}
                  y={r.y}
                  width={EV.w}
                  height={EV.h}
                  rx={7}
                  fill="currentColor"
                  className={held ? 'text-success' : 'text-surface-alt'}
                  style={{
                    // the weakened leg fades to grey over a longer beat
                    transition: `fill 900ms ${EASE} ${delay + 300}ms`,
                  }}
                />
                <text
                  x={EV.x + 14}
                  y={r.y + 25}
                  className={`font-body text-[12px] font-semibold ${held ? '' : 'fill-muted'}`}
                  fill={held ? '#FFFFFF' : undefined}
                >
                  {r.label}
                </text>
                <text
                  x={EV.x + EV.w - 12}
                  y={r.y + 25}
                  textAnchor="end"
                  className={`font-body text-[9px] ${held ? '' : 'fill-muted'}`}
                  fill={held ? '#FFFFFF' : undefined}
                  opacity={held ? 0.9 : 1}
                >
                  {held ? 'holds' : 'weakened'}
                </text>
              </g>
            );
          })}

          {/* the pre-written exit */}
          <g
            style={{
              opacity: inView ? 1 : 0,
              transition: `opacity 340ms ${EASE} 1320ms`,
            }}
          >
            <path
              d={`M${EV.x + EV.w} ${rows[2].y + EV.h / 2} L${GATE.x} ${GATE.y + GATE.h / 2}`}
              stroke="currentColor"
              className="text-warn"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              fill="none"
            />
            <rect
              x={GATE.x}
              y={GATE.y}
              width={GATE.w}
              height={GATE.h}
              rx={8}
              fill="none"
              stroke="currentColor"
              className="text-warn"
              strokeWidth={2}
            />
            <text
              x={GATE.x + GATE.w / 2}
              y={GATE.y + 24}
              textAnchor="middle"
              className="fill-warn font-body text-[11px] font-semibold"
            >
              Exit trigger
            </text>
            <text
              x={GATE.x + GATE.w / 2}
              y={GATE.y + 40}
              textAnchor="middle"
              className="fill-muted font-body text-[9px]"
            >
              written first
            </text>
          </g>
        </svg>
      )}
    </FigureFrame>
  );
}
