import type { IBibleRepository } from '../domain/repositories/IBibleRepository';
import { AVAILABLE_TRANSLATIONS, type TranslationId, type TranslationInfo } from '../domain/entities/Translation';
import type { PassageVersionResult, PassageSection, SectionFootnote } from '../domain/entities/Chapter';
import type { Verse } from '../domain/entities/Verse';
import { PassageReference } from '../domain/value-objects/PassageReference';
import { findBookInfo, ALL_BIBLE_BOOKS } from '../domain/entities/BibleBooks';

interface BookJsonData {
  versionId: string;
  bookCode: string;
  bookName: string;
  testament: 'AT' | 'NT';
  chapters: Record<number, { chapter: number; verses: Verse[] }>;
}

export class JsonBibleRepository implements IBibleRepository {
  private static cache: Map<string, BookJsonData> = new Map();

  public getAvailableTranslations(): TranslationInfo[] {
    return Object.values(AVAILABLE_TRANSLATIONS);
  }

  public async getPassage(referenceStr: string, translationId: TranslationId): Promise<PassageVersionResult | null> {
    const ref = new PassageReference(referenceStr);
    const translation = AVAILABLE_TRANSLATIONS[translationId] || AVAILABLE_TRANSLATIONS.RV1909;

    const sections: PassageSection[] = [];

    for (const segment of ref.segments) {
      const bookInfo = findBookInfo(segment.bookCode) || findBookInfo(segment.book) || ALL_BIBLE_BOOKS[0];
      const bookCode = bookInfo.code;
      const bookData = await this.loadBookData(translationId, bookCode);

      if (!bookData) {
        sections.push({
          reference: segment.fullFormatted,
          book: bookInfo.name,
          chapter: segment.chapter,
          fullChapterRef: segment.fullChapterRef,
          isPartial: segment.isPartial,
          title: `${bookInfo.name} ${segment.chapter}`,
          verses: [
            {
              number: segment.startVerse || 1,
              text: `No se encontró el texto de ${segment.fullFormatted} en ${translation.name}.`,
            },
          ],
          footnotes: [],
        });
        continue;
      }

      const chapterData = bookData.chapters[segment.chapter] || bookData.chapters[1];
      if (!chapterData || !chapterData.verses || chapterData.verses.length === 0) {
        sections.push({
          reference: segment.fullFormatted,
          book: bookInfo.name,
          chapter: segment.chapter,
          fullChapterRef: segment.fullChapterRef,
          isPartial: segment.isPartial,
          title: `${bookInfo.name} ${segment.chapter}`,
          verses: [
            {
              number: segment.startVerse || 1,
              text: `El capítulo ${segment.chapter} no está disponible en ${translation.name}.`,
            },
          ],
          footnotes: [],
        });
        continue;
      }

      let filteredVerses: Verse[] = chapterData.verses;

      // Filter exact verse numbers if specified
      if (segment.verseNumbers && segment.verseNumbers.length > 0) {
        const verseSet = new Set(segment.verseNumbers);
        filteredVerses = chapterData.verses.filter((v) => {
          if (verseSet.has(v.number)) return true;
          const end = v.endNumber || v.number;
          for (const num of segment.verseNumbers!) {
            if (num >= v.number && num <= end) return true;
          }
          return false;
        });
        if (filteredVerses.length === 0) {
          // Si se pidió verso específico y no existe (ej. Platense 2Co 13:14 → solo 13 versos),
          // no devolver capítulo completo; dejar vacío para que DailyVerseCard haga fallback a VBL/BES
          if (!segment.isPartial) {
            filteredVerses = chapterData.verses;
          }
        }

        // Versificación RV1909/Platense: 18 versículos vacíos o faltantes (ej. 2Co 13:14). Si el único verso pedido
        // está vacío, buscar hacia atrás el último verso no vacío del mismo capítulo para no mostrar ""
        const allEmpty = filteredVerses.length > 0 && filteredVerses.every((v) => !v.text || !v.text.trim());
        if (allEmpty && filteredVerses.length === 1) {
          const requestedNum = segment.verseNumbers![0];
          // buscar hacia atrás en el capítulo
          for (let n = requestedNum - 1; n >= 1; n--) {
            const candidate = chapterData.verses.find((cv) => cv.number === n || (n >= cv.number && n <= (cv.endNumber || cv.number)));
            if (candidate && candidate.text && candidate.text.trim()) {
              filteredVerses = [candidate];
              break;
            }
          }
          // si aún vacío, dejar que DailyVerseCard haga fallback a otra traducción
        }
      }

      // Map verses and attach exact anchorIds to footnotes
      const mappedVerses: Verse[] = filteredVerses.map((v) => {
        if (!v.footnotes || v.footnotes.length === 0) return v;
        return {
          ...v,
          footnotes: v.footnotes.map((fn) => ({
            ...fn,
            anchorId: `fn-${translationId}-${bookCode}-${segment.chapter}-${v.number}-${fn.id}`,
          })),
        };
      });

      // Collect section footnotes with matching anchor IDs
      const sectionFootnotes: SectionFootnote[] = [];
      for (const v of mappedVerses) {
        if (v.footnotes && v.footnotes.length > 0) {
          for (const fn of v.footnotes) {
            sectionFootnotes.push({
              id: fn.id,
              caller: fn.caller,
              text: fn.text,
              verseNum: v.number,
              book: bookInfo.name,
              chapter: segment.chapter,
              anchorId: fn.anchorId || `fn-${translationId}-${bookCode}-${segment.chapter}-${v.number}-${fn.id}`,
            });
          }
        }
      }

      const firstVerseHeadings = mappedVerses[0]?.headings;
      const title = firstVerseHeadings && firstVerseHeadings.length > 0
        ? firstVerseHeadings[0]
        : `${bookInfo.name} ${segment.chapter}`;

      sections.push({
        reference: segment.fullFormatted,
        book: bookInfo.name,
        chapter: segment.chapter,
        fullChapterRef: segment.fullChapterRef,
        isPartial: segment.isPartial,
        title,
        verses: mappedVerses,
        footnotes: sectionFootnotes,
      });
    }

    const firstSection = sections[0] || {
      reference: 'Génesis 1:1',
      book: 'Génesis',
      chapter: 1,
      fullChapterRef: 'Génesis 1',
      isPartial: true,
      title: 'Génesis 1',
      verses: [],
      footnotes: [],
    };

    return {
      translationId,
      translationName: translation.name,
      shortName: translation.shortName,
      reference: ref.fullFormatted,
      copyright: translation.copyright || 'Dominio Público',
      sections,
      book: firstSection.book,
      chapter: firstSection.chapter,
      title: firstSection.title,
      verses: firstSection.verses,
    };
  }

