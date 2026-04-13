'use client';

import { useState } from 'react';
import type { MatchResult, CatalogItem } from '@/lib/types';
import { SearchDropdown } from './SearchDropdown';

interface MatchTableProps {
  results: MatchResult[];
  catalogItems: CatalogItem[];
  onUpdate: (rowIndex: number, update: Partial<MatchResult>) => void;
}

function scoreColor(score: number): string {
  if (score >= 80) return 'bg-green-100 text-green-800';
  if (score >= 50) return 'bg-orange-100 text-orange-800';
  return 'bg-red-100 text-red-800';
}

function scoreBadge(score: number): string {
  if (score >= 80) return 'Bon';
  if (score >= 50) return 'Moyen';
  return 'Faible';
}

type SortKey = 'index' | 'score';
type FilterKey = 'all' | 'good' | 'medium' | 'low' | 'ignored';

export function MatchTable({ results, catalogItems, onUpdate }: MatchTableProps) {
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>('index');
  const [filter, setFilter] = useState<FilterKey>('all');

  const filtered = results.filter((r) => {
    if (filter === 'good') return r.score >= 80 && r.status !== 'ignored';
    if (filter === 'medium') return r.score >= 50 && r.score < 80 && r.status !== 'ignored';
    if (filter === 'low') return r.score < 50 && r.status !== 'ignored';
    if (filter === 'ignored') return r.status === 'ignored';
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'score') return a.score - b.score;
    return a.rowIndex - b.rowIndex;
  });

  const stats = {
    total: results.length,
    good: results.filter((r) => r.score >= 80 && r.status !== 'ignored').length,
    medium: results.filter((r) => r.score >= 50 && r.score < 80 && r.status !== 'ignored').length,
    low: results.filter((r) => r.score < 50 && r.status !== 'ignored').length,
    ignored: results.filter((r) => r.status === 'ignored').length,
  };

  return (
    <div>
      {/* Stats bar */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            filter === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Tous ({stats.total})
        </button>
        <button
          onClick={() => setFilter('good')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            filter === 'good' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700 hover:bg-green-100'
          }`}
        >
          Bons ({stats.good})
        </button>
        <button
          onClick={() => setFilter('medium')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            filter === 'medium' ? 'bg-orange-500 text-white' : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
          }`}
        >
          Moyens ({stats.medium})
        </button>
        <button
          onClick={() => setFilter('low')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            filter === 'low' ? 'bg-red-500 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'
          }`}
        >
          Faibles ({stats.low})
        </button>
        <button
          onClick={() => setFilter('ignored')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            filter === 'ignored' ? 'bg-gray-500 text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
          }`}
        >
          Ignorés ({stats.ignored})
        </button>
        <div className="flex-1" />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortKey)}
          className="border border-gray-200 rounded px-2 py-1 text-xs bg-white"
        >
          <option value="index">Tri par ligne</option>
          <option value="score">Tri par score</option>
        </select>
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-3 py-2.5 font-medium text-gray-600 w-8">#</th>
              <th className="px-3 py-2.5 font-medium text-gray-600">Désignation demandée</th>
              <th className="px-3 py-2.5 font-medium text-gray-600">Match trouvé</th>
              <th className="px-3 py-2.5 font-medium text-gray-600 w-24">Code</th>
              <th className="px-3 py-2.5 font-medium text-gray-600 w-20">Score</th>
              <th className="px-3 py-2.5 font-medium text-gray-600 w-36">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((result) => (
              <tr
                key={result.rowIndex}
                className={`border-t border-gray-100 ${
                  result.status === 'ignored' ? 'opacity-50' : ''
                }`}
              >
                <td className="px-3 py-2 text-gray-400 text-xs">{result.rowIndex + 1}</td>
                <td className="px-3 py-2 text-gray-800 max-w-[300px]">
                  <div className="truncate" title={result.originalDesignation}>
                    {result.originalDesignation}
                  </div>
                </td>
                <td className="px-3 py-2 relative">
                  {result.status === 'ignored' ? (
                    <span className="text-gray-400 italic">Ignoré</span>
                  ) : result.matchedDesignation ? (
                    <div className="truncate max-w-[300px]" title={result.matchedDesignation}>
                      {result.matchedDesignation}
                      {result.status === 'manual' && (
                        <span className="ml-1 text-xs text-blue-500">(modifié)</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400 italic">Aucun match</span>
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
                <td className="px-3 py-2 font-mono text-xs text-gray-600">
                  {result.matchedCode || '-'}
                </td>
                <td className="px-3 py-2">
                  {result.status !== 'ignored' && (
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${scoreColor(result.score)}`}
                    >
                      {result.score}% {scoreBadge(result.score)}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <div className="flex gap-1">
                    {result.status !== 'ignored' && (
                      <button
                        onClick={() => setEditingRow(result.rowIndex)}
                        className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
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
                          ? 'bg-green-50 text-green-600 hover:bg-green-100'
                          : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      {result.status === 'ignored' ? 'Restaurer' : 'Ignorer'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sorted.length === 0 && (
          <div className="px-4 py-8 text-center text-gray-400 text-sm">
            Aucun résultat pour ce filtre
          </div>
        )}
      </div>
    </div>
  );
}
