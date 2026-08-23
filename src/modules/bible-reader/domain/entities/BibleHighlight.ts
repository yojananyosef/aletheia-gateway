export type HighlightColor = 'yellow' | 'coral' | 'blue' | 'green';

export interface BibleHighlight {
  id: string;
  reference: string;      // e.g. "Génesis 1:1"
  book: string;           // "Génesis"
  chapter: number;        // 1
  verseNumber: number;    // 1
  translationId?: string; // Optional: translation specific or universal
  text: string;           // The exact highlighted text snippet
  color: HighlightColor;
  createdAt: string;      // ISO string
}

export interface IBibleHighlightRepository {
  getAll(): Promise<BibleHighlight[]>;
  getByChapter(book: string, chapter: number): Promise<BibleHighlight[]>;
  save(highlight: Omit<BibleHighlight, 'id' | 'createdAt'>): Promise<BibleHighlight>;
  remove(id: string): Promise<void>;
  removeByText(text: string, book: string, chapter: number): Promise<void>;
}
