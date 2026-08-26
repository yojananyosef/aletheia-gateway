export type TranslationId =
  // Español (9)
  | 'RV1909'
  | 'BES'
  | 'VBL'
  | 'PDDPT'
  | 'ONBV'
  | 'BLL'
  | 'BLM'
  | 'SpaPlatense'
  | 'SpaRVG'
  // Inglés (7)
  | 'KJV'
  | 'ASV'
  | 'Darby'
  | 'Rotherham'
  | 'Noyes'
  | 'Tyndale'
  | 'Wycliffe'
  // Alemán (1)
  | 'GerBoLut'
  // Griego Antiguo y Koiné (2)
  | 'LXX'
  | 'WHNU'
  // Hebreo Bíblico (1)
  | 'WLC';

export interface TranslationInfo {
  id: TranslationId;
  name: string;
  shortName: string;
  language: string;
  languageName?: string;
  direction?: 'ltr' | 'rtl';
  description?: string;
  copyright?: string;
  hasDeuterocanonical?: boolean;
}

export const AVAILABLE_TRANSLATIONS: Record<TranslationId, TranslationInfo> = {
  // === ESPAÑOL ===
  RV1909: {
    id: 'RV1909',
    name: 'Reina Valera 1909',
    shortName: 'RV1909',
    language: 'es',
    languageName: 'Español',
    direction: 'ltr',
    description: 'Traducción clásica histórica en español, fiel al Texto Recibido.',
    copyright: 'Dominio Público',
    hasDeuterocanonical: false,
  },
  BES: {
    id: 'BES',
    name: 'Biblia en Español Sencillo',
    shortName: 'BES',
    language: 'es',
    languageName: 'Español',
    direction: 'ltr',
    description: 'Lenguaje contemporáneo accesible y directo de AudioBiblia.org.',
    copyright: 'Creative Commons Atribución 4.0 Internacional (CC BY 4.0)',
    hasDeuterocanonical: false,
  },
  VBL: {
    id: 'VBL',
    name: 'Versión Biblia Libre',
    shortName: 'VBL',
    language: 'es',
    languageName: 'Español',
    direction: 'ltr',
    description: 'Traducción moderna y transparente con abundantes notas de estudio.',
    copyright: 'Creative Commons Atribución-CompartirIgual 4.0 (CC BY-SA 4.0)',
    hasDeuterocanonical: false,
  },
  PDDPT: {
    id: 'PDDPT',
    name: 'Palabra de Dios para ti',
    shortName: 'PDDPT',
    language: 'es',
    languageName: 'Español',
    direction: 'ltr',
    description: 'Traducción fiel y contextual de la Asociación Bíblica Latinoamericana.',
    copyright: 'Creative Commons Atribución 4.0 (CC BY 4.0)',
    hasDeuterocanonical: false,
  },
  ONBV: {
    id: 'ONBV',
    name: 'Open Nueva Biblia Viva',
    shortName: 'ONBV',
    language: 'es',
    languageName: 'Español',
    direction: 'ltr',
    description: 'Paráfrasis moderna de fácil comprensión de Biblica, Inc.',
    copyright: 'Biblica, Inc. / Creative Commons',
    hasDeuterocanonical: false,
  },
  BLL: {
    id: 'BLL',
    name: 'Biblia Libre Latinoamericano',
    shortName: 'BLL',
    language: 'es',
    languageName: 'Español',
    direction: 'ltr',
    description: 'Edición en dialecto latinoamericano de eBible.org.',
    copyright: 'Dominio Público',
    hasDeuterocanonical: false,
  },
  BLM: {
    id: 'BLM',
    name: 'Biblia Libre para el Mundo',
    shortName: 'BLM',
    language: 'es',
    languageName: 'Español',
    direction: 'ltr',
    description: 'Edición en español europeo y global de eBible.org.',
    copyright: 'Dominio Público',
    hasDeuterocanonical: false,
  },
  SpaPlatense: {
    id: 'SpaPlatense',
    name: 'Biblia Platense (Straubinger)',
    shortName: 'PLATENSE',
    language: 'es',
    languageName: 'Español',
    direction: 'ltr',
    description: 'Traducción comentada de Mons. Juan Straubinger con abundantes notas exegéticas.',
    copyright: 'Dominio Público',
    hasDeuterocanonical: true,
  },
  SpaRVG: {
    id: 'SpaRVG',
    name: 'Reina Valera Gómez (2010)',
    shortName: 'RVG',
    language: 'es',
    languageName: 'Español',
    direction: 'ltr',
    description: 'Revisión hispana fiel al Texto Recibido por el Dr. Humberto Gómez Caballero.',
    copyright: 'Creative Commons Atribución-NoComercial-SinDerivadas (CC BY-NC-ND 4.0)',
    hasDeuterocanonical: false,
  },

  // === INGLÉS ===
  KJV: {
    id: 'KJV',
    name: 'King James Version (1769)',
    shortName: 'KJV',
    language: 'en',
    languageName: 'English',
    direction: 'ltr',
    description: 'Traducción clásica y emblemática del inglés británico con concordancia Strong.',
    copyright: 'Dominio Público',
    hasDeuterocanonical: false,
  },
  ASV: {
    id: 'ASV',
    name: 'American Standard Version (1901)',
    shortName: 'ASV',
    language: 'en',
    languageName: 'English',
    direction: 'ltr',
    description: 'Revisión estadounidense de alta fidelidad literal y rigor formal.',
    copyright: 'Dominio Público',
    hasDeuterocanonical: false,
  },
  Darby: {
    id: 'Darby',
    name: 'Darby Bible (1890)',
    shortName: 'DARBY',
    language: 'en',
    languageName: 'English',
    direction: 'ltr',
    description: 'Traducción directa y literal de John Nelson Darby de los textos originales.',
    copyright: 'Dominio Público',
    hasDeuterocanonical: false,
  },
  Rotherham: {
    id: 'Rotherham',
    name: 'The Emphasised Bible (1902)',
    shortName: 'ROTH',
    language: 'en',
    languageName: 'English',
    direction: 'ltr',
    description: 'Edición de J. B. Rotherham con énfasis analítico en modismos y tiempos verbales.',
    copyright: 'Dominio Público',
    hasDeuterocanonical: false,
  },
  Noyes: {
    id: 'Noyes',
    name: 'Noyes Translation (1869)',
    shortName: 'NOYES',
    language: 'en',
    languageName: 'English',
    direction: 'ltr',
    description: 'Traducción académica y poética de George R. Noyes (Poéticos, Profetas y NT).',
    copyright: 'Dominio Público',
    hasDeuterocanonical: false,
  },
  Tyndale: {
    id: 'Tyndale',
    name: 'William Tyndale Bible (1530/1534)',
    shortName: 'TYNDALE',
    language: 'en',
    languageName: 'Early Modern English',
    direction: 'ltr',
    description: 'Primera traducción impresa histórica desde los idiomas originales al inglés.',
    copyright: 'Dominio Público',
    hasDeuterocanonical: false,
  },
  Wycliffe: {
    id: 'Wycliffe',
    name: 'John Wycliffe Bible (c. 1395)',
    shortName: 'WYC',
    language: 'enm',
    languageName: 'Middle English',
    direction: 'ltr',
    description: 'Primera traducción monumental de la Vulgata al inglés medieval.',
    copyright: 'Dominio Público',
    hasDeuterocanonical: true,
  },

  // === ALEMÁN ===
  GerBoLut: {
    id: 'GerBoLut',
    name: 'Luther Bibel 1545 (Rechtschreibung)',
    shortName: 'LUT',
    language: 'de',
    languageName: 'Deutsch',
    direction: 'ltr',
    description: 'Traducción histórica de Martín Lutero en ortografía moderna estándar.',
    copyright: 'Dominio Público',
    hasDeuterocanonical: false,
  },

  // === GRIEGO ===
  LXX: {
    id: 'LXX',
    name: 'Septuaginta (Rahlfs-Hanhart)',
    shortName: 'LXX',
    language: 'grc',
    languageName: 'Griego (LXX)',
    direction: 'ltr',
    description: 'Antiguo Testamento en Griego Antiguo de los Setenta con libros deuterocanónicos.',
    copyright: 'Dominio Público / Académico',
    hasDeuterocanonical: true,
  },
  WHNU: {
    id: 'WHNU',
    name: 'Westcott-Hort con variantes NA27/UBS4',
    shortName: 'WHNU',
    language: 'grc',
    languageName: 'Griego (NT)',
    direction: 'ltr',
    description: 'Texto crítico del Nuevo Testamento en Griego Koiné con aparato de variantes.',
    copyright: 'Dominio Público / Académico',
    hasDeuterocanonical: false,
  },

  // === HEBREO ===
  WLC: {
    id: 'WLC',
    name: 'Westminster Leningrad Codex',
    shortName: 'WLC',
    language: 'hbo',
    languageName: 'Hebreo Bíblico',
    direction: 'rtl',
    description: 'Texto Masorético hebreo completo con puntuación vocálica (niqqud) y cantilación.',
    copyright: 'Dominio Público / Académico',
    hasDeuterocanonical: false,
  },
};

export const DEFAULT_TRANSLATION_IDS: TranslationId[] = ['RV1909', 'BES', 'VBL', 'PDDPT', 'ONBV'];

export function supportsDeuterocanonical(translations?: TranslationId | TranslationId[]): boolean {
  if (!translations) return false;
  const list = Array.isArray(translations) ? translations : [translations];
  return list.some((id) => AVAILABLE_TRANSLATIONS[id]?.hasDeuterocanonical === true);
}
