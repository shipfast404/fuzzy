import * as XLSX from 'xlsx';
import type { ParsedFile, MatchResult, MarketMapping } from './types';

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

export function exportExcel(
  rawFile: ArrayBuffer,
  headerRowIndex: number,
  matches: MatchResult[],
  _mapping: MarketMapping,
  threshold: number
): Blob {
  const workbook = XLSX.read(rawFile, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');

  // Append 4 new columns: Match catalogue | Code | Score | Statut
  const matchCol = range.e.c + 1;
  const codeCol = range.e.c + 2;
  const scoreCol = range.e.c + 3;
  const statusCol = range.e.c + 4;

  sheet[XLSX.utils.encode_cell({ r: headerRowIndex, c: matchCol })] = { t: 's', v: 'Match catalogue' };
  sheet[XLSX.utils.encode_cell({ r: headerRowIndex, c: codeCol })] = { t: 's', v: 'Code' };
  sheet[XLSX.utils.encode_cell({ r: headerRowIndex, c: scoreCol })] = { t: 's', v: 'Score %' };
  sheet[XLSX.utils.encode_cell({ r: headerRowIndex, c: statusCol })] = { t: 's', v: 'Statut' };

  for (const match of matches) {
    const excelRow = headerRowIndex + 1 + match.rowIndex; // 0-based data row → excel row

    const matchCell = XLSX.utils.encode_cell({ r: excelRow, c: matchCol });
    const codeCell = XLSX.utils.encode_cell({ r: excelRow, c: codeCol });
    const scoreCell = XLSX.utils.encode_cell({ r: excelRow, c: scoreCol });
    const statusCell = XLSX.utils.encode_cell({ r: excelRow, c: statusCol });

    if (match.status === 'ignored') {
      sheet[statusCell] = { t: 's', v: 'Ignoré' };
    } else if (match.matchedDesignation) {
      sheet[matchCell] = { t: 's', v: match.matchedDesignation };
      sheet[codeCell] = { t: 's', v: match.matchedCode || '' };
      sheet[scoreCell] = { t: 'n', v: Math.round(match.score) };
      const relevant = match.status === 'manual' || match.score >= threshold;
      sheet[statusCell] = { t: 's', v: relevant ? 'Pertinent' : 'Hors périmètre' };
    } else {
      sheet[statusCell] = { t: 's', v: 'Hors périmètre' };
    }
  }

  // Update range
  range.e.c = statusCol;
  const lastDataRow = headerRowIndex + matches.length;
  if (lastDataRow > range.e.r) range.e.r = lastDataRow;
  sheet['!ref'] = XLSX.utils.encode_range(range);

  const output = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  return new Blob([output], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}
