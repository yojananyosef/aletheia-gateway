/**
 * Alineación letra a letra entre el texto de una versión (WLC, WHNU…) y los tokens
 * del interlineal (STEPBible) para marcar términos Strong sobre el texto corrido.
 *
 * Por qué no basta comparar palabra a palabra: en hebreo el interlineal separa las
 * partículas pegadas al sustantivo (בְּ + רֵאשִׁית, הַ + שָּׁמַיִם) y añade marcas de
 * fin de versículo (׃ ס) que WLC no trae; comparar tokens con palabras separadas
 * por espacios acierta en el 1.5% de los versículos. En griego WHNU viene sin
 * acentuar y con corchetes de aparato (του δε [ιησου] ιησου), que tampoco coinciden
 * palabra a palabra con los tokens acentuados.
 *
 * El algoritmo recorre ambos textos en paralelo sobre las *letras* del alfabeto,
 * descartando puntos, cánticos, acentos, puntuación y espacios, y tolera:
 *  - re-sincronización acotada cuando la versión tiene letras de más, y
 *  - prefijos cuando el interlineal agrega letras al final del token (fin de versículo).
 */

import type { InterlinearTestament } from './InterlinearVerse';

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
  /** Código Strong canónico (H7225…, G2424…) o null si el token no tiene ficha. */
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

/** Letras que cuentan para la comparación, por testamento. */
function isScriptLetter(cp: number, testament: InterlinearTestament): boolean {
  if (testament === 'hebrew') return cp >= 0x05d0 && cp <= 0x05ea;
  // Griego mayúsculas/minúsculas más las formas arcaicas que usa el poliptónico.
  return (
    (cp >= 0x0391 && cp <= 0x03a9) ||
    (cp >= 0x03b1 && cp <= 0x03c9) ||
    (cp >= 0x03d0 && cp <= 0x03d5) ||
    (cp >= 0x03f0 && cp <= 0x03f1) ||
    cp === 0x03f5 ||
    cp === 0x03f6
  );
}

/**
 * Normaliza una letra para comparar. El hebreo no distingue mayúsculas, pero en
 * griego el interlineal abre frase con mayúscula ("Βίβλος") y WHNU va siempre en
 * minúscula ("βιβλος"), así que hay que plegar. La sigma final (ς) se pliega a su
 * forma medial porque es la misma letra.
 */
function foldLetter(letter: string): string {
  const lower = letter.toLowerCase();
  return lower === 'ς' ? 'σ' : lower;
}

/**
 * Letras del texto con su posición en el string original.
 * Se aplica NFKD unidad por unidad de código para descomponer las formas de
 * presentación (hebreo U+FB2A/U+FB2B, griego U+03D0…) sin romper los índices.
 */
function letterIndex(
  raw: string,
  testament: InterlinearTestament,
): { letters: string[]; starts: number[]; ends: number[] } {
  const letters: string[] = [];
  const starts: number[] = [];
  const ends: number[] = [];
  for (let i = 0; i < raw.length;) {
    const cp = raw.codePointAt(i) ?? 0;
    const unit = cp > 0xffff ? 2 : 1;
    let seen = false;
    for (const piece of raw.slice(i, i + unit).normalize('NFKD')) {
      if (!isScriptLetter(piece.codePointAt(0) ?? 0, testament)) continue;
      if (!seen) {
        letters.push(foldLetter(piece));
        starts.push(i);
        seen = true;
      } else {
        // U+FB2A se descompone en letra + dagesh + punto: se anexa a la letra previa.
        letters[letters.length - 1] += foldLetter(piece);
      }
      ends[ends.length] = i + unit;
    }
    i += unit;
  }
  return { letters, starts, ends };
}

/** Letras de un token del interlineal, con el mismo criterio que `letterIndex`. */
function tokenLetters(token: string, testament: InterlinearTestament): string[] {
  return [...token.normalize('NFKD')].filter((c) => isScriptLetter(c.codePointAt(0) ?? 0, testament)).map(foldLetter);
}

/**
 * Un punto, cántico, dagesh o acento pegado a la letra anterior forma parte de la
 * palabra: sin esto el span cortaría "נֹ֥חַ" como "נֹ֥ח" y dejaría la vocal fuera.
 * Maqaf, sof pasuq y paseq sí son separadores, por eso quedan excluidos.
 */
