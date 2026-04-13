'use client';

import { useState, useCallback } from 'react';
import { parseExcel } from '@/lib/excel';
import { exportMatched } from '@/lib/excel';
import { buildCatalogItems, performMatching } from '@/lib/matching';
import type { MatchedLine } from '@/lib/matching';
import type { ParsedFile } from '@/lib/types';
import { FileUploader } from '@/components/FileUploader';
import { ColumnMapper } from '@/components/ColumnMapper';
import { DataPreview } from '@/components/DataPreview';

export default function Home() {
  const [catalogFile, setCatalogFile] = useState<ParsedFile | null>(null);
  const [marketFile, setMarketFile] = useState<ParsedFile | null>(null);
  const [catalogCols, setCatalogCols] = useState<Record<string, number | null>>({
    designation: null,
    code: null,
  });
  const [marketCols, setMarketCols] = useState<Record<string, number | null>>({
    designation: null,
  });
  const [results, setResults] = useState<MatchedLine[] | null>(null);
  const [totalMarket, setTotalMarket] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCatalogUpload = useCallback(async (file: File) => {
    try {
      setError(null);
      setResults(null);
      setCatalogFile(await parseExcel(file));
    } catch {
      setError('Erreur de lecture du catalogue');
    }
  }, []);

  const handleMarketUpload = useCallback(async (file: File) => {
    try {
      setError(null);
      setResults(null);
      setMarketFile(await parseExcel(file));
    } catch {
      setError("Erreur de lecture de l'appel d'offres");
    }
  }, []);

  const canLaunch =
    catalogFile &&
    marketFile &&
    catalogCols.designation !== null &&
    catalogCols.code !== null &&
    marketCols.designation !== null;

  const handleAnalyze = useCallback(() => {
    if (!canLaunch || !catalogFile || !marketFile) return;

    setLoading(true);
    setError(null);

    // Use setTimeout to let the UI update before heavy computation
    setTimeout(() => {
      try {
        const items = buildCatalogItems(
          catalogFile.rows,
          catalogCols.designation!,
          catalogCols.code!
        );

        const marketDesignations = marketFile.rows
          .map((row, index) => ({
            rowIndex: index,
            designation: row[marketCols.designation!] || '',
          }))
          .filter((d) => d.designation.trim() !== '');

        setTotalMarket(marketDesignations.length);
        setResults(performMatching(marketDesignations, items));
      } catch {
        setError("Erreur lors de l'analyse");
      } finally {
        setLoading(false);
      }
    }, 50);
  }, [canLaunch, catalogFile, marketFile, catalogCols, marketCols]);

  const handleExport = useCallback(() => {
    if (!results || !marketFile) return;

    const blob = exportMatched(
      marketFile.rawFile,
      marketFile.headerRowIndex,
      results
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = marketFile.fileName.replace(/\.xlsx?$/i, '_matchés.xlsx');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [results, marketFile]);

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2.5 mb-1">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="3" y1="15" x2="21" y2="15" />
            <line x1="9" y1="3" x2="9" y2="21" />
            <line x1="15" y1="3" x2="15" y2="21" />
          </svg>
          <h1 className="text-lg font-semibold text-slate-800">Appariement appel d&apos;offres</h1>
        </div>
        <p className="text-sm text-slate-500">
          Identifiez les lignes de l&apos;appel d&apos;offres auxquelles vous pouvez répondre avec votre catalogue.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Upload section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
          <div className="px-5 py-3 border-b border-slate-100">
            <h2 className="text-sm font-medium text-slate-700">Votre catalogue</h2>
          </div>
          <div className="p-5 space-y-4">
            <FileUploader
              label="Importer votre catalogue"
              onFileSelected={handleCatalogUpload}
              fileName={catalogFile?.fileName}
            />
            {catalogFile && (
              <>
                <ColumnMapper
                  headers={catalogFile.headers}
                  fields={[
                    { key: 'designation', label: 'Nom produit', required: true },
                    { key: 'code', label: 'Code produit', required: true },
                  ]}
                  values={catalogCols}
                  onChange={(key, value) => setCatalogCols((prev) => ({ ...prev, [key]: value }))}
                />
                <DataPreview
                  headers={catalogFile.headers}
                  rows={catalogFile.rows}
                  highlightCols={[catalogCols.designation, catalogCols.code].filter((c): c is number => c !== null)}
                />
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
          <div className="px-5 py-3 border-b border-slate-100">
            <h2 className="text-sm font-medium text-slate-700">Appel d&apos;offres</h2>
          </div>
          <div className="p-5 space-y-4">
            <FileUploader
              label="Importer l'appel d'offres"
              onFileSelected={handleMarketUpload}
              fileName={marketFile?.fileName}
            />
            {marketFile && (
              <>
                <ColumnMapper
                  headers={marketFile.headers}
                  fields={[
                    { key: 'designation', label: 'Produit demandé', required: true },
                  ]}
                  values={marketCols}
                  onChange={(key, value) => setMarketCols((prev) => ({ ...prev, [key]: value }))}
                />
                <DataPreview
                  headers={marketFile.headers}
                  rows={marketFile.rows}
                  highlightCols={marketCols.designation !== null ? [marketCols.designation] : []}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Analyze button */}
      <div className="flex justify-end mb-10">
        <button
          onClick={handleAnalyze}
          disabled={!canLaunch || loading}
          className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            canLaunch && !loading
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
              </svg>
              Analyse...
            </>
          ) : (
            'Analyser'
          )}
        </button>
      </div>

      {/* Results */}
      {results !== null && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-slate-800">{results.length} produits matchés</span>
              {' '}sur {totalMarket}
            </p>
            {results.length > 0 && (
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                Exporter .xlsx
              </button>
            )}
          </div>

          {results.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
              <p className="text-slate-500">Aucune correspondance trouvée entre les deux fichiers.</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-left">
                    <th className="px-4 py-2.5 font-medium text-slate-500 text-xs uppercase tracking-wider w-10">#</th>
                    <th className="px-4 py-2.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Produit demandé</th>
                    <th className="px-4 py-2.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Votre produit</th>
                    <th className="px-4 py-2.5 font-medium text-slate-500 text-xs uppercase tracking-wider w-28">Code</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {results.map((match, i) => (
                    <tr key={match.rowIndex} className="hover:bg-slate-50/50">
                      <td className="px-4 py-2.5 text-slate-400 text-xs tabular-nums">{i + 1}</td>
                      <td className="px-4 py-2.5 text-slate-800">{match.originalDesignation}</td>
                      <td className="px-4 py-2.5 text-slate-600">{match.matchedDesignation}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-slate-500 tabular-nums">{match.matchedCode}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
