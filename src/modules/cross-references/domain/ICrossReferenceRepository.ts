import type { CrossReferenceClause } from './CrossReference';

export interface ICrossReferenceRepository {
  getByVerse(
    bookCodeOrName: string,
    chapter: number,
    verse: number
  ): Promise<CrossReferenceClause[]>;

  getByChapter(
    bookCodeOrName: string,
    chapter: number
  ): Promise<Record<number, CrossReferenceClause[]>>;
}
