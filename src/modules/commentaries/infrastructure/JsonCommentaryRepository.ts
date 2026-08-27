import type { ICommentaryRepository } from '../domain/ICommentaryRepository';
import type {
  CommentaryBookData,
  CommentaryIndex,
  CommentarySource,
} from '../domain/Commentary';
import { findBookInfo } from '../../bible-reader/domain/entities/BibleBooks';

export class JsonCommentaryRepository implements ICommentaryRepository {
  private static indexPromise: Promise<CommentarySource[]> | null = null;
  private static bookCache: Map<string, CommentaryBookData | null> = new Map();

  private async loadIndex(): Promise<CommentarySource[]> {
    if (JsonCommentaryRepository.indexPromise) {
      return JsonCommentaryRepository.indexPromise;
    }

    JsonCommentaryRepository.indexPromise = fetch('/data/commentaries/index.json')
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const index = (await response.json()) as CommentaryIndex;
        return Array.isArray(index.sources) ? index.sources : [];
      })
      .catch((error) => {
        console.warn('[JsonCommentaryRepository] No se pudo cargar el índice:', error);
        JsonCommentaryRepository.indexPromise = null;
        return [];
      });

    return JsonCommentaryRepository.indexPromise;
  }

  public async getSources(): Promise<CommentarySource[]> {
    return this.loadIndex();
  }

  private resolveBookCode(bookCodeOrName: string): string {
    const info = findBookInfo(bookCodeOrName);
    return info ? info.code : bookCodeOrName.toUpperCase();
  }

  private async loadBookData(
    sourceId: string,
    bookCodeOrName: string
  ): Promise<CommentaryBookData | null> {
    const source = (await this.loadIndex()).find((item) => item.id === sourceId);
    const bookCode = this.resolveBookCode(bookCodeOrName);
    if (!source || !source.bookCodes.includes(bookCode)) return null;

    const cacheKey = `${sourceId}:${bookCode}`;
    if (JsonCommentaryRepository.bookCache.has(cacheKey)) {
      return JsonCommentaryRepository.bookCache.get(cacheKey) || null;
    }

    try {
      const url = `/data/commentaries/${encodeURIComponent(sourceId)}/${encodeURIComponent(bookCode)}.json`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = (await response.json()) as CommentaryBookData;
      JsonCommentaryRepository.bookCache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.warn(
        `[JsonCommentaryRepository] Error cargando ${sourceId}/${bookCode}:`,
        error
      );
      JsonCommentaryRepository.bookCache.set(cacheKey, null);
      return null;
    }
  }

  public async getByVerse(
    sourceId: string,
    bookCodeOrName: string,
    chapter: number,
    verse: number
  ): Promise<string | null> {
    const data = await this.loadBookData(sourceId, bookCodeOrName);
    return data?.chapters?.[String(chapter)]?.[String(verse)] || null;
  }

  public async getByChapter(
    sourceId: string,
    bookCodeOrName: string,
    chapter: number
  ): Promise<Record<number, string>> {
    const data = await this.loadBookData(sourceId, bookCodeOrName);
    const chapterData = data?.chapters?.[String(chapter)];
    if (!chapterData) return {};

    return Object.fromEntries(
      Object.entries(chapterData)
        .map(([verse, text]) => [Number(verse), text] as const)
        .filter(([verse, text]) => Number.isInteger(verse) && Boolean(text))
    );
  }
}
