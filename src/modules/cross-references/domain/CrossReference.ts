export interface CrossReferenceClause {
  clause: string;
  refs: string[];
}

export interface VerseCrossReferences {
  bookCode: string;
  chapter: number;
  verseNumber: number;
  clauses: CrossReferenceClause[];
}

export interface BookCrossReferencesData {
  source: string;
  title: string;
  bookCode: string;
  bookName: string;
  chapters: Record<string, Record<string, CrossReferenceClause[]>>;
}
