import type { TranslationId } from '../../bible-reader/domain/entities/Translation';

export interface ConcordanceVerseMatch {
  bookCode: string;
  bookName: string;
  chapter: number;
  verseNumber: number;
  rawText: string;
  normalizedText: string;
  testament: 'AT' | 'NT';
  category: string;
  score: number;
  reference: string;
}

export type TestamentFilterOption = 'ALL' | 'AT' | 'NT';
export type ConcordanceSortOrder = 'canonical' | 'relevance';

export interface ConcordanceFacets {
  total: number;
  otCount: number;
  ntCount: number;
  categoryCounts: Record<string, number>;
}

export interface ConcordanceSearchResponse {
  query: string;
  translationId: TranslationId;
  totalMatches: number;
  filteredMatches: number;
  facets: ConcordanceFacets;
  results: ConcordanceVerseMatch[];
  searchDurationMs: number;
}

export interface PopularTopic {
  id: string;
  label: string;
  query: string;
  iconName?: string;
  description?: string;
}

export const POPULAR_BIBLICAL_TOPICS: PopularTopic[] = [
  { id: 'amor', label: 'Amor', query: 'amor', description: 'El amor de Dios y hacia el prójimo' },
  { id: 'fe', label: 'Fe', query: 'fe', description: 'Confianza y fidelidad en Dios' },
  { id: 'gracia', label: 'Gracia', query: 'gracia', description: 'Favor inmerecido y redención' },
  { id: 'salvacion', label: 'Salvación', query: 'salvacion', description: 'Vida eterna y rescate divino' },
  { id: 'esperanza', label: 'Esperanza', query: 'esperanza', description: 'Firmeza en las promesas divinas' },
  { id: 'perdon', label: 'Perdón', query: 'perdon', description: 'Misericordia y reconciliación' },
  { id: 'sabiduria', label: 'Sabiduría', query: 'sabiduria', description: 'Discernimiento y temor de Dios' },
  { id: 'oracion', label: 'Oración', query: 'oracion', description: 'Comunión y clamor al Señor' },
  { id: 'paz', label: 'Paz', query: 'paz', description: 'Tranquilidad espiritual y reconciliación' },
  { id: 'espiritu', label: 'Espíritu Santo', query: 'Espiritu Santo', description: 'El Consolador y poder de Dios' },
  { id: 'luz', label: 'Luz y Tinieblas', query: 'luz tinieblas', description: 'La verdad frente a la oscuridad' },
  { id: 'reino', label: 'Reino de Dios', query: '"reino de Dios"', description: 'El señorío eterno del Creador' },
];