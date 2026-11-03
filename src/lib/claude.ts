// Server-only helpers for the Claude research and assessment steps of the Add-company flow.
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';

export const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5';
export const hasKey = () => !!process.env.ANTHROPIC_API_KEY;

let _client: Anthropic | null = null;
export const client = () => (_client ??= new Anthropic());

export const Research = z.object({
  found: z.boolean(),
  kind: z.enum(['seeking', 'pharma', 'investor']),
  city: z.string().nullable(),
  country: z.string().nullable(),
  region: z.enum(['Americas', 'Europe', 'APAC']),
  own: z.string().nullable(),
  founded: z.string().nullable(),
  heads: z.string().nullable(),
  type: z.enum(['Drug', 'Device']),
  seg: z.enum(['Anterior', 'Posterior']),
  ind: z.string().nullable(),
  asset: z.string().nullable(),
  phase: z.string().nullable(),
  cat: z.string().nullable(),
  raise: z.string().nullable(),
  seeking: z.string().nullable(),
  appetite: z.string().nullable(),
  scale: z.string().nullable(),
  overview: z.string(),
  diffs: z.array(z.string()),
  risk: z.string(),
  buyBox: z.object({
    inds: z.array(z.string()),
    mods: z.array(z.string()),
    stStart: z.number(),
    stEnd: z.number(),
    geo: z.array(z.string()),
    deals: z.array(z.string()),
    excl: z.array(z.string()),
    money: z.array(z.object({ label: z.string(), value: z.string() })),
    contact: z.string().nullable(),
  }).nullable(),
  confidence: z.record(z.string(), z.enum(['high', 'medium', 'low'])),
  sources: z.array(z.string()),
  questions: z.array(z.string()),
});
export type ResearchT = z.infer<typeof Research>;

export const Assessment = z.object({
  scores: z.array(z.number()),
  why: z.array(z.string()),
  dec: z.enum(['Pursue', 'Watch', 'Pass']),
  rationale: z.string(),
  deal: z.number(),
  whereMet: z.string().nullable(),
  nextStep: z.string().nullable(),
  seeking: z.string().nullable(),
  timing: z.string().nullable(),
  notes: z.array(z.object({ type: z.enum(['Call', 'Meeting', 'Email', 'Congress', 'Note']), text: z.string(), daysAgo: z.number() })),
});
export type AssessmentT = z.infer<typeof Assessment>;

/** Pull the text blocks out of a message. */
export const textOf = (m: Anthropic.Message | Anthropic.Beta.BetaMessage) => m.content.filter(b => b.type === 'text').map(b => (b as { text: string }).text).join('\n');

/** Run a web-search-enabled request to completion, resuming paused turns. */
export async function searchAndAnswer(system: string, user: string, maxUses = 6): Promise<Anthropic.Message> {
  const c = client();
  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: user }];
  let res = await c.messages.create({ model: MODEL, max_tokens: 16000, system, messages, tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: maxUses }] });
  for (let i = 0; i < 4 && res.stop_reason === 'pause_turn'; i++) {
    messages.push({ role: 'assistant', content: res.content });
    res = await c.messages.create({ model: MODEL, max_tokens: 16000, system, messages, tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: maxUses }] });
  }
  return res;
}

/** Parse free text into a schema with a structured-output call. */
export async function structure<S extends z.ZodType>(schema: S, instruction: string, text: string): Promise<z.infer<S>> {
  const res = await client().messages.parse({
    model: MODEL, max_tokens: 16000,
    messages: [{ role: 'user', content: `${instruction}\n\n<text>\n${text}\n</text>` }],
    output_config: { format: zodOutputFormat(schema) },
  });
  if (!res.parsed_output) throw new Error('Claude returned no structured output');
  return res.parsed_output;
}

export { zodOutputFormat };
