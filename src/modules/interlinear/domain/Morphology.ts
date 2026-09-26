import type { InterlinearTestament, InterlinearWord } from './InterlinearVerse';

/** Expansión en español de códigos morfológicos (Robinson para griego,
 *  estilo Westminster con puntos para hebreo). Esquemas públicos.
 *  La redacción es la terminología morfolológica habitual en español, para que
 *  el análisis de cada palabra se lea de un vistazo. */

const GREEK_POS: Record<string, string> = {
  N: 'sustantivo',
  A: 'adjetivo',
  R: 'pronombre',
  C: 'conjunción',
  D: 'adverbio',
  T: 'artículo',
  K: 'correlativo',
  I: 'interjección',
  P: 'preposición',
  V: 'verbo',
  X: 'partícula',
};

/** Códigos Robinson de palabra completa (sin guion). */
const GREEK_WORD_CODES: Record<string, string> = {
  PREP: 'preposición',
  PRT: 'partícula',
  ADV: 'adverbio',
  CONJ: 'conjunción',
  NEG: 'negación',
};

const GREEK_CASE: Record<string, string> = {
  N: 'nominativo',
  G: 'genitivo',
  D: 'dativo',
  A: 'acusativo',
  V: 'vocativo',
};

const GREEK_NUMBER: Record<string, string> = { S: 'singular', P: 'plural' };
const GREEK_GENDER: Record<string, string> = {
  M: 'masculino',
  F: 'femenino',
  N: 'neutro',
};

const GREEK_TENSE: Record<string, string> = {
  P: 'presente',
  I: 'imperfecto',
  F: 'futuro',
  A: 'aoristo',
  R: 'perfecto',
  L: 'pluscuamperfecto',
};

const GREEK_VOICE: Record<string, string> = {
  A: 'activo',
  M: 'medio',
  P: 'pasivo',
  E: 'medio o pasivo',
  D: 'deponente',
  O: 'pasivo deponente',
  N: 'deponente medio o pasivo',
};

const GREEK_MOOD: Record<string, string> = {
  I: 'indicativo',
  S: 'subjuntivo',
  O: 'optativo',
  M: 'imperativo',
  N: 'infinitivo',
  P: 'participio',
};

const HEBREW_TOKEN: Record<string, string> = {
  SUBS: 'sustantivo',
  VERBO: 'verbo',
  VERB: 'verbo',
  ADJ: 'adjetivo',
  ADJV: 'adjetivo',
  ADVB: 'adverbio',
  ADV: 'adverbio',
  PREP: 'preposición',
  CONJ: 'conjunción',
  ART: 'artículo',
  PRON: 'pronombre',
  PART: 'partícula',
  PRT: 'partícula',
  INRG: 'interrogativo',
  NEG: 'negación',
  NEGA: 'negativo partícula',
  NUM: 'numeral',
  INTERJ: 'interjección',
  NMPR: 'nombre propio',
  PRDE: 'demonstrative pronombre',
  QAL: 'qal',
  NIFAL: 'nifal',
  PIEL: 'piel',
  PUAL: 'pual',
  HIF: 'hifil',
  HIFIL: 'hifil',
  HOFAL: 'hofal',
  HITPAEL: 'hitpael',
  PERF: 'perfecto',
  IMPF: 'imperfecto',
  IMPV: 'imperativo',
  IMP: 'imperativo',
  INF: 'infinitivo',
  INFC: 'infinitivo (construct)',
  PTC: 'participio',
  PTCA: 'participio',
  PTCPSV: 'participio pasivo',
  PTCP: 'participio',
  WAYQ: 'wayyiqtol',
  P1: '1ª persona',
  P2: '2ª persona',
  P3: '3ª persona',
  M: 'masculino',
  F: 'femenino',
  B: 'ambos',
  U: 'desconocido',
  SG: 'singular',
  PL: 'plural',
  DU: 'dual',
  A: 'absoluto',
  K: 'constructivo',
  E: 'enfático',
  DET: 'determinado',
  SUF: 'con sufijo',
  PRS: 'pronominal sufijo',
  JUS: 'yusivo',
  COH: 'cohortativo',
};

function describeGreekNounLike(pos: string, data: string): string | null {
  const base = GREEK_POS[pos];
  if (!base) return null;
  if (data === 'PRI') return `${base} apropiado`;
  const parts = [base];
  const m = /^([NGDAV])([SP])([MFN])(.*)$/.exec(data);
  if (!m) return null;
  const kase = GREEK_CASE[m[1]];
  const num = GREEK_NUMBER[m[2]];
  const gen = GREEK_GENDER[m[3]];
  if (!kase || !num || !gen) return null;
  parts.push(kase, num, gen);
  const suffix = m[4];
  if (suffix === 'K') parts.push('comparativo');
  else if (suffix === 'S') parts.push('superlativo');
  else if (suffix) return null;
  return parts.join(' ');
}

