import * as XLSX from 'xlsx';
import type { ParsedFile, MatchedLine } from './types';

export function parseExcel(file: File): Promise<ParsedFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buf = e.target?.result as ArrayBuffer;
        const wb = XLSX.read(buf, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw: (string | number | boolean | null)[][] = XLSX.utils.sheet_to_json(
          ws,
          { header: 1, defval: '', raw: false }
        );
        const rows = raw.map((r) => r.map((c) => (c != null ? String(c) : '')));
        const hdr = detectHeader(rows);
        resolve({
          fileName: file.name,
          headers: rows[hdr] || [],
          rows: rows.slice(hdr + 1).filter((r) => r.some((c) => c.trim())),
          headerRowIndex: hdr,
          rawFile: buf,
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Lecture impossible'));
    reader.readAsArrayBuffer(file);
  });
}

function detectHeader(rows: string[][]): number {
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    if (rows[i].filter((c) => c.trim()).length >= 3) return i;
  }
  return 0;
}

export function exportMatched(
  rawFile: ArrayBuffer,
  headerRowIndex: number,
  matches: MatchedLine[]
): Blob {
  const wb = XLSX.read(rawFile, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  const cols = range.e.c + 1;

  // header row
  const hdr: string[] = [];
  for (let c = 0; c < cols; c++) {
    const cell = ws[XLSX.utils.encode_cell({ r: headerRowIndex, c })];
    hdr.push(cell ? String(cell.v) : '');
  }
  hdr.push('Match catalogue', 'Code catalogue');

  const aoa: string[][] = [hdr];
  for (const m of matches) {
    const r = headerRowIndex + 1 + m.marketRowIndex;
    const row: string[] = [];
    for (let c = 0; c < cols; c++) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })];
      row.push(cell ? String(cell.v) : '');
    }
    row.push(m.catalogDesignation, m.catalogCode);
    aoa.push(row);
  }

  const newWb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(newWb, XLSX.utils.aoa_to_sheet(aoa), 'Résultats');
  const out = XLSX.write(newWb, { type: 'array', bookType: 'xlsx' });
  return new Blob([out], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}
