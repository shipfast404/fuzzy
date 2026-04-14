'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { ParsedFile, MatchResults, Alternative, MatchedLine } from '@/lib/types';

interface Data {
  catFile: ParsedFile;
  aoFile: ParsedFile;
  results: MatchResults;
}

interface Ctx {
  data: Data | null;
  setData: (d: Data) => void;
  /** Swap the retained match with one of its alternatives. */
  promoteAlternative: (matchIdx: number, altIdx: number) => void;
  /** Remove a match entirely (move line to unmatched). */
  dismissMatch: (matchIdx: number) => void;
  /** Promote a near miss into a confirmed match. */
  confirmNearMiss: (nearMissIdx: number) => void;
  /** Dismiss a near miss (move to unmatched). */
  dismissNearMiss: (nearMissIdx: number) => void;
}

const DataContext = createContext<Ctx | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setDataState] = useState<Data | null>(null);

  const setData = useCallback((d: Data) => setDataState(d), []);

  const promoteAlternative = useCallback((matchIdx: number, altIdx: number) => {
    setDataState((prev) => {
      if (!prev) return prev;
      const m = prev.results.matches[matchIdx];
      if (!m) return prev;
      const alt = m.alternatives[altIdx];
      if (!alt) return prev;

      // Build new match: alt becomes retained, old retained becomes alternative
      const newAlternatives: Alternative[] = [
        { designation: m.catalogDesignation, code: m.catalogCode, overlap: m.overlap, rowIndex: m.catalogRowIndex },
        ...m.alternatives.filter((_, i) => i !== altIdx),
      ];

      const newMatch: MatchedLine = {
        ...m,
        catalogRowIndex: alt.rowIndex,
        catalogDesignation: alt.designation,
        catalogCode: alt.code,
        overlap: alt.overlap,
        alternatives: newAlternatives,
      };

      return {
        ...prev,
        results: {
          ...prev.results,
          matches: prev.results.matches.map((mm, i) => (i === matchIdx ? newMatch : mm)),
        },
      };
    });
  }, []);

  const dismissMatch = useCallback((matchIdx: number) => {
    setDataState((prev) => {
      if (!prev) return prev;
      const m = prev.results.matches[matchIdx];
      if (!m) return prev;
      return {
        ...prev,
        results: {
          ...prev.results,
          matches: prev.results.matches.filter((_, i) => i !== matchIdx),
          unmatched: [
            ...prev.results.unmatched,
            { marketRowIndex: m.marketRowIndex, marketDesignation: m.marketDesignation },
          ],
        },
      };
    });
  }, []);

  const confirmNearMiss = useCallback((nearMissIdx: number) => {
    setDataState((prev) => {
      if (!prev) return prev;
      const nm = prev.results.nearMisses[nearMissIdx];
      if (!nm) return prev;

      const newMatch: MatchedLine = {
        marketRowIndex: nm.marketRowIndex,
        catalogRowIndex: nm.catalogRowIndex,
        marketDesignation: nm.marketDesignation,
        catalogDesignation: nm.bestCandidate,
        catalogCode: nm.bestCode,
        overlap: nm.bestOverlap,
        alternatives: [],
      };

      return {
        ...prev,
        results: {
          ...prev.results,
          matches: [...prev.results.matches, newMatch],
          nearMisses: prev.results.nearMisses.filter((_, i) => i !== nearMissIdx),
        },
      };
    });
  }, []);

  const dismissNearMiss = useCallback((nearMissIdx: number) => {
    setDataState((prev) => {
      if (!prev) return prev;
      const nm = prev.results.nearMisses[nearMissIdx];
      if (!nm) return prev;
      return {
        ...prev,
        results: {
          ...prev.results,
          nearMisses: prev.results.nearMisses.filter((_, i) => i !== nearMissIdx),
          unmatched: [
            ...prev.results.unmatched,
            { marketRowIndex: nm.marketRowIndex, marketDesignation: nm.marketDesignation },
          ],
        },
      };
    });
  }, []);

  return (
    <DataContext.Provider
      value={{ data, setData, promoteAlternative, dismissMatch, confirmNearMiss, dismissNearMiss }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData outside provider');
  return ctx;
}
