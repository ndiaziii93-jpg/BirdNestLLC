// Sample dataset, ported line for line from the prototype so the app looks exactly like the
// design screenshots once "Load sample data" is pressed. Uses the same seeded generators.
import { DEF_W, DEFAULT_ANT, DEFAULT_POST, DEV_PH, DRUG_PH, NOTE_TYPES } from './constants';
import { isoDaysAgo, todayISO } from './dates';
import { calcFitFrom } from './fit';
import type { AiProfile, BuyBox, Company, Decision, Intro, IntroStatus, Kind, Note, NoteType, Region } from './types';

type RawNote = [number, string, string, boolean?];
interface Raw {
  id: string; kind: Kind; name: string; city: string; cdisp: string; country: string; region: Region; lat: number; lon: number;
  type: 'Drug' | 'Device'; seg: 'Anterior' | 'Posterior'; ind: string; asset: string; phase: string; phaseLabel: string; fit: number; trend: number; dec: Decision;
  deal: number; cat: string; runway: number; raise: string; rights: number; last: number; topic: string; own: string;
  scores?: number[]; why?: string[]; prevFit?: number; rightsArr?: boolean[]; website?: string; founded?: string; heads?: string; rationale?: string; notes?: RawNote[];
  appetite?: string; scale?: string; logo?: string | null;
}

const rng = (seed: number) => { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; };

