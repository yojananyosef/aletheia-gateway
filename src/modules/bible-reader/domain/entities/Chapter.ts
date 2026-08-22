import type { TranslationId } from './Translation';
import type { Verse, Footnote } from './Verse';

export interface SectionFootnote extends Footnote {
  verseNum: number;
  book: string;
  chapter: number;
  anchorId: string;
}

export interface PassageSection {
  reference: string;
  book: string;
  chapter: number;
  fullChapterRef: string;
  isPartial: boolean;
  title?: string;
  verses: Verse[];
  footnotes: SectionFootnote[];
}

export interface PassageVersionResult {
  translationId: TranslationId;
  translationName: string;
  shortName: string;
  reference: string;
  copyright: string;
  sections: PassageSection[];
  // Compatibility fields for single-passage readers or bookmarks
  book: string;
  chapter: number;
  title?: string;
  verses: Verse[];
}
