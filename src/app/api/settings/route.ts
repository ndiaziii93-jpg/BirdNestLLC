import { NextResponse } from 'next/server';
import { guard } from '../_guard';
import { saveSetting } from '@/lib/repo';

export const dynamic = 'force-dynamic';
const KEYS = ['weights', 'svcWeights', 'post', 'ant', 'met'];

export async function POST(req: Request) {
  const g = await guard(); if (g) return g;
  const { key, value } = (await req.json()) as { key: string; value: unknown };
  if (!KEYS.includes(key) || !Array.isArray(value)) return NextResponse.json({ error: 'bad setting' }, { status: 400 });
  await saveSetting(key as 'weights', value);
  return new NextResponse(null, { status: 204 });
}
