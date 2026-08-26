import { findBookInfo, ALL_BIBLE_BOOKS } from '../entities/BibleBooks';

export interface ParsedPassageSegment {
  book: string;
  bookCode: string;
  chapter: number;
  startVerse?: number;
  endVerse?: number;
  verseNumbers?: number[];
  fullFormatted: string;
  fullChapterRef: string;
  isPartial: boolean;
}

export class PassageReference {
  private readonly raw: string;
  public readonly segments: ParsedPassageSegment[];

  constructor(raw: string) {
    this.raw = raw.trim();
    this.segments = PassageReference.parseMulti(this.raw);
  }

  public get primarySegment(): ParsedPassageSegment {
    return this.segments[0] || {
      book: 'Génesis',
      bookCode: 'GEN',
      chapter: 1,
      fullFormatted: 'Génesis 1:1',
      fullChapterRef: 'Génesis 1',
      isPartial: true,
      verseNumbers: [1],
      startVerse: 1,
      endVerse: 1,
    };
  }

  public get book(): string {
    return this.primarySegment.book;
  }

  public get chapter(): number {
    return this.primarySegment.chapter;
  }

  public get startVerse(): number | undefined {
    return this.primarySegment.startVerse;
  }

  public get endVerse(): number | undefined {
    return this.primarySegment.endVerse;
  }

  public get fullFormatted(): string {
    return this.segments.map((s) => s.fullFormatted).join('; ');
  }

  public static parse(input: string): { book: string; chapter: number; startVerse?: number; endVerse?: number } {
    const ref = new PassageReference(input);
    const p = ref.primarySegment;
    return {
      book: p.book,
      chapter: p.chapter,
      startVerse: p.startVerse,
      endVerse: p.endVerse,
    };
  }

  public static isReference(input: string): boolean {
    const clean = input.trim().replace(/\s+/g, ' ');
    if (!clean) return false;

    const rawParts = clean.split(';').map((p) => p.trim()).filter((p) => p.length > 0);
    if (rawParts.length === 0) return false;

    for (const part of rawParts) {
      // Pattern A: Book + Chapter (:Verses)
      const bookWithChapterRegex = /^((?:[1-3]\s*)?[A-Za-zÁÉÍÓÚáéíóúÑñ]+(?:\s+[A-Za-zÁÉÍÓÚáéíóúÑñ]+)*)\s+(\d+)(?::\s*([\d\s,-]+))?$/i;
      const matchA = part.match(bookWithChapterRegex);
      if (matchA) {
        const bookCandidate = matchA[1].trim();
        const bookInfo = findBookInfo(bookCandidate);
        if (bookInfo) return true;
      }

      // Pattern B: Chapter only / chapter:verse (numbers)
      const chapterOnlyRegex = /^(\d+)(?::\s*([\d\s,-]+))?$/;
      if (chapterOnlyRegex.test(part)) return true;

      // Pattern C: Exact or alias book name only
      if (findBookInfo(part)) return true;
    }

    return false;
  }

  public static parseMulti(input: string): ParsedPassageSegment[] {
    const raw = input.trim();
    if (!raw) {
      return [
        {
          book: 'Génesis',
          bookCode: 'GEN',
          chapter: 1,
          verseNumbers: [1],
          startVerse: 1,
          endVerse: 1,
          fullFormatted: 'Génesis 1:1',
          fullChapterRef: 'Génesis 1',
          isPartial: true,
        },
      ];
    }

    // Split query by semicolon ';'
    const rawParts = raw.split(';').map((p) => p.trim()).filter((p) => p.length > 0);
    const segments: ParsedPassageSegment[] = [];

    let currentBookInfo = findBookInfo('Génesis') || ALL_BIBLE_BOOKS[0];

    for (const part of rawParts) {
      const seg = PassageReference.parseSingle(part, currentBookInfo);
      if (seg) {
        segments.push(seg);
        const newBookInfo = findBookInfo(seg.bookCode);
        if (newBookInfo) {
          currentBookInfo = newBookInfo;
        }
      }
    }

    if (segments.length === 0) {
      return [
        {
          book: 'Génesis',
          bookCode: 'GEN',
          chapter: 1,
          verseNumbers: [1],
          startVerse: 1,
          endVerse: 1,
          fullFormatted: 'Génesis 1:1',
          fullChapterRef: 'Génesis 1',
          isPartial: true,
        },
      ];
    }

    return segments;
  }

