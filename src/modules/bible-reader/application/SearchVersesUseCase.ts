import type { IBibleRepository } from '../domain/repositories/IBibleRepository';

export class SearchVersesUseCase {
  constructor(private readonly bibleRepository: IBibleRepository) {}

  public async execute(query: string): Promise<string[]> {
    if (!query || query.trim().length === 0) {
      return ['Juan 3:16', 'Salmos 23', 'Proverbios 3:5', 'Romanos 8:28', 'Filipenses 4:13'];
    }
    return await this.bibleRepository.searchSuggestions(query.trim());
  }
}
