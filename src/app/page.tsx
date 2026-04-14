'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { parseExcel, exportMatched } from '@/lib/excel';
import { buildCatalog, match } from '@/lib/matching';
import { suggestDesignation, suggestCode, suggestQty, suggestUnit } from '@/lib/columns';
import { saveCatalog, loadCatalog, clearCatalog } from '@/lib/storage';
import { preferenceCount, clearPreferences } from '@/lib/preferences';
import { verifyMatches, isSemanticEnabled } from '@/lib/semantic';
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
    <div className="animate-slide-down border-t border-slate-100 border-l-2 border-l-blue-500">
      <div className="grid grid-cols-2 gap-8 px-6 py-4 bg-slate-50/70">
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Appel d&apos;offres</p>
          <dl className="space-y-0.5">{f(mH, mR).map((x, i) => <div key={i} className="flex gap-2 text-xs leading-5"><dt className="text-slate-400 w-36 flex-shrink-0 truncate">{x.l}</dt><dd className="text-slate-700">{x.v}</dd></div>)}</dl>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Votre catalogue</p>
          <dl className="space-y-0.5">{f(cH, cR).map((x, i) => <div key={i} className="flex gap-2 text-xs leading-5"><dt className="text-slate-400 w-36 flex-shrink-0 truncate">{x.l}</dt><dd className="text-slate-700">{x.v}</dd></div>)}</dl>
        </div>
      </div>
    </div>
  );
}

/* ── Parsing skeleton ── */
function Skeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      <div className="h-10 bg-slate-100 rounded-md" />
      <div className="h-7 bg-slate-100 rounded-md" />
      <div className="h-7 bg-slate-100 rounded-md" />
      <div className="h-24 bg-slate-100 rounded-md" />
    </div>
  );
}

type SortKey = 'order' | 'aoRow' | 'market' | 'catalog' | 'code';

