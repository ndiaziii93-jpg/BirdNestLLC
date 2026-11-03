'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Modal } from './Modal';
import { useStore, uid } from '@/store/StoreProvider';
import { useUi } from '@/store/UiProvider';
import { DEALS, DEC, DEV_PH, DRUG_PH, KIND, MODS, OWNERSHIP, REGIONS, STG5, TER, DEALS_W } from '@/lib/constants';
import { calcFit, completeness, criteria } from '@/lib/fit';
import { dealName, monogram, phasesFor, rightsOpen, sortedNotes } from '@/lib/derive';
import { emptyBuyBox } from '@/lib/match';
import { fmtDate, todayISO } from '@/lib/dates';
import { atlasName, regionFor } from '@/lib/countries';
import { loadWorld } from '@/lib/world';
import { Lockup, XIcon } from '../Lockup';
import type { BuyBox, Company, Note } from '@/lib/types';

const blank = (today: string): Company => ({
  id: '', kind: 'seeking', name: '', website: '', city: '', cdisp: '', country: '', region: 'Americas', lat: 0, lon: 0, type: 'Drug', seg: 'Posterior', ind: '', asset: '', phase: 'Preclinical', phaseLabel: 'Preclinical',
  trend: 0, dec: 'Watch', deal: 0, cat: '', runway: null, runwayAsOf: null, raise: '', rightsArr: [true, true, true, true, true, true], own: 'Private', founded: '', heads: '', rationale: '',
  scores: [3, 3, 3, 3, 3, 3], why: ['', '', '', '', '', ''], svcScores: [3, 3, 3, 3, 3], svcWhy: ['', '', '', '', ''], prevFit: 60, fit: 60, logo: null, appetite: '', scale: '', lens: 'partnering', ai: null, buyBox: null,
  notes: [{ id: uid(), date: today, type: 'Note', text: 'Added to BirdNest.', priv: false }], sample: false,
});

