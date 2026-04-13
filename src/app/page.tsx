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

  const [marketFile, setMarketFile] = useState<ParsedFile | null>(null);
  const [catalogFile, setCatalogFile] = useState<ParsedFile | null>(null);
  const [marketCols, setMarketCols] = useState<Record<string, number | null>>({
    designation: null,
    reference: null,
    denomination: null,
  });
  const [catalogCols, setCatalogCols] = useState<Record<string, number | null>>({
    designation: null,
    code: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMarketUpload = useCallback(async (file: File) => {
    try {
      setError(null);
      const parsed = await parseExcel(file);
      setMarketFile(parsed);
    } catch {
      setError('Erreur lors de la lecture du fichier marché public');
    }
  }, []);

  const handleCatalogUpload = useCallback(async (file: File) => {
    try {
      setError(null);
      const parsed = await parseExcel(file);
      setCatalogFile(parsed);
    } catch {
      setError('Erreur lors de la lecture du catalogue');
    }
  }, []);

  const canLaunch =
    marketFile &&
    catalogFile &&
    marketCols.designation !== null &&
    marketCols.reference !== null &&
    catalogCols.designation !== null &&
    catalogCols.code !== null;

  const handleLaunch = useCallback(async () => {
    if (!canLaunch || !marketFile || !catalogFile) return;

    setLoading(true);
    setError(null);

    try {
      const marketMapping = {
        designationCol: marketCols.designation!,
        referenceCol: marketCols.reference!,
        denominationCol: marketCols.denomination ?? null,
      };

      const catalogMapping = {
        designationCol: catalogCols.designation!,
        codeCol: catalogCols.code!,
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
      setError('Erreur lors du matching. Vérifiez les colonnes sélectionnées.');
    } finally {
      setLoading(false);
    }
  }, [canLaunch, marketFile, catalogFile, marketCols, catalogCols, ctx, router]);

  const marketHighlightCols = [
    marketCols.designation,
    marketCols.reference,
    marketCols.denomination,
  ].filter((c): c is number => c !== null);

  const catalogHighlightCols = [catalogCols.designation, catalogCols.code].filter(
    (c): c is number => c !== null
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <Stepper currentStep={0} />

      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-gray-800">
          Matching automatique
        </h2>
        <p className="text-gray-500 mt-1">
          Importez votre fichier marché public et votre catalogue distributeur
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Market file */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="text-base font-medium text-gray-800 mb-4">
            1. Fichier marché public
          </h3>
          <FileUploader
            label="Importer le fichier marché public"
            onFileSelected={handleMarketUpload}
            fileName={marketFile?.fileName}
          />
          {marketFile && (
            <div className="mt-4 space-y-4">
              <ColumnMapper
                headers={marketFile.headers}
                fields={[
                  { key: 'designation', label: 'Colonne désignation produit (input)', required: true },
                  { key: 'reference', label: 'Colonne référence / code (output)', required: true },
                  { key: 'denomination', label: 'Colonne dénomination (output)', required: false },
                ]}
                values={marketCols}
                onChange={(key, value) =>
                  setMarketCols((prev) => ({ ...prev, [key]: value }))
                }
              />
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-2">
                  Aperçu ({marketFile.rows.length} lignes, en-tête ligne {marketFile.headerRowIndex + 1})
                </p>
                <DataPreview
                  headers={marketFile.headers}
                  rows={marketFile.rows}
                  highlightCols={marketHighlightCols}
                />
              </div>
            </div>
          )}
        </div>

        {/* Catalog file */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="text-base font-medium text-gray-800 mb-4">
            2. Catalogue distributeur
          </h3>
          <FileUploader
            label="Importer le catalogue distributeur"
            onFileSelected={handleCatalogUpload}
            fileName={catalogFile?.fileName}
          />
          {catalogFile && (
            <div className="mt-4 space-y-4">
              <ColumnMapper
                headers={catalogFile.headers}
                fields={[
                  { key: 'designation', label: 'Colonne désignation produit', required: true },
                  { key: 'code', label: 'Colonne code / référence', required: true },
                ]}
                values={catalogCols}
                onChange={(key, value) =>
                  setCatalogCols((prev) => ({ ...prev, [key]: value }))
                }
              />
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-2">
                  Aperçu ({catalogFile.rows.length} lignes, en-tête ligne {catalogFile.headerRowIndex + 1})
                </p>
                <DataPreview
                  headers={catalogFile.headers}
                  rows={catalogFile.rows}
                  highlightCols={catalogHighlightCols}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Launch button */}
      <div className="mt-8 text-center">
        <button
          onClick={handleLaunch}
          disabled={!canLaunch || loading}
          className={`px-8 py-3 rounded-lg text-sm font-medium transition-colors ${
            canLaunch && !loading
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {loading ? 'Matching en cours...' : 'Lancer le matching'}
        </button>
        {!canLaunch && marketFile && catalogFile && (
          <p className="text-xs text-gray-400 mt-2">
            Veuillez sélectionner toutes les colonnes requises
          </p>
        )}
      </div>
    </div>
  );
}
