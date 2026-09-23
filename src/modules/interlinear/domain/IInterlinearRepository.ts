import type { InterlinearTestament, InterlinearVerse } from './InterlinearVerse';

export interface InterlinearChapterData {
  testament: InterlinearTestament;
  bookCode: string;
  verses: InterlinearVerse[];
  chapterNumbers: number[];
  versesOfChapter: (chapter: number) => number[];
}

export interface IInterlinearRepository {
  getChapter(bookCodeOrName: string, chapter: number): Promise<InterlinearChapterData | null>;
}
