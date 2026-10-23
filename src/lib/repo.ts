// Server-side data access. Maps Prisma rows to the Company / Intro / Settings shapes the UI uses.
import type { Prisma } from '@prisma/client';
import { DEFAULT_ANT, DEFAULT_MET, DEFAULT_POST, DEF_SVC_W, DEF_W } from './constants';
import { toISO } from './dates';
import { prisma } from './db';
import type { Company, Dataset, Intro, Settings } from './types';

type Row = Prisma.CompanyGetPayload<{ include: { notes: true } }>;

const arr = <T,>(v: unknown, fallback: T[]): T[] => (Array.isArray(v) ? (v as T[]) : fallback);

export function rowToCompany(r: Row): Company {
  return {
    id: r.id, kind: r.kind as Company['kind'], name: r.name, website: r.website, city: r.city, cdisp: r.cdisp, country: r.country, region: r.region as Company['region'],
    lat: r.lat, lon: r.lon, type: r.type as Company['type'], seg: r.seg as Company['seg'], ind: r.ind, asset: r.asset, phase: r.phase, phaseLabel: r.phaseLabel,
    trend: r.trend, dec: r.dec as Company['dec'], deal: r.deal, cat: r.cat, runway: r.runway, runwayAsOf: r.runwayAsOf ? toISO(r.runwayAsOf) : null, raise: r.raise,
    rightsArr: arr<boolean>(r.rightsArr, [true, true, true, true, true, true]), own: r.own, founded: r.founded, heads: r.heads, rationale: r.rationale,
    scores: arr<number>(r.scores, [3, 3, 3, 3, 3, 3]), why: arr<string>(r.why, ['', '', '', '', '', '']), svcScores: arr<number>(r.svcScores, [3, 3, 3, 3, 3]), svcWhy: arr<string>(r.svcWhy, ['', '', '', '', '']),
    prevFit: r.prevFit, fit: r.fit, logo: r.logo, appetite: r.appetite, scale: r.scale, lens: r.lens as Company['lens'],
    ai: (r.ai as unknown as Company['ai']) ?? null, buyBox: (r.buyBox as unknown as Company['buyBox']) ?? null,
    notes: r.notes.map(n => ({ id: n.id, date: toISO(n.date), type: n.type as Company['notes'][number]['type'], text: n.text, priv: n.priv })),
    sample: r.sample,
  };
}

export function companyToRow(c: Company): Omit<Prisma.CompanyUncheckedCreateInput, 'notes'> {
  return {
    id: c.id, kind: c.kind, name: c.name, website: c.website, city: c.city, cdisp: c.cdisp, country: c.country, region: c.region, lat: c.lat, lon: c.lon,
    type: c.type, seg: c.seg, ind: c.ind, asset: c.asset, phase: c.phase, phaseLabel: c.phaseLabel, trend: c.trend, dec: c.dec, deal: c.deal, cat: c.cat,
    runway: c.runway, runwayAsOf: c.runwayAsOf ? new Date(c.runwayAsOf + 'T00:00:00Z') : null, raise: c.raise, rightsArr: c.rightsArr, own: c.own, founded: c.founded, heads: c.heads,
    rationale: c.rationale, scores: c.scores, why: c.why, svcScores: c.svcScores, svcWhy: c.svcWhy, prevFit: c.prevFit, fit: c.fit, logo: c.logo, appetite: c.appetite, scale: c.scale,
    lens: c.lens, ai: (c.ai ?? undefined) as Prisma.InputJsonValue | undefined, buyBox: (c.buyBox ?? undefined) as Prisma.InputJsonValue | undefined, sample: c.sample,
  };
}

export async function loadSettings(): Promise<Settings> {
  const rows = await prisma.setting.findMany();
  const get = <T,>(k: string, d: T): T => { const r = rows.find(x => x.key === k); return r ? (r.value as T) : d; };
  return {
    weights: get('weights', [...DEF_W]),
    svcWeights: get('svcWeights', [...DEF_SVC_W]),
    post: get('post', [...DEFAULT_POST]),
    ant: get('ant', [...DEFAULT_ANT]),
    met: get('met', [...DEFAULT_MET]),
  };
}

export async function saveSetting(key: keyof Settings, value: unknown) {
  await prisma.setting.upsert({ where: { key }, update: { value: value as Prisma.InputJsonValue }, create: { key, value: value as Prisma.InputJsonValue } });
}

export async function loadDataset(): Promise<Dataset> {
  const [rows, intros, settings] = await Promise.all([
    prisma.company.findMany({ include: { notes: { orderBy: { date: 'desc' } } }, orderBy: { createdAt: 'asc' } }),
    prisma.intro.findMany(),
    loadSettings(),
  ]);
  return {
    companies: rows.map(rowToCompany),
    intros: intros.map((x): Intro => ({ id: x.id, buyerId: x.buyerId, sellerId: x.sellerId, date: toISO(x.date), status: x.status as Intro['status'], note: x.note })),
    settings,
  };
}

/** Insert or replace a whole company (fields + notes). */
export async function upsertCompany(c: Company): Promise<Company> {
  const row = companyToRow(c);
  const saved = await prisma.$transaction(async tx => {
    await tx.company.upsert({ where: { id: c.id }, update: row, create: row });
    await tx.note.deleteMany({ where: { companyId: c.id, id: { notIn: c.notes.map(n => n.id) } } });
    for (const n of c.notes) {
      const data = { companyId: c.id, date: new Date(n.date + 'T00:00:00Z'), type: n.type, text: n.text, priv: n.priv };
      await tx.note.upsert({ where: { id: n.id }, update: data, create: { id: n.id, ...data } });
    }
    return tx.company.findUniqueOrThrow({ where: { id: c.id }, include: { notes: { orderBy: { date: 'desc' } } } });
  });
  return rowToCompany(saved);
}

export async function upsertIntro(x: Intro) {
  const data = { buyerId: x.buyerId, sellerId: x.sellerId, date: new Date(x.date + 'T00:00:00Z'), status: x.status, note: x.note };
  await prisma.intro.upsert({ where: { buyerId_sellerId: { buyerId: x.buyerId, sellerId: x.sellerId } }, update: data, create: { id: x.id, ...data } });
}
