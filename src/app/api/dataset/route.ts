import { NextResponse } from 'next/server';
import { guard } from '../_guard';
import { loadDataset } from '@/lib/repo';

export const dynamic = 'force-dynamic';

/** Whole dataset as JSON: companies with notes, introductions and settings. */
export async function GET() {
  const g = await guard(); if (g) return g;
  return NextResponse.json(await loadDataset());
}
