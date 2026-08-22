import type { IBibleRepository } from '../domain/repositories/IBibleRepository';
import { AVAILABLE_TRANSLATIONS, type TranslationId, type TranslationInfo } from '../domain/entities/Translation';
import type { PassageVersionResult } from '../domain/entities/Chapter';
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
    const bookInfo = findBookInfo(ref.book) || ALL_BIBLE_BOOKS[0];
    const bookCode = bookInfo.code;
    const translation = AVAILABLE_TRANSLATIONS[translationId] || AVAILABLE_TRANSLATIONS.RV1909;

    const bookData = await this.loadBookData(translationId, bookCode);
    if (!bookData) {
      return {
        translationId,
        translationName: translation.name,
        reference: ref.fullFormatted,
        book: bookInfo.name,
        chapter: ref.chapter,
        title: `${bookInfo.name} ${ref.chapter}`,
        verses: [
          {
            number: ref.startVerse || 1,
            text: `No se encontró el texto de ${ref.fullFormatted} en ${translation.name}.`,
          },
        ],
      };
    }

    const chapterData = bookData.chapters[ref.chapter] || bookData.chapters[1];
    if (!chapterData || !chapterData.verses || chapterData.verses.length === 0) {
      return {
        translationId,
        translationName: translation.name,
        reference: ref.fullFormatted,
        book: bookInfo.name,
        chapter: ref.chapter,
        title: `${bookInfo.name} ${ref.chapter}`,
        verses: [
          {
            number: ref.startVerse || 1,
            text: `El capítulo ${ref.chapter} no está disponible en ${translation.name}.`,
          },
        ],
      };
    }

    let filteredVerses: Verse[] = chapterData.verses;

    // If query specified a single verse or verse range
    if (ref.startVerse !== undefined) {
      if (ref.endVerse !== undefined) {
        filteredVerses = chapterData.verses.filter(
          (v) => v.number >= ref.startVerse! && v.number <= ref.endVerse!
        );
      } else {
        filteredVerses = chapterData.verses.filter((v) => v.number === ref.startVerse);
      }

      // If specific verse was not found, fallback to all verses
      if (filteredVerses.length === 0) {
        filteredVerses = chapterData.verses;
      }
    }

    const firstVerseHeadings = filteredVerses[0]?.headings;
    const title = firstVerseHeadings && firstVerseHeadings.length > 0
      ? firstVerseHeadings[0]
      : `${bookInfo.name} ${ref.chapter}`;

    return {
      translationId,
      translationName: translation.name,
      reference: ref.fullFormatted,
      book: bookInfo.name,
      chapter: ref.chapter,
      title,
      verses: filteredVerses,
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
      return ['Génesis 1:1', 'Salmos 42:8', 'Juan 3:16', 'Salmos 23', 'Proverbios 3:5', 'Romanos 8:28', 'Filipenses 4:13'];
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
