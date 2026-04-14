/** Persist catalog (file contents + mapping) in localStorage. */

const KEY = 'katalog.catalog.v1';

interface StoredCatalog {
  fileName: string;
  headers: string[];
  rows: string[][];
  headerRowIndex: number;
  nameCol: number;
  codeCol: number;
  savedAt: number;
}

export function saveCatalog(data: StoredCatalog): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Quota exceeded — catalog too big. Silently fail; user can re-upload.
  }
}

export function loadCatalog(): StoredCatalog | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredCatalog;
  } catch {
    return null;
  }
}

export function clearCatalog(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
