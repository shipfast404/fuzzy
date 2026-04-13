import Fuse from 'fuse.js';
import type { CatalogItem, MatchResult } from './types';

const ABBREVIATIONS: Record<string, string> = {
  'pce': 'piece',
  'pces': 'pieces',
  'bq': 'barquette',
  'bqt': 'barquette',
  'sach': 'sachet',
  'bt': 'bouteille',
  'btl': 'bouteille',
  'bte': 'boite',
  'kg': 'kilogramme',
  'mg': '',
  'ml': 'millilitre',
  'cl': 'centilitre',
  'lt': 'litre',
  'pqt': 'paquet',
  'rlx': 'rouleau',
  'bdl': 'barquette',
  'uvc': '',
};

// Common filler words to ignore during token matching
const STOP_WORDS = new Set([
  'de', 'du', 'des', 'le', 'la', 'les', 'un', 'une', 'et', 'ou', 'au', 'aux',
  'en', 'a', 'piece', 'portion', 'pce', 'par', 'pour', 'avec', 'sans',
]);

export function normalize(text: string): string {
  let result = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  // Remove percentage patterns like "40.5%MG"
  result = result.replace(/[\d.,]+%\w*/g, '');

  // Expand abbreviations
  for (const [abbr, full] of Object.entries(ABBREVIATIONS)) {
    result = result.replace(new RegExp(`\\b${abbr}\\b`, 'g'), full);
  }

  // Remove special chars, keep letters/numbers/spaces
  result = result.replace(/[^a-z0-9\s]/g, ' ');

  // Collapse spaces
  result = result.replace(/\s+/g, ' ').trim();

  return result;
}

function tokenize(text: string): string[] {
  return normalize(text)
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

/**
 * Token containment score: what fraction of catalog tokens appear in market tokens.
 * Uses fuzzy per-token matching to handle slight variations (e.g., "16g" vs "16 66g").
 */
function tokenContainmentScore(marketText: string, catalogTokens: string[]): number {
  if (catalogTokens.length === 0) return 0;
  const marketNorm = normalize(marketText);
  let matched = 0;
  for (const token of catalogTokens) {
    // Exact substring check (handles compound tokens like "16g" in "nature 16g")
    if (marketNorm.includes(token)) {
      matched++;
    }
  }
  return matched / catalogTokens.length;
}

export function buildCatalogItems(
  rows: string[][],
  designationCol: number,
  codeCol: number
): CatalogItem[] {
  return rows
    .map((row, index) => {
      const designation = row[designationCol] || '';
      const code = row[codeCol] || '';
      if (!designation.trim()) return null;
      return {
        designation: designation.trim(),
        designationNormalized: normalize(designation),
        code: code.trim(),
        rowIndex: index,
      };
    })
    .filter((item): item is CatalogItem => item !== null);
}

export function performMatching(
  marketDesignations: { rowIndex: number; designation: string }[],
  catalogItems: CatalogItem[]
): MatchResult[] {
  // Pre-tokenize catalog items
  const catalogTokensMap = new Map<number, string[]>();
  for (const item of catalogItems) {
    catalogTokensMap.set(item.rowIndex, tokenize(item.designation));
  }

  // Fuse.js for initial candidate retrieval
  const fuse = new Fuse(catalogItems, {
    includeScore: true,
    threshold: 0.8,
    keys: ['designationNormalized'],
    ignoreLocation: true,
    minMatchCharLength: 2,
  });

  return marketDesignations.map(({ rowIndex, designation }) => {
    const normalized = normalize(designation);
    const fuseResults = fuse.search(normalized);

    if (fuseResults.length === 0) {
      return {
        rowIndex,
        originalDesignation: designation,
        matchedDesignation: null,
        matchedCode: null,
        score: 0,
        status: 'unmatched' as const,
      };
    }

    // Re-score top Fuse candidates using token containment
    const candidates = fuseResults.slice(0, 10).map((fr) => {
      const fuseScore = Math.round((1 - fr.score!) * 100);
      const tokens = catalogTokensMap.get(fr.item.rowIndex) || [];
      const containment = Math.round(tokenContainmentScore(designation, tokens) * 100);
      // Combined score: weighted blend favoring token containment
      const combined = Math.round(containment * 0.7 + fuseScore * 0.3);
      return { item: fr.item, fuseScore, containment, combined };
    });

    // Sort by combined score descending
    candidates.sort((a, b) => b.combined - a.combined);
    const best = candidates[0];

    return {
      rowIndex,
      originalDesignation: designation,
      matchedDesignation: best.item.designation,
      matchedCode: best.item.code,
      score: best.combined,
      status: best.combined >= 40 ? 'auto' : 'unmatched',
    };
  });
}
