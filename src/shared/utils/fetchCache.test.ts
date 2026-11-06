import { afterEach, describe, expect, it, vi } from 'vitest';
import { FetchCache } from './fetchCache';

describe('FetchCache', () => {
  afterEach(() => vi.useRealTimers());

  it('comparte peticiones simultáneas y reutiliza el resultado', async () => {
    const cache = new FetchCache<string>();
    const fetcher = vi.fn(async () => 'resultado');
    expect(await Promise.all([cache.get('libro', fetcher), cache.get('libro', fetcher)])).toEqual([
      'resultado', 'resultado',
    ]);
    expect(await cache.get('libro', fetcher)).toBe('resultado');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('reintenta después de errores, incluso si el fetcher falla sincrónicamente', async () => {
    const cache = new FetchCache<string>();
    const fetcher = vi.fn<() => Promise<string>>()
      .mockImplementationOnce(() => { throw new Error('sin red'); })
      .mockResolvedValueOnce('recuperado');
    await expect(cache.get('libro', fetcher)).rejects.toThrow('sin red');
    expect(await cache.get('libro', fetcher)).toBe('recuperado');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('renueva los datos después del TTL', async () => {
    vi.useFakeTimers();
    const cache = new FetchCache<number>({ ttlMs: 100 });
    const fetcher = vi.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(2);
    expect(await cache.get('libro', fetcher)).toBe(1);
    vi.advanceTimersByTime(101);
    expect(cache.has('libro')).toBe(false);
    expect(await cache.get('libro', fetcher)).toBe(2);
  });

  it.each(['invalidate', 'clear'] as const)('%s no permite que una petición anterior sobrescriba datos nuevos', async (action) => {
    const cache = new FetchCache<string>();
    let resolveOld!: (value: string) => void;
    const old = cache.get('libro', () => new Promise<string>((resolve) => { resolveOld = resolve; }));
    await Promise.resolve();
    if (action === 'invalidate') cache.invalidate('libro');
    else cache.clear();
    const newer = cache.get('libro', async () => 'nuevo');
    resolveOld('antiguo');
    expect(await old).toBe('antiguo');
    expect(await newer).toBe('nuevo');
    expect(await cache.get('libro', async () => 'incorrecto')).toBe('nuevo');
  });
});
