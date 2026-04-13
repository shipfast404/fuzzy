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
          <p className="text-gray-500 mb-4">Aucun matching en cours.</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            Retour à l&apos;import
          </button>
        </div>
      </div>
    );
  }

  const matchedCount = matchResults.filter(
    (r) => r.matchedCode && r.status !== 'ignored'
  ).length;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <Stepper currentStep={1} />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            Vérification des matchs
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {matchedCount} / {matchResults.length} produits matchés
            {' - '}
            <span className="text-gray-400">{marketFile.fileName}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
          >
            Retour
          </button>
          <button
            onClick={handleDownload}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            Télécharger le fichier complété
          </button>
        </div>
      </div>

      <MatchTable
        results={matchResults}
        catalogItems={catalogItems}
        onUpdate={ctx.updateMatchResult}
      />

      <div className="mt-6 text-center">
        <button
          onClick={handleDownload}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          Télécharger le fichier complété (.xlsx)
        </button>
      </div>
    </div>
  );
}
