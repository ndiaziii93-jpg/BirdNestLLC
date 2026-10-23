(() => {
const V = {
  view: 'map',
  co: { q: '', kind: 'All', dec: 'All', sv: 'All', layout: 'table', sk: 'fit', sd: -1 },
  pb: { kind: 'All', dec: 'All', type: 'All', open: null },
  ds: { type: 'All', hidePriv: false, q: '', form: { cid: 's0', type: 'Call', text: '', date: '2026-10-19', priv: false } },
  se: { tab: 'weights', lens: 'Partnering', draft: null, msg: '',
    svc: [['Funding certainty', 25, 'Cash, runway and committed budget'], ['Scope fit', 25, 'Match to our CRO, CMC or regulatory services'], ['Timeline', 20, 'When work would start'], ['Relationship strength', 15, 'Warmth and access to decision-makers'], ['Strategic value', 15, 'Reference value and follow-on work']],
    met: ['EURETINA', 'ESCRS', 'AAO', 'ARVO', 'BIO', 'Inbound', 'Referral', 'Banker'] }
};
const TYPES = ['Call', 'Meeting', 'Email', 'Congress', 'Note'];
const DEF_W = [25, 20, 15, 15, 15, 10];
const BASE = new Date(2026, 9, 19);

(function seedNotes() {
  let s = 97; const r = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  const TX = ['Intro call with CBO; asked for the non-confidential deck.', 'Met at ARVO 2026; follow-up on Phase 2 design.', 'Requested public pipeline summary.', 'Banker outreach on process timing.', 'Competitor readout may shift their positioning.', 'Call with CEO on runway and financing plans.', 'Discussed US rights scope at a high level.', 'Met at AAO 2026, Chicago.', 'Shared our therapeutic-area priorities.'];
  DATA.forEach(d => {
    d.notes = (d.notes || []).map(n => [n[0], n[1], n[2], !!n[3]]);
    if (d.id === 's0') { d.notes.splice(2, 0, [25, 'Note', 'Banker indicates upfront floor near $45M.', true], [31, 'Email', 'Requested natural-history dataset summary from Jonas Strand.', false]); d.notes.sort((a, b) => a[0] - b[0]); return; }
    const k = Math.floor(r() * 3); let off = d.notes.length ? d.notes[d.notes.length - 1][0] : d.last;
    for (let i = 0; i < k; i++) { off += Math.round(8 + r() * 40); d.notes.push([off, TYPES[Math.floor(r() * 5)], TX[Math.floor(r() * TX.length)], r() < .15]); }
  });
})();

const ini = d => d.logo ? `<img src="${d.logo}" alt="">` : esc((d.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase());
const pill = d => `<span class="vpill" style="background:${DEC[d.dec][0]};color:${DEC[d.dec][1]}">${d.dec}</span>`;
const mring = (f, s = 22) => { const r = s / 2 - 2, C = 2 * Math.PI * r; return `<svg viewBox="0 0 ${s} ${s}" width="${s}" height="${s}" aria-hidden="true"><circle cx="${s / 2}" cy="${s / 2}" r="${r}" fill="none" stroke="#EEEBE4" stroke-width="2.5"/><circle cx="${s / 2}" cy="${s / 2}" r="${r}" fill="none" stroke="#B08D57" stroke-width="2.5" stroke-dasharray="${(f / 100 * C).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 ${s / 2} ${s / 2})"/></svg>`; };
const dealName = d => d.deal < 0 ? 'Parked' : DEALS[d.deal];
const head = (t, sub, act = '') => `<div class="vhead"><div><h1>${t}</h1><span>${sub}</span></div><div class="vact">${act}</div></div>`;
const seg = (opts, cur, attr) => `<div class="vseg">${opts.map(o => { const [v, l, n] = Array.isArray(o) ? o : [o, o]; return `<button ${attr}="${v}" class="${cur === v ? 'on' : ''}">${l}${n != null ? ` <em>${n}</em>` : ''}</button>`; }).join('')}</div>`;
const LOCK = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
const X = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M7 7l10 10M17 7L7 17"/></svg>';
function downloadCSV(rows, name) {
  const q = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  const csv = [['Company', 'HQ', 'Country', 'Region', 'Type', 'Segment', 'Lead asset', 'Indication', 'Phase', 'Deal stage', 'Decision', 'Fit', 'Rights open', 'Last touch (d)', 'Next catalyst'].join(','),
    ...rows.map(d => [d.name, d.city, d.cdisp, d.region, d.type, d.seg, d.asset, d.ind, d.phaseLabel, dealName(d), d.dec, d.fit, d.rights + '/6', d.last, d.cat].map(q).join(','))].join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = name; a.click();
}

/* ---------- Companies ---------- */
const SV = [['All', 'All', () => true], ['Pursue', 'Pursue', d => d.dec === 'Pursue'], ['GADR', 'GA and DR', d => ['GA', 'NPDR/DR'].includes(d.ind)], ['EU', 'Licensing EU rights', d => d.rightsArr && d.rightsArr[1]], ['60d', 'Not touched 60d+', d => d.last >= 60]];
function rCo() {
  const c = V.co, E = $('v-companies'), svf = SV.find(s => s[0] === c.sv)[2], q = c.q.toLowerCase();
  const base = DATA.filter(d => svf(d) && (c.kind === 'All' || (d.kind || 'seeking') === c.kind));
  const rows0 = base.filter(d => (c.dec === 'All' || d.dec === c.dec) && (!q || (d.name + ' ' + d.asset + ' ' + d.city + ' ' + d.cdisp + ' ' + d.ind).toLowerCase().includes(q)));
  const key = { name: d => d.name, type: d => d.type + d.seg, ind: d => d.ind, phase: d => [...DRUG_PH, ...DEV_PH].indexOf(d.phase), deal: d => d.deal, rights: d => d.rights, dec: d => ['Pursue', 'Watch', 'Pass'].indexOf(d.dec), fit: d => d.fit, last: d => d.last };
  const k = key[c.sk] || key.fit, rows = [...rows0].sort((a, b) => { const x = k(a), y = k(b); return (x > y ? 1 : x < y ? -1 : 0) * c.sd; });
  const rank = [...DATA].sort((a, b) => b.fit - a.fit).map(d => d.id);
  const cols = [['', '#'], ['name', 'Company'], ['fit', 'Fit'], ['dec', 'Decision'], ['', 'Lead asset'], ['type', 'Type · segment'], ['ind', 'Indication'], ['phase', 'Phase'], ['deal', 'Deal stage'], ['rights', 'Rights'], ['last', 'Last touch'], ['', 'Next catalyst'], ['', '']];
  const th = cols.map(([k, l]) => k ? `<button data-sk="${k}" class="${c.sk === k ? 'on' : ''}">${l}${c.sk === k ? (c.sd > 0 ? ' ↑' : ' ↓') : ''}</button>` : `<span>${l}</span>`).join('');
  const table = `<div class="ctable" role="table"><div class="chead">${th}</div>${rows.map(d => `<div class="crow" data-open="${d.id}" tabindex="0" role="row">
    <span class="mono f">${String(rank.indexOf(d.id) + 1).padStart(2, '0')}</span>
    <span class="cn"><span class="lg2">${ini(d)}</span><span><b>${esc(d.name)}</b><small>${esc(d.city)}, ${esc(d.cdisp)} · ${KIND[d.kind || 'seeking'].short}</small></span></span>
    <span class="fitc2">${mring(d.fit)}<b>${d.fit}</b></span><span>${pill(d)}</span><span class="mu">${esc(d.asset)}</span><span class="mu">${d.kind && d.kind !== 'seeking' ? KIND[d.kind].short : d.type + ' · ' + d.seg}</span><span>${esc(d.ind)}</span><span class="mu">${d.phaseLabel}</span><span>${dealName(d)}</span>
    <span class="mono">${d.kind && d.kind !== 'seeking' ? '—' : d.rights + '/6'}</span>
    <span class="mono ${d.last > 60 ? 'late' : ''}">${d.last}d</span>
    <span class="catc2">${d.cat && d.cat !== 'None set' ? '<i class="dia"></i>' + esc(d.cat) : '<span class="fa">None set</span>'}</span>
    <span class="ract"><button class="sec xbtn" data-x1="${d.id}" aria-label="Export one-pager for ${esc(d.name)}">Export one-pager</button></span></div>`).join('') || '<p class="vempty">No companies match. Clear the search or pick another view.</p>'}</div>`;
  const cards = rows.length ? `<div class="cgrid">${rows.map(d => `<button class="ccard" data-open="${d.id}"><span class="cct"><span class="lg2">${ini(d)}</span><span class="nm"><b>${esc(d.name)}</b><small>${esc(d.city)}, ${esc(d.cdisp)}</small></span><span class="fitc2">${mring(d.fit, 36)}<b>${d.fit}</b></span></span>
    <span class="ccm">${esc(d.asset)}<br><span class="mu">${d.phaseLabel} · ${dealName(d)}</span></span><span class="ccf">${pill(d)}<span class="mu el">${esc(d.cat)}</span><span class="mono">${d.last}d</span></span></button>`).join('')}</div>` : '<p class="vempty">No companies match.</p>';
  E.innerHTML = head('Companies', `${rows.length} of ${DATA.length} · sample data · as of 19 Oct 2026`, '<button class="sec" data-csv>Export CSV</button><button class="sec" data-new>Add company</button>') +
    `<div class="vbar"><label class="vsearch"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><input data-q value="${esc(c.q)}" placeholder="Filter by company, asset, city, indication" aria-label="Filter companies"></label>
    ${seg([['All', 'All', base.length], ...['Pursue', 'Watch', 'Pass'].map(x => [x, x, base.filter(d => d.dec === x).length])], c.dec, 'data-dec')}${seg([['All', 'All'], ...Object.entries(KIND).map(([k, x]) => [k, x.short, DATA.filter(d => svf(d) && (d.kind || 'seeking') === k).length])], c.kind, 'data-kd')}<span class="sp"></span>${seg([['table', 'Table'], ['cards', 'Cards']], c.layout, 'data-lay')}</div>
    <div class="vviews"><span class="ovl">Saved views</span>${SV.map(s => `<button data-sv="${s[0]}" class="${c.sv === s[0] ? 'on' : ''}">${s[1]}<em>${DATA.filter(s[2]).length}</em></button>`).join('')}</div>` + (c.layout === 'table' ? table : cards);
  E.querySelectorAll('[data-sk]').forEach(b => b.onclick = () => { const k = b.dataset.sk; if (c.sk === k) c.sd *= -1; else { c.sk = k; c.sd = (k === 'fit' || k === 'rights' || k === 'last') ? -1 : 1; } rCo(); });
  E.querySelectorAll('[data-open]').forEach(r => { r.onclick = e => { if (!e.target.closest('[data-x1]')) (window.openAccount || openProfile)(r.dataset.open); }; r.onkeydown = e => { if (e.key === 'Enter') (window.openAccount || openProfile)(r.dataset.open); }; });
  E.querySelectorAll('[data-x1]').forEach(b => b.onclick = () => openExport(b.dataset.x1));
  E.querySelectorAll('[data-dec]').forEach(b => b.onclick = () => { c.dec = b.dataset.dec; rCo(); });
  E.querySelectorAll('[data-lay]').forEach(b => b.onclick = () => { c.layout = b.dataset.lay; rCo(); });
  E.querySelectorAll('[data-kd]').forEach(b => b.onclick = () => { c.kind = b.dataset.kd; rCo(); });
  E.querySelectorAll('[data-sv]').forEach(b => b.onclick = () => { c.sv = b.dataset.sv; rCo(); });
  E.querySelector('[data-q]').oninput = e => { c.q = e.target.value; const p = e.target.selectionStart; rCo(); const n = E.querySelector('[data-q]'); n.focus(); n.setSelectionRange(p, p); };
  E.querySelector('[data-csv]').onclick = () => downloadCSV(rows, 'birdnest-companies.csv');
  E.querySelector('[data-new]').onclick = () => openAdd();
}

/* ---------- Partnering ---------- */
const STAGES = [...DEALS.map((n, i) => [i, n]), [-1, 'Parked']];
function rPb() {
  const p = V.pb, E = $('v-partnering');
  const pool = DATA.filter(d => (p.dec === 'All' || d.dec === p.dec) && (p.type === 'All' || d.type === p.type) && (p.kind === 'All' || (d.kind || 'seeking') === p.kind));
  const pulse = [['TRACKED', pool.length, 'In this view'], ['IN CONVERSATION', pool.filter(d => d.deal >= 1 && d.deal <= 2).length, 'First contact or intro call'], ['CDA OR LATER', pool.filter(d => d.deal >= 3 && d.deal <= 5).length, 'CDA, diligence, term sheet'], ['PURSUE', pool.filter(d => d.dec === 'Pursue').length, 'Decision as of today'], ['PARKED', pool.filter(d => d.deal < 0).length, 'Not active']];
  const col = ([i, n]) => { const cs = pool.filter(d => d.deal === i).sort((a, b) => b.fit - a.fit);
    return `<div class="kcol ${i < 0 ? 'park' : ''}" data-stage="${i}"><div class="kh"><span>${n}</span><em>${cs.length}</em></div><div class="kl">${cs.map(d => `<div class="kc ${p.open === d.id ? 'on' : ''}" draggable="true" data-id="${d.id}" tabindex="0" role="button" aria-label="${esc(d.name)}, fit ${d.fit}"><div class="kt"><b>${esc(d.name)}</b><span class="fn">${d.fit}</span></div><span class="ks">${esc(d.asset.split(' · ')[0])} · ${esc(d.ind)} · ${d.phaseLabel}</span><div class="kf">${pill(d)}<span class="mono ${d.last > 60 ? 'late' : ''}">${d.last}d</span>${d.cat && d.cat !== 'None set' && d.cat.includes(' · ') ? `<span class="kq"><i class="dia"></i>${esc(d.cat.split(' · ')[1])}</span>` : ''}</div></div>`).join('') || '<span class="kempty">Drop a company here</span>'}</div></div>`; };
  const d = DATA.find(x => x.id === p.open);
  let drawer = '';
  if (d) {
    const nx = d.deal < 0 ? 'Reopen as Identified' : d.deal >= 6 ? 'Closed' : 'Move to ' + DEALS[d.deal + 1];
    drawer = `<aside class="pdrawer" aria-label="Company record"><div class="pdh"><span class="lg2" style="width:44px;height:44px">${ini(d)}</span><div class="n"><b>${esc(d.name)}</b><span class="pdsight"></span><span>${esc(d.city)}, ${esc(d.cdisp)} · ${esc(d.own)}</span><span>${pill(d)}</span></div><span class="fitc2" style="flex-direction:column;gap:2px">${mring(d.fit, 52)}<b>${d.fit}</b></span><button class="x" data-close aria-label="Close"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
      <div class="pstep"><div class="lab"><span>Deal stage</span><b style="font-weight:500">${dealName(d)}</b></div><div class="bars">${DEALS.map((n, i) => `<i title="${n}" class="${d.deal < 0 ? '' : i < d.deal ? 'd' : i === d.deal ? 'c' : ''}"></i>`).join('')}</div>
      <div class="btns"><button class="primary" data-adv ${d.deal >= 6 ? 'disabled' : ''}>${nx}</button>${d.deal >= 0 ? '<button class="sec" data-park>Park</button>' : ''}</div></div>
      <div class="pkv">${[['Lead asset', esc(d.asset)], ['Phase', d.phaseLabel], ['Rights open', d.rights + '/6 territories'], ['Runway', d.runway + ' mo · as of 30 Jun 2026'], ['Last raise', esc(d.raise || 'Not stated')], ['Next catalyst', esc(d.cat || 'None set')]].map(r => `<div><span>${r[0]}</span><span style="color:var(--ink)">${r[1]}</span></div>`).join('')}</div>
      <div><span class="ovl">RECENT DISCUSSIONS</span><div class="pnl" style="margin-top:6px">${d.notes.slice(0, 4).map(n => `<div><span class="mono">${fmt(n[0]).slice(0, 6)} · ${n[1]}</span><span>${esc(n[2])}${n[3] ? ' <span class="fa">· private</span>' : ''}</span></div>`).join('') || '<span class="fa" style="font-size:12px">None logged.</span>'}</div></div>
      <div class="pdact"><button class="sec" data-prof>Open profile</button><button class="sec" data-exp>One-pager</button></div></aside>`;
  }
  E.innerHTML = head('Partnering', 'Deal stage, separate from clinical stage · drag a card to move it · as of 19 Oct 2026') +
    `<div class="ppulse">${pulse.map(x => `<div><span>${x[0]}</span><b>${x[1]}</b><small>${x[2]}</small></div>`).join('')}</div>
    <div class="vbar">${seg([['All', 'All'], ...Object.entries(KIND).map(([k, x]) => [k, x.short])], p.kind, 'data-kd')}${seg(['All', 'Pursue', 'Watch', 'Pass'], p.dec, 'data-dec')}${seg(['All', 'Drug', 'Device'], p.type, 'data-ty')}</div>
    <div class="pbwrap ${d ? 'open' : ''}"><div class="board">${STAGES.map(col).join('')}</div>${drawer}</div>`;
  E.querySelectorAll('[data-dec]').forEach(b => b.onclick = () => { p.dec = b.dataset.dec; rPb(); });
  E.querySelectorAll('[data-ty]').forEach(b => b.onclick = () => { p.type = b.dataset.ty; rPb(); });
  E.querySelectorAll('[data-kd]').forEach(b => b.onclick = () => { p.kind = b.dataset.kd; rPb(); });
  E.querySelectorAll('.kc').forEach(k => {
    k.onclick = () => { p.open = p.open === k.dataset.id ? null : k.dataset.id; rPb(); };
    k.onkeydown = e => { if (e.key === 'Enter') k.click(); };
    k.ondragstart = e => { e.dataTransfer.setData('text/plain', k.dataset.id); e.dataTransfer.effectAllowed = 'move'; k.classList.add('dragging'); };
    k.ondragend = () => k.classList.remove('dragging');
  });
  E.querySelectorAll('.kcol').forEach(c => {
    c.ondragover = e => { e.preventDefault(); c.classList.add('over'); };
    c.ondragleave = e => { if (!c.contains(e.relatedTarget)) c.classList.remove('over'); };
    c.ondrop = e => { e.preventDefault(); c.classList.remove('over'); const id = e.dataTransfer.getData('text/plain'), x = DATA.find(y => y.id === id); if (x) moveStage(x, +c.dataset.stage); };
  });
  if (d) {
    E.querySelector('[data-close]').onclick = () => { p.open = null; rPb(); };
    const adv = E.querySelector('[data-adv]'); if (adv) adv.onclick = () => moveStage(d, d.deal < 0 ? 0 : Math.min(6, d.deal + 1));
    const pk = E.querySelector('[data-park]'); if (pk) pk.onclick = () => moveStage(d, -1);
    E.querySelector('[data-prof]').onclick = () => (window.openAccount || openProfile)(d.id);
    E.querySelector('[data-exp]').onclick = () => openExport(d.id);
  }
}
function moveStage(d, i) { if (d.deal === i) return; d.deal = i; d.notes.unshift([0, 'Note', 'Deal stage moved to ' + dealName(d) + '.', false]); V.pb.open = d.id; refresh(); }

/* ---------- Discussions ---------- */
function allNotes() { const o = []; DATA.forEach(d => (d.notes || []).forEach(n => o.push({ d, off: n[0], type: n[1], text: n[2], priv: !!n[3] }))); return o.sort((a, b) => a.off - b.off); }
function rDs() {
  const s = V.ds, f = s.form, E = $('v-discussions'), q = s.q.toLowerCase(), all = allNotes();
  const list = all.filter(n => (s.type === 'All' || n.type === s.type) && (!s.hidePriv || !n.priv) && (!q || (n.d.name + ' ' + n.text).toLowerCase().includes(q)));
  const groups = []; list.forEach(n => { const m = fmt(n.off).slice(3); let g = groups[groups.length - 1]; if (!g || g.m !== m) groups.push(g = { m, items: [] }); g.items.push(n); });
  const l30 = all.filter(n => n.off <= 30), mx = Math.max(1, ...TYPES.map(t => l30.filter(n => n.type === t).length));
  const stale = DATA.filter(d => d.last >= 60).sort((a, b) => b.fit - a.fit).slice(0, 8);
  const act = DATA.map(d => [d, d.notes.filter(n => n[0] <= 90).length]).filter(x => x[1]).sort((a, b) => b[1] - a[1] || b[0].fit - a[0].fit).slice(0, 5);
  E.innerHTML = head('Discussions', `${all.length} entries across ${DATA.filter(d => d.notes.length).length} companies · private entries never appear in Present mode or PDFs`) +
    `<div class="dsgrid"><div style="display:flex;flex-direction:column;gap:14px;min-width:0">
      <div class="dadd"><span class="ovl">LOG A DISCUSSION</span><div class="r">
        <select data-f="cid" aria-label="Company">${[...DATA].sort((a, b) => a.name.localeCompare(b.name)).map(d => `<option value="${d.id}" ${f.cid === d.id ? 'selected' : ''}>${esc(d.name)}</option>`).join('')}</select>
        ${seg(TYPES, f.type, 'data-ft')}<input type="date" data-f="date" value="${f.date}" aria-label="Date"></div>
        <div class="r"><input type="text" data-f="text" value="${esc(f.text)}" placeholder="One line · what was discussed" aria-label="Discussion"><button class="dpriv ${f.priv ? 'on' : ''}" data-priv aria-pressed="${f.priv}"><i></i>Private</button><button class="primary" data-save>Save</button></div>
        <span class="rule">Public information and your own notes only.</span></div>
      <div class="vbar"><label class="vsearch"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><input data-q value="${esc(s.q)}" placeholder="Search discussions" aria-label="Search discussions"></label>
        ${seg([['All', 'All', all.length], ...TYPES.map(t => [t, t, all.filter(n => n.type === t).length])], s.type, 'data-ty')}<button class="dpriv ${s.hidePriv ? 'on' : ''}" data-hp aria-pressed="${s.hidePriv}"><i></i>Hide private</button></div>
      <div class="dfeed">${groups.map(g => `<div class="dmon"><span>${g.m.toUpperCase()}</span><span>${g.items.length}</span></div>${g.items.map(n => `<div class="drow"><span class="mono">${fmt(n.off)}</span><span class="ty">${n.type}</span><button class="co" data-open="${n.d.id}">${esc(n.d.name)}</button><span class="tx">${esc(n.text)}</span>${n.priv ? `<span class="pv">${LOCK}Private</span>` : '<span></span>'}</div>`).join('')}`).join('') || '<p class="vempty">No discussions match.</p>'}</div>
    </div>
    <aside class="drail">
      <div class="rcard"><h3><span>LAST 30 DAYS</span><span>${l30.length}</span></h3>${TYPES.map(t => { const n = l30.filter(x => x.type === t).length; return `<div class="rbar"><span>${t}</span><span class="b"><i style="width:${n / mx * 100}%"></i></span><em>${n}</em></div>`; }).join('')}</div>
      <div class="rcard"><h3><span>NOT TOUCHED 60D+</span><span>${DATA.filter(d => d.last >= 60).length}</span></h3><div class="rlist">${stale.map(d => `<button data-open="${d.id}"><b>${esc(d.name)}</b><span class="mono late">${d.last}d</span><span class="mono" style="color:var(--brassInk)">${d.fit}</span></button>`).join('') || '<span class="fa">None</span>'}</div></div>
      <div class="rcard"><h3><span>MOST ACTIVE · 90 DAYS</span><span>ENTRIES</span></h3><div class="rlist">${act.map(([d, n]) => `<button data-open="${d.id}"><b>${esc(d.name)}</b><span class="mono">${n}</span><span class="mono" style="color:var(--brassInk)">${d.fit}</span></button>`).join('')}</div></div>
    </aside></div>`;
  E.querySelectorAll('[data-f]').forEach(el => el.addEventListener(el.tagName === 'SELECT' || el.type === 'date' ? 'change' : 'input', () => { f[el.dataset.f] = el.value; }));
  E.querySelector('[data-f="text"]').onkeydown = e => { if (e.key === 'Enter') save(); };
  E.querySelectorAll('[data-ft]').forEach(b => b.onclick = () => { f.type = b.dataset.ft; rDs(); });
  E.querySelector('[data-priv]').onclick = () => { f.priv = !f.priv; rDs(); };
  E.querySelector('[data-hp]').onclick = () => { s.hidePriv = !s.hidePriv; rDs(); };
  E.querySelectorAll('[data-ty]').forEach(b => b.onclick = () => { s.type = b.dataset.ty; rDs(); });
  E.querySelectorAll('[data-open]').forEach(b => b.onclick = () => (window.openAccount || openProfile)(b.dataset.open));
  E.querySelector('[data-q]').oninput = e => { s.q = e.target.value; const p = e.target.selectionStart; rDs(); const n = E.querySelector('[data-q]'); n.focus(); n.setSelectionRange(p, p); };
  E.querySelector('[data-save]').onclick = save;
  function save() {
    const t = (f.text || '').trim(); if (!t) { const i = E.querySelector('[data-f="text"]'); i.focus(); return; }
    const d = DATA.find(x => x.id === f.cid), off = Math.max(0, Math.round((BASE - new Date(f.date + 'T00:00')) / 864e5));
    d.notes.push([off, f.type, t, f.priv]); d.notes.sort((a, b) => a[0] - b[0]);
    if (off <= d.last) { d.last = off; if (!f.priv) d.topic = t; }
    f.text = ''; f.priv = false; refresh();
  }
}

/* ---------- Settings ---------- */
function rSe() {
  const s = V.se, E = $('v-settings');
  if (!s.draft) s.draft = SC.map(x => x[1]);
  const tabs = `<div class="stabs">${[['weights', 'Scorecard weights'], ['lists', 'Picklists'], ['data', 'Data']].map(t => `<button data-tab="${t[0]}" class="${s.tab === t[0] ? 'on' : ''}">${t[1]}</button>`).join('')}</div>`;
  let body = '';
  if (s.tab === 'weights') {
    const P = s.lens === 'Partnering', crit = P ? SC.map((x, i) => [x[0], s.draft[i], x[2]]) : s.svc;
    body = `<div class="vbar">${seg(['Partnering', 'Services client'], s.lens, 'data-lens')}<span class="mu" style="font-size:13px">${P ? 'Default lens. Fit is the weighted sum of six 1–5 scores, scaled to 100.' : 'Used for companies tracked as services clients.'}</span></div>
      <div class="sgrid"><div class="spanel"><h2>Weights</h2><p>Weights always total 100. Moving one slider rebalances the others in steps of 5. Changes apply to every company when you press Apply.</p>
        <div>${crit.map((c, i) => `<div class="wrow"><div><b>${c[0]}</b><small>${c[2]}</small></div><input type="range" min="0" max="50" step="5" value="${c[1]}" data-w="${i}" aria-label="${c[0]} weight"><input type="number" min="0" max="50" step="5" value="${c[1]}" data-wn="${i}" aria-label="${c[0]} weight value"></div>`).join('')}</div>
        <div class="wtot"><span class="t">Total <b id="wtot"></b> of 100</span><div class="btns"><button class="sec" data-def>Reset to default</button><button class="primary" data-apply>Apply</button></div></div><span class="wmsg">${s.msg}</span></div>
        <div class="spanel"><h2>${P ? 'Top 10 · live preview' : 'Preview'}</h2>${P ? '<p>How the top 10 would rank with the weights at left. Arrows compare with the current ranking.</p><div id="wprev"></div>' : '<p>No companies use the Services client lens yet. Weights are saved for when you add one.</p>'}</div></div>`;
  }
  if (s.tab === 'lists') {
    const used = i => DATA.filter(d => d.ind === i).length;
    const ilist = (lab, arr, key) => `<div class="spanel"><h2>${lab} indications</h2><p>Remove is available once no company uses the indication.</p><div class="plist">${arr.map(i => `<div class="it"><span>${esc(i)}</span><em>${used(i)}</em><button data-rm="${key}" data-v="${esc(i)}" ${used(i) ? 'disabled' : ''} aria-label="Remove ${esc(i)}">${X}</button></div>`).join('')}</div><div class="padd2"><input data-addv="${key}" placeholder="Add ${lab.toLowerCase()} indication"><button class="sec" data-add="${key}">Add</button></div></div>`;
    body = `<div class="plgrid">${ilist('Posterior', POST, 'POST')}${ilist('Anterior', ANT, 'ANT')}
      <div class="spanel"><h2>Where met</h2><p>Congresses and sources offered when logging a relationship.</p><div class="plist">${s.met.map(m => `<div class="it"><span>${esc(m)}</span><em></em><button data-rm="MET" data-v="${esc(m)}" aria-label="Remove ${esc(m)}">${X}</button></div>`).join('')}</div><div class="padd2"><input data-addv="MET" placeholder="Add a congress or source"><button class="sec" data-add="MET">Add</button></div></div>
      <div class="spanel"><h2>Fixed lists</h2><p>These drive the board and filters and can't be edited.</p><span class="ovl">DEAL STAGES</span><div class="ro">${[...DEALS, 'Parked'].map(x => `<span>${x}</span>`).join('')}</div><span class="ovl">DRUG PHASES</span><div class="ro">${DRUG_PH.map(x => `<span>${x}</span>`).join('')}</div><span class="ovl">DEVICE PHASES</span><div class="ro">${DEV_PH.map(x => `<span>${x}</span>`).join('')}</div><span class="ovl">REGIONS</span><div class="ro">${REGIONS.map(x => `<span>${x}</span>`).join('')}</div></div></div>`;
  }
  if (s.tab === 'data') {
    body = `<div class="sgrid"><div class="spanel"><h2>Data rule</h2><div class="drule"><svg viewBox="21 21 22 22" width="22" height="22" fill="none" style="flex:none"><path d="M38.56 28.17 A7.6 7.6 0 1 1 35.83 25.44" stroke="#7A5A26" stroke-width="4.4"/><circle cx="30.8" cy="32.3" r="3.2" fill="#B08D57"/></svg><span><b>Public information and your own notes only.</b> Nothing under a CDA. Private entries stay out of Present mode, one-pagers and exports.</span></div>
      <p>This build runs on sample data. Edits last until you reload the page.</p></div>
      <div class="spanel"><h2>Export</h2><p>${DATA.length} companies · ${allNotes().length} discussion entries.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="sec" data-all>Export all companies (CSV)</button></div></div></div>`;
  }
  E.innerHTML = head('Settings', 'One user · no sign-in · BirdNest · NDIII') + tabs + body;
  E.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { s.tab = b.dataset.tab; s.msg = ''; rSe(); });
  if (s.tab === 'weights') {
    const P = s.lens === 'Partnering', arr = P ? s.draft : s.svc.map(x => x[1]);
    const setW = (i, v) => {
      const w = P ? s.draft : s.svc.map(x => x[1]);
      v = Math.max(0, Math.min(50, Math.round(+v / 5) * 5 || 0));
      let rem = w[i] - v; w[i] = v;
      const others = w.map((x, k) => k).filter(k => k !== i);
      let guard = 200;
      while (rem !== 0 && guard--) {
        const step = rem > 0 ? 5 : -5;
        const order = others.filter(k => step > 0 ? w[k] < 50 : w[k] > 0).sort((a, b) => step > 0 ? w[a] - w[b] : w[b] - w[a]);
        if (!order.length) { w[i] += rem; rem = 0; break; }
        w[order[0]] += step; rem -= step;
      }
      if (P) s.draft = w; else w.forEach((x, k) => s.svc[k][1] = x);
      w.forEach((x, k) => { E.querySelector(`[data-w="${k}"]`).value = x; E.querySelector(`[data-wn="${k}"]`).value = x; });
      s.msg = ''; upd();
    };
    const upd = () => {
      const w = P ? s.draft : s.svc.map(x => x[1]), tot = w.reduce((a, b) => a + b, 0), t = $('wtot');
      t.textContent = tot; t.className = tot === 100 ? '' : 'bad';
      const ap = E.querySelector('[data-apply]'); ap.disabled = !P || tot !== 100 || w.every((x, i) => x === SC[i][1]);
      if (P) {
        const pf = d => Math.round(d.scores.reduce((a, v, i) => a + v / 5 * w[i], 0));
        const cur = [...DATA].sort((a, b) => b.fit - a.fit).map(d => d.id), nw = [...DATA].map(d => [d, pf(d)]).sort((a, b) => b[1] - a[1]).slice(0, 10);
        $('wprev').innerHTML = nw.map(([d, f], i) => { const was = cur.indexOf(d.id), mv = was - i; return `<div class="prow"><span class="mono">${String(i + 1).padStart(2, '0')}</span><b>${esc(d.name)}</b><span class="fn">${f}</span><span class="mv ${mv > 0 ? 'up' : mv < 0 ? 'dn' : 'eq'}">${mv > 0 ? '▲' + mv : mv < 0 ? '▼' + (-mv) : '—'}</span></div>`; }).join('');
      }
    };
    E.querySelectorAll('[data-w]').forEach(r => r.oninput = () => setW(+r.dataset.w, r.value));
    E.querySelectorAll('[data-wn]').forEach(r => r.onchange = () => setW(+r.dataset.wn, r.value));
    E.querySelectorAll('[data-lens]').forEach(b => b.onclick = () => { s.lens = b.dataset.lens; s.msg = ''; rSe(); });
    E.querySelector('[data-def]').onclick = () => { if (P) s.draft = [...DEF_W]; else [25, 25, 20, 15, 15].forEach((v, i) => s.svc[i][1] = v); s.msg = ''; rSe(); };
    E.querySelector('[data-apply]').onclick = () => { SC.forEach((x, i) => x[1] = s.draft[i]); DATA.forEach(d => { d.prevFit = d.fit; d.fit = calcFit(d.scores); }); s.msg = 'Applied · fit recalculated for ' + DATA.length + ' companies'; refresh(); renderCard(); };
    upd();
  }
  if (s.tab === 'lists') {
    const lists = { POST, ANT, MET: s.met };
    E.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { const a = lists[b.dataset.rm], i = a.indexOf(b.dataset.v); if (i >= 0) a.splice(i, 1); st.inds.delete(b.dataset.v); refresh(); });
    E.querySelectorAll('[data-add]').forEach(b => { const inp = E.querySelector(`[data-addv="${b.dataset.add}"]`); const go = () => { const v = inp.value.trim(); if (!v) return; const a = lists[b.dataset.add]; if (![...POST, ...ANT, ...s.met].includes(v)) a.push(v); refresh(); }; b.onclick = go; inp.onkeydown = e => { if (e.key === 'Enter') go(); }; });
  }
  if (s.tab === 'data') E.querySelector('[data-all]').onclick = () => downloadCSV([...DATA].sort((a, b) => b.fit - a.fit), 'birdnest-all-companies.csv');
}

window.renderView = () => { const v = V.view; if (v === 'companies') rCo(); else if (v === 'partnering') rPb(); else if (v === 'discussions') rDs(); else if (v === 'settings') rSe(); };
function setView(v) {
  V.view = v; $('app').dataset.view = v;
  document.querySelectorAll('.top .nav span').forEach(s => s.classList.toggle('on', (s.dataset.v || s.textContent.trim().toLowerCase()) === v));
  document.querySelectorAll('.vw').forEach(x => x.hidden = x.id !== 'v-' + v);
  window.scrollTo(0, 0); renderView();
}
document.querySelectorAll('.top .nav span').forEach(s => { s.tabIndex = 0; s.setAttribute('role', 'button'); s.addEventListener('click', () => setView((s.dataset.v || s.textContent.trim().toLowerCase()))); s.addEventListener('keydown', e => { if (e.key === 'Enter') setView((s.dataset.v || s.textContent.trim().toLowerCase())); }); });
})();
