'use client';
// Client-side store holding the whole dataset (one user, a few hundred records). Every
// mutation updates local state first, then persists through the API routes.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { todayISO } from '@/lib/dates';
import { calcFit, decisionFor } from '@/lib/fit';
import { lastTopic, isBuyer } from '@/lib/derive';
import type { BuyBox, Company, Dataset, Intro, Note, Settings } from '@/lib/types';

const uid = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2));

async function api<T = unknown>(path: string, method: string, body?: unknown): Promise<T> {
  const r = await fetch(path, { method, headers: body ? { 'content-type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
  if (!r.ok) { const t = await r.text().catch(() => ''); throw new Error(`${method} ${path} failed (${r.status}) ${t}`); }
  return r.status === 204 ? (undefined as T) : r.json();
}

export interface Store {
  companies: Company[];
  intros: Intro[];
  settings: Settings;
  today: string;
  error: string;
  clearError: () => void;
  byId: (id: string) => Company | undefined;
  saveCompany: (c: Company) => Promise<Company>;
  deleteCompany: (id: string) => Promise<void>;
  addNote: (companyId: string, n: Omit<Note, 'id'>) => Promise<void>;
  moveStage: (id: string, stage: number) => Promise<void>;
  introduce: (a: Company, b: Company) => Promise<void>;
  updateBuyBox: (id: string, bb: BuyBox) => Promise<void>;
  applyWeights: (lens: 'partnering' | 'services', weights: number[]) => Promise<number>;
  setPicklist: (key: 'post' | 'ant' | 'met', list: string[]) => Promise<void>;
  loadSample: () => Promise<void>;
  clearSample: () => Promise<void>;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ initial, children }: { initial: Dataset; children: React.ReactNode }) {
  const [companies, setCompanies] = useState<Company[]>(initial.companies);
  const [intros, setIntros] = useState<Intro[]>(initial.intros);
  const [settings, setSettings] = useState<Settings>(initial.settings);
  const [error, setError] = useState('');
  const today = useMemo(() => todayISO(), []);
  const ref = useRef({ companies, settings });
  useEffect(() => { ref.current = { companies, settings }; }, [companies, settings]);

  const fail = (e: unknown) => { setError(e instanceof Error ? e.message : String(e)); };

  const byId = useCallback((id: string) => ref.current.companies.find(c => c.id === id), []);

  const put = useCallback((c: Company) => {
    setCompanies(list => (list.some(x => x.id === c.id) ? list.map(x => (x.id === c.id ? c : x)) : [...list, c]));
  }, []);

  const saveCompany = useCallback(async (c: Company) => {
    const s = ref.current.settings;
    const fit = calcFit(c, s);
    const next: Company = { ...c, id: c.id || uid(), fit, notes: c.notes.map(n => ({ ...n, id: n.id || uid() })) };
    put(next);
    try { const saved = await api<Company>('/api/companies', 'POST', next); put(saved); return saved; } catch (e) { fail(e); return next; }
  }, [put]);

  const deleteCompany = useCallback(async (id: string) => {
    setCompanies(list => list.filter(x => x.id !== id));
    setIntros(list => list.filter(x => x.buyerId !== id && x.sellerId !== id));
    try { await api(`/api/companies/${id}`, 'DELETE'); } catch (e) { fail(e); }
  }, []);

  const addNote = useCallback(async (companyId: string, n: Omit<Note, 'id'>) => {
    const c = byId(companyId); if (!c) return;
    await saveCompany({ ...c, notes: [{ ...n, id: uid() }, ...c.notes] });
  }, [byId, saveCompany]);

  const moveStage = useCallback(async (id: string, stage: number) => {
    const c = byId(id); if (!c || c.deal === stage) return;
    const name = stage < 0 ? 'Parked' : ['Identified', 'First contact', 'Intro call', 'CDA signed', 'Diligence', 'Term sheet', 'Closed'][stage];
    await saveCompany({ ...c, deal: stage, notes: [{ id: uid(), date: today, type: 'Note', text: 'Deal stage moved to ' + name + '.', priv: false }, ...c.notes] });
  }, [byId, saveCompany, today]);

  const introduce = useCallback(async (a: Company, b: Company) => {
    const buyer = isBuyer(a) ? a : b, bio = isBuyer(a) ? b : a;
    if (intros.some(x => x.buyerId === buyer.id && x.sellerId === bio.id)) return;
    const x: Intro = { id: uid(), buyerId: buyer.id, sellerId: bio.id, date: today, status: 'Introduced', note: 'Introduced today' };
    setIntros(list => [x, ...list]);
    await Promise.all([
      saveCompany({ ...bio, notes: [{ id: uid(), date: today, type: 'Email', text: 'Introduced to ' + buyer.name + '.', priv: false }, ...bio.notes] }),
      saveCompany({ ...buyer, notes: [{ id: uid(), date: today, type: 'Email', text: 'Introduced ' + bio.name + '.', priv: false }, ...buyer.notes] }),
    ]);
    try { await api('/api/intros', 'POST', x); } catch (e) { fail(e); }
  }, [intros, saveCompany, today]);

  const updateBuyBox = useCallback(async (id: string, bb: BuyBox) => {
    const c = byId(id); if (!c) return;
    await saveCompany({ ...c, buyBox: bb });
  }, [byId, saveCompany]);

  const applyWeights = useCallback(async (lens: 'partnering' | 'services', weights: number[]) => {
    const s: Settings = lens === 'services' ? { ...ref.current.settings, svcWeights: weights } : { ...ref.current.settings, weights };
    setSettings(s);
    const changed: Company[] = [];
    const next = ref.current.companies.map(c => {
      if (c.lens !== lens) return c;
      const fit = calcFit(c, s);
      const n = { ...c, prevFit: c.fit, fit };
      changed.push(n);
      return n;
    });
    setCompanies(next);
    try {
      await api('/api/settings', 'POST', { key: lens === 'services' ? 'svcWeights' : 'weights', value: weights });
      await api('/api/companies/bulk', 'POST', changed.map(c => ({ id: c.id, prevFit: c.prevFit, fit: c.fit })));
    } catch (e) { fail(e); }
    return changed.length;
  }, []);

  const setPicklist = useCallback(async (key: 'post' | 'ant' | 'met', list: string[]) => {
    setSettings(s => ({ ...s, [key]: list }));
    try { await api('/api/settings', 'POST', { key, value: list }); } catch (e) { fail(e); }
  }, []);

  const loadSample = useCallback(async () => {
    try {
      const d = await api<Dataset>('/api/sample', 'POST');
      setCompanies(d.companies); setIntros(d.intros); setSettings(d.settings);
    } catch (e) { fail(e); }
  }, []);

  const clearSample = useCallback(async () => {
    try {
      const d = await api<Dataset>('/api/sample', 'DELETE');
      setCompanies(d.companies); setIntros(d.intros); setSettings(d.settings);
    } catch (e) { fail(e); }
  }, []);

  const value: Store = useMemo(() => ({
    companies, intros, settings, today, error, clearError: () => setError(''), byId, saveCompany, deleteCompany, addNote, moveStage, introduce, updateBuyBox, applyWeights, setPicklist, loadSample, clearSample,
  }), [companies, intros, settings, today, error, byId, saveCompany, deleteCompany, addNote, moveStage, introduce, updateBuyBox, applyWeights, setPicklist, loadSample, clearSample]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore outside StoreProvider');
  return s;
}

/** Decision suggested by the fit rule; stored decision wins once the owner has set it. */
export const suggestDecision = decisionFor;
export const topicOf = lastTopic;
export { uid };
