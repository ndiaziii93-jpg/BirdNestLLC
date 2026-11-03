(() => {
window.KIND = {
  seeking: { label: 'Seeking capital', short: 'Seeking capital', fill: '#0F4C52', stroke: '#fff' },
  pharma: { label: 'Big Pharma', short: 'Big Pharma', fill: '#1A1D20', stroke: '#fff' },
  investor: { label: 'Investor', short: 'Investors', fill: '#fff', stroke: '#0F4C52' }
};
DATA.forEach(d => { if (!d.kind) d.kind = 'seeking'; });
const P = [
  ['pharma', 'Aldren Pharma', 'Basel', 'Switzerland', 'Switzerland', 'Europe', 47.56, 7.59, 'Drug', 'Posterior', 'IRDs', 'Retina · gene therapy and sustained-release delivery', 'Public (SIX: ALDN)', 'In-license Ph2+, $50–150M upfront', 'Global · $48B revenue', 'Co-development · subretinal AAV · Mar 2026', 84, 3, 'Retina BD lead met at EURETINA; open to XLRS and Stargardt assets.', 1886, '92,000'],
  ['pharma', 'Kestova Pharmaceutical', 'Tokyo', 'Japan', 'Japan', 'APAC', 35.68, 139.69, 'Drug', 'Anterior', 'Dry eye', 'Anterior segment · dry eye and glaucoma, Japan and Asia rights', 'Public (TSE: 4519)', 'Regional rights, Ph2–Ph3', 'APAC · $9B revenue', 'Japan rights · glaucoma drop · Nov 2025', 77, 2, 'Seeking Japan and China rights to late-stage anterior assets.', 1923, '18,400'],
  ['pharma', 'Northmoor Pharmaceuticals', 'Princeton, NJ', 'USA', 'United States of America', 'Americas', 40.35, -74.66, 'Drug', 'Posterior', 'GA', 'Retina · nAMD, DME, GA; option-to-acquire structures', 'Public (NYSE: NMP)', 'Options and M&A, $200M+', 'Global · $31B revenue', 'Option deal · GA complement · Jul 2025', 80, 4, 'Prefers option-to-acquire with milestone-heavy economics.', 1932, '41,000'],
  ['pharma', 'Vellacourt', 'Paris', 'France', 'France', 'Europe', 48.86, 2.35, 'Device', 'Anterior', 'Glaucoma/OHT', 'Ophthalmic devices · MIGS, IOLs and surgical', 'Public (EPA: VLC)', 'Tuck-in M&A, $50–300M', 'Global · $6B revenue', 'Acquisition · MIGS stent · Feb 2026', 68, 1, 'Device-focused; interested in MIGS and presbyopia IOLs.', 1972, '12,600'],
  ['pharma', 'Hanseo Pharma', 'Seoul', 'South Korea', 'South Korea', 'APAC', 37.57, 126.98, 'Drug', 'Posterior', 'DME', 'Biosimilars and retina, Korea and Southeast Asia', 'Public (KRX: 128940)', 'Regional licensing, co-commercialisation', 'APAC · $2B revenue', 'Licence · aflibercept biosimilar · Apr 2026', 62, 0, 'Regional partner for biosimilars and late-stage retina.', 1973, '4,800'],
  ['investor', 'Fjordline Ventures', 'Oslo', 'Norway', 'Norway', 'Europe', 59.91, 10.75, 'Drug', 'Posterior', 'IRDs', 'Ophthalmology and rare retina · seed to Series B', 'Private', '$5–25M per round', 'Seed to Series B', 'Fund II · $320M · 2025', 79, 2, 'Lead investor type; strong Nordic retina network.', 2016, '14'],
  ['investor', 'Tidewater Life Sciences', 'Boston', 'USA', 'United States of America', 'Americas', 42.36, -71.06, 'Drug', 'Posterior', 'nAMD', 'Ophthalmology and neuroscience · Series B–C', 'Private', '$20–60M per round', 'Series B to C', 'Fund IV · $850M · 2024', 74, 1, 'Co-invests alongside strategics; likes option structures.', 2004, '38'],
  ['investor', 'Granary Capital', 'London', 'UK', 'United Kingdom', 'Europe', 51.51, -0.13, 'Drug', 'Anterior', 'Dry eye', 'Growth equity · late clinical and commercial', 'Private', '$40–120M per deal', 'Late stage and pre-IPO', 'Growth Fund III · $1.2B · 2023', 66, 0, 'Late-stage only; useful for Ph3 financings.', 2009, '52'],
  ['investor', 'Kaiyo Partners', 'Singapore', 'Singapore', 'Singapore', 'APAC', 1.29, 103.85, 'Drug', 'Anterior', 'Myopia', 'Asia ophthalmology · myopia and anterior', 'Private', '$2–10M per round', 'Seed to Series A', 'Fund I · $210M · 2025', 58, 0, 'Early stage; strong myopia thesis in Asia.', 2019, '9'],
  ['investor', 'Sable Peak Health', 'San Francisco', 'USA', 'United States of America', 'Americas', 37.77, -122.42, 'Device', 'Posterior', 'NPDR/DR', 'Crossover · devices and diagnostics', 'Private', '$25–75M per round', 'Crossover and pre-IPO', 'Crossover Fund II · $600M · 2024', 63, 1, 'Crossover investor; device and diagnostics focus.', 2012, '27']
];
P.forEach((p, i) => {
  const [kind, name, city, cdisp, country, region, lat, lon, type, seg, ind, asset, own, appetite, scale, raise, fit, deal, topic, founded, heads] = p;
  const base = Math.round(fit / 20), scores = [0, 1, 2, 3, 4, 5].map(k => Math.max(1, Math.min(5, base + ((i + k) % 3 === 0 ? 1 : (i + k) % 3 === 1 ? 0 : -1))));
  const f = calcFit(scores), last = 4 + ((i * 13) % 70);
  DATA.push({ id: 'k' + i, kind, name, city, cdisp, country, region, lat: lat + (i % 2 ? .4 : -.4), lon: lon + (i % 2 ? -.5 : .5), type, seg, ind, asset, phase: null, phaseLabel: '—',
    fit: f, prevFit: f, trend: (i % 3) - 1, dec: f >= 76 ? 'Pursue' : f >= 50 ? 'Watch' : 'Pass', deal, cat: kind === 'pharma' ? 'BD partnering day · Q1 2027' : 'Partner meeting · Q4 2026',
    runway: 0, raise, rights: 0, rightsArr: [false, false, false, false, false, false], last, topic, own, scores, why: ['', '', '', '', '', ''],
    website: name.toLowerCase().replace(/[^a-z]/g, '') + '.com', founded: String(founded), heads, rationale: '', appetite, scale,
    notes: [[last, kind === 'pharma' ? 'Meeting' : 'Call', topic, false]], logo: null });
});
const KDESC = { seeking: 'Biotech and medtech raising or partnering', pharma: 'Large pharma licensing or acquiring', investor: 'VC funds and investment groups' };
window.kindSeg = () => {
  const pool = DATA.filter(d => baseMatch(d, 'kind') && qMatch(d)), cur = st.kind || 'All', n = k => pool.filter(d => (d.kind || 'seeking') === k).length;
  const c = cur !== 'All' && KIND[cur];
  return `<div class="grp"><span class="gl sm"><span>Category</span></span><div class="kdd">
    <button class="kddb ${cur !== 'All' ? 'set' : ''}" data-kdt aria-haspopup="listbox" aria-expanded="false"><span class="v">${c ? `<i class="kd ${cur}"></i>${c.label}` : 'All categories'}</span><span class="n">${c ? n(cur) : pool.length}</span><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#5E6368" stroke-width="1.5"><path d="M6 9l6 6 6-6"/></svg></button>
    <div class="kmenu" role="listbox"><button data-kd="All" role="option" aria-selected="${cur === 'All'}"><span></span><span>All categories</span><em>${pool.length}</em><span class="ck">${cur === 'All' ? '✓' : ''}</span></button><div class="sep"></div>
    ${Object.entries(KIND).map(([k, x]) => `<button data-kd="${k}" role="option" aria-selected="${cur === k}"><i class="kd ${k}"></i><span>${x.label}<small>${KDESC[k]}</small></span><em>${n(k)}</em><span class="ck">${cur === k ? '✓' : ''}</span></button>`).join('')}</div></div></div>`;
};
document.addEventListener('click', e => {
  const t = e.target.closest('[data-kdt]');
  document.querySelectorAll('.kdd').forEach(d => { if (!t || !d.contains(t)) { d.classList.remove('open'); const b = d.querySelector('[data-kdt]'); if (b) b.setAttribute('aria-expanded', 'false'); } });
  if (t) { const d = t.closest('.kdd'), o = d.classList.toggle('open'); t.setAttribute('aria-expanded', o); }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') document.querySelectorAll('.kdd.open').forEach(d => d.classList.remove('open')); });
document.addEventListener('click', e => { const o = e.target.closest('.kmenu [data-kd]'); if (o) { e.stopImmediatePropagation(); st.kind = o.dataset.kd; refresh(); } }, true);
st.kind = 'All';
const css = document.createElement('style');
css.textContent = `
#trCol .kdd{position:relative}
#trCol .kddb{width:100%;height:42px;border:1px solid var(--strong);border-radius:10px;background:#fff;display:flex;align-items:center;gap:10px;padding:0 12px;font-size:13px;text-align:left}
#trCol .kddb:hover{border-color:var(--teal)}
#trCol .kdd.open .kddb{border-color:var(--teal);box-shadow:0 0 0 3px var(--tealSoft)}
#trCol .kddb .v{flex:1;display:flex;align-items:center;gap:8px;min-width:0;white-space:nowrap}
#trCol .kddb .n{font-family:var(--mono);font-size:12px;padding:2px 8px;border-radius:999px;background:var(--sunken)}
#trCol .kddb.set{border-color:var(--teal);background:var(--brassSoft)}
#trCol .kddb.set .v{color:var(--teal);font-weight:500}
#trCol .kddb.set .n{background:#fff;color:var(--brassInk)}
#trCol .kmenu{position:absolute;left:0;right:0;top:48px;z-index:5;background:#fff;border:1px solid var(--line);border-radius:12px;box-shadow:0 1px 2px rgba(26,29,32,.04),0 12px 32px rgba(26,29,32,.08);padding:6px;display:none}
#trCol .kdd.open .kmenu{display:block}
#trCol .kmenu button{width:100%;display:grid;grid-template-columns:16px minmax(0,1fr) auto 16px;gap:10px;align-items:center;min-height:40px;padding:4px 10px;border:0;border-radius:8px;background:none;font-size:13px;text-align:left}
#trCol .kmenu button:hover{background:var(--bg)}
#trCol .kmenu button small{display:block;font-size:11px;color:var(--faint)}
#trCol .kmenu button em{font-style:normal;font-family:var(--mono);font-size:12px;color:var(--muted)}
#trCol .kmenu .ck{color:var(--teal)}
#trCol .kmenu .sep{height:1px;background:var(--line);margin:4px 6px}
#refine{height:336px!important;overflow:visible}
.kd{width:9px;height:9px;border-radius:999px;flex:none;display:inline-block}
.kd.seeking{background:#0F4C52}.kd.pharma{background:#1A1D20}.kd.investor{background:#fff;box-shadow:inset 0 0 0 2px #0F4C52}
.kchip{height:22px;padding:0 8px;display:inline-flex;align-items:center;border-radius:6px;background:var(--sunken);color:var(--ink);font-size:11px;font-weight:500;white-space:nowrap;flex:none}
.pillrow{flex-wrap:wrap;row-gap:4px}
.asof{top:16px;bottom:auto!important}
.legend{flex-wrap:wrap;max-width:calc(100% - 32px);row-gap:4px}
.legend .lsep{width:1px;height:12px;background:var(--line)}
`;
document.head.appendChild(css);
if (typeof refresh === 'function') { refresh(); renderCard(); }
if (window.makeDots && typeof draw === 'function') { makeDots(); draw(); }
})();
