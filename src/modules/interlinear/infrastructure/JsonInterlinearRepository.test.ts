import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { JsonInterlinearRepository } from './JsonInterlinearRepository';

const DATA_ROOT = join(__dirname, '..', '..', '..', '..', 'public', 'data', 'interlinear');

function mockFetch() {
  vi.stubGlobal('__BUILD_ID__', 'test');
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: unknown) => {
      const url = String(input).split('?')[0];
      const match = /\/data\/interlinear\/(hebrew|greek)\/([A-Z0-9]+)\.json/.exec(url);
      if (!match) return { ok: false, status: 404, json: async () => null };
      try {
        const body = await readFile(join(DATA_ROOT, match[1], `${match[2]}.json`), 'utf-8');
        return { ok: true, status: 200, json: async () => JSON.parse(body) };
      } catch {
        return { ok: false, status: 404, json: async () => null };
      }
    }),
  );
}

function resetRepoCache() {
  const statics = JsonInterlinearRepository as unknown as { bookCache: Map<string, null> };
  statics.bookCache = new Map();
}

describe('JsonInterlinearRepository (Interlineal)', () => {
  beforeEach(() => {
    resetRepoCache();
    mockFetch();
  });

  it('resuelve Génesis 1 con palabras hebreas y Strong', async () => {
    const repo = new JsonInterlinearRepository();
    const data = await repo.getChapter('GEN', 1);
    expect(data?.testament).toBe('hebrew');
    expect(data?.bookCode).toBe('GEN');
    const v1 = data?.verses.find((v) => v.verse === 1);
    expect(v1?.words.length).toBeGreaterThan(5);
    expect(v1?.words[0]).toMatchObject({ strong: '9001', spanish: 'En' });
  });

  it('resuelve Mateo 1 en griego por nombre en español', async () => {
    const repo = new JsonInterlinearRepository();
    const data = await repo.getChapter('Mateo', 1);
    expect(data?.testament).toBe('greek');
    expect(data?.verses.find((v) => v.verse === 1)?.words[0].strong).toBe('976');
  });

  it('devuelve null para libros sin interlineal (deuterocanónicos)', async () => {
    const repo = new JsonInterlinearRepository();
    expect(await repo.getChapter('TOB', 1)).toBeNull();
  });
});
