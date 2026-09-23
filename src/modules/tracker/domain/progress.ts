/**
 * Progreso de lectura por capítulos (port de NRVA `stores/tracker.ts`).
 * Funciones puras sobre `ProgressMap` ({ [bookCode]: number[] }).
 * Las claves son códigos gateway en mayúsculas (GEN, EXO, ...).
 */

export type ProgressMap = Record<string, number[]>;

export function toggleChapter(progress: ProgressMap, bookCode: string, chapter: number): ProgressMap {
  const code = bookCode.toUpperCase();
  const current = progress[code] ?? [];
  const next = current.includes(chapter)
    ? current.filter((c) => c !== chapter)
    : [...current, chapter].sort((a, b) => a - b);
  return { ...progress, [code]: next };
}

export function isChapterCompleted(progress: ProgressMap, bookCode: string, chapter: number): boolean {
  return (progress[bookCode.toUpperCase()] ?? []).includes(chapter);
}

export function bookProgress(progress: ProgressMap, bookCode: string, totalChapters: number): number {
  if (totalChapters <= 0) return 0;
  const done = progress[bookCode.toUpperCase()]?.length ?? 0;
  return Number(((done / totalChapters) * 100).toFixed(1));
}

export function totalProgress(progress: ProgressMap, books: Array<{ code: string; chaptersCount: number }>): number {
  const total = books.reduce((acc, b) => acc + b.chaptersCount, 0);
  if (total <= 0) return 0;
  const done = Object.entries(progress).reduce((acc, [code, chapters]) => {
    const book = books.find((b) => b.code === code);
    if (!book) return acc;
    // Solo cuenta capítulos dentro del rango del libro (datos legacy-safe).
    return acc + chapters.filter((c) => c >= 1 && c <= book.chaptersCount).length;
  }, 0);
  return Number(((done / total) * 100).toFixed(1));
}

export function completedCount(progress: ProgressMap): number {
  return Object.values(progress).reduce((acc, chapters) => acc + chapters.length, 0);
}
