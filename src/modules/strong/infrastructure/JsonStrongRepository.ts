import type { IStrongRepository } from '../domain/IStrongRepository';
import type { StrongEntry, StrongTestament } from '../domain/StrongEntry';
import { cacheBust } from '../../../shared/utils/cacheBust';

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

export class JsonStrongRepository implements IStrongRepository {
  private static dataPromise: Promise<StrongEntry[]> | null = null;

  private async loadAll(): Promise<StrongEntry[]> {
    if (JsonStrongRepository.dataPromise) {
      return JsonStrongRepository.dataPromise;
    }

    JsonStrongRepository.dataPromise = fetch(cacheBust('/data/strong/strong-data.json'))
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const raw = (await response.json()) as {
          hebrew?: Record<string, RawStrongEntry>;
          greek?: Record<string, RawStrongEntry>;
        };
        return [...this.mapTestament(raw.hebrew, 'hebrew'), ...this.mapTestament(raw.greek, 'greek')];
      })
      .catch((error) => {
        console.warn('[JsonStrongRepository] No se pudo cargar el diccionario:', error);
        JsonStrongRepository.dataPromise = null;
        return [];
      });

    return JsonStrongRepository.dataPromise;
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
