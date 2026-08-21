export interface Bookmark {
  id: string;
  reference: string;
  book: string;
  chapter: number;
  translationId: string;
  previewText: string;
  createdAt: Date;
}

export interface IBookmarkRepository {
  getAll(): Promise<Bookmark[]>;
  save(bookmark: Omit<Bookmark, 'id' | 'createdAt'>): Promise<Bookmark>;
  remove(id: string): Promise<void>;
  isBookmarked(reference: string): Promise<boolean>;
}
