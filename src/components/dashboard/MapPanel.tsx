'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useStore } from '@/store/StoreProvider';
import { useWorld } from '@/lib/world';
import { BBOX, KIND, REGIONS } from '@/lib/constants';
import { match, type DashFilters } from '@/lib/filters';
import { fmtDate } from '@/lib/dates';
import type { Company } from '@/lib/types';

const rad = (f: number) => (f >= 75 ? 7 : f >= 50 ? 5 : 3.2);

export function MapPanel({ st, setRegion, sel, onSelect }: { st: DashFilters; setRegion: (r: DashFilters['region']) => void; sel: Company | null; onSelect: (id: string) => void }) {
  const { companies, today } = useStore();
  const world = useWorld();
  const wrap = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const proj = useRef<d3.GeoProjection | null>(null);
  const size = useRef({ W: 960, H: 480 });
  const [ready, setReady] = useState(0);
  const hasSample = companies.some(c => c.sample);

  const byCountry = useMemo(() => d3.rollup(companies, v => v.length, d => d.country), [companies]);
  const regionOf = useMemo(() => { const m: Record<string, string> = {}; companies.forEach(d => (m[d.country] = d.region)); return m; }, [companies]);

  const fitTo = (reg: string) => {
    const { W, H } = size.current, b = BBOX[reg];
    const p = d3.geoNaturalEarth1().fitExtent([[28, 60], [W - 28, H - 36]], { type: 'MultiPoint', coordinates: [b[0], b[1], [b[0][0], b[1][1]], [b[1][0], b[0][1]]] });
    return { s: p.scale(), t: p.translate() };
  };

  // Base map: countries + layers. Runs once the world data arrives.
  useEffect(() => {
    if (!world || !svgRef.current || !wrap.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    const area = wrap.current;
    size.current = { W: area.clientWidth || 960, H: area.clientHeight || 480 };
    svg.attr('viewBox', `0 0 ${size.current.W} ${size.current.H}`);
    const p = d3.geoNaturalEarth1(); const f0 = fitTo(st.region); p.scale(f0.s).translate(f0.t); proj.current = p;
    svg.append('g').attr('class', 'gC'); svg.append('g').attr('class', 'gD'); const gL = svg.append('g').attr('class', 'gL');
    gL.append('circle').attr('class', 'selring').attr('fill', 'none').attr('stroke', '#B08D57').attr('stroke-width', 2).attr('pointer-events', 'none');
    gL.append('text').attr('class', 'sellabel').attr('font-size', 12).attr('font-weight', 500).attr('fill', '#1A1D20').attr('font-family', 'Geist, sans-serif').attr('paint-order', 'stroke').attr('stroke', '#fff').attr('stroke-width', 3).attr('pointer-events', 'none');
    setReady(r => r + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [world]);

  // Keep the projection sized to the panel.
  useEffect(() => {
    if (!wrap.current || !svgRef.current) return;
    const area = wrap.current, svg = d3.select(svgRef.current);
    const ro = new ResizeObserver(() => {
      const w = area.clientWidth, h = area.clientHeight, p = proj.current;
      if (!p || !w || !h || (w === size.current.W && h === size.current.H)) return;
      size.current = { W: w, H: h }; svg.attr('viewBox', `0 0 ${w} ${h}`);
      const f = fitTo(st.region); p.scale(f.s).translate(f.t); setReady(r => r + 1);
    });
    ro.observe(area);
    return () => ro.disconnect();
  }, [st.region, ready]);


  // Countries
  useEffect(() => {
    if (!world || !proj.current || !svgRef.current) return;
    const path = d3.geoPath(proj.current);
    d3.select(svgRef.current).select('g.gC').selectAll<SVGPathElement, (typeof world)[number]>('path').data(world).join('path')
      .attr('class', d => 'country' + (byCountry.get(d.properties.name) ? ' has' : ''))
      .attr('d', d => path(d))
      .on('click', (_e, d) => { const reg = regionOf[d.properties.name] as DashFilters['region'] | undefined; if (reg) setRegion(st.region === reg ? 'All' : reg); })
      .selectAll('title').data(d => [d]).join('title').text(d => d.properties.name + (byCountry.get(d.properties.name) ? ' · ' + byCountry.get(d.properties.name) + ' companies' : ''));
  }, [world, byCountry, regionOf, setRegion, ready, st.region]);

  // Dots
  useEffect(() => {
    if (!proj.current || !svgRef.current || !wrap.current || !tipRef.current) return;
    const p = proj.current, area = wrap.current, tip = tipRef.current;
    d3.select(svgRef.current).select('g.gD').selectAll<SVGCircleElement, Company>('circle').data([...companies].sort((a, b) => a.fit - b.fit), d => d.id).join('circle')
      .attr('class', 'dot').attr('r', d => rad(d.fit))
      .attr('fill', d => KIND[d.kind || 'seeking'].fill).attr('fill-opacity', d => (d.kind === 'investor' ? 1 : 0.85))
      .attr('stroke', d => KIND[d.kind || 'seeking'].stroke).attr('stroke-width', d => (d.kind === 'investor' ? 2 : 1))
      .attr('cx', d => p([d.lon, d.lat])?.[0] ?? -99).attr('cy', d => p([d.lon, d.lat])?.[1] ?? -99)
      .style('opacity', d => (match(d, st) ? 1 : 0.14)).style('pointer-events', d => (match(d, st) ? 'auto' : 'none'))
      .on('click', (_e, d) => onSelect(d.id))
      .on('mousemove', (e: MouseEvent, d) => { const b = area.getBoundingClientRect(); tip.style.display = 'block'; tip.style.left = e.clientX - b.left + 14 + 'px'; tip.style.top = e.clientY - b.top + 14 + 'px'; tip.innerHTML = `<b>${d.name}</b> <em>${d.fit}</em><br><span>${d.city}, ${d.cdisp} · ${d.ind} · ${d.phaseLabel}</span>`; })
      .on('mouseleave', () => { tip.style.display = 'none'; });
  }, [companies, onSelect, ready, st]);

  // Selection ring + label
  useEffect(() => {
    if (!proj.current || !svgRef.current) return;
    const svg = d3.select(svgRef.current);
    if (!sel) { svg.select('.selring').attr('r', 0); svg.select('.sellabel').text(''); return; }
    const pt = proj.current([sel.lon, sel.lat]) || [-99, -99];
    svg.select('.selring').attr('cx', pt[0]).attr('cy', pt[1]).attr('r', rad(sel.fit) + 5);
    svg.select('.sellabel').attr('x', pt[0] + rad(sel.fit) + 10).attr('y', pt[1] + 4).text(sel.name);
  }, [sel, ready]);

  // Region zoom with a d3 transition
  const firstRegion = useRef(true);
  useEffect(() => {
    if (!proj.current || !svgRef.current) return;
    if (firstRegion.current) { firstRegion.current = false; return; }
    const p = proj.current, svg = d3.select(svgRef.current), t = fitTo(st.region), s0 = p.scale(), t0 = p.translate();
    const redraw = () => {
      const path = d3.geoPath(p);
      svg.select('g.gC').selectAll<SVGPathElement, (typeof world extends null ? never : NonNullable<typeof world>)[number]>('path').attr('d', d => path(d));
      svg.select('g.gD').selectAll<SVGCircleElement, Company>('circle').attr('cx', d => p([d.lon, d.lat])?.[0] ?? -99).attr('cy', d => p([d.lon, d.lat])?.[1] ?? -99);
      if (sel) { const pt = p([sel.lon, sel.lat]) || [-99, -99]; svg.select('.selring').attr('cx', pt[0]).attr('cy', pt[1]); svg.select('.sellabel').attr('x', pt[0] + rad(sel.fit) + 10).attr('y', pt[1] + 4); }
    };
    svg.transition().duration(750).ease(d3.easeCubicInOut).tween('z', () => (k: number) => { p.scale(s0 + (t.s - s0) * k).translate([t0[0] + (t.t[0] - t0[0]) * k, t0[1] + (t.t[1] - t0[1]) * k]); redraw(); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [st.region]);

  return (
    <div className="mapwrap" id="mapwrap" ref={wrap}>
      <div className="regions" id="regions">
        {(['All', ...REGIONS] as const).map(r => (
          <button key={r} className={`rg ${st.region === r ? 'on' : ''}`} onClick={() => setRegion(r)}>{r === 'All' ? 'Global' : r}<em>{companies.filter(d => r === 'All' || d.region === r).length}</em></button>
        ))}
      </div>
      <svg id="map" ref={svgRef} />
      <div className="tip" id="tip" ref={tipRef} />
      <div className="legend">
        <span><i style={{ width: 6, height: 6 }} />Fit &lt;50</span><span><i style={{ width: 10, height: 10 }} />50–75</span><span><i style={{ width: 14, height: 14 }} />75+</span>
        <span className="lsep" />
        <span><i style={{ width: 10, height: 10 }} />Seeking capital</span><span><i style={{ width: 10, height: 10, background: '#1A1D20' }} />Big Pharma</span><span><i style={{ width: 10, height: 10, background: '#fff', boxShadow: 'inset 0 0 0 2px #0F4C52' }} />Investor</span>
      </div>
      <span className="asof">HQ locations · {hasSample ? 'sample data · ' : ''}{fmtDate(today)}</span>
    </div>
  );
}
