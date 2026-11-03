(() => {
const TER = ['US', 'EU', 'UK', 'JP', 'CN', 'RoW'];
const STG = ['Preclin.', 'Ph 1', 'Ph 2', 'Ph 3', 'Ph 4 · approved'];
const stageOf = d => d.type === 'Device' ? ({ Pilot: 1, Pivotal: 3, 'Post-market': 4 })[d.phase] ?? 1 : ({ Preclinical: 0, 'Phase 1': 1, 'Phase 2': 2, 'Phase 3': 3, 'Phase 4': 4 })[d.phase] ?? 0;
const MODS = ['AAV / gene therapy', 'Implant / sustained release', 'Biologic', 'Small molecule', 'Peptide', 'Oligonucleotide', 'Device'];
const MODK = { 'AAV / gene therapy': ['aav', 'gene'], 'Implant / sustained release': ['implant', 'sustained', 'insert', 'reservoir'], Biologic: ['biologic', 'biosimilar', 'complement'], 'Small molecule': ['small molecule', 'small-molecule', 'oral', 'atropine', 'drop', 'tki'], Peptide: ['peptide'], Oligonucleotide: ['oligo'], Device: ['stent', 'lens', 'iol', 'system', 'device', 'screening', 'photobiomodulation', 'cross-linking', 'migs'] };
const modOf = d => { const a = (d.asset + ' ' + (d.type === 'Device' ? 'device' : '')).toLowerCase(); return MODS.filter(m => MODK[m].some(k => a.includes(k))); };
const DEALS_W = ['In-license', 'Co-development', 'Option-to-acquire', 'M&A', 'Regional rights'];
const BUY = {
  k0: { inds: ['IRDs', 'GA', 'nAMD'], mods: ['AAV / gene therapy', 'Implant / sustained release'], st: [1, 3], geo: ['US', 'EU'], deals: ['In-license', 'Co-development'], excl: ['Biosimilars', 'Topical drops'], money: [['Upfront', '$50–150M'], ['Milestones', 'to $1B']], contact: 'Dr Katrin Vogt · Head of Ophthalmology BD' },
  k1: { inds: ['Dry eye', 'Glaucoma/OHT', 'Presbyopia'], mods: ['Small molecule', 'Peptide'], st: [2, 3], geo: ['JP', 'CN'], deals: ['Regional rights', 'In-license'], excl: ['Gene therapy'], money: [['Upfront', '$10–40M'], ['Royalty', 'Mid-teens']], contact: 'Haruto Sato · VP Business Development' },
  k2: { inds: ['nAMD', 'DME', 'GA'], mods: ['Biologic', 'Implant / sustained release', 'AAV / gene therapy'], st: [2, 3], geo: ['US', 'EU', 'JP'], deals: ['Option-to-acquire', 'M&A'], excl: ['Anterior segment'], money: [['Upfront', '$75–250M'], ['Total value', 'to $1.5B']], contact: 'Marcus Hale · SVP Search & Evaluation' },
  k3: { inds: ['Glaucoma/OHT', 'Presbyopia', 'Myopia', 'Keratoconus'], mods: ['Device'], st: [1, 4], geo: ['US', 'EU'], deals: ['M&A', 'Co-development'], excl: ['Drug-only assets'], money: [['Deal size', '$50–300M']], contact: 'Claire Dubois · Head of Corporate Development' },
  k4: { inds: ['DME', 'nAMD', 'Dry eye'], mods: ['Biologic', 'Small molecule'], st: [3, 4], geo: ['RoW', 'CN'], deals: ['Regional rights'], excl: ['Preclinical'], money: [['Upfront', '$5–20M']], contact: 'Ji-ho Park · Director, Licensing' },
  k5: { inds: ['IRDs', 'GA', 'Uveitis'], mods: ['AAV / gene therapy', 'Oligonucleotide', 'Biologic'], st: [0, 2], geo: [], deals: [], excl: ['Devices'], money: [['Check size', '$5–25M'], ['Role', 'Lead or co-lead']], contact: 'Ingrid Moe · Partner' },
  k6: { inds: ['nAMD', 'GA', 'DME', 'NPDR/DR'], mods: ['Biologic', 'Implant / sustained release', 'Small molecule'], st: [2, 3], geo: [], deals: [], excl: ['Seed stage'], money: [['Check size', '$20–60M'], ['Role', 'Lead']], contact: 'Daniel Reyes · Managing Director' },
  k7: { inds: ['Dry eye', 'Glaucoma/OHT', 'nAMD'], mods: ['Small molecule', 'Biologic', 'Device'], st: [3, 4], geo: [], deals: [], excl: ['Pre-Phase 2'], money: [['Check size', '$40–120M'], ['Role', 'Growth equity']], contact: 'Oliver Grant · Principal' },
  k8: { inds: ['Myopia', 'Dry eye', 'Presbyopia'], mods: ['Small molecule', 'Device', 'Peptide'], st: [0, 1], geo: [], deals: [], excl: ['Late stage'], money: [['Check size', '$2–10M'], ['Role', 'Seed lead']], contact: 'Mei Tan · Founding Partner' },
  k9: { inds: ['NPDR/DR', 'Glaucoma/OHT', 'nAMD'], mods: ['Device'], st: [3, 4], geo: [], deals: [], excl: ['Preclinical'], money: [['Check size', '$25–75M'], ['Role', 'Crossover']], contact: 'Alex Kim · Partner' }
};
const INTROS = [
  { b: 'k0', s: 's0', d: 37, st: 'CDA signed', n: 'Data-room walkthrough 21 Oct' },
  { b: 'k0', s: 's3', d: 16, st: 'Intro call held', n: 'Asked for complement MoA data' },
  { b: 'k2', s: 's3', d: 30, st: 'Diligence', n: 'Option structure under discussion' },
  { b: 'k1', s: 's2', d: 22, st: 'Introduced', n: 'Japan rights for KV-3' },
  { b: 'k5', s: 's0', d: 45, st: 'Intro call held', n: 'Follow-on for Series C' },
  { b: 'k6', s: 's1', d: 12, st: 'Introduced', n: 'Sent teaser deck' },
  { b: 'k2', s: 's1', d: 60, st: 'Declined', n: 'Wants US rights; Halden is ex-US only' }
];
const STC = { 'Introduced': 'p-new', 'Intro call held': 'p-int', 'CDA signed': 'p-cda', 'Diligence': 'p-cda', 'Term sheet': 'p-cda', 'Declined': 'p-dec' };
const CDA_PLUS = ['CDA signed', 'Diligence', 'Term sheet'];
const isBuyer = d => d.kind === 'pharma' || d.kind === 'investor';

function match(bio, buyer) {
  const B = BUY[buyer.id]; if (!B) return { chk: {}, score: 0 };
  const sx = stageOf(bio), mods = modOf(bio), inv = buyer.kind === 'investor';
  const chk = {
    ind: B.inds.includes(bio.ind) ? 1 : (B.inds.some(i => POST.includes(i)) && POST.includes(bio.ind)) || (B.inds.some(i => ANT.includes(i)) && ANT.includes(bio.ind)) ? .5 : 0,
    mod: mods.some(m => B.mods.includes(m)) ? 1 : 0,
    st: sx >= B.st[0] && sx <= B.st[1] ? 1 : (sx === B.st[0] - 1 || sx === B.st[1] + 1) ? .5 : 0
  };
  if (!inv) chk.geo = !B.geo.length ? 1 : B.geo.every(g => bio.rightsArr[TER.indexOf(g)]) ? 1 : B.geo.some(g => bio.rightsArr[TER.indexOf(g)]) ? .5 : 0;
  const w = inv ? { ind: 40, mod: 20, st: 40 } : { ind: 35, mod: 20, st: 25, geo: 20 };
  return { chk, w, score: Math.round(Object.keys(w).reduce((a, k) => a + chk[k] * w[k], 0)) };
}
const intrsFor = d => isBuyer(d) ? INTROS.filter(x => x.b === d.id) : INTROS.filter(x => x.s === d.id);
const other = (d, x) => DATA.find(y => y.id === (isBuyer(d) ? x.s : x.b));
function candidates(d) {
  const done = new Set(intrsFor(d).map(x => isBuyer(d) ? x.s : x.b));
  const pool = isBuyer(d) ? DATA.filter(x => (x.kind || 'seeking') === 'seeking') : DATA.filter(isBuyer);
  return pool.map(c => ({ c, m: isBuyer(d) ? match(c, d) : match(d, c), done: done.has(c.id) })).sort((a, b) => b.m.score - a.m.score);
}

const css = document.createElement('style');
css.textContent = `
.acs{width:min(1240px,100%);height:min(900px,100%);display:flex;flex-direction:column}
.acb{flex:1;min-height:0;overflow:auto;padding:22px 28px 28px;display:grid;grid-template-columns:360px minmax(0,1fr);gap:16px;align-items:start}
.acb .rc{display:flex;flex-direction:column;gap:16px;min-width:0}
.bk{border-radius:16px;padding:16px 18px;display:flex;flex-direction:column;gap:12px;min-width:0}
.bk.w{background:#F0E7D6}.bk.i{background:#DCE8E6}.bk.f{background:#fff;box-shadow:inset 0 0 0 1px var(--line)}
.bh{display:flex;align-items:center;gap:10px}
.bh .no{font-family:var(--mono);font-size:11px;font-weight:500;width:24px;height:24px;border-radius:999px;display:flex;align-items:center;justify-content:center;flex:none}
.w .bh .no{background:#B08D57;color:#fff}.i .bh .no{background:#0F4C52;color:#F6F4EF}.f .bh .no{background:#1A1D20;color:#F6F4EF}
.bh b{font-size:16px;font-weight:500}.w .bh b{color:#7A5A26}.i .bh b{color:#0F4C52}
.bh b{line-height:24px}
.bh em{font-style:normal;font-family:var(--mono);font-size:12px;line-height:1;color:var(--muted);height:22px;min-width:22px;padding:0 7px;border-radius:999px;background:rgba(26,29,32,.06);display:inline-flex;align-items:center;justify-content:center;align-self:center}
.bh .sp{flex:1}.bh .hint{font-size:11px;color:var(--faint)}
.sub{font-size:12px;color:var(--muted);margin:0 0 6px}
.chips{display:flex;flex-wrap:wrap;gap:6px}
.chip{height:28px;padding:0 10px;display:inline-flex;align-items:center;gap:6px;border-radius:999px;border:1px solid rgba(176,141,87,.35);background:rgba(255,255,255,.6);font-size:12px;color:var(--ink)}
button.chip:hover{border-color:#B08D57}
.chip.on{background:#fff;border-color:#B08D57;color:#7A5A26;box-shadow:inset 0 0 0 1px #B08D57;font-weight:500}
.chip.no{background:#F4E4E1;border-color:#F4E4E1;color:#A3352B}
.chip.ro{cursor:default}
.phase{display:grid;grid-template-columns:repeat(5,1fr);gap:2px;margin:2px 0}
.phase i{height:8px;border-radius:2px;background:rgba(255,255,255,.7)}.phase i.in{background:#B08D57}
.phase.edit i{cursor:pointer}
.pnames{display:grid;grid-template-columns:repeat(5,1fr);font-size:10px;color:var(--muted);text-align:center}
.pnames span.in{color:#7A5A26;font-weight:500}
.akv{display:grid;grid-template-columns:110px minmax(0,1fr);gap:10px;padding:8px 0;border-bottom:1px solid rgba(176,141,87,.3);font-size:13px}
.akv:last-child{border-bottom:0}
.akv span:first-child{color:var(--muted)}
.terr{display:grid;grid-template-columns:repeat(6,1fr);gap:3px}
.terr span{height:34px;border-radius:6px;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:var(--mono);font-size:10px;font-weight:500}
.terr small{font-family:Geist,sans-serif;font-size:8.5px;font-weight:400}
.terr .o{background:#fff;color:#0F4C52;box-shadow:inset 0 0 0 1px #0F4C52}.terr .t{background:rgba(255,255,255,.45);color:var(--muted)}
.irow{display:grid;grid-template-columns:14px minmax(0,1fr) 92px 112px;gap:12px;align-items:center;padding:10px 0;border-bottom:1px solid rgba(15,76,82,.15)}
.irow:last-child{border-bottom:0}
.irow .dot{width:9px;height:9px;border-radius:999px;background:#0F4C52;box-shadow:0 0 0 3px #fff}
.irow button.nm{border:0;background:none;padding:0;text-align:left;font-weight:500;font-size:14px}
.irow button.nm:hover{color:#0F4C52;text-decoration:underline}
.irow small{display:block;font-size:12px;color:var(--muted)}
.irow .mono{font-size:12px;color:var(--muted)}
.apill{height:22px;padding:0 9px;display:inline-flex;align-items:center;justify-self:start;border-radius:999px;font-size:11px;font-weight:500;white-space:nowrap}
.p-cda{background:#0F4C52;color:#F6F4EF}.p-int{background:#F0E7D6;color:#7A5A26}.p-dec{background:#EEEBE4;color:#5E6368}.p-new{background:#fff;color:#5E6368;box-shadow:inset 0 0 0 1px #CFC9BC}
.fr{display:grid;grid-template-columns:minmax(0,1.2fr) 104px minmax(0,1.7fr) auto;overflow:visible;gap:14px;align-items:center;padding:10px 8px;margin:0 -8px;border-bottom:1px solid var(--line);border-radius:8px;cursor:pointer}
.fr:last-child{border-bottom:0}
.fr:hover{background:#FBFAF7}
.fr>*{min-width:0}.fr b{font-weight:500;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.fr small{display:block;font-size:12px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ms{display:flex;align-items:center;gap:8px}
.ms .bar{width:56px;height:4px;border-radius:2px;background:var(--sunken)}.ms .bar i{display:block;height:100%;border-radius:2px;background:#B08D57}
.ms b{font-family:var(--mono);font-weight:500;color:#7A5A26;font-size:13px;width:26px;text-align:right}
.vfl{margin-top:4px;height:40px;width:100%;border:1px solid #B08D57;border-radius:10px;background:#F0E7D6;color:#7A5A26;display:flex;align-items:center;justify-content:center;gap:10px;font-size:13px;font-weight:600;cursor:pointer}
.vfl em{font-style:normal;font-family:var(--mono);font-size:11px;font-weight:500;color:#7A5A26;opacity:.8}
.vfl:hover{background:#E9DCC4}.vfl:focus-visible{outline:2px solid #0F4C52;outline-offset:2px}
.why{display:flex;flex-wrap:wrap;gap:6px;align-items:center;min-width:0}
.why i{font-style:normal;font-size:11px;font-weight:500;line-height:1;height:24px;padding:0 10px;display:inline-flex;align-items:center;justify-content:center;white-space:nowrap;box-sizing:border-box;max-width:100%;min-width:0;gap:4px;position:relative;cursor:help;border-radius:6px;background:#F0E7D6;border:1px solid #B08D57;color:#7A5A26}
.why i u{text-decoration:none;overflow:hidden;text-overflow:ellipsis;min-width:0}.why i s{text-decoration:none;font-size:12px;flex:none}
.why i:hover::after{content:attr(data-tip);position:absolute;left:0;bottom:calc(100% + 6px);z-index:20;width:max-content;max-width:240px;white-space:normal;line-height:1.35;padding:7px 10px;border-radius:8px;background:#1A1D20;color:#F6F4EF;font-size:11px;font-weight:400;box-shadow:0 1px 2px rgba(26,29,32,.04),0 12px 32px rgba(26,29,32,.08);pointer-events:none}
.why i.nofit{color:#5E6368;border:1px dashed #CFC9BC;background:#EEEBE4}
.ibtn{height:32px;padding:0 12px;border:0;border-radius:8px;background:#0F4C52;color:#F6F4EF;font-size:12px;font-weight:500;white-space:nowrap}
.ibtn:hover{background:#0B3A3F}
.ibtn.done{background:#DCE8E6;color:#0F4C52;cursor:default}
.mxbtn{height:32px;padding:0 12px;border:1px solid var(--strong);border-radius:8px;background:#fff;font-size:12px;display:flex;align-items:center;gap:6px;white-space:nowrap}
.mxbtn:hover{border-color:#0F4C52;color:#0F4C52}
.acst{display:flex;gap:22px}
.acst div{display:flex;flex-direction:column;align-items:flex-end;gap:2px}
.acst span{font-family:var(--mono);font-size:9px;letter-spacing:.14em;color:#B9CFCD}
.acst b{font-family:var(--mono);font-size:20px;font-weight:500;color:#F6F4EF}
.acst b.fit{color:#D9B97F}
.pbrand .acact{display:flex;gap:8px}
.pbrand .lbtn{height:36px;padding:0 12px;border:1px solid rgba(246,244,239,.3);border-radius:9px;background:transparent;color:#F6F4EF;font-size:12px;font-weight:500;white-space:nowrap}
.pbrand .lbtn:hover{border-color:#C9A56E;color:#fff}
.pbrand .gbtn{background:#C9A56E;border-color:#C9A56E;color:#0B1A1B}.pbrand .gbtn:hover{background:#D9B97F;color:#0B1A1B}
.mxm{position:fixed;inset:0;z-index:40;background:rgba(26,29,32,.32);display:none;align-items:center;justify-content:center;padding:40px}
.mxm.on{display:flex}
.mxs{width:min(1180px,100%);max-height:100%;background:#fff;border-radius:24px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 1px 2px rgba(26,29,32,.04),0 12px 32px rgba(26,29,32,.08)}
.mxb{overflow:auto;padding:20px 28px 24px}
.crit{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin-bottom:16px}
.crit div{border:1px solid var(--line);border-radius:12px;padding:10px 12px;display:flex;flex-direction:column;gap:4px}
.crit span{font-family:var(--mono);font-size:9.5px;letter-spacing:.14em;color:var(--muted)}
.crit b{font-size:13px;font-weight:500;line-height:18px}
.mx{border:1px solid var(--line);border-radius:16px;overflow-x:auto}
.mxh,.mxr{display:grid;gap:12px;align-items:center;padding:0 18px;width:max-content;min-width:100%}
.mxh{height:40px;border-bottom:1px solid var(--strong);font-family:var(--mono);font-size:10px;font-weight:500;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.mxh .c{text-align:center}
.mxr{min-height:54px;border-bottom:1px solid var(--line)}
.mxr:last-child{border-bottom:0}
.mxr:hover{background:#FBFAF7}
.mxr.hl{background:#F0E7D6;box-shadow:inset 0 0 0 1.5px #0F4C52}
.mxr b{font-weight:500}.mxr small{display:block;font-size:12px;color:var(--muted)}
.ck{justify-self:center;width:22px;height:22px;border-radius:999px;display:flex;align-items:center;justify-content:center;font-size:11px}
.ck.y{background:#0F4C52;color:#F6F4EF}.ck.p{background:#F0E7D6;color:#7A5A26;box-shadow:inset 0 0 0 1.5px #B08D57}.ck.n{background:#fff;color:var(--faint);box-shadow:inset 0 0 0 1.5px var(--strong)}
.mxl{display:flex;gap:16px;font-size:12px;color:var(--muted);margin-top:10px;flex-wrap:wrap}
.mxl span{display:flex;align-items:center;gap:6px}.mxl .ck{width:16px;height:16px;font-size:9px}
@media (max-width:1100px){.acb{grid-template-columns:1fr}}
#acsheet .pbrand{position:relative;flex-wrap:wrap;row-gap:12px;padding-right:72px}
#acsheet .pbrand>.x{position:absolute;top:16px;right:20px}
#acsheet .pbt{min-width:0;flex:1 1 260px}
#acsheet .pbs{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#acsheet .pbrand>.sp{display:none}
@media (max-width:1180px){#acsheet .acst{gap:14px}#acsheet .pbrand>.vr{display:none}}
`;
document.head.appendChild(css);
const m = document.createElement('div'); m.className = 'modal'; m.id = 'acmodal'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true');
m.innerHTML = '<div class="sheet acs" id="acsheet"></div>'; document.body.appendChild(m);
const mx = document.createElement('div'); mx.className = 'mxm'; mx.id = 'mxm'; mx.innerHTML = '<div class="mxs" id="mxs"></div>'; document.body.appendChild(mx);
m.addEventListener('click', e => { if (e.target === m) closeAcc(); });
mx.addEventListener('click', e => { if (e.target === mx) mx.classList.remove('on'); });
document.addEventListener('keydown', e => { if (e.key !== 'Escape') return; if (mx.classList.contains('on')) mx.classList.remove('on'); else if (m.style.display === 'flex') closeAcc(); });
let cur = null, mxHL = null;
function closeAcc() { m.style.display = 'none'; cur = null; }
window.openAccount = id => { cur = id; m.style.display = 'flex'; renderAcc(); $('acsheet').scrollTop = 0; };

const ini = d => d.logo ? `<img src="${d.logo}" alt="" style="width:100%;height:100%;object-fit:contain;padding:6px">` : `<span class="mono">${esc(d.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase())}</span>`;
const LOCK = '<svg viewBox="0 0 64 64" width="34" height="34" fill="none" aria-label="BirdNest"><path d="M0 32 H10 M54 32 H64" stroke="#C9A56E" stroke-width="1.4"/><path d="M10 32 Q32 7 54 32 Q32 57 10 32 Z" stroke="#F6F4EF" stroke-width="2.8" stroke-linejoin="round"/><path d="M38.56 28.17 A7.6 7.6 0 1 1 35.83 25.44" stroke="#F6F4EF" stroke-width="3.9"/><circle cx="30.8" cy="32.3" r="3" fill="#C9A56E"/></svg>';
const MXI = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>';
const ms = s => `<span class="ms"><span class="bar"><i style="width:${s}%"></i></span><b>${s}</b></span>`;
const bh = (no, t, n, extra = '') => `<div class="bh"><span class="no">${no}</span><b>${t}</b>${n != null ? `<em>${n}</em>` : ''}<span class="sp"></span>${extra}</div>`;
const LBL = { ind: 'Indication', mod: 'Modality', st: 'Stage', geo: 'Rights' };
function whyTags(bio, buyer, mm) {
  const t = [[bio.ind, mm.chk.ind, 'ind'], [modOf(bio)[0] || bio.type, mm.chk.mod, 'mod'], [STG[stageOf(bio)], mm.chk.st, 'st']];
  if (mm.chk.geo != null && mm.chk.geo < 1) t.push([BUY[buyer.id].geo.filter(g => !bio.rightsArr[TER.indexOf(g)]).join('/') + ' rights taken', 0, 'geo']);
  const who = buyer.kind === 'investor' ? 'Investor' : 'Buyer';
  const tip = (k, v) => k === 'geo' ? 'Territory rights already licensed · the buyer wants these regions' : v ? `${who} is interested · ${LBL[k].toLowerCase()} matches their criteria` : `${who} is not interested · ${LBL[k].toLowerCase()} is outside their criteria`;
  return `<span class="why">${t.map(([l, v, k]) => `<i class="${v ? '' : 'nofit'}" data-tip="${tip(k, v)}">${v ? '' : '<s>×</s>'}<u>${esc(l)}</u></i>`).join('')}</span>`;
}
function introduce(a, b) {
  const buyer = isBuyer(a) ? a : b, bio = isBuyer(a) ? b : a;
  if (INTROS.some(x => x.b === buyer.id && x.s === bio.id)) return;
  INTROS.unshift({ b: buyer.id, s: bio.id, d: 0, st: 'Introduced', n: 'Introduced today' });
  bio.notes.unshift([0, 'Email', 'Introduced to ' + buyer.name + '.', false]); buyer.notes.unshift([0, 'Email', 'Introduced ' + bio.name + '.', false]);
  bio.last = 0; buyer.last = 0; bio.topic = 'Introduced to ' + buyer.name; buyer.topic = 'Introduced ' + bio.name;
  refresh(); renderCard(); renderAcc(); if (mx.classList.contains('on')) openMx(mxHL);
}

function panel01(d) {
  const B = BUY[d.id];
  if (isBuyer(d)) {
    const inv = d.kind === 'investor', grp = (lab, key, all) => `<div><div class="sub">${lab}</div><div class="chips">${all.map(x => `<button class="chip ${B[key].includes(x) ? 'on' : ''}" data-bb="${key}" data-x="${esc(x)}">${esc(x)}</button>`).join('')}</div></div>`;
    return `<div class="bk w">${bh('01', inv ? 'Investment thesis' : 'What they want', null, '<span class="hint">Click to edit</span>')}
      ${grp('Indications', 'inds', [...new Set([...B.inds, ...POST, ...ANT])])}${grp('Modalities', 'mods', MODS)}
      <div><div class="sub">${inv ? 'Stage window' : 'Phase window'}</div><div class="phase edit">${STG.map((p, i) => `<i data-ph="${i}" class="${i >= B.st[0] && i <= B.st[1] ? 'in' : ''}" title="${p}"></i>`).join('')}</div><div class="pnames">${STG.map((p, i) => `<span class="${i >= B.st[0] && i <= B.st[1] ? 'in' : ''}">${p.replace(' · approved', '')}</span>`).join('')}</div></div>
      ${inv ? '' : grp('Rights wanted', 'geo', TER) + grp('Deal structures', 'deals', DEALS_W)}
      <div><div class="sub">Excludes</div><div class="chips">${B.excl.map(x => `<span class="chip no ro">${esc(x)}</span>`).join('')}</div></div>
      <div>${[...B.money, ['Contact', B.contact], ['Where met', d.id === 'k0' ? 'EURETINA 2026, Vienna' : 'Not recorded']].map(r => `<div class="akv"><span>${r[0]}</span><span class="${/\$/.test(r[1]) ? 'mono' : ''}">${esc(r[1])}</span></div>`).join('')}</div></div>`;
  }
  const L = d.id === 's0' ? LUMEN : d.ai;
  return `<div class="bk w">${bh('01', 'What they offer')}
    <div>${[['Lead asset', d.asset], ['Indication', d.ind + ' · ' + d.seg], ['Stage', d.phaseLabel], ['Modality', modOf(d).join(', ') || d.type], ['Next catalyst', d.cat || 'None set']].map(r => `<div class="akv"><span>${r[0]}</span><span>${esc(r[1])}</span></div>`).join('')}</div>
    <div><div class="sub">Rights by territory</div><div class="terr">${TER.map((t, i) => `<span class="${d.rightsArr[i] ? 'o' : 't'}">${t}<small>${d.rightsArr[i] ? 'open' : 'taken'}</small></span>`).join('')}</div></div>
    <div>${[['Seeking', L && L.seeking || 'Not stated'], ['Last raise', d.raise || 'Not stated'], ['Runway', d.runway ? d.runway + ' mo · as of 30 Jun 2026' : 'Not stated'], ...(L && L.econ && L.econ.length ? L.econ.map(e => [e[0], e[1] + ' · as stated']) : [])].map(r => `<div class="akv"><span>${r[0]}</span><span class="${/\$|mo/.test(r[1]) ? 'mono' : ''}">${esc(r[1])}</span></div>`).join('')}</div></div>`;
}
function renderAcc() {
  const d = DATA.find(x => x.id === cur); if (!d) return;
  const buyer = isBuyer(d), I = intrsFor(d), C = candidates(d), fits = C.filter(x => !x.done);
  const cda = I.filter(x => CDA_PLUS.includes(x.st)).length, strong = fits.filter(x => x.m.score >= 70).length;
  const kl = KIND[d.kind || 'seeking'].label;
  const head = `<div class="pbrand"><span class="plogo" style="cursor:default">${ini(d)}</span>
    <div class="pbt"><span class="ovl">${buyer ? (d.kind === 'pharma' ? 'Big Pharma · buying assets' : 'Investor · deploying capital') : 'Company · seeking capital and partners'}</span><b style="font-size:24px;font-weight:300;letter-spacing:-.03em;line-height:28px">${esc(d.name)}</b><span class="pbs">${esc(d.city)}, ${esc(d.cdisp)} · ${esc(d.own)}${d.scale ? ' · ' + esc(d.scale) : ''}</span></div><span class="sp"></span>
    <div class="acst"><div><span>${buyer ? 'INTRODUCED' : 'INTRODUCED TO'}</span><b>${I.length}</b></div><div><span>CDA OR LATER</span><b>${cda}</b></div><div><span>STRONG ${buyer ? 'FITS' : 'MATCHES'}</span><b>${strong}</b></div><div><span>FIT</span><b class="fit">${d.fit}</b></div></div>
    <span class="vr"></span><div class="acact"><button class="lbtn" data-edit>Edit profile</button><button class="lbtn gbtn" data-exp>One-pager</button></div>
    <button class="x" data-close aria-label="Close"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>`;
  const irows = I.map(x => { const o = other(d, x); if (!o) return ''; return `<div class="irow"><span class="dot"></span><div><button class="nm" data-go="${o.id}">${esc(o.name)}</button><small>${esc(x.n)}</small></div><span class="mono">${fmt(x.d)}</span><span class="apill ${STC[x.st] || 'p-new'}">${x.st}</span></div>`; }).join('') || `<p class="sub" style="margin:0">No introductions yet. Use Introduce on a ${buyer ? 'fit' : 'match'} below.</p>`;
  const frows = fits.slice(0, 4).map(({ c, m: mm }) => `<div class="fr" data-mx="${c.id}" tabindex="0" title="Open in fit matrix"><div><b>${esc(c.name)}</b><small>${esc(c.city)}, ${esc(c.cdisp)} · ${buyer ? esc(c.phaseLabel) : KIND[c.kind].short}</small></div>${ms(mm.score)}${buyer ? whyTags(c, d, mm) : whyTags(d, c, mm)}<button class="ibtn" data-intro="${c.id}">Introduce</button></div>`).join('') || '<p class="sub">No candidates.</p>';
  $('acsheet').innerHTML = head + `<div class="acb">${panel01(d)}<div class="rc">
    <div class="bk i">${bh('02', buyer ? 'Introduced by you' : 'Introduced to', I.length)}<div>${irows}</div></div>
    <div class="bk f">${bh('03', buyer ? (d.kind === 'pharma' ? 'Fits their buy box' : 'Fits their thesis') : 'Potential partners and investors', fits.length, `<button class="mxbtn" data-mxall>${MXI}Open fit matrix</button>`)}<div>${frows}</div>${fits.length > 4 ? `<button class="vfl" data-vfl><span>View full list</span><em>${fits.length - 4} more · ${fits.length} total</em><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 6l6 6-6 6"/></svg></button>` : ''}</div></div></div>`;
  const S = $('acsheet');
  S.querySelector('[data-close]').onclick = closeAcc;
  S.querySelector('[data-edit]').onclick = () => { closeAcc(); openProfile(d.id); };
  S.querySelector('[data-exp]').onclick = () => { closeAcc(); openExport(d.id); };
  S.querySelectorAll('[data-go]').forEach(b => b.onclick = () => openAccount(b.dataset.go));
  S.querySelectorAll('[data-intro]').forEach(b => b.onclick = e => { e.stopPropagation(); introduce(d, DATA.find(x => x.id === b.dataset.intro)); });
  S.querySelectorAll('[data-mx]').forEach(r => { r.onclick = e => { if (!e.target.closest('[data-intro]')) openMx(r.dataset.mx); }; r.onkeydown = e => { if (e.key === 'Enter') openMx(r.dataset.mx); }; });
  S.querySelector('[data-mxall]').onclick = () => openMx(null);
  const vf = S.querySelector('[data-vfl]'); if (vf) vf.onclick = () => openMx(null);
  S.querySelectorAll('[data-bb]').forEach(b => b.onclick = () => { const a = BUY[d.id][b.dataset.bb], x = b.dataset.x, i = a.indexOf(x); i >= 0 ? a.splice(i, 1) : a.push(x); renderAcc(); });
  let anc = null; S.querySelectorAll('[data-ph]').forEach(b => b.onclick = () => { const i = +b.dataset.ph, B = BUY[d.id]; if (anc === null) { anc = i; B.st = [i, i]; } else { B.st = [Math.min(anc, i), Math.max(anc, i)]; anc = null; } renderAcc(); });
}
function openMx(hl) {
  mxHL = hl; const d = DATA.find(x => x.id === cur), buyer = isBuyer(d), C = candidates(d);
  const keys = buyer ? Object.keys(match(C[0].c, d).w) : ['ind', 'mod', 'st', 'geo'];
  const mk = v => v == null ? '<span class="ck n" title="Not applicable">·</span>' : `<span class="ck ${v === 1 ? 'y' : v ? 'p' : 'n'}">${v === 1 ? '✓' : v ? '~' : '–'}</span>`;
  const cols = `minmax(220px,1.5fr) ${keys.map(() => '92px').join(' ')} 110px 130px 120px`;
  const B = buyer && BUY[d.id];
  const crit = buyer ? [['INDICATIONS', B.inds.join(', ')], ['MODALITIES', B.mods.join(', ')], [d.kind === 'investor' ? 'STAGE' : 'PHASE', STG[B.st[0]] + ' to ' + STG[B.st[1]]], ...(d.kind === 'pharma' ? [['RIGHTS', B.geo.join(' + ') || 'Any']] : [])]
    : [['INDICATION', d.ind], ['MODALITY', modOf(d).join(', ') || d.type], ['STAGE', STG[stageOf(d)]], ['RIGHTS OPEN', TER.filter((t, i) => d.rightsArr[i]).join(', ') || 'None']];
  $('mxs').innerHTML = `<div class="pbrand"><span class="plogo" style="cursor:default">${ini(d)}</span><div class="pbt"><span class="ovl">Fit matrix · ${hl ? 'focused on ' + esc(DATA.find(x => x.id === hl).name) : 'all candidates'}</span><b style="font-size:22px;font-weight:300;letter-spacing:-.03em">${esc(d.name)}</b><span class="pbs">${buyer ? 'Every company seeking capital, scored against this buy box' : 'Every pharma and investor, scored on how well this company fits their criteria'}</span></div><span class="sp"></span><button class="x" data-mxc aria-label="Close"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
    <div class="mxb"><div class="crit">${crit.map(r => `<div><span>${r[0]}</span><b>${esc(r[1])}</b></div>`).join('')}</div>
    <div class="mx"><div class="mxh" style="grid-template-columns:${cols}"><span>${buyer ? 'Company' : 'Partner or investor'}</span>${keys.map(k => `<span class="c">${LBL[k]}</span>`).join('')}<span>Match</span><span>Introduced</span><span></span></div>
    ${C.map(({ c, m: mm, done }) => { const x = INTROS.find(y => y.b === (buyer ? d.id : c.id) && y.s === (buyer ? c.id : d.id));
      return `<div class="mxr ${hl === c.id ? 'hl' : ''}" style="grid-template-columns:${cols}"><div><b>${esc(c.name)}</b><small>${buyer ? esc(c.ind) + ' · ' + esc(c.phaseLabel) : KIND[c.kind].short + ' · ' + esc(c.city)}</small></div>${keys.map(k => mk(mm.chk[k])).join('')}${ms(mm.score)}<span>${x ? `<span class="apill ${STC[x.st] || 'p-new'}">${x.st}</span>` : '<span style="font-size:12px;color:var(--faint)">Not yet</span>'}</span><span style="justify-self:end">${done ? '' : `<button class="ibtn" data-intro="${c.id}">Introduce</button>`}</span></div>`; }).join('')}</div>
    <div class="mxl"><span>${mk(1)}Meets</span><span>${mk(.5)}Partial</span><span>${mk(0)}Misses</span><span style="margin-left:auto">Weights · ${buyer && d.kind === 'investor' ? 'indication 40 · modality 20 · stage 40' : 'indication 35 · modality 20 · stage 25 · rights 20'}</span></div></div>`;
  mx.classList.add('on');
  const S = $('mxs'); S.querySelector('[data-mxc]').onclick = () => mx.classList.remove('on');
  S.querySelectorAll('[data-intro]').forEach(b => b.onclick = () => introduce(d, DATA.find(x => x.id === b.dataset.intro)));
  const h = S.querySelector('.mxr.hl'); if (h) S.querySelector('.mxb').scrollTop = Math.max(0, h.offsetTop - 200);
}
// route profile opens to the account view
document.addEventListener('click', e => { if (e.target.closest('#card .primary')) { e.stopImmediatePropagation(); openAccount(st.sel); } }, true);
})();
