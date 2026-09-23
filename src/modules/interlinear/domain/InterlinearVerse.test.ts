import { describe, expect, it } from 'vitest';
import { strongIdForWord, testamentLabel } from './InterlinearVerse';

describe('strongIdForWord', () => {
  it('compone el código canónico según el testamento', () => {
    expect(strongIdForWord({ text: 'רֵאשִׁית', parsing: 'subs', strong: '7225', spanish: 'principio' }, 'hebrew')).toBe(
      'H7225',
    );
    expect(strongIdForWord({ text: 'Βίβλος', parsing: 'Sust.', strong: '976', spanish: 'Libro' }, 'greek')).toBe(
      'G976',
    );
  });

  it('devuelve null para partículas gramaticales 9001+ sin entrada', () => {
    expect(strongIdForWord({ text: 'בְּ', parsing: 'prep', strong: '9001', spanish: 'En' }, 'hebrew')).toBeNull();
  });

  it('devuelve null para strong vacíos o inválidos', () => {
    expect(strongIdForWord({ text: 'x', parsing: '', strong: '', spanish: '' }, 'hebrew')).toBeNull();
    expect(strongIdForWord({ text: 'x', parsing: '', strong: 'abc', spanish: '' }, 'greek')).toBeNull();
  });
});

describe('testamentLabel', () => {
  it('etiqueta hebreo y griego', () => {
    expect(testamentLabel('hebrew')).toBe('Hebreo');
    expect(testamentLabel('greek')).toBe('Griego');
  });
});
