import { NextResponse } from 'next/server';
import { guard } from '../_guard';
import { upsertIntro } from '@/lib/repo';
import type { Intro } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const g = await guard(); if (g) return g;
  const x = (await req.json()) as Intro;
  if (!x.buyerId || !x.sellerId) return NextResponse.json({ error: 'buyerId and sellerId are required' }, { status: 400 });
  await upsertIntro(x);
  return new NextResponse(null, { status: 204 });
}