function describeGreekVerb(data: string): string | null {
  const m = /^([PIFARL])([AMPEDON])([ISOMNP])?(?:-([123])([SP]))?$/.exec(data.replace(' ', ''));
  if (!m) return null;
  const tense = GREEK_TENSE[m[1]];
  const voice = GREEK_VOICE[m[2]];
  if (!tense || !voice) return null;
  const parts = ['verbo', tense, voice];
  if (m[3]) {
    const mood = GREEK_MOOD[m[3]];
    if (!mood) return null;
    parts.push(mood);
  }
  if (m[4]) {
    const num = GREEK_NUMBER[m[5]];
    if (!num) return null;
    parts.push(`${m[4]}ª persona`, num);
  }
  return parts.join(' ');
}

export function describeGreekCode(code: string): string | null {
  const clean = code.trim().toUpperCase();
  if (!clean) return null;
  if (GREEK_POS[clean] || GREEK_WORD_CODES[clean]) return GREEK_POS[clean] ?? GREEK_WORD_CODES[clean];
  const dash = clean.indexOf('-');
  if (dash > 0) {
    const pos = clean.slice(0, dash);
    const data = clean.slice(dash + 1);
    if (pos === 'V') return describeGreekVerb(data);
    if (['N', 'A', 'R', 'C', 'T', 'K', 'P', 'D', 'I', 'X'].includes(pos)) {
      return describeGreekNounLike(pos, data) ?? expandGreekTail(data);
    }
    return null;
  }
  return null;
}

/** Greek prepositions/adverbs take a tail code (e.g. P-GSM → "preposición genitivo singular masculino"). */
function expandGreekTail(data: string): string | null {
  const m = /^([NGDAVSP])([SPMFN])(.*)$/.exec(data);
  if (!m) return null;
  const head = GREEK_CASE[m[1]] ?? (m[1] === 'S' ? 'superlativo' : null);
  const num =
    GREEK_NUMBER[m[2]] ?? (m[2] === 'F' ? 'femenino' : m[2] === 'M' ? 'masculino' : m[2] === 'N' ? 'neutro' : null);
  if (!head || !num) return null;
  return [head, num].join(' ');
}

export function describeHebrewCode(code: string): string | null {
  const clean = code.trim().toUpperCase();
  if (!clean) return null;
  const tokens = clean.split(/[./]/);
  const parts = tokens
    .map((token, index) => {
      const bare = token.replace(/^[0-9]+$/, '');
      // "C" es ambiguo: al final del código es el estado constructivo
      // (SUBS.M.SG.C) y en medio el género común (SUBS.C.SG.A).
      if (bare === 'C') return index === tokens.length - 1 ? 'constructivo' : 'común';
      return HEBREW_TOKEN[token] ?? HEBREW_TOKEN[bare] ?? null;
    })
    .filter((t): t is string => t !== null);
  if (parts.length === 0) return null;
  return parts.join(' ');
}

/** Descripción en español de un parsingCode según testamento, o null. */
export function describeParsingCode(code: string | undefined, testament: InterlinearTestament): string | null {
  if (!code) return null;
  return testament === 'greek' ? describeGreekCode(code) : describeHebrewCode(code);
}

/**
 * Descripción morfológica legible de una palabra.
 *
 * En griego la fuente ya entrega la descripción en español con guiones
 * ("Sustantivo-Dativo-Singular-Femenino"), que respeta la concordancia y
 * cubre códigos que Robinson no desglosa (2 aoristos, deponentes…), así que se
 * usa esa y se normaliza a minúsculas separadas por espacios. En hebreo se
 * expande el código de Westminster; si queda algún token suelto se recurre al
 * `parsing` de la fuente.
 */
export function describeWord(
  word: Pick<InterlinearWord, 'parsing' | 'parsingCode'>,
  testament: InterlinearTestament,
): string | null {
  const raw = (word.parsing || '').trim();
  if (testament === 'greek') {
    if (raw)
      return raw
        .replace(/[-–—]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
    return describeGreekCode(word.parsingCode ?? '');
  }
  return describeParsingCode(word.parsingCode, testament) ?? (raw ? describeHebrewCode(raw) : null);
}
