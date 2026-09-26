import { getAllBooks } from '../../bible-reader/domain/entities/BibleBooks';

/** Posición dentro del interlineal: libro (nombre canónico), capítulo y versículo. */
export interface InterlinearPosition {
  book: string;
  chapter: number;
  verse: number;
}

/**
 * Estructura de un libro con datos interlineales: capítulos disponibles y
 * primer/último versículo de cada capítulo. Permite saltar entre capítulos y
 * entre libros sin adivinar el número de versículo de destino.
 */
export interface InterlinearBookOutline {
  chapters: number[];
  firstVerse: (chapter: number) => number;
  lastVerse: (chapter: number) => number;
}

/** Nombres de los libros con interlineal, en orden canónico de lectura. */
export function interlinearBookOrder(): string[] {
  return getAllBooks().map((b) => b.name);
}

/**
 * Calcula la posición siguiente/anterior en la secuencia de lectura.
 *
 * Al agotar los versículos del capítulo salta al capítulo siguiente y, si el
 * libro se acaba, continúa en el primer versículo del libro siguiente (hacia
 * atrás, en el último versículo del libro anterior). Devuelve `null` en los
 * extremos de la Biblia para que la UI deshabilite el botón en vez de quedarse
 * quieta sin avisar.
 */
export async function stepPosition(
  position: InterlinearPosition,
  delta: -1 | 1,
  verseNumbers: number[],
  outline: InterlinearBookOutline,
  resolveOutline: (book: string) => Promise<InterlinearBookOutline | null>,
  bookOrder: string[] = interlinearBookOrder(),
): Promise<InterlinearPosition | null> {
  const verseIdx = verseNumbers.indexOf(position.verse);
  if (verseIdx !== -1) {
    const sibling = verseNumbers[verseIdx + delta];
    if (sibling !== undefined) return { ...position, verse: sibling };
  }

  const chapterIdx = outline.chapters.indexOf(position.chapter);
  const nextChapter = chapterIdx === -1 ? undefined : outline.chapters[chapterIdx + delta];
  if (nextChapter !== undefined) {
    return {
      book: position.book,
      chapter: nextChapter,
      verse: delta === 1 ? outline.firstVerse(nextChapter) : outline.lastVerse(nextChapter),
    };
  }

  // El libro se acabó: continuamos en el libro vecino que tenga datos.
  const bookIdx = bookOrder.indexOf(position.book);
  if (bookIdx === -1) return null;
  for (let i = bookIdx + delta; i >= 0 && i < bookOrder.length; i += delta) {
    const neighbor = await resolveOutline(bookOrder[i]);
    if (!neighbor || neighbor.chapters.length === 0) continue;
    const chapter = delta === 1 ? neighbor.chapters[0] : neighbor.chapters[neighbor.chapters.length - 1];
    return {
      book: bookOrder[i],
      chapter,
      verse: delta === 1 ? neighbor.firstVerse(chapter) : neighbor.lastVerse(chapter),
    };
  }
  return null;
}

/** ¿La posición es el primer versículo de la Biblia? (no hay "anterior") */
export async function hasPrevious(
  position: InterlinearPosition,
  verseNumbers: number[],
  outline: InterlinearBookOutline,
  resolveOutline: (book: string) => Promise<InterlinearBookOutline | null>,
  bookOrder: string[] = interlinearBookOrder(),
): Promise<boolean> {
  return (await stepPosition(position, -1, verseNumbers, outline, resolveOutline, bookOrder)) !== null;
}

/** ¿La posición es el último versículo de la Biblia? (no hay "siguiente") */
export async function hasNext(
  position: InterlinearPosition,
  verseNumbers: number[],
  outline: InterlinearBookOutline,
  resolveOutline: (book: string) => Promise<InterlinearBookOutline | null>,
  bookOrder: string[] = interlinearBookOrder(),
): Promise<boolean> {
  return (await stepPosition(position, 1, verseNumbers, outline, resolveOutline, bookOrder)) !== null;
}
