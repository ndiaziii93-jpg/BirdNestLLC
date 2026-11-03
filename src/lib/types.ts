export type Kind = 'seeking' | 'pharma' | 'investor';
export type Region = 'Americas' | 'Europe' | 'APAC';
export type CoType = 'Drug' | 'Device';
export type Seg = 'Anterior' | 'Posterior';
export type Decision = 'Pursue' | 'Watch' | 'Pass';
export type NoteType = 'Call' | 'Meeting' | 'Email' | 'Congress' | 'Note';
export type Lens = 'partnering' | 'services';
export type IntroStatus = 'Introduced' | 'Intro call held' | 'CDA signed' | 'Diligence' | 'Term sheet' | 'Declined';

export interface Note {
  id: string;
  date: string; // ISO date, yyyy-mm-dd
  type: NoteType;
  text: string;
  priv: boolean;
}

/** Narrative content, drafted by Claude or typed by the owner. Printed on the one-pager. */
export interface AiProfile {
  overview: string;
  diffs: string[];
  risk: string;
  seeking: string;
  timing: string;
  /** [code, description, stage index 0–9, catalyst] */
  pipe: [string, string, number, string][];
  econ: [string, string][];
  contacts: [string, string][];
  rel: [string, string][];
}

/** What a Big Pharma buyer or investor is looking for. */
export interface BuyBox {
  inds: string[];
  mods: string[];
  st: [number, number]; // stage window, indices into STG5
  geo: string[]; // territories wanted (pharma only)
  deals: string[]; // deal structures (pharma only)
  excl: string[];
  money: [string, string][];
  contact: string;
  whereMet: string;
}

export interface Company {
  id: string;
  kind: Kind;
  name: string;
  website: string;
  city: string;
  cdisp: string; // country as displayed
  country: string; // country name as in the world atlas
  region: Region;
  lat: number;
  lon: number;
  type: CoType;
  seg: Seg;
  ind: string;
  asset: string;
  phase: string;
  phaseLabel: string;
  trend: number;
  dec: Decision;
  deal: number; // -1 parked, 0..6 DEALS index
  cat: string; // next catalyst "Event · Qn YYYY"
  runway: number | null; // months
  runwayAsOf: string | null; // ISO date
  raise: string;
  rightsArr: boolean[]; // 6 territories, true = open
  own: string;
  founded: string;
  heads: string;
  rationale: string;
  scores: number[]; // 6 partnering scores 1–5
  why: string[]; // 6 justifications
  svcScores: number[]; // 5 services scores 1–5
  svcWhy: string[];
  prevFit: number;
  fit: number;
  logo: string | null;
  appetite: string; // pharma: deal appetite · investor: check size
  scale: string; // pharma: revenue · investor: stage focus
  lens: Lens;
  ai: AiProfile | null;
  buyBox: BuyBox | null;
  notes: Note[];
  sample: boolean;
}

export interface Intro {
  id: string;
  buyerId: string;
  sellerId: string;
  date: string; // ISO date
  status: IntroStatus;
  note: string;
}

export interface Settings {
  weights: number[]; // partnering, 6, total 100
  svcWeights: number[]; // services, 5, total 100
  post: string[];
  ant: string[];
  met: string[];
}

export interface Dataset {
  companies: Company[];
  intros: Intro[];
  settings: Settings;
}
