export interface ParsedFile {
  fileName: string;
  headers: string[];
  rows: string[][];
  headerRowIndex: number;
  rawFile: ArrayBuffer;
}

export interface MarketMapping {
  designationCol: number;
  referenceCol: number;
  denominationCol: number | null;
}

export interface CatalogMapping {
  designationCol: number;
  codeCol: number;
}

export interface CatalogItem {
  designation: string;
  designationNormalized: string;
  code: string;
  rowIndex: number;
}

export type MatchStatus = 'auto' | 'manual' | 'ignored' | 'unmatched';

export interface MatchResult {
  rowIndex: number;
  originalDesignation: string;
  matchedDesignation: string | null;
  matchedCode: string | null;
  score: number;
  status: MatchStatus;
}

export interface AppState {
  marketFile: ParsedFile | null;
  catalogFile: ParsedFile | null;
  marketMapping: MarketMapping | null;
  catalogMapping: CatalogMapping | null;
  catalogItems: CatalogItem[];
  matchResults: MatchResult[];
}
