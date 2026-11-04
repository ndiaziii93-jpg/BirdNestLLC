import { NextResponse } from 'next/server';
import type Anthropic from '@anthropic-ai/sdk';
import { guard } from '../_guard';
import { client, hasKey, MODEL, zodOutputFormat } from '@/lib/claude';
import { ImportResult, parseImportJson } from '@/lib/importer';
import { pptxToText } from '@/lib/slides';
import { loadSettings } from '@/lib/repo';
import { DEALS, DEV_PH, DRUG_PH, MODS, OWNERSHIP, STG10, STG5, TER, DEALS_W } from '@/lib/constants';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const MAX = 4 * 1024 * 1024; // Vercel accepts request bodies up to 4.5 MB

/**
 * Reads one uploaded file and returns company profiles for the review screen. Nothing is saved here.
 * JSON in the BirdNest import format is read directly; PowerPoint, Word, PDF, Markdown and text go through Claude.
 */
export async function POST(req: Request) {
  const g = await guard(); if (g) return g;
  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  if (!file || typeof file === 'string') return NextResponse.json({ error: 'No file received.' }, { status: 400 });
  if (file.size > MAX) return NextResponse.json({ error: 'File is over 4 MB. Export it as Word or Markdown without images, or split it.' }, { status: 413 });
  const name = file.name || 'upload', ext = (name.split('.').pop() || '').toLowerCase();
  const buf = Buffer.from(await file.arrayBuffer());

  if (ext === 'json') {
    const r = parseImportJson(buf.toString('utf8'));
    if (!r.companies.length) return NextResponse.json({ error: r.errors.join(' · ') || 'No companies found in the file.' }, { status: 422 });
    return NextResponse.json({ source: 'json', companies: r.companies, errors: r.errors, cdaWarning: null });
  }

  let content: Anthropic.ContentBlockParam;
  if (ext === 'pdf') content = { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: buf.toString('base64') } };
  else if (ext === 'docx') {
    const mammoth = await import('mammoth');
    const { value } = await mammoth.extractRawText({ buffer: buf });
    content = { type: 'text', text: `<document name="${name}">\n${value}\n</document>` };
  } else if (ext === 'pptx') {
    let deck: string;
    try { deck = await pptxToText(buf); } catch (e) { return NextResponse.json({ error: 'Could not read the slides (' + (e instanceof Error ? e.message : String(e)) + '). Save the deck as .pptx or PDF and try again.' }, { status: 422 }); }
    content = { type: 'text', text: `<document name="${name}" kind="slide deck">\n${deck}\n</document>` };
  } else if (['md', 'markdown', 'txt', 'text'].includes(ext)) content = { type: 'text', text: `<document name="${name}">\n${buf.toString('utf8')}\n</document>` };
  else return NextResponse.json({ error: `Can't read .${ext} files. Use PowerPoint (.pptx), Word (.docx), PDF, Markdown (.md), text or BirdNest JSON.` }, { status: 415 });

  if (!hasKey()) return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not set on the server, so documents cannot be read. BirdNest JSON files still import.' }, { status: 503 });
  const s = await loadSettings();
  const instruction = `Extract every company profiled in the document above into BirdNest profiles for an ophthalmology BD executive. A slide deck may hold one company per slide plus overview, contact and next-step slides: combine everything the deck says about each company into one profile (for example contacts from a next-steps table, or a stage from an overview table), and treat a "to confirm" or open-questions list as one dated Note.

Rules:
- Use only what the document states. Do not add outside knowledge. Use null (or an empty list) for anything not stated.
- List in lowConfidence the names of fields you inferred rather than read directly (for example region from country, or segment from indication).
- If the document says it is confidential, under CDA or NDA, or contains non-public information from the company, put a one-line description in cdaWarning; otherwise null.

Field guide:
- kind: seeking (biotech or medtech raising or partnering) | pharma (large pharma licensing or acquiring) | investor (VC fund or investment group)
- region: Americas | Europe | APAC · own: ${OWNERSHIP.join(' | ')}, or "Public (EXCHANGE: TICKER)"
- type: Drug | Device · seg: Anterior | Posterior
- ind: prefer one of ${[...s.post, ...s.ant].join(', ')}; a new ophthalmic indication is allowed
- asset: seeking companies "CODE · indication · modality, route"; pharma or investors a one-line focus
- phase: the stage as written (Drug ladder ${DRUG_PH.join(', ')}; Device ladder ${DEV_PH.join(', ')}); null for pharma and investors
- cat: next catalyst as "Event · Qn YYYY" · raise: last financing, recent deal or latest fund · runwayMonths: number of months of cash
- dealStage: one of ${[...DEALS, 'Parked'].join(', ')}, only if the document says where the relationship stands
- decision: Pursue | Watch | Pass, only if the document states a recommendation
- overview: two plain sentences · diffs: up to three differentiators · risk: one line
- pipeline: each programme with stage from ${STG10.join(', ')}
- rightsOpen: territories still available among ${TER.join(', ')}; null if not stated
- buyBox (pharma and investors only, else null): inds, mods (from ${MODS.join(', ')}), stStart/stEnd as indices into ${STG5.map((x, i) => i + '=' + x).join(', ')}, geo (from ${TER.join(', ')}), deals (from ${DEALS_W.join(', ')}), excl, money label/value pairs, contact
- notes: meetings, calls and observations with their date (YYYY-MM-DD, or null), type (Call, Meeting, Email, Congress, Note), text, and private true when the document marks them private or internal
- sources: URLs the document cites`;
  try {
    const res = await client().messages.parse({
      model: MODEL, max_tokens: 16000,
      messages: [{ role: 'user', content: [content, { type: 'text', text: instruction }] }],
      output_config: { format: zodOutputFormat(ImportResult) },
    });
    if (res.stop_reason === 'refusal') return NextResponse.json({ error: 'Claude declined to read this document.' }, { status: 422 });
    if (!res.parsed_output) throw new Error('no structured output');
    if (!res.parsed_output.companies.length) return NextResponse.json({ error: 'No company profiles found in this document.' }, { status: 422 });
    return NextResponse.json({ source: 'claude', companies: res.parsed_output.companies, errors: [], cdaWarning: res.parsed_output.cdaWarning });
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: 'Claude could not read the document (' + m + ').' }, { status: 502 });
  }
}