function build(): Raw[] {
  const r = rng(23);
  const pick = <T,>(a: readonly T[]): T => a[Math.floor(r() * a.length)];
  const X: [string, string, string, string, Region, number, number, 'Drug' | 'Device', 'Anterior' | 'Posterior', string, string, string, string, number, number, Decision, number, string, number, string, number, number, string, string][] = [
    ['Lumen Ocular', 'Oslo', 'Norway', 'Norway', 'Europe', 59.9, 10.7, 'Drug', 'Posterior', 'IRDs', 'LO-201 · XLRS · AAV8, subretinal', 'Phase 1', 'Phase 1/2', 82, 4, 'Pursue', 3, 'IND amendment · Q4 2026', 14, '$58M Series B', 4, 6, 'Data-room access', 'VC-backed (Series B)'],
    ['Halden Therapeutics', 'Cambridge, MA', 'USA', 'United States of America', 'Americas', 42.37, -71.1, 'Drug', 'Posterior', 'nAMD', 'HT-07 · nAMD · TKI implant, IVT', 'Phase 2', 'Phase 2', 78, 2, 'Pursue', 2, 'Ph2 topline · Q1 2027', 22, '$95M Series C', 5, 12, 'Ph2 data review', 'VC-backed (Series C)'],
    ['Kiseki Vista', 'Osaka', 'Japan', 'Japan', 'APAC', 34.7, 135.5, 'Drug', 'Anterior', 'Dry eye', 'KV-3 · dry eye · peptide drop', 'Phase 3', 'Phase 3', 74, 0, 'Watch', 1, 'Ph3 readout · Q2 2027', 30, 'Public · TSE', 2, 34, 'US and EU partnering', 'Public (TSE: 4987)'],
    ['Sorrel Bio', 'San Diego, CA', 'USA', 'United States of America', 'Americas', 32.7, -117.2, 'Drug', 'Posterior', 'GA', 'SB-110 · GA · complement, IVT', 'Phase 2', 'Phase 2b', 71, 3, 'Pursue', 4, 'EOP2 meeting · Q4 2026', 18, '$72M Series B', 6, 3, 'Option pricing mechanics', 'VC-backed (Series B)'],
    ['Meridian Optic', 'Barcelona', 'Spain', 'Spain', 'Europe', 41.4, 2.2, 'Drug', 'Posterior', 'NPDR/DR', 'MO-4 · NPDR · oral small molecule', 'Phase 2', 'Phase 2', 66, -2, 'Watch', 2, 'Series C close · Q4 2026', 9, '$31M Series B', 6, 48, 'Runway and financing', 'VC-backed (Series B)'],
    ['Taiyang Pharma', 'Suzhou', 'China', 'China', 'APAC', 31.3, 120.6, 'Drug', 'Posterior', 'DME', 'TY-881 · DME · biosimilar, IVT', 'Phase 3', 'Phase 3', 61, 1, 'Watch', 0, 'BLA filing · Q3 2027', 36, 'Public · HKEX', 2, 95, 'Biosimilar timelines', 'Public (HKEX: 2196)'],
    ['Corvane', 'London', 'UK', 'United Kingdom', 'Europe', 51.5, -0.12, 'Drug', 'Posterior', 'Uveitis', 'CV-12 · uveitic ME · suprachoroidal', 'Phase 2', 'Phase 2', 58, 0, 'Watch', 1, 'Ph2 enrolment · Q1 2027', 16, 'PE-backed', 3, 63, 'CMC services scope', 'PE-backed'],
    ['Aurelle Eye', 'Melbourne', 'Australia', 'Australia', 'APAC', -37.8, 145.0, 'Drug', 'Anterior', 'Myopia', 'AE-02 · myopia · low-dose atropine', 'Phase 4', 'Approved (AU)', 44, -5, 'Pass', -1, 'None set', 24, 'Private', 1, 140, 'Regional rights', 'Private'],
  ];
  const out: Raw[] = X.map((a, i) => ({ id: 's' + i, kind: 'seeking', name: a[0], city: a[1], cdisp: a[2], country: a[3], region: a[4], lat: a[5], lon: a[6], type: a[7], seg: a[8], ind: a[9], asset: a[10], phase: a[11], phaseLabel: a[12], fit: a[13], trend: a[14], dec: a[15], deal: a[16], cat: a[17], runway: a[18], raise: a[19], rights: a[20], last: a[21], topic: a[22], own: a[23] }));
  const C: [string, string, string, Region, number, number][] = [['Boston', 'USA', 'United States of America', 'Americas', 42.36, -71.06], ['New York', 'USA', 'United States of America', 'Americas', 40.7, -74], ['Philadelphia', 'USA', 'United States of America', 'Americas', 39.95, -75.2], ['San Francisco', 'USA', 'United States of America', 'Americas', 37.77, -122.4], ['Irvine', 'USA', 'United States of America', 'Americas', 33.7, -117.8], ['Seattle', 'USA', 'United States of America', 'Americas', 47.6, -122.3], ['Toronto', 'Canada', 'Canada', 'Americas', 43.65, -79.38], ['Montreal', 'Canada', 'Canada', 'Americas', 45.5, -73.6], ['São Paulo', 'Brazil', 'Brazil', 'Americas', -23.5, -46.6],
    ['Oxford', 'UK', 'United Kingdom', 'Europe', 51.75, -1.26], ['Dublin', 'Ireland', 'Ireland', 'Europe', 53.35, -6.26], ['Copenhagen', 'Denmark', 'Denmark', 'Europe', 55.7, 12.6], ['Munich', 'Germany', 'Germany', 'Europe', 48.1, 11.6], ['Paris', 'France', 'France', 'Europe', 48.85, 2.35], ['Basel', 'Switzerland', 'Switzerland', 'Europe', 47.56, 7.59], ['Leiden', 'Netherlands', 'Netherlands', 'Europe', 52.16, 4.49], ['Stockholm', 'Sweden', 'Sweden', 'Europe', 59.3, 18.1],
    ['Tokyo', 'Japan', 'Japan', 'APAC', 35.7, 139.7], ['Seoul', 'South Korea', 'South Korea', 'APAC', 37.57, 126.98], ['Shanghai', 'China', 'China', 'APAC', 31.2, 121.5], ['Singapore', 'Singapore', 'Singapore', 'APAC', 1.35, 103.8], ['Sydney', 'Australia', 'Australia', 'APAC', -33.9, 151.2], ['Bengaluru', 'India', 'India', 'APAC', 12.97, 77.59]];
  const DEV: Record<string, [string, string][]> = { Anterior: [['Glaucoma/OHT', 'MIGS stent'], ['Dry eye', 'thermal pulsation system'], ['Keratoconus', 'epi-on cross-linking'], ['Presbyopia', 'EDOF intraocular lens'], ['Myopia', 'defocus spectacle lens']], Posterior: [['nAMD', 'port delivery reservoir'], ['NPDR/DR', 'AI retinal screening'], ['GA', 'photobiomodulation']] };
  const DRUGMOD: Record<string, string[]> = { Anterior: ['peptide drop', 'small-molecule drop', 'biologic drop', 'punctal insert'], Posterior: ['biologic, IVT', 'AAV, subretinal', 'TKI implant, IVT', 'oligonucleotide, IVT', 'small molecule, oral', 'suprachoroidal suspension'] };
  const P = ['Arden', 'Vireo', 'Castell', 'Nordlys', 'Pelion', 'Quill', 'Aster', 'Brightwater', 'Celest', 'Duna', 'Eskil', 'Fovea', 'Granite', 'Helix', 'Iris Bay', 'Juno', 'Kestrel', 'Lantern', 'Macula', 'Nimbus', 'Orrin', 'Pale Ridge', 'Tessel', 'Saltire', 'Umbra', 'Vantage', 'Westmark', 'Yarrow', 'Zephyr', 'Alder', 'Birchwood', 'Cobalt', 'Delphi', 'Ember', 'Fjell', 'Glint', 'Harbor', 'Ivory', 'Jade', 'Keel', 'Lyra', 'Solace'];
  const SUF = ['Therapeutics', 'Bio', 'Ocular', 'Pharma', 'Vision', 'Medical', 'Sciences'];
  const EV = ['Ph1 data', 'Ph2 topline', 'IND filing', 'EOP2 meeting', 'Financing', 'Ph3 readout', 'Interim data', '510(k) clearance', 'PMA submission', 'CE mark'];
  const TOP = ['Ph2 data review', 'Term sheet structure', 'CMC capacity', 'US rights scope', 'EU licensing appetite', 'Endpoint strategy', 'Runway and financing', 'Competitive landscape', 'Royalty tiers', 'Distribution in Japan'];
  const OWN = ['VC-backed (Series A)', 'VC-backed (Series B)', 'Private', 'PE-backed', 'Public (NASDAQ)', 'Subsidiary'];
  P.forEach((nm, i) => {
    const c = pick(C), dev = r() < 0.28, seg: 'Anterior' | 'Posterior' = r() < 0.5 ? 'Anterior' : 'Posterior';
    let ind: string, asset: string, phase: string;
    const code = nm.slice(0, 2).toUpperCase().replace(' ', 'X') + '-' + (10 + Math.floor(r() * 890));
    if (dev) { const d = pick(DEV[seg]); ind = d[0]; phase = pick(DEV_PH); asset = code + ' · ' + ind + ' · ' + d[1]; }
    else { ind = pick(seg === 'Anterior' ? DEFAULT_ANT : DEFAULT_POST); phase = DRUG_PH[Math.min(4, Math.floor(r() * r() * 5.5))]; asset = code + ' · ' + ind + ' · ' + pick(DRUGMOD[seg]); }
    const fit = Math.round(28 + r() * 52), q = 'Q' + (1 + Math.floor(r() * 4)) + ' ' + (r() < 0.6 ? 2027 : 2026);
    out.push({
      id: 'g' + i, kind: 'seeking', name: nm + ' ' + pick(SUF), city: c[0], cdisp: c[1], country: c[2], region: c[3], lat: c[4] + (r() - 0.5) * 2.4, lon: c[5] + (r() - 0.5) * 2.4,
      type: dev ? 'Device' : 'Drug', seg, ind, asset, phase, phaseLabel: phase, fit, trend: Math.round((r() - 0.5) * 8), dec: fit >= 76 ? 'Pursue' : fit >= 50 ? 'Watch' : 'Pass',
      deal: r() < 0.1 ? -1 : Math.floor(r() * r() * 6.2), cat: pick(EV) + ' · ' + q, runway: Math.round(8 + r() * 30), raise: '$' + Math.round(8 + r() * 90) + 'M', rights: 1 + Math.floor(r() * 6), last: Math.round(2 + r() * 120), topic: pick(TOP), own: pick(OWN),
    });
  });
  return out;
}

