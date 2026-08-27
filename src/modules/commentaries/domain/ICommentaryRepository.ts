import type { CommentaryEntry, CommentarySource } from './Commentary';

export interface ICommentaryRepository {
  getSources(): Promise<CommentarySource[]>;

  getByVerse(
    sourceId: string,
    bookCodeOrName: string,
    chapter: number,
    verse: number
  ): Promise<string | null>;

  getByChapter(
    sourceId: string,
    bookCodeOrName: string,
    chapter: number
  ): Promise<CommentaryEntry[]>;
}
