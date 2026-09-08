'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { useProgress } from '@/components/progress/ProgressProvider';
import type { PartId } from '@/lib/types';

export interface Station {
  id: string;
  number: string;
  title: string;
  part: PartId;
  color: string;
  minutes: number;
  badge: string | null;
}

interface Legend {
  id: PartId;
  label: string;
  color: string;
  count: number;
  /** DOM id of this Part's group on /modules */
  anchor: string;
}

/** Snaking metro line: `cols` stations per row, alternating direction. */
const GEOMETRY = {
  wide: { cols: 4, w: 900, colGap: 210, rowGap: 132, padX: 90, padY: 56 },
  narrow: { cols: 2, w: 420, colGap: 200, rowGap: 112, padX: 90, padY: 48 },
} as const;

export function CourseMetroMapView({
  stations,
  legend,
  compact,
}: {
  stations: Station[];
  legend: Legend[];
  compact: boolean;
}) {
  const pathname = usePathname();
  const currentId = useMemo(() => {
    const m = /^\/modules\/([^/]+)/.exec(pathname ?? '');
    return m?.[1] ?? null;
  }, [pathname]);

  return (
    <div className="widget not-prose">
      <div className="card overflow-hidden">
        <div className="hidden sm:block">
          <MetroSvg
            stations={stations}
            geometry={GEOMETRY.wide}
            currentId={currentId}
            compact={compact}
          />
        </div>
        <div className="sm:hidden">
          <MetroSvg
            stations={stations}
            geometry={GEOMETRY.narrow}
            currentId={currentId}
            compact={compact}
          />
        </div>
      </div>

      {/* The legend doubles as Part navigation. The coloured line segments in
          the SVG itself are deliberately not clickable — their hit areas would
          overlap the station targets sitting on top of them. */}
      <ul className="mt-3 flex flex-wrap gap-x-2 gap-y-1">
        {legend.map((p) => (
          <li key={p.id}>
            <Link
              href={`/modules#${p.anchor}`}
              className="-mx-1 flex items-center gap-2 rounded-md px-1.5 py-1 text-xs text-muted no-underline transition-colors duration-fast ease-token hover:bg-surface hover:text-ink"
            >
              <span
                className="h-2.5 w-6 rounded-full"
                style={{ backgroundColor: p.color }}
                aria-hidden="true"
              />
              {p.label} <span className="text-muted/70">({p.count})</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MetroSvg({
  stations,
  geometry,
  currentId,
  compact,
}: {
  stations: Station[];
  geometry: (typeof GEOMETRY)['wide'] | (typeof GEOMETRY)['narrow'];
  currentId: string | null;
  compact: boolean;
}) {
  const { hydrated, moduleProgress } = useProgress();
  const { cols, colGap, rowGap, padX, padY } = geometry;

  const rows = Math.ceil(stations.length / cols);
  const width = padX * 2 + colGap * (cols - 1);
  // The last row's station labels sit 34px below its centre, so the box needs
  // room for them on top of the normal padding.
  const height = padY * 2 + rowGap * (rows - 1) + (compact ? 0 : 26);

  const points = stations.map((_, i) => {
    const row = Math.floor(i / cols);
    const posInRow = i % cols;
    // Even rows run left→right, odd rows right→left: a snaking line.
    const col = row % 2 === 0 ? posInRow : cols - 1 - posInRow;
    return { x: padX + col * colGap, y: padY + row * rowGap };
  });

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full"
      role="img"
      aria-label="Course map: 16 modules across four parts and a capstone"
    >
      <title>Course map</title>

      {/* The line: a grey underlay, then one coloured segment per hop so each
          takes the Part colour of the station it arrives at. */}
      {points.slice(1).map((p, i) => (
        <Segment key={`under-${stations[i + 1].id}`} from={points[i]} to={p} color="#E3E8EF" width={9} />
      ))}
      {points.slice(1).map((p, i) => (
        <Segment key={stations[i + 1].id} from={points[i]} to={p} color={stations[i + 1].color} width={5} />
      ))}

      {points.map((p, i) => {
        const station = stations[i];
        const done = hydrated && moduleProgress(station.id).quizPassed;
        const started =
          hydrated &&
          (moduleProgress(station.id).pagesRead.length > 0 ||
            moduleProgress(station.id).notebooksDownloaded.length > 0);
        const isCurrent = station.id === currentId;

        return (
          <g key={station.id}>
            <Link href={`/modules/${station.id}`} aria-label={`Module ${station.number}: ${station.title}`}>
              {/* generous hit area */}
              <circle cx={p.x} cy={p.y} r={26} fill="transparent" className="cursor-pointer" />

              {isCurrent && (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={19}
                  fill="none"
                  stroke={station.color}
                  strokeWidth={2}
                  opacity={0.45}
                />
              )}

              <circle
                cx={p.x}
                cy={p.y}
                r={13}
                fill={done || started ? station.color : '#FFFFFF'}
                stroke={station.color}
                strokeWidth={3}
                className="transition-all duration-base ease-token"
              />

              {done && (
                <path
                  d={`M ${p.x - 5} ${p.y} l 3.5 3.5 L ${p.x + 6} ${p.y - 4.5}`}
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth={2.4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {!done && (
                <text
                  x={p.x}
                  y={p.y + 4}
                  textAnchor="middle"
                  className="pointer-events-none select-none font-sans text-[11px] font-bold"
                  fill={started ? '#FFFFFF' : station.color}
                >
                  {station.number}
                </text>
              )}

              {!compact && (
                <text
                  x={p.x}
                  y={p.y + 34}
                  textAnchor="middle"
                  className="pointer-events-none select-none font-sans text-[10px] font-medium"
                  fill="#5B6B84"
                >
                  {truncate(station.title, 22)}
                </text>
              )}
            </Link>
          </g>
        );
      })}
    </svg>
  );
}

/**
 * One hop. Because the line snakes, the last station of a row and the first of
 * the next share a column — so a row change is a straight vertical drop.
 */
function Segment({
  from,
  to,
  color,
  width,
}: {
  from: { x: number; y: number };
  to: { x: number; y: number };
  color: string;
  width: number;
}) {
  return (
    <line
      x1={from.x}
      y1={from.y}
      x2={to.x}
      y2={to.y}
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
    />
  );
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}
