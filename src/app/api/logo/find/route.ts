import { NextResponse } from 'next/server';
import { guard, handle } from '../../_guard';
import { findLogo } from '@/lib/logo';

export const dynamic = 'force-dynamic';
export const maxDuration = 90;

/** Finds and stores a company's logo. Body: { companyId, name, website?, city?, country?, exclude? }. Saves nothing on the company itself. */
export const POST = handle(async (req: Request) => {
  const g = await guard(); if (g) return g;
  const b = (await req.json()) as { companyId?: string; name?: string; website?: string | null; city?: string; country?: string; exclude?: string[] };
  if (!b.companyId || !b.name) return NextResponse.json({ error: 'companyId and name are required' }, { status: 400 });
  const r = await findLogo({ companyId: b.companyId, name: b.name, website: b.website, city: b.city, country: b.country, exclude: Array.isArray(b.exclude) ? b.exclude.slice(0, 50) : [] });
  return NextResponse.json(r);
});
