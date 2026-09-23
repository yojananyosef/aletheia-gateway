import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { JsonCommentaryRepository } from './JsonCommentaryRepository';

const DATA_ROOT = join(__dirname, '..', '..', '..', '..', 'public', 'data', 'commentaries');

function mockFetch() {
  vi.stubGlobal('__BUILD_ID__', 'test');
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: unknown) => {
      const url = String(input).split('?')[0];
      const rel = url.replace(/^\/data\/commentaries\//, '');
      try {
        const body = await readFile(join(DATA_ROOT, rel), 'utf-8');
        return { ok: true, status: 200, json: async () => JSON.parse(body) };
      } catch {
        return { ok: false, status: 404, json: async () => null };
      }
    }),
  );
}

function resetRepoCache() {
  const statics = JsonCommentaryRepository as unknown as {
    indexPromise: null;
    bookCache: Map<string, null>;
  };
  statics.indexPromise = null;
  statics.bookCache = new Map();
}

describe('JsonCommentaryRepository (CBA)', () => {
  beforeEach(() => {
    resetRepoCache();
    mockFetch();
  });

  it('lista al CBA como primera fuente en español y completo', async () => {
    const repo = new JsonCommentaryRepository();
    const sources = await repo.getSources();
    expect(sources[0].id).toBe('cba');
    expect(sources[0].language).toBe('es');
    expect(sources[0].totalBooks).toBe(66);
    expect(sources[0].bookCodes).toContain('GEN');
  });

  it('resuelve el comentario CBA de Génesis 1:1', async () => {
    const repo = new JsonCommentaryRepository();
    const text = await repo.getByVerse('cba', 'GEN', 1, 1);
    expect(text).toContain('En el principio.');
  });

  it('devuelve entradas de capítulo ordenadas por versículo', async () => {
    const repo = new JsonCommentaryRepository();
    const entries = await repo.getByChapter('cba', 'Génesis', 1);
    const verses = entries.filter((e) => e.scope === 'verse').map((e) => e.verse);
    expect(verses.length).toBeGreaterThan(20);
    expect(verses).toEqual([...verses].sort((a, b) => (a || 0) - (b || 0)));
  });

  it('devuelve vacío para libros sin CBA (deuterocanónicos)', async () => {
    const repo = new JsonCommentaryRepository();
    const entries = await repo.getByChapter('cba', 'TOB', 1);
    expect(entries).toEqual([]);
  });

  it('combina la introducción del libro en UNA sola entrada y solo en el capítulo 1', async () => {
    const repo = new JsonCommentaryRepository();
    const ch1 = await repo.getByChapter('cba', 'Génesis', 1);
    const introsCh1 = ch1.filter((e) => e.scope === 'book');
    expect(introsCh1).toHaveLength(1);
    // Los párrafos originales se conservan separados por línea en blanco
    expect(introsCh1[0].text).toContain('\n\n');
    expect(introsCh1[0].text).toContain('INTRODUCCIÓN');

    const ch4 = await repo.getByChapter('cba', 'Génesis', 4);
    expect(ch4.filter((e) => e.scope === 'book')).toHaveLength(0);
    expect(ch4.filter((e) => e.scope === 'verse').length).toBeGreaterThan(0);
  });
});
