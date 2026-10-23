'use client';
import React, { createContext, useContext, useMemo, useState } from 'react';

const Ctx = createContext<{ q: string; setQ: (v: string) => void } | null>(null);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [q, setQ] = useState('');
  const v = useMemo(() => ({ q, setQ }), [q]);
  return <Ctx.Provider value={v}>{children}</Ctx.Provider>;
}

export const useSearch = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useSearch outside SearchProvider');
  return c;
};
