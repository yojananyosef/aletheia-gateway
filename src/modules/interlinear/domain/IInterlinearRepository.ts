import type { InterlinearTestament, InterlinearVerse } from './InterlinearVerse';
import type { InterlinearBookOutline } from './navigation';

export interface InterlinearChapterData {
  testament: InterlinearTestament;
  bookCode: string;
  verses: InterlinearVerse[];
  chapterNumbers: number[];
  versesOfChapter: (chapter: number) => number[];
}

export interface IInterlinearRepository {
  getChapter(bookCodeOrName: string, chapter: number): Promise<InterlinearChapterData | null>;
  getBookOutline(bookCodeOrName: string): Promise<InterlinearBookOutline | null>;
}
