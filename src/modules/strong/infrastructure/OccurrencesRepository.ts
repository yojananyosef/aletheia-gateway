import { cacheBust } from '../../../shared/utils/cacheBust';
import { FetchCache } from '../../../shared/utils/fetchCache';

export interface StrongOccurrences {
  /** Nº de versículos distintos donde aparece. */
  n: number;
  /** Referencias "BOOK cap:vers" (código gateway). */
  refs: string[];
}

/**
 * Índice Strong → versículos (public/data/interlinear/strong-occurrences.json,
 * claves "H123"/"G456"). Carga diferida y cacheada: el fichero pesa ~5 MB.
 *
 * Usa FetchCache para deduplicar: si varias entradas se abren casi al mismo
 * tiempo, solo se hace un fetch del índice y se comparte entre todas.
 */
const occurrencesCache = new FetchCache<Record<string, StrongOccurrences>>({ ttlMs: 0 });

export class OccurrencesRepository {
  private async loadAll(): Promise<Record<string, StrongOccurrences>> {
    return occurrencesCache.get(
      'strong:occurrences',
      async () => {
        const response = await fetch(cacheBust('/data/interlinear/strong-occurrences.json'));
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return (await response.json()) as Record<string, StrongOccurrences>;
      },
    ).catch((error) => {
      console.warn('[OccurrencesRepository] No se pudo cargar el índice:', error);
      return {};
    });
  }

  public async get(id: string): Promise<StrongOccurrences | null> {
    const all = await this.loadAll();
    return all[id.toUpperCase()] ?? null;
  }
}
