export type StrongTestament = 'hebrew' | 'greek';

export interface StrongEntry {
  /** Código canónico: H1..H9006 (hebreo: 8680 palabras + 6 partículas) o G1..G5624 (griego). */
  id: string;
  number: number;
  testament: StrongTestament;
  word: string;
  pronunciation: string;
  derivation: string;
  definition: string;
  rvDefinition: string;
  /** Glosa corta del léxico STEPBible (BSD-3-Clause), p. ej. "Dios". */
  stepGloss: string;
  /** Glosas alternativas del léxico STEPBible, p. ej. "dios, Dios". */
  stepDefinition: string;
  audioPath: string;
}

export const STRONG_RANGES: Record<StrongTestament, { max: number; label: string }> = {
  hebrew: { max: 9006, label: 'Hebreo' },
  greek: { max: 5624, label: 'Griego' },
};

const STRONG_ID_PATTERN = /^[HG]?\d+$/i;

export function normalizeStrongId(raw: string): string | null {
  const term = raw.trim().toUpperCase();
  if (!STRONG_ID_PATTERN.test(term)) return null;
  if (term.startsWith('H') || term.startsWith('G')) return term;
  return `H${term}`;
}

export function parseStrongId(id: string): { testament: StrongTestament; number: number } | null {
  const match = /^([HG])(\d+)$/.exec(id.trim().toUpperCase());
  if (!match) return null;
  const testament: StrongTestament = match[1] === 'G' ? 'greek' : 'hebrew';
  const number = parseInt(match[2], 10);
  if (number < 1 || number > STRONG_RANGES[testament].max) return null;
  return { testament, number };
}

const normalizeText = (str: string) =>
  str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export function matchesStrongQuery(entry: StrongEntry, query: string): boolean {
  const term = query.trim().toLowerCase();
  if (!term) return true;
  const normTerm = normalizeText(term);
  return (
    entry.id.toLowerCase().includes(term) ||
    entry.word.toLowerCase().includes(term) ||
    normalizeText(entry.pronunciation).includes(normTerm) ||
    normalizeText(entry.definition).includes(normTerm) ||
    normalizeText(entry.rvDefinition).includes(normTerm) ||
    normalizeText(entry.stepGloss).includes(normTerm) ||
    normalizeText(entry.stepDefinition).includes(normTerm)
  );
}
