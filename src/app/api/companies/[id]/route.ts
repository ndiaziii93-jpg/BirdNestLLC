import { NextResponse } from 'next/server';
import { guard } from '../../_guard';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const g = await guard(); if (g) return g;
  const { id } = await ctx.params;
  await prisma.company.delete({ where: { id } }).catch(() => null);
  return new NextResponse(null, { status: 204 });
}
