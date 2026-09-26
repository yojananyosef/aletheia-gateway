import { describe, expect, it } from 'vitest';
import { describeParsingCode, describeWord } from './Morphology';

describe('Morphology (códigos morfológicos)', () => {
  it('expande códigos Robinson griegos', () => {
    expect(describeParsingCode('N-NSF', 'greek')).toBe('sustantivo nominativo singular femenino');
    expect(describeParsingCode('V-IAI-3S', 'greek')).toBe('verbo imperfecto activo indicativo 3ª persona singular');
    expect(describeParsingCode('N-PRI', 'greek')).toBe('sustantivo apropiado');
    expect(describeParsingCode('PREP', 'greek')).toBe('preposición');
  });

  it('expande códigos hebreos con puntos', () => {
    expect(describeParsingCode('SUBS.M.PL.A', 'hebrew')).toBe('sustantivo masculino plural absoluto');
    expect(describeParsingCode('VERBO.QAL.PERF.P3.M.SG', 'hebrew')).toBe(
      'verbo qal perfecto 3ª persona masculino singular',
    );
    expect(describeParsingCode('PREP', 'hebrew')).toBe('preposición');
  });

  it('usa la misma redacción que la referencia para el estado y el género', () => {
    expect(describeParsingCode('SUBS.U.SG.A', 'hebrew')).toBe('sustantivo desconocido singular absoluto');
    expect(describeParsingCode('SUBS.M.SG.C', 'hebrew')).toBe('sustantivo masculino singular constructivo');
    expect(describeParsingCode('ADJV.F.SG.C', 'hebrew')).toBe('adjetivo femenino singular constructivo');
    expect(describeParsingCode('NMPR.M.SG.A', 'hebrew')).toBe('nombre propio masculino singular absoluto');
    expect(describeParsingCode('PRDE.P3.M.SG', 'hebrew')).toBe('demonstrative pronombre 3ª persona masculino singular');
    expect(describeParsingCode('PREP.PRS.P2.M.SG', 'hebrew')).toBe(
      'preposición pronominal sufijo 2ª persona masculino singular',
    );
    expect(describeParsingCode('VERBO.QAL.WAYQ.P3.M.SG', 'hebrew')).toBe(
      'verbo qal wayyiqtol 3ª persona masculino singular',
    );
    expect(describeParsingCode('VERBO.PIEL.PERF.P3.M.SG', 'hebrew')).toBe(
      'verbo piel perfecto 3ª persona masculino singular',
    );
  });

  it('devuelve null ante vacío o código irreconocible', () => {
    expect(describeParsingCode('', 'greek')).toBeNull();
    expect(describeParsingCode(undefined, 'hebrew')).toBeNull();
    expect(describeParsingCode('ZZZ-QQQ', 'greek')).toBeNull();
  });

  it('describe palabras griegas con el análisis ya en español de la fuente', () => {
    expect(
      describeWord(
        { parsing: 'Verbo-2º Aoristo-Activo-Indicativo-3ª Persona-Singular', parsingCode: 'V-2AAI-3S' },
        'greek',
      ),
    ).toBe('verbo 2º aoristo activo indicativo 3ª persona singular');
    // Sin `parsing` en la fuente se expande el código Robinson.
    expect(describeWord({ parsing: '', parsingCode: 'N-ASM' }, 'greek')).toBe(
      'sustantivo acusativo singular masculino',
    );
  });

  it('describe palabras hebreas expandiendo el código', () => {
    expect(describeWord({ parsing: 'subs.m.pl.a', parsingCode: 'SUBS.M.PL.A' }, 'hebrew')).toBe(
      'sustantivo masculino plural absoluto',
    );
    // Código ausente: se recurre al parsing de la fuente.
    expect(describeWord({ parsing: 'verbo.qal.perf.p3.m.sg', parsingCode: '' }, 'hebrew')).toBe(
      'verbo qal perfecto 3ª persona masculino singular',
    );
    expect(describeWord({ parsing: '', parsingCode: '' }, 'hebrew')).toBeNull();
  });
});
