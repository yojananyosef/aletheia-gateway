import { describe, expect, it } from 'vitest';
import { normalizeSpanish, parseConcordanceQuery } from './ConcordanceQuery';

describe('normalizeSpanish', () => {
  it('lowercases and strips accents', () => {
    expect(normalizeSpanish('Gracia')).toBe('gracia');
    expect(normalizeSpanish('Corazón')).toBe('corazon');
  });

  it('removes punctuation and collapses whitespace', () => {
    expect(normalizeSpanish('reino,  de   Dios!')).toBe('reino de dios');
  });
});

describe('parseConcordanceQuery', () => {
  it('parses AND words', () => {
    const q = parseConcordanceQuery('amor fe');
    expect(q.requiredWords).toEqual(['amor', 'fe']);
    expect(q.exactPhrases).toEqual([]);
    expect(q.excludedWords).toEqual([]);
  });

  it('extracts exact phrases', () => {
    const q = parseConcordanceQuery('"reino de Dios" fe');
    expect(q.exactPhrases).toEqual(['reino de dios']);
    expect(q.requiredWords).toEqual(['fe']);
  });

  it('extracts exclusions and normalizes accents', () => {
    const q = parseConcordanceQuery('amor -mundo Corazón');
    expect(q.requiredWords).toEqual(['amor', 'corazon']);
    expect(q.excludedWords).toEqual(['mundo']);
  });

  it('dedupes tokens', () => {
    const q = parseConcordanceQuery('fe fe Fe');
    expect(q.allTokens).toEqual(['fe']);
  });

  it('handles empty input', () => {
    const q = parseConcordanceQuery('   ');
    expect(q.requiredWords).toEqual([]);
    expect(q.allTokens).toEqual([]);
  });
});
