import { describe, expect, it } from 'vitest';
import { normalizeHeadersFile, OSIS_TO_GATEWAY, resolveVerseHeadings } from './SectionHeading';

describe('SectionHeading', () => {
  it('mapea los 66 códigos OSIS a gateway', () => {
    expect(Object.keys(OSIS_TO_GATEWAY)).toHaveLength(66);
    expect(OSIS_TO_GATEWAY['Ps']).toBe('PSA');
    expect(OSIS_TO_GATEWAY['Jas']).toBe('JAS');
    expect(OSIS_TO_GATEWAY['Song']).toBe('SNG');
  });

  it('normaliza el formato NRVA real (data como lista-de-listas)', () => {
    const raw = {
      data: [
        [
          {
            osis: 'Gen',
            chapters: [
              { chapter: 1, type: 'heading', content: [{ text: 'La creación', verse: 1 }] },
              { chapter: 10, type: 'verse', content: [] },
            ],
          },
          { osis: 'Xyz', chapters: [{ chapter: 1, type: 'heading', content: [{ text: '¿?', verse: 1 }] }] },
        ],
      ],
    };
    const index = normalizeHeadersFile(raw);
    expect(index.get('GEN')?.get(1)).toEqual([{ text: 'La creación', verse: 1 }]);
    expect(index.get('GEN')?.has(10)).toBe(false);
    expect(index.has('XYZ')).toBe(false);
  });

  it('nativo gana sobre overlay (anti-choque ONBV/PDDPT/Platense)', () => {
    const r = resolveVerseHeadings(['Título propio de la versión'], ['La creación']);
    expect(r).toEqual({ texts: ['Título propio de la versión'], source: 'native' });
  });

  it('overlay solo rellena huecos', () => {
    expect(resolveVerseHeadings([], ['La creación'])).toEqual({ texts: ['La creación'], source: 'overlay' });
    expect(resolveVerseHeadings(undefined, [])).toEqual({ texts: [], source: 'none' });
    expect(resolveVerseHeadings(['  '], ['La creación'])).toEqual({
      texts: ['La creación'],
      source: 'overlay',
    });
  });
});
