import type { InterlinearTestament } from './InterlinearVerse';

/** Expansión en español de códigos morfológicos (Robinson para griego,
 *  estilo Westminster con puntos para hebreo). Esquemas públicos. */

const GREEK_POS: Record<string, string> = {
  N: 'sustantivo', A: 'adjetivo', R: 'pronombre', C: 'conjunción',
  D: 'adverbio', T: 'artículo', K: 'correlativo', I: 'interjección',
  P: 'preposición', V: 'verbo', X: 'partícula',
};

/** Códigos Robinson de palabra completa (sin guion). */
const GREEK_WORD_CODES: Record<string, string> = {
  PREP: 'preposición', PRT: 'partícula', ADV: 'adverbio', CONJ: 'conjunción',
  NEG: 'negación',
};

const GREEK_CASE: Record<string, string> = {
  N: 'nominativo', G: 'genitivo', D: 'dativo', A: 'acusativo', V: 'vocativo',
};

const GREEK_NUMBER: Record<string, string> = { S: 'singular', P: 'plural' };
const GREEK_GENDER: Record<string, string> = {
  M: 'masculino', F: 'femenino', N: 'neutro',
};

const GREEK_TENSE: Record<string, string> = {
  P: 'presente', I: 'imperfecto', F: 'futuro', A: 'aoristo',
  R: 'perfecto', L: 'pluscuamperfecto',
};

const GREEK_VOICE: Record<string, string> = {
  A: 'activa', M: 'media', P: 'pasiva', E: 'media o pasiva',
  D: 'media deponente', O: 'pasiva deponente', N: 'deponente media o pasiva',
};

const GREEK_MOOD: Record<string, string> = {
  I: 'indicativo', S: 'subjuntivo', O: 'optativo', M: 'imperativo',
  N: 'infinitivo', P: 'participio',
};

const HEBREW_TOKEN: Record<string, string> = {
  SUBS: 'sustantivo', VERBO: 'verbo', ADJ: 'adjetivo', ADV: 'adverbio',
  PREP: 'preposición', CONJ: 'conjunción', ART: 'artículo', PRON: 'pronombre',
  PART: 'partícula', INRG: 'interrogativo', NEG: 'negación', NUM: 'numeral',
  INTERJ: 'interjección',
  QAL: 'qal', NIFAL: 'nifal', PIEL: 'piel', PUAL: 'pual',
  HIFIL: 'hifil', HOFAL: 'hofal', HITPAEL: 'hitpael',
  PERF: 'perfecto', IMPF: 'imperfecto', IMP: 'imperativo', INF: 'infinitivo',
  PTC: 'participio', PTCPSV: 'participio pasivo',
  P1: '1ª persona', P2: '2ª persona', P3: '3ª persona',
  M: 'masculino', F: 'femenino', C: 'común', B: 'ambos',
  SG: 'singular', PL: 'plural', DU: 'dual',
  A: 'absoluto', K: 'constructo', E: 'enfático', DET: 'determinado',
  SUF: 'con sufijo', JUS: 'yusivo', COH: 'cohortativo',
};

function describeGreekNounLike(pos: string, data: string): string | null {
  const base = GREEK_POS[pos];
  if (!base) return null;
  if (data === 'PRI') return `${base} propio`;
  const parts = [base];
  const m = /^([NGDAV])([SP])([MFN])(.*)$/.exec(data);
  if (!m) return data ? `${base} ${data}` : base;
  parts.push(GREEK_CASE[m[1]] ?? m[1], GREEK_NUMBER[m[2]] ?? m[2], GREEK_GENDER[m[3]] ?? m[3]);
  const suffix = m[4];
  if (suffix === 'K') parts.push('comparativo');
  else if (suffix === 'S') parts.push('superlativo');
  else if (suffix) parts.push(suffix);
  return parts.join(' ');
}

function describeGreekVerb(data: string): string | null {
  const m = /^([PIFARL])([AMPEDON])([ISOMNP])?(?:-([123])([SP]))?$/.exec(data.replace(' ', ''));
  if (!m) return data || null;
  const parts = [
    'verbo',
    GREEK_TENSE[m[1]] ?? m[1],
    GREEK_VOICE[m[2]] ?? m[2],
    m[3] ? (GREEK_MOOD[m[3]] ?? m[3]) : null,
    m[4] ? `${m[4]}ª persona` : null,
    m[5] ? (GREEK_NUMBER[m[5]] ?? m[5]) : null,
  ].filter(Boolean);
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
    if (['N', 'A', 'R', 'C', 'T', 'K'].includes(pos)) return describeGreekNounLike(pos, data);
    return `${GREEK_POS[pos] ?? pos} ${data}`;
  }
  return null;
}

export function describeHebrewCode(code: string): string | null {
  const clean = code.trim().toUpperCase();
  if (!clean) return null;
  const parts = clean.split(/[./]/).map((t) => HEBREW_TOKEN[t] ?? t.toLowerCase());
  return parts.join(' ');
}

/** Descripción en español de un parsingCode según testamento, o null. */
export function describeParsingCode(code: string | undefined, testament: InterlinearTestament): string | null {
  if (!code) return null;
  return testament === 'greek' ? describeGreekCode(code) : describeHebrewCode(code);
}
