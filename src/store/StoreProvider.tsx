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
  if (!r.ok) {
    const t = await r.text().catch(() => '');
    let why = t.slice(0, 300);
    try { const j = JSON.parse(t); if (j && j.error) why = String(j.error); } catch { /* not JSON */ }
    throw new Error(`${method} ${path} failed (${r.status})${why ? ': ' + why : ''}`);
  }
  return r.status === 204 ? (undefined as T) : r.json();
}

export interface Store {
  companies: Company[];
  intros: Intro[];
  settings: Settings;
  today: string;
  /** Set when the data could not be read; screens then show nothing instead of an empty Hub. */
  loadError: string;
  error: string;
  clearError: () => void;
  byId: (id: string) => Company | undefined;
  /** Saves a company. With `strict`, a failed save is undone on screen and thrown, so callers can report it. */
  saveCompany: (c: Company, opts?: { strict?: boolean }) => Promise<Company>;
  deleteCompany: (id: string) => Promise<void>;
  addNote: (companyId: string, n: Omit<Note, 'id'>) => Promise<void>;
  moveStage: (id: string, stage: number) => Promise<void>;
  introduce: (a: Company, b: Company) => Promise<void>;
  updateBuyBox: (id: string, bb: BuyBox) => Promise<void>;
  applyWeights: (lens: 'partnering' | 'services', weights: number[]) => Promise<number>;
  setPicklist: (key: 'post' | 'ant' | 'met', list: string[]) => Promise<void>;
  /** Claude finds a logo for a company without one (or tries again after a rejection). Returns a short outcome to show. */
  /** Finds a logo online. `website` points the search at the right site, or straight at a logo image. */
  findLogo: (id: string, opts?: { website?: string }) => Promise<{ ok: boolean; message: string }>;
  /** The owner says the Claude-found logo is right. */
  confirmLogo: (id: string) => Promise<void>;
  /** The owner says the logo is wrong: remember it, then look for another. */
  rejectLogo: (id: string) => Promise<{ ok: boolean; message: string }>;
  loadSample: () => Promise<void>;
  clearSample: () => Promise<void>;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ initial, loadError = '', children }: { initial: Dataset; loadError?: string; children: React.ReactNode }) {
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

  const saveCompany = useCallback(async (c: Company, opts?: { strict?: boolean }) => {
    const s = ref.current.settings;
    const fit = calcFit(c, s);
    const next: Company = { ...c, id: c.id || uid(), fit, notes: c.notes.map(n => ({ ...n, id: n.id || uid() })) };
    const before = ref.current.companies.find(x => x.id === next.id);
    put(next);
    try { const saved = await api<Company>('/api/companies', 'POST', next); put(saved); return saved; }
    catch (e) {
      if (opts?.strict) {
        if (before) put(before); else setCompanies(list => list.filter(x => x.id !== next.id));
        throw e;
      }
      fail(e); return next;
    }
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

  const findLogo = useCallback(async (id: string, opts?: { website?: string }) => {
    const c = ref.current.companies.find(x => x.id === id);
    if (!c) return { ok: false, message: 'Company not found.' };
    const given = opts?.website?.trim();
    try {
      const r = await api<{ ok: boolean; logo?: string; origin?: string; website?: string | null; reason: string; confidence?: string; method?: string; via?: string }>('/api/logo/find', 'POST', { companyId: c.id, name: c.name, website: given || c.website, city: c.city, country: c.cdisp, exclude: c.logoRejected });
      const now = ref.current.companies.find(x => x.id === id) || c;
      const host = (w: string | null | undefined) => { try { return w ? new URL(w).hostname.replace(/^www\./, '') : ''; } catch { return ''; } };
      if (!r.ok || !r.logo) {
        if (!now.website && r.website) await saveCompany({ ...now, website: host(r.website) });
        return { ok: false, message: r.reason };
      }
      if (r.method === 'given') {
        await saveCompany({ ...now, logo: r.logo, logoSource: 'confirmed', logoOrigin: r.origin || null }, { strict: true });
        return { ok: true, message: 'Logo saved from the link you gave.' };
      }
      // A website the owner typed replaces the profile's; one found by search only fills a blank.
      const site = given ? host(r.website) || now.website : now.website || host(r.website);
      await saveCompany({ ...now, logo: r.logo, logoSource: 'auto', logoOrigin: r.origin || null, website: site }, { strict: true });
      return { ok: true, message: `Found on ${host(r.website)}${r.via === 'firecrawl' ? ' (live page)' : ''}${r.confidence ? ' · ' + r.confidence + ' confidence' : ''}` };
    } catch (e) { return { ok: false, message: e instanceof Error ? e.message : String(e) }; }
  }, [saveCompany]);

  const confirmLogo = useCallback(async (id: string) => {
    const c = ref.current.companies.find(x => x.id === id);
    if (c) await saveCompany({ ...c, logoSource: 'confirmed' });
  }, [saveCompany]);

  const rejectLogo = useCallback(async (id: string) => {
    const c = ref.current.companies.find(x => x.id === id);
    if (!c) return { ok: false, message: 'Company not found.' };
    const rejected = c.logoOrigin && !c.logoRejected.includes(c.logoOrigin) ? [...c.logoRejected, c.logoOrigin] : c.logoRejected;
    const cleared = { ...c, logo: null, logoSource: null, logoOrigin: null, logoRejected: rejected };
    await saveCompany(cleared, { strict: true });
    ref.current = { ...ref.current, companies: ref.current.companies.map(x => (x.id === id ? cleared : x)) };
    return findLogo(id);
  }, [saveCompany, findLogo]);

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
    companies, intros, settings, today, loadError, error, clearError: () => setError(''), byId, saveCompany, deleteCompany, addNote, moveStage, introduce, updateBuyBox, applyWeights, setPicklist, findLogo, confirmLogo, rejectLogo, loadSample, clearSample,
  }), [companies, intros, settings, today, loadError, error, byId, saveCompany, deleteCompany, addNote, moveStage, introduce, updateBuyBox, applyWeights, setPicklist, findLogo, confirmLogo, rejectLogo, loadSample, clearSample]);

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
