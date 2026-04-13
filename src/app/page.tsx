'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { parseExcel } from '@/lib/excel';
import { buildCatalogItems, performMatching } from '@/lib/matching';
import { Stepper } from '@/components/Stepper';
import { FileUploader } from '@/components/FileUploader';
import { ColumnMapper } from '@/components/ColumnMapper';
import { DataPreview } from '@/components/DataPreview';
import type { ParsedFile } from '@/lib/types';

export default function HomePage() {
  const router = useRouter();
  const ctx = useAppContext();

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
      setError('Erreur lors de la lecture du catalogue');
    }
  }, []);

  const handleMarketUpload = useCallback(async (file: File) => {
    try {
      setError(null);
      setMarketFile(await parseExcel(file));
    } catch {
      setError("Erreur lors de la lecture de l'appel d'offres");
    }
  }, []);

  const canLaunch =
    catalogFile &&
    marketFile &&
    catalogCols.designation !== null &&
    catalogCols.code !== null &&
    marketCols.designation !== null;

  const handleLaunch = useCallback(async () => {
    if (!canLaunch || !catalogFile || !marketFile) return;

    setLoading(true);
    setError(null);

    try {
      const catalogMapping = {
        designationCol: catalogCols.designation!,
        codeCol: catalogCols.code!,
      };
      const marketMapping = {
        designationCol: marketCols.designation!,
      };

      const items = buildCatalogItems(
        catalogFile.rows,
        catalogMapping.designationCol,
        catalogMapping.codeCol
      );

      const marketDesignations = marketFile.rows
        .map((row, index) => ({
          rowIndex: index,
          designation: row[marketMapping.designationCol] || '',
        }))
        .filter((d) => d.designation.trim() !== '');

      const results = performMatching(marketDesignations, items);

      ctx.setMarketFile(marketFile);
      ctx.setCatalogFile(catalogFile);
      ctx.setMarketMapping(marketMapping);
      ctx.setCatalogMapping(catalogMapping);
      ctx.setCatalogItems(items);
      ctx.setMatchResults(results);

      router.push('/review');
    } catch {
      setError("Erreur lors de l'analyse. Vérifiez les colonnes sélectionnées.");
    } finally {
      setLoading(false);
    }
  }, [canLaunch, catalogFile, marketFile, catalogCols, marketCols, ctx, router]);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <Stepper currentStep={0} />

      <div className="mb-8">
        <h2 className="text-lg font-semibold text-slate-800">
          Importer les fichiers
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Chargez votre catalogue et l&apos;appel d&apos;offres, puis indiquez les colonnes.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Catalogue */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
          <div className="px-5 py-3.5 border-b border-slate-100">
            <h3 className="text-sm font-medium text-slate-700">Votre catalogue</h3>
          </div>
          <div className="p-5">
            <FileUploader
              label="Importer votre catalogue"
              onFileSelected={handleCatalogUpload}
              fileName={catalogFile?.fileName}
            />
            {catalogFile && (
              <div className="mt-4 space-y-4">
                <ColumnMapper
                  headers={catalogFile.headers}
                  fields={[
                    { key: 'designation', label: 'Nom produit', required: true },
                    { key: 'code', label: 'Code produit', required: true },
                  ]}
                  values={catalogCols}
                  onChange={(key, value) =>
                    setCatalogCols((prev) => ({ ...prev, [key]: value }))
                  }
                />
                <div>
                  <p className="text-xs text-slate-400 mb-2">
                    Aperçu - {catalogFile.rows.length} lignes
                  </p>
                  <DataPreview
                    headers={catalogFile.headers}
                    rows={catalogFile.rows}
                    highlightCols={[catalogCols.designation, catalogCols.code].filter((c): c is number => c !== null)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Appel d'offres */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
          <div className="px-5 py-3.5 border-b border-slate-100">
            <h3 className="text-sm font-medium text-slate-700">Appel d&apos;offres</h3>
          </div>
          <div className="p-5">
            <FileUploader
              label="Importer l'appel d'offres"
              onFileSelected={handleMarketUpload}
              fileName={marketFile?.fileName}
            />
            {marketFile && (
              <div className="mt-4 space-y-4">
                <ColumnMapper
                  headers={marketFile.headers}
                  fields={[
                    { key: 'designation', label: 'Produit demandé', required: true },
                  ]}
                  values={marketCols}
                  onChange={(key, value) =>
                    setMarketCols((prev) => ({ ...prev, [key]: value }))
                  }
                />
                <div>
                  <p className="text-xs text-slate-400 mb-2">
                    Aperçu - {marketFile.rows.length} lignes
                  </p>
                  <DataPreview
                    headers={marketFile.headers}
                    rows={marketFile.rows}
                    highlightCols={marketCols.designation !== null ? [marketCols.designation] : []}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Launch button */}
      <div className="mt-8 flex items-center justify-end gap-3">
        {!canLaunch && catalogFile && marketFile && (
          <p className="text-xs text-slate-400">
            Sélectionnez toutes les colonnes requises
          </p>
        )}
        <button
          onClick={handleLaunch}
          disabled={!canLaunch || loading}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            canLaunch && !loading
              ? 'bg-slate-800 text-white hover:bg-slate-900'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
              </svg>
              Analyse en cours...
            </>
          ) : (
            <>
              Lancer l&apos;analyse
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
