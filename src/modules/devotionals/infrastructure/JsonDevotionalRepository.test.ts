import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { JsonDevotionalRepository } from './JsonDevotionalRepository';

const DATA_ROOT = join(__dirname, '..', '..', '..', '..', 'public', 'data', 'devotionals');

function mockFetch() {
  vi.stubGlobal('__BUILD_ID__', 'test');
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: unknown) => {
      const url = String(input).split('?')[0];
      if (!url.endsWith('sme-spurgeon.json')) {
        return { ok: false, status: 404, json: async () => null };
      }
      const body = await readFile(join(DATA_ROOT, 'sme-spurgeon.json'), 'utf-8');
      return { ok: true, status: 200, json: async () => JSON.parse(body) };
    }),
  );
}

function resetCache() {
  const statics = JsonDevotionalRepository as unknown as { catalogCache: null };
  statics.catalogCache = null;
}

describe('JsonDevotionalRepository (sme-spurgeon)', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    resetCache();
    mockFetch();
  });

  it('carga el catálogo con 366 días', async () => {
    const repo = new JsonDevotionalRepository();
    const catalog = await repo.getAll();
    expect(catalog?.id).toBe('sme-spurgeon');
    expect(catalog?.totalDays).toBe(366);
    expect(Object.keys(catalog?.days ?? {})).toHaveLength(366);
  });

  it('normaliza la clave de fecha sin ceros ("1.1" -> "01.01")', async () => {
    const repo = new JsonDevotionalRepository();
    const padded = await repo.getByDate('01.01');
    const short = await repo.getByDate('1.1');
    expect(padded?.dateKey).toBe('01.01');
    expect(short?.dateKey).toBe('01.01');
    expect(await repo.getByDate('13.99')).toBeNull();
  });

  it('getToday resuelve el devocional del día actual', async () => {
    const repo = new JsonDevotionalRepository();
    const today = await repo.getToday();
    expect(today).not.toBeNull();
    expect(today?.morning ?? today?.evening).toBeTruthy();
  });

  it('devuelve null ante fallo de red', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const repo = new JsonDevotionalRepository();
    expect(await repo.getAll()).toBeNull();
    expect(await repo.getByDate('01.01')).toBeNull();
  });
});
