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
    <div className="overflow-x-auto border border-gray-200 rounded-lg">
      <table className="min-w-full text-xs">
        <thead>
          <tr className="bg-gray-50">
            {visibleIndices.map((colIdx) => (
              <th
                key={colIdx}
                className={`px-3 py-2 text-left font-medium text-gray-600 border-b ${
                  highlightCols.includes(colIdx) ? 'bg-blue-50 text-blue-700' : ''
                }`}
              >
                {headers[colIdx] || `Col ${colIdx + 1}`}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {previewRows.map((row, rowIdx) => (
            <tr key={rowIdx} className="border-b border-gray-100">
              {visibleIndices.map((colIdx) => (
                <td
                  key={colIdx}
                  className={`px-3 py-1.5 text-gray-700 max-w-[200px] truncate ${
                    highlightCols.includes(colIdx) ? 'bg-blue-50/50' : ''
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
        <div className="px-3 py-1.5 text-xs text-gray-400 bg-gray-50">
          ... et {rows.length - maxRows} lignes supplémentaires
        </div>
      )}
    </div>
  );
}
