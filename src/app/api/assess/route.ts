import { NextResponse } from 'next/server';
import { guard } from '../_guard';
import { Assessment, client, hasKey, MODEL, zodOutputFormat } from '@/lib/claude';
import { loadSettings } from '@/lib/repo';
import { DEALS, SC_DEFAULT } from '@/lib/constants';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: Request) {
  const g = await guard(); if (g) return g;
  if (!hasKey()) return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not set on the server.' }, { status: 503 });
  const { research, qa, notes } = (await req.json()) as { research: Record<string, unknown>; qa: { q: string; a: string }[]; notes: string };
  const s = await loadSettings();
  const crit = SC_DEFAULT.map((x, i) => `${x[0]} (weight ${s.weights[i] ?? x[1]}; ${x[2]})`).join('; ');
  try {
    const res = await client().messages.parse({
      model: MODEL, max_tokens: 8000,
      system: 'You help a BD executive complete a partnering assessment. Base scores only on the research and the executive\'s answers. Be terse, numbers first, no exclamation marks.',
      messages: [{ role: 'user', content: `Research:\n${JSON.stringify({ ...research, questions: undefined, confidence: undefined, sources: undefined })}\n\nQ&A:\n${(qa || []).map(q => 'Q: ' + q.q + '\nA: ' + (q.a || '(no answer)')).join('\n')}\n\nNotes: ${notes || '(none)'}\n\nScorecard criteria (score each 1-5, in this order): ${crit}.\nDeal stages by index: ${DEALS.map((d, i) => i + '=' + d).join(', ')}, -1=Parked.\n\nReturn: scores (array of 6 ints), why (array of 6 one-line justifications), dec (Pursue|Watch|Pass), rationale (one line), deal (int), whereMet, nextStep, seeking, timing, and notes (array of {type: Call|Meeting|Email|Congress|Note, text, daysAgo}) summarising what the executive told you.` }],
      output_config: { format: zodOutputFormat(Assessment) },
    });
    if (!res.parsed_output) throw new Error('no structured output');
    return NextResponse.json(res.parsed_output);
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: 'Claude could not finish the assessment (' + m + ').' }, { status: 502 });
  }
}
