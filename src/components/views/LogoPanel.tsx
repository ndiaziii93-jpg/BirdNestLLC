'use client';
import { useState } from 'react';
import { useStore } from '@/store/StoreProvider';
import { useUi } from '@/store/UiProvider';
import { Logo } from '../bits';
import { LogoCheck } from '../LogoCheck';

/** Settings → Data: find every missing logo with Claude, then check each one Right or Wrong. */
export function LogoPanel() {
  const { companies, findLogo } = useStore();
  const ui = useUi();
  const [run, setRun] = useState<{ done: number; total: number; found: number } | null>(null);
  const own = companies.filter(c => !c.sample);
  const missing = own.filter(c => !c.logo);
  const toCheck = own.filter(c => c.logo && c.logoSource === 'auto');
  const running = !!run && run.done < run.total;

  const findAll = async () => {
    const ids = missing.map(c => c.id);
    setRun({ done: 0, total: ids.length, found: 0 });
    for (const id of ids) {
      const r = await findLogo(id);
      setRun(s => (s ? { ...s, done: s.done + 1, found: s.found + (r.ok ? 1 : 0) } : s));
    }
  };

  const row = (c: (typeof own)[number]) => (
    <div key={c.id} className="lrow">
      <Logo d={c} size={40} />
      <span className="lnm"><button className="co" onClick={() => ui.open({ kind: 'account', id: c.id })}>{c.name}</button><small>{c.website || 'No website on the profile'}</small></span>
      <LogoCheck d={c} tone="light" />
    </div>
  );

  return (
    <div className="spanel edit-only lpanel">
      <h2>Logos</h2>
      <p>Claude finds each company&apos;s logo on its website. Check each one: <b>Right</b> keeps it, <b>Wrong</b> makes Claude try another image and never offers that one again. If it looks on the wrong site, enter the right website or paste a link to the logo image. Logos you upload yourself are never replaced.</p>
      <div className="lsum">
        <span><b className="mono">{toCheck.length}</b> to check</span>
        <span><b className="mono">{missing.length}</b> without a logo</span>
        <span><b className="mono">{own.length - toCheck.length - missing.length}</b> confirmed or uploaded</span>
        <span className="sp" />
        {missing.length ? <button className="primary" disabled={running} onClick={findAll}>{running ? `Finding ${run!.done + 1} of ${run!.total}…` : `Find ${missing.length} missing ${missing.length === 1 ? 'logo' : 'logos'}`}</button> : null}
      </div>
      {run && !running ? <p className="wmsg">Found {run.found} of {run.total}. {run.found ? 'Check them below.' : ''}</p> : null}
      {toCheck.length ? <div className="lgrp"><span className="ovl">Found by Claude · check these</span>{toCheck.map(row)}</div> : null}
      {missing.length ? <div className="lgrp"><span className="ovl">No logo yet</span>{missing.map(row)}</div> : null}
      {!toCheck.length && !missing.length ? <p className="hint2">Every company has a checked logo.</p> : null}
    </div>
  );
}
