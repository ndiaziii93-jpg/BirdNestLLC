import { NextResponse } from 'next/server';
import { isPublicUrl, storeLogo } from '@/lib/logo';
import { guard, handle } from '../_guard';

export const dynamic = 'force-dynamic';

/**
 * Stores a logo in the Supabase Storage bucket and returns its public URL.
 * Body: { companyId, dataUrl } (an uploaded image) or { companyId, url } (a fetched favicon to copy).
 * Without storage configured, the image is kept inline as a data URL.
 */
export const POST = handle(async (req: Request) => {
  const g = await guard(); if (g) return g;
  const { companyId, dataUrl, url } = (await req.json()) as { companyId: string; dataUrl?: string; url?: string };
  if (!companyId) return NextResponse.json({ error: 'companyId required' }, { status: 400 });

  let bytes: Buffer, type = 'image/png';
  if (dataUrl) {
    const m = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
    if (!m) return NextResponse.json({ error: 'bad data url' }, { status: 400 });
    type = m[1]; bytes = Buffer.from(m[2], 'base64');
  } else if (url) {
    if (!isPublicUrl(url)) return NextResponse.json({ error: 'That address cannot be used.' }, { status: 400 });
    const r = await fetch(url, { signal: AbortSignal.timeout(7000) });
    if (!r.ok) return NextResponse.json({ error: 'fetch failed' }, { status: 502 });
    type = r.headers.get('content-type')?.split(';')[0] || 'image/png';
    bytes = Buffer.from(await r.arrayBuffer());
  } else return NextResponse.json({ error: 'dataUrl or url required' }, { status: 400 });
  if (bytes.length > 2_000_000) return NextResponse.json({ error: 'Logo must be under 2 MB' }, { status: 413 });

  return NextResponse.json({ logo: await storeLogo(companyId, bytes, type) });
});
