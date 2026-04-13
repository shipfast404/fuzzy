export interface ParsedFile {
  fileName: string;
  headers: string[];
  rows: string[][];
  headerRowIndex: number;
  rawFile: ArrayBuffer;
}

export interface CatalogItem {
  designation: string;
  designationNormalized: string;
  code: string;
  rowIndex: number;
}
