export type TranslationId =
  | 'RVC'
  | 'NBLA'
  | 'NVI'
  | 'NTV'
  | 'TLA'
  | 'RVR1960'
  | 'DHH'
  | 'LBLA'
  | 'PDT';

export interface TranslationInfo {
  id: TranslationId;
  name: string;
  shortName: string;
  language: string;
  description?: string;
}

export const AVAILABLE_TRANSLATIONS: Record<TranslationId, TranslationInfo> = {
  RVC: {
    id: 'RVC',
    name: 'Reina-Valera Contemporánea',
    shortName: 'RVC',
    language: 'es',
    description: 'Revisión moderna con lenguaje hispanoamericano accesible.',
  },
  NBLA: {
    id: 'NBLA',
    name: 'Nueva Biblia de las Américas',
    shortName: 'NBLA',
    language: 'es',
    description: 'Traducción precisa y fidedigna a los manuscritos originales.',
  },
  NVI: {
    id: 'NVI',
    name: 'Nueva Versión Internacional',
    shortName: 'NVI',
    language: 'es',
    description: 'Equilibrio ideal entre rigor exegético y fluidez contemporánea.',
  },
  NTV: {
    id: 'NTV',
    name: 'Nueva Traducción Viviente',
    shortName: 'NTV',
    language: 'es',
    description: 'Lenguaje fresco, cálido y dinámico de fácil comprensión.',
  },
  TLA: {
    id: 'TLA',
    name: 'Traducción en Lenguaje Actual',
    shortName: 'TLA',
    language: 'es',
    description: 'Vocabulario directo y sencillo ideal para lectura ágil.',
  },
  RVR1960: {
    id: 'RVR1960',
    name: 'Reina-Valera 1960',
    shortName: 'RVR1960',
    language: 'es',
    description: 'La traducción clásica más leída y memorizada en español.',
  },
  DHH: {
    id: 'DHH',
    name: 'Dios Habla Hoy',
    shortName: 'DHH',
    language: 'es',
    description: 'Versión popular con equivalencia dinámica.',
  },
  LBLA: {
    id: 'LBLA',
    name: 'La Biblia de las Américas',
    shortName: 'LBLA',
    language: 'es',
    description: 'Traducción formal y literal de alta precisión teológica.',
  },
  PDT: {
    id: 'PDT',
    name: 'Palabra de Dios para Todos',
    shortName: 'PDT',
    language: 'es',
    description: 'Enfoque claro y directo para nuevos lectores.',
  },
};
