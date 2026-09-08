import type { SVGProps } from 'react';

/**
 * Inline icon set — the names come straight from the content
 * (`module.json` badges, `<IconRow icon="zap" />`), so unknown names must
 * degrade to a neutral dot rather than crash a page.
 */

const PATHS: Record<string, string> = {
  // badges
  rocket:
    'M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91 0Z M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2Z M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0 M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5',
  code: 'm16 18 6-6-6-6 M8 6l-6 6 6 6',
  search: 'M11 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16Z m10 10-4.35-4.35',
  award:
    'M12 2a7 7 0 1 0 0 14 7 7 0 0 0 0-14Z m-3.6 12.5L7 22l5-3 5 3-1.4-7.5',
  trophy:
    'M6 9H4.5a2.5 2.5 0 0 1 0-5H6 M18 9h1.5a2.5 2.5 0 0 0 0-5H18 M6 2h12v7a6 6 0 0 1-12 0Z M9 22h6 M12 15v7',
  // icon-row (Module 0 course map)
  zap: 'M13 2 3 14h8l-1 8 10-12h-8l1-8Z',
  book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20 M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z',
  play: 'm6 3 14 9-14 9V3Z',
  sparkles:
    'm12 3 1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3Z M19 15l.8 2L22 17.8l-2.2.8L19 21l-.8-2.4L16 17.8l2.2-.8L19 15Z',
  pencil: 'M12 20h9 M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z',
  'check-circle': 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z m-3.5 9 2.5 2.5 5-5',
  'git-branch': 'M6 3v12 M18 6a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M15 9a9 9 0 0 1-9 9',
  // ui
  download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3',
  'external-link': 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6 M15 3h6v6 M10 14 21 3',
  copy: 'M9 9h11a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V11a2 2 0 0 1 2-2Z M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1',
  check: 'm4 12 5 5L20 6',
  x: 'M18 6 6 18 M6 6l12 12',
  lock: 'M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z M8 11V7a4 4 0 0 1 8 0v4',
  unlock: 'M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z M8 11V7a4 4 0 0 1 7.5-2',
  'arrow-right': 'M5 12h14 m-7-7 7 7-7 7',
  'arrow-left': 'M19 12H5 m7-7-7 7 7 7',
  'chevron-down': 'm6 9 6 6 6-6',
  'chevron-right': 'm9 6 6 6-6 6',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z M12 7v5l3.5 2',
  info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z M12 11v5 M12 8h.01',
  alert: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z M12 8v5 M12 16h.01',
  'alert-triangle': 'M10.3 4 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4a2 2 0 0 0-3.4 0Z M12 9v4 M12 17h.01',
  flame: 'M12 22c4 0 7-2.7 7-6.5 0-4.5-4.5-6-4.5-10.5 0 0-3 1.5-3 5 0-1.5-1.5-3-1.5-3S8 9 8 11c0-1-1-2-1-2-1.3 1.6-2 3.5-2 6.5C5 19.3 8 22 12 22Z',
  table: 'M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5Z M3 9h18 M3 15h18 M9 3v18',
  database: 'M12 3c4.97 0 9 1.34 9 3s-4.03 3-9 3-9-1.34-9-3 4.03-3 9-3Z M21 6v6c0 1.66-4.03 3-9 3s-9-1.34-9-3V6 M21 12v6c0 1.66-4.03 3-9 3s-9-1.34-9-3v-6',
  notebook: 'M4 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4Z M8 2v20 M12 7h5 M12 12h5',
  layers: 'm12 2 9 5-9 5-9-5 9-5Z m9 10-9 5-9-5 M21 17l-9 5-9-5',
  target: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z M12 11.5a.5.5 0 1 0 0 1 .5.5 0 0 0 0-1Z',
  compass: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z m4 5-2.5 6L7 16l2.5-6L16 8Z',
  map: 'm3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z M9 3v15 M15 6v15',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M22 21v-2a4 4 0 0 0-3-3.85 M16 3.1a4 4 0 0 1 0 7.75',
  'trending-up': 'm3 17 6-6 4 4 8-8 M17 7h4v4',
  'refresh-cw': 'M21 12a9 9 0 1 1-3-6.7L21 8 M21 3v5h-5',
  eye: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
  'file-text': 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z M14 2v6h6 M8 13h8 M8 17h5',
  dot: 'M12 10.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z',
};

export type IconName = keyof typeof PATHS | string;

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 18, className, ...rest }: IconProps) {
  const d = PATHS[name] ?? PATHS.dot;
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
      className={className}
      {...rest}
    >
      {d.split(' M').map((seg, i) => (
        <path key={i} d={i === 0 ? seg : `M${seg}`} />
      ))}
    </svg>
  );
}

export function hasIcon(name: string): boolean {
  return name in PATHS;
}
