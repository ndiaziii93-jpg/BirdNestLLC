'use client';
import { useState } from 'react';
import * as d3 from 'd3';
import { useStore } from '@/store/StoreProvider';
import { useUi } from '@/store/UiProvider';
import { useSearch } from '@/store/SearchProvider';
import { DRUG_PH, DEV_PH, PH_DRUG_C, PH_DEV_C, REGIONS } from '@/lib/constants';
import { baseMatch, qMatch, phaseActive, phaseHas, phaseSel, phaseTags, PL, PG, type DashFilters } from '@/lib/filters';
import { pShort } from '@/lib/derive';
import type { Company } from '@/lib/types';

interface Props { st: DashFilters; update: (p: Partial<DashFilters> | ((s: DashFilters) => DashFilters)) => void; results: Company[]; sel: Company | null; onSelect: (id: string, fromList?: boolean) => void; onReset: () => void }

export function Strip({ st, update, results, sel, onSelect, onReset }: Props) {
  const { companies } = useStore();
  const ui = useUi();
  const { setQ } = useSearch();
  const [hov, setHov] = useState<string | null>(null);

  const pool = companies.filter(d => baseMatch(d, st, 'phase') && qMatch(d, st.q));
  const dc = DRUG_PH.map(p => pool.filter(d => d.phase === p).length), vc = DEV_PH.map(p => pool.filter(d => d.phase === p).length);
  const drug = results.filter(d => d.type === 'Drug').length, dev = results.length - drug;
  const tags: string[] = [];
  if (st.type !== 'All') tags.push(st.type);
  if (st.seg !== 'All') tags.push(st.seg);
  if (st.region !== 'All') tags.push(st.region);
  tags.push(...phaseTags(st.phases));
  st.inds.forEach(i => tags.push('Excl. ' + i));
  if (st.q) tags.push('“' + st.q + '”');

  const togglePhase = (p: string) => update(s => {
    const g = PG(p), i = PL(g).indexOf(p), ps = { ...s.phases };
    ps[g] = ps[g][0] === i && ps[g][1] === i ? [0, PL(g).length - 1] : [i, i];
    return { ...s, phases: ps };
  });

  const ring = (counts: number[], cols: string[], r0: number, r1: number, lab: readonly string[]) => {
    const tot = counts.reduce((a, b) => a + b, 0);
    if (!tot) return <circle cx="0" cy="0" r={(r0 + r1) / 2} fill="none" stroke="#EEEBE4" strokeWidth={r1 - r0} />;
    const arcs = d3.pie<number>().sort(null).padAngle(0.025)(counts), g = d3.arc<d3.PieArcDatum<number>>().innerRadius(r0).outerRadius(r1).cornerRadius(1.5);
    return arcs.map((a, i) => counts[i] ? (
      <path key={lab[i]} d={g(a) || ''} fill={cols[i]} className={`arc ${phaseActive(st.phases) && !phaseHas(st.phases, lab[i]) ? 'dim' : ''} ${phaseSel(st.phases, lab[i]) ? 'on' : ''} ${hov === lab[i] ? 'hov' : ''}`}
        onMouseEnter={() => setHov(lab[i])} onMouseLeave={() => setHov(null)} onClick={() => togglePhase(lab[i])}>
        <title>{`${lab[i]} · ${counts[i]} · click to ${phaseHas(st.phases, lab[i]) ? 'remove' : 'filter'}`}</title>
      </path>
    ) : null);
  };
  const leg = (lab: readonly string[], counts: number[], cols: string[]) => lab.map((p, i) => (
    <button key={p} className={`lg ${counts[i] ? '' : 'z'} ${phaseSel(st.phases, p) ? 'on' : ''} ${hov === p ? 'hov' : ''}`} disabled={!counts[i]}
      onMouseEnter={() => setHov(p)} onMouseLeave={() => setHov(null)} onFocus={() => setHov(p)} onBlur={() => setHov(null)} onClick={() => togglePhase(p)}>
      <i style={{ background: cols[i] }} />{pShort(p)}<b className="mono">{counts[i]}</b>
    </button>
  ));
  const hovCount = hov ? ((DRUG_PH as readonly string[]).includes(hov) ? dc[DRUG_PH.indexOf(hov as (typeof DRUG_PH)[number])] : vc[DEV_PH.indexOf(hov as (typeof DEV_PH)[number])]) : null;

  return (
    <section className="strip" id="matchCol" aria-label="Companies">
      <div className="sleft">
        <span className="gl"><span>Overview{st.region !== 'All' ? ' · ' + st.region : ' · Global'}</span>
          <span style={{ display: 'flex', gap: 14 }}>{tags.length ? <button onClick={() => { onReset(); setQ(''); }}>Reset</button> : null}<button onClick={() => ui.open({ kind: 'list' })}>Full list</button></span></span>
        <div className="ovw">
          <div className="ovm">
            <div className="count"><b>{results.length}</b><span>companies</span></div>
            <div className="split"><div><span>Drug</span><b className="mono">{drug}</b></div><div><span>Device</span><b className="mono">{dev}</b></div></div>
            <div className="sbar"><i style={{ width: `${results.length ? (drug / results.length) * 100 : 0}%` }} /></div>
            <div className="regs">{REGIONS.map(r => <div key={r} className={st.region !== 'All' && st.region !== r ? 'z' : ''}><span>{r}</span><b className="mono">{results.filter(d => d.region === r).length}</b></div>)}</div>
          </div>
          <div className="donut">
            <svg viewBox="-66 -66 132 132" width="132" height="132" role="img" aria-label="Phase coverage" className={hov ? 'hovering' : ''}>
              {ring(dc, PH_DRUG_C, 50, 64, DRUG_PH)}{ring(vc, PH_DEV_C, 34, 44, DEV_PH)}
              <text className="dc1" y={hov ? -6 : 0} dominantBaseline="central" textAnchor="middle" fontFamily="Geist Mono, monospace" fontSize="20" fontWeight="500" fill="#1A1D20">{hov ? hovCount : results.length}</text>
              <text className="dc2" y="12" textAnchor="middle" fontFamily="Geist Mono, monospace" fontSize="7" letterSpacing="1" fill="#878B8F">{hov ? pShort(hov).toUpperCase() : ''}</text>
              <text className="dc3" y="21" textAnchor="middle" fontFamily="Geist Mono, monospace" fontSize="6.5" letterSpacing="1" fill="#878B8F">{hov ? ((DEV_PH as readonly string[]).includes(hov) ? 'DEVICE' : 'DRUG') : ''}</text>
            </svg>
          </div>
        </div>
        <div className="legend2">
          <div><span className="lt" title="Outer ring">DRUG</span>{leg(DRUG_PH, dc, PH_DRUG_C)}</div>
          <div><span className="lt" title="Inner ring">DEVICE</span>{leg(DEV_PH, vc, PH_DEV_C)}</div>
        </div>
      </div>
      <div className="sright">
        <div className="results">
          <div className="lhead"><span>#</span><span>Company</span><span>Indication</span><span>Phase</span><span>Fit</span></div>
          {results.length ? results.map((d, i) => (
            <button key={d.id} className={`res ${sel && d.id === sel.id ? 'on' : ''}`} data-id={d.id} onClick={() => onSelect(d.id, true)}>
              <span className="rk">{String(i + 1).padStart(2, '0')}</span>
              <span className="nm"><b>{d.name}</b><small className="mu">{d.city}, {d.cdisp}</small></span>
              <span>{d.ind}</span><span className="mu">{d.phaseLabel}</span>
              <span className="fitc"><span className="fb"><i style={{ width: `${d.fit}%` }} /></span><span className="fn">{d.fit}</span></span>
            </button>
          )) : <span className="empty">No companies match. Remove a filter to widen the search.</span>}
        </div>
      </div>
    </section>
  );
}
