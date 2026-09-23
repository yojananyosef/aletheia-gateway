import {
  normalizePlanContent,
  type EgwChapter,
  type PlanContent,
  type PlanDay,
  type PlanIndexEntry,
} from '../domain/ReadingPlan';
import { cacheBust } from '../../../shared/utils/cacheBust';

export class JsonPlanRepository {
  private static indexCache: PlanIndexEntry[] | null = null;
  private static contentCache = new Map<string, PlanContent>();
  private static egwCache = new Map<string, EgwChapter>();

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
      const data: PlanContent = normalizePlanContent(await res.json());
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

  /**
   * Capítulo de un libro EGW (`es_PP54(PP)`, …) para refs `{ label, chapterId }`.
   * Devuelve null si el libro o el capítulo no existen.
   */
  public async getEgwChapter(bookFileId: string, chapterNumber: number): Promise<EgwChapter | null> {
    const key = `${bookFileId}#${chapterNumber}`;
    if (JsonPlanRepository.egwCache.has(key)) {
      return JsonPlanRepository.egwCache.get(key)!;
    }
    try {
      // Sanitiza el id (solo el basename, sin slashes) contra path traversal.
      const safeId = bookFileId.split('/').pop() ?? '';
      if (!safeId || safeId !== bookFileId) return null;
      const res = await fetch(cacheBust(`/data/plans/content/${safeId}.json`));
      if (!res.ok) return null;
      const data = await res.json();
      const chapters = Array.isArray(data?.chapters) ? data.chapters : [];
      const found = chapters.find((c: { number?: unknown }) => c?.number === chapterNumber) ?? null;
      if (found) JsonPlanRepository.egwCache.set(key, found as EgwChapter);
      return (found as EgwChapter | null) ?? null;
    } catch (err) {
      console.warn('[JsonPlanRepository] Error loading EGW chapter:', bookFileId, chapterNumber, err);
      return null;
    }
  }
}
