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

  it('resuelve las partículas hebreas 9001-9006 (tienen ficha)', () => {
    expect(strongIdForWord({ text: 'בְּ', parsing: 'prep', strong: '9001', spanish: 'En' }, 'hebrew')).toBe('H9001');
    expect(strongIdForWord({ text: 'הַ', parsing: 'art', strong: '9006', spanish: 'el' }, 'hebrew')).toBe('H9006');
  });

  it('devuelve null fuera del rango del diccionario', () => {
    expect(strongIdForWord({ text: 'x', parsing: '', strong: '9007', spanish: '' }, 'hebrew')).toBeNull();
    expect(strongIdForWord({ text: 'x', parsing: '', strong: '5625', spanish: '' }, 'greek')).toBeNull();
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
