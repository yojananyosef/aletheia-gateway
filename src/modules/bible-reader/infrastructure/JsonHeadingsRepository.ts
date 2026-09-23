import { normalizeHeadersFile, type HeadingsIndex, type OverlayHeading } from '../domain/entities/SectionHeading';
import { cacheBust } from '../../../shared/utils/cacheBust';

/**
 * Repositorio del overlay de títulos de sección.
 * Carga `public/data/headings/headers.json` una sola vez (cache en memoria).
 */
export class JsonHeadingsRepository {
  private static indexPromise: Promise<HeadingsIndex> | null = null;

  private static load(): Promise<HeadingsIndex> {
    if (!JsonHeadingsRepository.indexPromise) {
      JsonHeadingsRepository.indexPromise = fetch(cacheBust('/data/headings/headers.json'))
        .then(async (res) => {
          if (!res.ok) return new Map();
          try {
            return normalizeHeadersFile(await res.json());
          } catch {
            return new Map<string, Map<number, OverlayHeading[]>>();
          }
        })
        .catch(() => new Map<string, Map<number, OverlayHeading[]>>());
    }
    return JsonHeadingsRepository.indexPromise;
  }

  /** Títulos overlay de un capítulo, agrupados por número de versículo. */
  public async getByChapter(bookCode: string, chapter: number): Promise<Record<number, string[]>> {
    const index = await JsonHeadingsRepository.load();
    const chapterMap = index.get(bookCode.toUpperCase());
    const items = chapterMap?.get(chapter) ?? [];
    const grouped: Record<number, string[]> = {};
    for (const item of items) {
      (grouped[item.verse] ??= []).push(item.text);
    }
    return grouped;
  }
}
