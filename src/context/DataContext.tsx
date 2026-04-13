'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { ParsedFile, MatchResults } from '@/lib/types';

interface Data {
  catFile: ParsedFile;
  aoFile: ParsedFile;
  results: MatchResults;
}

interface Ctx {
  data: Data | null;
  setData: (d: Data) => void;
}

const DataContext = createContext<Ctx | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setDataState] = useState<Data | null>(null);
  const setData = useCallback((d: Data) => setDataState(d), []);
  return <DataContext.Provider value={{ data, setData }}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData outside provider');
  return ctx;
}
