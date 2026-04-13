import Fuse from 'fuse.js';
import type { CatalogItem, MatchedLine } from './types';

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')       // accents
    .replace(/\d+[,.]?\d*\s*%\s*mg/gi, '') // "40.5%MG"
    .replace(/\bpce\.?\b/gi, '')           // "Pce"
    .replace(/\bportions?\b/gi, '')        // "portion(s)"
    .replace(/[-–—]/g, ' ')               // tirets → espaces
    .replace(/[^a-z0-9\s]/g, '')           // garde alphanum
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildCatalog(
  rows: string[][],
  designationCol: number,
  codeCol: number
): CatalogItem[] {
  return rows
    .map((row, i) => {
      const d = (row[designationCol] || '').trim();
      if (!d) return null;
      return {
        designation: d,
        normalized: normalize(d),
        code: (row[codeCol] || '').trim(),
        rowIndex: i,
      };
    })
    .filter((x): x is CatalogItem => x !== null);
}

const STOP = new Set([
  'de', 'du', 'des', 'le', 'la', 'les', 'un', 'une', 'et', 'ou',
  'au', 'aux', 'en', 'a', 'par', 'pour', 'avec', 'sans',
]);

function tokenize(text: string): string[] {
  return normalize(text).split(/\s+/).filter((t) => t.length > 1 && !STOP.has(t));
}

/** What fraction of catalogTokens appear as substrings in marketText? */
function tokenOverlap(marketText: string, catalogTokens: string[]): number {
  if (!catalogTokens.length) return 0;
  const n = normalize(marketText);
  let hit = 0;
  for (const t of catalogTokens) {
    if (n.includes(t)) hit++;
  }
  return hit / catalogTokens.length;
}

export function match(
  marketRows: { idx: number; text: string }[],
  catalog: CatalogItem[]
): MatchedLine[] {
  const catTokens = catalog.map((c) => tokenize(c.designation));

  const fuse = new Fuse(catalog, {
    includeScore: true,
    threshold: 0.6,
    keys: ['normalized'],
    ignoreLocation: true,
    minMatchCharLength: 3,
  });

  const out: MatchedLine[] = [];

  for (const { idx, text } of marketRows) {
    const hits = fuse.search(normalize(text));
    if (!hits.length) continue;

    // pick candidate with highest token overlap among top-5 Fuse hits
    let bestOverlap = 0;
    let bestItem = hits[0].item;
    for (const h of hits.slice(0, 5)) {
      const ci = catalog.indexOf(h.item);
      const ov = tokenOverlap(text, catTokens[ci]);
      if (ov > bestOverlap) {
        bestOverlap = ov;
        bestItem = h.item;
      }
    }

    if (bestOverlap >= 0.5) {
      out.push({
        marketRowIndex: idx,
        catalogRowIndex: bestItem.rowIndex,
        marketDesignation: text,
        catalogDesignation: bestItem.designation,
        catalogCode: bestItem.code,
      });
    }
  }

  return out;
}
