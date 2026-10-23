'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { Lockup, PresentIcon, SearchIcon } from './Lockup';
import { useUi } from '@/store/UiProvider';
import { useSearch } from '@/store/SearchProvider';

const NAV: [string, string][] = [['/', 'Dashboard'], ['/companies', 'Companies'], ['/partnering', 'Partnering'], ['/discussions', 'Discussions'], ['/settings', 'Settings']];

export function TopBar() {
  const path = usePathname();
  const router = useRouter();
  const ui = useUi();
  const { q, setQ } = useSearch();
  const inp = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); if (path !== '/') router.push('/'); inp.current?.focus(); } };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [path, router]);

  return (
    <header className="top">
      <Lockup />
      <nav className="nav">
        {NAV.map(([href, label]) => (
          <Link key={href} href={href} className={path === href ? 'on' : ''} role="button">{label}</Link>
        ))}
      </nav>
      <div className="sp" />
      <button className={`pres ${ui.present ? 'on' : ''}`} onClick={() => ui.setPresent(!ui.present)} title={ui.present ? 'Present mode on · private notes and editing hidden' : 'Present mode · hide private notes and editing'} aria-pressed={ui.present}>
        <PresentIcon />{ui.present ? 'Presenting' : 'Present'}
      </button>
      <label className="search">
        <SearchIcon />
        <input ref={inp} id="q" value={q} onChange={e => { setQ(e.target.value); if (path !== '/') router.push('/'); }} placeholder="Find a company, asset or city" />
        <kbd>⌘K</kbd>
      </label>
      <button className="primary edit-only" onClick={() => ui.open({ kind: 'add' })}>Add company</button>
    </header>
  );
}
