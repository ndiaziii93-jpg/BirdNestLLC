import { NextResponse } from 'next/server';
import { guard, handle } from '../../_guard';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/** Bulk fit update after weights change: [{id, prevFit, fit}] */
export const POST = handle(async (req: Request) => {
  const g = await guard(); if (g) return g;
  const rows = (await req.json()) as { id: string; prevFit: number; fit: number }[];
  await prisma.$transaction(rows.map(r => prisma.company.update({ where: { id: r.id }, data: { prevFit: r.prevFit, fit: r.fit } })));
  return new NextResponse(null, { status: 204 });
});
