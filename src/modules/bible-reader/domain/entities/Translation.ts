export type TranslationId =
  | 'RV1909'
  | 'BES'
  | 'VBL'
  | 'PDDPT'
  | 'ONBV'
  | 'BLL'
  | 'BLM'
  | 'SpaPlatense';

export interface TranslationInfo {
  id: TranslationId;
  name: string;
  shortName: string;
  language: string;
  description?: string;
  copyright?: string;
  hasDeuterocanonical?: boolean;
}

export const AVAILABLE_TRANSLATIONS: Record<TranslationId, TranslationInfo> = {
  RV1909: {
    id: 'RV1909',
    name: 'Reina Valera 1909',
    shortName: 'RV1909',
    language: 'es',
    description: 'Traducción clásica histórica en español, fiel al Texto Recibido.',
    copyright: 'Dominio Público',
    hasDeuterocanonical: false,
  },
  BES: {
    id: 'BES',
    name: 'Biblia en Español Sencillo',
    shortName: 'BES',
    language: 'es',
    description: 'Lenguaje contemporáneo accesible y directo de AudioBiblia.org.',
    copyright: 'Creative Commons Atribución 4.0 Internacional (CC BY 4.0)',
    hasDeuterocanonical: false,
  },
  VBL: {
    id: 'VBL',
    name: 'Versión Biblia Libre',
    shortName: 'VBL',
    language: 'es',
    description: 'Traducción moderna y transparente con abundantes notas de estudio.',
    copyright: 'Creative Commons Atribución-CompartirIgual 4.0 (CC BY-SA 4.0)',
    hasDeuterocanonical: false,
  },
  PDDPT: {
    id: 'PDDPT',
    name: 'Palabra de Dios para ti',
    shortName: 'PDDPT',
    language: 'es',
    description: 'Traducción fiel y contextual de la Asociación Bíblica Latinoamericana.',
    copyright: 'Creative Commons Atribución 4.0 (CC BY 4.0)',
    hasDeuterocanonical: false,
  },
  ONBV: {
    id: 'ONBV',
    name: 'Open Nueva Biblia Viva',
    shortName: 'ONBV',
    language: 'es',
    description: 'Paráfrasis moderna de fácil comprensión de Biblica, Inc.',
    copyright: 'Biblica, Inc. / Creative Commons',
    hasDeuterocanonical: false,
  },
  BLL: {
    id: 'BLL',
    name: 'Biblia Libre Latinoamericano',
    shortName: 'BLL',
    language: 'es',
    description: 'Edición en dialecto latinoamericano de eBible.org.',
    copyright: 'Dominio Público',
    hasDeuterocanonical: false,
  },
  BLM: {
    id: 'BLM',
    name: 'Biblia Libre para el Mundo',
    shortName: 'BLM',
    language: 'es',
    description: 'Edición en español europeo y global de eBible.org.',
    copyright: 'Dominio Público',
    hasDeuterocanonical: false,
  },
  SpaPlatense: {
    id: 'SpaPlatense',
    name: 'Biblia Platense (Straubinger)',
    shortName: 'PLATENSE',
    language: 'es',
    description: 'Traducción comentada de Mons. Juan Straubinger con abundantes notas exegéticas.',
    copyright: 'Dominio Público',
    hasDeuterocanonical: true,
  },
};

export const DEFAULT_TRANSLATION_IDS: TranslationId[] = ['RV1909', 'BES', 'VBL', 'PDDPT', 'ONBV'];

export function supportsDeuterocanonical(translations?: TranslationId | TranslationId[]): boolean {
  if (!translations) return false;
  const list = Array.isArray(translations) ? translations : [translations];
  return list.some((id) => AVAILABLE_TRANSLATIONS[id]?.hasDeuterocanonical === true);
}
