// Company-profile import: the shared schema (used for Claude's structured output and for JSON
// files), matching an imported profile to an existing company, and the merge rules.
// Pure functions only, so the same code runs on the server, in the browser and in tests.
import { z } from 'zod';
import { DEALS, DEV_PH, DRUG_PH, NOTE_TYPES, STG10, TER } from './constants';
import { calcFit, decisionFor } from './fit';
import { emptyBuyBox } from './match';
import { regionFor, atlasName } from './countries';
import type { AiProfile, Company, Note, Settings } from './types';

const str = z.string().nullable();
const DEAL_NAMES = [...DEALS, 'Parked'] as const;

/** One company profile as read from a document. Every key is required (nullable) so it works as a structured output. */
export const Profile = z.object({
  name: z.string(),
  kind: z.enum(['seeking', 'pharma', 'investor']),
  website: str,
  city: str,
  country: str,
  region: z.enum(['Americas', 'Europe', 'APAC']).nullable(),
  own: str,
  founded: str,
  heads: str,
  type: z.enum(['Drug', 'Device']).nullable(),
  seg: z.enum(['Anterior', 'Posterior']).nullable(),
  ind: str,
  asset: str,
  phase: str,
  cat: str,
  raise: str,
  runwayMonths: z.number().nullable(),
  seeking: str,
  timing: str,
  appetite: str,
  scale: str,
  dealStage: z.enum(DEAL_NAMES).nullable(),
  decision: z.enum(['Pursue', 'Watch', 'Pass']).nullable(),
  rationale: str,
  overview: str,
  diffs: z.array(z.string()),
  risk: str,
  pipeline: z.array(z.object({ code: z.string(), description: z.string(), stage: z.enum(STG10 as [string, ...string[]]), catalyst: str })),
  economics: z.array(z.object({ label: z.string(), value: z.string() })),
  contacts: z.array(z.object({ name: z.string(), role: z.string() })),
  whereMet: str,
  nextStep: str,
  rightsOpen: z.array(z.enum(TER)).nullable(),
  buyBox: z.object({
    inds: z.array(z.string()),
    mods: z.array(z.string()),
    stStart: z.number(),
    stEnd: z.number(),
    geo: z.array(z.string()),
    deals: z.array(z.string()),
    excl: z.array(z.string()),
    money: z.array(z.object({ label: z.string(), value: z.string() })),
    contact: str,
  }).nullable(),
  notes: z.array(z.object({ date: str, type: z.enum(NOTE_TYPES), text: z.string(), private: z.boolean() })),
  lowConfidence: z.array(z.string()),
  sources: z.array(z.string()),
});
export type Draft = z.infer<typeof Profile>;

/** What Claude returns for one document. */
export const ImportResult = z.object({
  companies: z.array(Profile),
  cdaWarning: str,
});

/** Same shape, but only `name` is required: for hand-written or Cowork-written JSON files. */
const Lenient = Profile.partial().extend({ name: z.string().min(1) });

export const blankDraft = (name = ''): Draft => ({
  name, kind: 'seeking', website: null, city: null, country: null, region: null, own: null, founded: null, heads: null, type: null, seg: null,
  ind: null, asset: null, phase: null, cat: null, raise: null, runwayMonths: null, seeking: null, timing: null, appetite: null, scale: null,
  dealStage: null, decision: null, rationale: null, overview: null, diffs: [], risk: null, pipeline: [], economics: [], contacts: [],
  whereMet: null, nextStep: null, rightsOpen: null, buyBox: null, notes: [], lowConfidence: [], sources: [],
});

/** Read a BirdNest JSON import file: `{ "companies": [...] }`, a bare array, or one company object. */
export function parseImportJson(text: string): { companies: Draft[]; errors: string[] } {
  let raw: unknown;
  try { raw = JSON.parse(text); } catch (e) { return { companies: [], errors: ['Not valid JSON: ' + (e instanceof Error ? e.message : String(e))] }; }
  const list: unknown[] = Array.isArray(raw) ? raw : raw && typeof raw === 'object' && Array.isArray((raw as { companies?: unknown }).companies) ? (raw as { companies: unknown[] }).companies : [raw];
  const companies: Draft[] = [], errors: string[] = [];
  list.forEach((item, i) => {
    const r = Lenient.safeParse(item);
    if (r.success) companies.push({ ...blankDraft(), ...Object.fromEntries(Object.entries(r.data).filter(([, v]) => v !== undefined)) } as Draft);
    else {
      const name = item && typeof item === 'object' && typeof (item as { name?: unknown }).name === 'string' ? (item as { name: string }).name : `item ${i + 1}`;
      errors.push(`${name}: ` + r.error.issues.slice(0, 3).map(x => `${x.path.join('.') || 'record'} ${x.message}`).join('; '));
    }
  });
  return { companies, errors };
}

