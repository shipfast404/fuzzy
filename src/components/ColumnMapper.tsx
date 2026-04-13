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
    <div className="space-y-3">
      {fields.map((field) => (
        <div key={field.key}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {field.label}
            {!field.required && (
              <span className="text-gray-400 font-normal ml-1">(optionnel)</span>
            )}
          </label>
          <select
            value={values[field.key] ?? ''}
            onChange={(e) => {
              const val = e.target.value;
              onChange(field.key, val === '' ? null : parseInt(val, 10));
            }}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">-- Sélectionner une colonne --</option>
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
