'use client';
import React from 'react';
import { useUi } from '@/store/UiProvider';

/** Backdrop + container. Clicking the backdrop closes the top-most pop-up. */
export function Modal({ children, label, className = 'modal', id, lock }: { children: React.ReactNode; label: string; className?: string; id?: string; lock?: boolean }) {
  const { close } = useUi();
  return (
    <div className={`${className} show`} id={id} role="dialog" aria-modal="true" aria-label={label} onMouseDown={e => { if (e.target === e.currentTarget && !lock) close(); }}>
      {children}
    </div>
  );
}
