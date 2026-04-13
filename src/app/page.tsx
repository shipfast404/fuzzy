'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { parseExcel, exportMatched } from '@/lib/excel';
import { buildCatalog, match } from '@/lib/matching';
import { suggestDesignation, suggestCode } from '@/lib/columns';
import { useData } from '@/context/DataContext';
import type { ParsedFile, MatchResults } from '@/lib/types';
import { FileUploader } from '@/components/FileUploader';
import { ColumnPicker } from '@/components/ColumnPicker';
import { Preview } from '@/components/Preview';

/* ── Expand detail ── */
function Detail({ mH, mR, cH, cR }: { mH: string[]; mR: string[]; cH: string[]; cR: string[] }) {
  const f = (h: string[], r: string[]) =>
    h.map((l, i) => ({ l: l.trim(), v: (r[i] || '').trim() })).filter((x) => x.l && x.v);
  return (
    <div className="animate-slide-down border-t border-gray-100 border-l-2 border-l-blue-400">
      <div className="grid grid-cols-2 gap-8 px-6 py-4 bg-gray-50/70">
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Appel d&apos;offres</p>
          <dl className="space-y-0.5">{f(mH, mR).map((x, i) => <div key={i} className="flex gap-2 text-xs leading-5"><dt className="text-gray-400 w-36 flex-shrink-0 truncate">{x.l}</dt><dd className="text-gray-700">{x.v}</dd></div>)}</dl>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Votre catalogue</p>
          <dl className="space-y-0.5">{f(cH, cR).map((x, i) => <div key={i} className="flex gap-2 text-xs leading-5"><dt className="text-gray-400 w-36 flex-shrink-0 truncate">{x.l}</dt><dd className="text-gray-700">{x.v}</dd></div>)}</dl>
        </div>
      </div>
    </div>
  );
}

