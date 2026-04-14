/**
 * User preferences: learns from confirmations and dismissals across analyses.
 * Key = normalized market designation (so "Boursin nature 16g" and "boursin NATURE 16g" share state).
 */

import { normalize } from './matching';

const KEY = 'katalog.preferences.v1';

interface Pref {
  confirmedCode: string | null;    // catalog code user confirmed (or null if no preference)
  dismissedCodes: string[];        // catalog codes user explicitly rejected for this line
}

type Prefs = Record<string, Pref>;

function load(): Prefs {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Prefs) : {};
  } catch {
    return {};
  }
}

function save(p: Prefs): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* quota exceeded — ignore */
  }
}

function keyFor(marketDesignation: string): string {
  return normalize(marketDesignation);
}

export function getPreference(marketDesignation: string): Pref | null {
  const k = keyFor(marketDesignation);
  const p = load();
  return p[k] ?? null;
}

export function rememberConfirmed(marketDesignation: string, catalogCode: string): void {
  const k = keyFor(marketDesignation);
  const p = load();
  const existing = p[k] ?? { confirmedCode: null, dismissedCodes: [] };
  p[k] = {
    confirmedCode: catalogCode,
    // If user confirms one, remove it from dismissed list
    dismissedCodes: existing.dismissedCodes.filter((c) => c !== catalogCode),
  };
  save(p);
}

export function rememberDismissed(marketDesignation: string, catalogCode: string): void {
  const k = keyFor(marketDesignation);
  const p = load();
  const existing = p[k] ?? { confirmedCode: null, dismissedCodes: [] };
  p[k] = {
    // If user dismisses the confirmed one, clear it
    confirmedCode: existing.confirmedCode === catalogCode ? null : existing.confirmedCode,
    dismissedCodes: [...new Set([...existing.dismissedCodes, catalogCode])],
  };
  save(p);
}

export function clearPreferences(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function preferenceCount(): number {
  const p = load();
  return Object.keys(p).length;
}
