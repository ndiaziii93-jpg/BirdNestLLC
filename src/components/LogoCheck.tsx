'use client';
import { useState } from 'react';
import { useStore } from '@/store/StoreProvider';
import type { Company } from '@/lib/types';

/**
 * Asks the owner to check a logo Claude found (Right / Wrong), or offers to find one.
 * `tone` "dark" sits on the teal pop-up banner; "light" sits on white panels.
 */
export function LogoCheck({ d, tone = 'dark' }: { d: Company; tone?: 'dark' | 'light' }) {
  const { findLogo, confirmLogo, rejectLogo } = useStore();
  const [busy, setBusy] = useState<'' | 'find' | 'wrong' | 'right'>('');
  const [msg, setMsg] = useState('');
  if (d.sample) return null;
  const run = async (kind: 'find' | 'wrong', fn: () => Promise<{ ok: boolean; message: string }>) => {
    setBusy(kind); setMsg('');
    const r = await fn();
    setBusy(''); setMsg(r.message);
  };
  const cls = `lchk edit-only ${tone}`;
  if (d.logo && d.logoSource === 'auto') {
    return (
      <span className={cls}>
        <span>{busy === 'wrong' ? 'Looking for another logo…' : 'Logo found by Claude. Is it right?'}</span>
        <button className="lbtn" disabled={!!busy} onClick={async () => { setBusy('right'); await confirmLogo(d.id); setBusy(''); setMsg(''); }}>Right</button>
        <button className="lbtn" disabled={!!busy} onClick={() => run('wrong', () => rejectLogo(d.id))}>Wrong</button>
        {msg ? <em>{msg}</em> : null}
      </span>
    );
  }
  if (!d.logo) {
    return (
      <span className={cls}>
        <button className="lbtn" disabled={!!busy} onClick={() => run('find', () => findLogo(d.id))}>{busy ? 'Finding logo…' : d.logoRejected.length ? 'Look for another logo' : 'Find logo with Claude'}</button>
        {msg ? <em>{msg}</em> : null}
      </span>
    );
  }
  return null;
}
