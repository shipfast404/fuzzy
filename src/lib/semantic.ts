/** Client helper for semantic verification via Claude API route. */

import type { MatchedLine, NearMiss } from './types';

interface Verdict {
  id: number;
  ok: boolean;
  reason?: string;
}

interface Pair {
  id: number;
  market: string;
  catalog: string;
}

interface VerifyResponse {
  verdicts: Verdict[];
  usage?: { input: number; cacheRead: number; cacheWrite: number; output: number };
}

async function callVerify(pairs: Pair[]): Promise<Verdict[]> {
  const res = await fetch('/api/semantic-verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pairs }),
  });
  if (!res.ok) throw new Error(`verify failed: ${res.status}`);
  const data = (await res.json()) as VerifyResponse;
  return data.verdicts;
}

export interface SemanticOutcome {
  /** Matches confirmed by Claude (still valid). */
  confirmedMatches: MatchedLine[];
  /** Matches rejected by Claude (moved to unmatched). */
  rejectedMatches: MatchedLine[];
  /** Near misses promoted by Claude (were borderline, now confirmed). */
  promotedNearMisses: MatchedLine[];
  /** Reasons for rejections by catalogCode+marketRowIndex key. */
  reasons: Map<string, string>;
}

/**
 * Run Claude semantic verification on matches and borderline near misses.
 * Returns a split: confirmed / rejected / promoted.
 */
export async function verifyMatches(
  matches: MatchedLine[],
  nearMisses: NearMiss[]
): Promise<SemanticOutcome> {
  // Prepare pairs: all matches + top near misses (for potential promotion)
  const pairs: Pair[] = [];
  const idToMatch = new Map<number, MatchedLine>();
  const idToNearMiss = new Map<number, NearMiss>();

  let id = 1;
  for (const m of matches) {
    pairs.push({ id, market: m.marketDesignation, catalog: m.catalogDesignation });
    idToMatch.set(id, m);
    id++;
  }
  // Only check near misses above 35% (promising ones)
  for (const nm of nearMisses.filter((n) => n.bestOverlap >= 0.35)) {
    pairs.push({ id, market: nm.marketDesignation, catalog: nm.bestCandidate });
    idToNearMiss.set(id, nm);
    id++;
  }

  if (pairs.length === 0) {
    return { confirmedMatches: [], rejectedMatches: [], promotedNearMisses: [], reasons: new Map() };
  }

  const verdicts = await callVerify(pairs);
  const verdictMap = new Map(verdicts.map((v) => [v.id, v]));

  const confirmedMatches: MatchedLine[] = [];
  const rejectedMatches: MatchedLine[] = [];
  const promotedNearMisses: MatchedLine[] = [];
  const reasons = new Map<string, string>();

  for (const [pairId, m] of idToMatch) {
    const v = verdictMap.get(pairId);
    if (v?.ok) {
      confirmedMatches.push(m);
    } else {
      rejectedMatches.push(m);
      if (v?.reason) reasons.set(`${m.marketRowIndex}-${m.catalogCode}`, v.reason);
    }
  }

  for (const [pairId, nm] of idToNearMiss) {
    const v = verdictMap.get(pairId);
    if (v?.ok) {
      promotedNearMisses.push({
        marketRowIndex: nm.marketRowIndex,
        catalogRowIndex: nm.catalogRowIndex,
        marketDesignation: nm.marketDesignation,
        catalogDesignation: nm.bestCandidate,
        catalogCode: nm.bestCode,
        overlap: nm.bestOverlap,
        alternatives: [],
      });
    }
  }

  return { confirmedMatches, rejectedMatches, promotedNearMisses, reasons };
}

/** Check if semantic verification is enabled (server has API key). */
export async function isSemanticEnabled(): Promise<boolean> {
  try {
    const res = await fetch('/api/semantic-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pairs: [] }),
    });
    // 400 = enabled but bad payload; 503 = disabled
    return res.status !== 503;
  } catch {
    return false;
  }
}
