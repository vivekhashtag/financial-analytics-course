'use client';

import { useId, useMemo, useState } from 'react';
import { FigureFrame } from './FigureFrame';
import {
  D5_CONDOR,
  D5_LONG_CALL,
  D5_LONG_PUT,
  D5_MAX_LOSS,
  FIGURES,
  condorPayoff,
} from '@/lib/practice-figures';

/**
 * D.5 — drag the expiry level along an iron condor's payoff.
 *
 * The structure is the one D.5 Station 3 actually publishes: sell the
 * 24,800–25,200 strangle, protected 300 points beyond each side. (Station 1's
 * 24,000 / 25,000 are open-interest levels in the positioning read — a
 * different sentence, and not the trade.)
 *
 * The one number with no source is the net credit: the note states its maximum
 * loss as "₹X per lot", a placeholder. So the credit is shown on the figure as
 * a stated assumption and the readout is in index points per unit. Making up a
 * premium and printing it as course data would be the one thing this page
 * exists to teach against.
 *
 * Interaction, not animation: there is nothing to reveal on scroll here, so
 * nothing waits for the observer, and reduced-motion users get exactly the
 * same figure. The dot follows the slider through a transform.
 */

const W = 620;
const H = 260;
const PAD = { left: 52, right: 22, top: 22, bottom: 52 };

const X_MIN = D5_LONG_PUT - 260; // 24,240
const X_MAX = D5_LONG_CALL + 260; // 25,760

