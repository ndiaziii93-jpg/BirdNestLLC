import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { guard } from '../_guard';

export const dynamic = 'force-dynamic';

/**
 * Stores a logo in the Supabase Storage bucket and returns its public URL.
 * Body: { companyId, dataUrl } (an uploaded image) or { companyId, url } (a fetched favicon to copy).
 * Falls back to returning the data URL unchanged when storage is not configured.
 */
export async function POST(req: Request) {
  const g = await guard(); if (g) return g;
  const { companyId, dataUrl, url } = (await req.json()) as { companyId: string; dataUrl?: string; url?: string };
  if (!companyId) return NextResponse.json({ error: 'companyId required' }, { status: 400 });

  let bytes: Buffer, type = 'image/png';
  if (dataUrl) {
    const m = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
    if (!m) return NextResponse.json({ error: 'bad data url' }, { status: 400 });
    type = m[1]; bytes = Buffer.from(m[2], 'base64');
  } else if (url) {
    const r = await fetch(url);
    if (!r.ok) return NextResponse.json({ error: 'fetch failed' }, { status: 502 });
    type = r.headers.get('content-type')?.split(';')[0] || 'image/png';
    bytes = Buffer.from(await r.arrayBuffer());
  } else return NextResponse.json({ error: 'dataUrl or url required' }, { status: 400 });
  if (bytes.length > 2_000_000) return NextResponse.json({ error: 'Logo must be under 2 MB' }, { status: 413 });

  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY, bucket = process.env.SUPABASE_LOGO_BUCKET || 'logos';
  if (!sbUrl || !key) {
    // No storage configured: keep the image inline.
    return NextResponse.json({ logo: `data:${type};base64,${bytes.toString('base64')}` });
  }
  const sb = createClient(sbUrl, key, { auth: { persistSession: false } });
  const ext = type.includes('svg') ? 'svg' : type.includes('jpeg') ? 'jpg' : type.includes('webp') ? 'webp' : type.includes('x-icon') || type.includes('ico') ? 'ico' : 'png';
  const path = `${companyId}/${Date.now()}.${ext}`;
  const { error } = await sb.storage.from(bucket).upload(path, bytes, { contentType: type, upsert: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const { data } = sb.storage.from(bucket).getPublicUrl(path);
  return NextResponse.json({ logo: data.publicUrl });
}