function scoreAll(DATA: Raw[]) {
  DATA.forEach((d, k) => {
    const h = [...d.id].reduce((a, c) => a + c.charCodeAt(0), 0) + k;
    d.scores = d.id === 's0' ? [5, 4, 3, 4, 4, 4] : DEF_W.map((_, i) => Math.max(1, Math.min(5, Math.round(d.fit / 20 + ((((h * (i + 3)) % 5) - 2) * 0.45)))));
    d.why = d.id === 's0'
      ? ['XLRS fills the IRD gap in our retina portfolio; subretinal fits our surgical network.', 'Only programme with 12-month durability; capsid itself is not unique.', 'Phase 1/2 n=18; microperimetry endpoint not agreed with FDA.', 'Orphan pricing; US-weighted prevalence.', 'Banker-led process from Nov 2026; stated range inside our band.', 'Bergen retina group; in-house 200L CMC.']
      : DEF_W.map(() => '');
    d.prevFit = d.fit; d.fit = calcFitFrom(d.scores, DEF_W);
    d.dec = d.id.startsWith('s') ? d.dec : d.fit >= 76 ? 'Pursue' : d.fit >= 50 ? 'Watch' : 'Pass';
    d.rightsArr = ['US', 'EU', 'UK', 'JP', 'CN', 'RoW'].map((_, i) => (((h >> i) & 1) ? true : i < d.rights));
    d.rights = d.rightsArr.filter(Boolean).length;
    d.website = d.name.toLowerCase().replace(/[^a-z]/g, '') + '.com';
    d.founded = d.id === 's0' ? '2019' : String(2008 + (h % 15));
    d.heads = d.id === 's0' ? '48' : String(12 + (h % 140));
    d.rationale = d.id === 's0' ? 'Only durable XLRS asset; CDA signed, data room 21 Oct.' : '';
    d.notes = d.id === 's0'
      ? [[6, 'Call', 'Data-room access confirmed for 21 Oct with Mette Haugland (CBO).'], [17, 'Note', 'CDA signed. Mutual, 3-year term.'], [37, 'Congress', 'First meeting at EURETINA 2026, Vienna.']]
      : [[d.last, 'Call', d.topic + '.']];
  });
}

