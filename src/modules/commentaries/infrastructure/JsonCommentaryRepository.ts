import type { ICommentaryRepository } from '../domain/ICommentaryRepository';
import type { CommentaryBookData, CommentaryEntry, CommentaryIndex, CommentarySource } from '../domain/Commentary';
import { findBookInfo } from '../../bible-reader/domain/entities/BibleBooks';
import { cacheBust } from '../../../shared/utils/cacheBust';
import { FetchCache, cachedFetchJson } from '../../../shared/utils/fetchCache';

/**
 * Caché transversal con deduplicación para el índice de fuentes y para cada
 * libro de comentarios. Evita fetches duplicados cuando el drawer se abre y
 * cierra varias veces, o cuando se navega entre capítulos.
 */
const commentaryIndexCache = new FetchCache<CommentarySource[]>({ ttlMs: 0 });
const commentaryBookCache = new FetchCache<CommentaryBookData>({ ttlMs: 0 });

export class JsonCommentaryRepository implements ICommentaryRepository {
  private async loadIndex(): Promise<CommentarySource[]> {
    return commentaryIndexCache.get(
      'commentary:index',
      async () => {
        const response = await fetch(cacheBust('/data/commentaries/index.json'));
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const index = (await response.json()) as CommentaryIndex;
        return Array.isArray(index.sources) ? index.sources : [];
      },
    ).catch((error) => {
      console.warn('[JsonCommentaryRepository] No se pudo cargar el índice:', error);
      return [];
    });
  }

  public async getSources(): Promise<CommentarySource[]> {
    return this.loadIndex();
  }

  private resolveBookCode(bookCodeOrName: string): string {
    const info = findBookInfo(bookCodeOrName);
    return info ? info.code : bookCodeOrName.toUpperCase();
  }

  private async loadBookData(sourceId: string, bookCodeOrName: string): Promise<CommentaryBookData | null> {
    const source = (await this.loadIndex()).find((item) => item.id === sourceId);
    const bookCode = this.resolveBookCode(bookCodeOrName);
    if (!source || !source.bookCodes.includes(bookCode)) return null;

    const cacheKey = `${sourceId}:${bookCode}`;

    return commentaryBookCache.get(
      cacheKey,
      async () => {
        const url = cacheBust(`/data/commentaries/${encodeURIComponent(sourceId)}/${encodeURIComponent(bookCode)}.json`);
        return cachedFetchJson<CommentaryBookData>(url);
      },
    ).catch((error) => {
      console.warn(`[JsonCommentaryRepository] Error cargando ${sourceId}/${bookCode}:`, error);
      return null;
    });
  }

  public async getByVerse(
    sourceId: string,
    bookCodeOrName: string,
    chapter: number,
    verse: number,
  ): Promise<string | null> {
    const data = await this.loadBookData(sourceId, bookCodeOrName);
    const chapterData = data?.chapters?.[String(chapter)];
    return (
      chapterData?.verseComments?.[String(verse)] ||
      chapterData?.chapterComments?.[0] ||
      data?.bookComments?.[0] ||
      null
    );
  }

  public async getByChapter(sourceId: string, bookCodeOrName: string, chapter: number): Promise<CommentaryEntry[]> {
    const data = await this.loadBookData(sourceId, bookCodeOrName);
    if (!data) return [];
    const chapterData = data?.chapters?.[String(chapter)];

    // Introducción del libro: UNA sola entrada combinada y solo en el capítulo 1.
    // (Antes: un card "Libro" por párrafo en TODOS los capítulos.)
    const introParagraphs = (data.bookComments || []).filter((text) => Boolean(text));
    const bookEntries: CommentaryEntry[] =
      chapter === 1 && introParagraphs.length > 0 ? [{ text: introParagraphs.join('\n\n'), scope: 'book' }] : [];
    if (!chapterData) return bookEntries;
    const chapterEntries: CommentaryEntry[] = (chapterData.chapterComments || []).map((text) => ({
      text,
      scope: 'chapter',
    }));
    const verseEntries: CommentaryEntry[] = Object.entries(chapterData.verseComments || {})
      .map(([verse, text]) => ({
        text,
        scope: 'verse' as const,
        verse: Number(verse),
      }))
      .filter(({ text, verse }) => Boolean(text) && Number.isInteger(verse))
      .sort((a, b) => (a.verse || 0) - (b.verse || 0));

    return [...bookEntries, ...chapterEntries, ...verseEntries];
  }
}
