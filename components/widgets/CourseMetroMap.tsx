import { getAllModules } from '@/lib/content';
import { PARTS, partAnchor, partColor } from '@/lib/parts';
import { CourseMetroMapView, type Station } from './CourseMetroMapView';

/**
 * The course journey as a metro line, colour-coded by Part.
 * Used on the landing page, Module 0's course map, and the global nav sheet.
 */
export function CourseMetroMap({ compact = false }: { compact?: boolean }) {
  const stations: Station[] = getAllModules().map((m) => ({
    id: m.id,
    number: m.number,
    title: m.title,
    part: m.part,
    color: partColor(m.part),
    minutes: m.estimatedMinutes,
    badge: m.badge?.label ?? null,
  }));

  const legend = PARTS.filter((p) => stations.some((s) => s.part === p.id)).map((p) => ({
    id: p.id,
    label: p.label,
    color: p.color,
    count: stations.filter((s) => s.part === p.id).length,
    anchor: partAnchor(p.id),
  }));

  return <CourseMetroMapView stations={stations} legend={legend} compact={compact} />;
}
