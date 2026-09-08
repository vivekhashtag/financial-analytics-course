import type { PartId } from '@/lib/types';
import { partColor } from '@/lib/parts';

/**
 * Abstract data-geometry marks, one per Part, drawn in that Part's accent.
 *
 * Not clip-art and not illustration: each is the shape of what its Part
 * teaches — a grid for foundations, a rising ladder for the four questions,
 * a mapped territory for the finance map, a candlestick run for the labs, a
 * convergence for the capstone. Inline SVG, no files, no library.
 *
 * All of these are decorative, so they are aria-hidden and carry no title.
 */

type Props = {
  part: PartId;
  className?: string;
  /** 0–1; these sit behind text, so they stay faint */
  opacity?: number;
};

function Marks({ part }: { part: PartId }) {
  switch (part) {
    // Foundations — a grid being filled in: raw structure.
    case 'A':
      return (
        <>
          <path d="M8 20h104M8 40h104M8 60h104M28 8v64M48 8v64M68 8v64M88 8v64" strokeWidth="1" opacity=".45" />
          <rect x="28" y="20" width="20" height="20" fill="currentColor" opacity=".18" stroke="none" />
          <rect x="48" y="40" width="20" height="20" fill="currentColor" opacity=".28" stroke="none" />
          <rect x="68" y="20" width="20" height="20" fill="currentColor" opacity=".12" stroke="none" />
        </>
      );

    // The four questions — a rising four-step ladder.
    case 'B':
      return (
        <>
          <path d="M12 66h22V52M34 52h22V38M56 38h22V24M78 24h22V12" strokeWidth="2" />
          <circle cx="34" cy="52" r="3" fill="currentColor" stroke="none" />
          <circle cx="56" cy="38" r="3" fill="currentColor" stroke="none" />
          <circle cx="78" cy="24" r="3" fill="currentColor" stroke="none" />
          <circle cx="100" cy="12" r="3.5" fill="currentColor" stroke="none" />
        </>
      );

    // The finance map — four territories around one centre.
    case 'C':
      return (
        <>
          <circle cx="60" cy="40" r="9" strokeWidth="2" />
          <path d="M60 31V14M60 49v17M51 40H26M69 40h25" strokeWidth="1.5" opacity=".7" />
          <rect x="44" y="6" width="32" height="10" rx="2" opacity=".55" />
          <rect x="44" y="64" width="32" height="10" rx="2" opacity=".55" />
          <rect x="8" y="35" width="16" height="10" rx="2" opacity=".55" />
          <rect x="96" y="35" width="16" height="10" rx="2" opacity=".55" />
        </>
      );

    // The labs — a candlestick run with a trend through it.
    case 'D':
      return (
        <>
          <path d="M10 62 110 22" strokeWidth="1" opacity=".4" strokeDasharray="4 4" />
          {[
            [20, 44, 16],
            [36, 36, 22],
            [52, 40, 12],
            [68, 28, 20],
            [84, 24, 14],
            [100, 16, 18],
          ].map(([x, y, h], i) => (
            <g key={i}>
              <path d={`M${x} ${y - 6}v${h + 12}`} strokeWidth="1" opacity=".6" />
              <rect
                x={x - 4}
                y={y}
                width="8"
                height={h}
                rx="1"
                fill="currentColor"
                opacity={i % 2 ? '.28' : '.14'}
                stroke="none"
              />
            </g>
          ))}
        </>
      );

    // Capstone — many strands converging on one point.
    default:
      return (
        <>
          <path
            d="M8 12c28 0 34 28 52 28M8 32c24 0 30 8 52 8M8 68c28 0 34-28 52-28M8 48c24 0 30-8 52-8"
            strokeWidth="1.5"
            opacity=".6"
          />
          <path d="M60 40h44" strokeWidth="2" />
          <circle cx="60" cy="40" r="5" fill="currentColor" stroke="none" />
          <circle cx="104" cy="40" r="4" strokeWidth="2" />
        </>
      );
  }
}

export function PartGeometry({ part, className, opacity = 0.5 }: Props) {
  return (
    <svg
      viewBox="0 0 120 80"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      style={{ color: partColor(part), opacity }}
    >
      <Marks part={part} />
    </svg>
  );
}

/**
 * The hero mark: a scatter resolving into a trend line, drawn in the course
 * primary and the Part accents. Purely decorative.
 */
export function HeroGeometry({ className }: { className?: string }) {
  const dots: [number, number, PartId][] = [
    [30, 150, 'A'],
    [70, 132, 'A'],
    [104, 140, 'B'],
    [138, 112, 'B'],
    [176, 118, 'B'],
    [210, 92, 'C'],
    [246, 96, 'C'],
    [282, 68, 'D'],
    [318, 74, 'D'],
    [352, 46, 'capstone'],
  ];

  return (
    <svg
      viewBox="0 0 380 190"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {/* axes */}
      <path
        d="M14 14v162h356"
        stroke="currentColor"
        strokeWidth="1.25"
        className="text-border"
        strokeLinecap="round"
      />

      {/* faint gridlines */}
      {[50, 86, 122, 158].map((y) => (
        <path key={y} d={`M14 ${y}h356`} stroke="currentColor" strokeWidth="1" className="text-border" opacity=".5" />
      ))}

      {/* the trend the scatter implies */}
      <path
        d="M30 150C90 140 150 116 210 96s90-34 142-50"
        stroke={partColor('A')}
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity=".35"
      />

      {dots.map(([x, y, part], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={i === dots.length - 1 ? 7 : 5}
          fill={partColor(part)}
          opacity={i === dots.length - 1 ? 0.9 : 0.55}
        />
      ))}
    </svg>
  );
}
