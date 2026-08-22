export interface Footnote {
  id: string;
  caller: string;
  text: string;
  anchorId?: string;
}

export interface Verse {
  number: number;
  text: string;
  headings?: string[];
  footnotes?: Footnote[];
}
