export type ThemeMode = 'standard' | 'calm' | 'high-contrast' | 'sepia' | 'oled' | 'dark';
export type AppFontFamily = 'inter' | 'lexend' | 'mono' | 'syne' | 'opendyslexic';
export type BionicLevel = 'off' | 'leve' | 'fuerte';

export interface UserSettings {
  theme: ThemeMode;
  fontFamily: AppFontFamily;
  defaultTranslation: string;
  calmMode: boolean;
  bionic?: BionicLevel;
  ruler?: boolean;
  redLetters?: boolean;
}

export interface BackupPayload {
  app: string;
  version: string;
  exportedAt: string;
  data: {
    bookmarks: any[];
    notes: any[];
    highlights: any[];
    lastPassage?: string;
    selectedTranslations?: string[];
    settings?: Partial<UserSettings>;
  };
}

export interface ImportResult {
  success: boolean;
  message: string;
  bookmarksCount: number;
  notesCount: number;
  highlightsCount: number;
}