const ACCOUNTS: [Kind, string, string, string, string, Region, number, number, 'Drug' | 'Device', 'Anterior' | 'Posterior', string, string, string, string, string, string, number, number, string, number, string][] = [
  ['pharma', 'Aldren Pharma', 'Basel', 'Switzerland', 'Switzerland', 'Europe', 47.56, 7.59, 'Drug', 'Posterior', 'IRDs', 'Retina · gene therapy and sustained-release delivery', 'Public (SIX: ALDN)', 'In-license Ph2+, $50–150M upfront', 'Global · $48B revenue', 'Co-development · subretinal AAV · Mar 2026', 84, 3, 'Retina BD lead met at EURETINA; open to XLRS and Stargardt assets.', 1886, '92,000'],
  ['pharma', 'Kestova Pharmaceutical', 'Tokyo', 'Japan', 'Japan', 'APAC', 35.68, 139.69, 'Drug', 'Anterior', 'Dry eye', 'Anterior segment · dry eye and glaucoma, Japan and Asia rights', 'Public (TSE: 4519)', 'Regional rights, Ph2–Ph3', 'APAC · $9B revenue', 'Japan rights · glaucoma drop · Nov 2025', 77, 2, 'Seeking Japan and China rights to late-stage anterior assets.', 1923, '18,400'],
  ['pharma', 'Northmoor Pharmaceuticals', 'Princeton, NJ', 'USA', 'United States of America', 'Americas', 40.35, -74.66, 'Drug', 'Posterior', 'GA', 'Retina · nAMD, DME, GA; option-to-acquire structures', 'Public (NYSE: NMP)', 'Options and M&A, $200M+', 'Global · $31B revenue', 'Option deal · GA complement · Jul 2025', 80, 4, 'Prefers option-to-acquire with milestone-heavy economics.', 1932, '41,000'],
  ['pharma', 'Vellacourt', 'Paris', 'France', 'France', 'Europe', 48.86, 2.35, 'Device', 'Anterior', 'Glaucoma/OHT', 'Ophthalmic devices · MIGS, IOLs and surgical', 'Public (EPA: VLC)', 'Tuck-in M&A, $50–300M', 'Global · $6B revenue', 'Acquisition · MIGS stent · Feb 2026', 68, 1, 'Device-focused; interested in MIGS and presbyopia IOLs.', 1972, '12,600'],
  ['pharma', 'Hanseo Pharma', 'Seoul', 'South Korea', 'South Korea', 'APAC', 37.57, 126.98, 'Drug', 'Posterior', 'DME', 'Biosimilars and retina, Korea and Southeast Asia', 'Public (KRX: 128940)', 'Regional licensing, co-commercialisation', 'APAC · $2B revenue', 'Licence · aflibercept biosimilar · Apr 2026', 62, 0, 'Regional partner for biosimilars and late-stage retina.', 1973, '4,800'],
  ['investor', 'Fjordline Ventures', 'Oslo', 'Norway', 'Norway', 'Europe', 59.91, 10.75, 'Drug', 'Posterior', 'IRDs', 'Ophthalmology and rare retina · seed to Series B', 'Private', '$5–25M per round', 'Seed to Series B', 'Fund II · $320M · 2025', 79, 2, 'Lead investor type; strong Nordic retina network.', 2016, '14'],
  ['investor', 'Tidewater Life Sciences', 'Boston', 'USA', 'United States of America', 'Americas', 42.36, -71.06, 'Drug', 'Posterior', 'nAMD', 'Ophthalmology and neuroscience · Series B–C', 'Private', '$20–60M per round', 'Series B to C', 'Fund IV · $850M · 2024', 74, 1, 'Co-invests alongside strategics; likes option structures.', 2004, '38'],
  ['investor', 'Granary Capital', 'London', 'UK', 'United Kingdom', 'Europe', 51.51, -0.13, 'Drug', 'Anterior', 'Dry eye', 'Growth equity · late clinical and commercial', 'Private', '$40–120M per deal', 'Late stage and pre-IPO', 'Growth Fund III · $1.2B · 2023', 66, 0, 'Late-stage only; useful for Ph3 financings.', 2009, '52'],
  ['investor', 'Kaiyo Partners', 'Singapore', 'Singapore', 'Singapore', 'APAC', 1.29, 103.85, 'Drug', 'Anterior', 'Myopia', 'Asia ophthalmology · myopia and anterior', 'Private', '$2–10M per round', 'Seed to Series A', 'Fund I · $210M · 2025', 58, 0, 'Early stage; strong myopia thesis in Asia.', 2019, '9'],
  ['investor', 'Sable Peak Health', 'San Francisco', 'USA', 'United States of America', 'Americas', 37.77, -122.42, 'Device', 'Posterior', 'NPDR/DR', 'Crossover · devices and diagnostics', 'Private', '$25–75M per round', 'Crossover and pre-IPO', 'Crossover Fund II · $600M · 2024', 63, 1, 'Crossover investor; device and diagnostics focus.', 2012, '27'],
];

