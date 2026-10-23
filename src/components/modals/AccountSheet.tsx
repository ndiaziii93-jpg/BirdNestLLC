'use client';
import { useEffect, useRef, useState } from 'react';
import { Modal } from './Modal';
import { useStore } from '@/store/StoreProvider';
import { useUi } from '@/store/UiProvider';
import { CDA_PLUS, DEALS_W, KIND, MODS, STC, STG5, TER } from '@/lib/constants';
import { isBuyer, monogram, rightsOpen } from '@/lib/derive';
import { candidates, introsFor, matchScore, modOf, otherParty, stageOf, type MatchResult } from '@/lib/match';
import { fmtDate } from '@/lib/dates';
import { XIcon, GridIcon, ChevronRight } from '../Lockup';
import type { BuyBox, Company } from '@/lib/types';

export const Ini = ({ d }: { d: Company }) => (d.logo ? <img src={d.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 6 }} /> : <span className="mono">{monogram(d.name)}</span>);
export const Ms = ({ s }: { s: number }) => <span className="ms"><span className="bar"><i style={{ width: `${s}%` }} /></span><b>{s}</b></span>;
const LBL: Record<string, string> = { ind: 'Indication', mod: 'Modality', st: 'Stage', geo: 'Rights' };

export function WhyTags({ bio, buyer, mm }: { bio: Company; buyer: Company; mm: MatchResult }) {
  const t: [string, number, string][] = [[bio.ind, mm.chk.ind ?? 0, 'ind'], [modOf(bio)[0] || bio.type, mm.chk.mod ?? 0, 'mod'], [STG5[stageOf(bio)], mm.chk.st ?? 0, 'st']];
  if (mm.chk.geo != null && mm.chk.geo < 1 && buyer.buyBox) t.push([buyer.buyBox.geo.filter(g => !bio.rightsArr[TER.indexOf(g as (typeof TER)[number])]).join('/') + ' rights taken', 0, 'geo']);
  const who = buyer.kind === 'investor' ? 'Investor' : 'Buyer';
  const tip = (k: string, v: number) => (k === 'geo' ? 'Territory rights already licensed · the buyer wants these regions' : v ? `${who} is interested · ${LBL[k].toLowerCase()} matches their criteria` : `${who} is not interested · ${LBL[k].toLowerCase()} is outside their criteria`);
  return <span className="why">{t.map(([l, v, k]) => <i key={k} className={v ? '' : 'nofit'} data-tip={tip(k, v)}>{v ? null : <s>×</s>}<u>{l}</u></i>)}</span>;
}

