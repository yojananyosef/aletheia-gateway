import type { PersonalNote, IPersonalNoteRepository } from '../domain/Note';
import { readStorageWithLegacy } from '../../../shared/utils/storage';

export class LocalStorageNoteRepository implements IPersonalNoteRepository {
  private readonly storageKey = 'aletheia_personal_notes_v1';
  // Clave pre-v0.11 ("Alethia"): se lee una vez y se migra a la nueva.
  private readonly legacyStorageKey = 'alethia_personal_notes_v1';

  public async getAll(): Promise<PersonalNote[]> {
    if (typeof window === 'undefined') return [];
    try {
      const data = readStorageWithLegacy(this.storageKey, this.legacyStorageKey);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  public async getByChapter(book: string, chapter: number): Promise<PersonalNote[]> {
    const all = await this.getAll();
    const normalizedBook = book.toLowerCase().trim();
    return all.filter((n) => n.book.toLowerCase().trim() === normalizedBook && n.chapter === chapter);
  }

  public async getByReference(reference: string): Promise<PersonalNote[]> {
    const all = await this.getAll();
    const cleanRef = reference.toLowerCase().trim();
    return all.filter((n) => n.reference.toLowerCase().trim() === cleanRef);
  }

  public async save(
    note: Omit<PersonalNote, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
  ): Promise<PersonalNote> {
    const all = await this.getAll();
    const now = new Date().toISOString();

    if (note.id) {
      const existingIndex = all.findIndex((n) => n.id === note.id);
      if (existingIndex >= 0) {
        const updated: PersonalNote = {
          ...all[existingIndex],
          ...note,
          id: note.id,
          updatedAt: now,
        };
        all[existingIndex] = updated;
        if (typeof window !== 'undefined') {
          localStorage.setItem(this.storageKey, JSON.stringify(all));
        }
        return updated;
      }
    }

    const newNote: PersonalNote = {
      ...note,
      id: crypto.randomUUID ? crypto.randomUUID() : `note_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: now,
      updatedAt: now,
    };

    all.unshift(newNote);
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.storageKey, JSON.stringify(all));
    }
    return newNote;
  }

  public async remove(id: string): Promise<void> {
    const all = await this.getAll();
    const filtered = all.filter((n) => n.id !== id);
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.storageKey, JSON.stringify(filtered));
    }
  }
}
