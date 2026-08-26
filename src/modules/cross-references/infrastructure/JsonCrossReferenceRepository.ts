import type { ICrossReferenceRepository } from '../domain/ICrossReferenceRepository';
import type { CrossReferenceClause, BookCrossReferencesData } from '../domain/CrossReference';
import { findBookInfo } from '../../bible-reader/domain/entities/BibleBooks';

export class JsonCrossReferenceRepository implements ICrossReferenceRepository {
  private static cache: Map<string, BookCrossReferencesData | null> = new Map();

  private async loadBookData(bookCode: string): Promise<BookCrossReferencesData | null> {
    const cacheKey = bookCode.toUpperCase();
    if (JsonCrossReferenceRepository.cache.has(cacheKey)) {
      return JsonCrossReferenceRepository.cache.get(cacheKey) || null;
    }

    try {
      const url = `/data/cross-references/TSK/${cacheKey}.json`;
      const res = await fetch(url);
      if (!res.ok) {
        JsonCrossReferenceRepository.cache.set(cacheKey, null);
        return null;
      }
      const data: BookCrossReferencesData = await res.json();
      JsonCrossReferenceRepository.cache.set(cacheKey, data);
      return data;
    } catch (err) {
      console.warn(`[JsonCrossReferenceRepository] Error loading TSK for book ${bookCode}:`, err);
      JsonCrossReferenceRepository.cache.set(cacheKey, null);
      return null;
    }
  }

  private resolveBookCode(bookCodeOrName: string): string {
    const info = findBookInfo(bookCodeOrName);
    return info ? info.code : bookCodeOrName.toUpperCase();
  }

  public async getByVerse(
    bookCodeOrName: string,
    chapter: number,
    verse: number
  ): Promise<CrossReferenceClause[]> {
    const code = this.resolveBookCode(bookCodeOrName);
    const data = await this.loadBookData(code);
    if (!data || !data.chapters) return [];

    const chStr = String(chapter);
    const vStr = String(verse);

    const chData = data.chapters[chStr];
    if (!chData) return [];

    return chData[vStr] || [];
  }

  public async getByChapter(
    bookCodeOrName: string,
    chapter: number
  ): Promise<Record<number, CrossReferenceClause[]>> {
    const code = this.resolveBookCode(bookCodeOrName);
    const data = await this.loadBookData(code);
    if (!data || !data.chapters) return {};

    const chStr = String(chapter);
    const chData = data.chapters[chStr];
    if (!chData) return {};

    const result: Record<number, CrossReferenceClause[]> = {};
    for (const [vKey, clauses] of Object.entries(chData)) {
      const vNum = parseInt(vKey, 10);
      if (!isNaN(vNum)) {
        result[vNum] = clauses;
      }
    }
    return result;
  }
}