export function ProfileSheet({ id, preset }: { id: string | null; preset?: Record<string, unknown> }) {
  const { byId, saveCompany, settings, today, companies } = useStore();
  const ui = useUi();
  const isNew = id === null;
  const [d, setD] = useState<Company>(() => (id ? structuredClone(byId(id)!) : { ...blank(today), ...(preset as Partial<Company>) }));
  const [regionSet, setRegionSet] = useState(!!(preset && preset.regionSet));
  const [note, setNote] = useState('');
  const [nameErr, setNameErr] = useState(false);
  const [saving, setSaving] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  useEffect(() => { nameRef.current?.focus(); }, []);

  const set = (patch: Partial<Company>) => setD(x => ({ ...x, ...patch }));
  const SC = criteria(d.lens, settings);
  const scores = d.lens === 'services' ? d.svcScores : d.scores;
  const why = d.lens === 'services' ? d.svcWhy : d.why;
  const fit = calcFit(d, settings), delta = fit - d.prevFit, C = 2 * Math.PI * 44;
  const comp = completeness(d);
  const POST = settings.post, ANT = settings.ant;
  const buyer = d.kind !== 'seeking';
  const newInd = d.ind.trim() && !POST.includes(d.ind.trim()) && !ANT.includes(d.ind.trim());

  const inputsFor = (i: number): string[] => {
    if (d.lens === 'services') return [[d.raise, d.runway != null ? d.runway + ' mo runway' : ''], [d.asset], [d.cat], [dealName(d)], [d.own]][i].filter(Boolean) as string[];
    return [[d.ind + ' · ' + d.seg], [d.asset.split(' · ').slice(2).join(' · ') || d.type], [d.phaseLabel || d.phase], [d.ind, d.type], [dealName(d), rightsOpen(d) + '/6 rights', d.runway != null ? d.runway + ' mo runway' : ''], [d.own, d.raise]][i].filter(Boolean) as string[];
  };

  const onField = (f: keyof Company, raw: string) => {
    const patch: Partial<Company> = {};
    if (f === 'phase') { patch.phase = raw; patch.phaseLabel = raw; }
    else if (f === 'type') { const ph = phasesFor(raw)[0]; Object.assign(patch, { type: raw, phase: ph, phaseLabel: ph }); }
    else if (f === 'ind') { patch.ind = raw; if (ANT.includes(raw)) patch.seg = 'Anterior'; else if (POST.includes(raw)) patch.seg = 'Posterior'; }
    else if (f === 'kind') { patch.kind = raw as Company['kind']; if (raw !== 'seeking' && !d.buyBox) patch.buyBox = emptyBuyBox(raw as 'pharma' | 'investor'); }
    else if (f === 'deal') patch.deal = +raw;
    else if (f === 'runway') patch.runway = raw.replace(/[^0-9]/g, '') === '' ? null : +raw.replace(/[^0-9]/g, '');
    else if (f === 'founded' || f === 'heads') (patch as Record<string, string>)[f] = raw.replace(/[^0-9,]/g, '');
    else if (f === 'region') { patch.region = raw as Company['region']; setRegionSet(true); }
    else (patch as Record<string, unknown>)[f] = raw;
    set(patch);
  };

  const onLogo = async (file: File) => {
    const dataUrl = await new Promise<string>(res => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.readAsDataURL(file); });
    set({ logo: dataUrl });
    try { const r = await fetch('/api/logo', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ companyId: d.id || 'new', dataUrl }) }); if (r.ok) { const j = await r.json(); set({ logo: j.logo }); } } catch { /* keep inline */ }
  };

  const addNote = () => {
    const t = note.trim(); if (!t) return;
    set({ notes: [{ id: uid(), date: today, type: 'Note', text: t, priv: false }, ...d.notes] }); setNote('');
  };

  const save = async () => {
    const nm = d.name.trim(); if (!nm) { setNameErr(true); nameRef.current?.focus(); return; }
    setSaving(true);
    const next: Company = { ...d, name: nm, ind: d.ind.trim(), phaseLabel: d.phase, website: d.website.trim() };
    if (next.ind && !POST.includes(next.ind) && !ANT.includes(next.ind)) {
      // New indications join the picklist of the segment they belong to.
      const { setPicklist } = storeRef.current;
      await setPicklist(next.seg === 'Anterior' ? 'ant' : 'post', [...(next.seg === 'Anterior' ? ANT : POST), next.ind]);
    }
    if (isNew) {
      next.id = uid();
      next.country = atlasName(d.cdisp);
      const known = companies.find(x => x.country === next.country || x.cdisp === d.cdisp);
      if (!regionSet) next.region = known ? known.region : regionFor(next.country);
      const world = await loadWorld();
      const f = world.find(c => c.properties.name === next.country);
      const ctr = { Americas: [-95, 40], Europe: [10, 50], APAC: [120, 30] }[next.region];
      const ll = f ? d3.geoCentroid(f) : ctr;
      next.lon = ll[0] + (Math.random() - 0.5) * 1.5; next.lat = ll[1] + (Math.random() - 0.5) * 1.5;
      next.asset = next.asset || (next.ind ? next.ind + ' · ' + next.type.toLowerCase() : next.type);
      next.cat = next.cat || 'None set';
      next.prevFit = fit;
    } else if (!next.country && d.cdisp) next.country = atlasName(d.cdisp);
    const saved = await saveCompany(next);
    setSaving(false);
    ui.setSel(saved.id);
    ui.close();
  };
  const storeRef = useRef({ setPicklist: useStore().setPicklist });

  const phases = phasesFor(d.type);
  const ownOpts = OWNERSHIP.includes(d.own) || !d.own ? OWNERSHIP : [d.own, ...OWNERSHIP];
  const hasSample = d.sample;

  const field = (label: string, f: keyof Company, opts: { select?: ([string | number, string] | string)[]; wide?: boolean; ph?: string; mono?: boolean; unit?: string; type?: string } = {}) => {
    const v = d[f] as string | number | null;
    if (opts.select) return (
      <label className={`pf ${opts.wide ? 'w' : ''}`}><span>{label}</span>
        <select value={String(v ?? '')} onChange={e => onField(f, e.target.value)}>{opts.select.map(o => { const [val, lab] = Array.isArray(o) ? o : [o, o]; return <option key={String(val)} value={String(val)}>{lab}</option>; })}</select>
      </label>
    );
    return (
      <label className={`pf ${opts.wide ? 'w' : ''}`}><span>{label}{opts.unit ? ' · ' + opts.unit : ''}</span>
        <input type={opts.type || 'text'} value={v == null ? '' : String(v)} placeholder={opts.ph || ''} className={opts.mono ? 'mono' : ''} onChange={e => onField(f, e.target.value)} />
      </label>
    );
  };

  return (
    <Modal label={isNew ? 'New company' : 'Company profile'} id="pmodal">
      <div className="sheet psheet" id="psheet">
        <div className="band" />
        <div className="pbrand">
          <label className="plogo" id="plogo" title="Click to upload company logo">
            { }
            {d.logo ? <img src={d.logo} alt={`${d.name} logo`} /> : <span className="mono">{monogram(d.name)}</span>}
            <span className="lup edit-only">{d.logo ? 'Replace' : 'Add logo'}</span>
            <input type="file" accept="image/*" hidden onChange={e => { const f = e.target.files?.[0]; if (f) onLogo(f); }} />
          </label>
          <div className="pbt"><span className="ovl">{isNew ? 'New company' : 'Company profile'}</span><span className="pbs">{isNew ? 'Public information and your own notes only' : `${d.website || '—'} · ${hasSample ? 'sample data' : 'your record'} · as of ${fmtDate(today)}`}</span></div>
          <span className="sp" />
          <Lockup inverse />
          <span className="vr" />
          <button className="x" aria-label="Close" onClick={ui.close}><XIcon /></button>
        </div>
        <div className="ptop">
          <div className="pid">
            <input ref={nameRef} className={`pname ${nameErr ? 'err' : ''}`} value={d.name} placeholder={isNew ? 'Company name' : ''} aria-label="Company name" onChange={e => { setNameErr(false); onField('name', e.target.value); }} />
            <span className="sight" />
            <span className="cmeta">{[d.city && d.cdisp ? `${d.city}, ${d.cdisp}` : d.city || d.cdisp, d.own, d.founded && `Founded ${d.founded}`, d.heads && `${d.heads} people`, d.type, d.seg].filter(Boolean).join(' · ')}</span>
          </div>
          <div className="pdecw"><span className="ovl">Decision</span>
            <div className="pdec" id="pdec">{(['Pursue', 'Watch', 'Pass'] as const).map(v => <button key={v} className={d.dec === v ? 'on' : ''} style={d.dec === v ? { background: DEC[v][0], color: DEC[v][1] } : undefined} onClick={() => set({ dec: v })}>{v}</button>)}</div>
            <input className="prat" value={d.rationale} placeholder="One-line rationale" onChange={e => onField('rationale', e.target.value)} />
          </div>
          <div className="ring pring" id="pring">
            <svg viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="44" fill="none" stroke="#EEEBE4" strokeWidth="3" /><circle cx="50" cy="50" r="44" fill="none" stroke="#B08D57" strokeWidth="3" strokeDasharray={`${((fit / 100) * C).toFixed(1)} ${C.toFixed(1)}`} style={{ transition: 'stroke-dasharray .3s' }} /></svg>
            <div><b>{fit}</b><small>{delta > 0 ? '▲' + delta : delta < 0 ? '▼' + -delta : '— 0'} vs saved</small></div>
          </div>
        </div>
        <div className="pbody">
          <div className="pleft">
            <section><h3 className="ovl">Company</h3><div className="pgrid">
              {field('Category', 'kind', { select: [['seeking', 'Seeking capital'], ['pharma', 'Big Pharma'], ['investor', 'Investor']], wide: true })}
              {field('Website', 'website', { ph: 'example.com' })}{field('Ownership', 'own', { select: ownOpts })}
              {field('HQ city', 'city')}{field('Country', 'cdisp')}
              {isNew ? field('Region', 'region', { select: [...REGIONS] }) : null}
              {field('Founded', 'founded', { mono: true })}{field('Headcount', 'heads', { mono: true })}
              {buyer ? <>{field(d.kind === 'investor' ? 'Check size' : 'Deal appetite', 'appetite', { ph: d.kind === 'investor' ? '$5–25M per round' : 'In-license Ph2+, $50–150M upfront' })}{field(d.kind === 'investor' ? 'Stage focus' : 'Revenue', 'scale', { ph: d.kind === 'investor' ? 'Seed to Series B' : 'Global · $48B revenue' })}</> : null}
            </div></section>
            <section><h3 className="ovl">{buyer ? (d.kind === 'investor' ? 'Investment focus' : 'Partnering focus') : 'Lead asset'}</h3><div className="pgrid">
              {field(buyer ? 'Focus · one line' : 'Asset · indication · modality', 'asset', { wide: true })}
              {field('Type', 'type', { select: ['Drug', 'Device'] })}{field('Segment', 'seg', { select: ['Anterior', 'Posterior'] })}
              <label className="pf"><span>Indication</span><input list="indList" value={d.ind} placeholder="Pick or type a new one" autoComplete="off" onChange={e => onField('ind', e.target.value)} />
                <datalist id="indList">{[...POST, ...ANT].map(i => <option key={i} value={i} />)}</datalist>
                <small className="pnew" id="pindHint">{newInd ? `New indication · adds to the ${d.seg.toLowerCase()} filter on save` : ''}</small></label>
              {buyer ? <label className="pf"><span>Phase</span><input value="—" readOnly /></label> : field('Phase', 'phase', { select: phases })}
              {field('Next catalyst', 'cat', { wide: true, ph: 'Event · quarter' })}
            </div></section>
            {buyer && d.buyBox ? <BuyBoxEditor kind={d.kind as 'pharma' | 'investor'} bb={d.buyBox} onChange={bb => set({ buyBox: bb })} post={POST} ant={ANT} /> : null}
            <section><h3 className="ovl">Partnering</h3><div className="pgrid">
              {field('Deal stage', 'deal', { select: [...DEALS.map((x, i) => [i, x] as [number, string]), [-1, 'Parked']] })}{field(buyer ? (d.kind === 'investor' ? 'Fund' : 'Recent ophthalmic deal') : 'Last raise', 'raise', { ph: '$58M Series B' })}
              {buyer ? null : <>{field('Cash runway', 'runway', { mono: true, unit: 'months' })}
                <label className="pf"><span>Runway as of</span><input type="date" value={d.runwayAsOf || ''} onChange={e => set({ runwayAsOf: e.target.value || null })} /></label></>}
              <div className="pf w"><span>{buyer ? 'Rights of interest by territory' : 'Rights by territory'}</span>
                <div className="prights" id="prights">{TER.map((t, i) => <button key={t} className={d.rightsArr[i] ? 'on' : ''} aria-pressed={d.rightsArr[i]} onClick={() => { const r = [...d.rightsArr]; r[i] = !r[i]; set({ rightsArr: r }); }}><b className="mono">{t}</b><span>{d.rightsArr[i] ? 'Open' : 'Taken'}</span></button>)}</div></div>
            </div></section>
            <section><h3 className="ovl">Discussions</h3>
              <div className="padd edit-only"><input id="pnote" value={note} placeholder="Add a discussion · Enter to save" onChange={e => setNote(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addNote(); }} /><span className="hint2">Public information and your own notes only</span></div>
              <div id="pnotes" className="pnotes">{sortedNotes(d.notes).length ? sortedNotes(d.notes).map(n => <NoteRow key={n.id} n={n} onToggle={() => set({ notes: d.notes.map(x => (x.id === n.id ? { ...x, priv: !x.priv } : x)) })} onRemove={() => set({ notes: d.notes.filter(x => x.id !== n.id) })} />) : <span className="hint2">No discussions logged.</span>}</div>
            </section>
          </div>
          <div className="pright">
            <div className="phead"><h3 className="ovl">Fit scorecard</h3><span className="hint2">Click 1–5 to score · the ring updates live</span></div>
            <div className="plens" style={{ margin: '10px 0 6px' }}>{(['partnering', 'services'] as const).map(l => <button key={l} className={d.lens === l ? 'on' : ''} onClick={() => set({ lens: l })}>{l === 'partnering' ? 'Partnering lens' : 'Services client lens'}</button>)}</div>
            <div id="pscore">
              {SC.map(([n, w, hint], i) => { const s = scores[i] ?? 0, pts = (s / 5) * w; return (
                <div className="sc" key={n}>
                  <div className="scn"><b>{n}</b><span className="mono">Weight {w}</span></div>
                  <div className="segs" role="radiogroup" aria-label={n}>{[1, 2, 3, 4, 5].map(v => <button key={v} className={`${v <= s ? 'f' : ''} ${v === s ? 'cur' : ''}`} role="radio" aria-checked={v === s} title={`${v} of 5`} onClick={() => { const arr = [...scores]; arr[i] = v; set(d.lens === 'services' ? { svcScores: arr } : { scores: arr }); }}>{v}</button>)}</div>
                  <span className="pts mono">{pts % 1 ? pts.toFixed(1) : pts}<small>/{w}</small></span>
                  <div className="scin"><span className="lbl">Inputs</span>{inputsFor(i).map((x, k) => <i key={k}>{x}</i>)}<span className="hint2">{hint}</span></div>
                  <input className="why" value={why[i] ?? ''} placeholder="One-line justification" onChange={e => { const arr = [...why]; arr[i] = e.target.value; set(d.lens === 'services' ? { svcWhy: arr } : { why: arr }); }} />
                </div>
              ); })}
              <div className="sctot"><span>Weighted sum, scaled to 100 · {d.lens === 'services' ? 'Services client' : 'Partnering'} lens · weights in Settings</span><b className="mono">Fit {fit}</b></div>
            </div>
          </div>
        </div>
        <div className="pfoot">
          <div className="pcomp" id="pcomp"><span>Profile completeness</span><b className="mono">{comp}%</b><span className="cbar"><i style={{ width: `${comp}%` }} /></span></div>
          <span className="sp" /><span className="mfootl">BIRDNEST · NDIII</span>
          <button className="sec" id="pcancel" onClick={ui.close}>Cancel</button>
          <button className="primary edit-only" id="psave" onClick={save} disabled={saving}>{saving ? 'Saving…' : isNew ? 'Add company' : 'Save profile'}</button>
        </div>
      </div>
    </Modal>
  );
}

