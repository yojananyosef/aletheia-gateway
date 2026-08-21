import type { IBibleRepository } from '../domain/repositories/IBibleRepository';
import type { TranslationId } from '../domain/entities/Translation';
import type { PassageVersionResult } from '../domain/entities/Chapter';

export interface GetChapterRequest {
  reference: string;
  translationId: TranslationId;
}

export class GetChapterUseCase {
  constructor(private readonly bibleRepository: IBibleRepository) {}

  public async execute(request: GetChapterRequest): Promise<PassageVersionResult | null> {
    return await this.bibleRepository.getPassage(request.reference, request.translationId);
  }
}
