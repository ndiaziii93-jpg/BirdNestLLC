import { BRAND } from '@/lib/constants';

/** Lookout mark + wordmark. `inverse` draws the paper/brass version for teal banners. */
export function LookoutMark({ size = 40, inverse = false, className }: { size?: number; inverse?: boolean; className?: string }) {
  const line = inverse ? '#C9A56E' : '#B08D57', ink = inverse ? '#F6F4EF' : '#0F4C52';
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} fill="none" role="img" aria-label="BirdNest" className={className}>
      <path d="M0 32 H10 M54 32 H64" stroke={line} strokeWidth="1.4" />
      <path d="M10 32 Q32 7 54 32 Q32 57 10 32 Z" stroke={ink} strokeWidth="2.8" strokeLinejoin="round" />
      <path d="M38.56 28.17 A7.6 7.6 0 1 1 35.83 25.44" stroke={ink} strokeWidth="3.9" />
      <circle cx="30.8" cy="32.3" r="3" fill={line} />
    </svg>
  );
}

export function Lockup({ size = 40, inverse = false }: { size?: number; inverse?: boolean }) {
  return (
    <div className="lock">
      <LookoutMark size={size} inverse={inverse} />
      <div className="wm"><b>{BRAND.name}</b><span><i />{BRAND.owner}</span></div>
    </div>
  );
}

/** Compact mark used as a loading spinner and in the data rule box. */
export function CompactMark({ size = 22, color = '#7A5A26', className }: { size?: number; color?: string; className?: string }) {
  return (
    <svg className={className} viewBox="21 21 22 22" width={size} height={size} fill="none" style={{ flex: 'none' }}>
      <path d="M38.56 28.17 A7.6 7.6 0 1 1 35.83 25.44" stroke={color} strokeWidth="4.4" />
      <circle cx="30.8" cy="32.3" r="3.2" fill="#B08D57" />
    </svg>
  );
}

export const XIcon = ({ size = 16, sw = 1.5 }: { size?: number; sw?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={sw}><path d="M6 6l12 12M18 6L6 18" /></svg>
);
export const SearchIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
);
export const LockIcon = () => (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
);
export const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></svg>
);
export const GridIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
);
export const ChevronRight = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 6l6 6-6 6" /></svg>
);
export const ChevronDown = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#5E6368" strokeWidth="1.5"><path d="M6 9l6 6 6-6" /></svg>
);
export const DrugIcon = () => (
  <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><g transform="rotate(-45 12 12)"><rect x="3" y="8.5" width="18" height="7" rx="3.5" /><path d="M12 8.5v7" /></g></svg>
);
export const DeviceIcon = () => (
  <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="5" /><path d="M8.2 15.2C6 17 4.5 19 4 21M15.8 8.8C18 7 19.5 5 20 3" /></svg>
);
export const PresentIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M12 16v4M8 20h8" /></svg>
);