const SUFFIX = /\b(therapeutics|therapeutic|pharmaceuticals?|pharma|biosciences?|bio|biotech|sciences?|medical|ocular|vision|ventures|capital|partners|inc|ltd|limited|llc|ag|sa|sas|gmbh|as|asa|ab|bv|nv|plc|co)\b/g;
export const normName = (s: string) => {
  const base = (s || '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ');
  const stripped = base.replace(SUFFIX, ' ').replace(/\s+/g, '');
  return stripped || base.replace(/\s+/g, '');
};
const host = (w: string | null | undefined) => {
  if (!w) return '';
  try { return new URL(/^https?:/.test(w) ? w : 'https://' + w).hostname.replace(/^www\./, '').toLowerCase(); } catch { return ''; }
};

/**
 * The existing company an imported profile refers to: same website host, else the same name.
 * Sample records are never matched, so real profiles never merge into the demo data.
 */
export function findMatch(all: Company[], d: Pick<Draft, 'name' | 'website'>): Company | null {
  const companies = all.filter(c => !c.sample);
  const h = host(d.website);
  if (h) { const byHost = companies.find(c => host(c.website) === h); if (byHost) return byHost; }
  const n = normName(d.name);
  return companies.find(c => normName(c.name) === n) || null;
}

/** Map a free-text phase onto the ladder for the type, keeping the original wording as the label. */
export function normalizePhase(type: 'Drug' | 'Device', raw: string | null): { phase: string; label: string } | null {
  if (!raw || !raw.trim()) return null;
  const t = raw.trim(), l = t.toLowerCase();
  if (type === 'Device') {
    const p = l.includes('post') || l.includes('market') || l.includes('approved') || l.includes('ce mark') || l.includes('510') ? 'Post-market' : l.includes('pivotal') ? 'Pivotal' : 'Pilot';
    return { phase: p, label: (DEV_PH as readonly string[]).includes(t) ? t : t };
  }
  if ((DRUG_PH as readonly string[]).includes(t)) return { phase: t, label: t };
  if (/approved|marketed|launched|phase\s*(4|iv)\b/.test(l)) return { phase: 'Phase 4', label: t };
  const m = /phase\s*(?:([1-3])(?!\d)|(i{1,3})\b)/.exec(l);
  if (m) { const n = m[1] || { i: '1', ii: '2', iii: '3' }[m[2] as 'i' | 'ii' | 'iii']; return { phase: 'Phase ' + n, label: t }; }
  if (/pre-?clinical|ind[- ]enabling|discovery|research/.test(l)) return { phase: 'Preclinical', label: t };
  return { phase: 'Preclinical', label: t };
}

const has = (v: string | null | undefined): v is string => !!v && !!v.trim();

export interface ApplyCtx { settings: Settings; today: string; uid: () => string; lonLat: [number, number] | null }

/**
 * Turn an imported profile into a Company. With `existing`, only the fields the import states are
 * overwritten; scores, decision, logo and map position stay, and notes are added (never removed).
 */
