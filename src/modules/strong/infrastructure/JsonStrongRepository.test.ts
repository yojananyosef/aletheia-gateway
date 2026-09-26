import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { JsonStrongRepository } from './JsonStrongRepository';

const DATA_FILE = join(__dirname, '..', '..', '..', '..', 'public', 'data', 'strong', 'strong-data.json');

function mockFetch() {
  vi.stubGlobal('__BUILD_ID__', 'test');
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => {
      const body = await readFile(DATA_FILE, 'utf-8');
      return { ok: true, status: 200, json: async () => JSON.parse(body) };
    }),
  );
}

function resetRepoCache() {
  const statics = JsonStrongRepository as unknown as { dataPromise: null };
  statics.dataPromise = null;
}

describe('JsonStrongRepository (Strong)', () => {
  beforeEach(() => {
    resetRepoCache();
    mockFetch();
  });

  it('carga hebreo y griego con ids canónicos', async () => {
    const repo = new JsonStrongRepository();
    const entries = await repo.getAll();
    expect(entries.length).toBe(8686 + 5624);
    expect(entries.some((e) => e.id === 'H1' && e.testament === 'hebrew')).toBe(true);
    expect(entries.some((e) => e.id === 'G5624' && e.testament === 'greek')).toBe(true);
  });

  it('incluye las partículas hebreas 9001-9006 con su definición', async () => {
    const repo = new JsonStrongRepository();
    const entry = await repo.getById('H9005');
    expect(entry?.word).toBe('ו');
    expect(entry?.pronunciation).toBe('v');
    expect(entry?.derivation).toBe('conjunción');
    expect(entry?.definition).toContain('waw consecutivo');
    expect(entry?.rvDefinition).toBe('y, pero, o');
  });

  it('resuelve H1 con palabra, pronunciación y audio', async () => {
    const repo = new JsonStrongRepository();
    const entry = await repo.getById('h1');
    expect(entry?.word).toBe('אָב');
    expect(entry?.pronunciation).toBe('ab');
    expect(entry?.audioPath).toBe('/audio/strong/hebrew/1.mp3');
  });

  it('devuelve null para ids inexistentes', async () => {
    const repo = new JsonStrongRepository();
    expect(await repo.getById('H99999')).toBeNull();
  });
});
