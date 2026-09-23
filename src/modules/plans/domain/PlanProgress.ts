/**
 * Progreso de planes de lectura (días completados por plan).
 * Funciones puras sobre `PlanProgressMap` ({ [planId]: number[] }).
 * Las claves son ids de `plans.json` en minúsculas (daniel, annual-thematic, ...).
 */

export type PlanProgressMap = Record<string, number[]>;

function normalizeDay(day: number): number | null {
  return Number.isInteger(day) && day > 0 ? day : null;
}

export function togglePlanDay(progress: PlanProgressMap, planId: string, day: number): PlanProgressMap {
  const validDay = normalizeDay(day);
  if (!planId || validDay === null) return progress;
  const id = planId.toLowerCase();
  const current = progress[id] ?? [];
  const next = current.includes(validDay)
    ? current.filter((d) => d !== validDay)
    : [...current, validDay].sort((a, b) => a - b);
  return { ...progress, [id]: next };
}

export function isPlanDayCompleted(progress: PlanProgressMap, planId: string, day: number): boolean {
  if (!planId) return false;
  return (progress[planId.toLowerCase()] ?? []).includes(day);
}

export function completedPlanDays(progress: PlanProgressMap, planId: string): number {
  if (!planId) return 0;
  return (progress[planId.toLowerCase()] ?? []).length;
}

/** Porcentaje 0-100 con 1 decimal; los días fuera de rango no cuentan. */
export function planProgress(progress: PlanProgressMap, planId: string, totalDays: number): number {
  if (!planId || totalDays <= 0) return 0;
  const done = (progress[planId.toLowerCase()] ?? []).filter((d) => d >= 1 && d <= totalDays).length;
  return Number(((done / totalDays) * 100).toFixed(1));
}
