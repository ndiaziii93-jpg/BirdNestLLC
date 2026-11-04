import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { pptxToText, xmlToText } from '@/lib/slides';

const fx = (f: string) => fs.readFileSync(path.join(__dirname, '..', 'fixtures', f));

describe('reading PowerPoint decks', () => {
  it('follows the presentation slide order, keeps tables as rows and attaches speaker notes', async () => {
    const text = await pptxToText(fx('deck.pptx'));
    const slides = text.split(/\n\n(?==== Slide)/);
    expect(slides).toHaveLength(3);
    expect(slides[0]).toBe('=== Slide 1 ===\nTitle slide');
    expect(slides[1]).toContain('Company | HQ | Stage');
    expect(slides[1]).toContain('D-Sight | Barcelona & Girona | Phase 1');
    expect(slides[2]).toContain('FOV407 · topical eye drop\nRaising Series A <now>');
    expect(slides[2]).toContain('[Speaker notes]\nMet CFO at AAO; ask about Japan.');
  });

  it('decodes entities and line breaks', () => {
    expect(xmlToText('<a:p><a:r><a:t>R&amp;D &lt;3&gt; &#x2192; done</a:t></a:r><a:br/><a:r><a:t>next</a:t></a:r></a:p>')).toBe('R&D <3> → done\nnext');
  });

  it('rejects a file that is not a deck', async () => {
    await expect(pptxToText(Buffer.from('not a zip'))).rejects.toThrow();
  });
});
