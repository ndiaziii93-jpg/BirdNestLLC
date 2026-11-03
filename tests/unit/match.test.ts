import { describe, expect, it } from 'vitest';
import { candidates, matchScore, modOf, stageOf } from '@/lib/match';
import { baseMatch, defaultFilters, PHASE_ALL } from '@/lib/filters';
import { buildSample } from '@/lib/sample';
import { DEFAULT_ANT, DEFAULT_POST } from '@/lib/constants';

const { companies, intros } = buildSample('2026-10-19');
const by = (name: string) => companies.find(c => c.name === name)!;

describe('buyer matching', () => {
  it('scores Lumen Ocular as a full match for Aldren Pharma', () => {
    const m = matchScore(by('Lumen Ocular'), by('Aldren Pharma'), DEFAULT_POST, DEFAULT_ANT);
    expect(m.score).toBe(100);
    expect(m.chk).toEqual({ ind: 1, mod: 1, st: 1, geo: 1 });
  });
  it('uses the investor weights without a rights check', () => {
    const m = matchScore(by('Lumen Ocular'), by('Fjordline Ventures'), DEFAULT_POST, DEFAULT_ANT);
    expect(m.w).toEqual({ ind: 40, mod: 20, st: 40 });
    expect(m.chk.geo).toBeUndefined();
  });
  it('excludes companies already introduced from the open candidates', () => {
    const C = candidates(by('Aldren Pharma'), companies, intros, DEFAULT_POST, DEFAULT_ANT);
    expect(C.find(x => x.c.name === 'Lumen Ocular')?.done).toBe(true);
    expect(C.find(x => x.c.name === 'Halden Therapeutics')?.done).toBe(false);
    expect(C.every(x => x.c.kind === 'seeking')).toBe(true);
  });
  it('derives modality and stage from the asset line', () => {
    expect(modOf(by('Lumen Ocular'))).toEqual(['AAV / gene therapy']);
    expect(stageOf(by('Lumen Ocular'))).toBe(1);
    expect(stageOf(by('Eskil Bio'))).toBe(4);
  });
});

describe('dashboard filters', () => {
  it('combines region, type and phase with AND', () => {
    const st = { ...defaultFilters(), region: 'Europe' as const, type: 'Drug' as const, phases: { ...PHASE_ALL(), Drug: [1, 2] as [number, number] } };
    const res = companies.filter(d => baseMatch(d, st));
    expect(res.length).toBeGreaterThan(0);
    expect(res.every(d => d.region === 'Europe' && d.type === 'Drug' && ['Phase 1', 'Phase 2'].includes(d.phase))).toBe(true);
  });
  it('treats indication toggles as exclusions', () => {
    const st = { ...defaultFilters(), inds: new Set(['IRDs']) };
    expect(companies.filter(d => baseMatch(d, st)).some(d => d.ind === 'IRDs')).toBe(false);
  });
});
