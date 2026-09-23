import { describe, expect, it, vi, beforeEach } from 'vitest';
import { JsonRedLettersRepository } from './JsonRedLettersRepository';

const rawFile = {
  passages: { mat: { '5': { '3': ['“Benditos los pobres”'] } } },
};

describe('JsonRedLettersRepository', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.stubGlobal('__BUILD_ID__', 'test');
    // @ts-expect-error reseteo de cache estática entre tests
    JsonRedLettersRepository.indexPromise = null;
  });

  it('agrupa frases por versículo (MAT 5:3)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => rawFile }));
    const repo = new JsonRedLettersRepository();
    expect(await repo.getByChapter('MAT', 5)).toEqual({ 3: ['“Benditos los pobres”'] });
    expect(await repo.getByChapter('MAT', 6)).toEqual({});
    expect(await repo.getByChapter('GEN', 1)).toEqual({});
  });

  it('toler fallos de red', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const repo = new JsonRedLettersRepository();
    expect(await repo.getByChapter('MAT', 5)).toEqual({});
  });
});
