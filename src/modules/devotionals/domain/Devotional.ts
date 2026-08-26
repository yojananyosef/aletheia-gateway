export interface DevotionalReading {
  title: string;
  scriptureReference: string;
  verseQuote: string;
  content: string;
}

export interface DailyDevotional {
  dateKey: string; // e.g. "01.01" (MM.DD)
  month: number;
  day: number;
  displayDate: string; // e.g. "1 de Enero"
  morning?: DevotionalReading | null;
  evening?: DevotionalReading | null;
}

export interface DevotionalCatalog {
  id: string;
  title: string;
  author: string;
  totalDays: number;
  days: Record<string, DailyDevotional>;
}
