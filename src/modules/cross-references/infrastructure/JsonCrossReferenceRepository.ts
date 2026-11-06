import type { ICrossReferenceRepository } from '../domain/ICrossReferenceRepository';
import type { CrossReferenceClause, BookCrossReferencesData } from '../domain/CrossReference';
import { findBookInfo } from '../../bible-reader/domain/entities/BibleBooks';
import { cacheBust } from '../../../shared/utils/cacheBust';
import { FetchCache, cachedFetchJson } from '../../../shared/utils/fetchCache';

/**
 * Caché transversal con deduplicación para los datos TSK de cada libro.
 * Evita fetches duplicados al abrir el drawer de referencias y al navegar
 * entre versículos del mismo capítulo.
 */
const crossRefBookCache = new FetchCache<BookCrossReferencesData>({ ttlMs: 0 });

export class JsonCrossReferenceRepository implements ICrossReferenceRepository {
  private async loadBookData(bookCode: string): Promise<BookCrossReferencesData | null> {
    return crossRefBookCache.get(
      bookCode.toUpperCase(),
      async () => {
        const url = cacheBust(`/data/cross-references/TSK/${bookCode.toUpperCase()}.json`);
        return cachedFetchJson<BookCrossReferencesData>(url);
      },
    ).catch((error) => {
      console.warn(`[JsonCrossReferenceRepository] Error loading TSK for book ${bookCode}:`, error);
      return null;
    });
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
