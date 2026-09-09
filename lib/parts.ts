import tokens from '@/schema/tokens.json';
import type { PartId } from './types';

export interface PartMeta {
  id: PartId;
  label: string;
  tagline: string;
  color: string;
}

/** Part metadata — labels and taglines come from Module 0's course map page. */
export const PARTS: PartMeta[] = [
  {
    id: 'A',
    label: 'Part A · Foundations',
    tagline: 'Data literacy → Python → pandas → SQL: the instrument',
    color: tokens.color.part.A,
  },
  {
    id: 'B',
    label: 'Part B · The Four Questions',
    tagline: 'Describe → Diagnose → Predict → Prescribe: the method',
    color: tokens.color.part.B,
  },
  {
    id: 'C',
    label: 'Part C · The Finance Map',
    tagline: 'Four streams, investment banking, two horizontals: the territory',
    color: tokens.color.part.C,
  },
  {
    id: 'D',
    label: 'Part D · The Labs',
    tagline: 'Time series · Monte Carlo · Algo trading · Portfolio optimisation: the craft',
    color: tokens.color.part.D,
  },
  {
    id: 'capstone',
    label: 'Capstone',
    tagline: 'One dataset through the full ladder, shipped as your own mini-app',
    color: tokens.color.part.capstone,
  },
  {
    id: 'appendix',
    label: 'Appendices',
    // Four documents beside the course, not a Part of it — no module carries
    // this id, so the group is built from the registry in lib/appendices.ts.
    tagline: 'The Excel bridge, the career map, how to ship, and the work itself',
    color: tokens.color.part.appendix,
  },
];

const byId = new Map(PARTS.map((p) => [p.id, p]));

export function part(id: PartId): PartMeta {
  return byId.get(id) ?? PARTS[PARTS.length - 1];
}

export function partColor(id: PartId): string {
  return part(id).color;
}

/** DOM id for a Part's group on /modules — the target of `/modules#part-a`. */
export function partAnchor(id: PartId): string {
  return `part-${id.toLowerCase()}`;
}

export const TOKENS = tokens;
