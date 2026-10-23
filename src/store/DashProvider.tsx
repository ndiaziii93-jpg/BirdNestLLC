'use client';
// Dashboard filter state, shared with the full-list pop-up and the CSV export.
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { defaultFilters, PHASE_ALL, type DashFilters } from '@/lib/filters';
import { useSearch } from './SearchProvider';

interface Dash {
  st: DashFilters;
  update: (p: Partial<DashFilters> | ((s: DashFilters) => DashFilters)) => void;
  setRegion: (r: DashFilters['region']) => void;
  reset: () => void;
}
const Ctx = createContext<Dash | null>(null);

export function DashProvider({ children }: { children: React.ReactNode }) {
  const { q, setQ } = useSearch();
  const [st0, setSt] = useState<DashFilters>(() => defaultFilters());
  const st = useMemo(() => ({ ...st0, q: q.trim().toLowerCase() }), [st0, q]);
  const update = useCallback((patch: Partial<DashFilters> | ((s: DashFilters) => DashFilters)) => setSt(s => (typeof patch === 'function' ? patch(s) : { ...s, ...patch })), []);
  const setRegion = useCallback((r: DashFilters['region']) => update({ region: r }), [update]);
  const reset = useCallback(() => { update(s => ({ ...defaultFilters(), kind: s.kind, phases: PHASE_ALL() })); setQ(''); }, [update, setQ]);
  const v = useMemo(() => ({ st, update, setRegion, reset }), [st, update, setRegion, reset]);
  return <Ctx.Provider value={v}>{children}</Ctx.Provider>;
}

export const useDash = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useDash outside DashProvider');
  return c;
};