function addAccounts(DATA: Raw[]) {
  ACCOUNTS.forEach((p, i) => {
    const [kind, name, city, cdisp, country, region, lat, lon, type, seg, ind, asset, own, appetite, scale, raise, fit, deal, topic, founded, heads] = p;
    const base = Math.round(fit / 20), scores = [0, 1, 2, 3, 4, 5].map(k => Math.max(1, Math.min(5, base + ((i + k) % 3 === 0 ? 1 : (i + k) % 3 === 1 ? 0 : -1))));
    const f = calcFitFrom(scores, DEF_W), last = 4 + ((i * 13) % 70);
    DATA.push({
      id: 'k' + i, kind, name, city, cdisp, country, region, lat: lat + (i % 2 ? 0.4 : -0.4), lon: lon + (i % 2 ? -0.5 : 0.5), type, seg, ind, asset, phase: '', phaseLabel: '—',
      fit: f, prevFit: f, trend: (i % 3) - 1, dec: f >= 76 ? 'Pursue' : f >= 50 ? 'Watch' : 'Pass', deal, cat: kind === 'pharma' ? 'BD partnering day · Q1 2027' : 'Partner meeting · Q4 2026',
      runway: 0, raise, rights: 0, rightsArr: [false, false, false, false, false, false], last, topic, own, scores, why: ['', '', '', '', '', ''],
      website: name.toLowerCase().replace(/[^a-z]/g, '') + '.com', founded: String(founded), heads, rationale: '', appetite, scale,
      notes: [[last, kind === 'pharma' ? 'Meeting' : 'Call', topic, false]], logo: null,
    });
  });
}

