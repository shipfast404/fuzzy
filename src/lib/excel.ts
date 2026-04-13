import * as XLSX from 'xlsx';
import type { ParsedFile } from './types';
import type { MatchedLine } from './matching';

export function parseExcel(file: File): Promise<ParsedFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result as ArrayBuffer;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const raw: (string | number | boolean | null)[][] = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: '',
          raw: false,
        });

        const allRows = raw.map((row) =>
          row.map((cell) => (cell != null ? String(cell) : ''))
        );

        const headerRowIndex = detectHeaderRow(allRows);
        const headers = allRows[headerRowIndex] || [];
        const dataRows = allRows.slice(headerRowIndex + 1).filter((row) =>
          row.some((cell) => cell.trim() !== '')
        );

        resolve({
          fileName: file.name,
          headers,
          rows: dataRows,
          headerRowIndex,
          rawFile: data,
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
    reader.readAsArrayBuffer(file);
  });
}

function detectHeaderRow(rows: string[][]): number {
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const nonEmptyCells = rows[i].filter((cell) => cell.trim() !== '').length;
    if (nonEmptyCells >= 3) {
      return i;
    }
  }
  return 0;
}

export function exportMatched(
  rawFile: ArrayBuffer,
  headerRowIndex: number,
  matches: MatchedLine[]
): Blob {
  const workbook = XLSX.read(rawFile, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');

  // Build a new workbook with only matched rows
  const newWb = XLSX.utils.book_new();

  // Get all original columns from the header row
  const colCount = range.e.c + 1;
  const headerRow: string[] = [];
  for (let c = 0; c < colCount; c++) {
    const cell = sheet[XLSX.utils.encode_cell({ r: headerRowIndex, c })];
    headerRow.push(cell ? String(cell.v) : '');
  }
  headerRow.push('Produit catalogue', 'Code');

  const aoa: string[][] = [headerRow];

  for (const match of matches) {
    const excelRow = headerRowIndex + 1 + match.rowIndex;
    const row: string[] = [];
    for (let c = 0; c < colCount; c++) {
      const cell = sheet[XLSX.utils.encode_cell({ r: excelRow, c })];
      row.push(cell ? String(cell.v) : '');
    }
    row.push(match.matchedDesignation, match.matchedCode);
    aoa.push(row);
  }

  const newSheet = XLSX.utils.aoa_to_sheet(aoa);
  XLSX.utils.book_append_sheet(newWb, newSheet, 'Résultats');

  const output = XLSX.write(newWb, { type: 'array', bookType: 'xlsx' });
  return new Blob([output], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}
