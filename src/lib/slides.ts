// Reads the text of a PowerPoint (.pptx) deck: every slide in order, with tables kept as rows
// and speaker notes attached to their slide. A .pptx is a zip of XML parts, so no Office install is needed.
import JSZip from 'jszip';

const decode = (s: string) => s
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
  .replace(/&amp;/g, '&');

/** Text of one slide or notes part: paragraphs on their own lines, table cells joined with " | ". */
export function xmlToText(xml: string): string {
  let out = '';
  const re = /<a:t(?:\s[^>]*)?>([^<]*)<\/a:t>|<a:br\s*\/>|<\/a:p>|<\/a:tc>|<\/a:tr>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    const tok = m[0];
    if (m[1] !== undefined) out += decode(m[1]);
    else if (tok.startsWith('<a:br')) out += '\n';
    else if (tok === '</a:p>') out += '\n';
    else if (tok === '</a:tc>') out = out.replace(/\n+$/, '') + ' | ';
    else if (tok === '</a:tr>') out = out.replace(/ \| $/, '') + '\n';
  }
  return out.split('\n').map(l => l.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n');
}

const slideNo = (p: string) => +(/slide(\d+)\.xml$/.exec(p)?.[1] || 0);

/** Plain text of the whole deck, slide by slide. Throws when the file is not a PowerPoint deck. */
export async function pptxToText(buf: Buffer | Uint8Array | ArrayBuffer): Promise<string> {
  const zip = await JSZip.loadAsync(buf);
  // Slide order comes from the presentation's slide list; fall back to file numbering.
  const slides = Object.keys(zip.files).filter(p => /^ppt\/slides\/slide\d+\.xml$/.test(p));
  if (!slides.length) throw new Error('No slides found. Is this a .pptx file?');
  let order = slides.sort((a, b) => slideNo(a) - slideNo(b));
  const pres = await zip.file('ppt/presentation.xml')?.async('string');
  const presRels = await zip.file('ppt/_rels/presentation.xml.rels')?.async('string');
  if (pres && presRels) {
    const target = new Map([...presRels.matchAll(/<Relationship\b[^>]*\bId="([^"]+)"[^>]*\bTarget="([^"]+)"/g)].map(r => [r[1], 'ppt/' + r[2].replace(/^\.?\/?/, '')]));
    const listed = [...pres.matchAll(/<p:sldId\b[^>]*\br:id="([^"]+)"/g)].map(r => target.get(r[1])).filter((p): p is string => !!p && slides.includes(p));
    if (listed.length) order = listed;
  }
  const parts: string[] = [];
  for (let i = 0; i < order.length; i++) {
    const path = order[i];
    const text = xmlToText((await zip.file(path)!.async('string')));
    let notes = '';
    const rels = await zip.file(path.replace('slides/', 'slides/_rels/') + '.rels')?.async('string');
    const n = rels && /Target="\.\.\/notesSlides\/(notesSlide\d+\.xml)"/.exec(rels);
    if (n) {
      const nx = await zip.file('ppt/notesSlides/' + n[1])?.async('string');
      // Drop the slide-number placeholder that every notes page carries.
      if (nx) notes = xmlToText(nx).split('\n').filter(l => !/^\d+$/.test(l)).join('\n');
    }
    parts.push(`=== Slide ${i + 1} ===\n${text}${notes ? `\n[Speaker notes]\n${notes}` : ''}`);
  }
  return parts.join('\n\n');
}
