import { DEALS, STG10, DEV_PH, DRUG_PH } from './constants';
import { daysAgo } from './dates';
import type { Company, Note } from './types';

/** Notes sorted newest first. */
export function sortedNotes(notes: Note[]): Note[] {
  return [...notes].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

/** Days since the most recent note (private or not). Companies without notes count as untouched for a long time. */
export function lastTouch(d: Company, today?: string): number {
  const n = sortedNotes(d.notes)[0];
  return n ? daysAgo(n.date, today) : 999;
}

/** Most recent public note, or the latest one if all are private. */
export function lastTopic(d: Company): string {
  const s = sortedNotes(d.notes);
  const pub = s.find(n => !n.priv);
  return (pub || s[0])?.text || '—';
}

export const rightsOpen = (d: Company) => d.rightsArr.filter(Boolean).length;
export const dealName = (d: Pick<Company, 'deal'>) => (d.deal < 0 ? 'Parked' : DEALS[d.deal] || DEALS[0]);
export const isBuyer = (d: Pick<Company, 'kind'>) => d.kind === 'pharma' || d.kind === 'investor';
export const isSeeking = (d: Pick<Company, 'kind'>) => !d.kind || d.kind === 'seeking';

export const monogram = (name: string) => (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

export const pShort = (p: string) => p.replace('Phase ', 'Ph ').replace('Preclinical', 'Preclin.').replace('Post-market', 'Post-mkt');

/** Index into the 10-step one-pager ladder. */
export function stgIdx(d: Pick<Company, 'type' | 'phase'>): number {
  if (d.type === 'Device') return [3, 6, 9][DEV_PH.indexOf(d.phase as (typeof DEV_PH)[number])] ?? 3;
  return ({ Preclinical: 1, 'Phase 1': 3, 'Phase 2': 5, 'Phase 3': 7, 'Phase 4': 9 } as Record<string, number>)[d.phase] ?? 1;
}

export const phasesFor = (type: string) => (type === 'Device' ? [...DEV_PH] : [...DRUG_PH]);

export { STG10 };