export function PayoffExplorer() {
  const meta = FIGURES['D.5'];
  const sliderId = useId();
  const [spot, setSpot] = useState((D5_CONDOR.shortPut + D5_CONDOR.shortCall) / 2);

  const yMax = D5_CONDOR.assumedCredit;
  const yMin = -D5_MAX_LOSS;

  const x = (v: number) =>
    PAD.left + ((v - X_MIN) / (X_MAX - X_MIN)) * (W - PAD.left - PAD.right);
  const y = (v: number) =>
    PAD.top + ((yMax - v) / (yMax - yMin)) * (H - PAD.top - PAD.bottom);

  // The payoff is piecewise linear, so its five kinks are the whole line.
  const path = useMemo(() => {
    const kinks = [X_MIN, D5_LONG_PUT, D5_CONDOR.shortPut, D5_CONDOR.shortCall, D5_LONG_CALL, X_MAX];
    return kinks
      .map((k, i) => `${i === 0 ? 'M' : 'L'}${x(k).toFixed(1)} ${y(condorPayoff(k)).toFixed(1)}`)
      .join(' ');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pnl = condorPayoff(spot);
  const zeroY = y(0);

  return (
    <FigureFrame
      title={meta.title}
      caption={meta.caption}
      label={`Iron condor payoff: short ${D5_CONDOR.shortPut} put and ${D5_CONDOR.shortCall} call, long wings ${D5_CONDOR.wing} points beyond each. Maximum loss ${D5_MAX_LOSS} index points.`}
    >
      {() => (
        <div>
          <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" style={{ maxHeight: 300 }}>
            {/* the max-loss floor, called out in the danger colour */}
            <rect
              x={PAD.left}
              y={y(yMin)}
              width={W - PAD.left - PAD.right}
              height={2}
              fill="currentColor"
              className="text-danger"
              opacity={0.35}
            />
            <text x={PAD.left + 4} y={y(yMin) + 15} className="fill-danger font-body text-[10px] font-semibold">
              Max loss {D5_MAX_LOSS} pts — decided before entry
            </text>

            {/* zero line */}
            <line
              x1={PAD.left}
              y1={zeroY}
              x2={W - PAD.right}
              y2={zeroY}
              stroke="currentColor"
              className="text-border"
              strokeWidth={1}
            />
            <text x={PAD.left - 8} y={zeroY + 3} textAnchor="end" className="fill-muted font-body text-[9px]">
              0
            </text>
            <text
              x={PAD.left - 8}
              y={y(yMax) + 3}
              textAnchor="end"
              className="fill-muted font-body text-[9px] tabular-nums"
            >
              +{yMax}
            </text>
            <text
              x={PAD.left - 8}
              y={y(yMin) + 3}
              textAnchor="end"
              className="fill-muted font-body text-[9px] tabular-nums"
            >
              {yMin}
            </text>

            {/* strikes */}
            {[
              { v: D5_LONG_PUT, label: `${D5_LONG_PUT.toLocaleString('en-IN')}`, sub: 'long put' },
              { v: D5_CONDOR.shortPut, label: `${D5_CONDOR.shortPut.toLocaleString('en-IN')}`, sub: 'short put' },
              { v: D5_CONDOR.shortCall, label: `${D5_CONDOR.shortCall.toLocaleString('en-IN')}`, sub: 'short call' },
              { v: D5_LONG_CALL, label: `${D5_LONG_CALL.toLocaleString('en-IN')}`, sub: 'long call' },
            ].map((s) => (
              <g key={s.v}>
                <line
                  x1={x(s.v)}
                  y1={PAD.top}
                  x2={x(s.v)}
                  y2={H - PAD.bottom}
                  stroke="currentColor"
                  className="text-border"
                  strokeWidth={1}
                  strokeDasharray="2 4"
                />
                <text
                  x={x(s.v)}
                  y={H - PAD.bottom + 15}
                  textAnchor="middle"
                  className="fill-ink font-body text-[9px] tabular-nums"
                >
                  {s.label}
                </text>
                <text
                  x={x(s.v)}
                  y={H - PAD.bottom + 26}
                  textAnchor="middle"
                  className="fill-muted font-body text-[8px]"
                >
                  {s.sub}
                </text>
              </g>
            ))}

            {/* the payoff itself */}
            <path
              d={path}
              fill="none"
              stroke="currentColor"
              className="text-part-D"
              strokeWidth={2.5}
              strokeLinejoin="round"
            />

            {/* the moving readout */}
            <g
              style={{
                transform: `translate(${x(spot) - x(X_MIN)}px, 0px)`,
                transition: 'transform 90ms linear',
              }}
            >
              <line
                x1={x(X_MIN)}
                y1={PAD.top}
                x2={x(X_MIN)}
                y2={H - PAD.bottom}
                stroke="currentColor"
                className="text-ink"
                strokeWidth={1}
                opacity={0.35}
              />
            </g>
            <circle
              cx={x(spot)}
              cy={y(pnl)}
              r={6}
              fill="currentColor"
              className={pnl >= 0 ? 'text-success' : 'text-danger'}
              stroke="#FFFFFF"
              strokeWidth={2}
              style={{ transition: 'none' }}
            />

            <text x={PAD.left} y={14} className="fill-muted font-body text-[9px]">
              P&amp;L in index points per unit · IV at the {D5_CONDOR.ivPercentile}th percentile
            </text>
          </svg>

          {/* the control */}
          <div className="mt-3 rounded-md border border-border bg-surface px-4 py-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <label htmlFor={sliderId} className="text-xs font-semibold text-ink">
                Where does the index expire?
              </label>
              <span className="font-mono text-xs tabular-nums text-muted">
                {Math.round(spot).toLocaleString('en-IN')}
              </span>
            </div>

            <input
              id={sliderId}
              type="range"
              min={X_MIN}
              max={X_MAX}
              step={10}
              value={spot}
              onChange={(e) => setSpot(Number(e.target.value))}
              className="mt-2 w-full accent-part-D"
              aria-valuetext={`Index ${Math.round(spot)}, profit or loss ${pnl.toFixed(0)} points`}
            />

            <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
              <span
                className={`text-sm font-semibold tabular-nums ${
                  pnl >= 0 ? 'text-success' : 'text-danger'
                }`}
              >
                {pnl >= 0 ? 'Profit' : 'Loss'} {pnl >= 0 ? '+' : ''}
                {pnl.toFixed(0)} pts
              </span>
              <span className="text-xs text-muted">
                {pnl === D5_CONDOR.assumedCredit
                  ? 'inside the range — the whole credit is kept'
                  : pnl === -D5_MAX_LOSS
                    ? 'past a wing — this is the floor, and it cannot get worse'
                    : 'between a short strike and its wing'}
              </span>
            </div>

            {/* The one figure with no source, said out loud. */}
            <p className="mt-2 border-t border-border pt-2 text-[11px] leading-relaxed text-muted">
              Assumes a net credit of {D5_CONDOR.assumedCredit} points. The note in the text ends
              &ldquo;Maximum loss ₹X per lot&rdquo;, so the premium is an assumption here, not
              course data — the shape and the floor are what the section is teaching.
            </p>
          </div>
        </div>
      )}
    </FigureFrame>
  );
}
