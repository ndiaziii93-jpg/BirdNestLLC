'use client';
import { useState } from 'react';
import { useStore } from '@/store/StoreProvider';
import { useUi } from '@/store/UiProvider';

export function EmptyState() {
  const { loadSample } = useStore();
  const ui = useUi();
  const [busy, setBusy] = useState(false);
  return (
    <section className="empty-state" aria-label="Getting started">
      <span className="ovl">Nothing tracked yet</span>
      <h2>Start with the companies you already know.</h2>
      <p>Add a company by name and website and Claude fills in what is publicly known, or load the sample set of 60 ophthalmology companies, buyers and investors to see how the Hub works. Sample records are labelled and can be removed in Settings → Data at any time.</p>
      <div className="btns">
        <button className="primary edit-only" onClick={() => ui.open({ kind: 'add' })}>Add company</button>
        <button className="sec edit-only" disabled={busy} onClick={async () => { setBusy(true); await loadSample(); setBusy(false); }}>{busy ? 'Loading…' : 'Load sample data'}</button>
      </div>
    </section>
  );
}
