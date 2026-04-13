'use client';

import { useCallback, useState, useRef } from 'react';

export function FileUploader({
  label,
  onFile,
  fileName,
}: {
  label: string;
  onFile: (f: File) => void;
  fileName?: string;
}) {
  const [drag, setDrag] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDrag(false);
      const f = e.dataTransfer.files[0];
      if (f) onFile(f);
    },
    [onFile]
  );

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={onDrop}
      onClick={() => ref.current?.click()}
      className={`border border-dashed rounded-lg px-4 py-4 text-center cursor-pointer transition-all duration-150 ${
        drag
          ? 'border-blue-400 bg-blue-50/60'
          : fileName
          ? 'border-emerald-300 bg-emerald-50/30'
          : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50/50'
      }`}
    >
      <input ref={ref} type="file" accept=".xlsx,.xls" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} className="hidden" />
      {fileName ? (
        <div className="flex items-center justify-center gap-2">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
          <span className="text-sm text-gray-700 truncate max-w-[220px]">{fileName}</span>
          <span className="text-xs text-gray-400 ml-1">Changer</span>
        </div>
      ) : (
        <>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-gray-300 mb-1"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><polyline points="9 15 12 12 15 15" /></svg>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">.xlsx / .xls</p>
        </>
      )}
    </div>
  );
}
