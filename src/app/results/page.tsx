'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useResults } from '@/context/ResultsContext';
import { exportMatched } from '@/lib/excel';

function ExpandIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`text-slate-400 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function DetailPanel({
  marketHeaders,
  marketRow,
  catalogHeaders,
  catalogRow,
}: {
  marketHeaders: string[];
  marketRow: string[];
  catalogHeaders: string[];
  catalogRow: string[];
}) {
  // Filter out empty columns
  const marketFields = marketHeaders
    .map((h, i) => ({ label: h, value: marketRow[i] || '' }))
    .filter((f) => f.label.trim() && f.value.trim());
  const catalogFields = catalogHeaders
    .map((h, i) => ({ label: h, value: catalogRow[i] || '' }))
    .filter((f) => f.label.trim() && f.value.trim());

  return (
    <div className="grid grid-cols-2 gap-6 px-5 py-4 bg-slate-50 border-t border-slate-100">
      <div>
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Appel d&apos;offres
        </div>
        <dl className="space-y-1">
          {marketFields.map((f, i) => (
            <div key={i} className="flex gap-2 text-xs">
              <dt className="text-slate-400 min-w-[120px] flex-shrink-0 truncate">{f.label}</dt>
              <dd className="text-slate-700 truncate">{f.value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div>
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Votre catalogue
        </div>
        <dl className="space-y-1">
          {catalogFields.map((f, i) => (
            <div key={i} className="flex gap-2 text-xs">
              <dt className="text-slate-400 min-w-[120px] flex-shrink-0 truncate">{f.label}</dt>
              <dd className="text-slate-700 truncate">{f.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const router = useRouter();
  const { data } = useResults();
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const handleExport = useCallback(() => {
    if (!data) return;
    const blob = exportMatched(
      data.marketRawFile,
      data.marketHeaderRowIndex,
      data.matches
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = data.marketFileName.replace(/\.xlsx?$/i, '_matchés.xlsx');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [data]);

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10">
        <p className="text-slate-500 text-sm">Aucun résultat disponible.</p>
        <button
          onClick={() => router.push('/')}
          className="mt-4 text-sm text-blue-600 hover:text-blue-700"
        >
          &larr; Nouvelle analyse
        </button>
      </div>
    );
  }

  const { matches, totalMarket, marketHeaders, marketRows, catalogHeaders, catalogRows } = data;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-800">{matches.length} produits matchés</span>
            {' '}sur {totalMarket}
          </p>
        </div>
        {matches.length > 0 && (
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            Exporter .xlsx
          </button>
        )}
      </div>

      {/* Table */}
      {matches.length === 0 ? (
        <div className="border border-slate-200 rounded-lg p-8 text-center">
          <p className="text-slate-500 text-sm">Aucune correspondance trouvée.</p>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-left">
                <th className="px-4 py-2.5 font-medium text-slate-500 text-xs uppercase tracking-wider w-10">#</th>
                <th className="px-4 py-2.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Produit demandé</th>
                <th className="px-4 py-2.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Votre produit</th>
                <th className="px-4 py-2.5 font-medium text-slate-500 text-xs uppercase tracking-wider w-24">Code</th>
                <th className="px-4 py-2.5 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {matches.map((match, i) => {
                const isOpen = expandedRow === i;
                return (
                  <tr key={match.rowIndex} className="group">
                    <td colSpan={5} className="p-0">
                      <div
                        onClick={() => setExpandedRow(isOpen ? null : i)}
                        className={`grid cursor-pointer transition-colors ${
                          isOpen
                            ? 'bg-slate-50'
                            : i % 2 === 0
                            ? 'bg-white hover:bg-slate-50/70'
                            : 'bg-slate-50/30 hover:bg-slate-50/70'
                        }`}
                        style={{ gridTemplateColumns: '40px 1fr 1fr 96px 40px' }}
                      >
                        <div className="px-4 py-3 text-slate-400 text-xs tabular-nums">{i + 1}</div>
                        <div className="px-4 py-3 text-slate-800 truncate">{match.originalDesignation}</div>
                        <div className="px-4 py-3 text-slate-600 truncate">{match.matchedDesignation}</div>
                        <div className="px-4 py-3 font-mono text-xs text-slate-500 tabular-nums">{match.matchedCode}</div>
                        <div className="px-2 py-3 flex items-center justify-center">
                          <ExpandIcon open={isOpen} />
                        </div>
                      </div>
                      {isOpen && (
                        <DetailPanel
                          marketHeaders={marketHeaders}
                          marketRow={marketRows[match.rowIndex] || []}
                          catalogHeaders={catalogHeaders}
                          catalogRow={catalogRows[match.catalogRowIndex] || []}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Back link */}
      <div className="mt-8">
        <button
          onClick={() => router.push('/')}
          className="text-sm text-slate-500 hover:text-slate-700 inline-flex items-center gap-1"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
          Nouvelle analyse
        </button>
      </div>
    </div>
  );
}
