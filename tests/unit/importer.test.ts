import { describe, expect, it } from 'vitest';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { applyDraft, blankDraft, findMatch, ImportResult, newIndications, normalizePhase, normName, parseImportJson, type Draft } from '@/lib/importer';
import { Research } from '@/lib/claude';
import { buildSample } from '@/lib/sample';
import { DEFAULT_ANT, DEFAULT_MET, DEFAULT_POST, DEF_SVC_W, DEF_W } from '@/lib/constants';

const settings = { weights: [...DEF_W], svcWeights: [...DEF_SVC_W], post: [...DEFAULT_POST], ant: [...DEFAULT_ANT], met: [...DEFAULT_MET] };
let n = 0;
const ctx = { settings, today: '2026-11-04', uid: () => 'id' + ++n, lonLat: [10, 59] as [number, number] };
const sample = buildSample('2026-11-04').companies;
// Treat the sample set as the owner's own records for matching and merging tests.
const companies = sample.map(c => ({ ...c, sample: false }));

describe('reading JSON import files', () => {
  it('accepts a companies list, a bare array or one object, with only name required', () => {
    expect(parseImportJson('{"companies":[{"name":"Foventa"},{"name":"Vantage"}]}').companies.map(c => c.name)).toEqual(['Foventa', 'Vantage']);
    expect(parseImportJson('[{"name":"Foventa"}]').companies).toHaveLength(1);
    const one = parseImportJson('{"name":"Arctic Bio","country":"Norway"}').companies[0];
    expect(one.country).toBe('Norway');
    expect(one.diffs).toEqual([]);
    expect(one.kind).toBe('seeking');
  });
  it('reports bad records by name and keeps the good ones', () => {
    const r = parseImportJson('[{"name":"Good"},{"name":"Bad","kind":"hedge fund"}]');
    expect(r.companies.map(c => c.name)).toEqual(['Good']);
    expect(r.errors[0]).toMatch(/^Bad: kind/);
  });
  it('rejects text that is not JSON', () => {
    expect(parseImportJson('not json').errors[0]).toMatch(/Not valid JSON/);
  });
});

describe('matching to existing companies', () => {
  it('matches by name ignoring legal and sector suffixes', () => {
    expect(normName('Lumen Ocular AS')).toBe(normName('Lumen'));
    expect(findMatch(companies, { name: 'lumen ocular', website: null })?.id).toBe('s0');
    expect(findMatch(companies, { name: 'Aldren Pharma AG', website: null })?.id).toBe('k0');
  });
  it('prefers the website host when given', () => {
    expect(findMatch(companies, { name: 'Different Name', website: 'https://www.lumenocular.com/team' })?.id).toBe('s0');
  });
  it('never matches sample records', () => {
    expect(findMatch(sample, { name: 'Lumen Ocular', website: 'lumenocular.com' })).toBeNull();
    expect(findMatch(sample, { name: 'Vantage', website: null })).toBeNull();
    expect(findMatch(companies, { name: 'Vantage', website: null })?.name).toBe('Vantage Therapeutics');
  });
  it('returns null for a new company', () => {
    expect(findMatch(companies, { name: 'Foventa', website: 'foventa.co.uk' })).toBeNull();
  });
});

describe('phase wording', () => {
  it('maps written stages onto the ladder and keeps the wording as the label', () => {
    expect(normalizePhase('Drug', 'Phase 2b')).toEqual({ phase: 'Phase 2', label: 'Phase 2b' });
    expect(normalizePhase('Drug', 'Phase III ready')).toEqual({ phase: 'Phase 3', label: 'Phase III ready' });
    expect(normalizePhase('Drug', 'IND-enabling')).toEqual({ phase: 'Preclinical', label: 'IND-enabling' });
    expect(normalizePhase('Drug', 'Phase 1/2')?.phase).toBe('Phase 1');
    expect(normalizePhase('Drug', 'phase ii')?.phase).toBe('Phase 2');
    expect(normalizePhase('Device', 'CE marked')?.phase).toBe('Post-market');
    expect(normalizePhase('Drug', null)).toBeNull();
  });
});