function seedNotes(DATA: Raw[]) {
  const r = rng(97);
  const TX = ['Intro call with CBO; asked for the non-confidential deck.', 'Met at ARVO 2026; follow-up on Phase 2 design.', 'Requested public pipeline summary.', 'Banker outreach on process timing.', 'Competitor readout may shift their positioning.', 'Call with CEO on runway and financing plans.', 'Discussed US rights scope at a high level.', 'Met at AAO 2026, Chicago.', 'Shared our therapeutic-area priorities.'];
  DATA.forEach(d => {
    d.notes = (d.notes || []).map(n => [n[0], n[1], n[2], !!n[3]]);
    if (d.id === 's0') {
      d.notes.splice(2, 0, [25, 'Note', 'Banker indicates upfront floor near $45M.', true], [31, 'Email', 'Requested natural-history dataset summary from Jonas Strand.', false]);
      d.notes.sort((a, b) => a[0] - b[0]);
      return;
    }
    const k = Math.floor(r() * 3);
    let off = d.notes.length ? d.notes[d.notes.length - 1][0] : d.last;
    for (let i = 0; i < k; i++) { off += Math.round(8 + r() * 40); d.notes.push([off, NOTE_TYPES[Math.floor(r() * 5)], TX[Math.floor(r() * TX.length)], r() < 0.15]); }
  });
}

export const LUMEN: AiProfile = {
  overview: 'Lumen Ocular is a Series B gene therapy company in Oslo developing subretinal AAV8 programmes for inherited retinal disease. Its lead asset LO-201 is the only XLRS programme with 12-month durability data.',
  diffs: ['Only XLRS programme with 12-month durability on a subretinal AAV8 capsid; two competitors are intravitreal and stalled.', 'Manufacturing in-house at 200L scale.', 'Founders are the Bergen retina group behind the natural-history dataset FDA will benchmark against.'],
  risk: 'Phase 1/2 n=18; pivotal endpoint (microperimetry) not yet agreed with FDA.',
  pipe: [['LO-201', 'RS1 · XLRS · AAV8, subretinal', 4, 'IND amendment · Q4 2026'], ['LO-240', 'RPGR · XLRP · AAV, subretinal', 2, 'IND · Q2 2027'], ['LO-305', 'Dual-vector · Stargardt', 1, '—']],
  seeking: 'Co-development or US out-license',
  timing: 'Active process · banker-led from Nov 2026',
  econ: [['Upfront', '$40–60M'], ['Milestones', 'to $400M'], ['Royalty', 'Low-to-mid teens']],
  contacts: [['Mette Haugland', 'CBO · decision-maker'], ['Jonas Strand', 'CEO · champion'], ['Arne Berg', 'Hadean Ventures · board']],
  rel: [['Where met', 'EURETINA 2026, Vienna'], ['CDA', 'Signed 02 Oct 2026'], ['Next step', 'Data-room walkthrough · 21 Oct']],
};

