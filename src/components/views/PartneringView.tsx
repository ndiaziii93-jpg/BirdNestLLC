'use client';
import { useState } from 'react';
import { useStore } from '@/store/StoreProvider';
import { useUi } from '@/store/UiProvider';
import { DEALS, KIND } from '@/lib/constants';
import { dealName, lastTouch, rightsOpen, sortedNotes } from '@/lib/derive';
import { fmtDate } from '@/lib/dates';
import { Logo, MiniRing, Pill, Seg } from '../bits';
import { XIcon } from '../Lockup';
import { ViewHead } from './ViewHead';
import { EmptyState } from '../dashboard/EmptyState';

const STAGES: [number, string][] = [...DEALS.map((n, i) => [i, n] as [number, string]), [-1, 'Parked']];

export function PartneringView() {
  const { companies, today, moveStage } = useStore();
  const ui = useUi();
  const [kind, setKind] = useState('All'); const [dec, setDec] = useState('All'); const [type, setType] = useState('All');
  const [open, setOpen] = useState<string | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const pool = companies.filter(d => (dec === 'All' || d.dec === dec) && (type === 'All' || d.type === type) && (kind === 'All' || (d.kind || 'seeking') === kind));
  const pulse: [string, number, string][] = [['TRACKED', pool.length, 'In this view'], ['IN CONVERSATION', pool.filter(d => d.deal >= 1 && d.deal <= 2).length, 'First contact or intro call'], ['CDA OR LATER', pool.filter(d => d.deal >= 3 && d.deal <= 5).length, 'CDA, diligence, term sheet'], ['PURSUE', pool.filter(d => d.dec === 'Pursue').length, 'Decision as of today'], ['PARKED', pool.filter(d => d.deal < 0).length, 'Not active']];
  const d = companies.find(x => x.id === open) || null;
  const drop = async (id: string, stage: number) => { setOver(null); setDragging(null); const x = companies.find(y => y.id === id); if (x && x.deal !== stage) { await moveStage(x.id, stage); setOpen(x.id); } };
  if (!companies.length) return <section className="vw" id="v-partnering"><ViewHead title="Partnering" sub="Deal stage, separate from clinical stage" /><EmptyState /></section>;

  return (
    <section className="vw" id="v-partnering">
      <ViewHead title="Partnering" sub={`Deal stage, separate from clinical stage · drag a card to move it · as of ${fmtDate(today)}`} />
      <div className="ppulse">{pulse.map(x => <div key={x[0]}><span>{x[0]}</span><b>{x[1]}</b><small>{x[2]}</small></div>)}</div>
      <div className="vbar">
        <Seg opts={[['All', 'All'], ...(Object.keys(KIND) as (keyof typeof KIND)[]).map(k => [k, KIND[k].short] as [string, string])]} cur={kind} onPick={setKind} />
        <Seg opts={['All', 'Pursue', 'Watch', 'Pass']} cur={dec} onPick={setDec} />
        <Seg opts={['All', 'Drug', 'Device']} cur={type} onPick={setType} />
      </div>
      <div className={`pbwrap ${d ? 'open' : ''}`}>
        <div className="board">
          {STAGES.map(([i, n]) => { const cs = pool.filter(x => x.deal === i).sort((a, b) => b.fit - a.fit); return (
            <div key={i} className={`kcol ${i < 0 ? 'park' : ''} ${over === i ? 'over' : ''}`} data-stage={i}
              onDragOver={e => { e.preventDefault(); setOver(i); }} onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(null); }}
              onDrop={e => { e.preventDefault(); const id = e.dataTransfer.getData('text/plain'); if (id) drop(id, i); }}>
              <div className="kh"><span>{n}</span><em>{cs.length}</em></div>
              <div className="kl">{cs.length ? cs.map(x => { const ld = lastTouch(x, today); return (
                <div key={x.id} className={`kc ${open === x.id ? 'on' : ''} ${dragging === x.id ? 'dragging' : ''}`} draggable tabIndex={0} role="button" aria-label={`${x.name}, fit ${x.fit}`}
                  onClick={() => setOpen(o => (o === x.id ? null : x.id))} onKeyDown={e => { if (e.key === 'Enter') setOpen(o => (o === x.id ? null : x.id)); }}
                  onDragStart={e => { e.dataTransfer.setData('text/plain', x.id); e.dataTransfer.effectAllowed = 'move'; setDragging(x.id); }} onDragEnd={() => setDragging(null)}>
                  <div className="kt"><b>{x.name}</b><span className="fn">{x.fit}</span></div>
                  <span className="ks">{x.asset.split(' · ')[0]} · {x.ind} · {x.phaseLabel}</span>
                  <div className="kf"><Pill dec={x.dec} className="vpill" /><span className={`mono ${ld > 60 ? 'late' : ''}`}>{ld < 999 ? ld + 'd' : '—'}</span>{x.cat && x.cat !== 'None set' && x.cat.includes(' · ') ? <span className="kq"><i className="dia" />{x.cat.split(' · ')[1]}</span> : null}</div>
                </div>
              ); }) : <span className="kempty">Drop a company here</span>}</div>
            </div>
          ); })}
        </div>
        {d ? (
          <aside className="pdrawer" aria-label="Company record">
            <div className="pdh"><Logo d={d} size={44} /><div className="n"><b>{d.name}</b><span className="pdsight" /><span>{d.city}, {d.cdisp} · {d.own}</span><span><Pill dec={d.dec} className="vpill" /></span></div><span className="fitc2" style={{ flexDirection: 'column', gap: 2 }}><MiniRing f={d.fit} s={52} /><b>{d.fit}</b></span><button className="x" aria-label="Close" onClick={() => setOpen(null)}><XIcon /></button></div>
            <div className="pstep"><div className="lab"><span>Deal stage</span><b style={{ fontWeight: 500 }}>{dealName(d)}</b></div>
              <div className="bars">{DEALS.map((n, i) => <i key={n} title={n} className={d.deal < 0 ? '' : i < d.deal ? 'd' : i === d.deal ? 'c' : ''} />)}</div>
              <div className="btns edit-only"><button className="primary" disabled={d.deal >= 6} onClick={() => moveStage(d.id, d.deal < 0 ? 0 : Math.min(6, d.deal + 1))}>{d.deal < 0 ? 'Reopen as Identified' : d.deal >= 6 ? 'Closed' : 'Move to ' + DEALS[d.deal + 1]}</button>{d.deal >= 0 ? <button className="sec" onClick={() => moveStage(d.id, -1)}>Park</button> : null}</div></div>
            <div className="pkv">{[['Lead asset', d.asset], ['Phase', d.phaseLabel], ['Rights open', rightsOpen(d) + '/6 territories'], ['Runway', d.runway != null ? d.runway + ' mo' + (d.runwayAsOf ? ' · as of ' + fmtDate(d.runwayAsOf) : '') : 'Not stated'], ['Last raise', d.raise || 'Not stated'], ['Next catalyst', d.cat || 'None set']].map(r => <div key={r[0]}><span>{r[0]}</span><span style={{ color: 'var(--ink)' }}>{r[1]}</span></div>)}</div>
            <div><span className="ovl">RECENT DISCUSSIONS</span><div className="pnl" style={{ marginTop: 6 }}>{sortedNotes(d.notes).slice(0, 4).map(n => <div key={n.id} className={n.priv ? 'priv-note' : ''}><span className="mono">{fmtDate(n.date).slice(0, 6)} · {n.type}</span><span>{n.text}{n.priv ? <span className="fa"> · private</span> : null}</span></div>)}{!d.notes.length ? <span className="fa" style={{ fontSize: 12 }}>None logged.</span> : null}</div></div>
            <div className="pdact"><button className="sec" onClick={() => ui.open({ kind: 'account', id: d.id })}>Open profile</button><button className="sec" onClick={() => ui.open({ kind: 'export', id: d.id })}>One-pager</button></div>
          </aside>
        ) : null}
      </div>
    </section>
  );
}