describe('applying an imported profile', () => {
  const d: Draft = { ...blankDraft('Foventa'), country: 'United Kingdom', city: 'London', ind: 'NPDR/DR', asset: 'FV-1 · NPDR · topical drop', phase: 'Phase 1', cat: 'Phase 2 start · Q2 2027', dealStage: 'First contact', overview: 'UK eye-drop company.', notes: [{ date: '2026-10-30', type: 'Call', text: 'Intro call with CEO.', private: false }, { date: null, type: 'Note', text: 'Banker hint on valuation.', private: true }] };

  it('creates a new company with defaults, notes and a map position', () => {
    const c = applyDraft(null, d, ctx);
    expect(c.name).toBe('Foventa');
    expect(c.region).toBe('Europe');
    expect(c.seg).toBe('Posterior');
    expect(c.deal).toBe(1);
    expect(c.fit).toBe(60);
    expect(c.dec).toBe('Watch');
    expect(c.lat).toBeGreaterThan(57);
    expect(c.ai?.overview).toBe('UK eye-drop company.');
    expect(c.notes.map(x => x.text)).toEqual(['Added to BirdNest from an imported document.', 'Intro call with CEO.', 'Banker hint on valuation.']);
    expect(c.notes[2].priv).toBe(true);
    expect(c.notes[2].date).toBe('2026-11-04');
  });

  it('updates only stated fields on an existing company and keeps its scores and notes', () => {
    const lumen = companies.find(c => c.id === 's0')!;
    const banker = lumen.notes.find(x => x.text.startsWith('Banker'))!;
    const upd = applyDraft(lumen, { ...blankDraft('Lumen Ocular'), cat: 'Pivotal start · Q3 2027', notes: [{ date: banker.date, type: 'Note', text: banker.text, private: true }, { date: '2026-11-01', type: 'Meeting', text: 'Met at AAO.', private: false }] }, ctx);
    expect(upd.id).toBe('s0');
    expect(upd.cat).toBe('Pivotal start · Q3 2027');
    expect(upd.asset).toBe(lumen.asset);
    expect(upd.scores).toEqual(lumen.scores);
    expect(upd.fit).toBe(lumen.fit);
    expect(upd.dec).toBe(lumen.dec);
    expect(upd.ai?.contacts).toEqual(lumen.ai?.contacts);
    // the banker note already exists on that date, so only the AAO meeting and the update stamp are added
    expect(upd.notes.length).toBe(lumen.notes.length + 2);
    expect(upd.notes.some(x => x.text === 'Met at AAO.')).toBe(true);
  });

  it('fills a buy box for pharma and investors', () => {
    const c = applyDraft(null, { ...blankDraft('Senju'), kind: 'pharma', country: 'Japan', buyBox: { inds: ['Dry eye'], mods: ['Small molecule'], stStart: 2, stEnd: 9, geo: ['JP', 'XX'], deals: ['Regional rights'], excl: [], money: [{ label: 'Upfront', value: '$10–40M' }], contact: 'BD lead' } }, ctx);
    expect(c.region).toBe('APAC');
    expect(c.phaseLabel).toBe('—');
    expect(c.buyBox?.st).toEqual([2, 4]);
    expect(c.buyBox?.geo).toEqual(['JP']);
    expect(c.buyBox?.money).toEqual([['Upfront', '$10–40M']]);
  });

  it('lists indications that need to join a picklist', () => {
    expect(newIndications([{ ...blankDraft('A'), ind: 'Retinitis pigmentosa' }, { ...blankDraft('B'), ind: 'nAMD' }, { ...blankDraft('C'), ind: 'Pterygium', seg: 'Anterior' }], settings)).toEqual({ post: ['Retinitis pigmentosa'], ant: ['Pterygium'] });
  });
});

describe('structured-output schemas', () => {
  // Claude's structured outputs need closed objects: every object lists its keys and allows no others.
  const closed = (s: unknown): boolean => {
    if (!s || typeof s !== 'object') return true;
    const o = s as Record<string, unknown>;
    if (o.type === 'object' && o.additionalProperties !== false) return false;
    return Object.values(o).every(v => (Array.isArray(v) ? v.every(closed) : closed(v)));
  };
  it('import and research schemas only use closed objects', () => {
    expect(closed(zodOutputFormat(ImportResult).schema)).toBe(true);
    expect(closed(zodOutputFormat(Research).schema)).toBe(true);
  });
});
