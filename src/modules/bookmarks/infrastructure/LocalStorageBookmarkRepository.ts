import type { Bookmark, IBookmarkRepository } from '../domain/Bookmark';

/** Clave canónica: la usa el backup/reset de settings (no duplicar el literal). */
export const BOOKMARKS_STORAGE_KEY = 'bible_reading_bookmarks_v1';
/** Claves huérfanas: el backup pre-v0.11.2 leía/escribía estas sin que ningún repo las usara. */
export const BOOKMARKS_LEGACY_KEYS = ['alethia_bookmarks_v1', 'aletheia_bookmarks_v1'];

export class LocalStorageBookmarkRepository implements IBookmarkRepository {
  private readonly storageKey = BOOKMARKS_STORAGE_KEY;

  public async getAll(): Promise<Bookmark[]> {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return parsed.map((item: any) => ({
        ...item,
        createdAt: new Date(item.createdAt),
      }));
    } catch {
      return [];
    }
  }

  public async save(bookmark: Omit<Bookmark, 'id' | 'createdAt'>): Promise<Bookmark> {
    const all = await this.getAll();
    const existingIndex = all.findIndex((b) => b.reference === bookmark.reference);

    const newBookmark: Bookmark = {
      ...bookmark,
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      createdAt: new Date(),
    };

    if (existingIndex >= 0) {
      all[existingIndex] = newBookmark;
    } else {
      all.unshift(newBookmark);
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(this.storageKey, JSON.stringify(all));
    }
    return newBookmark;
  }

  public async remove(idOrRef: string): Promise<void> {
    const all = await this.getAll();
    const filtered = all.filter((b) => b.id !== idOrRef && b.reference !== idOrRef);
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.storageKey, JSON.stringify(filtered));
    }
  }

  public async isBookmarked(reference: string): Promise<boolean> {
    const all = await this.getAll();
    return all.some((b) => b.reference === reference);
  }
}
