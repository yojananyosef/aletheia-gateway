/**
 * Títulos de sección (perícopas) como OVERLAY editorial.
 *
 * Regla anti-choque: el texto nativo de cada versión SIEMPRE gana.
 * El overlay NRVA solo rellena versículos cuyas `headings` nativas estén
 * vacías/ausentes (ONBV, PDDPT y SpaPlatense ya traen las suyas y no se tocan).
 * Los JSON de versiones no se mutan: el overlay vive en
 * `public/data/headings/headers.json` y se fusiona solo en render.
 */

export interface OverlayHeading {
  text: string;
  /** Número de versículo ANTES del cual se muestra el título. */
  verse: number;
}

/** Códigos OSIS (headers.json) → códigos gateway en mayúsculas. */
export const OSIS_TO_GATEWAY: Record<string, string> = {
  Gen: 'GEN',
  Exod: 'EXO',
  Lev: 'LEV',
  Num: 'NUM',
  Deut: 'DEU',
  Josh: 'JOS',
  Judg: 'JDG',
  Ruth: 'RUT',
  '1Sam': '1SA',
  '2Sam': '2SA',
  '1Kgs': '1KI',
  '2Kgs': '2KI',
  '1Chr': '1CH',
  '2Chr': '2CH',
  Ezra: 'EZR',
  Neh: 'NEH',
  Esth: 'EST',
  Job: 'JOB',
  Ps: 'PSA',
  Prov: 'PRO',
  Eccl: 'ECC',
  Song: 'SNG',
  Isa: 'ISA',
  Jer: 'JER',
  Lam: 'LAM',
  Ezek: 'EZK',
  Dan: 'DAN',
  Hos: 'HOS',
  Joel: 'JOL',
  Amos: 'AMO',
  Obad: 'OBA',
  Jonah: 'JON',
  Mic: 'MIC',
  Nah: 'NAM',
  Hab: 'HAB',
  Zeph: 'ZEP',
  Hag: 'HAG',
  Zech: 'ZEC',
  Mal: 'MAL',
  Matt: 'MAT',
  Mark: 'MRK',
  Luke: 'LUK',
  John: 'JHN',
  Acts: 'ACT',
  Rom: 'ROM',
  '1Cor': '1CO',
  '2Cor': '2CO',
  Gal: 'GAL',
  Eph: 'EPH',
  Phil: 'PHP',
  Col: 'COL',
  '1Thess': '1TH',
  '2Thess': '2TH',
  '1Tim': '1TI',
  '2Tim': '2TI',
  Titus: 'TIT',
  Phlm: 'PHM',
  Heb: 'HEB',
  Jas: 'JAS',
  '1Pet': '1PE',
  '2Pet': '2PE',
  '1John': '1JN',
  '2John': '2JN',
  '3John': '3JN',
  Jude: 'JUD',
  Rev: 'REV',
};

export type HeadingsIndex = Map<string, Map<number, OverlayHeading[]>>;

interface RawHeadingContent {
  text?: unknown;
  verse?: unknown;
}

interface RawChapter {
  chapter?: unknown;
  type?: unknown;
  content?: unknown;
}

interface RawBook {
  osis?: unknown;
  chapters?: unknown;
}

/**
 * Normaliza el fichero headers.json a un índice gateway.
 * Tolera `data` como lista de libros o lista-de-listas (formato NRVA real).
 * Ignora entradas `verse` (contenido vacío) y códigos OSIS desconocidos.
 */
export function normalizeHeadersFile(raw: unknown): HeadingsIndex {
  const index: HeadingsIndex = new Map();
  if (typeof raw !== 'object' || raw === null) return index;
  const data = (raw as { data?: unknown }).data;
  const books: unknown[] = Array.isArray(data) ? data.flat() : [];
  for (const b of books) {
    const book = b as RawBook;
    if (typeof book !== 'object' || book === null) continue;
    const gateway = OSIS_TO_GATEWAY[String(book.osis ?? '')];
    if (!gateway || !Array.isArray(book.chapters)) continue;
    let chapterMap = index.get(gateway);
    if (!chapterMap) {
      chapterMap = new Map();
      index.set(gateway, chapterMap);
    }
    for (const c of book.chapters as RawChapter[]) {
      if (typeof c !== 'object' || c === null) continue;
      if (c.type !== 'heading' || !Array.isArray(c.content)) continue;
      const chapterNum = Number(c.chapter);
      if (!Number.isInteger(chapterNum)) continue;
      const items: OverlayHeading[] = [];
      for (const item of c.content as RawHeadingContent[]) {
        if (typeof item !== 'object' || item === null) continue;
        const text = String(item.text ?? '').trim();
        const verse = Number(item.verse);
        if (!text || !Number.isInteger(verse)) continue;
        items.push({ text, verse });
      }
      if (items.length > 0) chapterMap.set(chapterNum, items);
    }
  }
  return index;
}

export type HeadingSource = 'native' | 'overlay' | 'none';

export interface ResolvedHeadings {
  texts: string[];
  source: HeadingSource;
}

/**
 * Fusión por versículo: nativo gana, overlay solo si no hay nativo.
 * `native` son las `headings` de la versión; `overlay` los textos del
 * índice para ese (libro, capítulo, versículo).
 */
export function resolveVerseHeadings(
  native: readonly string[] | undefined,
  overlay: readonly string[],
): ResolvedHeadings {
  const cleanNative = (native ?? []).map((t) => t.trim()).filter(Boolean);
  if (cleanNative.length > 0) return { texts: cleanNative, source: 'native' };
  const cleanOverlay = overlay.map((t) => t.trim()).filter(Boolean);
  if (cleanOverlay.length > 0) return { texts: cleanOverlay, source: 'overlay' };
  return { texts: [], source: 'none' };
}
