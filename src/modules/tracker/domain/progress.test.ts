import { describe, expect, it } from 'vitest';
import { bookProgress, completedCount, isChapterCompleted, toggleChapter, totalProgress } from './progress';

const BOOKS = [
  { code: 'GEN', chaptersCount: 50 },
  { code: 'OBA', chaptersCount: 1 },
];

describe('progress', () => {
  it('alterna capítulos normalizando el código', () => {
    let p = toggleChapter({}, 'gen', 1);
    expect(p).toEqual({ GEN: [1] });
    p = toggleChapter(p, 'GEN', 2);
    expect(p).toEqual({ GEN: [1, 2] });
    p = toggleChapter(p, 'GEN', 1);
    expect(p).toEqual({ GEN: [2] });
    expect(isChapterCompleted(p, 'gen', 2)).toBe(true);
    expect(isChapterCompleted(p, 'gen', 1)).toBe(false);
  });

  it('calcula progreso por libro y total', () => {
    const p = { GEN: [1, 2], OBA: [1] };
    expect(bookProgress(p, 'GEN', 50)).toBe(4);
    expect(bookProgress(p, 'OBA', 1)).toBe(100);
    expect(bookProgress({}, 'GEN', 50)).toBe(0);
    // 3 de 51 capítulos
    expect(totalProgress(p, BOOKS)).toBe(5.9);
    expect(completedCount(p)).toBe(3);
  });

  it('ignora capítulos fuera de rango y libros desconocidos', () => {
    const p = { GEN: [1, 999], XXX: [1] };
    expect(totalProgress(p, BOOKS)).toBe(2);
  });
});
