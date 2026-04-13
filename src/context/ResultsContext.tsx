'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { MatchedLine } from '@/lib/matching';

interface ResultsData {
  matches: MatchedLine[];
  totalMarket: number;
  marketFileName: string;
  // Full row data for expand view
  marketHeaders: string[];
  marketRows: string[][];
  catalogHeaders: string[];
  catalogRows: string[][];
  // Raw file for export
  marketRawFile: ArrayBuffer;
  marketHeaderRowIndex: number;
}

interface ResultsContextType {
  data: ResultsData | null;
  setData: (data: ResultsData) => void;
}

const ResultsContext = createContext<ResultsContextType | null>(null);

export function ResultsProvider({ children }: { children: ReactNode }) {
  const [data, setDataState] = useState<ResultsData | null>(null);

  const setData = useCallback((d: ResultsData) => {
    setDataState(d);
  }, []);

  return (
    <ResultsContext.Provider value={{ data, setData }}>
      {children}
    </ResultsContext.Provider>
  );
}

export function useResults() {
  const ctx = useContext(ResultsContext);
  if (!ctx) throw new Error('useResults must be used within ResultsProvider');
  return ctx;
}
