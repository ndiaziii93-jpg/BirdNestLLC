// Finding a company's logo: read its website, collect the images that look like a logo, let Claude
// pick the official one (falling back to a simple ranking without a key), and store it.
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { client, hasKey, MODEL, searchAndAnswer, structure, textOf, zodOutputFormat } from './claude';
import type Anthropic from '@anthropic-ai/sdk';

export type Kind = 'logo-img' | 'apple-touch-icon' | 'icon' | 'og-image' | 'favicon';
export interface Candidate { url: string; kind: Kind; alt: string; score: number }
export interface Fetched extends Candidate { bytes: Buffer; type: string }

const UA = 'Mozilla/5.0 (compatible; BirdNestHub/1.0; logo lookup)';
const MAX_BYTES = 1_500_000;

/** Normalise a website value ("example.com", "https://www.example.com/team") to an https origin URL. */
export function siteUrl(w: string | null | undefined): string | null {
  if (!w || !w.trim()) return null;
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(w.trim()) && !/^https?:\/\//i.test(w.trim())) return null;
  try { const u = new URL(/^https?:\/\//i.test(w.trim()) ? w.trim() : 'https://' + w.trim()); return u.protocol === 'http:' || u.protocol === 'https:' ? u.origin + '/' : null; } catch { return null; }
}

/** Refuse addresses that point inside a private network. */
export function isPublicUrl(u: string, allowPrivate = false): boolean {
  let url: URL;
  try { url = new URL(u); } catch { return false; }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
  if (allowPrivate) return true;
  const h = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (h === 'localhost' || h.endsWith('.local') || h.endsWith('.internal') || h === '::1' || h === '0.0.0.0') return false;
  if (/^(10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h)) return false;
  if (/^(fc|fd|fe80)/.test(h) && h.includes(':')) return false;
  return true;
}

const attrs = (tag: string): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const m of tag.matchAll(/([a-zA-Z_:-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>"']+))/g)) out[m[1].toLowerCase()] = (m[3] ?? m[4] ?? m[5] ?? '').trim();
  return out;
};
const abs = (href: string, base: string) => { try { return new URL(href.replace(/&amp;/g, '&'), base).toString(); } catch { return null; } };

/** Logo candidates on a page, best guesses first. */
export function extractCandidates(html: string, base: string): Candidate[] {
  const seen = new Set<string>(), out: Candidate[] = [];
  const add = (href: string | undefined, kind: Kind, alt: string, score: number) => {
    if (!href || href.startsWith('data:')) return;
    const u = abs(href, base);
    if (!u || seen.has(u)) return;
    seen.add(u);
    out.push({ url: u, kind, alt: alt.slice(0, 120), score });
  };
  for (const m of html.matchAll(/<(link|meta|img)\b[^>]*>/gi)) {
    const tag = m[1].toLowerCase(), a = attrs(m[0]);
    if (tag === 'link') {
      const rel = (a.rel || '').toLowerCase();
      const size = parseInt((a.sizes || '').split('x')[0], 10) || 0;
      if (rel.includes('apple-touch-icon')) add(a.href, 'apple-touch-icon', 'App icon', 70 + Math.min(size, 512) / 32);
      else if (/\bicon\b/.test(rel)) add(a.href, 'icon', 'Site icon', (a.type || a.href || '').includes('svg') ? 55 : 30 + Math.min(size, 512) / 32);
    } else if (tag === 'meta') {
      const key = (a.property || a.name || '').toLowerCase();
      if (key === 'og:logo') add(a.content, 'logo-img', 'Declared logo', 95);
      else if (key === 'og:image' || key === 'twitter:image') add(a.content, 'og-image', 'Sharing image', 35);
    } else {
      const src = a.src || a['data-src'] || a['data-lazy-src'];
      const hay = `${src || ''} ${a.alt || ''} ${a.class || ''} ${a.id || ''}`.toLowerCase();
      if (/logo|brand|wordmark/.test(hay)) add(src, 'logo-img', a.alt || 'Logo image', /\.svg(\?|$)/i.test(src || '') ? 92 : 88);
    }
  }
  // Fallbacks every site has in some form.
  try {
    const origin = new URL(base).origin;
    add(origin + '/apple-touch-icon.png', 'apple-touch-icon', 'App icon (standard path)', 60);
    add(origin + '/favicon.ico', 'favicon', 'Favicon', 15);
    add(`https://www.google.com/s2/favicons?domain=${new URL(base).hostname}&sz=256`, 'favicon', 'Favicon via Google', 12);
  } catch { /* no fallbacks for a bad base */ }
  return out.sort((x, y) => y.score - x.score);
}

async function get(url: string, allowPrivate: boolean): Promise<Response | null> {
  if (!isPublicUrl(url, allowPrivate)) return null;
  try { return await fetch(url, { headers: { 'user-agent': UA, accept: '*/*' }, redirect: 'follow', signal: AbortSignal.timeout(7000) }); } catch { return null; }
}

/** Downloads a candidate when it is a real image of a sensible size. */
export async function fetchImage(c: Candidate, allowPrivate = false): Promise<Fetched | null> {
  const r = await get(c.url, allowPrivate);
  if (!r || !r.ok) return null;
  let type = (r.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (!type.startsWith('image/')) {
    if (/\.svg(\?|$)/i.test(c.url) && type.includes('xml')) type = 'image/svg+xml';
    else if (/\.ico(\?|$)/i.test(c.url)) type = 'image/x-icon';
    else return null;
  }
  const bytes = Buffer.from(await r.arrayBuffer());
  if (bytes.length < 100 || bytes.length > MAX_BYTES) return null;
  return { ...c, bytes, type };
}

const VISIBLE = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp']);

const Pick = z.object({ choice: z.number().nullable(), confidence: z.enum(['high', 'medium', 'low']), reason: z.string() });

/** Claude looks at the candidates and names the official logo, or none. */
async function claudePick(name: string, site: string, cands: Fetched[]): Promise<{ index: number | null; confidence: string; reason: string }> {
  const content: Anthropic.ContentBlockParam[] = [{ type: 'text', text: `Company: ${name}\nWebsite: ${site}\n\nThese images were found on the company's website. Which one is the company's own official logo, the one to show next to its name in a company list?` }];
  cands.forEach((c, i) => {
    content.push({ type: 'text', text: `Candidate ${i}: ${c.kind} · ${c.alt} · ${c.url}` });
    if (VISIBLE.has(c.type)) content.push({ type: 'image', source: { type: 'base64', media_type: c.type as 'image/png', data: c.bytes.toString('base64') } });
    else content.push({ type: 'text', text: c.type === 'image/svg+xml' ? '(SVG file; judge from its address and description)' : '(icon file; judge from its address)' });
  });
  content.push({ type: 'text', text: 'Rules: choose the company\'s own logo or logo mark. Never choose a photo, a partner or investor logo, a social-media icon, an award badge or a generic graphic. Between a full logo and a small favicon of the same brand, prefer the full logo if it is legible at small size. If none is the company\'s logo, answer null. Give choice as the candidate number.' });
  const res = await client().messages.parse({ model: MODEL, max_tokens: 2000, messages: [{ role: 'user', content }], output_config: { format: zodOutputFormat(Pick) } });
  const p = res.parsed_output;
  if (!p) throw new Error('no structured output');
  const index = p.choice != null && Number.isInteger(p.choice) && p.choice >= 0 && p.choice < cands.length ? p.choice : null;
  return { index, confidence: p.confidence, reason: p.reason };
}

/** The company's website, found with a web search when the profile has none. */
export async function findWebsite(name: string, city: string, country: string): Promise<string | null> {
  if (!hasKey()) return null;
  const msg = await searchAndAnswer('You find the official website of companies. Answer with the domain only, or "unknown". Public information only.', `What is the official website of the company "${name}"${city || country ? `, based in ${[city, country].filter(Boolean).join(', ')}` : ''}? It works in ophthalmology, pharma or life-science investing.`, 3);
  const r = await structure(z.object({ website: z.string().nullable() }), 'Extract the official website domain of the company from the answer below, or null when unknown.', textOf(msg));
  return siteUrl(r.website);
}

/** Stores image bytes in the Supabase logo bucket and returns the public address (or an inline image without storage). */
export async function storeLogo(companyId: string, bytes: Buffer, type: string): Promise<string> {
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY, bucket = process.env.SUPABASE_LOGO_BUCKET || 'logos';
  if (!sbUrl || !key) return `data:${type};base64,${bytes.toString('base64')}`;
  const sb = createClient(sbUrl, key, { auth: { persistSession: false } });
  const ext = type.includes('svg') ? 'svg' : type.includes('jpeg') ? 'jpg' : type.includes('webp') ? 'webp' : type.includes('gif') ? 'gif' : type.includes('icon') ? 'ico' : 'png';
  const path = `${companyId}/${Date.now()}.${ext}`;
  const { error } = await sb.storage.from(bucket).upload(path, bytes, { contentType: type, upsert: true });
  if (error) throw new Error('Could not store the logo: ' + error.message);
  return sb.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

export interface FindInput { companyId: string; name: string; website?: string | null; city?: string; country?: string; exclude?: string[]; allowPrivate?: boolean }
export type FindResult =
  | { ok: true; logo: string; origin: string; website: string; method: 'claude' | 'ranking'; confidence: string; reason: string }
  | { ok: false; website: string | null; reason: string };

export async function findLogo(input: FindInput): Promise<FindResult> {
  const allowPrivate = !!input.allowPrivate;
  let site = siteUrl(input.website);
  if (!site) site = await findWebsite(input.name, input.city || '', input.country || '').catch(() => null);
  if (!site) return { ok: false, website: null, reason: input.website ? 'The website address is not valid.' : 'No website on the profile, and none was found.' };

  const page = await get(site, allowPrivate);
  const base = page?.url || site;
  const html = page && page.ok && (page.headers.get('content-type') || '').includes('html') ? (await page.text()).slice(0, 2_000_000) : '';
  const exclude = new Set(input.exclude || []);
  const cands = extractCandidates(html, base).filter(c => !exclude.has(c.url));

  const fetched: Fetched[] = [];
  for (const c of cands) {
    if (fetched.length >= 8) break;
    const f = await fetchImage(c, allowPrivate);
    if (f) fetched.push(f);
  }
  if (!fetched.length) return { ok: false, website: site, reason: exclude.size ? `No other logo found on ${new URL(site).hostname}.` : `No logo found on ${new URL(site).hostname}.` };

  let pick: Fetched | null = null, method: 'claude' | 'ranking' = 'ranking', confidence = 'low', reason = 'Best-ranked image on the site.';
  if (hasKey()) {
    try {
      const r = await claudePick(input.name, site, fetched);
      method = 'claude'; confidence = r.confidence; reason = r.reason;
      if (r.index == null) return { ok: false, website: site, reason: 'Claude found no logo among the images on the site. ' + r.reason };
      pick = fetched[r.index];
    } catch { /* fall back to the ranking below */ }
  }
  if (!pick) pick = fetched[0];
  const logo = await storeLogo(input.companyId, pick.bytes, pick.type);
  return { ok: true, logo, origin: pick.url, website: site, method, confidence, reason };
}
