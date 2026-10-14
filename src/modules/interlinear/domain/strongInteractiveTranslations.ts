import type { TranslationId } from '../../bible-reader/domain/entities/Translation';
import type { InterlinearTestament } from './InterlinearVerse';

/**
 * Versiones cuyo texto lleva términos Strong interactivos dentro del lector.
 * Para que funcione hacen falta las dos piezas: el texto de la versión y los
 * tokens del interlineal del mismo testamento.
 *
 *  - WLC  (hebreo AT) → public/data/interlinear/hebrew
 *  - WHNU (griego NT) → public/data/interlinear/greek
 *
 * LXX queda fuera a propósito: el interlineal griego cubre los 27 libros del
 * Nuevo Testamento, no hay tokens para la Septuaginta.
 */
export const STRONG_INTERACTIVE_TRANSLATIONS: Partial<Record<TranslationId, InterlinearTestament>> = {
  WLC: 'hebrew',
  WHNU: 'greek',
};

/** Devuelve el testamento del interlineal para una versión, o null si no aplica. */
export function strongTestamentFor(translationId: string): InterlinearTestament | null {
  return STRONG_INTERACTIVE_TRANSLATIONS[translationId as TranslationId] ?? null;
}

/** ¿Esta versión tiene términos Strong interactivos en el lector? */
export function isStrongInteractive(translationId: string): boolean {
  return strongTestamentFor(translationId) !== null;
}