export function AccountSheet({ id }: { id: string }) {
  const { byId, companies, intros, settings, introduce, updateBuyBox } = useStore();
  const ui = useUi();
  const d = byId(id);
  const sheet = useRef<HTMLDivElement>(null);
  useEffect(() => { sheet.current?.scrollTo(0, 0); }, [id]);
  const [anc, setAnc] = useState<number | null>(null);
  if (!d) return null;
  const buyer = isBuyer(d), I = introsFor(d, intros), C = candidates(d, companies, intros, settings.post, settings.ant), fits = C.filter(x => !x.done);
  const cda = I.filter(x => CDA_PLUS.includes(x.status)).length, strong = fits.filter(x => x.m.score >= 70).length;
  const L = d.ai;

  const panel01 = () => {
    if (buyer) {
      const B: BuyBox = d.buyBox || { inds: [], mods: [], st: [0, 4], geo: [], deals: [], excl: [], money: [], contact: '', whereMet: '' };
      const inv = d.kind === 'investor';
      const tog = (key: 'inds' | 'mods' | 'geo' | 'deals', x: string) => { const a = B[key]; updateBuyBox(d.id, { ...B, [key]: a.includes(x) ? a.filter(v => v !== x) : [...a, x] }); };
      const grp = (lab: string, key: 'inds' | 'mods' | 'geo' | 'deals', all: string[]) => (
        <div><div className="sub">{lab}</div><div className="chips">{all.map(x => <button key={x} className={`chip ${B[key].includes(x) ? 'on' : ''}`} onClick={() => tog(key, x)}>{x}</button>)}</div></div>
      );
      return (
        <div className="bk w">
          <div className="bh"><span className="no">01</span><b>{inv ? 'Investment thesis' : 'What they want'}</b><span className="sp" /><span className="hint edit-only">Click to edit</span></div>
          {grp('Indications', 'inds', [...new Set([...B.inds, ...settings.post, ...settings.ant])])}{grp('Modalities', 'mods', MODS)}
          <div><div className="sub">{inv ? 'Stage window' : 'Phase window'}</div>
            <div className="phase edit">{STG5.map((p, i) => <i key={p} className={i >= B.st[0] && i <= B.st[1] ? 'in' : ''} title={p} onClick={() => { if (anc === null) { setAnc(i); updateBuyBox(d.id, { ...B, st: [i, i] }); } else { updateBuyBox(d.id, { ...B, st: [Math.min(anc, i), Math.max(anc, i)] }); setAnc(null); } }} />)}</div>
            <div className="pnames">{STG5.map((p, i) => <span key={p} className={i >= B.st[0] && i <= B.st[1] ? 'in' : ''}>{p.replace(' · approved', '')}</span>)}</div></div>
          {inv ? null : <>{grp('Rights wanted', 'geo', [...TER])}{grp('Deal structures', 'deals', DEALS_W)}</>}
          <div><div className="sub">Excludes</div><div className="chips">{B.excl.length ? B.excl.map(x => <span key={x} className="chip no ro">{x}</span>) : <span className="hint">None listed</span>}</div></div>
          <div>{[...B.money, ['Contact', B.contact || 'Not recorded'], ['Where met', B.whereMet || 'Not recorded']].map((r, i) => <div key={i} className="akv"><span>{r[0]}</span><span className={/\$/.test(r[1]) ? 'mono' : ''}>{r[1]}</span></div>)}</div>
        </div>
      );
    }
    return (
      <div className="bk w">
        <div className="bh"><span className="no">01</span><b>What they offer</b></div>
        <div>{[['Lead asset', d.asset], ['Indication', d.ind + ' · ' + d.seg], ['Stage', d.phaseLabel], ['Modality', modOf(d).join(', ') || d.type], ['Next catalyst', d.cat || 'None set']].map(r => <div key={r[0]} className="akv"><span>{r[0]}</span><span>{r[1]}</span></div>)}</div>
        <div><div className="sub">Rights by territory</div><div className="terr">{TER.map((t, i) => <span key={t} className={d.rightsArr[i] ? 'o' : 't'}>{t}<small>{d.rightsArr[i] ? 'open' : 'taken'}</small></span>)}</div></div>
        <div>{[['Seeking', (L && L.seeking) || 'Not stated'], ['Last raise', d.raise || 'Not stated'], ['Runway', d.runway != null ? d.runway + ' mo' + (d.runwayAsOf ? ' · as of ' + fmtDate(d.runwayAsOf) : '') : 'Not stated'], ...(L && L.econ && L.econ.length ? L.econ.map(e => [e[0], e[1] + ' · as stated']) : [])].map((r, i) => <div key={i} className="akv"><span>{r[0]}</span><span className={/\$|mo/.test(r[1]) ? 'mono' : ''}>{r[1]}</span></div>)}</div>
      </div>
    );
  };

  const openMx = (hl: string | null) => ui.open({ kind: 'matrix', id: d.id, hl });
  return (
    <Modal label="Account" id="acmodal">
      <div className="sheet acs" id="acsheet" ref={sheet}>
        <div className="pbrand">
          <span className="plogo" style={{ cursor: 'default' }}><Ini d={d} /></span>
          <div className="pbt"><span className="ovl">{buyer ? (d.kind === 'pharma' ? 'Big Pharma · buying assets' : 'Investor · deploying capital') : 'Company · seeking capital and partners'}</span><b style={{ fontSize: 24, fontWeight: 300, letterSpacing: '-.03em', lineHeight: '28px' }}>{d.name}</b><span className="pbs">{d.city}, {d.cdisp} · {d.own}{d.scale ? ' · ' + d.scale : ''}</span></div>
          <span className="sp" />
          <div className="acst"><div><span>{buyer ? 'INTRODUCED' : 'INTRODUCED TO'}</span><b>{I.length}</b></div><div><span>CDA OR LATER</span><b>{cda}</b></div><div><span>STRONG {buyer ? 'FITS' : 'MATCHES'}</span><b>{strong}</b></div><div><span>FIT</span><b className="fit">{d.fit}</b></div></div>
          <span className="vr" />
          <div className="acact"><button className="lbtn edit-only" onClick={() => ui.replace({ kind: 'profile', id: d.id })}>Edit profile</button><button className="lbtn gbtn" onClick={() => ui.replace({ kind: 'export', id: d.id })}>One-pager</button></div>
          <button className="x" aria-label="Close" onClick={ui.close}><XIcon /></button>
        </div>
        <div className="acb">
          {panel01()}
          <div className="rc">
            <div className="bk i"><div className="bh"><span className="no">02</span><b>{buyer ? 'Introduced by you' : 'Introduced to'}</b><em>{I.length}</em><span className="sp" /></div>
              <div>{I.length ? I.map(x => { const o = otherParty(d, x, companies); if (!o) return null; return (
                <div key={x.id} className="irow"><span className="dot" /><div><button className="nm" onClick={() => ui.replace({ kind: 'account', id: o.id })}>{o.name}</button><small>{x.note}</small></div><span className="mono">{fmtDate(x.date)}</span><span className={`apill ${STC[x.status] || 'p-new'}`}>{x.status}</span></div>
              ); }) : <p className="sub" style={{ margin: 0 }}>No introductions yet. Use Introduce on a {buyer ? 'fit' : 'match'} below.</p>}</div></div>
            <div className="bk f"><div className="bh"><span className="no">03</span><b>{buyer ? (d.kind === 'pharma' ? 'Fits their buy box' : 'Fits their thesis') : 'Potential partners and investors'}</b><em>{fits.length}</em><span className="sp" /><button className="mxbtn" onClick={() => openMx(null)}><GridIcon />Open fit matrix</button></div>
              <div>{fits.length ? fits.slice(0, 4).map(({ c, m: mm }) => (
                <div key={c.id} className="fr" tabIndex={0} title="Open in fit matrix" onClick={() => openMx(c.id)} onKeyDown={e => { if (e.key === 'Enter') openMx(c.id); }}>
                  <div><b>{c.name}</b><small>{c.city}, {c.cdisp} · {buyer ? c.phaseLabel : KIND[c.kind].short}</small></div>
                  <Ms s={mm.score} />
                  {buyer ? <WhyTags bio={c} buyer={d} mm={mm} /> : <WhyTags bio={d} buyer={c} mm={mm} />}
                  <button className="ibtn edit-only" onClick={e => { e.stopPropagation(); introduce(d, c); }}>Introduce</button>
                </div>
              )) : <p className="sub">No candidates.</p>}</div>
              {fits.length > 4 ? <button className="vfl" onClick={() => openMx(null)}><span>View full list</span><em>{fits.length - 4} more · {fits.length} total</em><ChevronRight /></button> : null}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export { matchScore, rightsOpen };
