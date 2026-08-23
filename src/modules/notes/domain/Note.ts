export interface PersonalNote {
  id: string;
  reference: string;      // e.g. "Génesis 1:1"
  book: string;           // "Génesis"
  chapter: number;        // 1
  verseNumber?: number;   // 1 (optional, if tied to specific verse)
  translationId?: string; // 'RV1909'
  selectedText?: string;  // Quoted biblical text snippet
  content: string;        // The user's personal reflection or note
  createdAt: string;      // ISO string
  updatedAt: string;      // ISO string
}

export interface IPersonalNoteRepository {
  getAll(): Promise<PersonalNote[]>;
  getByChapter(book: string, chapter: number): Promise<PersonalNote[]>;
  getByReference(reference: string): Promise<PersonalNote[]>;
  save(note: Omit<PersonalNote, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<PersonalNote>;
  remove(id: string): Promise<void>;
}
