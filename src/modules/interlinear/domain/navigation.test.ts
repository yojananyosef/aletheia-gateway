import { describe, expect, it } from 'vitest';
import { hasNext, hasPrevious, stepPosition, type InterlinearBookOutline } from './navigation';

/** Libro de prueba: capítulos 1..3 con 2 versículos cada uno. */
function outlineOf(versesPerChapter: Record<number, number[]>): InterlinearBookOutline {
  const chapters = Object.keys(versesPerChapter)
    .map(Number)
    .sort((a, b) => a - b);
  return {
    chapters,
    firstVerse: (chapter) => versesPerChapter[chapter][0],
    lastVerse: (chapter) => versesPerChapter[chapter][versesPerChapter[chapter].length - 1],
  };
}

const genesis = outlineOf({ 1: [1, 2, 3], 2: [1, 2], 3: [1] });
const exodus = outlineOf({ 1: [1, 2], 2: [1, 2, 3] });
const john = outlineOf({ 3: [5, 6] });

const books = ['Génesis', 'Éxodo', 'Juan'];

async function resolveOutline(book: string): Promise<InterlinearBookOutline | null> {
  if (book === 'Génesis') return genesis;
  if (book === 'Éxodo') return exodus;
  if (book === 'Juan') return john;
  return null;
}

describe('navegación del interlineal', () => {
  it('avanza de versículo dentro del capítulo', async () => {
    const next = await stepPosition(
      { book: 'Génesis', chapter: 1, verse: 1 },
      1,
      [1, 2, 3],
      genesis,
      resolveOutline,
      books,
    );
    expect(next).toEqual({ book: 'Génesis', chapter: 1, verse: 2 });
  });

  it('salta al capítulo siguiente en el último versículo', async () => {
    const next = await stepPosition(
      { book: 'Génesis', chapter: 1, verse: 3 },
      1,
      [1, 2, 3],
      genesis,
      resolveOutline,
      books,
    );
    expect(next).toEqual({ book: 'Génesis', chapter: 2, verse: 1 });
  });

  it('salta al capítulo siguiente en el último capítulo del libro', async () => {
    const next = await stepPosition({ book: 'Génesis', chapter: 3, verse: 1 }, 1, [1], genesis, resolveOutline, books);
    expect(next).toEqual({ book: 'Éxodo', chapter: 1, verse: 1 });
  });

  it('retrocede al último versículo del capítulo anterior', async () => {
    const prev = await stepPosition(
      { book: 'Génesis', chapter: 2, verse: 1 },
      -1,
      [1, 2],
      genesis,
      resolveOutline,
      books,
    );
    expect(prev).toEqual({ book: 'Génesis', chapter: 1, verse: 3 });
  });

  it('retrocede al último versículo del libro anterior', async () => {
    const prev = await stepPosition({ book: 'Éxodo', chapter: 1, verse: 1 }, -1, [1, 2], exodus, resolveOutline, books);
    expect(prev).toEqual({ book: 'Génesis', chapter: 3, verse: 1 });
  });

  it('devuelve null en el primer y en el último versículo de la Biblia', async () => {
    const first = await stepPosition(
      { book: 'Génesis', chapter: 1, verse: 1 },
      -1,
      [1, 2, 3],
      genesis,
      resolveOutline,
      books,
    );
    const last = await stepPosition({ book: 'Juan', chapter: 3, verse: 6 }, 1, [5, 6], john, resolveOutline, books);
    expect(first).toBeNull();
    expect(last).toBeNull();
  });

  it('sigue navegación con capítulos sin versículos cargados', async () => {
    // El desplegable aún no cargó los versículos del capítulo actual.
    const next = await stepPosition({ book: 'Éxodo', chapter: 1, verse: 2 }, 1, [], exodus, resolveOutline, books);
    expect(next).toEqual({ book: 'Éxodo', chapter: 2, verse: 1 });
  });

  it('indica si hay destino en cada sentido', async () => {
    expect(await hasNext({ book: 'Génesis', chapter: 3, verse: 1 }, [1], genesis, resolveOutline, books)).toBe(true);
    expect(await hasNext({ book: 'Juan', chapter: 3, verse: 6 }, [5, 6], john, resolveOutline, books)).toBe(false);
    expect(await hasPrevious({ book: 'Éxodo', chapter: 1, verse: 1 }, [1, 2], exodus, resolveOutline, books)).toBe(
      true,
    );
    expect(
      await hasPrevious({ book: 'Génesis', chapter: 1, verse: 1 }, [1, 2, 3], genesis, resolveOutline, books),
    ).toBe(false);
  });

  it('salta libros sin datos interlineales', async () => {
    const withGap = ['Génesis', 'Tobías', 'Éxodo'];
    const next = await stepPosition(
      { book: 'Génesis', chapter: 3, verse: 1 },
      1,
      [1],
      genesis,
      async (book) => (book === 'Tobías' ? null : resolveOutline(book)),
      withGap,
    );
    expect(next).toEqual({ book: 'Éxodo', chapter: 1, verse: 1 });
  });
});
