import type { IBibleRepository } from '../domain/repositories/IBibleRepository';
import type { TranslationId } from '../domain/entities/Translation';
import type { PassageVersionResult } from '../domain/entities/Chapter';

export interface CompareTranslationsRequest {
  reference: string;
  translations: TranslationId[];
}

export class CompareTranslationsUseCase {
  constructor(private readonly bibleRepository: IBibleRepository) {}

  public async execute(request: CompareTranslationsRequest): Promise<PassageVersionResult[]> {
    if (!request.reference || request.translations.length === 0) {
      return [];
    }

    // Limit comparison up to 5 translations for layout and UX
    const selectedTranslations = request.translations.slice(0, 5);
    return await this.bibleRepository.getPassageComparison(request.reference, selectedTranslations);
  }
}
