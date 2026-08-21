export type TranslationId = 'RVC' | 'NBLA' | 'NVI' | 'NTV' | 'TLA';

export interface TranslationInfo {
  id: TranslationId;
  name: string;
  shortName: string;
  language: string;
}

export const AVAILABLE_TRANSLATIONS: Record<TranslationId, TranslationInfo> = {
  RVC: {
    id: 'RVC',
    name: 'Reina-Valera Contemporánea',
    shortName: 'RVC',
    language: 'es',
  },
  NBLA: {
    id: 'NBLA',
    name: 'Nueva Biblia de las Américas',
    shortName: 'NBLA',
    language: 'es',
  },
  NVI: {
    id: 'NVI',
    name: 'Nueva Versión Internacional',
    shortName: 'NVI',
    language: 'es',
  },
  NTV: {
    id: 'NTV',
    name: 'Nueva Traducción Viviente',
    shortName: 'NTV',
    language: 'es',
  },
  TLA: {
    id: 'TLA',
    name: 'Traducción en Lenguaje Actual',
    shortName: 'TLA',
    language: 'es',
  },
};
