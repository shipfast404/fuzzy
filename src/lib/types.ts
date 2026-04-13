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

export interface Alternative {
  designation: string;
  code: string;
  overlap: number; // 0-1
  rowIndex: number;
}

export interface MatchedLine {
  marketRowIndex: number;
  catalogRowIndex: number;
  marketDesignation: string;
  catalogDesignation: string;
  catalogCode: string;
  overlap: number;
  alternatives: Alternative[];
}

export interface NearMiss {
  marketRowIndex: number;
  marketDesignation: string;
  bestCandidate: string;
  bestCode: string;
  bestOverlap: number;
  catalogRowIndex: number;
}

export interface Unmatched {
  marketRowIndex: number;
  marketDesignation: string;
}

export interface MatchResults {
  matches: MatchedLine[];
  nearMisses: NearMiss[];
  unmatched: Unmatched[];
  totalAo: number;
}
