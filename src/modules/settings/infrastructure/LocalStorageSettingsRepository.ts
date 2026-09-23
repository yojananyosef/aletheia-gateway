import type { UserSettings, BackupPayload, ImportResult } from '../domain/UserSettings';
import { readStorageWithLegacy, removeStorageWithLegacy } from '../../../shared/utils/storage';
import {
  BOOKMARKS_STORAGE_KEY,
  BOOKMARKS_LEGACY_KEYS,
} from '../../bookmarks/infrastructure/LocalStorageBookmarkRepository';
import {
  PERSONAL_NOTES_STORAGE_KEY,
  PERSONAL_NOTES_LEGACY_KEYS,
} from '../../notes/infrastructure/LocalStorageNoteRepository';
import {
  HIGHLIGHTS_STORAGE_KEY,
  HIGHLIGHTS_LEGACY_KEYS,
} from '../../bible-reader/infrastructure/LocalStorageHighlightRepository';
import { TRACKER_STORAGE_KEY, TRACKER_LEGACY_KEYS } from '../../tracker/infrastructure/LocalStorageTrackerRepository';
import { STREAK_STORAGE_KEY, STREAK_LEGACY_KEYS } from '../../tracker/infrastructure/LocalStorageStreakRepository';
import { PLAN_PROGRESS_STORAGE_KEY } from '../../plans/infrastructure/LocalStoragePlanProgressRepository';
import { calculateBestStreak, type StreakData } from '../../tracker/domain/streak';
import type { ProgressMap } from '../../tracker/domain/progress';

const STORAGE_SETTINGS = 'aletheia_user_settings';
const STORAGE_BOOKMARKS = BOOKMARKS_STORAGE_KEY;
const STORAGE_NOTES = PERSONAL_NOTES_STORAGE_KEY;
const STORAGE_HIGHLIGHTS = HIGHLIGHTS_STORAGE_KEY;
const STORAGE_LAST_PASSAGE = 'aletheia_last_passage';
const STORAGE_TRANSLATIONS = 'aletheia_selected_translations';
const STORAGE_CALM_MODE = 'aletheia_calm_mode';
const STORAGE_TRACKER = TRACKER_STORAGE_KEY;
const STORAGE_STREAK = STREAK_STORAGE_KEY;
const STORAGE_PLAN_PROGRESS = PLAN_PROGRESS_STORAGE_KEY;

// Claves legacy por clave canónica (rename pre-v0.11 + backup pre-v0.11.2 + NRVA-Reader).
const LEGACY_KEYS: Record<string, string[]> = {
  [STORAGE_SETTINGS]: ['alethia_user_settings'],
  [STORAGE_BOOKMARKS]: BOOKMARKS_LEGACY_KEYS,
  [STORAGE_NOTES]: PERSONAL_NOTES_LEGACY_KEYS,
  [STORAGE_HIGHLIGHTS]: HIGHLIGHTS_LEGACY_KEYS,
  [STORAGE_LAST_PASSAGE]: ['alethia_last_passage'],
  [STORAGE_TRANSLATIONS]: ['alethia_selected_translations'],
  [STORAGE_CALM_MODE]: ['alethia_calm_mode'],
  [STORAGE_TRACKER]: TRACKER_LEGACY_KEYS,
  [STORAGE_STREAK]: STREAK_LEGACY_KEYS,
  [STORAGE_PLAN_PROGRESS]: [],
};

function getStoredItem(key: string): string | null {
  return readStorageWithLegacy(key, LEGACY_KEYS[key] ?? key);
}

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'standard',
  fontFamily: 'inter',
  defaultTranslation: 'RV1909',
  calmMode: false,
};

