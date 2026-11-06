import type { IInterlinearRepository, InterlinearChapterData } from '../domain/IInterlinearRepository';
import type { InterlinearTestament, InterlinearVerse, InterlinearWord } from '../domain/InterlinearVerse';
import type { InterlinearBookOutline } from '../domain/navigation';
import { findBookInfo } from '../../bible-reader/domain/entities/BibleBooks';
import { cacheBust } from '../../../shared/utils/cacheBust';
import { FetchCache } from '../../../shared/utils/fetchCache';

interface RawWord {
  hebrew?: string;
  hebrew_aramaic?: string;
  greek?: string;
  parsing?: string;
  strong?: string | number;
  spanish?: string;
  lemma?: string;
  parsingCode?: string;
}

interface RawVerse {
  chapter?: number;
  verse?: number;
  words?: RawWord[];
}

interface LoadedBook {
  testament: InterlinearTestament;
  verses: InterlinearVerse[];
}

/**
 * Caché transversal con deduplicación (single-flight): si getChapter() y
 * getBookOutline() se llaman en paralelo para el mismo libro, solo se hace un
 * fetch HTTP y ambos comparten la misma promise.
 */
const interlinearBookCache = new FetchCache<LoadedBook>({ ttlMs: 0 });

export class JsonInterlinearRepository implements IInterlinearRepository {
  private async loadBook(bookCode: string): Promise<LoadedBook | null> {
    const info = findBookInfo(bookCode);
    if (!info) return null;
    const code = info.code;
    const testament: InterlinearTestament = info.testament === 'NT' ? 'greek' : 'hebrew';

    return interlinearBookCache.get(
      code,
      async (): Promise<LoadedBook> => {
        const url = cacheBust(`/data/interlinear/${testament}/${encodeURIComponent(code)}.json`);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const raw = (await response.json()) as RawVerse[];
        const verses: InterlinearVerse[] = (Array.isArray(raw) ? raw : [])
          .map((entry) => ({
            chapter: Number(entry.chapter),
            verse: Number(entry.verse),
            words: (entry.words || []).map((w): InterlinearWord => ({
              text: w.hebrew || w.hebrew_aramaic || w.greek || '',
              parsing: w.parsing || '',
              strong: String(w.strong ?? ''),
              spanish: w.spanish || '',
              lemma: w.lemma || undefined,
              parsingCode: w.parsingCode || undefined,
            })),
          }))
          .filter((v) => Number.isInteger(v.chapter) && Number.isInteger(v.verse));
        return { testament, verses };
      },
    ).catch((error) => {
      console.warn(`[JsonInterlinearRepository] Error cargando ${testament}/${code}:`, error);
      return null;
    });
  }

  public async getChapter(bookCodeOrName: string, chapter: number): Promise<InterlinearChapterData | null> {
    const info = findBookInfo(bookCodeOrName);
    if (!info) return null;
    const loaded = await this.loadBook(info.code);
    if (!loaded) return null;

    const chapterNumbers = [...new Set(loaded.verses.map((v) => v.chapter))].sort((a, b) => a - b);
    const chapterVerses = loaded.verses.filter((v) => v.chapter === chapter).sort((a, b) => a.verse - b.verse);

    return {
      testament: loaded.testament,
      bookCode: info.code,
      verses: chapterVerses,
      chapterNumbers,
      versesOfChapter: (ch: number) => loaded.verses.filter((v) => v.chapter === ch).map((v) => v.verse),
    };
  }

  /**
   * Capítulos con datos y primer/último versículo de cada uno. Permite navegar
   * hasta el final de un libro (o al siguiente) sin adivinar el versículo destino.
   */
  public async getBookOutline(bookCodeOrName: string): Promise<InterlinearBookOutline | null> {
    const info = findBookInfo(bookCodeOrName);
    if (!info) return null;
    const loaded = await this.loadBook(info.code);
    if (!loaded || loaded.verses.length === 0) return null;

    const byChapter = new Map<number, number[]>();
    for (const v of loaded.verses) {
      const list = byChapter.get(v.chapter);
      if (list) list.push(v.verse);
      else byChapter.set(v.chapter, [v.verse]);
    }
    const versesOf = (chapter: number) => (byChapter.get(chapter) ?? []).slice().sort((a, b) => a - b);

    return {
      chapters: [...byChapter.keys()].sort((a, b) => a - b),
      firstVerse: (chapter) => versesOf(chapter)[0] ?? 1,
      lastVerse: (chapter) => {
        const list = versesOf(chapter);
        return list[list.length - 1] ?? 1;
      },
    };
  }
}
