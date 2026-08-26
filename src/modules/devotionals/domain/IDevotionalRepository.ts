import type { DailyDevotional, DevotionalCatalog } from './Devotional';

export interface IDevotionalRepository {
  getByDate(dateKey: string): Promise<DailyDevotional | null>;
  getToday(): Promise<DailyDevotional | null>;
  getAll(): Promise<DevotionalCatalog | null>;
}
