'use client';

export function Preview({
  headers,
  rows,
  highlight,
}: {
  headers: string[];
  rows: string[][];
  highlight?: number[];
}) {
  const vis = headers.map((h, i) => (h.trim() ? i : -1)).filter((i) => i >= 0);
  if (!vis.length) return null;

  return (
    <div className="overflow-x-auto border border-gray-200 rounded-md text-[11px]">
      <table className="min-w-full">
        <thead>
          <tr className="bg-gray-50/80">
            {vis.map((c) => (
              <th key={c} className={`px-2 py-1.5 text-left font-medium border-b border-gray-200 ${highlight?.includes(c) ? 'text-blue-600 bg-blue-50/60' : 'text-gray-400'}`}>
                {headers[c]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 3).map((row, ri) => (
            <tr key={ri}>
              {vis.map((c) => (
                <td key={c} className={`px-2 py-1 text-gray-600 max-w-[140px] truncate ${highlight?.includes(c) ? 'bg-blue-50/30' : ''}`}>
                  {row[c] || ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-2 py-1 text-[10px] text-gray-400 bg-gray-50/60 border-t border-gray-100">
        {rows.length} lignes
      </div>
    </div>
  );
}
