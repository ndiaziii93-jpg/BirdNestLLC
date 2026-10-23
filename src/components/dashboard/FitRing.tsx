'use client';
import { useState } from 'react';
import * as d3 from 'd3';
import { FSN, SVC_FSN } from '@/lib/constants';
import { criteria } from '@/lib/fit';
import { useStore } from '@/store/StoreProvider';
import type { Company } from '@/lib/types';

/** Segmented fit ring from the dashboard card: one brass arc per criterion, hover shows its points. */
export function FitRing({ d }: { d: Company }) {
  const { settings } = useStore();
  const [hov, setHov] = useState<number | null>(null);
  const SC = criteria(d.lens, settings);
  const scores = d.lens === 'services' ? d.svcScores : d.scores;
  const why = d.lens === 'services' ? d.svcWhy : d.why;
  const names = d.lens === 'services' ? SVC_FSN : FSN;
  const trend = d.trend > 0 ? '▲' + d.trend : d.trend < 0 ? '▼' + -d.trend : '— 0';
  const fA = d3.arc<d3.DefaultArcObject>().innerRadius(35).outerRadius(41).cornerRadius(1);
  const fH = d3.arc<d3.DefaultArcObject>().innerRadius(26).outerRadius(44);
  const arcs: { s0: number; e0: number; fe: number; h0: number; h1: number }[] = [];
  let fa = 0;
  for (let i = 0; i < SC.length; i++) {
    const span = (SC[i][1] / 100) * 2 * Math.PI, p = 0.035, s0 = fa + p / 2, e0 = fa + span - p / 2, fe = s0 + ((e0 - s0) * (scores[i] ?? 0)) / 5, h0 = fa;
    fa += span;
    arcs.push({ s0, e0, fe, h0, h1: fa });
  }
  const segs = SC.map((s, i) => {
    const a = arcs[i];
    const base = { innerRadius: 35, outerRadius: 41, startAngle: a.s0, endAngle: a.e0 };
    return (
      <g key={i} className={`fseg ${hov === i ? 'hov' : ''}`} tabIndex={0} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)} onFocus={() => setHov(i)} onBlur={() => setHov(null)}>
        <title>{`${s[0]} · ${scores[i]}/5 · ${+(((scores[i] ?? 0) / 5) * s[1]).toFixed(1)} of ${s[1]} pts${why[i] ? ' · ' + why[i] : ''}`}</title>
        <path d={fA(base) || ''} fill="#EEEBE4" />
        <path d={fA({ ...base, endAngle: a.fe }) || ''} fill="#B08D57" />
        <path d={fH({ innerRadius: 26, outerRadius: 44, startAngle: a.h0, endAngle: a.h1 }) || ''} fill="transparent" />
      </g>
    );
  });
  const h = hov != null ? SC[hov] : null;
  return (
    <div className={`ring fring ${hov != null ? 'hovering' : ''}`} id="fring">
      <svg viewBox="-44 -44 88 88" width="88" height="88" role="img" aria-label={`Fit ${d.fit}, by criterion`}>{segs}</svg>
      <div>
        <b>{h ? +(((scores[hov!] ?? 0) / 5) * h[1]).toFixed(1) : d.fit}</b>
        <small className="f1">{h ? 'of ' + h[1] : trend}</small>
        <small className="f2">{h ? names[hov!] : ''}</small>
      </div>
    </div>
  );
}
