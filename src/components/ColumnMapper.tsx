'use client';

interface ColumnMapperProps {
  headers: string[];
  fields: {
    key: string;
    label: string;
    required: boolean;
  }[];
  values: Record<string, number | null>;
  onChange: (key: string, value: number | null) => void;
}

export function ColumnMapper({ headers, fields, values, onChange }: ColumnMapperProps) {
  return (
    <div className="space-y-2.5">
      {fields.map((field) => (
        <div key={field.key}>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            {field.label}
            {!field.required && (
              <span className="text-slate-400 font-normal ml-1">(optionnel)</span>
            )}
          </label>
          <select
            value={values[field.key] ?? ''}
            onChange={(e) => {
              const val = e.target.value;
              onChange(field.key, val === '' ? null : parseInt(val, 10));
            }}
            className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
          >
            <option value="">Sélectionner</option>
            {headers.map((header, idx) => (
              <option key={idx} value={idx}>
                {header || `Colonne ${idx + 1}`}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
