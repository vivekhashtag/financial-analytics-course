import type { CourseIconName } from '@/lib/links';

/**
 * Hand-written inline SVG — no icon library, no external requests.
 *
 * The course-card marks are deliberately abstract (a graph, a spark, linked
 * blocks, a curve, bars). They are not logos and are not meant to stand in for
 * any product's brand.
 */

export function LinkedInIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d="M22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0zM7.12 20.45H3.55V9h3.57v11.45zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zm15.11 13.02h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28z" />
    </svg>
  );
}

const COURSE_MARKS: Record<CourseIconName, React.ReactNode> = {
  // a small graph of connected nodes — things learned from relationships
  network: (
    <>
      <circle cx="5" cy="6" r="2" />
      <circle cx="5" cy="18" r="2" />
      <circle cx="13" cy="12" r="2" />
      <circle cx="20" cy="6" r="2" />
      <circle cx="20" cy="18" r="2" />
      <path d="M6.8 7.1 11.3 11M6.8 16.9 11.3 13M14.8 11 18.4 7.4M14.8 13l3.6 3.6" />
    </>
  ),
  // a four-point spark — generation
  spark: (
    <>
      <path d="M12 3v5M12 16v5M4.5 12h5M14.5 12h5" />
      <path d="M12 9.5 13 11l1.5 1-1.5 1-1 1.5-1-1.5L9.5 12 11 11z" />
    </>
  ),
  // three linked blocks — a chain of records
  chain: (
    <>
      <rect x="2.5" y="9" width="6" height="6" rx="1.5" />
      <rect x="15.5" y="9" width="6" height="6" rx="1.5" />
      <rect x="9" y="2.5" width="6" height="6" rx="1.5" />
      <path d="M8.5 12h7M12 8.5v0M11 8.5 9.5 10.5M13 8.5l1.5 2" />
    </>
  ),
  // a plotted curve with axes — functions
  curve: (
    <>
      <path d="M4 4v16h16" />
      <path d="M6.5 17c2.5 0 3.5-9 6-9s3 6 5.5 6" />
    </>
  ),
  // a small distribution of bars
  bars: (
    <>
      <path d="M4 20V13M9 20V8M14 20v-9M19 20v-5" />
      <path d="M3 20h18" />
    </>
  ),
};

export function CourseIcon({
  name,
  size = 18,
  className,
}: {
  name: CourseIconName;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {COURSE_MARKS[name]}
    </svg>
  );
}
