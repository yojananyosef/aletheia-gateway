export type InterlinearTestament = 'hebrew' | 'greek';

export interface InterlinearWord {
  /** Palabra original (hebreo con niqqud o griego politónico). */
  text: string;
  parsing: string;
  /** Número Strong sin prefijo (ej. "7225"); "9001".."9006" son partículas gramaticales. */
  strong: string;
  spanish: string;
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
  // Los códigos 9001+ son partículas gramaticales de la fuente, sin entrada en el diccionario.
  const max = testament === 'greek' ? 5624 : 8680;
  if (num > max) return null;
  return `${testament === 'greek' ? 'G' : 'H'}${num}`;
}

export function testamentLabel(testament: InterlinearTestament): string {
  return testament === 'greek' ? 'Griego' : 'Hebreo';
}