export class LocalStorageSettingsRepository {
  public getSettings(): UserSettings {
    if (typeof localStorage === 'undefined') return DEFAULT_SETTINGS;
    try {
      const raw = getStoredItem(STORAGE_SETTINGS);
      if (!raw) return DEFAULT_SETTINGS;
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  public saveSettings(updated: Partial<UserSettings>): UserSettings {
    const current = this.getSettings();
    const next = { ...current, ...updated };
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(next));
      } catch (err) {
        console.error('Error saving settings:', err);
      }
    }
    return next;
  }

  public async exportBackup(): Promise<string> {
    if (typeof localStorage === 'undefined') {
      throw new Error('Almacenamiento local no disponible');
    }

    const bookmarks = JSON.parse(getStoredItem(STORAGE_BOOKMARKS) || '[]');
    const notes = JSON.parse(getStoredItem(STORAGE_NOTES) || '[]');
    const highlights = JSON.parse(getStoredItem(STORAGE_HIGHLIGHTS) || '[]');
    const lastPassage = getStoredItem(STORAGE_LAST_PASSAGE) || 'Génesis 1:1';
    const selectedTranslations = JSON.parse(getStoredItem(STORAGE_TRANSLATIONS) || '["RV1909"]');
    const settings = this.getSettings();
    const trackerProgress = JSON.parse(getStoredItem(STORAGE_TRACKER) || '{}');
    const streak = JSON.parse(getStoredItem(STORAGE_STREAK) || 'null');
    const planProgress = JSON.parse(getStoredItem(STORAGE_PLAN_PROGRESS) || '{}');

    const payload: BackupPayload = {
      app: 'AletheiaGateway',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      data: {
        bookmarks,
        notes,
        highlights,
        lastPassage,
        selectedTranslations,
        settings,
        trackerProgress,
        streak,
        planProgress,
      },
    };

    return JSON.stringify(payload, null, 2);
  }

  private mergeArraysById<T extends { id?: string }>(existing: T[], incoming: T[]): T[] {
    const map = new Map<string, T>();
    for (const item of existing) {
      const key = item.id ? String(item.id) : JSON.stringify(item);
      map.set(key, item);
    }
    for (const item of incoming) {
      const key = item.id ? String(item.id) : JSON.stringify(item);
      if (!map.has(key)) map.set(key, item);
    }
    return Array.from(map.values());
  }

  private mergeProgressMaps(a: ProgressMap, b: ProgressMap): ProgressMap {
    const out: ProgressMap = { ...a };
    for (const [code, chapters] of Object.entries(b)) {
      if (!Array.isArray(chapters)) continue;
      out[code] = [...new Set([...(out[code] ?? []), ...chapters])].sort((x, y) => x - y);
    }
    return out;
  }

  /** Fusión de rachas: une historiales y conserva el registro más reciente. */
  private mergeStreaks(a: StreakData | null, b: StreakData | null): StreakData | null {
    if (!a) return b;
    if (!b) return a;
    const history = [...new Set([...(a.visitHistory ?? []), ...(b.visitHistory ?? [])])].sort();
    const capped = history.length > 60 ? history.slice(-60) : history;
    const yearlyVisits: Record<string, number> = {};
    for (const day of capped) {
      const year = day.slice(0, 4);
      yearlyVisits[year] = (yearlyVisits[year] || 0) + 1;
    }
    const winner = (b.lastVisit ?? '') >= (a.lastVisit ?? '') ? b : a;
    const bestStreak = Math.max(a.bestStreak || 0, b.bestStreak || 0, calculateBestStreak(capped));
    return {
      currentStreak: winner.currentStreak || 0,
      lastVisit: winner.lastVisit || '',
      visitHistory: capped,
      yearlyVisits,
      bestStreak,
    };
  }

  public async importBackup(jsonString: string, options?: { merge?: boolean }): Promise<ImportResult> {
    const shouldMerge = options?.merge === true;
    if (typeof localStorage === 'undefined') {
      return {
        success: false,
        message: 'Almacenamiento no disponible',
        bookmarksCount: 0,
        notesCount: 0,
        highlightsCount: 0,
      };
    }

    try {
      const parsed: BackupPayload = JSON.parse(jsonString);
      if (!parsed.data) {
        return {
          success: false,
          message: 'Formato de respaldo inválido',
          bookmarksCount: 0,
          notesCount: 0,
          highlightsCount: 0,
        };
      }

      const {
        bookmarks = [],
        notes = [],
        highlights = [],
        lastPassage,
        selectedTranslations,
        settings,
        trackerProgress,
        streak,
        planProgress,
      } = parsed.data;

      let finalBookmarks = bookmarks;
      let finalNotes = notes;
      let finalHighlights = highlights;

      if (shouldMerge) {
        // Fusionar: conservar existentes + añadir únicos del backup
        if (Array.isArray(bookmarks)) {
          const existing = JSON.parse(getStoredItem(STORAGE_BOOKMARKS) || '[]');
          finalBookmarks = this.mergeArraysById(existing, bookmarks);
          localStorage.setItem(STORAGE_BOOKMARKS, JSON.stringify(finalBookmarks));
        }
        if (Array.isArray(notes)) {
          const existing = JSON.parse(getStoredItem(STORAGE_NOTES) || '[]');
          finalNotes = this.mergeArraysById(existing, notes);
          localStorage.setItem(STORAGE_NOTES, JSON.stringify(finalNotes));
        }
        if (Array.isArray(highlights)) {
          const existing = JSON.parse(getStoredItem(STORAGE_HIGHLIGHTS) || '[]');
          finalHighlights = this.mergeArraysById(existing, highlights);
          localStorage.setItem(STORAGE_HIGHLIGHTS, JSON.stringify(finalHighlights));
        }
        // En modo fusión, no sobrescribimos lastPassage; para traducciones hacemos unión
        if (Array.isArray(selectedTranslations)) {
          const existingTrans = JSON.parse(getStoredItem(STORAGE_TRANSLATIONS) || '[]');
          const mergedTrans = Array.from(new Set([...existingTrans, ...selectedTranslations]));
          localStorage.setItem(STORAGE_TRANSLATIONS, JSON.stringify(mergedTrans));
        }
        if (settings) {
          // Merge shallow: existentes + importados (importados prevalecen)
          const existingSettings = this.getSettings();
          this.saveSettings({ ...existingSettings, ...settings });
        }
        if (trackerProgress && typeof trackerProgress === 'object') {
          const existing = JSON.parse(getStoredItem(STORAGE_TRACKER) || '{}');
          localStorage.setItem(STORAGE_TRACKER, JSON.stringify(this.mergeProgressMaps(existing, trackerProgress)));
        }
        if (streak && typeof streak === 'object') {
          const existing = JSON.parse(getStoredItem(STORAGE_STREAK) || 'null');
          const merged = this.mergeStreaks(existing, streak);
          if (merged) localStorage.setItem(STORAGE_STREAK, JSON.stringify(merged));
        }
        if (planProgress && typeof planProgress === 'object') {
          const existing = JSON.parse(getStoredItem(STORAGE_PLAN_PROGRESS) || '{}');
          localStorage.setItem(STORAGE_PLAN_PROGRESS, JSON.stringify(this.mergeProgressMaps(existing, planProgress)));
        }
      } else {
        // Sobrescribir: reemplazo total (comportamiento original)
        if (Array.isArray(bookmarks)) {
          localStorage.setItem(STORAGE_BOOKMARKS, JSON.stringify(bookmarks));
        }
        if (Array.isArray(notes)) {
          localStorage.setItem(STORAGE_NOTES, JSON.stringify(notes));
        }
        if (Array.isArray(highlights)) {
          localStorage.setItem(STORAGE_HIGHLIGHTS, JSON.stringify(highlights));
        }
        if (lastPassage && typeof lastPassage === 'string') {
          localStorage.setItem(STORAGE_LAST_PASSAGE, lastPassage);
        }
        if (Array.isArray(selectedTranslations)) {
          localStorage.setItem(STORAGE_TRANSLATIONS, JSON.stringify(selectedTranslations));
        }
        if (settings) {
          this.saveSettings(settings);
        }
        if (trackerProgress && typeof trackerProgress === 'object') {
          localStorage.setItem(STORAGE_TRACKER, JSON.stringify(trackerProgress));
        }
        if (streak && typeof streak === 'object') {
          localStorage.setItem(STORAGE_STREAK, JSON.stringify(streak));
        }
        if (planProgress && typeof planProgress === 'object') {
          localStorage.setItem(STORAGE_PLAN_PROGRESS, JSON.stringify(planProgress));
        }
      }

      return {
        success: true,
        message: shouldMerge ? 'Respaldo fusionado exitosamente' : 'Respaldo restaurado exitosamente',
        bookmarksCount: Array.isArray(finalBookmarks) ? finalBookmarks.length : 0,
        notesCount: Array.isArray(finalNotes) ? finalNotes.length : 0,
        highlightsCount: Array.isArray(finalHighlights) ? finalHighlights.length : 0,
      };
    } catch (err) {
      console.error('Error importing backup:', err);
      return {
        success: false,
        message: 'Error al procesar el archivo JSON de respaldo',
        bookmarksCount: 0,
        notesCount: 0,
        highlightsCount: 0,
      };
    }
  }

  public resetAllData(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      for (const key of [
        STORAGE_BOOKMARKS,
        STORAGE_NOTES,
        STORAGE_HIGHLIGHTS,
        STORAGE_LAST_PASSAGE,
        STORAGE_TRANSLATIONS,
        STORAGE_SETTINGS,
        STORAGE_CALM_MODE,
        STORAGE_TRACKER,
        STORAGE_STREAK,
        STORAGE_PLAN_PROGRESS,
      ]) {
        removeStorageWithLegacy(key, LEGACY_KEYS[key] ?? key);
      }
    } catch (err) {
      console.error('Error resetting data:', err);
    }
  }
}
