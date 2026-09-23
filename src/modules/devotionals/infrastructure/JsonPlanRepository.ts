import type { PlanContent, PlanDay, PlanIndexEntry } from '../domain/ReadingPlan';
import { cacheBust } from '../../../shared/utils/cacheBust';

export class JsonPlanRepository {
  private static indexCache: PlanIndexEntry[] | null = null;
  private static contentCache = new Map<string, PlanContent>();

  public async getIndex(): Promise<PlanIndexEntry[]> {
    if (JsonPlanRepository.indexCache) return JsonPlanRepository.indexCache;
    try {
      const res = await fetch(cacheBust('/data/plans/plans.json'));
      if (!res.ok) return [];
      const data: PlanIndexEntry[] = await res.json();
      JsonPlanRepository.indexCache = data;
      return data;
    } catch (err) {
      console.warn('[JsonPlanRepository] Error loading index:', err);
      return [];
    }
  }

  public async getContent(planId: string): Promise<PlanContent | null> {
    if (JsonPlanRepository.contentCache.has(planId)) {
      return JsonPlanRepository.contentCache.get(planId)!;
    }
    try {
      const res = await fetch(cacheBust(`/data/plans/content/${planId}.json`));
      if (!res.ok) return null;
      const data: PlanContent = await res.json();
      JsonPlanRepository.contentCache.set(planId, data);
      return data;
    } catch (err) {
      console.warn('[JsonPlanRepository] Error loading plan:', planId, err);
      return null;
    }
  }

  public async getDay(planId: string, day: number): Promise<PlanDay | null> {
    const content = await this.getContent(planId);
    if (!content) return null;
    return content[String(day)] ?? null;
  }
}
