/**
 * Palabras de Cristo como OVERLAY editorial (texto de referencia PDDPT).
 *
 * Cobertura real del dato: solo Mateo (289 versículos). Reglas honestas:
 * - Si la frase del overlay aparece en el texto del versículo (match
 *   difuso: minúsculas, sin diacríticos ni puntuación) → span preciso.
 * - Si el versículo está listado pero la frase no matchea (otra versión
 *   con redacción distinta) → versículo completo en rojo (fallback
 *   documentado en el tooltip como "cobertura por versículo").
 * - El nativo no existe en ninguna versión: no hay nada con qué chocar.
 *
 * El markup se renderiza siempre; `body.red-letters-on` lo tiñe (tokens.css),
 * así el toggle aplica al instante sin re-render.
 */

export type RedSource = 'phrase' | 'verse';

export interface RedSpan {
  start: number;
  end: number;
  source: RedSource;
}

/** Códigos del fichero (minúsculas) → códigos gateway. Hoy solo `mat`. */
export const REDLETTER_BOOK_MAP: Record<string, string> = {
  mat: 'MAT',
};

export type RedLettersIndex = Map<string, Map<number, Map<number, string[]>>>;
/** bookCode → chapter → verse → phrases */

interface RawPassages {
  passages?: unknown;
}

function normalizeText(text: string): { text: string; map: number[] } {
  const out: string[] = [];
  const map: number[] = [];
  const lower = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  for (let i = 0; i < lower.length; i++) {
    const ch = lower[i];
    if (ch === ' ' || ch === '\n' || ch === '\t') {
      if (out.length > 0 && out[out.length - 1] !== ' ') {
        out.push(' ');
        map.push(i);
      }
      continue;
    }
    if (/[a-z0-9ñ]/.test(ch)) {
      out.push(ch);
      map.push(i);
    }
    // Signos de puntuación/comillas: se omiten (pero conservan posición vía map).
  }
  return { text: out.join('').trim(), map };
}

/**
 * Normaliza el fichero red-letters.json a un índice gateway.
 * Tolera libros/capítulos/versículos desconocidos (se ignoran).
 */
export function normalizeRedLettersFile(raw: unknown): RedLettersIndex {
  const index: RedLettersIndex = new Map();
  if (typeof raw !== 'object' || raw === null) return index;
  const passages = (raw as RawPassages).passages;
  if (typeof passages !== 'object' || passages === null) return index;
  for (const [bookKey, chaptersRaw] of Object.entries(passages as Record<string, unknown>)) {
    const gateway = REDLETTER_BOOK_MAP[String(bookKey).toLowerCase()];
    if (!gateway || typeof chaptersRaw !== 'object' || chaptersRaw === null) continue;
    let bookMap = index.get(gateway);
    if (!bookMap) {
      bookMap = new Map();
      index.set(gateway, bookMap);
    }
    for (const [chapKey, versesRaw] of Object.entries(chaptersRaw as Record<string, unknown>)) {
      const chapter = Number(chapKey);
      if (!Number.isInteger(chapter) || typeof versesRaw !== 'object' || versesRaw === null) continue;
      let chapMap = bookMap.get(chapter);
      if (!chapMap) {
        chapMap = new Map();
        bookMap.set(chapter, chapMap);
      }
      for (const [verseKey, phrasesRaw] of Object.entries(versesRaw as Record<string, unknown>)) {
        const verse = Number(verseKey);
        if (!Number.isInteger(verse) || !Array.isArray(phrasesRaw)) continue;
        const phrases = phrasesRaw.map((p) => String(p ?? '').trim()).filter((p) => p.length > 0);
        if (phrases.length > 0) chapMap.set(verse, phrases);
      }
    }
  }
  return index;
}

/** Busca cada frase en el texto (coords originales). Evita solapes entre frases. */
export function findPhraseRanges(text: string, phrases: string[]): RedSpan[] {
  const { text: nt, map } = normalizeText(text);
  const used: boolean[] = new Array(nt.length).fill(false);
  const ranges: RedSpan[] = [];
  for (const phrase of phrases) {
    const np = normalizeText(phrase).text.trim();
    if (!np) continue;
    let from = 0;
    while (from <= nt.length - np.length) {
      const i = nt.indexOf(np, from);
      if (i < 0) break;
      let overlap = false;
      for (let k = i; k < i + np.length; k++) {
        if (used[k]) {
          overlap = true;
          break;
        }
      }
      if (!overlap) {
        for (let k = i; k < i + np.length; k++) used[k] = true;
        ranges.push({ start: map[i], end: map[i + np.length - 1] + 1, source: 'phrase' as RedSource });
      }
      from = i + 1;
    }
  }
  ranges.sort((a, b) => a.start - b.start);
  return ranges;
}

/**
 * Resuelve los spans rojos de un versículo: match preciso si hay,
 * fallback a versículo completo si está listado pero no matchea.
 */
export function resolveRedSpans(verseText: string, phrases: readonly string[]): RedSpan[] {
  if (phrases.length === 0) return [];
  const ranges = findPhraseRanges(verseText, [...phrases]);
  if (ranges.length > 0) return ranges;
  if (verseText.trim().length === 0) return [];
  return [{ start: 0, end: verseText.length, source: 'verse' }];
}
