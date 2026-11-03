'use client';
import { useMemo, useState } from 'react';
import { Modal } from './Modal';
import { useStore } from '@/store/StoreProvider';
import { useUi } from '@/store/UiProvider';
import { useDash } from '@/store/DashProvider';
import { match, phaseTags } from '@/lib/filters';
import { DRUG_PH, DEV_PH } from '@/lib/constants';
import { dealName, lastTopic, lastTouch } from '@/lib/derive';
import { companiesCsv, downloadText } from '@/lib/csv';
import { fmtDate } from '@/lib/dates';
import { Lockup, DownloadIcon, XIcon } from '../Lockup';
import { Pill } from '../bits';
import type { Company } from '@/lib/types';

const COLS: [string, string][] = [['rank', '#'], ['name', 'Company'], ['hq', 'HQ'], ['ts', 'Type · segment'], ['ind', 'Indication'], ['phase', 'Phase'], ['deal', 'Deal stage'], ['dec', 'Decision'], ['fit', 'Fit'], ['last', 'Last discussion'], ['cat', 'Next catalyst']];

export function ListSheet() {
  const { companies, today } = useStore();
  const ui = useUi();
  const { st } = useDash();
  const [sortK, setSortK] = useState('fit');
  const [sortDir, setSortDir] = useState(-1);

  const ranked = useMemo(() => companies.filter(d => match(d, st)).sort((a, b) => b.fit - a.fit), [companies, st]);
  const rank = new Map(ranked.map((d, i) => [d.id, i + 1]));
  const val = (d: Company, k: string): string | number =>
    k === 'rank' ? rank.get(d.id) || 0 : k === 'hq' ? d.city : k === 'ts' ? d.type + d.seg : k === 'deal' ? d.deal : k === 'phase' ? [...DRUG_PH, ...DEV_PH].indexOf(d.phase as never) : k === 'dec' ? ['Pursue', 'Watch', 'Pass'].indexOf(d.dec) : k === 'last' ? lastTouch(d, today) : (d[k as keyof Company] as string | number);
  const rows = [...ranked].sort((a, b) => { const x = val(a, sortK), y = val(b, sortK); return (x > y ? 1 : x < y ? -1 : 0) * sortDir; });
  const tags = [st.type !== 'All' && st.type, st.seg !== 'All' && st.seg, st.region !== 'All' && st.region, ...phaseTags(st.phases), ...[...st.inds].map(i => 'Excl. ' + i), st.q && '“' + st.q + '”'].filter(Boolean) as string[];
  const hasSample = companies.some(c => c.sample);

  return (
    <Modal label="Company register" id="modal">
      <div className="sheet">
        <div className="band" />
        <div className="mtop">
          <Lockup size={44} />
          <span className="vr" />
          <div className="mt"><span className="ovl">Company register</span><h2 id="mTitle">Full list</h2></div>
          <div className="sp" />
          <div className="mstat"><span className="ovl">Showing</span><b className="mono">{rows.length}<small>/{companies.length}</small></b></div>
          <div className="mstat"><span className="ovl">Avg fit</span><b className="mono" style={{ color: 'var(--brassInk)' }}>{rows.length ? Math.round(rows.reduce((a, d) => a + d.fit, 0) / rows.length) : '—'}</b></div>
          <div className="mstat"><span className="ovl">Pursue</span><b className="mono">{rows.filter(d => d.dec === 'Pursue').length}</b></div>
          <span className="vr" />
          <button className="sec" style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => downloadText(companiesCsv(rows, today), 'birdnest-companies.csv')}><DownloadIcon />Export CSV</button>
          <button className="x" aria-label="Close" onClick={ui.close}><XIcon /></button>
        </div>
        <div className="mfilt"><span className="ovl" style={{ color: 'var(--faint)' }}>Filters</span>
          <span id="mCount">{tags.length ? tags.map(t => <span key={t} className="ftag">{t}</span>) : <span style={{ color: 'var(--muted)' }}>None · every tracked company</span>}</span>
          <span className="sp" /><span className="hint">Click a header to sort · click a row to open · Esc to close</span></div>
        <div className="mtable">
          <div className="mhead" id="mHead">{COLS.map(([k, l]) => <button key={k} className={sortK === k ? 'on' : ''} onClick={() => { if (sortK === k) setSortDir(d => -d); else { setSortK(k); setSortDir(k === 'fit' || k === 'last' ? -1 : 1); } }}>{l}{sortK === k ? (sortDir > 0 ? ' ↑' : ' ↓') : ''}</button>)}</div>
          <div id="mBody">
            {rows.length ? rows.map(d => (
              <button key={d.id} className={`mrow ${d.id === ui.sel ? 'on' : ''}`} onClick={() => { ui.close(); ui.setSel(d.id); }}>
                <span className="mono f">{String(rank.get(d.id)).padStart(2, '0')}</span><b>{d.name}</b><span>{d.city}, {d.cdisp}</span><span>{d.type} · {d.seg}</span><span>{d.ind}</span><span>{d.phaseLabel}</span><span>{dealName(d)}</span>
                <span><Pill dec={d.dec} className="pill" style={{ fontStyle: 'normal' }} /></span><span className="mono fit">{d.fit}</span>
                <span><span className="mono">{lastTouch(d, today)}d</span> · {lastTopic(d).replace(/\.$/, '')}</span>
                <span className="catc">{!d.cat || d.cat === 'None set' ? <span style={{ color: 'var(--faint)' }}>None set</span> : <><i className="dia" />{d.cat}</>}</span>
              </button>
            )) : <p className="empty" style={{ padding: 24 }}>No companies match. Remove a filter to widen the search.</p>}
          </div>
        </div>
        <div className="mfoot"><span>BIRDNEST · NDIII</span><span>{hasSample ? 'Sample data · ' : ''}Public information and internal assessment · as of {fmtDate(today)}</span></div>
      </div>
    </Modal>
  );
}
