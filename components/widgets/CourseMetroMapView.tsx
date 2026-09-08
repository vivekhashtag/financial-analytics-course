'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useProgress } from '@/components/progress/ProgressProvider';
import { useInView } from '@/components/motion/Reveal';
import { formatMinutes } from '@/lib/format';
import tokens from '@/schema/tokens.json';
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
  const { ref, inView } = useInView<SVGSVGElement>({ threshold: 0.2 });
  const [hovered, setHovered] = useState<number | null>(null);

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

  const state = (id: string) => {
    if (!hydrated) return { done: false, started: false };
    const p = moduleProgress(id);
    return {
      done: p.quizPassed,
      started:
        p.pagesRead.length > 0 || p.notebooksDownloaded.length > 0 || p.quizScore !== null,
    };
  };

  // The furthest station with any history — the "you are here" of the journey.
  const furthestIndex = hydrated
    ? stations.reduce((acc, s, i) => (state(s.id).started || state(s.id).done ? i : acc), -1)
    : -1;

  // The whole line as one path, so it can draw itself in a single stroke.
  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');
  // Rough path length: every hop is axis-aligned, so this is exact enough for
  // a dash offset and avoids needing getTotalLength() from the DOM.
  const lineLength = points
    .slice(1)
    .reduce((sum, p, i) => sum + Math.abs(p.x - points[i].x) + Math.abs(p.y - points[i].y), 0);

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full overflow-visible"
      role="img"
      aria-label={`Course map: ${stations.length} modules across four parts and a capstone`}
      onMouseLeave={() => setHovered(null)}
    >
      <title>Course map</title>

      {/* The grey bed, always present so the layout never shifts. */}
      {points.slice(1).map((p, i) => (
        <Segment
          key={`under-${stations[i + 1].id}`}
          from={points[i]}
          to={p}
          color="#E3E8EF"
          width={9}
        />
      ))}

      {/* One coloured segment per hop, so each carries its Part's colour. A
          completed hop reads at full strength; hops ahead of the learner sit
          back, so progress is legible in the line itself. */}
      {points.slice(1).map((p, i) => (
        <Segment
          key={stations[i + 1].id}
          from={points[i]}
          to={p}
          color={stations[i + 1].color}
          width={5}
          opacity={state(stations[i + 1].id).done ? 1 : 0.55}
        />
      ))}

      {/* The draw-on: a white curtain laid over the whole line, retreating
          along it. `stroke-dashoffset` on one path — a single paint property,
          no layout, ~1.2s, and it stops when it's done. */}
      <path
        d={linePath}
        fill="none"
        stroke={tokens.color.bg}
        strokeWidth={13}
        strokeLinecap="butt"
        strokeDasharray={lineLength}
        strokeDashoffset={inView ? -lineLength : 0}
        style={{ transition: 'stroke-dashoffset 1200ms cubic-bezier(.4,0,.2,1)' }}
        aria-hidden="true"
        pointerEvents="none"
      />

      {points.map((p, i) => {
        const station = stations[i];
        const { done, started } = state(station.id);
        const isCurrent = station.id === currentId;
        const isFurthest = i === furthestIndex;
        const isHovered = hovered === i;

        return (
          <g
            key={station.id}
            onMouseEnter={() => setHovered(i)}
            onFocus={() => setHovered(i)}
            onBlur={() => setHovered(null)}
          >
            <Link
              href={`/modules/${station.id}`}
              aria-label={`Module ${station.number}: ${station.title}`}
            >
              {/* generous hit area */}
              <circle cx={p.x} cy={p.y} r={26} fill="transparent" className="cursor-pointer" />

              {/* The learner's furthest station breathes — a soft halo, one of
                  the two looping effects allowed on a page. */}
              {isFurthest && (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={17}
                  fill={station.color}
                  className="animate-halo"
                  style={{ transformOrigin: `${p.x}px ${p.y}px` }}
                  aria-hidden="true"
                />
              )}

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

              {/* Station scales on hover — transform only, so it stays on the
                  compositor and never nudges the layout. */}
              <g
                style={{
                  transform: isHovered ? 'scale(1.18)' : 'scale(1)',
                  transformOrigin: `${p.x}px ${p.y}px`,
                  transition: 'transform 160ms cubic-bezier(.16,.84,.44,1)',
                }}
              >
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={13}
                  fill={done || started ? station.color : '#FFFFFF'}
                  stroke={station.color}
                  strokeWidth={3}
                />

                {done ? (
                  <path
                    d={`M ${p.x - 5} ${p.y} l 3.5 3.5 L ${p.x + 6} ${p.y - 4.5}`}
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth={2.4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ) : (
                  <text
                    x={p.x}
                    y={p.y + 4}
                    textAnchor="middle"
                    className="pointer-events-none select-none font-body text-[11px] font-semibold tabular-nums"
                    fill={started ? '#FFFFFF' : station.color}
                  >
                    {station.number}
                  </text>
                )}
              </g>

              {!compact && (
                <text
                  x={p.x}
                  y={p.y + 34}
                  textAnchor="middle"
                  className="pointer-events-none select-none font-body text-[10px] font-medium"
                  fill="#5B6B84"
                >
                  {truncate(station.title, 22)}
                </text>
              )}
            </Link>
          </g>
        );
      })}

      {/* Tooltip last, so it paints over neighbouring stations. */}
      {hovered !== null && <Tooltip station={stations[hovered]} at={points[hovered]} state={state(stations[hovered].id)} />}
    </svg>
  );
}

/** Hover card for a station: title, time, badge, progress state. */
function Tooltip({
  station,
  at,
  state,
}: {
  station: Station;
  at: { x: number; y: number };
  state: { done: boolean; started: boolean };
}) {
  const lines = [
    `${formatMinutes(station.minutes)}${station.badge ? ` · ${station.badge}` : ''}`,
    state.done ? 'Complete' : state.started ? 'In progress' : 'Not started',
  ];

  const w = 186;
  const h = 58;
  const x = Math.max(4, at.x - w / 2);
  const y = at.y - h - 24;

  return (
    <g className="pointer-events-none animate-pop-in" aria-hidden="true">
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={8}
        fill="#FFFFFF"
        stroke={station.color}
        strokeWidth={1.5}
      />
      <text x={x + 10} y={y + 21} className="font-body text-[11px] font-semibold" fill="#0F172A">
        {truncate(`${station.number} · ${station.title}`, 26)}
      </text>
      <text x={x + 10} y={y + 36} className="font-body text-[10px]" fill="#5B6B84">
        {truncate(lines[0], 30)}
      </text>
      <text x={x + 10} y={y + 49} className="font-body text-[10px] font-medium" fill={station.color}>
        {lines[1]}
      </text>
    </g>
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
  opacity = 1,
}: {
  from: { x: number; y: number };
  to: { x: number; y: number };
  color: string;
  width: number;
  opacity?: number;
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
      opacity={opacity}
    />
  );
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}
