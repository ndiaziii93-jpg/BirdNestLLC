'use client';
import { useMemo, useState } from 'react';
import { useStore } from '@/store/StoreProvider';
import { useUi } from '@/store/UiProvider';
import { DRUG_PH, DEV_PH, KIND } from '@/lib/constants';
import { dealName, lastTouch, rightsOpen } from '@/lib/derive';
import { fmtDate } from '@/lib/dates';
import { companiesCsv, downloadText } from '@/lib/csv';
import { Logo, MiniRing, Pill, Seg } from '../bits';
import { SearchIcon } from '../Lockup';
import { ViewHead } from './ViewHead';
import { EmptyState } from '../dashboard/EmptyState';
import type { Company } from '@/lib/types';

type SV = [string, string, (d: Company, last: (d: Company) => number) => boolean];
const SV: SV[] = [['All', 'All', () => true], ['Pursue', 'Pursue', d => d.dec === 'Pursue'], ['GADR', 'GA and DR', d => ['GA', 'NPDR/DR'].includes(d.ind)], ['EU', 'Licensing EU rights', d => !!d.rightsArr && d.rightsArr[1]], ['60d', 'Not touched 60d+', (d, last) => last(d) >= 60]];

export function CompaniesView() {
  const { companies, today } = useStore();
  const ui = useUi();
  const [q, setQ] = useState(''); const [kind, setKind] = useState('All'); const [dec, setDec] = useState('All'); const [sv, setSv] = useState('All');
  const [layout, setLayout] = useState<'table' | 'cards'>('table'); const [sk, setSk] = useState('fit'); const [sd, setSd] = useState(-1);
  const last = (d: Company) => lastTouch(d, today);
  const svf = SV.find(s => s[0] === sv)![2];
  const base = companies.filter(d => svf(d, last) && (kind === 'All' || (d.kind || 'seeking') === kind));
  const ql = q.toLowerCase();
  const rows0 = base.filter(d => (dec === 'All' || d.dec === dec) && (!ql || (d.name + ' ' + d.asset + ' ' + d.city + ' ' + d.cdisp + ' ' + d.ind).toLowerCase().includes(ql)));
  const key: Record<string, (d: Company) => string | number> = { name: d => d.name, type: d => d.type + d.seg, ind: d => d.ind, phase: d => [...DRUG_PH, ...DEV_PH].indexOf(d.phase as never), deal: d => d.deal, rights: d => rightsOpen(d), dec: d => ['Pursue', 'Watch', 'Pass'].indexOf(d.dec), fit: d => d.fit, last: d => last(d) };
  const k = key[sk] || key.fit;
  const rows = [...rows0].sort((a, b) => { const x = k(a), y = k(b); return (x > y ? 1 : x < y ? -1 : 0) * sd; });
  const rank = useMemo(() => [...companies].sort((a, b) => b.fit - a.fit).map(d => d.id), [companies]);
  const cols: [string, string][] = [['', '#'], ['name', 'Company'], ['fit', 'Fit'], ['dec', 'Decision'], ['', 'Lead asset'], ['type', 'Type · segment'], ['ind', 'Indication'], ['phase', 'Phase'], ['deal', 'Deal stage'], ['rights', 'Rights'], ['last', 'Last touch'], ['', 'Next catalyst'], ['', '']];
  const open = (id: string) => ui.open({ kind: 'account', id });
  const hasSample = companies.some(c => c.sample);
  if (!companies.length) return <section className="vw" id="v-companies"><ViewHead title="Companies" sub="0 of 0" /><EmptyState /></section>;

  return (
    <section className="vw" id="v-companies">
      <ViewHead title="Companies" sub={`${rows.length} of ${companies.length} · ${hasSample ? 'sample data · ' : ''}as of ${fmtDate(today)}`} act={<><button className="sec" onClick={() => downloadText(companiesCsv(rows, today), 'birdnest-companies.csv')}>Export CSV</button><button className="sec edit-only" onClick={() => ui.open({ kind: 'add' })}>Add company</button></>} />
      <div className="vbar">
        <label className="vsearch"><SearchIcon /><input value={q} placeholder="Filter by company, asset, city, indication" aria-label="Filter companies" onChange={e => setQ(e.target.value)} /></label>
        <Seg opts={[['All', 'All', base.length], ...(['Pursue', 'Watch', 'Pass'] as const).map(x => [x, x, base.filter(d => d.dec === x).length] as [string, string, number])]} cur={dec} onPick={setDec} />
        <Seg opts={[['All', 'All'], ...(Object.keys(KIND) as (keyof typeof KIND)[]).map(kk => [kk, KIND[kk].short, companies.filter(d => svf(d, last) && (d.kind || 'seeking') === kk).length] as [string, string, number])]} cur={kind} onPick={setKind} />
        <span className="sp" />
        <Seg opts={[['table', 'Table'], ['cards', 'Cards']]} cur={layout} onPick={setLayout} />
      </div>
      <div className="vviews"><span className="ovl">Saved views</span>{SV.map(s => <button key={s[0]} className={sv === s[0] ? 'on' : ''} onClick={() => setSv(s[0])}>{s[1]}<em>{companies.filter(d => s[2](d, last)).length}</em></button>)}</div>
      {layout === 'table' ? (
        <div className="ctable" role="table">
          <div className="chead">{cols.map(([ck, l], i) => ck ? <button key={i} className={sk === ck ? 'on' : ''} onClick={() => { if (sk === ck) setSd(x => -x); else { setSk(ck); setSd(ck === 'fit' || ck === 'rights' || ck === 'last' ? -1 : 1); } }}>{l}{sk === ck ? (sd > 0 ? ' ↑' : ' ↓') : ''}</button> : <span key={i}>{l}</span>)}</div>
          {rows.length ? rows.map(d => { const buyer = d.kind && d.kind !== 'seeking', ld = last(d); return (
            <div key={d.id} className="crow" tabIndex={0} role="row" onClick={e => { if (!(e.target as HTMLElement).closest('[data-x1]')) open(d.id); }} onKeyDown={e => { if (e.key === 'Enter') open(d.id); }}>
              <span className="mono f">{String(rank.indexOf(d.id) + 1).padStart(2, '0')}</span>
              <span className="cn"><Logo d={d} /><span><b>{d.name}</b><small>{d.city}, {d.cdisp} · {KIND[d.kind || 'seeking'].short}</small></span></span>
              <span className="fitc2"><MiniRing f={d.fit} /><b>{d.fit}</b></span><span><Pill dec={d.dec} className="vpill" /></span><span className="mu">{d.asset}</span><span className="mu">{buyer ? KIND[d.kind].short : d.type + ' · ' + d.seg}</span><span>{d.ind}</span><span className="mu">{d.phaseLabel}</span><span>{dealName(d)}</span>
              <span className="mono">{buyer ? '—' : rightsOpen(d) + '/6'}</span>
              <span className={`mono ${ld > 60 ? 'late' : ''}`}>{ld < 999 ? ld + 'd' : '—'}</span>
              <span className="catc2">{d.cat && d.cat !== 'None set' ? <><i className="dia" />{d.cat}</> : <span className="fa">None set</span>}</span>
              <span className="ract"><button className="sec xbtn" data-x1 aria-label={`Export one-pager for ${d.name}`} onClick={() => ui.open({ kind: 'export', id: d.id })}>Export one-pager</button></span>
            </div>
          ); }) : <p className="vempty">No companies match. Clear the search or pick another view.</p>}
        </div>
      ) : rows.length ? (
        <div className="cgrid">{rows.map(d => { const ld = last(d); return (
          <button key={d.id} className="ccard" onClick={() => open(d.id)}>
            <span className="cct"><Logo d={d} /><span className="nm"><b>{d.name}</b><small>{d.city}, {d.cdisp}</small></span><span className="fitc2"><MiniRing f={d.fit} s={36} /><b>{d.fit}</b></span></span>
            <span className="ccm">{d.asset}<br /><span className="mu">{d.phaseLabel} · {dealName(d)}</span></span>
            <span className="ccf"><Pill dec={d.dec} className="vpill" /><span className="mu el">{d.cat}</span><span className="mono">{ld < 999 ? ld + 'd' : '—'}</span></span>
          </button>
        ); })}</div>
      ) : <p className="vempty">No companies match.</p>}
    </section>
  );
}
