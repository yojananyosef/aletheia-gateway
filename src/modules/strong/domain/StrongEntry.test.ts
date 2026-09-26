import { describe, expect, it } from 'vitest';
import { matchesStrongQuery, normalizeStrongId, parseStrongId, type StrongEntry } from './StrongEntry';

const ENTRY: StrongEntry = {
  id: 'H1',
  number: 1,
  testament: 'hebrew',
  word: 'אָב',
  pronunciation: 'ab',
  derivation: 'palabra prim.',
  definition: 'padre en aplicación literal e inmediata',
  rvDefinition: 'abuelo, antepasado, padre',
  stepGloss: 'padre',
  stepDefinition: 'padre, antepasados, abuelo',
  audioPath: '/audio/strong/hebrew/1.mp3',
};

describe('normalizeStrongId', () => {
  it('normaliza número suelto a hebreo', () => {
    expect(normalizeStrongId('25')).toBe('H25');
  });

  it('conserva prefijos H/G en mayúsculas', () => {
    expect(normalizeStrongId('g26')).toBe('G26');
    expect(normalizeStrongId(' H100 ')).toBe('H100');
  });

  it('rechaza términos no numéricos', () => {
    expect(normalizeStrongId('amor')).toBeNull();
    expect(normalizeStrongId('H')).toBeNull();
    expect(normalizeStrongId('')).toBeNull();
  });
});

describe('parseStrongId', () => {
  it('parsea H/G con rangos válidos', () => {
    expect(parseStrongId('H1')).toEqual({ testament: 'hebrew', number: 1 });
    expect(parseStrongId('G5624')).toEqual({ testament: 'greek', number: 5624 });
  });

  it('acepta las partículas hebreas 9001-9006', () => {
    expect(parseStrongId('H9001')).toEqual({ testament: 'hebrew', number: 9001 });
    expect(parseStrongId('H9006')).toEqual({ testament: 'hebrew', number: 9006 });
    expect(parseStrongId('H9007')).toBeNull();
  });

  it('rechaza fuera de rango o malformados', () => {
    expect(parseStrongId('H0')).toBeNull();
    expect(parseStrongId('H8681')).toEqual({ testament: 'hebrew', number: 8681 });
    expect(parseStrongId('G5625')).toBeNull();
    expect(parseStrongId('25')).toBeNull();
  });
});

describe('matchesStrongQuery', () => {
  it('coincide por id, palabra, pronunciación y definiciones', () => {
    expect(matchesStrongQuery(ENTRY, 'H1')).toBe(true);
    expect(matchesStrongQuery(ENTRY, 'אָב')).toBe(true);
    expect(matchesStrongQuery(ENTRY, 'ab')).toBe(true);
    expect(matchesStrongQuery(ENTRY, 'antepasado')).toBe(true);
    expect(matchesStrongQuery(ENTRY, 'abuelo')).toBe(true);
  });

  it('ignora tildes en la búsqueda', () => {
    expect(matchesStrongQuery(ENTRY, 'aplicacion')).toBe(true);
  });

  it('query vacía coincide con todo', () => {
    expect(matchesStrongQuery(ENTRY, '  ')).toBe(true);
  });

  it('rechaza lo que no coincide', () => {
    expect(matchesStrongQuery(ENTRY, 'G9999')).toBe(false);
    expect(matchesStrongQuery(ENTRY, 'xyz')).toBe(false);
  });
});
