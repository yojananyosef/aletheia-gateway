import type { TranslationId, TranslationInfo } from '../entities/Translation';
import type { PassageVersionResult } from '../entities/Chapter';

export interface IBibleRepository {
  getPassage(reference: string, translationId: TranslationId): Promise<PassageVersionResult | null>;
  getPassageComparison(reference: string, translationIds: TranslationId[]): Promise<PassageVersionResult[]>;
  getAvailableTranslations(): TranslationInfo[];
  searchSuggestions(query: string): Promise<string[]>;
}
