import { DRUG_PH, DEV_PH } from './constants';

/**
 * Phase range filter, mirrored from the prototype: each type (Drug / Device) keeps an
 * inclusive [start, end] window over its own ladder; a window spanning the whole
 * ladder means "no filter".
 */
export interface PhaseState {
  Drug: [number, number];
  Device: [number, number];
}
export const PHASE_ALL = (): PhaseState => ({ Drug: [0, DRUG_PH.length - 1], Device: [0, DEV_PH.length - 1] });

export const PG = (p: string): 'Drug' | 'Device' => ((DRUG_PH as readonly string[]).includes(p) ? 'Drug' : 'Device');
export const PL = (g: 'Drug' | 'Device'): readonly string[] => (g === 'Drug' ? DRUG_PH : DEV_PH);
export const pAct = (ps: PhaseState, g: 'Drug' | 'Device') => ps[g][0] !== 0 || ps[g][1] !== PL(g).length - 1;
export const phaseActive = (ps: PhaseState) => pAct(ps, 'Drug') || pAct(ps, 'Device');
export const phaseHas = (ps: PhaseState, p: string) => { const g = PG(p), i = PL(g).indexOf(p); return i >= ps[g][0] && i <= ps[g][1]; };
export const phaseSel = (ps: PhaseState, p: string) => pAct(ps, PG(p)) && phaseHas(ps, p);
const pShort = (p: string) => p.replace('Phase ', 'Ph ').replace('Preclinical', 'Preclin.').replace('Post-market', 'Post-mkt');
export const phaseLabel = (ps: PhaseState, g: 'Drug' | 'Device') => { const l = PL(g), [a, b] = ps[g]; return g + ' · ' + (a === b ? l[a] : pShort(l[a]) + '–' + pShort(l[b])); };
export const phaseTags = (ps: PhaseState): string[] => (['Drug', 'Device'] as const).filter(g => pAct(ps, g)).map(g => phaseLabel(ps, g));

export interface DashFilters {
  region: 'All' | 'Americas' | 'Europe' | 'APAC';
  kind: 'All' | 'seeking' | 'pharma' | 'investor';
  type: 'All' | 'Drug' | 'Device';
  seg: 'All' | 'Anterior' | 'Posterior';
  inds: Set<string>; // excluded indications
  phases: PhaseState;
  q: string;
}
export const defaultFilters = (): DashFilters => ({ region: 'All', kind: 'All', type: 'All', seg: 'All', inds: new Set(), phases: PHASE_ALL(), q: '' });

export interface FilterableCompany { kind: string; region: string; type: string; seg: string; ind: string; phase: string; name: string; asset: string; city: string; cdisp: string }

export function baseMatch(d: FilterableCompany, st: DashFilters, skip?: string): boolean {
  return (
    (skip === 'kind' || st.kind === 'All' || (d.kind || 'seeking') === st.kind) &&
    (skip === 'region' || st.region === 'All' || d.region === st.region) &&
    (skip === 'type' || st.type === 'All' || d.type === st.type) &&
    (skip === 'seg' || st.seg === 'All' || d.seg === st.seg) &&
    (skip === 'ind' || !st.inds.has(d.ind)) &&
    (skip === 'phase' || !phaseActive(st.phases) || phaseHas(st.phases, d.phase))
  );
}
export const qMatch = (d: FilterableCompany, q: string) => !q || (d.name + ' ' + d.asset + ' ' + d.city + ' ' + d.cdisp).toLowerCase().includes(q);
export const match = (d: FilterableCompany, st: DashFilters) => baseMatch(d, st) && qMatch(d, st.q);
