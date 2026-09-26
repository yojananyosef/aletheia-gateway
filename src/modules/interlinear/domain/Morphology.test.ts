import { describe, expect, it } from 'vitest';
import { describeParsingCode } from './Morphology';

describe('Morphology (códigos morfológicos)', () => {
  it('expande códigos Robinson griegos', () => {
    expect(describeParsingCode('N-NSF', 'greek')).toBe('sustantivo nominativo singular femenino');
    expect(describeParsingCode('V-IAI-3S', 'greek')).toBe('verbo imperfecto activa indicativo 3ª persona singular');
    expect(describeParsingCode('N-PRI', 'greek')).toBe('sustantivo propio');
    expect(describeParsingCode('PREP', 'greek')).toBe('preposición');
  });

  it('expande códigos hebreos con puntos', () => {
    expect(describeParsingCode('SUBS.F.SG.A', 'hebrew')).toBe('sustantivo femenino singular absoluto');
    expect(describeParsingCode('VERBO.QAL.PERF.P3.M.SG', 'hebrew')).toBe(
      'verbo qal perfecto 3ª persona masculino singular',
    );
    expect(describeParsingCode('PREP', 'hebrew')).toBe('preposición');
  });

  it('devuelve null ante vacío', () => {
    expect(describeParsingCode('', 'greek')).toBeNull();
    expect(describeParsingCode(undefined, 'hebrew')).toBeNull();
  });
});
