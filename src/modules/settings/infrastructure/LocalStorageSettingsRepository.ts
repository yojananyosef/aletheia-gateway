import type { UserSettings, BackupPayload, ImportResult } from '../domain/UserSettings';
import { readStorageWithLegacy, removeStorageWithLegacy } from '../../../shared/utils/storage';

const STORAGE_SETTINGS = 'aletheia_user_settings';
const STORAGE_BOOKMARKS = 'aletheia_bookmarks_v1';
const STORAGE_NOTES = 'aletheia_notes_v1';
const STORAGE_HIGHLIGHTS = 'aletheia_bible_highlights_v1';
const STORAGE_LAST_PASSAGE = 'aletheia_last_passage';
const STORAGE_TRANSLATIONS = 'aletheia_selected_translations';
const STORAGE_CALM_MODE = 'aletheia_calm_mode';

// Claves pre-v0.11 ("Alethia"): lectura con fallback y migración perezosa.
const LEGACY_KEYS: Record<string, string> = {
  [STORAGE_SETTINGS]: 'alethia_user_settings',
  [STORAGE_BOOKMARKS]: 'alethia_bookmarks_v1',
  [STORAGE_NOTES]: 'alethia_notes_v1',
  [STORAGE_HIGHLIGHTS]: 'alethia_bible_highlights_v1',
  [STORAGE_LAST_PASSAGE]: 'alethia_last_passage',
  [STORAGE_TRANSLATIONS]: 'alethia_selected_translations',
  [STORAGE_CALM_MODE]: 'alethia_calm_mode',
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

      const { bookmarks = [], notes = [], highlights = [], lastPassage, selectedTranslations, settings } = parsed.data;

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
      ]) {
        removeStorageWithLegacy(key, LEGACY_KEYS[key] ?? key);
      }
    } catch (err) {
      console.error('Error resetting data:', err);
    }
  }
}
