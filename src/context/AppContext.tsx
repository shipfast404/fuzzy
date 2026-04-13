'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type {
  AppState,
  ParsedFile,
  MarketMapping,
  CatalogMapping,
  CatalogItem,
  MatchResult,
} from '@/lib/types';

interface AppContextType extends AppState {
  setMarketFile: (file: ParsedFile) => void;
  setCatalogFile: (file: ParsedFile) => void;
  setMarketMapping: (mapping: MarketMapping) => void;
  setCatalogMapping: (mapping: CatalogMapping) => void;
  setCatalogItems: (items: CatalogItem[]) => void;
  setMatchResults: (results: MatchResult[]) => void;
  updateMatchResult: (rowIndex: number, update: Partial<MatchResult>) => void;
  reset: () => void;
}

const initialState: AppState = {
  marketFile: null,
  catalogFile: null,
  marketMapping: null,
  catalogMapping: null,
  catalogItems: [],
  matchResults: [],
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);

  const setMarketFile = useCallback((file: ParsedFile) => {
    setState((s) => ({ ...s, marketFile: file }));
  }, []);

  const setCatalogFile = useCallback((file: ParsedFile) => {
    setState((s) => ({ ...s, catalogFile: file }));
  }, []);

  const setMarketMapping = useCallback((mapping: MarketMapping) => {
    setState((s) => ({ ...s, marketMapping: mapping }));
  }, []);

  const setCatalogMapping = useCallback((mapping: CatalogMapping) => {
    setState((s) => ({ ...s, catalogMapping: mapping }));
  }, []);

  const setCatalogItems = useCallback((items: CatalogItem[]) => {
    setState((s) => ({ ...s, catalogItems: items }));
  }, []);

  const setMatchResults = useCallback((results: MatchResult[]) => {
    setState((s) => ({ ...s, matchResults: results }));
  }, []);

  const updateMatchResult = useCallback((rowIndex: number, update: Partial<MatchResult>) => {
    setState((s) => ({
      ...s,
      matchResults: s.matchResults.map((r) =>
        r.rowIndex === rowIndex ? { ...r, ...update } : r
      ),
    }));
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  return (
    <AppContext.Provider
      value={{
        ...state,
        setMarketFile,
        setCatalogFile,
        setMarketMapping,
        setCatalogMapping,
        setCatalogItems,
        setMatchResults,
        updateMatchResult,
        reset,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}
