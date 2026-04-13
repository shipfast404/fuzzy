import Fuse from 'fuse.js';
import type { CatalogItem } from './types';

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

const STOP_WORDS = new Set([
  'de', 'du', 'des', 'le', 'la', 'les', 'un', 'une', 'et', 'ou', 'au', 'aux',
  'en', 'a', 'piece', 'portion', 'par', 'pour', 'avec', 'sans',
]);

export function normalize(text: string): string {
  let result = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  result = result.replace(/[\d.,]+%\w*/g, '');

  for (const [abbr, full] of Object.entries(ABBREVIATIONS)) {
    result = result.replace(new RegExp(`\\b${abbr}\\b`, 'g'), full);
  }

  result = result.replace(/[^a-z0-9\s]/g, ' ');
  result = result.replace(/\s+/g, ' ').trim();

  return result;
}

function tokenize(text: string): string[] {
  return normalize(text)
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

function tokenContainment(marketText: string, catalogTokens: string[]): number {
  if (catalogTokens.length === 0) return 0;
  const marketNorm = normalize(marketText);
  let matched = 0;
  for (const token of catalogTokens) {
    if (marketNorm.includes(token)) matched++;
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

export interface MatchedLine {
  rowIndex: number;
  originalDesignation: string;
  matchedDesignation: string;
  matchedCode: string;
  catalogRowIndex: number;
}

export function performMatching(
  marketDesignations: { rowIndex: number; designation: string }[],
  catalogItems: CatalogItem[]
): MatchedLine[] {
  const catalogTokensMap = catalogItems.map((item) => tokenize(item.designation));

  const fuse = new Fuse(catalogItems, {
    includeScore: true,
    threshold: 0.6,
    keys: ['designationNormalized'],
    ignoreLocation: true,
    minMatchCharLength: 2,
  });

  const results: MatchedLine[] = [];

  for (const { rowIndex, designation } of marketDesignations) {
    const hits = fuse.search(normalize(designation));
    if (hits.length === 0) continue;

    // Re-rank top candidates by token containment
    const scored = hits.slice(0, 5).map((h) => {
      const catIdx = catalogItems.indexOf(h.item);
      const ct = tokenContainment(designation, catalogTokensMap[catIdx]);
      return { item: h.item, ct };
    });
    scored.sort((a, b) => b.ct - a.ct);
    const best = scored[0];

    // Only keep if at least half the catalog tokens appear in the market description
    if (best.ct >= 0.5) {
      results.push({
        rowIndex,
        originalDesignation: designation,
        matchedDesignation: best.item.designation,
        matchedCode: best.item.code,
        catalogRowIndex: best.item.rowIndex,
      });
    }
  }

  return results;
}
