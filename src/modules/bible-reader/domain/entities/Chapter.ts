import type { TranslationId } from './Translation';
import type { Verse } from './Verse';

export interface PassageVersionResult {
  translationId: TranslationId;
  translationName: string;
  reference: string;
  book: string;
  chapter: number;
  title?: string;
  verses: Verse[];
}
