import {
  EMPTY_STREAK,
  getLocalDateString,
  recordVisit,
  weeklyProgress,
  type StreakData,
  type WeeklyProgress,
} from '../domain/streak';

/** Clave canónica: la usa el backup/reset de settings (no duplicar el literal). */
export const STREAK_STORAGE_KEY = 'aletheia_user_streak';
/** Clave legacy de NRVA-Reader: se lee como migración, no se borra. */
export const STREAK_LEGACY_KEYS = ['user-streak'];

export class LocalStorageStreakRepository {
  public getData(): StreakData {
    if (typeof localStorage === 'undefined') return { ...EMPTY_STREAK };
    try {
      const direct = localStorage.getItem(STREAK_STORAGE_KEY);
      if (direct) return { ...EMPTY_STREAK, ...JSON.parse(direct) };
      for (const legacy of STREAK_LEGACY_KEYS) {
        const value = localStorage.getItem(legacy);
        if (value) return { ...EMPTY_STREAK, ...JSON.parse(value) };
      }
      return { ...EMPTY_STREAK };
    } catch {
      return { ...EMPTY_STREAK };
    }
  }

  public saveData(data: StreakData): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.error('Error saving streak:', err);
    }
  }

  /** Registra la visita de hoy. Idempotente. Devuelve el progreso semanal. */
  public recordToday(now: Date = new Date()): WeeklyProgress {
    const data = recordVisit(this.getData(), getLocalDateString(now));
    this.saveData(data);
    return weeklyProgress(data, now);
  }

  public getWeekly(now: Date = new Date()): WeeklyProgress {
    return weeklyProgress(this.getData(), now);
  }
}