export function applyDraft(existing: Company | null, d: Draft, ctx: ApplyCtx): Company {
  const { settings, today, uid } = ctx;
  const kind = d.kind || existing?.kind || 'seeking';
  const type: Company['type'] = d.type || existing?.type || 'Drug';
  const buyer = kind !== 'seeking';
  const base: Company = existing ? structuredClone(existing) : {
    id: uid(), kind, name: d.name.trim(), website: '', city: '', cdisp: '', country: '', region: 'Americas', lat: 0, lon: 0, type, seg: 'Posterior', ind: '', asset: '',
    phase: buyer ? '' : 'Preclinical', phaseLabel: buyer ? '—' : 'Preclinical', trend: 0, dec: 'Watch', deal: 0, cat: '', runway: null, runwayAsOf: null, raise: '',
    rightsArr: [true, true, true, true, true, true], own: 'Private', founded: '', heads: '', rationale: '', scores: [3, 3, 3, 3, 3, 3], why: ['', '', '', '', '', ''],
    svcScores: [3, 3, 3, 3, 3], svcWhy: ['', '', '', '', ''], prevFit: 60, fit: 60, logo: null, appetite: '', scale: '', lens: 'partnering', ai: null, buyBox: null,
    notes: [], sample: false,
  };
  const c = base;
  c.kind = kind; c.type = type;
  if (has(d.name) && !existing) c.name = d.name.trim();
  if (has(d.website)) c.website = host(d.website) || d.website.trim();
  if (has(d.city)) c.city = d.city.trim();
  if (has(d.country)) { c.cdisp = d.country.trim(); c.country = atlasName(d.country); }
  if (d.region) c.region = d.region; else if (has(d.country) && !existing) c.region = regionFor(d.country);
  for (const k of ['own', 'founded', 'heads', 'asset', 'cat', 'raise', 'appetite', 'scale', 'rationale'] as const) { const v = d[k]; if (has(v)) c[k] = v.trim(); }
  if (has(d.ind)) c.ind = d.ind.trim();
  if (d.seg) c.seg = d.seg;
  else if (has(d.ind)) c.seg = settings.ant.includes(d.ind.trim()) ? 'Anterior' : settings.post.includes(d.ind.trim()) ? 'Posterior' : c.seg;
  if (buyer) { c.phase = ''; c.phaseLabel = '—'; }
  else {
    const p = normalizePhase(type, d.phase);
    if (p) { c.phase = p.phase; c.phaseLabel = p.label; }
    else if (existing && existing.type !== type) { const first = type === 'Device' ? DEV_PH[0] : DRUG_PH[0]; c.phase = first; c.phaseLabel = first; }
  }
  if (d.runwayMonths != null && !buyer) { c.runway = Math.max(0, Math.round(d.runwayMonths)); c.runwayAsOf = today; }
  if (d.dealStage) c.deal = d.dealStage === 'Parked' ? -1 : DEALS.indexOf(d.dealStage as (typeof DEALS)[number]);
  if (d.rightsOpen) c.rightsArr = TER.map(t => d.rightsOpen!.includes(t));
  if (!c.asset) c.asset = c.ind ? `${c.ind} · ${type.toLowerCase()}` : type;
  if (!c.cat) c.cat = 'None set';

  // Narrative for the one-pager: overwrite each part only when the import has it.
  const ai: AiProfile = c.ai ? { ...c.ai } : { overview: '', diffs: [], risk: '', seeking: 'Not stated', timing: 'Not stated', pipe: [], econ: [], contacts: [], rel: [['Where met', 'Not recorded']] };
  if (has(d.overview)) ai.overview = d.overview.trim();
  if (d.diffs.length) ai.diffs = d.diffs.filter(has).slice(0, 3);
  if (has(d.risk)) ai.risk = d.risk.trim();
  if (has(d.seeking)) ai.seeking = d.seeking.trim();
  if (has(d.timing)) ai.timing = d.timing.trim();
  if (d.pipeline.length) ai.pipe = d.pipeline.map(p => [p.code, p.description, Math.max(0, STG10.indexOf(p.stage)), p.catalyst || '—']);
  if (d.economics.length) ai.econ = d.economics.map(e => [e.label, e.value]);
  if (d.contacts.length) ai.contacts = d.contacts.map(x => [x.name, x.role]);
  const rel = new Map(ai.rel);
  if (has(d.whereMet)) rel.set('Where met', d.whereMet.trim());
  if (has(d.nextStep)) rel.set('Next step', d.nextStep.trim());
  ai.rel = [...rel.entries()];
  c.ai = ai;

  if (buyer) {
    const bb = c.buyBox || emptyBuyBox(kind as 'pharma' | 'investor');
    if (d.buyBox) {
      const lo = Math.max(0, Math.min(4, Math.round(d.buyBox.stStart))), hi = Math.max(lo, Math.min(4, Math.round(d.buyBox.stEnd)));
      Object.assign(bb, { inds: d.buyBox.inds, mods: d.buyBox.mods, st: [lo, hi], geo: d.buyBox.geo.filter(g => (TER as readonly string[]).includes(g)), deals: d.buyBox.deals, excl: d.buyBox.excl, money: d.buyBox.money.map(m => [m.label, m.value]) });
      if (has(d.buyBox.contact)) bb.contact = d.buyBox.contact.trim();
    }
    if (has(d.whereMet)) bb.whereMet = d.whereMet.trim();
    c.buyBox = bb;
  }

  // Notes: add the imported ones, skipping any already logged with the same date and text.
  const seen = new Set(c.notes.map(n => n.date + '|' + n.text.trim()));
  const added: Note[] = [];
  const stamp: Note = { id: uid(), date: today, type: 'Note', text: existing ? 'Profile updated from an imported document.' : 'Added to BirdNest from an imported document.', priv: false };
  for (const n of d.notes) {
    const date = has(n.date) && /^\d{4}-\d{2}-\d{2}$/.test(n.date) ? n.date : today;
    const key = date + '|' + n.text.trim();
    if (!n.text.trim() || seen.has(key)) continue;
    seen.add(key);
    added.push({ id: uid(), date, type: n.type, text: n.text.trim(), priv: !!n.private });
  }
  c.notes = [stamp, ...added, ...c.notes];

  if (!existing) {
    if (ctx.lonLat) { c.lon = ctx.lonLat[0] + (Math.random() - 0.5) * 1.5; c.lat = ctx.lonLat[1] + (Math.random() - 0.5) * 1.5; }
    c.fit = calcFit(c, settings); c.prevFit = c.fit;
    c.dec = d.decision || decisionFor(c.fit);
  } else if (d.decision) c.dec = d.decision;
  return c;
}

/** Indications in the drafts that are not yet on a picklist, grouped by the segment they will join. */
export function newIndications(drafts: Draft[], settings: Settings): { post: string[]; ant: string[] } {
  const post: string[] = [], ant: string[] = [];
  for (const d of drafts) {
    const i = (d.ind || '').trim();
    if (!i || settings.post.includes(i) || settings.ant.includes(i) || post.includes(i) || ant.includes(i)) continue;
    (d.seg === 'Anterior' ? ant : post).push(i);
  }
  return { post, ant };
}
