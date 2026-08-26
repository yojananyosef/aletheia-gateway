import type { UserSettings, BackupPayload, ImportResult } from '../domain/UserSettings';

const STORAGE_SETTINGS = 'alethia_user_settings';
const STORAGE_BOOKMARKS = 'alethia_bookmarks_v1';
const STORAGE_NOTES = 'alethia_notes_v1';
const STORAGE_HIGHLIGHTS = 'alethia_bible_highlights_v1';
const STORAGE_LAST_PASSAGE = 'alethia_last_passage';
const STORAGE_TRANSLATIONS = 'alethia_selected_translations';
const STORAGE_CALM_MODE = 'alethia_calm_mode';

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
      const raw = localStorage.getItem(STORAGE_SETTINGS);
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

    const bookmarks = JSON.parse(localStorage.getItem(STORAGE_BOOKMARKS) || '[]');
    const notes = JSON.parse(localStorage.getItem(STORAGE_NOTES) || '[]');
    const highlights = JSON.parse(localStorage.getItem(STORAGE_HIGHLIGHTS) || '[]');
    const lastPassage = localStorage.getItem(STORAGE_LAST_PASSAGE) || 'Génesis 1:1';
    const selectedTranslations = JSON.parse(localStorage.getItem(STORAGE_TRANSLATIONS) || '["RV1909"]');
    const settings = this.getSettings();

    const payload: BackupPayload = {
      app: 'AlethiaGateway',
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

  public async importBackup(jsonString: string): Promise<ImportResult> {
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

      // Merge or overwrite with validation
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

      return {
        success: true,
        message: 'Respaldo restaurado exitosamente',
        bookmarksCount: Array.isArray(bookmarks) ? bookmarks.length : 0,
        notesCount: Array.isArray(notes) ? notes.length : 0,
        highlightsCount: Array.isArray(highlights) ? highlights.length : 0,
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
      localStorage.removeItem(STORAGE_BOOKMARKS);
      localStorage.removeItem(STORAGE_NOTES);
      localStorage.removeItem(STORAGE_HIGHLIGHTS);
      localStorage.removeItem(STORAGE_LAST_PASSAGE);
      localStorage.removeItem(STORAGE_TRANSLATIONS);
      localStorage.removeItem(STORAGE_SETTINGS);
      localStorage.removeItem(STORAGE_CALM_MODE);
    } catch (err) {
      console.error('Error resetting data:', err);
    }
  }
}