const BUY: Record<string, Omit<BuyBox, 'whereMet'> & { whereMet?: string }> = {
  k0: { inds: ['IRDs', 'GA', 'nAMD'], mods: ['AAV / gene therapy', 'Implant / sustained release'], st: [1, 3], geo: ['US', 'EU'], deals: ['In-license', 'Co-development'], excl: ['Biosimilars', 'Topical drops'], money: [['Upfront', '$50–150M'], ['Milestones', 'to $1B']], contact: 'Dr Katrin Vogt · Head of Ophthalmology BD', whereMet: 'EURETINA 2026, Vienna' },
  k1: { inds: ['Dry eye', 'Glaucoma/OHT', 'Presbyopia'], mods: ['Small molecule', 'Peptide'], st: [2, 3], geo: ['JP', 'CN'], deals: ['Regional rights', 'In-license'], excl: ['Gene therapy'], money: [['Upfront', '$10–40M'], ['Royalty', 'Mid-teens']], contact: 'Haruto Sato · VP Business Development' },
  k2: { inds: ['nAMD', 'DME', 'GA'], mods: ['Biologic', 'Implant / sustained release', 'AAV / gene therapy'], st: [2, 3], geo: ['US', 'EU', 'JP'], deals: ['Option-to-acquire', 'M&A'], excl: ['Anterior segment'], money: [['Upfront', '$75–250M'], ['Total value', 'to $1.5B']], contact: 'Marcus Hale · SVP Search & Evaluation' },
  k3: { inds: ['Glaucoma/OHT', 'Presbyopia', 'Myopia', 'Keratoconus'], mods: ['Device'], st: [1, 4], geo: ['US', 'EU'], deals: ['M&A', 'Co-development'], excl: ['Drug-only assets'], money: [['Deal size', '$50–300M']], contact: 'Claire Dubois · Head of Corporate Development' },
  k4: { inds: ['DME', 'nAMD', 'Dry eye'], mods: ['Biologic', 'Small molecule'], st: [3, 4], geo: ['RoW', 'CN'], deals: ['Regional rights'], excl: ['Preclinical'], money: [['Upfront', '$5–20M']], contact: 'Ji-ho Park · Director, Licensing' },
  k5: { inds: ['IRDs', 'GA', 'Uveitis'], mods: ['AAV / gene therapy', 'Oligonucleotide', 'Biologic'], st: [0, 2], geo: [], deals: [], excl: ['Devices'], money: [['Check size', '$5–25M'], ['Role', 'Lead or co-lead']], contact: 'Ingrid Moe · Partner' },
  k6: { inds: ['nAMD', 'GA', 'DME', 'NPDR/DR'], mods: ['Biologic', 'Implant / sustained release', 'Small molecule'], st: [2, 3], geo: [], deals: [], excl: ['Seed stage'], money: [['Check size', '$20–60M'], ['Role', 'Lead']], contact: 'Daniel Reyes · Managing Director' },
  k7: { inds: ['Dry eye', 'Glaucoma/OHT', 'nAMD'], mods: ['Small molecule', 'Biologic', 'Device'], st: [3, 4], geo: [], deals: [], excl: ['Pre-Phase 2'], money: [['Check size', '$40–120M'], ['Role', 'Growth equity']], contact: 'Oliver Grant · Principal' },
  k8: { inds: ['Myopia', 'Dry eye', 'Presbyopia'], mods: ['Small molecule', 'Device', 'Peptide'], st: [0, 1], geo: [], deals: [], excl: ['Late stage'], money: [['Check size', '$2–10M'], ['Role', 'Seed lead']], contact: 'Mei Tan · Founding Partner' },
  k9: { inds: ['NPDR/DR', 'Glaucoma/OHT', 'nAMD'], mods: ['Device'], st: [3, 4], geo: [], deals: [], excl: ['Preclinical'], money: [['Check size', '$25–75M'], ['Role', 'Crossover']], contact: 'Alex Kim · Partner' },
};

