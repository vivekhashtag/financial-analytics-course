import type { SVGProps } from 'react';

/**
 * One abstract mark per practice, for the section nav.
 *
 * Deliberately geometric and deliberately not logos: these are six real
 * industries, and a recognisable bank or exchange mark would imply an
 * endorsement the course does not have. Each shape is drawn from what the work
 * *is* — a covered universe, a deal funnel, a magnified ledger, a filtered
 * shortlist, a volatility surface, a grading ladder.
 *
 * Single-stroke `currentColor` paths on a 24-box, so they inherit the nav's
 * colour and sit on the same optical weight as components/ui/Icon.tsx.
 */

const PRACTICE_PATHS: Record<string, string> = {
  // D.1 Equity Research — a tracked series with one marked reading
  'D.1': 'M3 17.5 8 12l3.5 3L21 6 M17 6h4v4',
  // D.2 IB Execution — the funnel from many bidders to one deal
  'D.2': 'M3 5h18 M6.5 10.5h11 M10 16h4 M12 16v3',
  // D.3 Due Diligence — a ledger under a lens
  'D.3': 'M4 4h11v16H4z M7 8h5 M7 12h5 M15.5 14.5a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M18.5 17.5 21 20',
  // D.4 Buy-Side Analysis — a universe filtered to a held position
  'D.4': 'M3 6h18 M6 11h12 M9 16h6 M12 20.5a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2Z',
  // D.5 Derivatives Research — a volatility smile with its strike axis
  'D.5': 'M3 8c3.5 0 5.5 8 9 8s5.5-8 9-8 M3 20h18 M12 20v-2',
  // D.6 Credit & Ratings — a grading ladder with the rung under review
  'D.6': 'M5 19h14 M7 15.5h10 M9 12h6 M11 8.5h2 M12 5V3',
};

export function PracticeIcon({
  practice,
  size = 16,
  ...rest
}: { practice: string; size?: number } & Omit<SVGProps<SVGSVGElement>, 'width' | 'height'>) {
  const path = PRACTICE_PATHS[practice];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {/* Unknown practice: a neutral dot, never a crash. */}
      {path ? (
        path.split(' M').map((seg, i) => <path key={i} d={i === 0 ? seg : `M${seg}`} />)
      ) : (
        <circle cx={12} cy={12} r={3} />
      )}
    </svg>
  );
}
