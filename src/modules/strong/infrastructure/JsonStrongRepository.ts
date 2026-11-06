import type { IStrongRepository } from '../domain/IStrongRepository';
import type { StrongEntry, StrongTestament } from '../domain/StrongEntry';
import { cacheBust } from '../../../shared/utils/cacheBust';
import { FetchCache } from '../../../shared/utils/fetchCache';

interface RawStrongEntry {
  strongNumber?: string;
  originalWord?: string;
  pronunciation?: string;
  derivation?: string;
  definition?: string;
  RVDefinition?: string;
  stepGloss?: string;
  stepDefinition?: string;
  audio?: string;
}

interface RawStrongData {
  hebrew?: Record<string, RawStrongEntry>;
  greek?: Record<string, RawStrongEntry>;
}

/**
 * Caché transversal con deduplicación para el diccionario Strong completo.
 * Se carga una sola vez y se reutiliza en todas las peticiones (getAll,
 * getById, navegación de entrada anterior/siguiente).
 */
const strongDataCache = new FetchCache<StrongEntry[]>({ ttlMs: 0 });

export class JsonStrongRepository implements IStrongRepository {
  private async loadAll(): Promise<StrongEntry[]> {
    return strongDataCache.get(
      'strong:dictionary',
      async () => {
        const response = await fetch(cacheBust('/data/strong/strong-data.json'));
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const raw = (await response.json()) as RawStrongData;
        return [...this.mapTestament(raw.hebrew, 'hebrew'), ...this.mapTestament(raw.greek, 'greek')];
      },
    ).catch((error) => {
      console.warn('[JsonStrongRepository] No se pudo cargar el diccionario:', error);
      return [];
    });
  }

  private mapTestament(source: Record<string, RawStrongEntry> | undefined, testament: StrongTestament): StrongEntry[] {
    if (!source) return [];
    const prefix = testament === 'greek' ? 'G' : 'H';
    const folder = testament === 'greek' ? 'greek' : 'hebrew';
    return Object.entries(source)
      .map(([key, raw]) => {
        const number = parseInt(key, 10);
        if (!Number.isInteger(number) || number < 1) return null;
        return {
          id: `${prefix}${number}`,
          number,
          testament,
          word: raw.originalWord || '',
          pronunciation: raw.pronunciation || '',
          derivation: raw.derivation || '',
          definition: raw.definition || '',
          rvDefinition: raw.RVDefinition || '',
          stepGloss: raw.stepGloss || '',
          stepDefinition: raw.stepDefinition || '',
          audioPath: `/audio/strong/${folder}/${number}.mp3`,
        } as StrongEntry;
      })
      .filter((entry): entry is StrongEntry => entry !== null)
      .sort((a, b) => a.number - b.number);
  }

  public async getAll(): Promise<StrongEntry[]> {
    return this.loadAll();
  }

  public async getById(id: string): Promise<StrongEntry | null> {
    const normalized = id.trim().toUpperCase();
    const entries = await this.loadAll();
    return entries.find((entry) => entry.id === normalized) || null;
  }
}
