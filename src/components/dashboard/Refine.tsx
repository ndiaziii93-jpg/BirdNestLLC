'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useStore } from '@/store/StoreProvider';
import { useWorld } from '@/lib/world';
import { DRUG_PH, DEV_PH, GBB, KIND, REGIONS } from '@/lib/constants';
import { baseMatch, qMatch, pAct, phaseActive, PHASE_ALL, type DashFilters } from '@/lib/filters';
import { pShort } from '@/lib/derive';
import { ChevronDown, DeviceIcon, DrugIcon } from '../Lockup';

interface Props { st: DashFilters; update: (p: Partial<DashFilters> | ((s: DashFilters) => DashFilters)) => void; setRegion: (r: DashFilters['region']) => void }

export function Refine(p: Props) {
  return (
    <section className="refine" id="refine" aria-label="Refine">
      <TrCol {...p} />
      <PhaseCol {...p} />
      <IndCol {...p} />
    </section>
  );
}

/* ---------- Category · Type · Region ---------- */
function RegionGlyph({ r }: { r: string }) {
  const world = useWorld();
  const html = useMemo(() => {
    if (!world) return '';
    const b = GBB[r];
    const p = d3.geoNaturalEarth1().fitExtent([[1, 1], [39, 27]], { type: 'MultiPoint', coordinates: [b[0], b[1], [b[0][0], b[1][1]], [b[1][0], b[0][1]]] }).clipExtent([[0, 0], [40, 28]]);
    const path = d3.geoPath(p);
    const inR = (f: (typeof world)[number]) => { const [lo, la] = d3.geoCentroid(f); return r === 'Americas' ? lo < -30 : r === 'Europe' ? lo > -25 && lo < 45 && la > 35 : lo > 60 && la < 55; };
    return world.filter(inR).map(f => `<path d="${path(f) || ''}" fill="currentColor"/>`).join('');
  }, [world, r]);
  return <svg viewBox="0 0 40 28" aria-hidden="true" dangerouslySetInnerHTML={{ __html: html }} />;
}

