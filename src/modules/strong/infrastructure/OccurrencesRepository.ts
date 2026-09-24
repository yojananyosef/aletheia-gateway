import { cacheBust } from '../../../shared/utils/cacheBust';

export interface StrongOccurrences {
  /** Nº de versículos distintos donde aparece. */
  n: number;
  /** Referencias "BOOK cap:vers" (código gateway). */
  refs: string[];
}

/**
 * Índice Strong → versículos (public/data/interlinear/strong-occurrences.json,
 * claves "H123"/"G456"). Carga diferida y cacheada: el fichero pesa ~5 MB.
 */
export class OccurrencesRepository {
  private static dataPromise: Promise<Record<string, StrongOccurrences>> | null = null;

  private async loadAll(): Promise<Record<string, StrongOccurrences>> {
    if (OccurrencesRepository.dataPromise) {
      return OccurrencesRepository.dataPromise;
    }
    OccurrencesRepository.dataPromise = fetch(cacheBust('/data/interlinear/strong-occurrences.json'))
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return (await response.json()) as Record<string, StrongOccurrences>;
      })
      .catch((error) => {
        console.warn('[OccurrencesRepository] No se pudo cargar el índice:', error);
        OccurrencesRepository.dataPromise = null;
        return {};
      });
    return OccurrencesRepository.dataPromise;
  }

  public async get(id: string): Promise<StrongOccurrences | null> {
    const all = await this.loadAll();
    return all[id.toUpperCase()] ?? null;
  }
}
