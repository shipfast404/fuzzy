'use client';

import { useState, useCallback } from 'react';
import { parseExcel, exportMatched } from '@/lib/excel';
import { buildCatalog, match } from '@/lib/matching';
import type { ParsedFile, MatchedLine } from '@/lib/types';
import { FileUploader } from '@/components/FileUploader';
import { ColumnPicker } from '@/components/ColumnPicker';
import { Preview } from '@/components/Preview';

/* ── Detail panel shown when a row is expanded ── */

function Detail({
  mktHeaders,
  mktRow,
  catHeaders,
  catRow,
}: {
  mktHeaders: string[];
  mktRow: string[];
  catHeaders: string[];
  catRow: string[];
}) {
  const fields = (headers: string[], row: string[]) =>
    headers
      .map((h, i) => ({ h: h.trim(), v: (row[i] || '').trim() }))
      .filter((f) => f.h && f.v);

  return (
    <div className="grid grid-cols-2 gap-8 px-5 py-4 bg-gray-50 border-t border-gray-100">
      <div>
        <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Appel d&apos;offres
        </div>
        <dl className="space-y-1">
          {fields(mktHeaders, mktRow).map((f, i) => (
            <div key={i} className="flex gap-2 text-xs">
              <dt className="text-gray-400 w-32 flex-shrink-0 truncate">{f.h}</dt>
              <dd className="text-gray-700">{f.v}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div>
        <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Votre catalogue
        </div>
        <dl className="space-y-1">
          {fields(catHeaders, catRow).map((f, i) => (
            <div key={i} className="flex gap-2 text-xs">
              <dt className="text-gray-400 w-32 flex-shrink-0 truncate">{f.h}</dt>
              <dd className="text-gray-700">{f.v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

/* ── Main page ── */

export default function Home() {
  // upload state
  const [catFile, setCatFile] = useState<ParsedFile | null>(null);
  const [aoFile, setAoFile] = useState<ParsedFile | null>(null);
  const [catCols, setCatCols] = useState<{ name: number | null; code: number | null }>({ name: null, code: null });
  const [aoCol, setAoCol] = useState<number | null>(null);

  // results state
  const [results, setResults] = useState<MatchedLine[] | null>(null);
  const [totalAo, setTotalAo] = useState(0);
  const [expanded, setExpanded] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = catFile && aoFile && catCols.name !== null && catCols.code !== null && aoCol !== null;

  const analyze = useCallback(() => {
    if (!ready || !catFile || !aoFile) return;
    setLoading(true);
    setError(null);

    setTimeout(() => {
      try {
        const catalog = buildCatalog(catFile.rows, catCols.name!, catCols.code!);
        const rows = aoFile.rows
          .map((r, i) => ({ idx: i, text: (r[aoCol!] || '').trim() }))
          .filter((r) => r.text.length > 2);
        setTotalAo(rows.length);
        setResults(match(rows, catalog));
        setExpanded(null);
      } catch {
        setError("Erreur lors de l'analyse");
      } finally {
        setLoading(false);
      }
    }, 30);
  }, [ready, catFile, aoFile, catCols, aoCol]);

  const download = useCallback(() => {
    if (!results || !aoFile) return;
    const blob = exportMatched(aoFile.rawFile, aoFile.headerRowIndex, results);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = aoFile.fileName.replace(/\.xlsx?$/i, '_matchés.xlsx');
    a.click();
    URL.revokeObjectURL(a.href);
  }, [results, aoFile]);

  const reset = () => {
    setResults(null);
    setExpanded(null);
  };

  const showUpload = results === null;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" /><line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" /></svg>
        <span className="text-sm font-semibold text-gray-700 tracking-tight">Katalog</span>
      </div>

      {error && (
        <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      {/* ── Upload section ── */}
      {showUpload ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
            {/* Catalogue */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg">
              <div className="px-4 py-2.5 border-b border-gray-200">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Votre catalogue</h2>
              </div>
              <div className="p-4 space-y-3">
                <FileUploader label="Importer votre catalogue" onFile={async (f) => { try { setCatFile(await parseExcel(f)); setError(null); } catch { setError('Lecture impossible'); } }} fileName={catFile?.fileName} />
                {catFile && (
                  <>
                    <ColumnPicker label="Nom produit" headers={catFile.headers} value={catCols.name} onChange={(v) => setCatCols((p) => ({ ...p, name: v }))} />
                    <ColumnPicker label="Code produit" headers={catFile.headers} value={catCols.code} onChange={(v) => setCatCols((p) => ({ ...p, code: v }))} />
                    <Preview headers={catFile.headers} rows={catFile.rows} highlight={[catCols.name, catCols.code].filter((c): c is number => c !== null)} />
                  </>
                )}
              </div>
            </div>

            {/* Appel d'offres */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg">
              <div className="px-4 py-2.5 border-b border-gray-200">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Appel d&apos;offres</h2>
              </div>
              <div className="p-4 space-y-3">
                <FileUploader label="Importer l'appel d'offres" onFile={async (f) => { try { setAoFile(await parseExcel(f)); setError(null); } catch { setError('Lecture impossible'); } }} fileName={aoFile?.fileName} />
                {aoFile && (
                  <>
                    <ColumnPicker label="Produit demandé" headers={aoFile.headers} value={aoCol} onChange={setAoCol} />
                    <Preview headers={aoFile.headers} rows={aoFile.rows} highlight={aoCol !== null ? [aoCol] : []} />
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={analyze}
              disabled={!ready || loading}
              className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium ${
                ready && !loading ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" /><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" /></svg>
                  Analyse...
                </>
              ) : (
                'Analyser'
              )}
            </button>
          </div>
        </>
      ) : (
        /* collapsed upload = link to restart */
        <button onClick={reset} className="text-sm text-gray-500 hover:text-gray-700 mb-6 inline-flex items-center gap-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
          Nouvelle analyse
        </button>
      )}

      {/* ── Results section ── */}
      {results !== null && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-800">{results.length} produits trouvés</span> sur {totalAo}
            </p>
            {results.length > 0 && (
              <button onClick={download} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                Exporter .xlsx
              </button>
            )}
          </div>

          {results.length === 0 ? (
            <div className="border border-gray-200 rounded-lg p-8 text-center text-gray-500 text-sm">Aucune correspondance trouvée.</div>
          ) : (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-left">
                    <th className="px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider w-10">#</th>
                    <th className="px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Produit demandé</th>
                    <th className="px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Votre produit</th>
                    <th className="px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Code</th>
                    <th className="px-4 py-2.5 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((m, i) => {
                    const open = expanded === i;
                    return (
                      <tr key={m.marketRowIndex}>
                        <td colSpan={5} className="p-0">
                          <div
                            onClick={() => setExpanded(open ? null : i)}
                            className={`grid cursor-pointer transition-colors ${
                              open ? 'bg-gray-50' : i % 2 === 0 ? 'bg-white hover:bg-gray-50/60' : 'bg-gray-50/30 hover:bg-gray-50/60'
                            }`}
                            style={{ gridTemplateColumns: '40px 1fr 1fr 96px 32px' }}
                          >
                            <div className="px-4 py-3 text-gray-400 text-xs tabular-nums">{i + 1}</div>
                            <div className="px-4 py-3 text-gray-800 truncate">{m.marketDesignation}</div>
                            <div className="px-4 py-3 text-gray-600 truncate">{m.catalogDesignation}</div>
                            <div className="px-4 py-3 font-mono text-xs text-gray-500 tabular-nums">{m.catalogCode}</div>
                            <div className="flex items-center justify-center">
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className={`text-gray-400 transition-transform duration-150 ${open ? 'rotate-90' : ''}`}
                              >
                                <polyline points="9 18 15 12 9 6" />
                              </svg>
                            </div>
                          </div>
                          {open && catFile && aoFile && (
                            <Detail
                              mktHeaders={aoFile.headers}
                              mktRow={aoFile.rows[m.marketRowIndex] || []}
                              catHeaders={catFile.headers}
                              catRow={catFile.rows[m.catalogRowIndex] || []}
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
        </>
      )}
    </div>
  );
}
