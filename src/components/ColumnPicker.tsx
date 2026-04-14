'use client';

export function ColumnPicker({
  label,
  headers,
  value,
  onChange,
  autoDetected,
}: {
  label: string;
  headers: string[];
  value: number | null;
  onChange: (v: number) => void;
  autoDetected?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-xs text-slate-500 w-28 flex-shrink-0">{label}</label>
      <div className="flex-1 relative">
        <select
          value={value ?? ''}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          className="w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 appearance-none pr-8"
        >
          <option value="" disabled>Sélectionner</option>
          {headers.map((h, i) => h.trim() ? <option key={i} value={i}>{h}</option> : null)}
        </select>
        <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
      </div>
      {autoDetected && value !== null && (
        <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-medium flex-shrink-0">auto</span>
      )}
    </div>
  );
}
