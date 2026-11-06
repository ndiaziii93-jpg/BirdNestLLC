'use client';
import { useMemo, useRef, useState } from 'react';
import { Modal } from './Modal';
import { useStore, uid } from '@/store/StoreProvider';
import { useUi } from '@/store/UiProvider';
import { applyDraft, findMatch, newIndications, type Draft } from '@/lib/importer';
import { KIND } from '@/lib/constants';
import { XIcon } from '../Lockup';
import type { Company } from '@/lib/types';

type FileRow = { key: string; name: string; status: 'reading' | 'done' | 'error'; message: string; count: number; cda: string | null };
type Row = { key: string; file: string; include: boolean; open: boolean; d: Draft };

const ACCEPT = '.pptx,.docx,.pdf,.md,.markdown,.txt,.json';
const steps = ['Add files', 'Review', 'Done'];
const FIELDS: [keyof Draft, string][] = [['city', 'HQ city'], ['country', 'Country'], ['own', 'Ownership'], ['founded', 'Founded'], ['ind', 'Lead indication'], ['asset', 'Lead asset'], ['phase', 'Stage'], ['cat', 'Next catalyst'], ['raise', 'Last raise'], ['seeking', 'Seeking'], ['website', 'Website'], ['heads', 'Headcount']];

export function ImportSheet() {
  const { companies, settings, today, saveCompany, setPicklist, findLogo } = useStore();
  const ui = useUi();
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState<FileRow[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [saved, setSaved] = useState<{ c: Company; updated: boolean }[]>([]);
  const [failed, setFailed] = useState<{ d: Draft; why: string }[]>([]);
  const [logos, setLogos] = useState<Record<string, { state: 'waiting' | 'finding' | 'found' | 'none'; msg: string }>>({});
  const inp = useRef<HTMLInputElement>(null);

  const reading = files.some(f => f.status === 'reading');
  const included = rows.filter(r => r.include && r.d.name.trim());

  const readFiles = async (list: FileList | File[]) => {
    const arr = [...list];
    if (!arr.length) return;
    const fresh = arr.map(f => ({ key: uid(), name: f.name, status: 'reading' as const, message: '', count: 0, cda: null }));
    setFiles(fs => [...fs, ...fresh]);
    for (let i = 0; i < arr.length; i++) {
      const f = arr[i], key = fresh[i].key;
      const set = (patch: Partial<FileRow>) => setFiles(fs => fs.map(x => (x.key === key ? { ...x, ...patch } : x)));
      if (f.size > 4 * 1024 * 1024) { set({ status: 'error', message: 'Over 4 MB. Export without images or split it.' }); continue; }
      try {
        const body = new FormData(); body.append('file', f);
        const r = await fetch('/api/import', { method: 'POST', body });
        const j = await r.json().catch(() => ({ error: r.statusText }));
        if (!r.ok) { set({ status: 'error', message: j.error || 'Could not read the file.' }); continue; }
        const ds = j.companies as Draft[];
        setRows(rs => [...rs, ...ds.map(d => ({ key: uid(), file: f.name, include: true, open: false, d }))]);
        set({ status: 'done', count: ds.length, cda: j.cdaWarning || null, message: (j.errors || []).join(' · ') });
      } catch (e) { set({ status: 'error', message: e instanceof Error ? e.message : String(e) }); }
    }
  };

  const setDraft = (key: string, patch: Partial<Draft>) => setRows(rs => rs.map(r => (r.key === key ? { ...r, d: { ...r.d, ...patch } } : r)));
  const setRow = (key: string, patch: Partial<Row>) => setRows(rs => rs.map(r => (r.key === key ? { ...r, ...patch } : r)));

  /** Saves the drafts one by one. Each result is recorded, so a failed save is reported, never counted as imported. */
  const saveDrafts = async (drafts: Draft[]) => {
    setBusy(true);
    const fresh = newIndications(drafts, settings);
    if (fresh.post.length) await setPicklist('post', [...settings.post, ...fresh.post]);
    if (fresh.ant.length) await setPicklist('ant', [...settings.ant, ...fresh.ant]);
    const s2 = { ...settings, post: [...settings.post, ...fresh.post], ant: [...settings.ant, ...fresh.ant] };
    const [{ loadWorld }, d3] = await Promise.all([import('@/lib/world'), import('d3')]);
    const world = await loadWorld().catch(() => []);
    const ok: { c: Company; updated: boolean }[] = [];
    const bad: { d: Draft; why: string }[] = [];
    let pool = companies;
    const CTR = { Americas: [-95, 40], Europe: [10, 50], APAC: [120, 30] } as Record<string, [number, number]>;
    for (const d of drafts) {
      const existing = findMatch(pool, d);
      let lonLat: [number, number] | null = null;
      if (!existing) {
        const country = (d.country || '').trim().toLowerCase();
        const f = world.find(w => w.properties.name.toLowerCase() === country);
        lonLat = f ? (d3.geoCentroid(f) as [number, number]) : d.region ? CTR[d.region] : null;
      }
      const c = applyDraft(existing, d, { settings: s2, today, uid, lonLat });
      if (!existing && c.lat === 0 && c.lon === 0) { const ctr = CTR[c.region]; c.lon = ctr[0] + (Math.random() - 0.5) * 1.5; c.lat = ctr[1] + (Math.random() - 0.5) * 1.5; }
      try {
        const savedC = await saveCompany(c, { strict: true });
        ok.push({ c: savedC, updated: !!existing });
        pool = existing ? pool.map(x => (x.id === savedC.id ? savedC : x)) : [...pool, savedC];
      } catch (e) {
        bad.push({ d, why: (e instanceof Error ? e.message : String(e)).replace(/^POST \/api\/companies failed /, '') });
      }
    }
    setSaved(s => [...s, ...ok]);
    setFailed(bad);
    if (ok[0]) ui.setSel(ok[0].c.id);
    setBusy(false);
    setStep(3);
    // Claude finds a logo for every saved company that has none; you check them afterwards.
    const need = ok.map(o => o.c).filter(c => !c.logo && !c.sample);
    setLogos(l => ({ ...l, ...Object.fromEntries(need.map(c => [c.id, { state: 'waiting' as const, msg: '' }])) }));
    for (const c of need) {
      setLogos(l => ({ ...l, [c.id]: { state: 'finding', msg: '' } }));
      const r = await findLogo(c.id);
      setLogos(l => ({ ...l, [c.id]: { state: r.ok ? 'found' : 'none', msg: r.message } }));
    }
  };
  const save = () => saveDrafts(included.map(r => r.d));

  const matches = useMemo(() => new Map(rows.map(r => [r.key, findMatch(companies, r.d)])), [rows, companies]);
  const cdaFiles = files.filter(f => f.cda);

  let body: React.ReactNode, foot: React.ReactNode;
  if (step === 1) {
    body = (
      <div className="aq imp">
        <h2>Import company profiles</h2>
        <p>Add the profiles, decks and notes you have written elsewhere. Claude reads each document and fills the BirdNest fields; you review every company before anything is saved. A company that already exists is updated, never duplicated.</p>
        <label className={`idrop ${drag ? 'over' : ''}`} onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={e => { e.preventDefault(); setDrag(false); readFiles(e.dataTransfer.files); }}>
          <input ref={inp} id="import-files" type="file" multiple accept={ACCEPT} onChange={e => { if (e.target.files) readFiles(e.target.files); e.target.value = ''; }} />
          <b>Drop files here or choose files</b>
          <span>PowerPoint (.pptx), Word (.docx), PDF, Markdown, text, or BirdNest JSON · up to 4 MB each · one or many companies per file</span>
        </label>
        {files.length ? (
          <div className="ifiles">{files.map(f => (
            <div key={f.key} className={`ifile ${f.status}`}>
              <span className="nm">{f.name}</span>
              <span className="st">{f.status === 'reading' ? 'Reading…' : f.status === 'error' ? f.message : `${f.count} ${f.count === 1 ? 'company' : 'companies'}${f.message ? ' · ' + f.message : ''}`}</span>
            </div>
          ))}</div>
        ) : null}
        {cdaFiles.length ? <div className="icda"><b>Check the data rule.</b> {cdaFiles.map(f => `${f.name}: ${f.cda}`).join(' · ')} BirdNest holds public information and your own notes only; remove anything under a CDA before importing.</div> : null}
        <div className="drule" style={{ fontSize: 13 }}><span><b>Public information and your own notes only.</b> Nothing under a CDA.</span></div>
      </div>
    );
    foot = <><button className="sec" onClick={() => inp.current?.click()}>Choose files</button><span className="sp" /><button className="primary" disabled={reading || !rows.length} onClick={() => setStep(2)}>{reading ? 'Reading files…' : `Review ${rows.length} ${rows.length === 1 ? 'company' : 'companies'}`}</button></>;
  } else if (step === 2) {
    body = (
      <div className="arev imp">
        <div className="ahead"><div><h2>Review before saving</h2><p>Untick anything you don&apos;t want. Edit any field; fields marked “check” were inferred rather than read. Existing companies keep their scores and notes; only the fields shown here are updated, and imported notes are added.</p></div></div>
        <div className="irows">{rows.map(r => {
          const m = matches.get(r.key), d = r.d, low = new Set(d.lowConfidence);
          return (
            <div key={r.key} className={`irow2 ${r.include ? '' : 'off'}`}>
              <div className="ih">
                <input type="checkbox" checked={r.include} aria-label={`Import ${d.name}`} onChange={e => setRow(r.key, { include: e.target.checked })} />
                <input className="iname" value={d.name} aria-label="Company name" onChange={e => setDraft(r.key, { name: e.target.value })} />
                <span className={`itag ${m ? 'upd' : 'new'}`}>{m ? `Updates ${m.name}` : 'New'}</span>
                <span className="kchip">{KIND[d.kind].short}</span>
                <span className="ifn">{r.file}</span>
                <button className="ibtn2" onClick={() => setRow(r.key, { open: !r.open })} aria-expanded={r.open}>{r.open ? 'Hide fields' : 'Edit fields'}</button>
              </div>
              <div className="isum">{[d.city && d.country ? `${d.city}, ${d.country}` : d.city || d.country, d.asset, d.phase, d.notes.length ? `${d.notes.length} note${d.notes.length === 1 ? '' : 's'}` : ''].filter(Boolean).join(' · ') || 'No details found yet'}</div>
              {r.open ? (
                <div className="ibody">
                  <div className="agrid">
                    <label className="pf"><span>Category</span><select value={d.kind} onChange={e => setDraft(r.key, { kind: e.target.value as Draft['kind'] })}><option value="seeking">Seeking capital</option><option value="pharma">Big Pharma</option><option value="investor">Investor</option></select></label>
                    <label className="pf"><span>Type</span><select value={d.type || 'Drug'} onChange={e => setDraft(r.key, { type: e.target.value as Draft['type'] })}><option>Drug</option><option>Device</option></select></label>
                    <label className="pf"><span>Segment</span><select value={d.seg || ''} onChange={e => setDraft(r.key, { seg: (e.target.value || null) as Draft['seg'] })}><option value="">From indication</option><option>Posterior</option><option>Anterior</option></select></label>
                    {FIELDS.map(([k, l]) => (
                      <label key={k} className="pf"><span>{l}{low.has(k) ? <em className="cf low">check</em> : null}</span><input value={String(d[k] ?? '')} placeholder="Not stated" onChange={e => setDraft(r.key, { [k]: e.target.value || null } as Partial<Draft>)} /></label>
                    ))}
                  </div>
                  <label className="pf"><span>Overview{low.has('overview') ? <em className="cf low">check</em> : null}</span><textarea rows={3} value={d.overview || ''} onChange={e => setDraft(r.key, { overview: e.target.value || null })} /></label>
                  {d.notes.length ? <div className="inotes"><span className="ovl">Notes to add</span>{d.notes.map((n, i) => <div key={i}><span className="mono">{n.date || 'today'}</span><span className="ty">{n.type}</span><span>{n.text}{n.private ? <span className="fa"> · private</span> : null}</span></div>)}</div> : null}
                </div>
              ) : null}
            </div>
          );
        })}</div>
      </div>
    );
    foot = <><button className="sec" onClick={() => setStep(1)}>Add more files</button><span className="sp" /><button className="primary" disabled={busy || !included.length} onClick={save}>{busy ? 'Saving…' : `Import ${included.length} ${included.length === 1 ? 'company' : 'companies'}`}</button></>;
  } else {
    const nNew = saved.filter(s => !s.updated).length, nUpd = saved.length - nNew, total = saved.length + failed.length;
    body = (
      <div className="aq imp">
        <h2>{failed.length ? `Imported ${saved.length} of ${total} companies` : `Imported ${saved.length} ${saved.length === 1 ? 'company' : 'companies'}`}</h2>
        <p>{nNew} new · {nUpd} updated{failed.length ? ` · ${failed.length} not saved` : ''}. Each profile is open for scoring and tweaks; fit stays at the default until you score it.</p>
        {Object.keys(logos).length ? <p className="hint2">{Object.values(logos).some(x => x.state === 'waiting' || x.state === 'finding') ? `Claude is finding logos: ${Object.values(logos).filter(x => x.state === 'found' || x.state === 'none').length} of ${Object.keys(logos).length} done. You can close this; it carries on while the Hub is open.` : `Logos found for ${Object.values(logos).filter(x => x.state === 'found').length} of ${Object.keys(logos).length}. Check them in Settings → Data → Logos, or on each company.`}</p> : null}
        {failed.length ? (
          <div className="icda" role="alert"><b>{failed.length === 1 ? '1 company was not saved.' : `${failed.length} companies were not saved.`}</b> Nothing was half-written; retry below. If it fails again, send the reason shown to whoever maintains the Hub.
            <div className="ifiles ifail">{failed.map((f, i) => <div key={i} className="ifile error"><span className="nm">{f.d.name}</span><span className="st">{f.why}</span></div>)}</div>
          </div>
        ) : null}
        {saved.length ? <div className="ifiles">{saved.map(s => (
          <button key={s.c.id} className="ifile done ilink" onClick={() => ui.replace({ kind: 'account', id: s.c.id })}><span className="nm">{s.c.name}</span><span className="st">{s.updated ? 'Updated' : 'New'}{logos[s.c.id] ? ' · ' + ({ waiting: 'logo queued', finding: 'finding logo…', found: 'logo found, check it', none: 'no logo found' } as const)[logos[s.c.id].state] : ''} · open</span></button>
        ))}</div> : null}
      </div>
    );
    foot = <>{failed.length ? <button className="sec" disabled={busy} onClick={() => saveDrafts(failed.map(f => f.d))}>{busy ? 'Retrying…' : `Retry ${failed.length} not saved`}</button> : null}<span className="sp" /><button className="primary" disabled={busy} onClick={ui.close}>Done</button></>;
  }

  return (
    <Modal label="Import company profiles" id="imodal" lock={busy || reading}>
      <div className="sheet asheet" id="isheet">
        <div className="pbrand">
          <span className="plogo" style={{ cursor: 'default' }}><span className="mono">↥</span></span>
          <div className="pbt"><span className="ovl">Import</span><span className="pbs">Company profiles from your documents</span></div><span className="sp" />
          <div className="asteps">{steps.map((s, i) => <span key={s} className={step === i + 1 ? 'on' : step > i + 1 ? 'done' : ''}><i>{i + 1}</i>{s}</span>)}</div>
          <span className="vr" /><button className="x" aria-label="Close" onClick={() => { if (!busy && !reading) ui.close(); }}><XIcon /></button>
        </div>
        <div className="abody">{body}</div>
        <div className="afoot">{foot}</div>
      </div>
    </Modal>
  );
}
