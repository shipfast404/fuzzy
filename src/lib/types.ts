export interface ParsedFile {
  fileName: string;
  headers: string[];
  rows: string[][];
  headerRowIndex: number;
  rawFile: ArrayBuffer;
}

export interface CatalogItem {
  designation: string;
  normalized: string;
  code: string;
  rowIndex: number;
}

export interface MatchedLine {
  marketRowIndex: number;
  catalogRowIndex: number;
  marketDesignation: string;
  catalogDesignation: string;
  catalogCode: string;
}
