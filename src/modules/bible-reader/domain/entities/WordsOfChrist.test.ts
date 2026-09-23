import { describe, expect, it } from 'vitest';
import { findPhraseRanges, normalizeRedLettersFile, resolveRedSpans } from './WordsOfChrist';

describe('WordsOfChrist', () => {
  it('normaliza el formato NRVA (mat → MAT)', () => {
    const index = normalizeRedLettersFile({
      passages: { mat: { '5': { '3': ['“Benditos los pobres”'] } }, xyz: {} },
    });
    expect(index.get('MAT')?.get(5)?.get(3)).toEqual(['“Benditos los pobres”']);
    expect(index.has('XYZ')).toBe(false);
  });

  it('match difuso: tildes, comillas y puntuación no impiden el recorte', () => {
    const ranges = findPhraseRanges('Jesús le dijo: “ven y sígueme”.', ['“Ven y sígueme”']);
    expect(ranges).toHaveLength(1);
    const [r] = ranges;
    expect(r.source).toBe('phrase');
    // El span cubre "ven y sígueme" con su tilde original
    expect('Jesús le dijo: “ven y sígueme”.'.slice(r.start, r.end)).toContain('sígueme');
  });

  it('match exacto PDDPT contra texto PDDPT', () => {
    const text = 'Benditos son los que lloran, porque ellos serán consolados.';
    const ranges = findPhraseRanges(text, ['Benditos son los que lloran, porque ellos serán consolados.']);
    expect(ranges).toHaveLength(1);
    expect(ranges[0].start).toBe(0);
  });

  it('fallback a versículo completo si la redacción difiere (otra versión)', () => {
    const text = 'Bienaventurados los pobres en espíritu: porque de ellos es el reino de los cielos.';
    const spans = resolveRedSpans(text, [
      'Benditos son los que reconocen que son pobres espiritualmente, porque de ellos es el reino de los cielos.',
    ]);
    expect(spans).toEqual([{ start: 0, end: text.length, source: 'verse' }]);
  });

  it('sin frases no hay spans', () => {
    expect(resolveRedSpans('Hola mundo', [])).toEqual([]);
    expect(resolveRedSpans('   ', ['Hola'])).toEqual([]);
  });
});
