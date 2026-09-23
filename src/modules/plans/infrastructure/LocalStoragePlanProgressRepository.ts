import { togglePlanDay, type PlanProgressMap } from '../domain/PlanProgress';

/** Clave canónica: la usa el backup/reset de settings (no duplicar el literal). */
export const PLAN_PROGRESS_STORAGE_KEY = 'aletheia_plan_progress';

function parseMap(raw: string | null): PlanProgressMap {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
    const map: PlanProgressMap = {};
    for (const [id, days] of Object.entries(parsed)) {
      if (!Array.isArray(days)) continue;
      const nums = days.filter((d): d is number => Number.isInteger(d) && (d as number) > 0);
      map[String(id).toLowerCase()] = [...new Set(nums)].sort((a, b) => a - b);
    }
    return map;
  } catch {
    return {};
  }
}

export class LocalStoragePlanProgressRepository {
  public getProgress(): PlanProgressMap {
    if (typeof localStorage === 'undefined') return {};
    try {
      return parseMap(localStorage.getItem(PLAN_PROGRESS_STORAGE_KEY));
    } catch {
      return {};
    }
  }

  public saveProgress(progress: PlanProgressMap): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(PLAN_PROGRESS_STORAGE_KEY, JSON.stringify(progress));
    } catch (err) {
      console.error('Error saving plan progress:', err);
    }
  }

  public toggleDay(planId: string, day: number): PlanProgressMap {
    const next = togglePlanDay(this.getProgress(), planId, day);
    this.saveProgress(next);
    return next;
  }

  public isDayCompleted(planId: string, day: number): boolean {
    const days = this.getProgress()[planId.toLowerCase()] ?? [];
    return days.includes(day);
  }

  public resetPlan(planId: string): void {
    if (typeof localStorage === 'undefined' || !planId) return;
    try {
      const next = { ...this.getProgress() };
      delete next[planId.toLowerCase()];
      localStorage.setItem(PLAN_PROGRESS_STORAGE_KEY, JSON.stringify(next));
    } catch (err) {
      console.error('Error resetting plan progress:', err);
    }
  }
}
