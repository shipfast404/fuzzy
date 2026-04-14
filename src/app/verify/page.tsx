'use client';

import { useRouter } from 'next/navigation';
import { useData } from '@/context/DataContext';

function OverlapBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div className="h-full rounded-full bg-blue-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] text-slate-400 tabular-nums w-8 text-right">{pct}%</span>
    </div>
  );
}

export default function VerifyPage() {
  const router = useRouter();
  const { data, promoteAlternative, dismissMatch, confirmNearMiss, dismissNearMiss } = useData();

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10">
        <p className="text-slate-500 text-sm">Aucune donnée. Lancez d&apos;abord une analyse.</p>
        <button onClick={() => router.push('/')} className="mt-3 text-sm text-blue-600 hover:text-blue-700">&larr; Retour</button>
      </div>
    );
  }

  const { results, catFile, aoFile } = data;
  const { matches, nearMisses, unmatched } = results;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 pb-20">
      {/* Header */}
      <div className="mb-8">
        <button onClick={() => router.push('/')} className="text-xs text-slate-400 hover:text-slate-600 mb-1 inline-flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
          Retour aux résultats
        </button>
        <h1 className="text-lg font-semibold text-slate-800">Vérification des matchs</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          <span className="text-emerald-600 font-medium">{matches.length} confirmé{matches.length > 1 ? 's' : ''}</span>
          {nearMisses.length > 0 && <><span className="mx-1.5 text-slate-300">·</span><span className="text-amber-600">{nearMisses.length} quasi</span></>}
          <span className="mx-1.5 text-slate-300">·</span>
          <span className="text-slate-400">{unmatched.length} sans correspondance</span>
          <span className="mx-1.5 text-slate-300">·</span>
          <span className="text-slate-400">{results.totalAo} au total</span>
        </p>
        <p className="text-xs text-slate-400 mt-2">
          Vous pouvez promouvoir une alternative, écarter un match, ou confirmer un quasi-match ci-dessous.
        </p>
      </div>

      {/* ═══ Confirmed matches ═══ */}
      {matches.length > 0 && (
        <div className="space-y-3 mb-10">
          {matches.map((m, i) => (
            <div key={`${m.marketRowIndex}-${i}`} className="border border-slate-200 rounded-lg overflow-hidden">
              {/* Match header */}
              <div className="px-5 py-3 bg-white flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-0.5">Ligne {m.marketRowIndex + 1} · Match #{i + 1}</p>
                  <p className="text-sm font-medium text-slate-800">{m.marketDesignation}</p>
                </div>
                <button
                  onClick={() => {
                    if (confirm('Écarter ce match ? Il sera déplacé dans "Sans correspondance".')) dismissMatch(i);
                  }}
                  className="text-xs text-slate-400 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors flex-shrink-0"
                >
                  Écarter
                </button>
              </div>

              {/* Retained match */}
              <div className="px-5 py-3 bg-emerald-50/40 border-t border-slate-100 border-l-2 border-l-emerald-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500 flex-shrink-0"><polyline points="20 6 9 17 4 12" /></svg>
                    <div>
                      <p className="text-sm text-slate-800">{m.catalogDesignation}</p>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">Code {m.catalogCode}</p>
                    </div>
                  </div>
                  <OverlapBar value={m.overlap} />
                </div>
              </div>

              {/* Alternatives */}
              {m.alternatives.length > 0 && (
                <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-2.5">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Autres candidats</p>
                  <div className="space-y-1">
                    {m.alternatives.map((a, j) => (
                      <div key={j} className="flex items-center justify-between gap-3 group">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="w-3.5 text-center text-[10px] text-slate-300 flex-shrink-0">{j + 2}</span>
                          <div className="min-w-0 flex-1">
                            <span className="text-sm text-slate-600 truncate">{a.designation}</span>
                            <span className="text-xs text-slate-400 font-mono ml-2">{a.code}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <OverlapBar value={a.overlap} />
                          <button
                            onClick={() => promoteAlternative(i, j)}
                            className="text-[11px] text-blue-600 hover:bg-blue-50 px-2 py-0.5 rounded font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Utiliser ce produit à la place"
                          >
                            Choisir
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Details */}
              <details className="border-t border-slate-100 group">
                <summary className="px-5 py-2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer select-none flex items-center gap-1">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-open:rotate-90"><polyline points="9 18 15 12 9 6" /></svg>
                  Détails complets
                </summary>
                <div className="grid grid-cols-2 gap-6 px-5 py-3 bg-slate-50/50">
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Appel d&apos;offres</p>
                    <dl className="space-y-0.5">
                      {aoFile.headers.map((h, hi) => {
                        const v = (aoFile.rows[m.marketRowIndex]?.[hi] || '').trim();
                        if (!h.trim() || !v) return null;
                        return <div key={hi} className="flex gap-2 text-[11px] leading-5"><dt className="text-slate-400 w-32 flex-shrink-0 truncate">{h}</dt><dd className="text-slate-700">{v}</dd></div>;
                      })}
                    </dl>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Votre catalogue</p>
                    <dl className="space-y-0.5">
                      {catFile.headers.map((h, hi) => {
                        const v = (catFile.rows[m.catalogRowIndex]?.[hi] || '').trim();
                        if (!h.trim() || !v) return null;
                        return <div key={hi} className="flex gap-2 text-[11px] leading-5"><dt className="text-slate-400 w-32 flex-shrink-0 truncate">{h}</dt><dd className="text-slate-700">{v}</dd></div>;
                      })}
                    </dl>
                  </div>
                </div>
              </details>
            </div>
          ))}
        </div>
      )}

      {/* ═══ Near misses (can be promoted) ═══ */}
      {nearMisses.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            <h2 className="text-sm font-semibold text-slate-700">Quasi-matchs non retenus ({nearMisses.length})</h2>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Correspondance partielle. Si une ligne correspond vraiment, confirmez-la pour l&apos;ajouter aux matchs.
          </p>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-left">
                  <th className="px-4 py-2 text-[11px] font-medium text-slate-400 uppercase tracking-wider">Produit demandé</th>
                  <th className="px-4 py-2 text-[11px] font-medium text-slate-400 uppercase tracking-wider">Candidat le plus proche</th>
                  <th className="px-4 py-2 text-[11px] font-medium text-slate-400 uppercase tracking-wider w-24">Code</th>
                  <th className="px-4 py-2 text-[11px] font-medium text-slate-400 uppercase tracking-wider w-24">Similarité</th>
                  <th className="px-4 py-2 w-40"></th>
                </tr>
              </thead>
              <tbody>
                {nearMisses.map((nm, i) => (
                  <tr key={`${nm.marketRowIndex}-${i}`} className={`${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'} group`}>
                    <td className="px-4 py-2.5 text-slate-800">{nm.marketDesignation}</td>
                    <td className="px-4 py-2.5 text-slate-500">{nm.bestCandidate}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-slate-400">{nm.bestCode}</td>
                    <td className="px-4 py-2.5"><OverlapBar value={nm.bestOverlap} /></td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => confirmNearMiss(i)}
                          className="text-[11px] text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded font-medium"
                        >
                          ✓ Confirmer
                        </button>
                        <button
                          onClick={() => dismissNearMiss(i)}
                          className="text-[11px] text-slate-500 hover:bg-slate-100 px-2 py-1 rounded font-medium"
                        >
                          Écarter
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ Unmatched ═══ */}
      {unmatched.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><circle cx="12" cy="12" r="10" /><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            <h2 className="text-sm font-semibold text-slate-700">Aucune correspondance ({unmatched.length})</h2>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Ces produits n&apos;ont aucune correspondance dans votre catalogue.
          </p>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="divide-y divide-slate-100">
              {unmatched.map((u, i) => (
                <div key={`${u.marketRowIndex}-${i}`} className={`px-4 py-2 text-sm text-slate-500 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                  {u.marketDesignation}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Back */}
      <div className="pt-6 border-t border-slate-100">
        <button onClick={() => router.push('/')} className="text-sm text-slate-500 hover:text-slate-700 inline-flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
          Retour aux résultats
        </button>
      </div>
    </div>
  );
}
