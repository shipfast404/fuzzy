import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

interface Pair {
  id: number;
  market: string;
  catalog: string;
}

interface Verdict {
  id: number;
  ok: boolean;
  reason?: string;
}

const SYSTEM = `Tu es expert en produits alimentaires français. On te donne des paires (produit demandé dans un appel d'offres public, produit candidat dans un catalogue fournisseur). Pour chaque paire, détermine si le candidat correspond réellement au produit demandé.

Règles STRICTES (doivent toutes passer) :
- Même type de produit (yaourt vs fromage vs lait) : obligatoire
- Même marque quand la marque est explicite dans les deux : obligatoire (ex: "Boursin" ≠ "Kiri", "Saint Paulin" ≠ "Babybel")
- BIO vs non-BIO : différent si l'un est BIO et pas l'autre
- Format/contenance du même ordre de grandeur : 16g ≈ 20g OK, mais 30g vs 2,25kg = NON (rapport > 10x = refus)
- Variantes de saveur EXPLICITEMENT différentes : différent (ex: "ail et fines herbes" ≠ "ciboulette")

Règle IMPLICITE importante :
- Si le demandé ne précise pas de saveur et que le candidat dit "Nature" / "Original" / "Classique", c'est ACCEPTABLE (la saveur par défaut correspond). Ex: "Chanteneige fouetté BIO" ≈ "Chanteneige fouetté nature BIO" ✓
- Si le demandé précise une saveur (ex: "ail") et le candidat en précise une autre (ex: "nature"), c'est REFUSÉ.

Réponds UNIQUEMENT en JSON strict :
{"verdicts":[{"id":1,"ok":true},{"id":2,"ok":false,"reason":"courte explication"}]}

Sois strict sur marque/type/BIO/format, mais tolérant sur saveur par défaut (nature implicite).`;

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 503 });
  }

  let pairs: Pair[];
  try {
    const body = await req.json();
    pairs = body.pairs;
    if (!Array.isArray(pairs) || pairs.length === 0) {
      return NextResponse.json({ error: 'pairs array required' }, { status: 400 });
    }
    if (pairs.length > 200) {
      return NextResponse.json({ error: 'max 200 pairs' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const client = new Anthropic({ apiKey });

  const userText = pairs
    .map((p) => `${p.id}. Demandé: "${p.market}" | Candidat: "${p.catalog}"`)
    .join('\n');

  try {
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      system: [
        {
          type: 'text',
          text: SYSTEM,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: userText }],
    });

    const textBlock = msg.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'empty response' }, { status: 500 });
    }

    // Parse JSON (model may wrap in markdown)
    let text = textBlock.text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) text = jsonMatch[0];
    const parsed = JSON.parse(text) as { verdicts: Verdict[] };

    return NextResponse.json({
      verdicts: parsed.verdicts,
      usage: {
        input: msg.usage.input_tokens,
        cacheRead: msg.usage.cache_read_input_tokens,
        cacheWrite: msg.usage.cache_creation_input_tokens,
        output: msg.usage.output_tokens,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