  public static parseSingle(
    input: string,
    fallbackBookInfo = ALL_BIBLE_BOOKS[0]
  ): ParsedPassageSegment | null {
    const clean = input.trim().replace(/\s+/g, ' ');
    if (!clean) return null;

    // Pattern A: Has book name e.g. "Genesis 1:1", "1 Corintios 13:4-8", "Gen 3:1,6", "Salmos 23"
    // Handles book names with leading numbers "1 ", "2 ", "3 "
    const bookWithChapterRegex = /^((?:[1-3]\s*)?[A-Za-zÁÉÍÓÚáéíóúÑñ]+(?:\s+[A-Za-zÁÉÍÓÚáéíóúÑñ]+)*)\s+(\d+)(?::\s*([\d\s,-]+))?$/i;
    const matchA = clean.match(bookWithChapterRegex);

    if (matchA) {
      const bookCandidate = matchA[1].trim();
      const chapter = parseInt(matchA[2], 10);
      const versesSpec = matchA[3]?.trim();

      const bookInfo = findBookInfo(bookCandidate) || fallbackBookInfo;
      return PassageReference.buildSegment(bookInfo.name, bookInfo.code, chapter, versesSpec);
    }

    // Pattern B: Only chapter/verses e.g. "5", "3:1,6", "2:1-4" (inherits current book context)
    const chapterOnlyRegex = /^(\d+)(?::\s*([\d\s,-]+))?$/;
    const matchB = clean.match(chapterOnlyRegex);

    if (matchB) {
      const chapter = parseInt(matchB[1], 10);
      const versesSpec = matchB[2]?.trim();
      return PassageReference.buildSegment(fallbackBookInfo.name, fallbackBookInfo.code, chapter, versesSpec);
    }

    // Pattern C: Book name only e.g. "Genesis", "Salmos", "Juan" -> Defaults to Chapter 1
    const bookOnlyInfo = findBookInfo(clean);
    if (bookOnlyInfo) {
      return PassageReference.buildSegment(bookOnlyInfo.name, bookOnlyInfo.code, 1, undefined);
    }

    // Fallback: Default to fallbackBookInfo Chapter 1
    return PassageReference.buildSegment(fallbackBookInfo.name, fallbackBookInfo.code, 1, undefined);
  }

  private static buildSegment(
    bookName: string,
    bookCode: string,
    chapter: number,
    versesSpec?: string
  ): ParsedPassageSegment {
    const fullChapterRef = `${bookName} ${chapter}`;

    if (!versesSpec) {
      return {
        book: bookName,
        bookCode,
        chapter,
        fullFormatted: fullChapterRef,
        fullChapterRef,
        isPartial: false,
      };
    }

    // Parse versesSpec (e.g. "1", "1-2", "1,6", "1-3,6,8-10")
    const verseNumbers = PassageReference.parseVerseSpec(versesSpec);
    const startVerse = verseNumbers.length > 0 ? verseNumbers[0] : undefined;
    const endVerse = verseNumbers.length > 0 ? verseNumbers[verseNumbers.length - 1] : undefined;

    let formattedVerses = versesSpec.replace(/\s+/g, '');
    // Format nicely e.g. "1, 6"
    formattedVerses = formattedVerses.replace(/,/g, ', ');

    return {
      book: bookName,
      bookCode,
      chapter,
      startVerse,
      endVerse,
      verseNumbers,
      fullFormatted: `${bookName} ${chapter}:${formattedVerses}`,
      fullChapterRef,
      isPartial: true,
    };
  }

  private static parseVerseSpec(spec: string): number[] {
    const parts = spec.split(',');
    const resultSet = new Set<number>();

    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.includes('-')) {
        const [startStr, endStr] = trimmed.split('-');
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (!isNaN(start) && !isNaN(end) && start <= end) {
          for (let v = start; v <= end; v++) {
            resultSet.add(v);
          }
        } else if (!isNaN(start)) {
          resultSet.add(start);
        }
      } else {
        const num = parseInt(trimmed, 10);
        if (!isNaN(num)) {
          resultSet.add(num);
        }
      }
    }

    return Array.from(resultSet).sort((a, b) => a - b);
  }
}
