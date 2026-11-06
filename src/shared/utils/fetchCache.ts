/**
 * Utilidad transversal de caché de fetch con deduplicación (single-flight).
 *
 * Problema que resuelve:
 * - Varios componentes pueden solicitar el mismo recurso JSON al mismo tiempo
 *   (ej. InterlinearView pide getChapter() y getBookOutline() en paralelo,
 *   ambos llaman a loadBook() del mismo libro → dos fetches HTTP idénticos).
 * - Sin deduplicación, cada llamada dispara su propio fetch aunque el anterior
 *   ya esté en vuelo.
 *
 * Solución:
 * - Un Map de promises en vuelo por clave de caché. Mientras una petición está
 *   en curso, las llamadas posteriores comparten la misma promise.
 * - Un Map de resultados ya resueltos para lecturas inmediatas sin red.
 * - Opcional: precarga en background (fire-and-forget) para el siguiente capítulo.
 */

type CacheEntry<T> = { data: T; timestamp: number };

interface FetchCacheOptions {
  /** Tiempo de vida del caché en ms. 0 = caché ilimitado hasta recarga de página. */
  ttlMs?: number;
}

export class FetchCache<T> {
  private readonly dataCache = new Map<string, CacheEntry<T>>();
  private readonly inFlight = new Map<string, Promise<T>>();
  private readonly ttlMs: number;

  constructor(options: FetchCacheOptions = {}) {
    this.ttlMs = options.ttlMs ?? 0;
  }

  private isExpired(entry: CacheEntry<T>): boolean {
    if (this.ttlMs <= 0) return false;
    return Date.now() - entry.timestamp > this.ttlMs;
  }

  /**
   * Obtiene un recurso JSON, cacheándolo y deduplicando peticiones concurrentes.
   * Si ya hay una petición en vuelo para la misma clave, se devuelve la misma
   * promise en lugar de lanzar un segundo fetch.
   */
  async get(
    key: string,
    fetcher: () => Promise<T>,
    opts?: { background?: boolean },
  ): Promise<T | null> {
    // 1. Caché caliente
    const cached = this.dataCache.get(key);
    if (cached && !this.isExpired(cached)) {
      return cached.data;
    }

    // 2. Petición en vuelo: compartirla
    const existing = this.inFlight.get(key);
    if (existing) {
      return existing;
    }

    // 3. Lanzar nueva petición
    const promise = (async () => {
      try {
        const data = await fetcher();
        this.dataCache.set(key, { data, timestamp: Date.now() });
        return data;
      } finally {
        this.inFlight.delete(key);
      }
    })();

    this.inFlight.set(key, promise);

    if (opts?.background) {
      // Precarga silenciosa: no bloquear, errores se tragan
      void promise.catch(() => {
        // ignore
      });
    }

    return promise;
  }

  /** Invalidar una clave concreta del caché (y de las en vuelo). */
  invalidate(key: string): void {
    this.dataCache.delete(key);
    this.inFlight.delete(key);
  }

  /** Limpiar todo el caché. */
  clear(): void {
    this.dataCache.clear();
    this.inFlight.clear();
  }

  /** Saber si una clave está en caché caliente. */
  has(key: string): boolean {
    const cached = this.dataCache.get(key);
    return Boolean(cached && !this.isExpired(cached));
  }
}

/**
 * Helper para cacheBust con build id, reutilizando la función existente.
 */
export function cachedFetchJson<T>(url: string): Promise<T> {
  return fetch(url).then(async (res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  });
}
