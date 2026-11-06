'use client';
import { useState } from 'react';
import { useStore } from '@/store/StoreProvider';
import type { Company } from '@/lib/types';

const hostOf = (u: string | null | undefined) => { try { return u ? new URL(u).hostname.replace(/^www\./, '') : ''; } catch { return ''; } };

/**
 * Asks the owner to check a logo Claude found (Right / Wrong), or offers to find one. Either way the
 * owner can point Claude at the right website, or paste a link straight to the logo image.
 * `tone` "dark" sits on the teal pop-up banner; "light" sits on white panels.
 */
export function LogoCheck({ d, tone = 'dark' }: { d: Company; tone?: 'dark' | 'light' }) {
  const { findLogo, confirmLogo, rejectLogo } = useStore();
  const [busy, setBusy] = useState<'' | 'find' | 'wrong' | 'right' | 'site'>('');
  const [msg, setMsg] = useState('');
  const [asking, setAsking] = useState(false);
  const [site, setSite] = useState('');
  if (d.sample) return null;
  if (d.logo && d.logoSource !== 'auto') return null;

  const run = async (kind: 'find' | 'wrong' | 'site', fn: () => Promise<{ ok: boolean; message: string }>) => {
    setBusy(kind); setMsg('');
    const r = await fn();
    setBusy(''); setMsg(r.message);
    // When nothing was found, ask where to look instead.
    if (!r.ok) { setAsking(true); setSite(s => s || d.website || ''); } else setAsking(false);
  };
  const openAsk = () => { setAsking(true); setSite(d.website || ''); setMsg(''); };
  const submit = () => { const v = site.trim(); if (v) void run('site', () => findLogo(d.id, { website: v })); };
  const cls = `lchk edit-only ${tone}`;
  const from = hostOf(d.logoOrigin);

  const ask = asking ? (
    <span className="lsite">
      <input value={site} placeholder="company.com or a link to the logo image" aria-label={`Website or logo link for ${d.name}`} disabled={!!busy}
        onChange={e => setSite(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') setAsking(false); }} />
      <button className="lbtn" disabled={!!busy || !site.trim()} onClick={submit}>{busy === 'site' ? 'Looking…' : 'Find logo here'}</button>
      <button className="lbtn ghost" disabled={!!busy} onClick={() => setAsking(false)}>Cancel</button>
    </span>
  ) : null;

  if (d.logo) {
    return (
      <span className={cls}>
        <span>{busy === 'wrong' ? 'Looking for another logo…' : busy === 'site' ? 'Looking on that website…' : `Logo found by Claude${from ? ' on ' + from : ''}. Is it right?`}</span>
        <button className="lbtn" disabled={!!busy} onClick={async () => { setBusy('right'); await confirmLogo(d.id); setBusy(''); setMsg(''); }}>Right</button>
        <button className="lbtn" disabled={!!busy} onClick={() => run('wrong', () => rejectLogo(d.id))}>Wrong</button>
        {!asking ? <button className="lbtn ghost" disabled={!!busy} onClick={openAsk}>Wrong website?</button> : null}
        {ask}
        {msg ? <em>{msg}</em> : null}
      </span>
    );
  }
  return (
    <span className={cls}>
      <button className="lbtn" disabled={!!busy} onClick={() => run('find', () => findLogo(d.id))}>{busy === 'find' ? 'Searching online…' : d.logoRejected.length ? 'Look for another logo' : 'Find logo with Claude'}</button>
      {!asking ? <button className="lbtn ghost" disabled={!!busy} onClick={openAsk}>Enter website</button> : null}
      {ask}
      {msg ? <em>{msg}</em> : null}
    </span>
  );
}
