'use client';
import { useEffect, useRef, useState } from 'react';
import { Modal } from './Modal';
import { useStore, uid } from '@/store/StoreProvider';
import { useUi } from '@/store/UiProvider';
import { DEV_PH, DRUG_PH, REGIONS, STG5 } from '@/lib/constants';
import { calcFitFrom } from '@/lib/fit';
import { monogram } from '@/lib/derive';
import { isoDaysAgo } from '@/lib/dates';
import { atlasName } from '@/lib/countries';
import { XIcon } from '../Lockup';
import type { ResearchT, AssessmentT } from '@/lib/claude';
import type { Company, Note } from '@/lib/types';

type Step = 1 | 2 | 3;
const F: [keyof ResearchT, string][] = [['kind', 'Category · seeking, pharma or investor'], ['city', 'HQ city'], ['country', 'Country'], ['region', 'Region'], ['own', 'Ownership'], ['founded', 'Founded'], ['heads', 'Headcount'], ['type', 'Type'], ['seg', 'Segment'], ['ind', 'Lead indication'], ['asset', 'Lead asset'], ['phase', 'Phase'], ['cat', 'Next catalyst'], ['raise', 'Last raise'], ['seeking', 'Seeking'], ['appetite', 'Deal appetite · check size'], ['scale', 'Revenue · stage focus']];
const host = (w: string) => { try { return new URL(/^https?:/.test(w) ? w : 'https://' + w).hostname.replace(/^www\./, ''); } catch { return ''; } };
const steps = ['Quick add', 'Claude research', 'Your input'];

