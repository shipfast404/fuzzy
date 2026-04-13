'use client';

interface DataPreviewProps {
  headers: string[];
  rows: string[][];
  maxRows?: number;
  highlightCols?: number[];
}

export function DataPreview({ headers, rows, maxRows = 5, highlightCols = [] }: DataPreviewProps) {
  const previewRows = rows.slice(0, maxRows);
  const visibleHeaders = headers.filter((h) => h.trim() !== '');
  const visibleIndices = headers
    .map((h, i) => (h.trim() !== '' ? i : -1))
    .filter((i) => i >= 0);

  if (visibleHeaders.length === 0) return null;

  return (
    <div className="overflow-x-auto border border-slate-200 rounded-lg">
      <table className="min-w-full text-xs">
        <thead>
          <tr className="bg-slate-50">
            {visibleIndices.map((colIdx) => (
              <th
                key={colIdx}
                className={`px-2.5 py-2 text-left font-medium text-slate-500 border-b border-slate-200 ${
                  highlightCols.includes(colIdx) ? 'bg-slate-100 text-slate-700' : ''
                }`}
              >
                {headers[colIdx] || `Col ${colIdx + 1}`}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {previewRows.map((row, rowIdx) => (
            <tr key={rowIdx} className="border-b border-slate-50">
              {visibleIndices.map((colIdx) => (
                <td
                  key={colIdx}
                  className={`px-2.5 py-1.5 text-slate-600 max-w-[180px] truncate ${
                    highlightCols.includes(colIdx) ? 'bg-slate-50/80' : ''
                  }`}
                >
                  {row[colIdx] || ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > maxRows && (
        <div className="px-2.5 py-1.5 text-[11px] text-slate-400 bg-slate-50 border-t border-slate-100">
          + {rows.length - maxRows} lignes
        </div>
      )}
    </div>
  );
}
