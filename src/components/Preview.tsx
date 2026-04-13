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
  const visible = headers
    .map((h, i) => (h.trim() ? i : -1))
    .filter((i) => i >= 0);

  if (!visible.length) return null;

  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg text-xs">
      <table className="min-w-full">
        <thead>
          <tr className="bg-gray-50">
            {visible.map((c) => (
              <th
                key={c}
                className={`px-2.5 py-1.5 text-left font-medium text-gray-500 border-b border-gray-200 ${
                  highlight?.includes(c) ? 'bg-blue-50 text-blue-700' : ''
                }`}
              >
                {headers[c]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 4).map((row, ri) => (
            <tr key={ri} className="border-b border-gray-50">
              {visible.map((c) => (
                <td
                  key={c}
                  className={`px-2.5 py-1.5 text-gray-600 max-w-[160px] truncate ${
                    highlight?.includes(c) ? 'bg-blue-50/40' : ''
                  }`}
                >
                  {row[c] || ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > 4 && (
        <div className="px-2.5 py-1 text-[11px] text-gray-400 bg-gray-50">
          + {rows.length - 4} lignes
        </div>
      )}
    </div>
  );
}
