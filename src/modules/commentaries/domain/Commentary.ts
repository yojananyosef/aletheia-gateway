export interface CommentarySource {
  id: string;
  moduleId: string;
  title: string;
  author: string;
  description: string;
  language: string;
  sourceType: string;
  license: string;
  textSource: string;
  totalEntries: number;
  totalBooks: number;
  bookCodes: string[];
}

export type CommentaryScope = 'book' | 'chapter' | 'verse';

export interface CommentaryEntry {
  text: string;
  scope: CommentaryScope;
  verse?: number;
}

export interface CommentaryChapterData {
  chapterComments: string[];
  verseComments: Record<string, string>;
}

export interface CommentaryBookData extends CommentarySource {
  bookCode: string;
  bookName: string;
  bookComments: string[];
  chapters: Record<string, CommentaryChapterData>;
}

export interface CommentaryIndex {
  version: number;
  sources: CommentarySource[];
}