export function AddSheet() {
  const { settings, today, saveCompany, setPicklist } = useStore();
  const ui = useUi();
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState(''); const [web, setWeb] = useState(''); const [hq, setHq] = useState('');
  const [res, setRes] = useState<ResearchT | null>(null);
  const [qa, setQa] = useState<{ q: string; a: string }[]>([]);
  const [notes, setNotes] = useState(''); const [notesPriv, setNotesPriv] = useState(false);
  const [logoOn, setLogoOn] = useState(true);
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const [rot, setRot] = useState(0);
  const nameRef = useRef<HTMLInputElement>(null);
  useEffect(() => { nameRef.current?.focus(); }, [step]);
  useEffect(() => { if (!busy) return; const t = setInterval(() => setRot(k => (k + 1) % 8), 120); return () => clearInterval(t); }, [busy]);
  const logoUrl = () => (host(web) ? `https://www.google.com/s2/favicons?domain=${host(web)}&sz=128` : '');

  const research = async () => {
    if (!name.trim()) { setErr('Add a company name first.'); return; }
    setBusy(true); setErr('');
    try {
      const r = await fetch('/api/research', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name, web, hq }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || r.statusText);
      const rr = j as ResearchT;
      setRes(rr);
      const qs = (rr.questions || []).slice(0, 6);
      setQa((qs.length ? qs : ['How do you know this company, and where did you meet?', 'What deal stage are you at with them?', 'How does their lead asset fit your portfolio?', 'Any rights, economics or timing you have heard?']).map(q => ({ q, a: '' })));
      setStep(2);
    } catch (e) { setErr((e instanceof Error ? e.message : String(e)) + ' Try again or fill in manually.'); }
    setBusy(false);
  };

  const finish = async () => {
    const answered = qa.filter(q => q.a.trim());
    if (!answered.length && !notes.trim()) return build(null);
    setBusy(true); setErr('');
    try {
      const r = await fetch('/api/assess', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ research: res, qa, notes }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || r.statusText);
      await build(j as AssessmentT);
    } catch (e) { setBusy(false); setErr((e instanceof Error ? e.message : String(e)) + ' Try again or skip questions.'); }
  };

  const build = async (x: AssessmentT | null) => {
    setBusy(true);
    const r = res || ({} as Partial<ResearchT>);
    const ty: Company['type'] = r.type === 'Device' ? 'Device' : 'Drug', PH = ty === 'Device' ? DEV_PH : DRUG_PH;
    const kind: Company['kind'] = r.kind === 'pharma' || r.kind === 'investor' ? r.kind : 'seeking';
    const phase = kind !== 'seeking' ? '' : (PH as readonly string[]).includes(r.phase || '') ? (r.phase as string) : PH[0];
    const scores = x && Array.isArray(x.scores) && x.scores.length === 6 ? x.scores.map(v => Math.max(1, Math.min(5, Math.round(+v) || 3))) : [3, 3, 3, 3, 3, 3];
    const why = x && Array.isArray(x.why) ? [0, 1, 2, 3, 4, 5].map(i => String(x.why[i] || '')) : ['', '', '', '', '', ''];
    const deal = x && Number.isInteger(x.deal) && x.deal >= -1 && x.deal <= 6 ? x.deal : 0;
    const ns: Note[] = [{ id: uid(), date: today, type: 'Note', text: 'Added to BirdNest with Claude research.', priv: false }];
    if (x && Array.isArray(x.notes)) x.notes.forEach(n => ns.push({ id: uid(), date: isoDaysAgo(Math.max(0, Math.round(+n.daysAgo) || 0), today), type: n.type || 'Note', text: String(n.text || ''), priv: notesPriv }));
    else if (notes.trim()) ns.push({ id: uid(), date: today, type: 'Note', text: notes.trim(), priv: notesPriv });
    const fit = calcFitFrom(scores, settings.weights);
    const asset = r.asset || (r.ind ? r.ind + ' · ' + ty.toLowerCase() : ty);
    const ind = (r.ind || '').trim();
    const seg: Company['seg'] = r.seg === 'Anterior' ? 'Anterior' : settings.ant.includes(ind) ? 'Anterior' : 'Posterior';
    if (ind && !settings.post.includes(ind) && !settings.ant.includes(ind)) await setPicklist(seg === 'Anterior' ? 'ant' : 'post', [...(seg === 'Anterior' ? settings.ant : settings.post), ind]);
    const country = atlasName(r.country || '');
    const region: Company['region'] = (REGIONS as readonly string[]).includes(r.region || '') ? (r.region as Company['region']) : 'Americas';
    const bb = r.buyBox && kind !== 'seeking' ? { inds: r.buyBox.inds || [], mods: r.buyBox.mods || [], st: [Math.max(0, Math.min(4, r.buyBox.stStart ?? 0)), Math.max(0, Math.min(4, r.buyBox.stEnd ?? 4))] as [number, number], geo: r.buyBox.geo || [], deals: r.buyBox.deals || [], excl: r.buyBox.excl || [], money: (r.buyBox.money || []).map(m => [m.label, m.value] as [string, string]), contact: r.buyBox.contact || '', whereMet: (x && x.whereMet) || '' } : null;
    let logo: string | null = logoOn && logoUrl() ? logoUrl() : null;
    const id = uid();
    if (logo) { try { const lr = await fetch('/api/logo', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ companyId: id, url: logo }) }); if (lr.ok) logo = (await lr.json()).logo; } catch { /* keep favicon url */ } }
    const { loadWorld } = await import('@/lib/world'); const d3 = await import('d3');
    const world = await loadWorld(); const f = world.find(c => c.properties.name === country);
    const ctr = { Americas: [-95, 40], Europe: [10, 50], APAC: [120, 30] }[region];
    const ll = f ? d3.geoCentroid(f) : ctr;
    const c: Company = {
      id, kind, name: name.trim(), website: host(web) || web, city: r.city || hq || '', cdisp: r.country || '', country, region, lat: ll[1] + (Math.random() - 0.5) * 1.5, lon: ll[0] + (Math.random() - 0.5) * 1.5,
      type: ty, seg, ind, asset, phase, phaseLabel: phase || '—', trend: 0, dec: x && ['Pursue', 'Watch', 'Pass'].includes(x.dec) ? x.dec : fit >= 76 ? 'Pursue' : fit >= 50 ? 'Watch' : 'Pass', deal, cat: r.cat || '',
      runway: null, runwayAsOf: null, raise: r.raise || '', rightsArr: [true, true, true, true, true, true], own: r.own || 'Private', founded: r.founded ? String(r.founded) : '', heads: r.heads ? String(r.heads) : '',
      rationale: (x && x.rationale) || '', scores, why, svcScores: [3, 3, 3, 3, 3], svcWhy: ['', '', '', '', ''], prevFit: fit, fit, logo, appetite: r.appetite || '', scale: r.scale || '', lens: 'partnering',
      ai: { overview: r.overview || '', diffs: (r.diffs || []).filter(Boolean).slice(0, 3), risk: r.risk || '', seeking: (x && x.seeking) || r.seeking || 'Not stated', timing: (x && x.timing) || 'Not stated',
        pipe: kind === 'seeking' ? [[asset.split(' · ')[0], asset.split(' · ').slice(1).join(' · ') || ind || '', ty === 'Device' ? [3, 6, 9][DEV_PH.indexOf(phase as (typeof DEV_PH)[number])] ?? 3 : ({ Preclinical: 1, 'Phase 1': 3, 'Phase 2': 5, 'Phase 3': 7, 'Phase 4': 9 } as Record<string, number>)[phase] ?? 1, r.cat || '—']] : [],
        econ: [], contacts: bb && bb.contact ? [[bb.contact.split(' · ')[0], bb.contact.split(' · ').slice(1).join(' · ') || 'Contact']] : [], rel: [['Where met', (x && x.whereMet) || 'Not recorded'], ...(x && x.nextStep ? [['Next step', x.nextStep] as [string, string]] : [])] },
      buyBox: bb, notes: ns, sample: false,
    };
    const saved = await saveCompany(c);
    setBusy(false);
    ui.setSel(saved.id);
    ui.replace({ kind: 'account', id: saved.id });
  };

  const RING = <svg className="lring" viewBox="21 21 22 22" width="40" height="40" fill="none" style={{ transform: `rotate(${rot * 45}deg)` }}><path d="M38.56 28.17 A7.6 7.6 0 1 1 35.83 25.44" stroke="#0F4C52" strokeWidth="4.4" /><circle cx="30.8" cy="32.3" r="3.2" fill="#B08D57" /></svg>;
  const cf = (k: string) => (res?.confidence?.[k] || (res && (res as Record<string, unknown>)[k] ? 'medium' : 'low')) as string;
  const setR = (k: keyof ResearchT, v: string) => setRes(r => (r ? { ...r, [k]: v } : r));

  let body: React.ReactNode, foot: React.ReactNode;
  if (busy) {
    body = <div className="aload">{RING}<b>{step === 1 ? 'Researching ' + name : 'Scoring and drafting the profile'}</b><span>{step === 1 ? 'Searching the web for what is publicly known: HQ, ownership, lead asset, phase, catalysts, financing.' : 'Turning your answers into scorecard justifications, deal stage and notes.'}</span></div>;
    foot = <span className="mu" style={{ fontSize: 12 }}>This takes a few seconds</span>;
  } else if (step === 1) {
    body = <div className="aq"><h2>Who are we adding?</h2><p>Start with a name and a website. Claude searches public sources, fills in what is known, then asks you a few questions to complete the assessment.</p>
      <label className="pf"><span>Company name</span><input ref={nameRef} value={name} placeholder="e.g. Lumen Ocular" onChange={e => setName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') research(); }} /></label>
      <label className="pf"><span>Website</span><input value={web} placeholder="example.com" onChange={e => setWeb(e.target.value)} /></label>
      <label className="pf"><span>HQ city · optional</span><input value={hq} placeholder="Helps when names are common" onChange={e => setHq(e.target.value)} /></label>
      <div className="drule" style={{ fontSize: 13 }}><span><b>Public information and your own notes only.</b> Nothing under a CDA.</span></div>
      {err ? <p className="aerr">{err}</p> : null}</div>;
    foot = <><button className="sec" onClick={() => ui.replace({ kind: 'new', preset: { type: 'Drug', name, website: web, city: hq } })}>Skip and fill in manually</button><span className="sp" /><button className="primary" onClick={research}>Research with Claude</button></>;
  } else if (step === 2 && res) {
    body = <div className="arev"><div className="ahead"><div><h2>{res.found === false ? 'Little public information found' : 'Here is what Claude found'}</h2><p>From a web search of public sources{res.sources?.length ? ` (${res.sources.length} pages)` : ''}. Check anything marked low and edit freely.</p></div>
      {logoUrl() ? <label className="alogo"><img src={logoUrl()} alt="" onError={e => e.currentTarget.parentElement?.classList.add('nologo')} /><span><b>Logo</b><small>From {host(web)}</small></span><input type="checkbox" checked={logoOn} onChange={e => setLogoOn(e.target.checked)} /><span className="sw" /></label> : null}</div>
      <div className="agrid">{F.map(([k, l]) => <label key={k} className="pf"><span>{l}<em className={`cf ${cf(k)}`}>{cf(k)}</em></span><input value={String(res[k] ?? '')} placeholder="Unknown" onChange={e => setR(k, e.target.value)} /></label>)}</div>
      <div className="atext"><label className="pf"><span>Overview<em className={`cf ${res.confidence?.overview || 'medium'}`}>{res.confidence?.overview || 'medium'}</em></span><textarea rows={3} value={res.overview || ''} onChange={e => setR('overview', e.target.value)} /></label>
        {[0, 1, 2].map(i => <label key={i} className="pf"><span>Differentiator {i + 1}</span><input value={(res.diffs || [])[i] || ''} onChange={e => setRes(r => { if (!r) return r; const d = [...(r.diffs || [])]; d[i] = e.target.value; return { ...r, diffs: d }; })} /></label>)}
        <label className="pf"><span>Key risk</span><input value={res.risk || ''} onChange={e => setR('risk', e.target.value)} /></label>
        {res.buyBox ? <p className="hint2">Buy box drafted: {res.buyBox.inds.join(', ') || 'no indications'} · {res.buyBox.mods.join(', ') || 'no modalities'} · {STG5[res.buyBox.stStart] || ''} to {STG5[res.buyBox.stEnd] || ''}. Edit it on the profile after saving.</p> : null}
        {res.sources?.length ? <p className="hint2">Sources: {res.sources.slice(0, 5).map(s => host(s)).join(', ')}</p> : null}</div></div>;
    foot = <><button className="sec" onClick={() => { setStep(1); setErr(''); }}>Back</button><span className="sp" /><button className="primary" onClick={() => setStep(3)}>Looks right · next</button></>;
  } else {
    body = <div className="aq"><h2>A few questions only you can answer</h2><p>Your answers become the scorecard justifications, the deal stage and the first discussion entries. Skip any you don&apos;t know yet.</p>
      {qa.map((q, i) => <label key={i} className="pf"><span>{i + 1}. {q.q}</span><textarea rows={2} placeholder="Your answer" value={q.a} onChange={e => setQa(a => a.map((x, k) => (k === i ? { ...x, a: e.target.value } : x)))} /></label>)}
      <label className="pf"><span>Anything else · notes and insight</span><textarea rows={3} placeholder="What you know, what you think, what to watch" value={notes} onChange={e => setNotes(e.target.value)} /></label>
      <button className={`dpriv ${notesPriv ? 'on' : ''}`} aria-pressed={notesPriv} onClick={() => setNotesPriv(p => !p)}><i />Keep my notes private (never printed)</button>
      {err ? <p className="aerr">{err}</p> : null}</div>;
    foot = <><button className="sec" onClick={() => { setStep(2); setErr(''); }}>Back</button><span className="sp" /><button className="sec" onClick={() => build(null)}>Skip questions</button><button className="primary" onClick={finish}>Build profile</button></>;
  }

  return (
    <Modal label="Add company" id="amodal" lock={busy}>
      <div className="sheet asheet" id="asheet">
        <div className="pbrand">
          <span className="plogo" style={{ cursor: 'default' }}>{step > 1 && logoOn && logoUrl() ? <img src={logoUrl()} alt="" onError={e => e.currentTarget.remove()} /> : <span className="mono">{monogram(name || '+')}</span>}</span>
          <div className="pbt"><span className="ovl">New company</span><span className="pbs">{name || 'Public information and your own notes only'}</span></div><span className="sp" />
          <div className="asteps">{steps.map((s, i) => <span key={s} className={step === i + 1 ? 'on' : step > i + 1 ? 'done' : ''}><i>{i + 1}</i>{s}</span>)}</div>
          <span className="vr" /><button className="x" aria-label="Close" onClick={() => { if (!busy) ui.close(); }}><XIcon /></button>
        </div>
        <div className="abody">{body}</div>
        <div className="afoot">{foot}</div>
      </div>
    </Modal>
  );
}
