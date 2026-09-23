import { describe, expect, it, vi, beforeEach } from 'vitest';
import { JsonPlanRepository } from './JsonPlanRepository';
import { normalizePlanContent, normalizePlanDay, resolveEgwBookFile } from '../domain/ReadingPlan';

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

function resetCaches() {
  // @ts-expect-error reseteo de caches estáticas entre tests
  JsonPlanRepository.indexCache = null;
  // @ts-expect-error reseteo de caches estáticas entre tests
  JsonPlanRepository.contentCache = new Map();
  // @ts-expect-error reseteo de caches estáticas entre tests
  JsonPlanRepository.egwCache = new Map();
}

describe('ReadingPlan domain', () => {
  it('normaliza días con campos ausentes (annual-thematic día 240)', () => {
    expect(normalizePlanDay(null)).toEqual({ title: '', description: '', bible: [], egw: [] });
    expect(normalizePlanDay({ title: 'Día 240', bible: [], egw: [] })).toEqual({
      title: 'Día 240',
      description: '',
      bible: [],
      egw: [],
    });
  });

  it('conserva refs chapterId sin content y descarta basura', () => {
    const day = normalizePlanDay({
      title: 't',
      bible: [{ book: 'gen', chapter: 1 }],
      egw: [{ label: 'Patriarcas y Profetas, Cap. 2', chapterId: 2 }, null, { label: '' }],
    });
    expect(day.bible).toEqual([]);
    expect(day.egw).toEqual([{ label: 'Patriarcas y Profetas, Cap. 2', chapterId: 2 }]);
  });

  it('resuelve el fichero EGW por prefijo del label', () => {
    expect(resolveEgwBookFile('Patriarcas y Profetas, Cap. 2: La creación')).toBe('es_PP54(PP)');
    expect(resolveEgwBookFile('Profetas y Reyes, Cap. 9')).toBe('es_PR(PK)');
    expect(resolveEgwBookFile('Lección 1: Identidad')).toBeNull();
  });

  it('normalizePlanContent rechaza no-objetos', () => {
    expect(normalizePlanContent(null)).toEqual({});
    expect(normalizePlanContent([])).toEqual({});
  });
});

describe('JsonPlanRepository', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.stubGlobal('__BUILD_ID__', 'test');
    resetCaches();
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

  it('getEgwChapter resuelve capítulos EGW y rechaza traversal', async () => {
    const book = { chapters: [{ number: 2, title: 'La creación', sections: [] }] };
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => book });
    vi.stubGlobal('fetch', fetchMock);
    const repo = new JsonPlanRepository();
    expect(await repo.getEgwChapter('es_PP54(PP)', 2)).toEqual({
      number: 2,
      title: 'La creación',
      sections: [],
    });
    expect(await repo.getEgwChapter('es_PP54(PP)', 999)).toBeNull();
    expect(await repo.getEgwChapter('../secret', 1)).toBeNull();
  });

  it('devuelve []/null ante fallo de red', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const repo = new JsonPlanRepository();
    expect(await repo.getIndex()).toEqual([]);
    expect(await repo.getEgwChapter('es_PP54(PP)', 1)).toBeNull();
  });
});
