export class PassageReference {
  private readonly raw: string;
  public readonly book: string;
  public readonly chapter: number;
  public readonly startVerse?: number;
  public readonly endVerse?: number;

  constructor(raw: string) {
    this.raw = raw.trim();
    const parsed = PassageReference.parse(this.raw);
    this.book = parsed.book;
    this.chapter = parsed.chapter;
    this.startVerse = parsed.startVerse;
    this.endVerse = parsed.endVerse;
  }

  public get fullFormatted(): string {
    if (this.startVerse) {
      if (this.endVerse && this.endVerse !== this.startVerse) {
        return `${this.book} ${this.chapter}:${this.startVerse}-${this.endVerse}`;
      }
      return `${this.book} ${this.chapter}:${this.startVerse}`;
    }
    return `${this.book} ${this.chapter}`;
  }

  public get canonicalKey(): string {
    return `${this.normalizeString(this.book)}_${this.chapter}${this.startVerse ? `_${this.startVerse}` : ''}`;
  }

  private normalizeString(str: string): string {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '');
  }

  public static parse(input: string): { book: string; chapter: number; startVerse?: number; endVerse?: number } {
    const clean = input.trim();
    // Regex matching patterns like: "Juan 3:16", "1 Corintios 13:4-8", "Genesis 1", "Salmos 23"
    const match = clean.match(/^((?:\d\s+)?[A-Za-zÁÉÍÓÚáéíóúÑñ]+(?:\s+[A-Za-zÁÉÍÓÚáéíóúÑñ]+)*)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/);

    if (match) {
      const book = match[1].trim();
      const chapter = parseInt(match[2], 10);
      const startVerse = match[3] ? parseInt(match[3], 10) : undefined;
      const endVerse = match[4] ? parseInt(match[4], 10) : undefined;
      return { book, chapter, startVerse, endVerse };
    }

    // Default fallback
    return { book: clean || 'Génesis', chapter: 1, startVerse: 1 };
  }
}
