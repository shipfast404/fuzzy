'use client';

export function ColumnPicker({
  label,
  headers,
  value,
  onChange,
}: {
  label: string;
  headers: string[];
  value: number | null;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-xs text-gray-500 w-28 flex-shrink-0">{label}</label>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="flex-1 border border-gray-200 rounded-md px-2.5 py-1.5 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="" disabled>
          Sélectionner
        </option>
        {headers.map((h, i) =>
          h.trim() ? (
            <option key={i} value={i}>
              {h}
            </option>
          ) : null
        )}
      </select>
    </div>
  );
}
