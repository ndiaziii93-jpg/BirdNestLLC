import { NextResponse } from 'next/server';
import { guard } from '../_guard';
import { upsertCompany } from '@/lib/repo';
import type { Company } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const g = await guard(); if (g) return g;
  const c = (await req.json()) as Company;
  if (!c || !c.id || !c.name) return NextResponse.json({ error: 'id and name are required' }, { status: 400 });
  const saved = await upsertCompany(c);
  return NextResponse.json(saved);
}