/* ── Page ── */
export default function Home() {
  const router = useRouter();
  const { data: savedData, setData } = useData();

  const [catFile, setCatFile] = useState<ParsedFile | null>(savedData?.catFile ?? null);
  const [aoFile, setAoFile] = useState<ParsedFile | null>(savedData?.aoFile ?? null);
  const [catName, setCatName] = useState<number | null>(null);
  const [catCode, setCatCode] = useState<number | null>(null);
  const [catAutoN, setCatAutoN] = useState(false);
  const [catAutoC, setCatAutoC] = useState(false);
  const [aoCol, setAoCol] = useState<number | null>(null);
  const [aoAuto, setAoAuto] = useState(false);

  const [results, setResults] = useState<MatchResults | null>(savedData?.results ?? null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (!catFile) return; const n = suggestDesignation(catFile.headers); const c = suggestCode(catFile.headers); if (n !== null) { setCatName(n); setCatAutoN(true); } if (c !== null) { setCatCode(c); setCatAutoC(true); } }, [catFile]);
  useEffect(() => { if (!aoFile) return; const d = suggestDesignation(aoFile.headers); if (d !== null) { setAoCol(d); setAoAuto(true); } }, [aoFile]);

  const ready = catFile && aoFile && catName !== null && catCode !== null && aoCol !== null;

  const analyze = useCallback(() => {
    if (!ready || !catFile || !aoFile) return;
    setLoading(true); setError(null);
    setTimeout(() => {
      try {
        const catalog = buildCatalog(catFile.rows, catName!, catCode!);
        const rows = aoFile.rows.map((r, i) => ({ idx: i, text: (r[aoCol!] || '').trim() })).filter((r) => r.text.length > 2);
        const res = match(rows, catalog);
        setResults(res);
        setData({ catFile, aoFile, results: res });
        setExpanded(null);
      } catch { setError("Erreur lors de l'analyse"); } finally { setLoading(false); }
    }, 30);
  }, [ready, catFile, aoFile, catName, catCode, aoCol, setData]);

  const download = useCallback(() => {
    if (!results || !aoFile) return;
    const blob = exportMatched(aoFile.rawFile, aoFile.headerRowIndex, results.matches);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = aoFile.fileName.replace(/\.xlsx?$/i, `_${results.matches.length}-matchés.xlsx`);
    a.click(); URL.revokeObjectURL(a.href);
  }, [results, aoFile]);

  const reset = () => { setResults(null); setExpanded(null); };
  const showUpload = results === null;
  const pct = results ? Math.round(results.matches.length / results.totalAo * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 pb-20">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" /><line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" /></svg>
        <span className="text-sm font-semibold text-gray-600 tracking-tight">Katalog</span>
      </div>

      {error && <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

      {/* ═══ Upload ═══ */}
      {showUpload && (
        <div className="animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
            <section className="bg-gray-50 border border-gray-200 rounded-lg">
              <div className="px-4 py-2.5 border-b border-gray-200/80"><h2 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Votre catalogue</h2></div>
              <div className="p-4 space-y-3">
                <FileUploader label="Importer votre catalogue" onFile={async (f) => { try { setError(null); setCatFile(await parseExcel(f)); } catch { setError('Fichier illisible'); } }} fileName={catFile?.fileName} />
                {catFile && (<>
                  <ColumnPicker label="Nom produit" headers={catFile.headers} value={catName} onChange={(v) => { setCatName(v); setCatAutoN(false); }} autoDetected={catAutoN} />
                  <ColumnPicker label="Code produit" headers={catFile.headers} value={catCode} onChange={(v) => { setCatCode(v); setCatAutoC(false); }} autoDetected={catAutoC} />
                  <Preview headers={catFile.headers} rows={catFile.rows} highlight={[catName, catCode].filter((c): c is number => c !== null)} />
                </>)}
              </div>
            </section>
            <section className="bg-gray-50 border border-gray-200 rounded-lg">
              <div className="px-4 py-2.5 border-b border-gray-200/80"><h2 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Appel d&apos;offres</h2></div>
              <div className="p-4 space-y-3">
                <FileUploader label="Importer l'appel d'offres" onFile={async (f) => { try { setError(null); setAoFile(await parseExcel(f)); } catch { setError('Fichier illisible'); } }} fileName={aoFile?.fileName} />
                {aoFile && (<>
                  <ColumnPicker label="Produit demandé" headers={aoFile.headers} value={aoCol} onChange={(v) => { setAoCol(v); setAoAuto(false); }} autoDetected={aoAuto} />
                  <Preview headers={aoFile.headers} rows={aoFile.rows} highlight={aoCol !== null ? [aoCol] : []} />
                </>)}
              </div>
            </section>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-400">{catFile && aoFile && <>{catFile.rows.length} produits catalogue &times; {aoFile.rows.length} lignes AO</>}</div>
            <button onClick={analyze} disabled={!ready || loading} className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${ready && !loading ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-600/20' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
              {loading ? (<><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" /><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" /></svg>Analyse...</>) : 'Analyser'}
            </button>
          </div>
        </div>
      )}

      {/* ═══ Context bar ═══ */}
      {!showUpload && catFile && aoFile && (
        <div className="flex items-center justify-between mb-6 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-500 animate-fade-in">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
              <span className="truncate max-w-[180px]">{catFile.fileName}</span><span className="text-gray-400">({catFile.rows.length})</span>
            </span>
            <span className="text-gray-300">&times;</span>
            <span className="flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
              <span className="truncate max-w-[180px]">{aoFile.fileName}</span><span className="text-gray-400">({aoFile.rows.length})</span>
            </span>
          </div>
          <button onClick={reset} className="text-blue-600 hover:text-blue-700 font-medium">Nouvelle analyse</button>
        </div>
      )}

      {/* ═══ Results ═══ */}
      {results !== null && (
        <div className="animate-fade-in">
          <div className="flex items-end justify-between mb-5">
            <div>
              <p className="text-2xl font-semibold text-gray-800 tabular-nums">{results.matches.length} <span className="text-base font-normal text-gray-400">produits trouvés</span></p>
              <p className="text-sm text-gray-500 mt-0.5">
                {results.matches.length > 0
                  ? <>Vous pouvez répondre à <span className="font-medium text-gray-700">{pct}%</span> de cet appel d&apos;offres</>
                  : "Aucune correspondance avec votre catalogue"}
                {results.nearMisses.length > 0 && (
                  <span className="text-gray-400"> · {results.nearMisses.length} quasi-match{results.nearMisses.length > 1 ? 's' : ''}</span>
                )}
              </p>
            </div>
            <div className="flex gap-2.5">
              {(results.matches.length > 0 || results.nearMisses.length > 0) && (
                <button
                  onClick={() => router.push('/verify')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
                  Vérifier les matchs
                </button>
              )}
              {results.matches.length > 0 && (
                <button onClick={download} className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                  Exporter .xlsx
                </button>
              )}
            </div>
          </div>

          {results.matches.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-left">
                    <th className="px-4 py-2.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider w-10">#</th>
                    <th className="px-4 py-2.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Produit demandé</th>
                    <th className="px-4 py-2.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Votre produit</th>
                    <th className="px-4 py-2.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider w-24">Code</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {results.matches.map((m, i) => {
                    const open = expanded === i;
                    return (
                      <tr key={m.marketRowIndex}>
                        <td colSpan={5} className="p-0">
                          <div onClick={() => setExpanded(open ? null : i)} className={`grid cursor-pointer transition-colors duration-100 ${open ? 'bg-blue-50/40' : i % 2 === 0 ? 'bg-white hover:bg-gray-50/60' : 'bg-gray-50/30 hover:bg-gray-50/60'}`} style={{ gridTemplateColumns: '40px 1fr 1fr 96px 32px' }}>
                            <div className="px-4 py-3 text-gray-400 text-xs tabular-nums self-center">{i + 1}</div>
                            <div className="px-4 py-3 text-gray-800 truncate self-center">{m.marketDesignation}</div>
                            <div className="px-4 py-3 text-gray-600 truncate self-center">{m.catalogDesignation}</div>
                            <div className="px-4 py-3 font-mono text-xs text-gray-500 tabular-nums self-center">{m.catalogCode}</div>
                            <div className="flex items-center justify-center self-center"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-gray-400 transition-transform duration-150 ${open ? 'rotate-90' : ''}`}><polyline points="9 18 15 12 9 6" /></svg></div>
                          </div>
                          {open && catFile && aoFile && <Detail mH={aoFile.headers} mR={aoFile.rows[m.marketRowIndex] || []} cH={catFile.headers} cR={catFile.rows[m.catalogRowIndex] || []} />}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
