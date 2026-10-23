// Map the country names people type (and Claude returns) to the names in the world atlas,
// and give each a region so new companies land in the right place on the map.
import type { Region } from './types';

const ALIAS: Record<string, string> = {
  usa: 'United States of America', us: 'United States of America', 'united states': 'United States of America', 'u.s.': 'United States of America', 'u.s.a.': 'United States of America',
  uk: 'United Kingdom', 'u.k.': 'United Kingdom', britain: 'United Kingdom', 'great britain': 'United Kingdom', england: 'United Kingdom', scotland: 'United Kingdom',
  'south korea': 'South Korea', korea: 'South Korea', 'republic of korea': 'South Korea',
  'czech republic': 'Czechia', russia: 'Russia', 'the netherlands': 'Netherlands', holland: 'Netherlands', taiwan: 'Taiwan', 'hong kong': 'China', prc: 'China', 'people\'s republic of china': 'China',
  uae: 'United Arab Emirates', 'viet nam': 'Vietnam',
};

export function atlasName(input: string): string {
  const k = (input || '').trim().toLowerCase();
  return ALIAS[k] || (input || '').trim();
}

const EUROPE = ['United Kingdom', 'Ireland', 'France', 'Germany', 'Spain', 'Portugal', 'Italy', 'Switzerland', 'Austria', 'Belgium', 'Netherlands', 'Luxembourg', 'Denmark', 'Norway', 'Sweden', 'Finland', 'Iceland', 'Poland', 'Czechia', 'Slovakia', 'Hungary', 'Romania', 'Bulgaria', 'Greece', 'Croatia', 'Slovenia', 'Serbia', 'Estonia', 'Latvia', 'Lithuania', 'Ukraine', 'Russia', 'Turkey', 'Israel', 'Cyprus', 'Malta', 'Belarus', 'Moldova', 'Bosnia and Herz.', 'North Macedonia', 'Albania', 'Montenegro', 'Kosovo'];
const APAC = ['Japan', 'China', 'South Korea', 'Taiwan', 'Singapore', 'Australia', 'New Zealand', 'India', 'Indonesia', 'Malaysia', 'Thailand', 'Vietnam', 'Philippines', 'Pakistan', 'Bangladesh', 'Sri Lanka', 'Hong Kong', 'Mongolia', 'Kazakhstan', 'Uzbekistan', 'Nepal', 'Cambodia', 'Laos', 'Myanmar', 'North Korea'];

export function regionFor(country: string): Region {
  const c = atlasName(country);
  if (EUROPE.includes(c)) return 'Europe';
  if (APAC.includes(c)) return 'APAC';
  return 'Americas';
}
