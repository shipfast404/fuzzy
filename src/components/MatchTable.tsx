'use client';

import { useState } from 'react';
import type { MatchResult, CatalogItem } from '@/lib/types';
import { SearchDropdown } from './SearchDropdown';

interface MatchTableProps {
  results: MatchResult[];
  catalogItems: CatalogItem[];
  threshold: number;
  onUpdate: (rowIndex: number, update: Partial<MatchResult>) => void;
}

function scoreColor(score: number): string {
  if (score >= 80) return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  if (score >= 50) return 'bg-amber-50 text-amber-700 border border-amber-200';
  return 'bg-red-50 text-red-600 border border-red-200';
}

function isRelevant(result: MatchResult, threshold: number): boolean {
  return result.status === 'manual' || result.score >= threshold;
}

type SortKey = 'index' | 'score';
type FilterKey = 'all' | 'relevant' | 'out' | 'ignored';

export function MatchTable({ results, catalogItems, threshold, onUpdate }: MatchTableProps) {
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>('index');
  const [filter, setFilter] = useState<FilterKey>('all');

  const filtered = results.filter((r) => {
    if (filter === 'relevant') return isRelevant(r, threshold) && r.status !== 'ignored';
    if (filter === 'out') return !isRelevant(r, threshold) && r.status !== 'ignored';
    if (filter === 'ignored') return r.status === 'ignored';
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'score') return a.score - b.score;
    return a.rowIndex - b.rowIndex;
  });

  const stats = {
    total: results.length,
    relevant: results.filter((r) => isRelevant(r, threshold) && r.status !== 'ignored').length,
    out: results.filter((r) => !isRelevant(r, threshold) && r.status !== 'ignored').length,
    ignored: results.filter((r) => r.status === 'ignored').length,
  };

  const filterBtn = (key: FilterKey, label: string, count: number, colors: string) => (
    <button
      onClick={() => setFilter(key)}
      className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
        filter === key ? colors : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
      }`}
    >
      {label} <span className="ml-0.5 opacity-70">{count}</span>
    </button>
  );

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {filterBtn('all', 'Tous', stats.total, 'bg-slate-800 text-white border border-slate-800')}
        {filterBtn('relevant', 'Pertinents', stats.relevant, 'bg-emerald-600 text-white border border-emerald-600')}
        {filterBtn('out', 'Hors périmètre', stats.out, 'bg-slate-500 text-white border border-slate-500')}
        {filterBtn('ignored', 'Ignorés', stats.ignored, 'bg-slate-400 text-white border border-slate-400')}
        <div className="flex-1" />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortKey)}
          className="border border-slate-200 rounded px-2 py-1.5 text-xs bg-white text-slate-600"
        >
          <option value="index">Ordre du fichier</option>
          <option value="score">Par score</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left border-b border-slate-200">
              <th className="px-3 py-2.5 font-medium text-slate-500 text-xs uppercase tracking-wider w-10">#</th>
              <th className="px-3 py-2.5 font-medium text-slate-500 text-xs uppercase tracking-wider w-28">Statut</th>
              <th className="px-3 py-2.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Produit demandé</th>
              <th className="px-3 py-2.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Correspondance catalogue</th>
              <th className="px-3 py-2.5 font-medium text-slate-500 text-xs uppercase tracking-wider w-24">Code</th>
              <th className="px-3 py-2.5 font-medium text-slate-500 text-xs uppercase tracking-wider w-20">Score</th>
              <th className="px-3 py-2.5 font-medium text-slate-500 text-xs uppercase tracking-wider w-32"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.map((result) => {
              const relevant = isRelevant(result, threshold);
              return (
                <tr
                  key={result.rowIndex}
                  className={`hover:bg-slate-50/50 ${
                    result.status === 'ignored' ? 'opacity-40' : ''
                  }`}
                >
                  <td className="px-3 py-2.5 text-slate-400 text-xs tabular-nums">{result.rowIndex + 1}</td>
                  <td className="px-3 py-2.5">
                    {result.status === 'ignored' ? (
                      <span className="text-slate-400 italic text-xs">-</span>
                    ) : relevant ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                        Pertinent
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        Hors périm.
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-slate-800">
                    <div className="truncate max-w-[250px]" title={result.originalDesignation}>
                      {result.originalDesignation}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 relative">
                    {result.status === 'ignored' ? (
                      <span className="text-slate-400 italic text-xs">Ignoré</span>
                    ) : result.matchedDesignation ? (
                      <div className="truncate max-w-[250px]" title={result.matchedDesignation}>
                        <span className="text-slate-700">{result.matchedDesignation}</span>
                        {result.status === 'manual' && (
                          <span className="ml-1.5 text-[10px] font-medium text-indigo-500 bg-indigo-50 px-1 py-0.5 rounded">modifié</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-300 text-xs">-</span>
                    )}
                    {editingRow === result.rowIndex && (
                      <SearchDropdown
                        items={catalogItems}
                        onSelect={(item) => {
                          onUpdate(result.rowIndex, {
                            matchedDesignation: item.designation,
                            matchedCode: item.code,
                            score: 100,
                            status: 'manual',
                          });
                          setEditingRow(null);
                        }}
                        onClose={() => setEditingRow(null)}
                      />
                    )}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs text-slate-500 tabular-nums">
                    {result.matchedCode || '-'}
                  </td>
                  <td className="px-3 py-2.5">
                    {result.status !== 'ignored' && result.score > 0 && (
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-medium tabular-nums ${scoreColor(result.score)}`}
                      >
                        {result.score}%
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex gap-1 justify-end">
                      {result.status !== 'ignored' && (
                        <button
                          onClick={() => setEditingRow(result.rowIndex)}
                          className="px-2 py-1 text-xs text-slate-600 rounded hover:bg-slate-100 transition-colors"
                        >
                          Corriger
                        </button>
                      )}
                      <button
                        onClick={() =>
                          onUpdate(result.rowIndex, {
                            status: result.status === 'ignored' ? 'unmatched' : 'ignored',
                            ...(result.status !== 'ignored'
                              ? { matchedDesignation: null, matchedCode: null, score: 0 }
                              : {}),
                          })
                        }
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          result.status === 'ignored'
                            ? 'text-emerald-600 hover:bg-emerald-50'
                            : 'text-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        {result.status === 'ignored' ? 'Restaurer' : 'Ignorer'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {sorted.length === 0 && (
          <div className="px-4 py-8 text-center text-slate-400 text-sm">
            Aucun résultat pour ce filtre
          </div>
        )}
      </div>
    </div>
  );
}
