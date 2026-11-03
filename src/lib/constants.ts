// Fixed lists and brand constants shared by the UI, the scoring engine and the sample data.
// Values are copied from the design prototype (design/BirdNest Hub.html) so that the
// production app matches it exactly.

export const MO = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;
export const DEALS = ['Identified', 'First contact', 'Intro call', 'CDA signed', 'Diligence', 'Term sheet', 'Closed'] as const;
export const REGIONS = ['Americas', 'Europe', 'APAC'] as const;
export const DEFAULT_ANT = ['Dry eye', 'Glaucoma/OHT', 'Presbyopia', 'Myopia', 'Keratoconus', 'NK', 'Allergic conj.', 'Demodex', 'Post-op'];
export const DEFAULT_POST = ['nAMD', 'DME', 'GA', 'NPDR/DR', 'RVO', 'IRDs', 'Uveitis'];
export const DRUG_PH = ['Preclinical', 'Phase 1', 'Phase 2', 'Phase 3', 'Phase 4'] as const;
export const DEV_PH = ['Pilot', 'Pivotal', 'Post-market'] as const;
export const TER = ['US', 'EU', 'UK', 'JP', 'CN', 'RoW'] as const;
export const NOTE_TYPES = ['Call', 'Meeting', 'Email', 'Congress', 'Note'] as const;
export const DEFAULT_MET = ['EURETINA', 'ESCRS', 'AAO', 'ARVO', 'BIO', 'Inbound', 'Referral', 'Banker'];
export const OWNERSHIP = ['VC-backed (Series A)', 'VC-backed (Series B)', 'VC-backed (Series C)', 'PE-backed', 'Private', 'Public', 'Subsidiary'];

export const DEC: Record<string, [string, string]> = {
  Pursue: ['#DCE8E6', '#0F4C52'],
  Watch: ['#F0E7D6', '#7A5A26'],
  Pass: ['#EEEBE4', '#5E6368'],
};

export const KIND = {
  seeking: { label: 'Seeking capital', short: 'Seeking capital', fill: '#0F4C52', stroke: '#fff', desc: 'Biotech and medtech raising or partnering' },
  pharma: { label: 'Big Pharma', short: 'Big Pharma', fill: '#1A1D20', stroke: '#fff', desc: 'Large pharma licensing or acquiring' },
  investor: { label: 'Investor', short: 'Investors', fill: '#fff', stroke: '#0F4C52', desc: 'VC funds and investment groups' },
} as const;

// Partnering lens: six criteria. [name, default weight, hint]
export const SC_DEFAULT: [string, number, string][] = [
  ['Strategic fit', 25, 'Indication and segment vs our portfolio'],
  ['Scientific differentiation', 20, 'Modality, route, durability vs comparators'],
  ['De-risking', 15, 'Stage and quality of data'],
  ['Commercial potential', 15, 'Indication size and pricing'],
  ['Deal feasibility', 15, 'Deal stage, rights open, runway'],
  ['Team and execution', 10, 'Ownership, last raise, track record'],
];
export const DEF_W = [25, 20, 15, 15, 15, 10];

// Services client lens: five criteria.
export const SVC_DEFAULT: [string, number, string][] = [
  ['Funding certainty', 25, 'Cash, runway and committed budget'],
  ['Scope fit', 25, 'Match to our CRO, CMC or regulatory services'],
  ['Timeline', 20, 'When work would start'],
  ['Relationship strength', 15, 'Warmth and access to decision-makers'],
  ['Strategic value', 15, 'Reference value and follow-on work'],
];
export const DEF_SVC_W = [25, 25, 20, 15, 15];

export const FSN = ['STRATEGIC', 'SCIENCE', 'DE-RISKING', 'COMMERCIAL', 'FEASIBILITY', 'TEAM'];
export const SVC_FSN = ['FUNDING', 'SCOPE', 'TIMELINE', 'RELATIONSHIP', 'STRATEGIC'];

// One-pager pipeline stage ladder (10 steps)
export const STG10 = ['Discovery', 'Preclinical', 'IND-enabling', 'Phase 1', 'Phase 1/2', 'Phase 2', 'Phase 2b/3', 'Phase 3', 'NDA/BLA filed', 'Approved'];
export const STG10_TICKS = ['DISC', 'PRE', 'IND-E', 'PH1', 'PH1/2', 'PH2', 'PH2B/3', 'PH3', 'FILED', 'APPR'];

// Account matching
export const STG5 = ['Preclin.', 'Ph 1', 'Ph 2', 'Ph 3', 'Ph 4 · approved'];
export const MODS = ['AAV / gene therapy', 'Implant / sustained release', 'Biologic', 'Small molecule', 'Peptide', 'Oligonucleotide', 'Device'];
export const MODK: Record<string, string[]> = {
  'AAV / gene therapy': ['aav', 'gene'],
  'Implant / sustained release': ['implant', 'sustained', 'insert', 'reservoir'],
  Biologic: ['biologic', 'biosimilar', 'complement'],
  'Small molecule': ['small molecule', 'small-molecule', 'oral', 'atropine', 'drop', 'tki'],
  Peptide: ['peptide'],
  Oligonucleotide: ['oligo'],
  Device: ['stent', 'lens', 'iol', 'system', 'device', 'screening', 'photobiomodulation', 'cross-linking', 'migs'],
};
export const DEALS_W = ['In-license', 'Co-development', 'Option-to-acquire', 'M&A', 'Regional rights'];
export const INTRO_STATUSES = ['Introduced', 'Intro call held', 'CDA signed', 'Diligence', 'Term sheet', 'Declined'] as const;
export const STC: Record<string, string> = { Introduced: 'p-new', 'Intro call held': 'p-int', 'CDA signed': 'p-cda', Diligence: 'p-cda', 'Term sheet': 'p-cda', Declined: 'p-dec' };
export const CDA_PLUS = ['CDA signed', 'Diligence', 'Term sheet'];

export const PH_DRUG_C = ['#CFE0DF', '#9DBFC0', '#5E9396', '#2F6E73', '#0F4C52'];
export const PH_DEV_C = ['#D9D4C8', '#9A9790', '#4A4E52'];

export const BBOX: Record<string, [[number, number], [number, number]]> = {
  All: [[-165, -50], [175, 72]],
  Americas: [[-160, -48], [-30, 62]],
  Europe: [[-14, 35], [32, 66]],
  APAC: [[68, -44], [156, 48]],
};
export const GBB: Record<string, [[number, number], [number, number]]> = {
  Americas: [[-165, -56], [-30, 72]],
  Europe: [[-25, 34], [45, 71]],
  APAC: [[60, -47], [180, 55]],
};

export const BRAND = { owner: 'NDIII', name: 'BirdNest' };
