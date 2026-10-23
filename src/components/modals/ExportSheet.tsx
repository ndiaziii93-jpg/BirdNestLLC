'use client';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Modal } from './Modal';
import { useStore } from '@/store/StoreProvider';
import { useUi } from '@/store/UiProvider';
import { useDash } from '@/store/DashProvider';
import { DEC, STG10, STG10_TICKS, TER } from '@/lib/constants';
import { criteria } from '@/lib/fit';
import { dealName, lastTouch, lastTopic, monogram, sortedNotes, stgIdx } from '@/lib/derive';
import { fmtDate } from '@/lib/dates';
import { match } from '@/lib/filters';
import { companiesCsv, downloadText } from '@/lib/csv';
import { LookoutMark, XIcon } from '../Lockup';

export function ExportSheet({ id }: { id: string }) {
  const { byId, companies, settings, today } = useStore();
  const ui = useUi();
  const { st } = useDash();
  const [XO, setXO] = useState({ score: true, contacts: true, econ: true, size: 'A4' as 'A4' | 'Letter' });
  const prev = useRef<HTMLDivElement>(null), scale = useRef<HTMLDivElement>(null), page = useRef<HTMLElement>(null);
  const d = byId(id);

  const fit = () => {
    if (!prev.current || !page.current || !scale.current) return;
    const W = XO.size === 'A4' ? 794 : 816, H = XO.size === 'A4' ? 1123 : 1056;
    const s = Math.min(1, (prev.current.clientWidth - 48) / W, (prev.current.clientHeight - 48) / H);
    page.current.style.transform = `scale(${s})`; scale.current.style.width = W * s + 'px'; scale.current.style.height = H * s + 'px';
  };
  useLayoutEffect(fit);
  useEffect(() => { window.addEventListener('resize', fit); return () => window.removeEventListener('resize', fit); });
  if (!d) return null;

  const SC = criteria(d.lens, settings), scores = d.lens === 'services' ? d.svcScores : d.scores, why = d.lens === 'services' ? d.svcWhy : d.why;
  const L = d.ai, dc = DEC[d.dec], C = 2 * Math.PI * 28, deal = dealName(d);
  const ranked = SC.map((s, i) => [s[0], scores[i] ?? 0, why[i] ?? ''] as [string, number, string]).sort((a, b) => b[1] - a[1]);
  const overview = L && L.overview ? L.overview : `${d.name} is a ${d.own.toLowerCase()} ${d.type.toLowerCase()} company headquartered in ${d.city}, ${d.cdisp}, focused on ${d.seg.toLowerCase()} ophthalmology. Its lead asset is in ${d.phaseLabel} for ${d.ind}; the relationship is at ${deal.toLowerCase()}.`;
  const diffs = L && L.diffs && L.diffs.length ? L.diffs : ranked.slice(0, 3).map(r => `${r[0]} scores ${r[1]} of 5${r[2] ? '. ' + r[2] : '.'}`);
  const low = ranked[ranked.length - 1], risk = L && L.risk ? L.risk : `${low[0]} scores ${low[1]} of 5${low[2] ? '. ' + low[2] : '. Justification pending.'}`;
  const pipe = L && L.pipe && L.pipe.length ? L.pipe : [[d.asset.split(' · ')[0], d.asset.split(' · ').slice(1).join(' · ') || d.ind, stgIdx(d), d.cat] as [string, string, number, string]];
  const tr = d.trend ? (d.trend > 0 ? '▲' + d.trend : '▼' + -d.trend) : '— 0';
  const last = lastTouch(d, today);
  const lastNote = sortedNotes(d.notes).find(n => !n.priv);
  const rel: [string, string][] = [['Deal stage', deal], ['Last touch', lastNote ? fmtDate(lastNote.date) + ' · ' + last + 'd' : 'None logged'], ...(L && L.rel && L.rel.length ? L.rel : [['Where met', 'Not recorded'] as [string, string]])];
  const print = () => {
    let s = document.getElementById('xpsize'); if (!s) { s = document.createElement('style'); s.id = 'xpsize'; document.head.appendChild(s); }
    s.textContent = `@page{size:${XO.size === 'A4' ? 'A4' : 'letter'};margin:0}`;
    window.print();
  };
  const tg = (k: 'score' | 'contacts' | 'econ', t: string, s: string) => <button className={`xtg ${XO[k] ? 'on' : ''}`} role="switch" aria-checked={XO[k]} onClick={() => setXO(x => ({ ...x, [k]: !x[k] }))}><span>{t}<small>{s}</small></span><span className="sw" /></button>;

  return (
    <Modal label="Export one-pager" id="xmodal">
      <div className="xwrap">
        <div className="xprev" id="xprev" ref={prev}><div className="xscale" id="xscale" ref={scale}>
          <article className={`xpage ${XO.size === 'Letter' ? 'letter' : ''}`} id="xpage" ref={page}>
            <div className="xbrand">
              { }
              <span className="xlogo">{d.logo ? <img src={d.logo} alt="" /> : <span>{monogram(d.name)}</span>}</span>
              <div className="xbt"><span>COMPANY ONE-PAGER</span><b>{d.website || ''}</b></div>
              <span className="xsp" /><span className="xdt">{fmtDate(today)}</span><span className="xvr" />
              <div className="xlock"><LookoutMark size={30} inverse /><div><b>BirdNest</b><span><i />NDIII</span></div></div>
            </div>
            <div className="xin">
              <div className="xtitle"><div><h1>{d.name}</h1><div className="m">{[d.city && d.cdisp ? `${d.city}, ${d.cdisp}` : d.city || d.cdisp, d.own, d.founded && `Founded ${d.founded}`, d.heads && `${d.heads} people`, d.website].filter(Boolean).join(' · ')}</div></div>
                <div className="xfit"><div className="d"><span className="xpill" style={{ background: dc[0], color: dc[1] }}>{d.dec}</span><span>{d.rationale || `${d.dec}. Fit ${d.fit} · ${d.phaseLabel} · ${deal}.`}</span></div>
                  <div className="xring"><svg viewBox="0 0 64 64" width="64" height="64"><circle cx="32" cy="32" r="28" fill="none" stroke="#EEEBE4" strokeWidth="2.5" /><circle cx="32" cy="32" r="28" fill="none" stroke="#B08D57" strokeWidth="2.5" strokeDasharray={`${((d.fit / 100) * C).toFixed(1)} ${C.toFixed(1)}`} /></svg><div><b>{d.fit}</b><small>FIT {tr}</small></div></div></div></div>
              <div className="xbody"><div className="xcol">
                <section className="xs"><h3>Overview</h3><p>{overview}</p></section>
                <section className="xs"><h3>Differentiators</h3><ol>{diffs.map((t, i) => <li key={i}><span>0{i + 1}</span>{t}</li>)}</ol><div className="xrisk"><span>RISK</span><span style={{ fontFamily: 'Geist', fontSize: 11, color: 'var(--ink)', letterSpacing: 0 }}>{risk}</span></div></section>
                <section className="xs"><h3>Pipeline · clinical stage</h3>
                  {pipe.map((p, i) => <div key={i} className="xpipe"><div><b className="mono">{p[0]}</b><small>{p[1]}</small></div><div className="xstage"><span className="t" /><span className="f" style={{ width: `${(p[2] + 1) * 10}%` }} />{p[3] && p[3] !== '—' && p[3] !== 'None set' ? <span className="dm" style={{ left: `${Math.min(98, (p[2] + 1.5) * 10)}%` }} /> : null}</div><div><b style={{ fontSize: 10 }}>{STG10[p[2]]}</b><small>{p[3] || '—'}</small></div></div>)}
                  <div className="xticks" style={{ gridTemplateColumns: 'repeat(10,1fr)' }}>{STG10_TICKS.map(t => <span key={t}>{t}</span>)}</div></section>
                <section className="xs"><h3>Deal posture</h3><div className="xkv"><div><span>Seeking</span><b style={{ fontWeight: 500 }}>{L && L.seeking ? L.seeking : lastTopic(d).replace(/\.$/, '')}</b></div><div><span>Timing</span><b style={{ fontWeight: 500 }}>{(L && L.timing) || 'Not stated'}</b></div><div><span>Last raise</span><b style={{ fontWeight: 500 }}>{d.raise || 'Not stated'}</b></div></div>
                  <div className="xrights">{TER.map((t, i) => <span key={t} style={{ background: d.rightsArr[i] ? '#DCE8E6' : '#EEEBE4', color: d.rightsArr[i] ? '#0F4C52' : '#5E6368' }}>{t}<small>{d.rightsArr[i] ? 'open' : 'taken'}</small></span>)}</div>
                  {XO.econ ? (L && L.econ && L.econ.length ? <div className="xecon">{L.econ.map(e => <div key={e[0]}><span>{e[0]}</span><b>{e[1]}</b><small>As stated</small></div>)}</div> : <p className="xnone" style={{ marginTop: 8 }}>No economics stated.</p>) : null}</section>
              </div><div className="xcol">
                {XO.score ? <section className="xs"><h3>Fit scorecard · {d.lens === 'services' ? 'services client' : 'partnering'}</h3>{SC.map((s, i) => <div key={s[0]} className="xsc"><div>{s[0]}<small>Weight {s[1]}</small></div><span className="sg">{[1, 2, 3, 4, 5].map(v => <i key={v} className={v <= (scores[i] ?? 0) ? 'f' : ''} />)}</span><em>{+(((scores[i] ?? 0) / 5) * s[1]).toFixed(1)}</em></div>)}<div className="xsct"><span>Weighted, scaled to 100</span><b>Fit {d.fit}</b></div></section> : null}
                <div className="xcat"><span className="k"><i />NEXT CATALYST</span><b>{d.cat && d.cat !== 'None set' ? d.cat.split(' · ')[0] : 'None set'}</b><span>{d.cat && d.cat.includes(' · ') ? 'Expected ' + d.cat.split(' · ')[1] : ''}</span></div>
                {XO.contacts ? <section className="xs"><h3>Key contacts</h3>{L && L.contacts && L.contacts.length ? L.contacts.map(c => <div key={c[0]} className="xct"><b>{c[0]}</b><span>{c[1]}</span></div>) : <p className="xnone">No contacts recorded.</p>}</section> : null}
                <section className="xs"><h3>Relationship</h3>{rel.map(r => <div key={r[0]} className="xct"><span>{r[0]}</span><b>{r[1]}</b></div>)}</section>
              </div></div>
            </div>
            <div className="xft"><span>BIRDNEST · NDIII</span><span>Prepared {fmtDate(today)} · Public information and internal assessment</span><span>1 / 1</span></div>
          </article>
        </div></div>
        <aside className="xside" id="xside">
          <div className="xsh"><div style={{ flex: 1 }}><h2>Export one-pager</h2><p>{d.name}</p></div><button className="x" aria-label="Close" onClick={ui.close}><XIcon /></button></div>
          <div className="xopts">
            <div className="xg"><span>INCLUDE</span>{tg('score', 'Scorecard', 'Six criteria, weights and points')}{tg('contacts', 'Contacts', 'Names, titles and roles')}{tg('econ', 'Stated economics', 'Upfront, milestones and royalty')}
              <div className="xtg lock"><span>Private notes and activity log<small>Never printed</small></span><span className="sw" /></div></div>
            <div className="xg"><span>PAPER</span><div className="xseg">{(['A4', 'Letter'] as const).map(s => <button key={s} className={XO.size === s ? 'on' : ''} onClick={() => setXO(x => ({ ...x, size: s }))}>{s}</button>)}</div></div>
          </div>
          <div className="xact"><button className="primary" onClick={print}>Save as PDF</button><button className="sec" onClick={() => downloadText(companiesCsv(companies.filter(c => match(c, st)).sort((a, b) => b.fit - a.fit), today), 'birdnest-companies.csv')}>Export current list as CSV</button></div>
        </aside>
      </div>
    </Modal>
  );
}
