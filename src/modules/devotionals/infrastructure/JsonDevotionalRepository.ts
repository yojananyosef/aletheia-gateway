import type { IDevotionalRepository } from '../domain/IDevotionalRepository';
import type { DailyDevotional, DevotionalCatalog } from '../domain/Devotional';
import { cacheBust } from '../../../shared/utils/cacheBust';

export class JsonDevotionalRepository implements IDevotionalRepository {
  private static catalogCache: DevotionalCatalog | null = null;

  public async getAll(): Promise<DevotionalCatalog | null> {
    if (JsonDevotionalRepository.catalogCache) {
      return JsonDevotionalRepository.catalogCache;
    }

    try {
      const res = await fetch(cacheBust('/data/devotionals/sme-spurgeon.json'));
      if (!res.ok) return null;
      const data: DevotionalCatalog = await res.json();
      JsonDevotionalRepository.catalogCache = data;
      return data;
    } catch (err) {
      console.warn('[JsonDevotionalRepository] Error loading devotionals:', err);
      return null;
    }
  }

  public async getByDate(dateKey: string): Promise<DailyDevotional | null> {
    const catalog = await this.getAll();
    if (!catalog || !catalog.days) return null;

    // dateKey format MM.DD (e.g. "01.01")
    const formattedKey = dateKey.includes('.')
      ? dateKey
          .split('.')
          .map((p) => p.padStart(2, '0'))
          .join('.')
      : dateKey;

    return catalog.days[formattedKey] || null;
  }

  public async getToday(): Promise<DailyDevotional | null> {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return this.getByDate(`${mm}.${dd}`);
  }
}
