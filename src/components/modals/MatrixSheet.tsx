'use client';
import { useEffect, useRef } from 'react';
import { Modal } from './Modal';
import { useStore } from '@/store/StoreProvider';
import { useUi } from '@/store/UiProvider';
import { KIND, STC, STG5, TER } from '@/lib/constants';
import { isBuyer } from '@/lib/derive';
import { candidates, modOf, stageOf } from '@/lib/match';
import { XIcon } from '../Lockup';
import { Ini, Ms } from './AccountSheet';

const LBL: Record<string, string> = { ind: 'Indication', mod: 'Modality', st: 'Stage', geo: 'Rights' };
const Mk = ({ v }: { v: number | undefined }) => (v == null ? <span className="ck n" title="Not applicable">·</span> : <span className={`ck ${v === 1 ? 'y' : v ? 'p' : 'n'}`}>{v === 1 ? '✓' : v ? '~' : '–'}</span>);

export function MatrixSheet({ id, hl }: { id: string; hl: string | null }) {
  const { byId, companies, intros, settings, introduce } = useStore();
  const ui = useUi();
  const body = useRef<HTMLDivElement>(null);
  const d = byId(id);
  useEffect(() => { const h = body.current?.querySelector<HTMLElement>('.mxr.hl'); if (h && body.current) body.current.scrollTop = Math.max(0, h.offsetTop - 200); }, [id, hl]);
  if (!d) return null;
  const buyer = isBuyer(d), C = candidates(d, companies, intros, settings.post, settings.ant);
  const keys = buyer ? (d.kind === 'investor' ? ['ind', 'mod', 'st'] : ['ind', 'mod', 'st', 'geo']) : ['ind', 'mod', 'st', 'geo'];
  const cols = `minmax(220px,1.5fr) ${keys.map(() => '92px').join(' ')} 110px 130px 120px`;
  const B = buyer ? d.buyBox : null;
  const crit: [string, string][] = buyer && B
    ? [['INDICATIONS', B.inds.join(', ') || '—'], ['MODALITIES', B.mods.join(', ') || '—'], [d.kind === 'investor' ? 'STAGE' : 'PHASE', STG5[B.st[0]] + ' to ' + STG5[B.st[1]]], ...(d.kind === 'pharma' ? [['RIGHTS', B.geo.join(' + ') || 'Any'] as [string, string]] : [])]
    : [['INDICATION', d.ind], ['MODALITY', modOf(d).join(', ') || d.type], ['STAGE', STG5[stageOf(d)]], ['RIGHTS OPEN', TER.filter((_, i) => d.rightsArr[i]).join(', ') || 'None']];
  return (
    <Modal label="Fit matrix" className="mxm" id="mxm">
      <div className="mxs" id="mxs">
        <div className="pbrand"><span className="plogo" style={{ cursor: 'default' }}><Ini d={d} /></span>
          <div className="pbt"><span className="ovl">Fit matrix · {hl ? 'focused on ' + (byId(hl)?.name || '') : 'all candidates'}</span><b style={{ fontSize: 22, fontWeight: 300, letterSpacing: '-.03em' }}>{d.name}</b><span className="pbs">{buyer ? 'Every company seeking capital, scored against this buy box' : 'Every pharma and investor, scored on how well this company fits their criteria'}</span></div>
          <span className="sp" /><button className="x" aria-label="Close" onClick={ui.close}><XIcon /></button></div>
        <div className="mxb" ref={body}>
          <div className="crit">{crit.map(r => <div key={r[0]}><span>{r[0]}</span><b>{r[1]}</b></div>)}</div>
          <div className="mx">
            <div className="mxh" style={{ gridTemplateColumns: cols }}><span>{buyer ? 'Company' : 'Partner or investor'}</span>{keys.map(k => <span key={k} className="c">{LBL[k]}</span>)}<span>Match</span><span>Introduced</span><span /></div>
            {C.map(({ c, m: mm, done }) => { const x = intros.find(y => y.buyerId === (buyer ? d.id : c.id) && y.sellerId === (buyer ? c.id : d.id)); return (
              <div key={c.id} className={`mxr ${hl === c.id ? 'hl' : ''}`} style={{ gridTemplateColumns: cols }}>
                <div><b>{c.name}</b><small>{buyer ? c.ind + ' · ' + c.phaseLabel : KIND[c.kind].short + ' · ' + c.city}</small></div>
                {keys.map(k => <Mk key={k} v={mm.chk[k]} />)}
                <Ms s={mm.score} />
                <span>{x ? <span className={`apill ${STC[x.status] || 'p-new'}`}>{x.status}</span> : <span style={{ fontSize: 12, color: 'var(--faint)' }}>Not yet</span>}</span>
                <span style={{ justifySelf: 'end' }}>{done ? null : <button className="ibtn edit-only" onClick={() => introduce(d, c)}>Introduce</button>}</span>
              </div>
            ); })}
            {!C.length ? <p className="vempty">No candidates yet. Add pharma or investor accounts to see matches.</p> : null}
          </div>
          <div className="mxl"><span><Mk v={1} />Meets</span><span><Mk v={0.5} />Partial</span><span><Mk v={0} />Misses</span><span style={{ marginLeft: 'auto' }}>Weights · {buyer && d.kind === 'investor' ? 'indication 40 · modality 20 · stage 40' : 'indication 35 · modality 20 · stage 25 · rights 20'}</span></div>
        </div>
      </div>
    </Modal>
  );
}
