'use client';
import { DEC, KIND } from '@/lib/constants';
import { monogram } from '@/lib/derive';
import type { Company } from '@/lib/types';

export const esc = (v: unknown) => String(v ?? '');

export function Pill({ dec, className = 'pill', style }: { dec: string; className?: string; style?: React.CSSProperties }) {
  const dc = DEC[dec] || DEC.Pass;
  return <span className={className} style={{ background: dc[0], color: dc[1], ...style }}>{dec}</span>;
}

/** Small logo or monogram (32px in tables, custom size elsewhere). */
export function Logo({ d, size, className = 'lg2' }: { d: Pick<Company, 'name' | 'logo'>; size?: number; className?: string }) {
  const st = size ? { width: size, height: size } : undefined;

  return <span className={className} style={st}>{d.logo ? <img src={d.logo} alt="" /> : monogram(d.name)}</span>;
}

/** Circular fit ring used in tables and the partnering drawer. */
export function MiniRing({ f, s = 22 }: { f: number; s?: number }) {
  const r = s / 2 - 2, C = 2 * Math.PI * r;
  return (
    <svg viewBox={`0 0 ${s} ${s}`} width={s} height={s} aria-hidden="true">
      <circle cx={s / 2} cy={s / 2} r={r} fill="none" stroke="#EEEBE4" strokeWidth="2.5" />
      <circle cx={s / 2} cy={s / 2} r={r} fill="none" stroke="#B08D57" strokeWidth="2.5" strokeDasharray={`${((f / 100) * C).toFixed(1)} ${C.toFixed(1)}`} transform={`rotate(-90 ${s / 2} ${s / 2})`} />
    </svg>
  );
}

export function Seg<T extends string>({ opts, cur, onPick, className = 'vseg' }: { opts: ([T, string] | [T, string, number] | T)[]; cur: T; onPick: (v: T) => void; className?: string }) {
  return (
    <div className={className}>
      {opts.map(o => {
        const [v, l, n] = (Array.isArray(o) ? o : [o, o]) as [T, string, number?];
        return <button key={v} className={cur === v ? 'on' : ''} onClick={() => onPick(v)}>{l}{n != null ? <> <em>{n}</em></> : null}</button>;
      })}
    </div>
  );
}

export const kindLabel = (d: Pick<Company, 'kind'>) => KIND[d.kind || 'seeking'].label;
export const kindShort = (d: Pick<Company, 'kind'>) => KIND[d.kind || 'seeking'].short;

export const Dia = () => <i className="dia" />;

export function Toggle({ on, onClick, label, className = 'dpriv' }: { on: boolean; onClick: () => void; label: string; className?: string }) {
  return <button className={`${className} ${on ? 'on' : ''}`} onClick={onClick} aria-pressed={on}><i />{label}</button>;
}
