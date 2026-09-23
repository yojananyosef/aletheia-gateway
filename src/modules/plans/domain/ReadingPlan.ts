/**
 * Planes de lectura ES (port de NRVA `src/data/plans.json` + `plan-content/*.json`).
 * Los 10 planes diarios usan claves de día "1".."N"; los 5 ficheros `es_*`
 * son libros EGW completos de referencia ({ metadata, chapters }).
 *
 * annual-thematic referencia lectura complementaria como
 * `{ label, chapterId }` SIN contenido inline: se resuelve contra los
 * libros EGW (`getEgwChapter`). El resto de planes trae `content` inline.
 */

export interface PlanIndexEntry {
  id: string;
  title: string;
  description: string;
  durationDays: number;
  category: string;
  url: string;
}

export interface PlanDayBibleRef {
  book: string;
  chapter: number;
  label: string;
}

export interface PlanDayEgw {
  label: string;
  /** Texto inline (planes temáticos). Ausente en annual-thematic. */
  content?: string;
  /** Capítulo del libro EGW (annual-thematic). Se resuelve vía `getEgwChapter`. */
  chapterId?: number;
}

export interface PlanDay {
  title: string;
  description: string;
  bible: PlanDayBibleRef[];
  egw: PlanDayEgw[];
}

export type PlanContent = Record<string, PlanDay>;

export interface EgwSection {
  title?: string;
  content: string;
}

export interface EgwChapter {
  number: number;
  title: string;
  sections: EgwSection[];
}

/** Prefijo del label EGW → fichero en `/data/plans/content/`. */
export const EGW_BOOK_FILES: Record<string, string> = {
  'Patriarcas y Profetas': 'es_PP54(PP)',
  'Profetas y Reyes': 'es_PR(PK)',
  'El Deseado de todas las gentes': 'es_DTG(DA)',
  'Los Hechos de los apóstoles': 'es_HAp(AA)',
  'El Conflicto de los siglos': 'es_CS(GC)',
};

export function resolveEgwBookFile(label: string): string | null {
  for (const [prefix, fileId] of Object.entries(EGW_BOOK_FILES)) {
    if (label.startsWith(prefix)) return fileId;
  }
  return null;
}

export function isEgwBook(data: unknown): boolean {
  if (typeof data !== 'object' || data === null) return false;
  const d = data as Record<string, unknown>;
  return 'metadata' in d && 'chapters' in d;
}

/** Normaliza un día crudo (tolerante a campos ausentes: annual-thematic día 240). */
export function normalizePlanDay(raw: unknown): PlanDay {
  if (typeof raw !== 'object' || raw === null) {
    return { title: '', description: '', bible: [], egw: [] };
  }
  const d = raw as Record<string, unknown>;
  const bible = Array.isArray(d.bible)
    ? (d.bible as Record<string, unknown>[])
        .filter((r) => typeof r === 'object' && r !== null)
        .map((r) => ({
          book: String(r.book ?? ''),
          chapter: Number(r.chapter ?? 0),
          label: String(r.label ?? ''),
        }))
        .filter((r) => r.label.length > 0)
    : [];
  const egw = Array.isArray(d.egw)
    ? (d.egw as Record<string, unknown>[])
        .filter((e) => typeof e === 'object' && e !== null)
        .map((e) => {
          const entry: PlanDayEgw = { label: String(e.label ?? '') };
          if (typeof e.content === 'string') entry.content = e.content;
          if (Number.isInteger(e.chapterId)) entry.chapterId = e.chapterId as number;
          return entry;
        })
        .filter((e) => e.label.length > 0)
    : [];
  return {
    title: typeof d.title === 'string' ? d.title : '',
    description: typeof d.description === 'string' ? d.description : '',
    bible,
    egw,
  };
}

export function normalizePlanContent(raw: unknown): PlanContent {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return {};
  const out: PlanContent = {};
  for (const [key, day] of Object.entries(raw as Record<string, unknown>)) {
    out[key] = normalizePlanDay(day);
  }
  return out;
}

export function planDayCount(content: PlanContent): number {
  return Object.keys(content).length;
}
