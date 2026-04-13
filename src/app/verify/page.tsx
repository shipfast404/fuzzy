'use client';

import { useRouter } from 'next/navigation';
import { useData } from '@/context/DataContext';

function OverlapBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full rounded-full bg-blue-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] text-gray-400 tabular-nums">{pct}%</span>
    </div>
  );
}

export default function VerifyPage() {
  const router = useRouter();
  const { data } = useData();

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10">
        <p className="text-gray-500 text-sm">Aucune donnée. Lancez d&apos;abord une analyse.</p>
        <button onClick={() => router.push('/')} className="mt-3 text-sm text-blue-600 hover:text-blue-700">&larr; Retour</button>
      </div>
    );
  }

  const { results, catFile, aoFile } = data;
  const { matches, nearMisses } = results;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <button onClick={() => router.push('/')} className="text-xs text-gray-400 hover:text-gray-600 mb-1 inline-flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
            Retour aux résultats
          </button>
          <h1 className="text-lg font-semibold text-gray-800">Vérification des matchs</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            <span className="text-emerald-600 font-medium">{matches.length} confirmé{matches.length > 1 ? 's' : ''}</span>
            {nearMisses.length > 0 && <><span className="mx-1.5 text-gray-300">·</span><span className="text-amber-600">{nearMisses.length} quasi</span></>}
            <span className="mx-1.5 text-gray-300">·</span>
            <span className="text-gray-400">{results.unmatched.length} sans correspondance</span>
            <span className="mx-1.5 text-gray-300">·</span>
            <span className="text-gray-400">{results.totalAo} lignes au total</span>
          </p>
        </div>
      </div>

      {/* ═══ Confirmed matches ═══ */}
      <div className="space-y-3 mb-10">
        {matches.map((m, i) => (
          <div key={m.marketRowIndex} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Match header */}
            <div className="px-5 py-3 bg-white">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 mb-0.5">Ligne {m.marketRowIndex + 1} de l&apos;appel d&apos;offres</p>
                  <p className="text-sm font-medium text-gray-800">{m.marketDesignation}</p>
                </div>
                <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5">
                  Match #{i + 1}
                </span>
              </div>
            </div>

            {/* Retained match */}
            <div className="px-5 py-3 bg-emerald-50/40 border-t border-gray-100 border-l-2 border-l-emerald-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500 flex-shrink-0"><polyline points="20 6 9 17 4 12" /></svg>
                  <div>
                    <p className="text-sm text-gray-800">{m.catalogDesignation}</p>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">Code {m.catalogCode}</p>
                  </div>
                </div>
                <OverlapBar value={m.overlap} />
              </div>
            </div>

            {/* Alternatives */}
            {m.alternatives.length > 0 && (
              <div className="border-t border-gray-100">
                <div className="px-5 py-2 bg-gray-50/50">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Autres candidats</p>
                  <div className="space-y-1.5">
                    {m.alternatives.map((a, j) => (
                      <div key={j} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3">
                          <span className="w-3.5 text-center text-[10px] text-gray-300">{j + 2}</span>
                          <div>
                            <span className="text-gray-600">{a.designation}</span>
                            <span className="text-xs text-gray-400 font-mono ml-2">{a.code}</span>
                          </div>
                        </div>
                        <OverlapBar value={a.overlap} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Detail from both files */}
            <details className="border-t border-gray-100 group">
              <summary className="px-5 py-2 text-xs text-gray-400 hover:text-gray-600 cursor-pointer select-none flex items-center gap-1">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-open:rotate-90"><polyline points="9 18 15 12 9 6" /></svg>
                Détails complets
              </summary>
              <div className="grid grid-cols-2 gap-6 px-5 py-3 bg-gray-50/50">
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Appel d&apos;offres</p>
                  <dl className="space-y-0.5">
                    {aoFile.headers.map((h, hi) => {
                      const v = (aoFile.rows[m.marketRowIndex]?.[hi] || '').trim();
                      if (!h.trim() || !v) return null;
                      return <div key={hi} className="flex gap-2 text-[11px] leading-5"><dt className="text-gray-400 w-32 flex-shrink-0 truncate">{h}</dt><dd className="text-gray-700">{v}</dd></div>;
                    })}
                  </dl>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Votre catalogue</p>
                  <dl className="space-y-0.5">
                    {catFile.headers.map((h, hi) => {
                      const v = (catFile.rows[m.catalogRowIndex]?.[hi] || '').trim();
                      if (!h.trim() || !v) return null;
                      return <div key={hi} className="flex gap-2 text-[11px] leading-5"><dt className="text-gray-400 w-32 flex-shrink-0 truncate">{h}</dt><dd className="text-gray-700">{v}</dd></div>;
                    })}
                  </dl>
                </div>
              </div>
            </details>
          </div>
        ))}
      </div>

      {/* ═══ Near misses ═══ */}
      {nearMisses.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            <h2 className="text-sm font-semibold text-gray-700">Quasi-matchs non retenus</h2>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Ces produits ont une correspondance partielle mais insuffisante pour être confirmés automatiquement.
          </p>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-left">
                  <th className="px-4 py-2 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Produit demandé</th>
                  <th className="px-4 py-2 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Candidat le plus proche</th>
                  <th className="px-4 py-2 text-[11px] font-medium text-gray-400 uppercase tracking-wider w-24">Code</th>
                  <th className="px-4 py-2 text-[11px] font-medium text-gray-400 uppercase tracking-wider w-24">Similarité</th>
                </tr>
              </thead>
              <tbody>
                {nearMisses.map((nm, i) => (
                  <tr key={nm.marketRowIndex} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}>
                    <td className="px-4 py-2.5 text-gray-800">{nm.marketDesignation}</td>
                    <td className="px-4 py-2.5 text-gray-500">{nm.bestCandidate}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-400">{nm.bestCode}</td>
                    <td className="px-4 py-2.5"><OverlapBar value={nm.bestOverlap} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ Unmatched — no correspondence at all ═══ */}
      {results.unmatched.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center gap-2 mb-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><circle cx="12" cy="12" r="10" /><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            <h2 className="text-sm font-semibold text-gray-700">Aucune correspondance ({results.unmatched.length})</h2>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Ces produits de l&apos;appel d&apos;offres n&apos;ont aucune correspondance dans votre catalogue.
          </p>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="divide-y divide-gray-100">
              {results.unmatched.map((u, i) => (
                <div key={u.marketRowIndex} className={`px-4 py-2 text-sm text-gray-500 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                  {u.marketDesignation}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Back */}
      <div className="mt-10 pt-6 border-t border-gray-100">
        <button onClick={() => router.push('/')} className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
          Retour aux résultats
        </button>
      </div>
    </div>
  );
}
