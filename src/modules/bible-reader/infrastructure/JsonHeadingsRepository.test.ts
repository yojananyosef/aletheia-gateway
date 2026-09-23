import { describe, expect, it, vi, beforeEach } from 'vitest';
import { JsonHeadingsRepository } from './JsonHeadingsRepository';

const rawFile = {
  data: [
    [
      {
        osis: 'Gen',
        chapters: [
          {
            chapter: 1,
            type: 'heading',
            content: [
              { text: 'La creación', verse: 1 },
              { text: 'El hombre', verse: 26 },
            ],
          },
        ],
      },
    ],
  ],
};

describe('JsonHeadingsRepository', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.stubGlobal('__BUILD_ID__', 'test');
    // @ts-expect-error reseteo de cache estática entre tests
    JsonHeadingsRepository.indexPromise = null;
  });

  it('agrupa títulos por versículo', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => rawFile }));
    const repo = new JsonHeadingsRepository();
    expect(await repo.getByChapter('GEN', 1)).toEqual({ 1: ['La creación'], 26: ['El hombre'] });
    expect(await repo.getByChapter('EXO', 1)).toEqual({});
  });

  it('cachea la descarga y tolera fallos', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => rawFile });
    vi.stubGlobal('fetch', fetchMock);
    const repo = new JsonHeadingsRepository();
    await repo.getByChapter('gen', 1);
    await repo.getByChapter('GEN', 1);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // @ts-expect-error reseteo de cache estática entre tests
    JsonHeadingsRepository.indexPromise = null;
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    expect(await repo.getByChapter('GEN', 1)).toEqual({});
  });
});
