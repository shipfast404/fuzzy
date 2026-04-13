'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { parseExcel } from '@/lib/excel';
import { buildCatalogItems, performMatching } from '@/lib/matching';
import { useResults } from '@/context/ResultsContext';
import type { ParsedFile } from '@/lib/types';
import { FileUploader } from '@/components/FileUploader';
import { ColumnMapper } from '@/components/ColumnMapper';
import { DataPreview } from '@/components/DataPreview';

export default function Home() {
  const router = useRouter();
  const { setData } = useResults();

  const [catalogFile, setCatalogFile] = useState<ParsedFile | null>(null);
  const [marketFile, setMarketFile] = useState<ParsedFile | null>(null);
  const [catalogCols, setCatalogCols] = useState<Record<string, number | null>>({
    designation: null,
    code: null,
  });
  const [marketCols, setMarketCols] = useState<Record<string, number | null>>({
    designation: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCatalogUpload = useCallback(async (file: File) => {
    try {
      setError(null);
      setCatalogFile(await parseExcel(file));
    } catch {
      setError('Erreur de lecture du catalogue');
    }
  }, []);

  const handleMarketUpload = useCallback(async (file: File) => {
    try {
      setError(null);
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

        const matches = performMatching(marketDesignations, items);

        setData({
          matches,
          totalMarket: marketDesignations.length,
          marketFileName: marketFile.fileName,
          marketHeaders: marketFile.headers,
          marketRows: marketFile.rows,
          catalogHeaders: catalogFile.headers,
          catalogRows: catalogFile.rows,
          marketRawFile: marketFile.rawFile,
          marketHeaderRowIndex: marketFile.headerRowIndex,
        });

        router.push('/results');
      } catch {
        setError("Erreur lors de l'analyse");
        setLoading(false);
      }
    }, 50);
  }, [canLaunch, catalogFile, marketFile, catalogCols, marketCols, setData, router]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-10">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="3" y1="15" x2="21" y2="15" />
          <line x1="9" y1="3" x2="9" y2="21" />
          <line x1="15" y1="3" x2="15" y2="21" />
        </svg>
        <span className="text-sm font-semibold text-slate-700 tracking-tight">Katalog</span>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-5">
        {/* Catalogue */}
        <div className="border border-slate-200 rounded-lg">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50">
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

        {/* Appel d'offres */}
        <div className="border border-slate-200 rounded-lg">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50">
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
      <div className="flex justify-end mt-6">
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
    </div>
  );
}
