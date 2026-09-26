import { STRONG_RANGES, type StrongTestament } from '../../strong/domain/StrongEntry';

export type InterlinearTestament = 'hebrew' | 'greek';

export interface InterlinearWord {
  /** Palabra original (hebreo con niqqud o griego politónico). */
  text: string;
  parsing: string;
  /** Número Strong sin prefijo (ej. "7225"); "9001".."9006" son partículas gramaticales. */
  strong: string;
  spanish: string;
  /** Lema en lengua original (griego: Tischendorf 8a ed.; hebreo: en curso). */
  lemma?: string;
  /** Código morfológico Robinson (ej. "N-NSF"); hebreo usa códigos propios. */
  parsingCode?: string;
}

export interface InterlinearVerse {
  chapter: number;
  verse: number;
  words: InterlinearWord[];
}

/** Código Strong canónico (H/G + número) para una palabra, o null si no aplica. */
export function strongIdForWord(word: InterlinearWord, testament: InterlinearTestament): string | null {
  const num = parseInt(word.strong, 10);
  if (!Number.isInteger(num) || num < 1) return null;
  // Fuera del rango del diccionario no hay ficha (p. ej. 9007+ en hebreo).
  if (num > STRONG_RANGES[testament as StrongTestament].max) return null;
  return `${testament === 'greek' ? 'G' : 'H'}${num}`;
}

export function testamentLabel(testament: InterlinearTestament): string {
  return testament === 'greek' ? 'Griego' : 'Hebreo';
}