  public async getPassageComparison(referenceStr: string, translationIds: TranslationId[]): Promise<PassageVersionResult[]> {
    const promises = translationIds.map((tid) => this.getPassage(referenceStr, tid));
    const results = await Promise.all(promises);
    return results.filter((r): r is PassageVersionResult => r !== null);
  }

  public async searchSuggestions(query: string): Promise<string[]> {
    const norm = (s: string) =>
      s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '');
    const search = norm(query);

    if (!search) {
      return [
        'Génesis 1:1',
        'Genesis 1:1; Génesis 2:1-2; Gen 3:1,6; 5',
        'Salmos 42:8',
        'Juan 3:16; 14:6',
        'Salmos 23',
        'Romanos 8:28',
      ];
    }

    const matches: string[] = [];

    for (const book of ALL_BIBLE_BOOKS) {
      if (norm(book.name).includes(search) || book.aliases.some((a) => norm(a).includes(search))) {
        matches.push(`${book.name} 1`);
      }
    }

    if (matches.length > 0) {
      return matches.slice(0, 8);
    }

    return ['Génesis 1:1', 'Salmos 42:8', 'Juan 3:16', 'Salmos 23', 'Proverbios 3:5'];
  }

  private async loadBookData(translationId: TranslationId, bookCode: string): Promise<BookJsonData | null> {
    const cacheKey = `${translationId}_${bookCode}`;
    if (JsonBibleRepository.cache.has(cacheKey)) {
      return JsonBibleRepository.cache.get(cacheKey)!;
    }

    try {
      if (typeof fetch !== 'undefined') {
        const res = await fetch(`/data/bibles/${translationId}/${bookCode}.json`);
        if (res.ok) {
          const data = (await res.json()) as BookJsonData;
          JsonBibleRepository.cache.set(cacheKey, data);
          return data;
        }
        console.warn(`Could not fetch /data/bibles/${translationId}/${bookCode}.json: ${res.statusText}`);
        return null;
      }
    } catch (err) {
      console.error(`Error loading bible data for ${translationId}/${bookCode}:`, err);
    }

    return null;
  }
}
