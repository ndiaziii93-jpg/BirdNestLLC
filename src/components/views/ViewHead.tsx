'use client';
export function ViewHead({ title, sub, act }: { title: string; sub: React.ReactNode; act?: React.ReactNode }) {
  return <div className="vhead"><div><h1>{title}</h1><span>{sub}</span></div><div className="vact">{act}</div></div>;
}
