import { MODS, MODK, TER } from './constants';
import { isBuyer } from './derive';
import type { BuyBox, Company, Intro } from './types';

export const stageOf = (d: Pick<Company, 'type' | 'phase'>): number =>
  d.type === 'Device'
    ? ({ Pilot: 1, Pivotal: 3, 'Post-market': 4 } as Record<string, number>)[d.phase] ?? 1
    : ({ Preclinical: 0, 'Phase 1': 1, 'Phase 2': 2, 'Phase 3': 3, 'Phase 4': 4 } as Record<string, number>)[d.phase] ?? 0;

export const modOf = (d: Pick<Company, 'asset' | 'type'>): string[] => {
  const a = (d.asset + ' ' + (d.type === 'Device' ? 'device' : '')).toLowerCase();
  return MODS.filter(m => MODK[m].some(k => a.includes(k)));
};

export interface MatchResult {
  chk: Record<string, number>;
  w: Record<string, number>;
  score: number;
}

export function matchScore(bio: Company, buyer: Company, post: string[], ant: string[]): MatchResult {
  const B: BuyBox | null = buyer.buyBox;
  if (!B) return { chk: {}, w: {}, score: 0 };
  const sx = stageOf(bio), mods = modOf(bio), inv = buyer.kind === 'investor';
  const chk: Record<string, number> = {
    ind: B.inds.includes(bio.ind)
      ? 1
      : (B.inds.some(i => post.includes(i)) && post.includes(bio.ind)) || (B.inds.some(i => ant.includes(i)) && ant.includes(bio.ind))
        ? 0.5
        : 0,
    mod: mods.some(m => B.mods.includes(m)) ? 1 : 0,
    st: sx >= B.st[0] && sx <= B.st[1] ? 1 : sx === B.st[0] - 1 || sx === B.st[1] + 1 ? 0.5 : 0,
  };
  if (!inv) chk.geo = !B.geo.length ? 1 : B.geo.every(g => bio.rightsArr[TER.indexOf(g as (typeof TER)[number])]) ? 1 : B.geo.some(g => bio.rightsArr[TER.indexOf(g as (typeof TER)[number])]) ? 0.5 : 0;
  const w: Record<string, number> = inv ? { ind: 40, mod: 20, st: 40 } : { ind: 35, mod: 20, st: 25, geo: 20 };
  return { chk, w, score: Math.round(Object.keys(w).reduce((a, k) => a + chk[k] * w[k], 0)) };
}

export const introsFor = (d: Company, intros: Intro[]) => (isBuyer(d) ? intros.filter(x => x.buyerId === d.id) : intros.filter(x => x.sellerId === d.id));
export const otherParty = (d: Company, x: Intro, all: Company[]) => all.find(y => y.id === (isBuyer(d) ? x.sellerId : x.buyerId));

export interface Candidate { c: Company; m: MatchResult; done: boolean }

export function candidates(d: Company, all: Company[], intros: Intro[], post: string[], ant: string[]): Candidate[] {
  const done = new Set(introsFor(d, intros).map(x => (isBuyer(d) ? x.sellerId : x.buyerId)));
  const pool = isBuyer(d) ? all.filter(x => !isBuyer(x)) : all.filter(isBuyer);
  return pool
    .map(c => ({ c, m: isBuyer(d) ? matchScore(c, d, post, ant) : matchScore(d, c, post, ant), done: done.has(c.id) }))
    .sort((a, b) => b.m.score - a.m.score);
}

export const emptyBuyBox = (kind: 'pharma' | 'investor'): BuyBox => ({
  inds: [], mods: [], st: kind === 'investor' ? [0, 2] : [1, 3], geo: [], deals: [], excl: [], money: [], contact: '', whereMet: '',
});
