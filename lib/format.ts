/**
 * Formatting helpers with no dependencies — importable from client components.
 *
 * `formatMinutes` used to live in ModuleShell, but that module imports
 * lib/content.ts (and therefore node:fs), so a client component reaching for it
 * dragged the whole content loader into the browser bundle and broke the build.
 */

/** 120 → "2 h", 90 → "1 h 30 min", 45 → "45 min". */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}
