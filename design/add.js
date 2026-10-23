(() => {
const A = { step: 1, name: '', web: '', hq: '', res: null, qa: [], notes: '', notesPriv: false, err: '', busy: false, logoOn: true };
const OWN = ['VC-backed (Series A)', 'VC-backed (Series B)', 'VC-backed (Series C)', 'PE-backed', 'Private', 'Public', 'Subsidiary'];
const F = [['kind', 'Category · seeking, pharma or investor'], ['city', 'HQ city'], ['country', 'Country'], ['region', 'Region'], ['own', 'Ownership'], ['founded', 'Founded'], ['heads', 'Headcount'], ['type', 'Type'], ['seg', 'Segment'], ['ind', 'Lead indication'], ['asset', 'Lead asset'], ['phase', 'Phase'], ['cat', 'Next catalyst'], ['raise', 'Last raise'], ['seeking', 'Seeking']];
const host = w => { try { return new URL(/^https?:/.test(w) ? w : 'https://' + w).hostname.replace(/^www\./, ''); } catch (e) { return ''; } };
const logoUrl = () => host(A.web) ? `https://www.google.com/s2/favicons?domain=${host(A.web)}&sz=128` : '';
const parse = t => { const a = t.indexOf('{'), b = t.lastIndexOf('}'); if (a < 0 || b < 0) throw new Error('No JSON in reply'); return JSON.parse(t.slice(a, b + 1)); };

const m = document.createElement('div'); m.className = 'modal'; m.id = 'amodal'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.setAttribute('aria-label', 'Add company');
m.innerHTML = '<div class="sheet asheet" id="asheet"></div>'; document.body.appendChild(m);
m.addEventListener('click', e => { if (e.target === m && !A.busy) close(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && m.style.display === 'flex' && !A.busy) close(); });
let spin = null;
function close() { m.style.display = 'none'; clearInterval(spin); }
window.openAdd = () => { Object.assign(A, { step: 1, name: '', web: '', hq: '', res: null, qa: [], notes: '', notesPriv: false, err: '', busy: false, logoOn: true }); m.style.display = 'flex'; render(); setTimeout(() => { const n = $('asheet').querySelector('[data-a="name"]'); if (n) n.focus(); }, 0); };

const RING = '<svg class="lring" viewBox="21 21 22 22" width="40" height="40" fill="none"><path d="M38.56 28.17 A7.6 7.6 0 1 1 35.83 25.44" stroke="#0F4C52" stroke-width="4.4"/><circle cx="30.8" cy="32.3" r="3.2" fill="#B08D57"/></svg>';
const steps = ['Quick add', 'Claude research', 'Your input'];
function shell(body, foot) {
  return `<div class="pbrand"><span class="plogo" style="cursor:default">${A.step > 1 && A.logoOn && logoUrl() ? `<img src="${logoUrl()}" alt="" onerror="this.remove()">` : `<span class="mono">${esc((A.name || '+').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase())}</span>`}</span>
    <div class="pbt"><span class="ovl">New company</span><span class="pbs">${esc(A.name || 'Public information and your own notes only')}</span></div><span class="sp"></span>
    <div class="asteps">${steps.map((s, i) => `<span class="${A.step === i + 1 ? 'on' : A.step > i + 1 ? 'done' : ''}"><i>${i + 1}</i>${s}</span>`).join('')}</div>
    <span class="vr"></span><button class="x" data-close aria-label="Close"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
    <div class="abody">${body}</div><div class="afoot">${foot}</div>`;
}
function render() {
  const S = $('asheet'); clearInterval(spin);
  let body = '', foot = '';
  if (A.busy) {
    body = `<div class="aload">${RING}<b>${A.step === 1 ? 'Researching ' + esc(A.name) : 'Scoring and drafting the profile'}</b><span>${A.step === 1 ? 'Pulling what is publicly known: HQ, ownership, lead asset, phase, catalysts, financing.' : 'Turning your answers into scorecard justifications, deal stage and notes.'}</span></div>`;
    S.innerHTML = shell(body, '<span class="mu" style="font-size:12px">This takes a few seconds</span>');
    let k = 0; const r = S.querySelector('.lring'); spin = setInterval(() => { k = (k + 1) % 8; r.style.transform = `rotate(${k * 45}deg)`; }, 120);
    return;
  }
  if (A.step === 1) {
    body = `<div class="aq"><h2>Who are we adding?</h2><p>Start with a name and a website. Claude fills in what is publicly known, then asks you a few questions to complete the assessment.</p>
      <label class="pf"><span>Company name</span><input data-a="name" value="${esc(A.name)}" placeholder="e.g. Lumen Ocular"></label>
      <label class="pf"><span>Website</span><input data-a="web" value="${esc(A.web)}" placeholder="example.com"></label>
      <label class="pf"><span>HQ city · optional</span><input data-a="hq" value="${esc(A.hq)}" placeholder="Helps when names are common"></label>
      <div class="drule" style="font-size:13px"><span><b>Public information and your own notes only.</b> Nothing under a CDA.</span></div>
      ${A.err ? `<p class="aerr">${esc(A.err)}</p>` : ''}</div>`;
    foot = `<button class="sec" data-manual>Skip and fill in manually</button><span class="sp"></span><button class="primary" data-go1>Research with Claude</button>`;
  }
  if (A.step === 2) {
    const r = A.res, c = r.confidence || {};
    body = `<div class="arev"><div class="ahead"><div><h2>${r.found === false ? 'Little public information found' : 'Here is what Claude found'}</h2><p>From Claude's general knowledge of public sources, not a live web search. Check anything marked low and edit freely.</p></div>
      ${logoUrl() ? `<label class="alogo"><img src="${logoUrl()}" alt="" onerror="this.parentElement.classList.add('nologo')"><span><b>Logo</b><small>From ${esc(host(A.web))}</small></span><input type="checkbox" data-logo ${A.logoOn ? 'checked' : ''}><span class="sw"></span></label>` : ''}</div>
      <div class="agrid">${F.map(([k, l]) => { const cf = c[k] || (r[k] ? 'medium' : 'low'); return `<label class="pf"><span>${l}<em class="cf ${cf}">${cf}</em></span><input data-r="${k}" value="${esc(r[k] ?? '')}" placeholder="Unknown"></label>`; }).join('')}</div>
      <div class="atext"><label class="pf"><span>Overview<em class="cf ${c.overview || 'medium'}">${c.overview || 'medium'}</em></span><textarea data-r="overview" rows="3">${esc(r.overview || '')}</textarea></label>
      ${[0, 1, 2].map(i => `<label class="pf"><span>Differentiator ${i + 1}</span><input data-d="${i}" value="${esc((r.diffs || [])[i] || '')}"></label>`).join('')}
      <label class="pf"><span>Key risk</span><input data-r="risk" value="${esc(r.risk || '')}"></label></div></div>`;
    foot = `<button class="sec" data-back>Back</button><span class="sp"></span><button class="primary" data-go2>Looks right · next</button>`;
  }
  if (A.step === 3) {
    body = `<div class="aq"><h2>A few questions only you can answer</h2><p>Your answers become the scorecard justifications, the deal stage and the first discussion entries. Skip any you don't know yet.</p>
      ${A.qa.map((q, i) => `<label class="pf"><span>${i + 1}. ${esc(q.q)}</span><textarea data-qa="${i}" rows="2" placeholder="Your answer">${esc(q.a)}</textarea></label>`).join('')}
      <label class="pf"><span>Anything else · notes and insight</span><textarea data-a="notes" rows="3" placeholder="What you know, what you think, what to watch">${esc(A.notes)}</textarea></label>
      <button class="dpriv ${A.notesPriv ? 'on' : ''}" data-np aria-pressed="${A.notesPriv}"><i></i>Keep my notes private (never printed)</button>
      ${A.err ? `<p class="aerr">${esc(A.err)}</p>` : ''}</div>`;
    foot = `<button class="sec" data-back>Back</button><span class="sp"></span><button class="sec" data-skipq>Skip questions</button><button class="primary" data-go3>Build profile</button>`;
  }
  S.innerHTML = shell(body, foot);
  S.querySelector('[data-close]').onclick = close;
  S.querySelectorAll('[data-a]').forEach(el => el.oninput = () => { A[el.dataset.a] = el.value; });
  S.querySelectorAll('[data-r]').forEach(el => el.oninput = () => { A.res[el.dataset.r] = el.value; });
  S.querySelectorAll('[data-d]').forEach(el => el.oninput = () => { (A.res.diffs = A.res.diffs || [])[+el.dataset.d] = el.value; });
  S.querySelectorAll('[data-qa]').forEach(el => el.oninput = () => { A.qa[+el.dataset.qa].a = el.value; });
  const on = (sel, fn) => { const b = S.querySelector(sel); if (b) b.onclick = fn; };
  on('[data-manual]', () => { close(); openNew({ type: 'Drug', name: A.name, website: A.web, city: A.hq }); });
  on('[data-go1]', research);
  on('[data-back]', () => { A.step--; A.err = ''; render(); });
  on('[data-go2]', () => { A.step = 3; render(); });
  on('[data-np]', () => { A.notesPriv = !A.notesPriv; render(); });
  on('[data-skipq]', () => build(null));
  on('[data-go3]', finish);
  const lg = S.querySelector('[data-logo]'); if (lg) lg.onchange = () => { A.logoOn = lg.checked; render(); };
  const n1 = S.querySelector('[data-a="name"]'); if (n1) n1.onkeydown = e => { if (e.key === 'Enter') research(); };
}

async function research() {
  if (!A.name.trim()) { A.err = 'Add a company name first.'; render(); return; }
  A.busy = true; A.err = ''; render();
  try {
    const t = await window.claude.complete({ max_tokens: 2000,
      system: 'You are a research assistant for a senior business development executive in ophthalmology. Use only public information you know about the company. If unsure of a value, use null rather than guessing a precise number. Reply with JSON only.',
      messages: [{ role: 'user', content: `Company: ${A.name}\nWebsite: ${A.web || 'unknown'}\nHQ hint: ${A.hq || 'none'}\n\nAllowed values:\n- kind: seeking (biotech or medtech seeking capital or partners) | pharma (large pharma looking to invest, license or acquire) | investor (VC fund or investment group)\n- type: Drug | Device\n- seg: Anterior | Posterior\n- ind: prefer one of ${[...POST, ...ANT].join(', ')}; a new ophthalmic indication is allowed\n- phase (Drug): ${DRUG_PH.join(' | ')}\n- phase (Device): ${DEV_PH.join(' | ')}\n- region: Americas | Europe | APAC\n- own: ${OWN.join(' | ')} (for public, write "Public (EXCHANGE: TICKER)")\n\nReturn JSON with keys: found (bool), kind, city, country, region, own, founded ("YYYY" or null), heads (number as string or null), type, seg, ind, asset ("CODE · indication · modality, route"), phase, cat ("Event · Qn YYYY" or null), raise ("$XXM Series X, Mon YYYY" or null), seeking (deal they seem open to, or null), overview (two plain sentences), diffs (array of 3 short lines), risk (one line), confidence (object with high|medium|low for each of the keys above), questions (array of 4 to 6 short questions for the BD lead covering what public data cannot: how they know the company, where met, deal stage, fit with their portfolio, rights or economics they have heard, team quality).` }] });
    const r = parse(t);
    if (!['seeking', 'pharma', 'investor'].includes(r.kind)) r.kind = 'seeking';
    if (r.type !== 'Device') r.type = 'Drug';
    if (r.seg !== 'Anterior') r.seg = 'Posterior';
    if (!REGIONS.includes(r.region)) r.region = 'Americas';
    A.res = r; A.qa = (r.questions || []).slice(0, 6).map(q => ({ q, a: '' }));
    if (!A.qa.length) A.qa = ['How do you know this company, and where did you meet?', 'What deal stage are you at with them?', 'How does their lead asset fit your portfolio?', 'Any rights, economics or timing you have heard?'].map(q => ({ q, a: '' }));
    A.step = 2;
  } catch (e) { A.err = 'Claude research did not complete (' + (e.message || e) + '). Try again or fill in manually.'; }
  A.busy = false; render();
}

async function finish() {
  const answered = A.qa.filter(q => q.a.trim());
  if (!answered.length && !A.notes.trim()) return build(null);
  A.busy = true; A.err = ''; render();
  try {
    const t = await window.claude.complete({ max_tokens: 1800,
      system: 'You help a BD executive complete a partnering assessment. Base scores only on the research and the executive\'s answers. Be terse, numbers first, no exclamation marks. Reply with JSON only.',
      messages: [{ role: 'user', content: `Research:\n${JSON.stringify({ ...A.res, questions: undefined, confidence: undefined })}\n\nQ&A:\n${A.qa.map(q => 'Q: ' + q.q + '\nA: ' + (q.a || '(no answer)')).join('\n')}\n\nNotes: ${A.notes || '(none)'}\n\nScorecard criteria (score each 1-5): ${SC.map(s => s[0] + ' (weight ' + s[1] + ')').join('; ')}.\nDeal stages by index: ${DEALS.map((d, i) => i + '=' + d).join(', ')}, -1=Parked.\n\nReturn JSON: scores (array of 6 ints), why (array of 6 one-line justifications), dec (Pursue|Watch|Pass), rationale (one line), deal (int), whereMet (string or null), nextStep (string or null), seeking (string or null), timing (string or null), notes (array of {type: Call|Meeting|Email|Congress|Note, text, daysAgo}) summarising what the executive told you.` }] });
    build(parse(t));
  } catch (e) { A.busy = false; A.err = 'Claude could not finish the assessment (' + (e.message || e) + '). Try again or skip questions.'; render(); }
}

function build(x) {
  A.busy = false; close();
  const r = A.res || {}, ty = r.type === 'Device' ? 'Device' : 'Drug', PH = ty === 'Device' ? DEV_PH : DRUG_PH;
  const phase = PH.includes(r.phase) ? r.phase : PH[0];
  const scores = x && Array.isArray(x.scores) && x.scores.length === 6 ? x.scores.map(v => Math.max(1, Math.min(5, Math.round(+v) || 3))) : [3, 3, 3, 3, 3, 3];
  const why = x && Array.isArray(x.why) ? SC.map((_, i) => String(x.why[i] || '')) : ['', '', '', '', '', ''];
  const deal = x && Number.isInteger(x.deal) && x.deal >= -1 && x.deal <= 6 ? x.deal : 0;
  const notes = [[0, 'Note', 'Added to BirdNest with Claude research.', false]];
  if (x && Array.isArray(x.notes)) x.notes.forEach(n => notes.push([Math.max(0, Math.round(+n.daysAgo) || 0), ['Call', 'Meeting', 'Email', 'Congress', 'Note'].includes(n.type) ? n.type : 'Note', String(n.text || ''), A.notesPriv]));
  else if (A.notes.trim()) notes.push([0, 'Note', A.notes.trim(), A.notesPriv]);
  notes.sort((a, b) => a[0] - b[0]);
  const fit = calcFit(scores);
  const asset = r.asset || (r.ind ? r.ind + ' · ' + ty.toLowerCase() : ty);
  openNew({
    type: ty, kind: ['seeking', 'pharma', 'investor'].includes(r.kind) ? r.kind : 'seeking', name: A.name.trim(), website: host(A.web) || A.web, city: r.city || A.hq || '', cdisp: r.country || '', region: r.region || 'Americas', regionSet: true,
    own: r.own || 'Private', founded: r.founded ? String(r.founded) : '', heads: r.heads ? String(r.heads) : '', seg: r.seg === 'Anterior' ? 'Anterior' : 'Posterior',
    ind: r.ind || '', asset, phase, phaseLabel: phase, cat: r.cat || '', raise: r.raise || '', scores, why, prevFit: fit, fit,
    dec: x && ['Pursue', 'Watch', 'Pass'].includes(x.dec) ? x.dec : fit >= 76 ? 'Pursue' : fit >= 50 ? 'Watch' : 'Pass', rationale: x && x.rationale || '',
    deal, notes, last: notes[0][0], topic: notes.find(n => !n[3] && n[0] === notes[0][0])?.[2] || 'Added to BirdNest',
    logo: A.logoOn && logoUrl() ? logoUrl() : null,
    ai: { overview: r.overview || '', diffs: (r.diffs || []).filter(Boolean).slice(0, 3), risk: r.risk || '', seeking: (x && x.seeking) || r.seeking || 'Not stated', timing: (x && x.timing) || 'Not stated',
      pipe: [[asset.split(' · ')[0], asset.split(' · ').slice(1).join(' · ') || r.ind || '', ty === 'Device' ? [3, 6, 9][DEV_PH.indexOf(phase)] : ({ 'Preclinical': 1, 'Phase 1': 3, 'Phase 2': 5, 'Phase 3': 7, 'Phase 4': 9 })[phase] ?? 1, r.cat || '—']],
      econ: [], contacts: [], rel: [['Where met', (x && x.whereMet) || 'Not recorded'], ...(x && x.nextStep ? [['Next step', x.nextStep]] : [])] }
  });
}
})();
