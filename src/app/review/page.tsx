'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { exportExcel } from '@/lib/excel';
import { Stepper } from '@/components/Stepper';
import { MatchTable } from '@/components/MatchTable';

export default function ReviewPage() {
  const router = useRouter();
  const ctx = useAppContext();
  const [threshold, setThreshold] = useState(40);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const { matchResults, catalogItems, marketFile, marketMapping } = ctx;

  const doExport = useCallback((onlyRelevant: boolean) => {
    if (!marketFile || !marketMapping) return;

    const toExport = onlyRelevant
      ? matchResults.filter((r) => r.status === 'manual' || r.score >= threshold)
      : matchResults;

    const blob = exportExcel(
      marketFile.rawFile,
      marketFile.headerRowIndex,
      toExport,
      marketMapping,
      threshold
    );

    const suffix = onlyRelevant ? '_pertinents' : '_completed';
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = marketFile.fileName.replace(/\.xlsx?$/i, `${suffix}.xlsx`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExportMenuOpen(false);
  }, [marketFile, marketMapping, matchResults, threshold]);

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

  const relevantCount = matchResults.filter(
    (r) => r.status !== 'ignored' && (r.status === 'manual' || r.score >= threshold)
  ).length;
  const activeCount = matchResults.filter((r) => r.status !== 'ignored').length;
  const pct = activeCount > 0 ? Math.round((relevantCount / activeCount) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <Stepper currentStep={1} />

      <div className="flex items-start justify-between mb-5 gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">
            Vérification des résultats
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            <span className="font-medium text-emerald-700">{relevantCount} lignes pertinentes</span>
            {' '}sur {activeCount} ({pct}%)
            <span className="mx-1.5 text-slate-300">|</span>
            <span className="text-slate-400">{marketFile.fileName}</span>
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0 items-center">
          {/* Threshold control */}
          <div className="flex items-center gap-2 mr-2 border border-slate-200 rounded-lg px-3 py-1.5 bg-white">
            <label className="text-xs text-slate-500 whitespace-nowrap">Seuil</label>
            <input
              type="range"
              min={10}
              max={80}
              step={5}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-20 h-1 accent-slate-700"
            />
            <span className="text-xs font-medium text-slate-700 tabular-nums w-8 text-right">{threshold}%</span>
          </div>

          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
          >
            Retour
          </button>

          {/* Export dropdown */}
          <div className="relative">
            <button
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              className="inline-flex items-center gap-2 px-5 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
              Exporter
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
            </button>
            {exportMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setExportMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-lg shadow-lg py-1 w-56">
                  <button
                    onClick={() => doExport(false)}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex flex-col"
                  >
                    <span className="font-medium">Exporter tout</span>
                    <span className="text-xs text-slate-400">Fichier complet avec statuts</span>
                  </button>
                  <button
                    onClick={() => doExport(true)}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex flex-col border-t border-slate-100"
                  >
                    <span className="font-medium">Pertinents uniquement</span>
                    <span className="text-xs text-slate-400">{relevantCount} lignes</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <MatchTable
        results={matchResults}
        catalogItems={catalogItems}
        threshold={threshold}
        onUpdate={ctx.updateMatchResult}
      />
    </div>
  );
}