/* ── Main page ── */
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

  const [catLoading, setCatLoading] = useState(false);
  const [aoLoading, setAoLoading] = useState(false);
  const [restoredFromStorage, setRestoredFromStorage] = useState(false);

  const [results, setResults] = useState<MatchResults | null>(savedData?.results ?? null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>('order');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  /* Full-page drop state */
  const [pageDragging, setPageDragging] = useState(false);
  const [prefCount, setPrefCount] = useState(0);
  const [semanticAvailable, setSemanticAvailable] = useState(false);
  const [semanticStage, setSemanticStage] = useState<'idle' | 'fuzzy' | 'semantic'>('idle');

  useEffect(() => {
    setPrefCount(preferenceCount());
  }, [results]);

  useEffect(() => {
    isSemanticEnabled().then(setSemanticAvailable);
  }, []);

  /* Restore catalog from localStorage on mount */
  useEffect(() => {
    if (catFile) return;
    const stored = loadCatalog();
    if (!stored) return;
    setCatFile({
      fileName: stored.fileName,
      headers: stored.headers,
      rows: stored.rows,
      headerRowIndex: stored.headerRowIndex,
      rawFile: new ArrayBuffer(0),
    });
    setCatName(stored.nameCol);
    setCatCode(stored.codeCol);
    setRestoredFromStorage(true);
  }, [catFile]);

  useEffect(() => {
    if (!catFile || restoredFromStorage) return;
    const n = suggestDesignation(catFile.headers);
    const c = suggestCode(catFile.headers);
    if (n !== null) { setCatName(n); setCatAutoN(true); }
    if (c !== null) { setCatCode(c); setCatAutoC(true); }
  }, [catFile, restoredFromStorage]);

  useEffect(() => {
    if (!aoFile) return;
    const d = suggestDesignation(aoFile.headers);
    if (d !== null) { setAoCol(d); setAoAuto(true); }
  }, [aoFile]);

  const ready = catFile && aoFile && catName !== null && catCode !== null && aoCol !== null;

  const aoQtyCol = useMemo(() => aoFile ? suggestQty(aoFile.headers) : null, [aoFile]);
  const aoUnitCol = useMemo(() => aoFile ? suggestUnit(aoFile.headers) : null, [aoFile]);

  const handleCat = async (f: File) => {
    setCatLoading(true); setError(null); setRestoredFromStorage(false);
    try { setCatFile(await parseExcel(f)); }
    catch { setError('Fichier illisible'); }
    finally { setCatLoading(false); }
  };

  const handleAo = async (f: File) => {
    setAoLoading(true); setError(null);
    try { setAoFile(await parseExcel(f)); }
    catch { setError('Fichier illisible'); }
    finally { setAoLoading(false); }
  };

  /* Full-page drop: auto-route based on what's missing */
  const onPageDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer?.types?.includes('Files')) {
      e.preventDefault();
      setPageDragging(true);
    }
  }, []);
  const onPageDragLeave = useCallback((e: React.DragEvent) => {
    // Only un-highlight if leaving the window
    if (e.clientX === 0 && e.clientY === 0) setPageDragging(false);
  }, []);
  const onPageDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setPageDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    // Route: if catalog missing → catalog; else → AO
    if (!catFile) handleCat(file);
    else handleAo(file);
  }, [catFile]);

  const removeCatalog = () => {
    clearCatalog();
    setCatFile(null); setCatName(null); setCatCode(null);
    setCatAutoN(false); setCatAutoC(false); setRestoredFromStorage(false);
  };

  const forgetPreferences = () => {
    if (confirm(`Oublier ${prefCount} correction${prefCount > 1 ? 's' : ''} apprise${prefCount > 1 ? 's' : ''} ?`)) {
      clearPreferences();
      setPrefCount(0);
    }
  };

  const analyze = useCallback(async () => {
    if (!ready || !catFile || !aoFile) return;
    setLoading(true); setError(null);
    setSemanticStage('fuzzy');

    // Give React a tick to paint the loading state
    await new Promise((r) => setTimeout(r, 30));

    try {
      const catalog = buildCatalog(catFile.rows, catName!, catCode!);
      const rows = aoFile.rows.map((r, i) => ({ idx: i, text: (r[aoCol!] || '').trim() })).filter((r) => r.text.length > 2);
      let res = match(rows, catalog);

      // Semantic verification if available
      if (semanticAvailable && (res.matches.length > 0 || res.nearMisses.length > 0)) {
        setSemanticStage('semantic');
        try {
          const outcome = await verifyMatches(res.matches, res.nearMisses);
          const rejectedRowIndexes = new Set(outcome.rejectedMatches.map((m) => m.marketRowIndex));
          const promotedRowIndexes = new Set(outcome.promotedNearMisses.map((m) => m.marketRowIndex));

          res = {
            ...res,
            matches: [
              ...outcome.confirmedMatches.map((m) => ({ ...m, aiVerified: true })),
              ...outcome.promotedNearMisses.map((m) => ({ ...m, aiVerified: true })),
            ],
            nearMisses: res.nearMisses.filter((nm) => !promotedRowIndexes.has(nm.marketRowIndex)),
            unmatched: [
              ...res.unmatched,
              ...outcome.rejectedMatches.map((m) => ({ marketRowIndex: m.marketRowIndex, marketDesignation: m.marketDesignation })),
            ].filter((u, i, arr) => arr.findIndex((x) => x.marketRowIndex === u.marketRowIndex) === i && !rejectedRowIndexes.has(-1)),
            aiVerified: true,
          };
        } catch {
          // Semantic failed — keep fuzzy results, show warning later
        }
      }

      setResults(res);
      setData({ catFile, aoFile, results: res });
      saveCatalog({
        fileName: catFile.fileName,
        headers: catFile.headers,
        rows: catFile.rows,
        headerRowIndex: catFile.headerRowIndex,
        nameCol: catName!,
        codeCol: catCode!,
        savedAt: Date.now(),
      });
      setExpanded(null);
    } catch {
      setError("Erreur lors de l'analyse");
    } finally {
      setLoading(false);
      setSemanticStage('idle');
    }
  }, [ready, catFile, aoFile, catName, catCode, aoCol, setData, semanticAvailable]);

  const download = useCallback(() => {
    if (!results || !aoFile) return;
    const blob = exportMatched(aoFile.rawFile, aoFile.headerRowIndex, results.matches);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = aoFile.fileName.replace(/\.xlsx?$/i, `_${results.matches.length}-matchés.xlsx`);
    a.click(); URL.revokeObjectURL(a.href);
  }, [results, aoFile]);

  const copyCodes = useCallback(async () => {
    if (!results) return;
    const codes = results.matches.map((m) => m.catalogCode).filter(Boolean).join(', ');
    try {
      await navigator.clipboard.writeText(codes);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* ignore */ }
  }, [results]);

  const reset = () => { setResults(null); setExpanded(null); setSearch(''); };

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(key); setSortDir('asc'); }
  };

  const showUpload = results === null;
  const pct = results ? Math.round(results.matches.length / results.totalAo * 100) : 0;

  /* Filter + sort matches */
  const displayMatches = useMemo(() => {
    if (!results) return [];
    const q = search.trim().toLowerCase();
    let list = results.matches
      .map((m, i) => ({ m, i }))
      .filter(({ m }) =>
        !q ||
        m.marketDesignation.toLowerCase().includes(q) ||
        m.catalogDesignation.toLowerCase().includes(q) ||
        m.catalogCode.toLowerCase().includes(q)
      );

    const dir = sortDir === 'asc' ? 1 : -1;
    list = [...list].sort((a, b) => {
      if (sortBy === 'order') return (a.i - b.i) * dir;
      if (sortBy === 'aoRow') return (a.m.marketRowIndex - b.m.marketRowIndex) * dir;
      if (sortBy === 'market') return a.m.marketDesignation.localeCompare(b.m.marketDesignation) * dir;
      if (sortBy === 'catalog') return a.m.catalogDesignation.localeCompare(b.m.catalogDesignation) * dir;
      if (sortBy === 'code') return a.m.catalogCode.localeCompare(b.m.catalogCode) * dir;
      return 0;
    });
    return list;
  }, [results, search, sortBy, sortDir]);

  /* Excel row number (1-based) from row index + header row index */
  const excelRow = (marketRowIdx: number) => (aoFile?.headerRowIndex ?? 0) + marketRowIdx + 2;

  const SortIcon = ({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) => (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`inline-block ml-0.5 transition-all ${active ? 'text-slate-600' : 'text-slate-300'} ${active && dir === 'desc' ? 'rotate-180' : ''}`}>
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );

  return (
    <div
      className="min-h-screen"
      onDragOver={onPageDragOver}
      onDragLeave={onPageDragLeave}
      onDrop={onPageDrop}
    >
      {/* Full-page drop overlay */}
      {pageDragging && (
        <div className="fixed inset-0 z-50 bg-blue-600/5 backdrop-blur-sm pointer-events-none flex items-center justify-center">
          <div className="bg-white border-2 border-dashed border-blue-400 rounded-2xl px-12 py-10 shadow-xl text-center">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-blue-500 mb-3"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><polyline points="9 15 12 12 15 15" /></svg>
            <p className="text-base font-semibold text-slate-800">Déposer le fichier Excel</p>
            <p className="text-sm text-slate-500 mt-1">
              {!catFile ? '→ sera importé comme catalogue' : '→ sera importé comme appel d\'offres'}
            </p>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-6 py-8 pb-20">
        {/* Logo + learning indicator */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" /><line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" /></svg>
            <span className="text-sm font-semibold text-slate-600 tracking-tight">Katalog</span>
          </div>
          {prefCount > 0 && (
            <button onClick={forgetPreferences} title="Oublier les corrections apprises" className="text-[11px] text-slate-400 hover:text-slate-600 flex items-center gap-1.5">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.2-8.5" /><path d="M21 3v5h-5" /></svg>
              {prefCount} correction{prefCount > 1 ? 's' : ''} apprise{prefCount > 1 ? 's' : ''}
            </button>
          )}
        </div>

        {error && <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

        {/* ═══ Upload ═══ */}
        {showUpload && (
          <div className="animate-fade-in">

            {restoredFromStorage && catFile && (
              <div className="mb-4 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-blue-900">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
                  <span>Catalogue restauré : <strong className="font-semibold">{catFile.fileName}</strong> ({catFile.rows.length} produits)</span>
                </div>
                <button onClick={removeCatalog} className="text-blue-700 hover:text-blue-900 text-xs font-medium">Changer de catalogue</button>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
              <section className="bg-slate-50 border border-slate-200 rounded-lg">
                <div className="px-4 py-2.5 border-b border-slate-200/80 flex items-center justify-between">
                  <h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Votre catalogue</h2>
                  {restoredFromStorage && <span className="text-[10px] text-blue-600 font-medium">sauvegardé</span>}
                </div>
                <div className="p-4 space-y-3">
                  {!catLoading && <FileUploader label="Importer votre catalogue" onFile={handleCat} fileName={catFile?.fileName} />}
                  {catLoading && <Skeleton />}
                  {catFile && !catLoading && (
                    <>
                      <ColumnPicker label="Nom produit" headers={catFile.headers} value={catName} onChange={(v) => { setCatName(v); setCatAutoN(false); }} autoDetected={catAutoN} />
                      <ColumnPicker label="Code produit" headers={catFile.headers} value={catCode} onChange={(v) => { setCatCode(v); setCatAutoC(false); }} autoDetected={catAutoC} />
                      {catFile.headers.length > 0 && catFile.rows.length > 0 && (
                        <Preview headers={catFile.headers} rows={catFile.rows} highlight={[catName, catCode].filter((c): c is number => c !== null)} />
                      )}
                    </>
                  )}
                </div>
              </section>

              <section className="bg-slate-50 border border-slate-200 rounded-lg">
                <div className="px-4 py-2.5 border-b border-slate-200/80">
                  <h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Appel d&apos;offres</h2>
                </div>
                <div className="p-4 space-y-3">
                  {!aoLoading && <FileUploader label="Importer l'appel d'offres" onFile={handleAo} fileName={aoFile?.fileName} />}
                  {aoLoading && <Skeleton />}
                  {aoFile && !aoLoading && (
                    <>
                      <ColumnPicker label="Produit demandé" headers={aoFile.headers} value={aoCol} onChange={(v) => { setAoCol(v); setAoAuto(false); }} autoDetected={aoAuto} />
                      <Preview headers={aoFile.headers} rows={aoFile.rows} highlight={aoCol !== null ? [aoCol] : []} />
                    </>
                  )}
                </div>
              </section>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-400">{catFile && aoFile && <>{catFile.rows.length} produits catalogue &times; {aoFile.rows.length} lignes AO</>}</div>
              <button onClick={analyze} disabled={!ready || loading} className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${ready && !loading ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-600/20' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" /><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" /></svg>
                    {semanticStage === 'semantic' ? 'Vérification IA...' : 'Analyse...'}
                  </>
                ) : (
                  <>Analyser{semanticAvailable && <span className="text-[10px] opacity-80">+ IA</span>}</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ═══ Context bar ═══ */}
        {!showUpload && catFile && aoFile && (
          <div className="flex items-center justify-between mb-6 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 animate-fade-in">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                <span className="truncate max-w-[180px]">{catFile.fileName}</span><span className="text-slate-400">({catFile.rows.length})</span>
              </span>
              <span className="text-slate-300">&times;</span>
              <span className="flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                <span className="truncate max-w-[180px]">{aoFile.fileName}</span><span className="text-slate-400">({aoFile.rows.length})</span>
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
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-semibold text-slate-800 tabular-nums">{results.matches.length} <span className="text-base font-normal text-slate-400">produits trouvés</span></p>
                  {results.aiVerified && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-violet-700 bg-violet-50 border border-violet-200 px-1.5 py-0.5 rounded">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8 5.8 21.3l2.4-7.4L2 9.4h7.6z" /></svg>
                      Vérifié IA
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 mt-0.5">
                  {results.matches.length > 0
                    ? <>Vous pouvez répondre à <span className="font-medium text-slate-700">{pct}%</span> de cet appel d&apos;offres</>
                    : "Aucune correspondance avec votre catalogue"}
                  {results.nearMisses.length > 0 && <span className="text-slate-400"> · {results.nearMisses.length} quasi-match{results.nearMisses.length > 1 ? 's' : ''}</span>}
                </p>
              </div>
              <div className="flex gap-2.5">
                {results.matches.length > 0 && (
                  <button onClick={copyCodes} className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                    {copied ? (
                      <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><polyline points="20 6 9 17 4 12" /></svg>Copié</>
                    ) : (
                      <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>Copier codes</>
                    )}
                  </button>
                )}
                {(results.matches.length > 0 || results.nearMisses.length > 0) && (
                  <button onClick={() => router.push('/verify')} className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
                    Vérifier
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

            {results.matches.length > 5 && (
              <div className="mb-3 relative">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher un produit ou un code..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </button>
                )}
              </div>
            )}

            {results.matches.length > 0 && (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-left">
                      <th className="px-3 py-2.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider w-14">
                        <button onClick={() => toggleSort('aoRow')} className="hover:text-slate-600 flex items-center">Ligne<SortIcon active={sortBy === 'aoRow'} dir={sortDir} /></button>
                      </th>
                      <th className="px-4 py-2.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                        <button onClick={() => toggleSort('market')} className="hover:text-slate-600 flex items-center">Produit demandé<SortIcon active={sortBy === 'market'} dir={sortDir} /></button>
                      </th>
                      {aoQtyCol !== null && <th className="px-4 py-2.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider w-28">Quantité</th>}
                      <th className="px-4 py-2.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                        <button onClick={() => toggleSort('catalog')} className="hover:text-slate-600 flex items-center">Votre produit<SortIcon active={sortBy === 'catalog'} dir={sortDir} /></button>
                      </th>
                      <th className="px-4 py-2.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider w-24">
                        <button onClick={() => toggleSort('code')} className="hover:text-slate-600 flex items-center">Code<SortIcon active={sortBy === 'code'} dir={sortDir} /></button>
                      </th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayMatches.map(({ m, i }) => {
                      const open = expanded === i;
                      const qty = aoQtyCol !== null && aoFile ? (aoFile.rows[m.marketRowIndex]?.[aoQtyCol] || '').trim() : '';
                      const unit = aoUnitCol !== null && aoFile ? (aoFile.rows[m.marketRowIndex]?.[aoUnitCol] || '').trim() : '';
                      return (
                        <tr key={m.marketRowIndex}>
                          <td colSpan={aoQtyCol !== null ? 6 : 5} className="p-0">
                            <div onClick={() => setExpanded(open ? null : i)} className={`grid cursor-pointer transition-colors duration-100 ${open ? 'bg-blue-50/40' : i % 2 === 0 ? 'bg-white hover:bg-slate-50/60' : 'bg-slate-50/30 hover:bg-slate-50/60'}`} style={{ gridTemplateColumns: aoQtyCol !== null ? '56px 1fr 112px 1fr 96px 32px' : '56px 1fr 1fr 96px 32px' }}>
                              <div className="px-3 py-3 text-slate-400 text-xs tabular-nums self-center">L{excelRow(m.marketRowIndex)}</div>
                              <div className="px-4 py-3 text-slate-800 truncate self-center">{m.marketDesignation}</div>
                              {aoQtyCol !== null && <div className="px-4 py-3 text-slate-500 text-xs self-center truncate">{qty}{qty && unit ? ` ${unit}` : ''}</div>}
                              <div className="px-4 py-3 text-slate-600 truncate self-center">{m.catalogDesignation}</div>
                              <div className="px-4 py-3 font-mono text-xs text-slate-500 tabular-nums self-center">{m.catalogCode}</div>
                              <div className="flex items-center justify-center self-center"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-slate-400 transition-transform duration-150 ${open ? 'rotate-90' : ''}`}><polyline points="9 18 15 12 9 6" /></svg></div>
                            </div>
                            {open && catFile && aoFile && <Detail mH={aoFile.headers} mR={aoFile.rows[m.marketRowIndex] || []} cH={catFile.headers} cR={catFile.rows[m.catalogRowIndex] || []} />}
                          </td>
                        </tr>
                      );
                    })}
                    {displayMatches.length === 0 && search && (
                      <tr><td colSpan={aoQtyCol !== null ? 6 : 5} className="px-4 py-8 text-center text-slate-400 text-sm">Aucun résultat pour &quot;{search}&quot;</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
