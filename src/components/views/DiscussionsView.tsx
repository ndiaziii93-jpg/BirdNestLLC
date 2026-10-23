'use client';
import { useMemo, useState } from 'react';
import { useStore } from '@/store/StoreProvider';
import { useUi } from '@/store/UiProvider';
import { NOTE_TYPES } from '@/lib/constants';
import { lastTouch } from '@/lib/derive';
import { daysAgo, fmtDate, monthLabel } from '@/lib/dates';
import { Seg, Toggle } from '../bits';
import { LockIcon, SearchIcon } from '../Lockup';
import { ViewHead } from './ViewHead';
import { EmptyState } from '../dashboard/EmptyState';
import type { Company, NoteType } from '@/lib/types';

interface Row { d: Company; id: string; date: string; off: number; type: NoteType; text: string; priv: boolean }

export function DiscussionsView() {
  const { companies, today, addNote } = useStore();
  const ui = useUi();
  const [type, setType] = useState('All'); const [hidePriv, setHidePriv] = useState(false); const [q, setQ] = useState('');
  const [form, setForm] = useState({ cid: '', type: 'Call' as NoteType, text: '', date: today, priv: false });
  const sorted = useMemo(() => [...companies].sort((a, b) => a.name.localeCompare(b.name)), [companies]);
  const cid = form.cid || sorted[0]?.id || '';
  const all: Row[] = useMemo(() => { const o: Row[] = []; companies.forEach(d => d.notes.forEach(n => o.push({ d, id: n.id, date: n.date, off: daysAgo(n.date, today), type: n.type, text: n.text, priv: n.priv }))); return o.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)); }, [companies, today]);
  const ql = q.toLowerCase();
  const list = all.filter(n => (type === 'All' || n.type === type) && (!hidePriv || !n.priv) && (!ql || (n.d.name + ' ' + n.text).toLowerCase().includes(ql)));
  const groups: { m: string; items: Row[] }[] = []; list.forEach(n => { const m = monthLabel(n.date); let g = groups[groups.length - 1]; if (!g || g.m !== m) groups.push((g = { m, items: [] })); g.items.push(n); });
  const l30 = all.filter(n => n.off <= 30), mx = Math.max(1, ...NOTE_TYPES.map(t => l30.filter(n => n.type === t).length));
  const stale = companies.filter(d => lastTouch(d, today) >= 60).sort((a, b) => b.fit - a.fit).slice(0, 8);
  const act = companies.map(d => [d, d.notes.filter(n => daysAgo(n.date, today) <= 90).length] as [Company, number]).filter(x => x[1]).sort((a, b) => b[1] - a[1] || b[0].fit - a[0].fit).slice(0, 5);
  const save = async () => { const t = form.text.trim(); if (!t || !cid) return; await addNote(cid, { date: form.date || today, type: form.type, text: t, priv: form.priv }); setForm(f => ({ ...f, text: '', priv: false })); };
  const open = (id: string) => ui.open({ kind: 'account', id });
  if (!companies.length) return <section className="vw" id="v-discussions"><ViewHead title="Discussions" sub="No entries yet" /><EmptyState /></section>;

  return (
    <section className="vw" id="v-discussions">
      <ViewHead title="Discussions" sub={`${all.length} entries across ${companies.filter(d => d.notes.length).length} companies · private entries never appear in Present mode or PDFs`} />
      <div className="dsgrid"><div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
        <div className="dadd edit-only"><span className="ovl">LOG A DISCUSSION</span><div className="r">
          <select value={cid} aria-label="Company" onChange={e => setForm(f => ({ ...f, cid: e.target.value }))}>{sorted.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
          <Seg opts={[...NOTE_TYPES]} cur={form.type} onPick={v => setForm(f => ({ ...f, type: v as NoteType }))} /><input type="date" value={form.date} aria-label="Date" onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
          <div className="r"><input type="text" value={form.text} placeholder="One line · what was discussed" aria-label="Discussion" onChange={e => setForm(f => ({ ...f, text: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') save(); }} /><Toggle on={form.priv} onClick={() => setForm(f => ({ ...f, priv: !f.priv }))} label="Private" /><button className="primary" onClick={save}>Save</button></div>
          <span className="rule">Public information and your own notes only.</span></div>
        <div className="vbar"><label className="vsearch"><SearchIcon /><input value={q} placeholder="Search discussions" aria-label="Search discussions" onChange={e => setQ(e.target.value)} /></label>
          <Seg opts={[['All', 'All', all.length], ...NOTE_TYPES.map(t => [t, t, all.filter(n => n.type === t).length] as [string, string, number])]} cur={type} onPick={setType} /><Toggle on={hidePriv} onClick={() => setHidePriv(h => !h)} label="Hide private" /></div>
        <div className="dfeed">{groups.length ? groups.map(g => <div key={g.m}><div className="dmon"><span>{g.m}</span><span>{g.items.length}</span></div>{g.items.map(n => (
          <div key={n.id} className={`drow ${n.priv ? 'priv-note' : ''}`}><span className="mono">{fmtDate(n.date)}</span><span className="ty">{n.type}</span><button className="co" onClick={() => open(n.d.id)}>{n.d.name}</button><span className="tx">{n.text}</span>{n.priv ? <span className="pv"><LockIcon />Private</span> : <span />}</div>
        ))}</div>) : <p className="vempty">No discussions match.</p>}</div>
      </div>
      <aside className="drail">
        <div className="rcard"><h3><span>LAST 30 DAYS</span><span>{l30.length}</span></h3>{NOTE_TYPES.map(t => { const n = l30.filter(x => x.type === t).length; return <div key={t} className="rbar"><span>{t}</span><span className="b"><i style={{ width: `${(n / mx) * 100}%` }} /></span><em>{n}</em></div>; })}</div>
        <div className="rcard"><h3><span>NOT TOUCHED 60D+</span><span>{companies.filter(d => lastTouch(d, today) >= 60).length}</span></h3><div className="rlist">{stale.length ? stale.map(d => <button key={d.id} onClick={() => open(d.id)}><b>{d.name}</b><span className="mono late">{lastTouch(d, today) < 999 ? lastTouch(d, today) + 'd' : '—'}</span><span className="mono" style={{ color: 'var(--brassInk)' }}>{d.fit}</span></button>) : <span className="fa">None</span>}</div></div>
        <div className="rcard"><h3><span>MOST ACTIVE · 90 DAYS</span><span>ENTRIES</span></h3><div className="rlist">{act.map(([d, n]) => <button key={d.id} onClick={() => open(d.id)}><b>{d.name}</b><span className="mono">{n}</span><span className="mono" style={{ color: 'var(--brassInk)' }}>{d.fit}</span></button>)}</div></div>
      </aside></div>
    </section>
  );
}
