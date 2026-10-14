/**
 * Alineación letra a letra entre el texto de una versión (WLC) y los tokens del
 * interlineal (STEPBible) para poder marcar términos Strong sobre el texto corrido.
 *
 * Por qué no basta con comparar palabra a palabra: el interlineal separa las
 * partículas pegadas al sustantivo (בְּ + רֵאשִׁית, הַ + שָּׁמַיִם) y añade marcas
 * de fin de versículo (׃ ס) que WLC no trae. Comparar tokens con palabras
 * separadas por espacios sólo acierta en el 1.5% de los versículos.
 *
 * El algoritmo recorre ambos textos en paralelo sobre las *letras* hebreas
 * (descartando puntos, cánticos, maqaf, sof pasuq y espacios) y tolera:
 *  - re-sincronización acotada cuando la versión tiene letras de más, y
 *  - prefijos cuando el interlineal agrega letras al final del token (fin de versículo).
 */

/** Rango de letras hebreas (U+05D0..U+05EA). */
const LETTER_MIN = 0x05d0;
const LETTER_MAX = 0x05ea;

/** Cuántas letras puede adelantar el cursor antes de abandonar un token. */
const MAX_RESYNC_LETTERS = 40;

/**
 * Fracción mínima de tokens que deben alinearse para considerar fiable el
 * resultado de un versículo. Por debajo se prefiere texto plano sin interacción
 * antes que vincular palabras al Strong equivocado.
 */
const MIN_ALIGNMENT_RATIO = 0.5;

export interface StrongToken {
  /** Texto del token tal cual viene del interlineal. */
  token: string;
  /** Código Strong canónico (H7225…) o null si el token no tiene ficha. */
  strongId: string | null;
  lemma?: string;
}

export interface TermSpan {
  /** Posiciones dentro del texto original de la versión. */
  start: number;
  end: number;
  strongId: string;
  lemma?: string;
}

function isHebrewLetter(cp: number): boolean {
  return cp >= LETTER_MIN && cp <= LETTER_MAX;
}

/**
 * Letras hebreas del texto con su posición en el string original.
 * Se aplica NFKD unidad por unidad de código para descomponer las formas de
 * presentación (U+FB2A/U+FB2B) sin romper el mapeo de índices.
 */
function letterIndex(raw: string): { letters: string[]; starts: number[]; ends: number[] } {
  const letters: string[] = [];
  const starts: number[] = [];
  const ends: number[] = [];
  for (let i = 0; i < raw.length;) {
    const cp = raw.codePointAt(i) ?? 0;
    const unit = cp > 0xffff ? 2 : 1;
    let seen = false;
    for (const piece of raw.slice(i, i + unit).normalize('NFKD')) {
      if (!isHebrewLetter(piece.codePointAt(0) ?? 0)) continue;
      if (!seen) {
        letters.push(piece);
        starts.push(i);
        seen = true;
      } else {
        // U+FB2A se descompone en letra + dagesh + punto: se anexa a la letra previa.
        letters[letters.length - 1] += piece;
      }
      ends[ends.length] = i + unit;
    }
    i += unit;
  }
  return { letters, starts, ends };
}

/** Letras hebreas de un token del interlineal, con el mismo criterio que `letterIndex`. */
function tokenLetters(token: string): string[] {
  return [...token.normalize('NFKD')].filter((c) => isHebrewLetter(c.codePointAt(0) ?? 0));
}

/**
 * Un punto, cántico o dagesh pegado a la letra anterior forma parte de la palabra:
 * sin esto el span cortaría "נֹ֥חַ" como "נֹ֥ח" y la vocal final quedaría fuera.
 * Maqaf, sof pasuq y paseq sí son separadores, por eso quedan excluidos.
 */
function isTrailingMark(cp: number): boolean {
  if (cp === 0x05be || cp === 0x05c0 || cp === 0x05c3 || cp === 0x05c6) return false;
  return (cp >= 0x0300 && cp <= 0x036f) || (cp >= 0x0591 && cp <= 0x05c7);
}

/** Extiende el final del span para incluir las marcas combinantes que le siguen. */
function withTrailingMarks(rawText: string, end: number): number {
  let i = end;
  while (i < rawText.length) {
    const cp = rawText.codePointAt(i) ?? 0;
    if (!isTrailingMark(cp)) break;
    i += cp > 0xffff ? 2 : 1;
  }
  return i;
}

function matchesAt(haystack: string[], needle: string[], at: number): boolean {
  for (let i = 0; i < needle.length; i++) {
    if (haystack[at + i] !== needle[i]) return false;
  }
  return true;
}

/**
 * Ubica cada token con Strong sobre el texto de la versión.
 * Devuelve un span por token alineado, en orden y sin solaparse.
 */
export function alignStrongTokens(rawText: string, tokens: StrongToken[]): TermSpan[] {
  const usable = tokens.filter((t) => t.strongId && tokenLetters(t.token).length > 0);
  if (usable.length === 0 || !rawText) return [];

  const { letters, starts, ends } = letterIndex(rawText);
  if (letters.length === 0) return [];

  const spans: TermSpan[] = [];
  let cursor = 0;

  for (const token of usable) {
    const needle = tokenLetters(token.token);
    // Un token de una letra (partículas ב/ו/ה) sólo casa exacto; para los demás se
    // exige al menos la mitad, para no vincular una raíz distinta por parecido.
    const floor = needle.length === 1 ? 1 : Math.max(2, Math.ceil(needle.length / 2));
    let at = -1;
    let len = 0;

    for (let skip = 0; skip <= MAX_RESYNC_LETTERS && cursor + skip < letters.length; skip++) {
      const pos = cursor + skip;
      let candidate = Math.min(needle.length, letters.length - pos);
      while (candidate >= floor && !matchesAt(letters, needle.slice(0, candidate), pos)) candidate--;
      if (candidate >= floor) {
        at = pos;
        len = candidate;
        break;
      }
    }

    if (at === -1) continue;
    spans.push({
      start: starts[at],
      end: withTrailingMarks(rawText, ends[at + len - 1]),
      strongId: token.strongId as string,
      lemma: token.lemma,
    });
    cursor = at + len;
  }

  // Datos interlineales desalineados (p. ej. 1 Cr 6, donde el versículo del JSON no
  // corresponde al de WLC) producirían enlaces Strong equivocados: mejor sin interacción.
  if (spans.length / usable.length < MIN_ALIGNMENT_RATIO) return [];

  return mergeAdjacent(spans);
}

/** Une spans contiguos que comparten Strong para no anidar elementos. */
function mergeAdjacent(spans: TermSpan[]): TermSpan[] {
  const out: TermSpan[] = [];
  for (const span of spans) {
    const last = out[out.length - 1];
    if (last && last.end === span.start && last.strongId === span.strongId) {
      last.end = span.end;
      continue;
    }
    out.push({ ...span });
  }
  return out;
}
