export interface Footnote {
  id: string;
  caller: string;
  text: string;
  anchorId?: string;
}

export interface Verse {
  number: number;
  verseDisplay?: string;
  endNumber?: number;
  text: string;
  headings?: string[];
  footnotes?: Footnote[];
}