const INTROS: { b: string; s: string; d: number; st: IntroStatus; n: string }[] = [
  { b: 'k0', s: 's0', d: 37, st: 'CDA signed', n: 'Data-room walkthrough 21 Oct' },
  { b: 'k0', s: 's3', d: 16, st: 'Intro call held', n: 'Asked for complement MoA data' },
  { b: 'k2', s: 's3', d: 30, st: 'Diligence', n: 'Option structure under discussion' },
  { b: 'k1', s: 's2', d: 22, st: 'Introduced', n: 'Japan rights for KV-3' },
  { b: 'k5', s: 's0', d: 45, st: 'Intro call held', n: 'Follow-on for Series C' },
  { b: 'k6', s: 's1', d: 12, st: 'Introduced', n: 'Sent teaser deck' },
  { b: 'k2', s: 's1', d: 60, st: 'Declined', n: 'Wants US rights; Halden is ex-US only' },
];

/** Build the full sample dataset with note dates relative to `today`. */
export function buildSample(today: string = todayISO()): { companies: Company[]; intros: Intro[] } {
  const DATA = build();
  scoreAll(DATA);
  addAccounts(DATA);
  seedNotes(DATA);
  const runwayAsOf = isoDaysAgo(111, today); // "as of 30 Jun 2026" in the prototype, 111 days before 19 Oct 2026
  const companies: Company[] = DATA.map(d => ({
    id: d.id, kind: d.kind, name: d.name, website: d.website || '', city: d.city, cdisp: d.cdisp, country: d.country, region: d.region, lat: d.lat, lon: d.lon,
    type: d.type, seg: d.seg, ind: d.ind, asset: d.asset, phase: d.phase, phaseLabel: d.phaseLabel, trend: d.trend, dec: d.dec, deal: d.deal, cat: d.cat,
    runway: d.kind === 'seeking' ? d.runway : null, runwayAsOf: d.kind === 'seeking' ? runwayAsOf : null, raise: d.raise, rightsArr: d.rightsArr || [false, false, false, false, false, false],
    own: d.own, founded: d.founded || '', heads: d.heads || '', rationale: d.rationale || '', scores: d.scores || [3, 3, 3, 3, 3, 3], why: d.why || ['', '', '', '', '', ''],
    svcScores: [3, 3, 3, 3, 3], svcWhy: ['', '', '', '', ''], prevFit: d.prevFit ?? d.fit, fit: d.fit, logo: null, appetite: d.appetite || '', scale: d.scale || '', lens: 'partnering',
    ai: d.id === 's0' ? LUMEN : null,
    buyBox: BUY[d.id] ? { ...BUY[d.id], whereMet: BUY[d.id].whereMet || '' } : null,
    notes: (d.notes || []).map((n, i): Note => ({ id: `${d.id}-n${i}`, date: isoDaysAgo(n[0], today), type: n[1] as NoteType, text: n[2], priv: !!n[3] })),
    sample: true,
  }));
  const intros: Intro[] = INTROS.map((x, i) => ({ id: `intro-${i}`, buyerId: x.b, sellerId: x.s, date: isoDaysAgo(x.d, today), status: x.st, note: x.n }));
  return { companies, intros };
}
