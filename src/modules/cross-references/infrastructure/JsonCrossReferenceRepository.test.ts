import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { JsonCrossReferenceRepository } from './JsonCrossReferenceRepository';

const DATA_ROOT = join(__dirname, '..', '..', '..', '..', 'public', 'data', 'cross-references', 'TSK');

function mockFetch() {
  vi.stubGlobal('__BUILD_ID__', 'test');
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: unknown) => {
      const url = String(input).split('?')[0];
      const file = url.split('/').pop() ?? '';
      try {
        const body = await readFile(join(DATA_ROOT, file), 'utf-8');
        return { ok: true, status: 200, json: async () => JSON.parse(body) };
      } catch {
        return { ok: false, status: 404, json: async () => null };
      }
    }),
  );
}

function resetCache() {
  const statics = JsonCrossReferenceRepository as unknown as { cache: Map<string, unknown> };
  statics.cache = new Map();
}

describe('JsonCrossReferenceRepository (TSK)', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    resetCache();
    mockFetch();
  });

  it('resuelve Génesis 1:1 por código y por nombre', async () => {
    const repo = new JsonCrossReferenceRepository();
    const byCode = await repo.getByVerse('GEN', 1, 1);
    const byName = await repo.getByVerse('Génesis', 1, 1);
    expect(byCode.length).toBeGreaterThan(0);
    expect(byCode[0].clause).toBeTruthy();
    expect(byCode[0].refs.length).toBeGreaterThan(0);
    expect(byName).toEqual(byCode);
  });

  it('getByChapter devuelve el mapa del capítulo indexado por versículo', async () => {
    const repo = new JsonCrossReferenceRepository();
    const chapter = await repo.getByChapter('GEN', 1);
    expect(Object.keys(chapter).length).toBeGreaterThan(10);
    expect(chapter[1].length).toBeGreaterThan(0);
  });

  it('devuelve vacío ante libro/capítulo inexistente', async () => {
    const repo = new JsonCrossReferenceRepository();
    expect(await repo.getByVerse('GEN', 999, 1)).toEqual([]);
    expect(await repo.getByVerse('XXX', 1, 1)).toEqual([]);
    expect(await repo.getByChapter('GEN', 999)).toEqual({});
  });
});
