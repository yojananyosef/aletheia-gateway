import { describe, expect, it, vi, beforeEach } from 'vitest';
import { JsonPlanRepository } from './JsonPlanRepository';

const indexData = [
  { id: 'daniel', title: 'El Libro de Daniel', description: 'd', durationDays: 16, category: 'Profecía', url: '#' },
];

const danielContent = {
  '1': {
    title: 'Día 1',
    description: 'Intro',
    bible: [{ book: 'dan', chapter: 1, label: 'Daniel 1' }],
    egw: [],
  },
};

describe('JsonPlanRepository', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.stubGlobal('__BUILD_ID__', 'test');
  });

  it('devuelve índice y cachea', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => indexData });
    vi.stubGlobal('fetch', fetchMock);
    const repo = new JsonPlanRepository();
    const first = await repo.getIndex();
    const second = await repo.getIndex();
    expect(first).toHaveLength(1);
    expect(first[0].id).toBe('daniel');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(second).toBe(first);
  });

  it('getDay resuelve el día como string-key', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => danielContent });
    vi.stubGlobal('fetch', fetchMock);
    const repo = new JsonPlanRepository();
    const day = await repo.getDay('daniel', 1);
    expect(day?.bible[0].label).toBe('Daniel 1');
    expect(await repo.getDay('daniel', 99)).toBeNull();
  });

  it('devuelve []/null ante fallo de red', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const repo = new JsonPlanRepository();
    // @ts-expect-error limpiar cache estatica entre tests
    JsonPlanRepository.indexCache = null;
    expect(await repo.getIndex()).toEqual([]);
  });
});
