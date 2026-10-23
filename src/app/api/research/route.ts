import { NextResponse } from 'next/server';
import { guard } from '../_guard';
import { Research, hasKey, searchAndAnswer, structure, textOf } from '@/lib/claude';
import { loadSettings } from '@/lib/repo';
import { DEV_PH, DRUG_PH, MODS, OWNERSHIP, STG5, TER, DEALS_W } from '@/lib/constants';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const SYSTEM = 'You are a research assistant for a senior business development executive in ophthalmology. Use web search to find what is publicly known about the company: HQ, ownership, founding year, headcount, lead asset, phase, catalysts, financing, and for pharma or investors their stated areas of interest. Never guess precise numbers; use null when a value is not public. Mark each field high, medium or low confidence. List the URLs you relied on. Public information only.';

export async function POST(req: Request) {
  const g = await guard(); if (g) return g;
  if (!hasKey()) return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not set on the server. Add it in Vercel → Settings → Environment Variables, or fill the profile in manually.' }, { status: 503 });
  const { name, web, hq } = (await req.json()) as { name: string; web?: string; hq?: string };
  if (!name?.trim()) return NextResponse.json({ error: 'Company name required' }, { status: 400 });
  const s = await loadSettings();
  const prompt = `Company: ${name}\nWebsite: ${web || 'unknown'}\nHQ hint: ${hq || 'none'}\n\nResearch this company with web search (use the website first if given), then write a complete profile with these fields and allowed values:\n- kind: seeking (biotech or medtech seeking capital or partners) | pharma (large pharma looking to invest, license or acquire) | investor (VC fund or investment group)\n- city, country, region (Americas | Europe | APAC)\n- own: ${OWNERSHIP.join(' | ')} (for public companies write "Public (EXCHANGE: TICKER)")\n- founded ("YYYY"), heads (headcount as a string)\n- type: Drug | Device · seg: Anterior | Posterior\n- ind: prefer one of ${[...s.post, ...s.ant].join(', ')}; a new ophthalmic indication is allowed\n- asset: for seeking companies "CODE · indication · modality, route"; for pharma or investors a one-line focus statement\n- phase (Drug): ${DRUG_PH.join(' | ')} · phase (Device): ${DEV_PH.join(' | ')} · null for pharma and investors\n- cat: next catalyst "Event · Qn YYYY" or null\n- raise: last financing "$XXM Series X, Mon YYYY" (seeking), recent ophthalmic deal (pharma), latest fund (investor), or null\n- seeking: deal they seem open to, or null\n- appetite: pharma deal appetite (e.g. "In-license Ph2+, $50–150M upfront") or investor check size (e.g. "$5–25M per round"); null for seeking companies\n- scale: pharma revenue (e.g. "Global · $48B revenue") or investor stage focus (e.g. "Seed to Series B"); null for seeking companies\n- overview: two plain sentences · diffs: three short differentiators · risk: one line\n- buyBox (pharma and investors only, else null): inds (from the indication list), mods (from ${MODS.join(', ')}), stage window stStart/stEnd as indices into ${STG5.map((x, i) => i + '=' + x).join(', ')}, geo territories wanted (from ${TER.join(', ')}; empty for investors), deals (from ${DEALS_W.join(', ')}; empty for investors), excl (what they rule out), money (label/value pairs such as Upfront, Milestones, Check size, Role), contact (BD lead name · title if public)\n- confidence: high | medium | low for each field above\n- sources: URLs used\n- questions: 4 to 6 short questions for the BD lead covering what public data cannot: how they know the company, where met, deal stage, fit with their portfolio, rights or economics they have heard, team quality.\n\nAnswer in prose or JSON; a second pass will structure it.`;
  try {
    const msg = await searchAndAnswer(SYSTEM, prompt);
    if (msg.stop_reason === 'refusal') return NextResponse.json({ error: 'Claude declined this request.' }, { status: 422 });
    const r = await structure(Research, 'Structure the research below into the schema exactly. Use null for unknown values. Keep confidence keys matching the field names.', textOf(msg));
    return NextResponse.json(r);
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: 'Claude research did not complete (' + m + ').' }, { status: 502 });
  }
}
