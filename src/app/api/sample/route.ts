import { NextResponse } from 'next/server';
import { guard } from '../_guard';
import { prisma } from '@/lib/db';
import { companyToRow, loadDataset } from '@/lib/repo';
import { buildSample } from '@/lib/sample';
import { todayISO } from '@/lib/dates';

export const dynamic = 'force-dynamic';

/** Load the 60-company sample set (replacing any earlier sample rows). */
export async function POST() {
  const g = await guard(); if (g) return g;
  const { companies, intros } = buildSample(todayISO());
  await prisma.$transaction(async tx => {
    await tx.company.deleteMany({ where: { sample: true } });
    for (const c of companies) {
      await tx.company.create({ data: { ...companyToRow(c), notes: { create: c.notes.map(n => ({ id: n.id, date: new Date(n.date + 'T00:00:00Z'), type: n.type, text: n.text, priv: n.priv })) } } });
    }
    for (const x of intros) {
      await tx.intro.create({ data: { id: x.id, buyerId: x.buyerId, sellerId: x.sellerId, date: new Date(x.date + 'T00:00:00Z'), status: x.status, note: x.note } });
    }
  }, { timeout: 60000 });
  return NextResponse.json(await loadDataset());
}

/** Remove every sample row, keeping the owner's own companies. */
export async function DELETE() {
  const g = await guard(); if (g) return g;
  await prisma.company.deleteMany({ where: { sample: true } });
  return NextResponse.json(await loadDataset());
}
