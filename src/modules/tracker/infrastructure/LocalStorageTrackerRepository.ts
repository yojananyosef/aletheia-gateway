import { toggleChapter, type ProgressMap } from '../domain/progress';

/** Clave canónica: la usa el backup/reset de settings (no duplicar el literal). */
export const TRACKER_STORAGE_KEY = 'aletheia_tracker_progress';
/** Clave legacy de NRVA-Reader: se lee como migración, no se borra. */
export const TRACKER_LEGACY_KEYS = ['bible-tracker-progress'];

function readRaw(): string | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const direct = localStorage.getItem(TRACKER_STORAGE_KEY);
    if (direct) return direct;
    for (const legacy of TRACKER_LEGACY_KEYS) {
      const value = localStorage.getItem(legacy);
      if (value) return value;
    }
    return null;
  } catch {
    return null;
  }
}

function parseMap(raw: string | null): ProgressMap {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
    const map: ProgressMap = {};
    for (const [code, chapters] of Object.entries(parsed)) {
      if (!Array.isArray(chapters)) continue;
      const nums = chapters.filter((c): c is number => Number.isInteger(c) && (c as number) > 0);
      map[String(code).toUpperCase()] = [...new Set(nums)].sort((a, b) => a - b);
    }
    return map;
  } catch {
    return {};
  }
}

export class LocalStorageTrackerRepository {
  public getProgress(): ProgressMap {
    return parseMap(readRaw());
  }

  public saveProgress(progress: ProgressMap): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(TRACKER_STORAGE_KEY, JSON.stringify(progress));
    } catch (err) {
      console.error('Error saving tracker progress:', err);
    }
  }

  public toggleChapter(bookCode: string, chapter: number): ProgressMap {
    const next = toggleChapter(this.getProgress(), bookCode, chapter);
    this.saveProgress(next);
    return next;
  }

  public resetProgress(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.removeItem(TRACKER_STORAGE_KEY);
    } catch (err) {
      console.error('Error resetting tracker progress:', err);
    }
  }
}
