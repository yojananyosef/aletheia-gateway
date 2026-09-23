/**
 * Planes de lectura ES (port de NRVA `src/data/plans.json` + `plan-content/*.json`).
 * Los 10 planes diarios usan claves de día "1".."N"; los 5 ficheros `es_*`
 * son libros EGW completos de referencia ({ metadata, chapters }).
 */

export interface PlanIndexEntry {
  id: string;
  title: string;
  description: string;
  durationDays: number;
  category: string;
  url: string;
}

export interface PlanDayBibleRef {
  book: string;
  chapter: number;
  label: string;
}

export interface PlanDayEgw {
  label: string;
  content: string;
}

export interface PlanDay {
  title: string;
  description: string;
  bible: PlanDayBibleRef[];
  egw: PlanDayEgw[];
}

export type PlanContent = Record<string, PlanDay>;

export function isEgwBook(data: unknown): boolean {
  if (typeof data !== 'object' || data === null) return false;
  const d = data as Record<string, unknown>;
  return 'metadata' in d && 'chapters' in d;
}

export function planDayCount(content: PlanContent): number {
  return Object.keys(content).length;
}
