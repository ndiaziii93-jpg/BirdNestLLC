import { MO } from './constants';

export const DAY = 864e5;

export function todayISO(): string {
  return toISO(new Date());
}

export function toISO(d: Date): string {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseISO(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/** "19 Oct 2026" */
export function fmtDate(iso: string): string {
  const d = parseISO(iso);
  return `${String(d.getDate()).padStart(2, '0')} ${MO[d.getMonth()]} ${d.getFullYear()}`;
}

/** Whole days between an ISO date and today (0 for today, positive for the past). */
export function daysAgo(iso: string, today: string = todayISO()): number {
  return Math.max(0, Math.round((parseISO(today).getTime() - parseISO(iso).getTime()) / DAY));
}

export function isoDaysAgo(n: number, today: string = todayISO()): string {
  return toISO(new Date(parseISO(today).getTime() - n * DAY));
}

/** Month heading used in the discussions feed: "OCT 2026" */
export function monthLabel(iso: string): string {
  const d = parseISO(iso);
  return `${MO[d.getMonth()]} ${d.getFullYear()}`.toUpperCase();
}
