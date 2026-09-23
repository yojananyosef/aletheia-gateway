import { normalizeRedLettersFile, type RedLettersIndex } from '../domain/entities/WordsOfChrist';
import { cacheBust } from '../../../shared/utils/cacheBust';

/**
 * Repositorio del overlay de palabras de Cristo (cobertura: Mateo).
 * Carga `public/data/red-letters/red-letters.json` una sola vez (cache en memoria).
 */
export class JsonRedLettersRepository {
  private static indexPromise: Promise<RedLettersIndex> | null = null;

  private static load(): Promise<RedLettersIndex> {
    if (!JsonRedLettersRepository.indexPromise) {
      JsonRedLettersRepository.indexPromise = fetch(cacheBust('/data/red-letters/red-letters.json'))
        .then(async (res) => {
          if (!res.ok) return new Map();
          try {
            return normalizeRedLettersFile(await res.json());
          } catch {
            return new Map() as RedLettersIndex;
          }
        })
        .catch(() => new Map() as RedLettersIndex);
    }
    return JsonRedLettersRepository.indexPromise;
  }

  /** Frases del overlay por versículo de un capítulo. */
  public async getByChapter(bookCode: string, chapter: number): Promise<Record<number, string[]>> {
    const index = await JsonRedLettersRepository.load();
    const chapMap = index.get(bookCode.toUpperCase())?.get(chapter);
    const grouped: Record<number, string[]> = {};
    if (!chapMap) return grouped;
    for (const [verse, phrases] of chapMap) {
      grouped[verse] = [...phrases];
    }
    return grouped;
  }
}
