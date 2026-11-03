import { describe, expect, it } from 'vitest';
import { calcFitFrom, completeness, decisionFor, rebalance } from '@/lib/fit';
import { DEF_W } from '@/lib/constants';
import { buildSample } from '@/lib/sample';

describe('fit scoring', () => {
  it('is the weighted sum of score/5 × weight, rounded', () => {
    expect(calcFitFrom([5, 5, 5, 5, 5, 5], DEF_W)).toBe(100);
    expect(calcFitFrom([1, 1, 1, 1, 1, 1], DEF_W)).toBe(20);
    expect(calcFitFrom([5, 4, 3, 4, 4, 4], DEF_W)).toBe(82); // Lumen Ocular
  });
  it('maps fit to the decision rule', () => {
    expect(decisionFor(76)).toBe('Pursue');
    expect(decisionFor(75)).toBe('Watch');
    expect(decisionFor(50)).toBe('Watch');
    expect(decisionFor(49)).toBe('Pass');
  });
});

describe('weight rebalancing', () => {
  it('keeps the total at 100 and moves in steps of 5', () => {
    const w = rebalance(DEF_W, 0, 40);
    expect(w.reduce((a, b) => a + b, 0)).toBe(100);
    expect(w[0]).toBe(40);
    expect(w.every(x => x % 5 === 0)).toBe(true);
  });
  it('caps a single weight at 50 and never goes below 0', () => {
    const up = rebalance(DEF_W, 0, 90);
    expect(up[0]).toBe(50);
    expect(up.reduce((a, b) => a + b, 0)).toBe(100);
    const down = rebalance(DEF_W, 5, -20);
    expect(down[5]).toBe(0);
    expect(down.reduce((a, b) => a + b, 0)).toBe(100);
  });
  it('takes weight from the largest others first when raising', () => {
    const w = rebalance([25, 20, 15, 15, 15, 10], 5, 20);
    expect(w).toEqual([15, 20, 15, 15, 15, 20]);
  });
});

describe('sample data', () => {
  const { companies, intros } = buildSample('2026-10-19');
  it('reproduces the prototype dataset', () => {
    expect(companies).toHaveLength(60);
    expect(intros).toHaveLength(7);
    const top = [...companies].sort((a, b) => b.fit - a.fit).slice(0, 4).map(c => `${c.name} ${c.fit}`);
    expect(top).toEqual(['Eskil Bio 84', 'Aldren Pharma 83', 'Tidewater Life Sciences 83', 'Lumen Ocular 82']);
  });
  it('gives Lumen Ocular its five notes with one private entry', () => {
    const s0 = companies.find(c => c.id === 's0')!;
    expect(s0.notes).toHaveLength(5);
    expect(s0.notes.filter(n => n.priv)).toHaveLength(1);
    expect(s0.notes.map(n => n.date)).toEqual(['2026-10-13', '2026-10-02', '2026-09-24', '2026-09-18', '2026-09-12']);
    expect(completeness(s0)).toBe(100);
  });
  it('gives every pharma and investor a buy box', () => {
    const buyers = companies.filter(c => c.kind !== 'seeking');
    expect(buyers).toHaveLength(10);
    expect(buyers.every(b => b.buyBox && b.buyBox.inds.length > 0)).toBe(true);
  });
});
