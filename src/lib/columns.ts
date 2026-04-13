/** Auto-detect column indices from headers using keyword matching. */

const DESIGNATION_KW = ['designation', 'produit', 'nom', 'libelle', 'article', 'description'];
const CODE_KW = ['code', 'reference', 'ref', 'enseigne', 'interne', 'sku'];

function norm(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function detect(headers: string[], keywords: string[]): number | null {
  const norms = headers.map(norm);
  for (const kw of keywords) {
    const idx = norms.findIndex((h) => h.includes(kw));
    if (idx >= 0) return idx;
  }
  return null;
}

export function suggestDesignation(headers: string[]): number | null {
  return detect(headers, DESIGNATION_KW);
}

export function suggestCode(headers: string[]): number | null {
  return detect(headers, CODE_KW);
}