function NoteRow({ n, onToggle, onRemove }: { n: Note; onToggle: () => void; onRemove: () => void }) {
  return (
    <div className={`nt ${n.priv ? 'priv-note' : ''}`}>
      <span className="mono">{fmtDate(n.date)}</span><span className="ty">{n.type}</span>
      <span>{n.text}{n.priv ? <span className="fa"> · private</span> : null}
        <span className="edit-only" style={{ marginLeft: 8, display: 'inline-flex', gap: 8 }}>
          <button className="lg" style={{ fontSize: 11 }} onClick={onToggle} title={n.priv ? 'Make public' : 'Keep private · never printed'}>{n.priv ? 'Make public' : 'Private'}</button>
          <button className="lg" style={{ fontSize: 11 }} onClick={onRemove} title="Remove">Remove</button>
        </span></span>
    </div>
  );
}

/* ---------- Buy box editor (pharma / investor) ---------- */
function BuyBoxEditor({ kind, bb, onChange, post, ant }: { kind: 'pharma' | 'investor'; bb: BuyBox; onChange: (b: BuyBox) => void; post: string[]; ant: string[] }) {
  const inv = kind === 'investor';
  const [anc, setAnc] = useState<number | null>(null);
  const [newEx, setNewEx] = useState('');
  const [newMoney, setNewMoney] = useState<[string, string]>(['', '']);
  const toggle = (key: 'inds' | 'mods' | 'geo' | 'deals', x: string) => { const a = bb[key]; onChange({ ...bb, [key]: a.includes(x) ? a.filter(v => v !== x) : [...a, x] }); };
  const chips = (label: string, key: 'inds' | 'mods' | 'geo' | 'deals', all: string[]) => (
    <div><div className="sub">{label}</div><div className="chips">{all.map(x => <button key={x} type="button" className={`chip ${bb[key].includes(x) ? 'on' : ''}`} onClick={() => toggle(key, x)}>{x}</button>)}</div></div>
  );
  const allInds = useMemo(() => [...new Set([...bb.inds, ...post, ...ant])], [bb.inds, post, ant]);
  return (
    <section className="bbx"><h3 className="ovl">{inv ? 'Investment thesis · buy box' : 'What they want · buy box'}</h3>
      {chips('Indications', 'inds', allInds)}{chips('Modalities', 'mods', MODS)}
      <div><div className="sub">{inv ? 'Stage window' : 'Phase window'} · click a start, then an end</div>
        <div className="phase edit">{STG5.map((p, i) => <i key={p} className={i >= bb.st[0] && i <= bb.st[1] ? 'in' : ''} title={p} onClick={() => { if (anc === null) { setAnc(i); onChange({ ...bb, st: [i, i] }); } else { onChange({ ...bb, st: [Math.min(anc, i), Math.max(anc, i)] }); setAnc(null); } }} />)}</div>
        <div className="pnames">{STG5.map((p, i) => <span key={p} className={i >= bb.st[0] && i <= bb.st[1] ? 'in' : ''}>{p.replace(' · approved', '')}</span>)}</div></div>
      {inv ? null : <>{chips('Rights wanted', 'geo', [...TER])}{chips('Deal structures', 'deals', DEALS_W)}</>}
      <div><div className="sub">Excludes</div><div className="chips">{bb.excl.map(x => <button key={x} type="button" className="chip no" title="Remove" onClick={() => onChange({ ...bb, excl: bb.excl.filter(v => v !== x) })}>{x} ×</button>)}</div>
        <div className="addrow" style={{ marginTop: 6 }}><input value={newEx} placeholder="Add an exclusion" onChange={e => setNewEx(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && newEx.trim()) { onChange({ ...bb, excl: [...bb.excl, newEx.trim()] }); setNewEx(''); } }} /><button type="button" onClick={() => { if (newEx.trim()) { onChange({ ...bb, excl: [...bb.excl, newEx.trim()] }); setNewEx(''); } }}>Add</button></div></div>
      <div><div className="sub">Economics</div>
        {bb.money.map((m, i) => <div key={i} className="mrow2"><input className="prat" value={m[0]} onChange={e => { const a = bb.money.map((x, k) => (k === i ? [e.target.value, x[1]] as [string, string] : x)); onChange({ ...bb, money: a }); }} /><input className="prat mono" value={m[1]} onChange={e => { const a = bb.money.map((x, k) => (k === i ? [x[0], e.target.value] as [string, string] : x)); onChange({ ...bb, money: a }); }} /><button type="button" onClick={() => onChange({ ...bb, money: bb.money.filter((_, k) => k !== i) })}>×</button></div>)}
        <div className="addrow" style={{ marginTop: 6 }}><input value={newMoney[0]} placeholder={inv ? 'Check size' : 'Upfront'} onChange={e => setNewMoney([e.target.value, newMoney[1]])} /><input value={newMoney[1]} placeholder="$5–25M" onChange={e => setNewMoney([newMoney[0], e.target.value])} /><button type="button" onClick={() => { if (newMoney[0].trim()) { onChange({ ...bb, money: [...bb.money, [newMoney[0].trim(), newMoney[1].trim()]] }); setNewMoney(['', '']); } }}>Add</button></div></div>
      <div className="pgrid"><label className="pf"><span>Contact</span><input value={bb.contact} placeholder="Name · title" onChange={e => onChange({ ...bb, contact: e.target.value })} /></label>
        <label className="pf"><span>Where met</span><input value={bb.whereMet} placeholder="Congress or source" onChange={e => onChange({ ...bb, whereMet: e.target.value })} /></label></div>
    </section>
  );
}

export { DRUG_PH, DEV_PH, KIND, todayISO };
