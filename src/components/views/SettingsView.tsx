'use client';
import { useState } from 'react';
import { useStore } from '@/store/StoreProvider';
import { DEALS, DEF_SVC_W, DEF_W, DEV_PH, DRUG_PH, REGIONS, SC_DEFAULT, SVC_DEFAULT } from '@/lib/constants';
import { calcFitFrom, rebalance } from '@/lib/fit';
import { companiesCsv, downloadText } from '@/lib/csv';
import { CompactMark, XIcon } from '../Lockup';
import { Seg } from '../bits';
import { ViewHead } from './ViewHead';

/** Number box that commits on blur or Enter, like the prototype's onchange, so typing "40" is one step not two. */
function NumberBox({ value, label, onCommit }: { value: number; label: string; onCommit: (v: number) => void }) {
  const [text, setText] = useState(String(value));
  const [seen, setSeen] = useState(value);
  if (seen !== value) { setSeen(value); setText(String(value)); }
  const commit = () => { const v = +text; if (!Number.isNaN(v) && v !== value) onCommit(v); else setText(String(value)); };
  return <input type="number" min={0} max={50} step={5} value={text} aria-label={label} onChange={e => setText(e.target.value)} onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') commit(); }} />;
}

export function SettingsView() {
  const { companies, settings, today, applyWeights, setPicklist, loadSample, clearSample } = useStore();
  const [tab, setTab] = useState<'weights' | 'lists' | 'data'>('weights');
  const [lens, setLens] = useState<'Partnering' | 'Services client'>('Partnering');
  const [draft, setDraft] = useState<number[]>(settings.weights);
  const [svc, setSvc] = useState<number[]>(settings.svcWeights);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  // Resync the drafts when saved weights change (e.g. after Apply or a sample load).
  const [seen, setSeen] = useState({ w: settings.weights, s: settings.svcWeights });
  if (seen.w !== settings.weights || seen.s !== settings.svcWeights) { setSeen({ w: settings.weights, s: settings.svcWeights }); setDraft(settings.weights); setSvc(settings.svcWeights); }
  const P = lens === 'Partnering';
  const w = P ? draft : svc, setW = P ? setDraft : setSvc, base = P ? settings.weights : settings.svcWeights;
  const crit = (P ? SC_DEFAULT : SVC_DEFAULT).map((x, i) => [x[0], w[i], x[2]] as [string, number, string]);
  const tot = w.reduce((a, b) => a + b, 0);
  const dirty = w.some((x, i) => x !== base[i]);
  const setOne = (i: number, v: number) => { setW(rebalance(w, i, v)); setMsg(''); };
  const lensCos = companies.filter(c => (P ? c.lens === 'partnering' : c.lens === 'services'));
  const cur = [...lensCos].sort((a, b) => b.fit - a.fit).map(d => d.id);
  const nw = lensCos.map(d => [d, calcFitFrom(P ? d.scores : d.svcScores, w)] as const).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const apply = async () => { const n = await applyWeights(P ? 'partnering' : 'services', w); setMsg(`Applied · fit recalculated for ${n} ${n === 1 ? 'company' : 'companies'}`); };
  const sampleN = companies.filter(c => c.sample).length;

  const lists = { POST: settings.post, ANT: settings.ant, MET: settings.met };
  const used = (i: string) => companies.filter(d => d.ind === i).length;
  const [adds, setAdds] = useState<Record<string, string>>({ POST: '', ANT: '', MET: '' });
  const add = (key: 'POST' | 'ANT' | 'MET') => { const v = adds[key].trim(); if (!v) return; if (![...settings.post, ...settings.ant, ...settings.met].includes(v)) setPicklist(key === 'POST' ? 'post' : key === 'ANT' ? 'ant' : 'met', [...lists[key], v]); setAdds(a => ({ ...a, [key]: '' })); };
  const rm = (key: 'POST' | 'ANT' | 'MET', v: string) => setPicklist(key === 'POST' ? 'post' : key === 'ANT' ? 'ant' : 'met', lists[key].filter(x => x !== v));
  const ilist = (lab: string, key: 'POST' | 'ANT') => (
    <div className="spanel"><h2>{lab} indications</h2><p>Remove is available once no company uses the indication.</p>
      <div className="plist">{lists[key].map(i => <div key={i} className="it"><span>{i}</span><em>{used(i)}</em><button className="edit-only" disabled={!!used(i)} aria-label={`Remove ${i}`} onClick={() => rm(key, i)}><XIcon size={14} sw={1.6} /></button></div>)}</div>
      <div className="padd2 edit-only"><input value={adds[key]} placeholder={`Add ${lab.toLowerCase()} indication`} onChange={e => setAdds(a => ({ ...a, [key]: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') add(key); }} /><button className="sec" onClick={() => add(key)}>Add</button></div></div>
  );

  return (
    <section className="vw" id="v-settings">
      <ViewHead title="Settings" sub="One user · Google sign-in · BirdNest · NDIII" />
      <div className="stabs">{([['weights', 'Scorecard weights'], ['lists', 'Picklists'], ['data', 'Data']] as const).map(t => <button key={t[0]} className={tab === t[0] ? 'on' : ''} onClick={() => { setTab(t[0]); setMsg(''); }}>{t[1]}</button>)}</div>
      {tab === 'weights' ? <>
        <div className="vbar"><Seg opts={['Partnering', 'Services client']} cur={lens} onPick={v => { setLens(v); setMsg(''); }} /><span className="mu" style={{ fontSize: 13 }}>{P ? 'Default lens. Fit is the weighted sum of six 1–5 scores, scaled to 100.' : 'Used for companies switched to the Services client lens on their profile.'}</span></div>
        <div className="sgrid">
          <div className="spanel"><h2>Weights</h2><p>Weights always total 100. Moving one slider rebalances the others in steps of 5. Changes apply to every company on this lens when you press Apply.</p>
            <div>{crit.map((c, i) => <div key={c[0]} className="wrow"><div><b>{c[0]}</b><small>{c[2]}</small></div><input type="range" min={0} max={50} step={5} value={c[1]} aria-label={`${c[0]} weight`} onChange={e => setOne(i, +e.target.value)} /><NumberBox value={c[1]} label={`${c[0]} weight value`} onCommit={v => setOne(i, v)} /></div>)}</div>
            <div className="wtot"><span className="t">Total <b id="wtot" className={tot === 100 ? '' : 'bad'}>{tot}</b> of 100</span><div className="btns edit-only"><button className="sec" onClick={() => { setW(P ? [...DEF_W] : [...DEF_SVC_W]); setMsg(''); }}>Reset to default</button><button className="primary" disabled={tot !== 100 || !dirty} onClick={apply}>Apply</button></div></div>
            <span className="wmsg">{msg}</span></div>
          <div className="spanel"><h2>Top 10 · live preview</h2>{lensCos.length ? <><p>How the top 10 would rank with the weights at left. Arrows compare with the current ranking.</p><div id="wprev">{nw.map(([d, f], i) => { const was = cur.indexOf(d.id), mv = was - i; return <div key={d.id} className="prow"><span className="mono">{String(i + 1).padStart(2, '0')}</span><b>{d.name}</b><span className="fn">{f}</span><span className={`mv ${mv > 0 ? 'up' : mv < 0 ? 'dn' : 'eq'}`}>{mv > 0 ? '▲' + mv : mv < 0 ? '▼' + -mv : '—'}</span></div>; })}</div></> : <p>No companies use the {lens} lens yet. Weights are saved for when you {P ? 'add one' : 'switch a company to it on its profile'}.</p>}</div>
        </div>
      </> : null}
      {tab === 'lists' ? <div className="plgrid">
        {ilist('Posterior', 'POST')}{ilist('Anterior', 'ANT')}
        <div className="spanel"><h2>Where met</h2><p>Congresses and sources offered when logging a relationship.</p><div className="plist">{settings.met.map(m => <div key={m} className="it"><span>{m}</span><em /><button className="edit-only" aria-label={`Remove ${m}`} onClick={() => rm('MET', m)}><XIcon size={14} sw={1.6} /></button></div>)}</div>
          <div className="padd2 edit-only"><input value={adds.MET} placeholder="Add a congress or source" onChange={e => setAdds(a => ({ ...a, MET: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') add('MET'); }} /><button className="sec" onClick={() => add('MET')}>Add</button></div></div>
        <div className="spanel"><h2>Fixed lists</h2><p>These drive the board and filters and can&apos;t be edited.</p><span className="ovl">DEAL STAGES</span><div className="ro">{[...DEALS, 'Parked'].map(x => <span key={x}>{x}</span>)}</div><span className="ovl">DRUG PHASES</span><div className="ro">{DRUG_PH.map(x => <span key={x}>{x}</span>)}</div><span className="ovl">DEVICE PHASES</span><div className="ro">{DEV_PH.map(x => <span key={x}>{x}</span>)}</div><span className="ovl">REGIONS</span><div className="ro">{REGIONS.map(x => <span key={x}>{x}</span>)}</div></div>
      </div> : null}
      {tab === 'data' ? <div className="sgrid">
        <div className="spanel"><h2>Data rule</h2><div className="drule"><CompactMark /><span><b>Public information and your own notes only.</b> Nothing under a CDA. Private entries stay out of Present mode, one-pagers and exports.</span></div>
          <p>{companies.length} companies · {companies.reduce((a, d) => a + d.notes.length, 0)} discussion entries · saved to your database as you edit.</p></div>
        <div className="spanel"><h2>Export</h2><p>Every company with its fit, decision, deal stage and next catalyst.</p><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><button className="sec" onClick={() => downloadText(companiesCsv([...companies].sort((a, b) => b.fit - a.fit), today), 'birdnest-all-companies.csv')}>Export all companies (CSV)</button></div></div>
        <div className="spanel edit-only"><h2>Sample data</h2><p>{sampleN ? `${sampleN} sample companies are loaded, each tagged as sample. Remove them when you are ready to run on your own data; your own records are untouched.` : 'Load 60 sample companies, buyers and investors to explore the Hub. They are tagged as sample and can be removed at any time.'}</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{sampleN ? <button className="sec" disabled={busy} onClick={async () => { if (!confirm(`Remove ${sampleN} sample companies?`)) return; setBusy(true); await clearSample(); setBusy(false); }}>{busy ? 'Working…' : 'Remove sample data'}</button> : <button className="primary" disabled={busy} onClick={async () => { setBusy(true); await loadSample(); setBusy(false); }}>{busy ? 'Loading…' : 'Load sample data'}</button>}</div></div>
      </div> : null}
    </section>
  );
}
