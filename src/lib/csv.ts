import { dealName, lastTouch, rightsOpen } from './derive';
import type { Company } from './types';

const q = (v: unknown) => '"' + String(v ?? '').replace(/"/g, '""') + '"';

export function companiesCsv(rows: Company[], today?: string): string {
  return [
    ['Company', 'HQ', 'Country', 'Region', 'Category', 'Type', 'Segment', 'Lead asset', 'Indication', 'Phase', 'Deal stage', 'Decision', 'Fit', 'Rights open', 'Last touch (d)', 'Next catalyst'].join(','),
    ...rows.map(d => [d.name, d.city, d.cdisp, d.region, d.kind, d.type, d.seg, d.asset, d.ind, d.phaseLabel, dealName(d), d.dec, d.fit, rightsOpen(d) + '/6', lastTouch(d, today), d.cat].map(q).join(',')),
  ].join('\n');
}

export function downloadText(text: string, name: string, type = 'text/csv') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
