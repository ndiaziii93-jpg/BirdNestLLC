'use client';
// UI-level state: which pop-up is open, present mode, and the shared dashboard selection.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type Modal =
  | { kind: 'profile'; id: string }
  | { kind: 'new'; preset?: Record<string, unknown> }
  | { kind: 'account'; id: string }
  | { kind: 'matrix'; id: string; hl: string | null }
  | { kind: 'export'; id: string }
  | { kind: 'add' }
  | { kind: 'list' };

interface Ui {
  modals: Modal[];
  open: (m: Modal) => void;
  close: () => void;
  closeAll: () => void;
  replace: (m: Modal) => void;
  present: boolean;
  setPresent: (v: boolean) => void;
  sel: string | null; // selected company on the dashboard
  setSel: (id: string | null) => void;
}

const Ctx = createContext<Ui | null>(null);

export function UiProvider({ children }: { children: React.ReactNode }) {
  const [modals, setModals] = useState<Modal[]>([]);
  const [present, setPresentState] = useState(false);
  const [sel, setSel] = useState<string | null>(null);

  // Read the saved preference once after mount (localStorage is not available during server rendering).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { try { setPresentState(localStorage.getItem('bn-present') === '1'); } catch { /* ignore */ } }, []);
  const setPresent = useCallback((v: boolean) => { setPresentState(v); try { localStorage.setItem('bn-present', v ? '1' : '0'); } catch { /* ignore */ } }, []);

  const open = useCallback((m: Modal) => setModals(s => [...s, m]), []);
  const close = useCallback(() => setModals(s => s.slice(0, -1)), []);
  const closeAll = useCallback(() => setModals([]), []);
  const replace = useCallback((m: Modal) => setModals(s => [...s.slice(0, -1), m]), []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setModals(s => s.slice(0, -1)); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, []);

  useEffect(() => { document.documentElement.toggleAttribute('data-present', present); }, [present]);

  const value = useMemo(() => ({ modals, open, close, closeAll, replace, present, setPresent, sel, setSel }), [modals, open, close, closeAll, replace, present, setPresent, sel]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useUi(): Ui {
  const u = useContext(Ctx);
  if (!u) throw new Error('useUi outside UiProvider');
  return u;
}