function TrCol({ st, update, setRegion }: Props) {
  const { companies } = useStore();
  const [open, setOpen] = useState(false);
  const dd = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (dd.current && !dd.current.contains(e.target as Node)) setOpen(false); };
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('click', h); document.addEventListener('keydown', k);
    return () => { document.removeEventListener('click', h); document.removeEventListener('keydown', k); };
  }, [open]);

  const tp = companies.filter(d => baseMatch(d, st, 'type') && qMatch(d, st.q)), rp = companies.filter(d => baseMatch(d, st, 'region') && qMatch(d, st.q)), rt = rp.length;
  const kp = companies.filter(d => baseMatch(d, st, 'kind') && qMatch(d, st.q));
  const tn = (n: string) => (n === 'All' ? tp.length : tp.filter(d => d.type === n).length);
  const kn = (k: string) => kp.filter(d => (d.kind || 'seeking') === k).length;
  const cur = st.kind, c = cur !== 'All' ? KIND[cur] : null;
  const clear = st.type !== 'All' || st.region !== 'All';
  return (
    <div className="col" id="trCol">
      <span className="gl"><span>Type · region</span>{clear ? <button onClick={() => { update({ type: 'All' }); if (st.region !== 'All') setRegion('All'); }}>Clear</button> : null}</span>
      <div className="grp"><span className="gl sm"><span>Category</span></span>
        <div className={`kdd ${open ? 'open' : ''}`} ref={dd}>
          <button className={`kddb ${cur !== 'All' ? 'set' : ''}`} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(o => !o)}>
            <span className="v">{c ? <><i className={`kd ${cur}`} />{c.label}</> : 'All categories'}</span><span className="n">{c ? kn(cur) : kp.length}</span><ChevronDown />
          </button>
          <div className="kmenu" role="listbox">
            <button role="option" aria-selected={cur === 'All'} onClick={() => { update({ kind: 'All' }); setOpen(false); }}><span /><span>All categories</span><em>{kp.length}</em><span className="ck">{cur === 'All' ? '✓' : ''}</span></button>
            <div className="sep" />
            {(Object.keys(KIND) as (keyof typeof KIND)[]).map(k => (
              <button key={k} role="option" aria-selected={cur === k} onClick={() => { update({ kind: cur === k ? 'All' : k }); setOpen(false); }}><i className={`kd ${k}`} /><span>{KIND[k].label}<small>{KIND[k].desc}</small></span><em>{kn(k)}</em><span className="ck">{cur === k ? '✓' : ''}</span></button>
            ))}
          </div>
        </div>
      </div>
      <div className="grp"><span className="gl sm"><span>Type</span><em>{st.type}</em></span>
        <div className="sw2">{(['All', 'Drug', 'Device'] as const).map(n => (
          <button key={n} className={st.type === n ? (n === 'All' ? 'all' : 'on') : ''} aria-pressed={st.type === n} onClick={() => update({ type: n === 'All' || st.type === n ? 'All' : n })}>
            {n === 'Drug' ? <DrugIcon /> : n === 'Device' ? <DeviceIcon /> : null}{n} <b>{tn(n)}</b>
          </button>
        ))}</div>
      </div>
      <div className="ld"><span className="h"><span>REGION</span><span>{st.region === 'All' ? 'All ' + rt : st.region}</span></span>
        {REGIONS.map(n => { const cnt = rp.filter(d => d.region === n).length; return (
          <button key={n} className={st.region === n ? 'on' : st.region !== 'All' ? 'dim' : ''} aria-pressed={st.region === n} onClick={() => setRegion(st.region === n ? 'All' : n)}>
            <span className="g"><RegionGlyph r={n} /></span><span>{n}</span><span className="sb"><i style={{ width: `${rt ? (cnt / rt) * 100 : 0}%` }} /></span><em>{cnt}</em>
          </button>
        ); })}
      </div>
    </div>
  );
}

/* ---------- Phase ---------- */
function PhaseCol({ st, update }: Props) {
  const { companies } = useStore();
  const [anchor, setAnchor] = useState<{ Drug: number | null; Device: number | null }>({ Drug: null, Device: null });
  const pool = companies.filter(d => baseMatch(d, st, 'phase') && qMatch(d, st.q));
  const pending = anchor.Drug !== null || anchor.Device !== null;
  const click = (g: 'Drug' | 'Device', i: number) => {
    const a = anchor[g];
    if (a === null) { setAnchor(s => ({ ...s, [g]: i })); update(s => ({ ...s, phases: { ...s.phases, [g]: [i, i] } })); }
    else { setAnchor(s => ({ ...s, [g]: null })); update(s => ({ ...s, phases: { ...s.phases, [g]: [Math.min(a, i), Math.max(a, i)] } })); }
  };
  const grp = (lab: 'Drug' | 'Device', l: readonly string[]) => {
    const [a, b] = st.phases[lab], n = l.length, counts = l.map(p => pool.filter(d => d.phase === p).length), mx = Math.max(1, ...counts), full = !pAct(st.phases, lab), dis = st.type !== 'All' && st.type !== lab, cols = `repeat(${n},minmax(0,1fr))`;
    return (
      <div className={`prg ${dis ? 'dis' : ''}`}>
        <span className="h"><span>{lab.toUpperCase()} · {counts.reduce((x, y) => x + y, 0)}</span>{full ? <span>All {n}</span> : <b>{pShort(l[a])}{a !== b ? ' – ' + pShort(l[b]) : ' only'}</b>}</span>
        <div className="steps" style={{ gridTemplateColumns: cols }}>
          {l.map((p, i) => <button key={p} className={i >= a && i <= b ? 'in' : ''} title={`${p} · ${counts[i]}`} onClick={() => click(lab, i)}><em>{counts[i]}</em><i style={{ height: Math.max(3, (counts[i] / mx) * 22) }} /></button>)}
          {full ? null : <span className="bracket" style={{ left: `${(a / n) * 100}%`, width: `${((b - a + 1) / n) * 100}%` }} />}
        </div>
        <div className="snames" style={{ gridTemplateColumns: cols }}>{l.map((p, i) => <span key={p} className={i >= a && i <= b ? 'in' : ''}>{pShort(p)}</span>)}</div>
      </div>
    );
  };
  return (
    <div className="col" id="phaseCol">
      <span className="gl"><span>Phase</span>{phaseActive(st.phases) ? <button onClick={() => { setAnchor({ Drug: null, Device: null }); update({ phases: PHASE_ALL() }); }}>Include all</button> : null}</span>
      {grp('Drug', DRUG_PH)}{grp('Device', DEV_PH)}
      <span className="phint">{pending ? 'Now click the end phase' : 'Click a start phase, then an end phase'}</span>
    </div>
  );
}

