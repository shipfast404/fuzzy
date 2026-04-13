'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { exportExcel } from '@/lib/excel';
import { Stepper } from '@/components/Stepper';
import { MatchTable } from '@/components/MatchTable';

export default function ReviewPage() {
  const router = useRouter();
  const ctx = useAppContext();

  const { matchResults, catalogItems, marketFile, marketMapping } = ctx;

  const handleDownload = useCallback(() => {
    if (!marketFile || !marketMapping) return;

    const blob = exportExcel(
      marketFile.rawFile,
      marketFile.headerRowIndex,
      matchResults,
      marketMapping
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = marketFile.fileName.replace(/\.xlsx?$/i, '_completed.xlsx');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [marketFile, marketMapping, matchResults]);

  if (!marketFile || matchResults.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8">
        <Stepper currentStep={1} />
        <div className="text-center py-16">
          <p className="text-slate-500 mb-4">Aucun appariement en cours.</p>
          <button
            onClick={() => router.push('/')}
            className="px-5 py-2 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-900"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  const matchedCount = matchResults.filter(
    (r) => r.matchedCode && r.status !== 'ignored'
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <Stepper currentStep={1} />

      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">
            Vérification des résultats
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {matchedCount}/{matchResults.length} produits appariés
            <span className="mx-1.5 text-slate-300">|</span>
            <span className="text-slate-400">{marketFile.fileName}</span>
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
          >
            Retour
          </button>
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-2 px-5 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            Exporter .xlsx
          </button>
        </div>
      </div>

      <MatchTable
        results={matchResults}
        catalogItems={catalogItems}
        onUpdate={ctx.updateMatchResult}
      />
    </div>
  );
}