function isTrailingMark(cp: number, testament: InterlinearTestament): boolean {
  if (cp >= 0x0300 && cp <= 0x036f) return true;
  if (testament === 'hebrew') {
    if (cp === 0x05be || cp === 0x05c0 || cp === 0x05c3 || cp === 0x05c6) return false;
    return cp >= 0x0591 && cp <= 0x05c7;
  }
  // Griego: tonos U+0384..U+038A y poliptónico U+1F00..U+1FFF.
  return (cp >= 0x0384 && cp <= 0x038a) || (cp >= 0x1f00 && cp <= 0x1fff);
}

/** Extiende el final del span para incluir las marcas combinantes que le siguen. */
function withTrailingMarks(rawText: string, end: number, testament: InterlinearTestament): number {
  let i = end;
  while (i < rawText.length) {
    const cp = rawText.codePointAt(i) ?? 0;
    if (!isTrailingMark(cp, testament)) break;
    i += cp > 0xffff ? 2 : 1;
  }
  return i;
}

/**
 * Cuando el token casó sólo por prefijo, el final puede quedar a mitad de palabra:
 * WHNU escribe "δαυιδ" donde el interlineal trae "Δαυεὶδ" (variante textual real).
 * Sin extender, el término quedaría partido. Se alarga hasta el fin de la palabra
 * del texto fuente, que es la unidad que el usuario ve y selecciona.
 * Se exige un mínimo de letras casadas para no arrastrar palabras por un parecido corto.
 */
const MIN_SPAN_LETTERS_TO_EXTEND = 3;

function wordEndLimit(rawText: string, end: number, testament: InterlinearTestament): number {
  let i = end;
  while (i < rawText.length) {
    const cp = rawText.codePointAt(i) ?? 0;
    if (!isScriptLetter(cp, testament)) break;
    i += cp > 0xffff ? 2 : 1;
  }
  return withTrailingMarks(rawText, i, testament);
}

/**
 * Alarga los spans que casaron sólo por prefijo hasta el fin de la palabra, sin
 * pasar del inicio del span siguiente: los spans están ordenados y no pueden
 * solaparse, o el texto emitido quedaría duplicado.
 */
function extendPartialSpans(
  rawText: string,
  partialFlags: boolean[],
  spans: TermSpan[],
  testament: InterlinearTestament,
): void {
  for (let i = 0; i < spans.length; i++) {
    if (!partialFlags[i]) continue;
    const limit = i + 1 < spans.length ? spans[i + 1].start : rawText.length;
    if (spans[i].end < limit) spans[i].end = Math.min(wordEndLimit(rawText, spans[i].end, testament), limit);
  }
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
export function alignStrongTokens(rawText: string, tokens: StrongToken[], testament: InterlinearTestament): TermSpan[] {
  const usable = tokens.filter((t) => t.strongId && tokenLetters(t.token, testament).length > 0);
  if (usable.length === 0 || !rawText) return [];

  const { letters, starts, ends } = letterIndex(rawText, testament);
  if (letters.length === 0) return [];

  const spans: TermSpan[] = [];
  const partialFlags: boolean[] = [];
  let cursor = 0;

  for (const token of usable) {
    const needle = tokenLetters(token.token, testament);
    // Un token de una letra (partículas hebreas ב/ו/ה) sólo casa exacto; para los demás
    // se exige al menos la mitad, para no vincular una raíz distinta por parecido.
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
    const partial = len < needle.length;
    if (partial && len < MIN_SPAN_LETTERS_TO_EXTEND) {
      // Prefijo demasiado corto para confiar: se descarta antes que inventar un término.
      continue;
    }
    spans.push({
      start: starts[at],
      end: withTrailingMarks(rawText, ends[at + len - 1], testament),
      strongId: token.strongId as string,
      lemma: token.lemma,
    });
    partialFlags.push(partial);
    cursor = at + len;
  }

  // Datos interlineales desalineados (p. ej. 1 Cr 6, donde el versículo del JSON no
  // corresponde al de WLC) producirían enlaces Strong equivocados: mejor sin interacción.
  if (spans.length / usable.length < MIN_ALIGNMENT_RATIO) return [];

  extendPartialSpans(rawText, partialFlags, spans, testament);

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
