'use client';
import { useCallback, useEffect, useMemo } from 'react';
import { useStore } from '@/store/StoreProvider';
import { useUi } from '@/store/UiProvider';
import { useDash } from '@/store/DashProvider';
import { match } from '@/lib/filters';
import { MapPanel } from './MapPanel';
import { CompanyCard } from './CompanyCard';
import { Strip } from './Strip';
import { Refine } from './Refine';
import { EmptyState } from './EmptyState';

export function Dashboard() {
  const { companies } = useStore();
  const ui = useUi();
  const { st, update, setRegion, reset } = useDash();

  const results = useMemo(() => companies.filter(d => match(d, st)).sort((a, b) => b.fit - a.fit), [companies, st]);

  // Selection: keep the chosen company, else the best-fitting one overall.
  const selId = ui.sel && companies.some(c => c.id === ui.sel) ? ui.sel : [...companies].sort((a, b) => b.fit - a.fit)[0]?.id ?? null;
  const sel = companies.find(c => c.id === selId) || null;
  useEffect(() => { if (selId && selId !== ui.sel) ui.setSel(selId); }, [selId, ui]);

  const select = useCallback((id: string, fromList?: boolean) => {
    ui.setSel(id);
    const d = companies.find(c => c.id === id);
    if (fromList && d && st.region !== 'All' && d.region !== st.region) setRegion(d.region);
  }, [ui, companies, st.region, setRegion]);

  if (!companies.length) return <EmptyState />;

  return (
    <>
      <div className="main">
        <MapPanel st={st} setRegion={setRegion} sel={sel} onSelect={select} />
        {sel ? <CompanyCard d={sel} /> : <aside className="card" id="card" />}
      </div>
      <Strip st={st} update={update} results={results} sel={sel} onSelect={select} onReset={reset} />
      <Refine st={st} update={update} setRegion={setRegion} />
    </>
  );
}
