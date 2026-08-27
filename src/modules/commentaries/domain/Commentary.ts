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

export interface CommentaryBookData extends CommentarySource {
  bookCode: string;
  bookName: string;
  chapters: Record<string, Record<string, string>>;
}

export interface CommentaryIndex {
  version: number;
  sources: CommentarySource[];
}
