import Fuse from 'fuse.js';
import type { CatalogItem, MatchedLine, NearMiss, Unmatched, MatchResults, Alternative } from './types';
import { getPreference } from './preferences';

const ABBREVIATIONS: Record<string, string> = {
  'pce': '', 'pces': '', 'bq': 'barquette', 'bqt': 'barquette',
  'sach': 'sachet', 'bt': 'bouteille', 'btl': 'bouteille', 'bte': 'boite',
  'mg': '', 'ml': 'millilitre', 'cl': 'centilitre', 'lt': 'litre', 'pqt': 'paquet',
};

export function normalize(text: string): string {
  let r = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  r = r.replace(/\d+[,.]?\d*\s*%\s*mg/gi, '');
  r = r.replace(/\bportions?\b/gi, '');
  for (const [a, f] of Object.entries(ABBREVIATIONS)) {
    r = r.replace(new RegExp(`\\b${a}\\b`, 'g'), f);
  }
  r = r.replace(/[-–—]/g, ' ').replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
  return r;
}

const STOP = new Set([
  'de', 'du', 'des', 'le', 'la', 'les', 'un', 'une', 'et', 'ou',
  'au', 'aux', 'en', 'a', 'par', 'pour', 'avec', 'sans',
]);

function tokenize(text: string): string[] {
  return normalize(text).split(/\s+/).filter((t) => t.length > 1 && !STOP.has(t));
}

function tokenOverlap(marketText: string, catalogTokens: string[]): number {
  if (!catalogTokens.length) return 0;
  const n = normalize(marketText);
  let hit = 0;
  for (const t of catalogTokens) {
    if (n.includes(t)) hit++;
  }
  return hit / catalogTokens.length;
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
      return { designation: d, normalized: normalize(d), code: (row[codeCol] || '').trim(), rowIndex: i };
    })
    .filter((x): x is CatalogItem => x !== null);
}

const MATCH_THRESHOLD = 0.5;
const NEAR_MISS_THRESHOLD = 0.3;

export function match(
  marketRows: { idx: number; text: string }[],
  catalog: CatalogItem[]
): MatchResults {
  const catTokens = catalog.map((c) => tokenize(c.designation));

  const fuse = new Fuse(catalog, {
    includeScore: true,
    threshold: 0.6,
    keys: ['normalized'],
    ignoreLocation: true,
    minMatchCharLength: 3,
  });

  const matches: MatchedLine[] = [];
  const nearMisses: NearMiss[] = [];
  const unmatched: Unmatched[] = [];

  for (const { idx, text } of marketRows) {
    const pref = getPreference(text);

    // Hard override: user previously confirmed a specific catalog code for this line
    if (pref?.confirmedCode) {
      const confirmed = catalog.find((c) => c.code === pref.confirmedCode);
      if (confirmed) {
        const ci = catalog.indexOf(confirmed);
        const ov = tokenOverlap(text, catTokens[ci]);
        matches.push({
          marketRowIndex: idx,
          catalogRowIndex: confirmed.rowIndex,
          marketDesignation: text,
          catalogDesignation: confirmed.designation,
          catalogCode: confirmed.code,
          overlap: Math.max(ov, 1), // confirmed = 100% trust
          alternatives: [],
        });
        continue;
      }
      // Confirmed code no longer in catalog: fall through to normal matching
    }

    const hits = fuse.search(normalize(text));

    if (!hits.length) {
      unmatched.push({ marketRowIndex: idx, marketDesignation: text });
      continue;
    }

    // Score all top candidates by token overlap, filter out dismissed ones
    const dismissed = new Set(pref?.dismissedCodes ?? []);
    const scored = hits.slice(0, 8)
      .filter((h) => !dismissed.has(h.item.code))
      .map((h) => {
        const ci = catalog.indexOf(h.item);
        const ov = tokenOverlap(text, catTokens[ci]);
        return { item: h.item, overlap: ov };
      });
    scored.sort((a, b) => b.overlap - a.overlap);

    if (scored.length === 0) {
      unmatched.push({ marketRowIndex: idx, marketDesignation: text });
      continue;
    }

    const best = scored[0];

    if (best.overlap >= MATCH_THRESHOLD) {
      const alternatives: Alternative[] = scored
        .slice(1, 4)
        .filter((s) => s.overlap >= NEAR_MISS_THRESHOLD)
        .map((s) => ({
          designation: s.item.designation,
          code: s.item.code,
          overlap: s.overlap,
          rowIndex: s.item.rowIndex,
        }));

      matches.push({
        marketRowIndex: idx,
        catalogRowIndex: best.item.rowIndex,
        marketDesignation: text,
        catalogDesignation: best.item.designation,
        catalogCode: best.item.code,
        overlap: best.overlap,
        alternatives,
      });
    } else if (best.overlap >= NEAR_MISS_THRESHOLD) {
      nearMisses.push({
        marketRowIndex: idx,
        marketDesignation: text,
        bestCandidate: best.item.designation,
        bestCode: best.item.code,
        bestOverlap: best.overlap,
        catalogRowIndex: best.item.rowIndex,
      });
    } else {
      unmatched.push({ marketRowIndex: idx, marketDesignation: text });
    }
  }

  return { matches, nearMisses, unmatched, totalAo: marketRows.length };
}
