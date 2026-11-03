import { DEF_W, DEF_SVC_W, SC_DEFAULT, SVC_DEFAULT } from './constants';
import type { Company, Decision, Settings } from './types';

/** Weighted sum of 1–5 scores, scaled to 100. */
export function calcFitFrom(scores: number[], weights: number[]): number {
  return Math.round(scores.reduce((a, v, i) => a + (v / 5) * (weights[i] ?? 0), 0));
}

/** Fit for a company under its own lens. */
export function calcFit(c: Pick<Company, 'lens' | 'scores' | 'svcScores'>, s: Pick<Settings, 'weights' | 'svcWeights'>): number {
  return c.lens === 'services' ? calcFitFrom(c.svcScores, s.svcWeights) : calcFitFrom(c.scores, s.weights);
}

export function decisionFor(fit: number): Decision {
  return fit >= 76 ? 'Pursue' : fit >= 50 ? 'Watch' : 'Pass';
}

/** Criteria rows for a lens: [name, weight, hint]. */
export function criteria(lens: 'partnering' | 'services', s: Settings): [string, number, string][] {
  return lens === 'services'
    ? SVC_DEFAULT.map((x, i) => [x[0], s.svcWeights[i] ?? x[1], x[2]])
    : SC_DEFAULT.map((x, i) => [x[0], s.weights[i] ?? x[1], x[2]]);
}

export const COMP_F: (keyof Company)[] = ['name', 'website', 'city', 'cdisp', 'own', 'founded', 'heads', 'asset', 'ind', 'phase', 'cat', 'raise', 'runway', 'rationale'];

export function completeness(d: Company): number {
  const why = d.lens === 'services' ? d.svcWhy : d.why;
  const f = COMP_F.filter(k => String(d[k] ?? '').trim()).length + why.filter(w => w && w.trim()).length;
  return Math.round((f / (COMP_F.length + why.length)) * 100);
}

/**
 * Move weight i to v (clamped 0–50, steps of 5) and rebalance the others so the total stays 100.
 * Mirrors the prototype: the deficit is spread 5 at a time, starting with the smallest
 * (when adding) or largest (when removing) other weight.
 */
export function rebalance(weights: number[], i: number, v: number): number[] {
  const w = [...weights];
  v = Math.max(0, Math.min(50, Math.round(v / 5) * 5 || 0));
  let rem = w[i] - v;
  w[i] = v;
  const others = w.map((_, k) => k).filter(k => k !== i);
  let guard = 200;
  while (rem !== 0 && guard--) {
    const step = rem > 0 ? 5 : -5;
    const order = others.filter(k => (step > 0 ? w[k] < 50 : w[k] > 0)).sort((a, b) => (step > 0 ? w[a] - w[b] : w[b] - w[a]));
    if (!order.length) { w[i] += rem; rem = 0; break; }
    w[order[0]] += step;
    rem -= step;
  }
  return w;
}

export const defaultSettings = (): Settings => ({
  weights: [...DEF_W],
  svcWeights: [...DEF_SVC_W],
  post: [],
  ant: [],
  met: [],
});
