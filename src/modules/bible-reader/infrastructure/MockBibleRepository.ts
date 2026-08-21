import type { IBibleRepository } from '../domain/repositories/IBibleRepository';
import { AVAILABLE_TRANSLATIONS, type TranslationId, type TranslationInfo } from '../domain/entities/Translation';
import type { PassageVersionResult } from '../domain/entities/Chapter';
import { PassageReference } from '../domain/value-objects/PassageReference';
import { BIBLE_PASSAGES_DATABASE, type StaticPassageData } from './bible-data';

export class MockBibleRepository implements IBibleRepository {
  public getAvailableTranslations(): TranslationInfo[] {
    return Object.values(AVAILABLE_TRANSLATIONS);
  }

  public async getPassage(referenceStr: string, translationId: TranslationId): Promise<PassageVersionResult | null> {
    const ref = new PassageReference(referenceStr);
    const item = this.findPassageData(ref);

    const translationInfo = AVAILABLE_TRANSLATIONS[translationId] || AVAILABLE_TRANSLATIONS.RVC;
    const text = item.translations[translationId] || item.translations.RVC;

    return {
      translationId,
      translationName: translationInfo.name,
      reference: ref.fullFormatted,
      book: ref.book,
      chapter: ref.chapter,
      title: item.title,
      verses: [
        {
          number: ref.startVerse || 1,
          text: text,
        },
      ],
    };
  }

  public async getPassageComparison(referenceStr: string, translationIds: TranslationId[]): Promise<PassageVersionResult[]> {
    const results: PassageVersionResult[] = [];
    for (const tid of translationIds) {
      const passage = await this.getPassage(referenceStr, tid);
      if (passage) {
        results.push(passage);
      }
    }
    return results;
  }

  public async searchSuggestions(query: string): Promise<string[]> {
    const normalized = query.toLowerCase().trim();
    const suggestions = BIBLE_PASSAGES_DATABASE
      .filter((p) => p.reference.toLowerCase().includes(normalized) || p.book.toLowerCase().includes(normalized) || p.title.toLowerCase().includes(normalized))
      .map((p) => p.reference);

    if (suggestions.length > 0) return suggestions;
    return ['Juan 3:16', 'Salmos 23', 'Proverbios 3:5', 'Romanos 8:28', 'Filipenses 4:13'];
  }

  private findPassageData(ref: PassageReference): StaticPassageData {
    const normalize = (s: string) =>
      s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '');

    const normalizedBook = normalize(ref.book);

    const found = BIBLE_PASSAGES_DATABASE.find((p) => {
      const itemBook = normalize(p.book);
      return itemBook === normalizedBook && p.chapter === ref.chapter;
    });

    if (found) return found;

    // Fallback template for any other queried book/chapter
    return {
      reference: ref.fullFormatted,
      book: ref.book,
      chapter: ref.chapter,
      title: `${ref.book} - Capítulo ${ref.chapter}`,
      translations: {
        RVC: `Lectura de ${ref.fullFormatted} en Reina-Valera Contemporánea.`,
        NBLA: `Lectura de ${ref.fullFormatted} en Nueva Biblia de las Américas.`,
        NVI: `Lectura de ${ref.fullFormatted} en Nueva Versión Internacional.`,
        NTV: `Lectura de ${ref.fullFormatted} en Nueva Traducción Viviente.`,
        TLA: `Lectura de ${ref.fullFormatted} en Traducción en Lenguaje Actual.`,
      },
    };
  }
}
