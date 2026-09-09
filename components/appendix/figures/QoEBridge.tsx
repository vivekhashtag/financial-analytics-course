'use client';

import { EASE, FigureFrame } from './FigureFrame';
import { D3_BRIDGE, FIGURES } from '@/lib/practice-figures';

/**
 * D.3 — the Quality of Earnings waterfall.
 *
 * Reported ₹120 cr, three deductions landing one at a time, Adjusted ₹96 cr,
 * and then the line that makes it matter: at 10× EBITDA the finding moved the
 * price by ₹240 cr. All four numbers are D.3 Station 2's.
 *
 * What the text does *not* give is the split of the ₹24 cr between the three
 * lines, so the drops are drawn equal and no per-bar figure is printed — only
 * the bracketed total, which is arithmetic on numbers the text does state. An
 * invented breakdown would read as data.
 *
 * Bars grow by `scaleY` from their own baseline; a height transition here would
 * relayout the labels under them on every frame.
 */

const W = 600;
const H = 250;
const BASE_Y = 176;
const CHART_TOP = 26;
const BAR_W = 62;

/** Rupees → pixels, with the tallest bar (reported) filling the plot. */
const scale = (v: number) => ((BASE_Y - CHART_TOP) * v) / D3_BRIDGE.reported;

export function QoEBridge() {
  const meta = FIGURES['D.3'];
  const { reported, adjusted, drops, multiple, priceImpact } = D3_BRIDGE;

  const total = reported - adjusted; // 24
  const each = total / drops.length; // equal, deliberately

  // Bar layout: reported, then one per drop, then adjusted.
  const slots = 2 + drops.length;
  const gap = (W - 60 - slots * BAR_W) / (slots - 1);
  const xAt = (i: number) => 30 + i * (BAR_W + gap);

  let running = reported;
  const dropBars = drops.map((label, i) => {
    const from = running;
    running -= each;
    return { label, i, from, to: running };
  });

  return (
    <FigureFrame
      title={meta.title}
      caption={meta.caption}
      label={`Reported EBITDA ₹${reported} cr, reduced by ${drops.length} adjustments totalling ₹${total} cr, to an adjusted EBITDA of ₹${adjusted} cr`}
    >
      {(inView) => (
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" style={{ maxHeight: 280 }}>
          <line
            x1={20}
            y1={BASE_Y}
            x2={W - 20}
            y2={BASE_Y}
            stroke="currentColor"
            className="text-border"
            strokeWidth={1}
          />

          {/* reported */}
          <Bar
            x={xAt(0)}
            top={BASE_Y - scale(reported)}
            height={scale(reported)}
            className="text-part-C"
            inView={inView}
            delay={0}
          />
          <Label x={xAt(0)} title="Reported" value={`₹${reported} cr`} inView={inView} delay={0} />

          {/* the deductions */}
          {dropBars.map(({ label, i, from, to }) => {
            const top = BASE_Y - scale(from);
            const height = scale(from) - scale(to);
            const delay = 320 + i * 340;
            return (
              <g key={label}>
                {/* the level it drops from */}
                <line
                  x1={xAt(i) + BAR_W}
                  y1={top}
                  x2={xAt(i + 1)}
                  y2={top}
                  stroke="currentColor"
                  className="text-border"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  style={{ opacity: inView ? 1 : 0, transition: `opacity 200ms ${EASE} ${delay}ms` }}
                />
                <Bar
                  x={xAt(i + 1)}
                  top={top}
                  height={height}
                  className="text-danger"
                  inView={inView}
                  delay={delay}
                />
                <Label
                  x={xAt(i + 1)}
                  title={label}
                  value=""
                  inView={inView}
                  delay={delay}
                  small
                />
              </g>
            );
          })}

          {/* adjusted */}
          <line
            x1={xAt(slots - 2) + BAR_W}
            y1={BASE_Y - scale(adjusted)}
            x2={xAt(slots - 1)}
            y2={BASE_Y - scale(adjusted)}
            stroke="currentColor"
            className="text-border"
            strokeWidth={1}
            strokeDasharray="3 3"
            style={{ opacity: inView ? 1 : 0, transition: `opacity 200ms ${EASE} 1400ms` }}
          />
          <Bar
            x={xAt(slots - 1)}
            top={BASE_Y - scale(adjusted)}
            height={scale(adjusted)}
            className="text-part-A"
            inView={inView}
            delay={1400}
          />
          <Label
            x={xAt(slots - 1)}
            title="Adjusted"
            value={`₹${adjusted} cr`}
            inView={inView}
            delay={1400}
          />

          {/* the bracketed total — arithmetic on the text's two numbers */}
          <g style={{ opacity: inView ? 1 : 0, transition: `opacity 300ms ${EASE} 1620ms` }}>
            <path
              d={`M${xAt(1)} ${CHART_TOP - 6} l0 -6 l${xAt(slots - 2) + BAR_W - xAt(1)} 0 l0 6`}
              fill="none"
              stroke="currentColor"
              className="text-danger"
              strokeWidth={1.25}
            />
            <text
              x={(xAt(1) + xAt(slots - 2) + BAR_W) / 2}
              y={CHART_TOP - 18}
              textAnchor="middle"
              className="fill-danger font-body text-[11px] font-semibold tabular-nums"
            >
              −₹{total} cr in total
            </text>
          </g>

          {/* the payoff line, after the last bar lands */}
          <g style={{ opacity: inView ? 1 : 0, transition: `opacity 340ms ${EASE} 1900ms` }}>
            <text
              x={W / 2}
              y={H - 12}
              textAnchor="middle"
              className="fill-ink font-body text-[12px] font-semibold"
            >
              At a {multiple}× price, this finding moved the deal by ₹{priceImpact} cr.
            </text>
          </g>
        </svg>
      )}
    </FigureFrame>
  );
}

function Bar({
  x,
  top,
  height,
  className,
  inView,
  delay,
}: {
  x: number;
  top: number;
  height: number;
  className: string;
  inView: boolean;
  delay: number;
}) {
  return (
    <rect
      x={x}
      y={top}
      width={BAR_W}
      height={Math.max(height, 2)}
      rx={3}
      fill="currentColor"
      className={className}
      style={{
        transformOrigin: `${x}px ${top + Math.max(height, 2)}px`,
        transform: inView ? 'scaleY(1)' : 'scaleY(0)',
        transition: `transform 380ms ${EASE} ${delay}ms`,
      }}
    />
  );
}

function Label({
  x,
  title,
  value,
  inView,
  delay,
  small = false,
}: {
  x: number;
  title: string;
  value: string;
  inView: boolean;
  delay: number;
  small?: boolean;
}) {
  const words = small ? title.split(' ') : [title];
  return (
    <g
      style={{
        opacity: inView ? 1 : 0,
        transition: `opacity 260ms ${EASE} ${delay + 160}ms`,
      }}
    >
      {words.map((word, i) => (
        <text
          key={word + i}
          x={x + BAR_W / 2}
          y={BASE_Y + 16 + i * 11}
          textAnchor="middle"
          className={`font-body ${small ? 'fill-muted text-[9px]' : 'fill-ink text-[11px] font-semibold'}`}
        >
          {word}
        </text>
      ))}
      {value && (
        <text
          x={x + BAR_W / 2}
          y={BASE_Y + 16 + words.length * 12}
          textAnchor="middle"
          className="fill-muted font-body text-[10px] tabular-nums"
        >
          {value}
        </text>
      )}
    </g>
  );
}