/* ---------- Indication ---------- */
function IndCol({ st, update }: Props) {
  const { companies, settings } = useStore();
  const POST = settings.post, ANT = settings.ant;
  const pool = companies.filter(d => baseMatch(d, { ...st, seg: 'All' }, 'ind') && qMatch(d, st.q));
  const n = (i: string) => pool.filter(d => d.ind === i).length;
  const cnt = (l: string[]) => l.filter(i => !st.inds.has(i)).reduce((a, i) => a + n(i), 0);
  const inc = (l: string[]) => l.filter(i => !st.inds.has(i)).length;
  const tot = ANT.length + POST.length;
  const toggle = (i: string) => update(s => { const inds = new Set(s.inds); if (inds.has(i)) inds.delete(i); else inds.add(i); return { ...s, inds }; });
  const row = (i: string) => { const off = st.inds.has(i); return (
    <button key={i} className={off ? 'off' : ''} role="switch" aria-checked={!off} title={off ? 'Excluded · click to include' : 'Included · click to exclude'} onClick={() => toggle(i)}><span className="d" /><span>{i}</span><em>{off ? '—' : n(i)}</em></button>
  ); };
  const segs: ['Posterior' | 'Anterior', string[]][] = [['Posterior', POST], ['Anterior', ANT]];
  return (
    <div className="col" id="indCol">
      <span className="gl"><span>Indication · {tot - st.inds.size}/{tot}</span>
        <span style={{ display: 'flex', gap: 12, alignItems: 'center' }}>{st.inds.size ? <button onClick={() => update({ inds: new Set() })}>Include all</button> : null}
          <button className={`allb ${st.seg === 'All' ? 'on' : ''}`} aria-pressed={st.seg === 'All'} onClick={() => update({ seg: 'All' })}>All segments <b>{cnt(POST) + cnt(ANT)}</b></button></span></span>
      <div className="ind2">
        <div className="e-cov">{segs.map(([s, l]) => (
          <button key={s} className={st.seg === s ? 'on' : ''} aria-pressed={st.seg === s} onClick={() => update({ seg: st.seg === s ? 'All' : s })}>
            <span className="h"><span>{s}</span><b>{cnt(l)}</b></span>
            <span className="bar">{l.map(i => <i key={i} className={st.inds.has(i) ? 'off' : ''} style={{ flex: Math.max(1, n(i)) }} title={i} />)}</span>
            <small>{inc(l)}/{l.length} included</small>
          </button>
        ))}</div>
        <div className="e-grid">
          {st.seg === 'All' ? <><span className="sh">POSTERIOR</span>{POST.map(row)}<span className="sh">ANTERIOR</span>{ANT.map(row)}</> : (st.seg === 'Posterior' ? POST : ANT).map(row)}
        </div>
      </div>
    </div>
  );
}
