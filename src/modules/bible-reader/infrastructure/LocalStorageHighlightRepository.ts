import type { BibleHighlight, IBibleHighlightRepository } from '../domain/entities/BibleHighlight';
import { readStorageWithLegacy } from '../../../shared/utils/storage';

/** Clave canónica: la usa el backup/reset de settings (no duplicar el literal). */
export const HIGHLIGHTS_STORAGE_KEY = 'aletheia_bible_highlights_v1';
/** Clave pre-v0.11 ("Alethia"). */
export const HIGHLIGHTS_LEGACY_KEYS = ['alethia_bible_highlights_v1'];

export class LocalStorageHighlightRepository implements IBibleHighlightRepository {
  private readonly storageKey = HIGHLIGHTS_STORAGE_KEY;

  public async getAll(): Promise<BibleHighlight[]> {
    if (typeof window === 'undefined') return [];
    try {
      const data = readStorageWithLegacy(this.storageKey, HIGHLIGHTS_LEGACY_KEYS);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  public async getByChapter(book: string, chapter: number): Promise<BibleHighlight[]> {
    const all = await this.getAll();
    const normalizedBook = book.toLowerCase().trim();
    return all.filter((h) => h.book.toLowerCase().trim() === normalizedBook && h.chapter === chapter);
  }

  public async save(highlight: Omit<BibleHighlight, 'id' | 'createdAt'>): Promise<BibleHighlight> {
    const all = await this.getAll();
    const cleanText = highlight.text.trim();
    if (!cleanText) {
      throw new Error('Highlight text cannot be empty');
    }

    // Check if an identical highlight exists for this verse to avoid duplicates or update color
    const existingIndex = all.findIndex(
      (h) =>
        h.book.toLowerCase().trim() === highlight.book.toLowerCase().trim() &&
        h.chapter === highlight.chapter &&
        h.verseNumber === highlight.verseNumber &&
        h.text.trim() === cleanText,
    );

    const newHighlight: BibleHighlight = {
      ...highlight,
      text: cleanText,
      id:
        existingIndex >= 0
          ? all[existingIndex].id
          : crypto.randomUUID
            ? crypto.randomUUID()
            : `hl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: existingIndex >= 0 ? all[existingIndex].createdAt : new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      all[existingIndex] = newHighlight;
    } else {
      all.unshift(newHighlight);
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(this.storageKey, JSON.stringify(all));
    }

    return newHighlight;
  }

  public async remove(id: string): Promise<void> {
    const all = await this.getAll();
    const filtered = all.filter((h) => h.id !== id);
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.storageKey, JSON.stringify(filtered));
    }
  }

  public async removeByText(text: string, book: string, chapter: number): Promise<void> {
    const all = await this.getAll();
    const cleanText = text.trim().toLowerCase();
    const normalizedBook = book.toLowerCase().trim();
    const filtered = all.filter((h) => {
      const matchBook = h.book.toLowerCase().trim() === normalizedBook;
      const matchChapter = h.chapter === chapter;
      const matchText =
        h.text.trim().toLowerCase() === cleanText ||
        cleanText.includes(h.text.trim().toLowerCase()) ||
        h.text.trim().toLowerCase().includes(cleanText);
      return !(matchBook && matchChapter && matchText);
    });

    if (typeof window !== 'undefined') {
      localStorage.setItem(this.storageKey, JSON.stringify(filtered));
    }
  }
}
