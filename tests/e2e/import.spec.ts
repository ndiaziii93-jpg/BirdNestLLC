import { test, expect } from '@playwright/test';
import path from 'node:path';

const fx = (f: string) => path.join(__dirname, '..', 'fixtures', f);

test.beforeEach(async ({ request }) => {
  const data = await (await request.get('/api/dataset')).json();
  for (const c of data.companies.filter((x: { sample: boolean }) => !x.sample)) await request.delete(`/api/companies/${c.id}`);
  expect((await request.post('/api/sample')).ok()).toBeTruthy();
});

const openImport = async (page: import('@playwright/test').Page) => {
  await page.goto('/settings');
  await page.locator('.stabs button', { hasText: 'Data' }).click();
  await page.locator('.spanel', { hasText: 'Import' }).locator('button', { hasText: 'Import profiles' }).click();
};

test('imports new companies after review, then updates one without touching its scores', async ({ page }) => {
  await openImport(page);
  await page.locator('#import-files').setInputFiles(fx('import-two.json'));
  await expect(page.locator('.ifile.done')).toContainText('2 companies');
  await page.locator('.afoot .primary', { hasText: 'Review 2 companies' }).click();
  const fov = page.locator('.irow2', { has: page.locator('input.iname[value="Foventa"]') });
  await expect(fov.locator('.itag')).toHaveText('New');
  await fov.locator('.ibtn2').click();
  await fov.locator('.pf', { hasText: 'HQ city' }).locator('input').fill('Cambridge');
  await page.locator('.afoot .primary', { hasText: 'Import 2 companies' }).click();
  await expect(page.locator('#isheet')).toContainText('2 new · 0 updated');
  await page.locator('.afoot .primary', { hasText: 'Done' }).click();

  let data = await (await page.request.get('/api/dataset')).json();
  let foventa = data.companies.find((c: { name: string }) => c.name === 'Foventa');
  expect(foventa.city).toBe('Cambridge');
  expect(foventa.region).toBe('Europe');
  expect(foventa.fit).toBe(60);
  const notesBefore = foventa.notes.length;

  // A later file about the same company updates it instead of adding a second one.
  await openImport(page);
  await page.locator('#import-files').setInputFiles(fx('import-update.json'));
  await page.locator('.afoot .primary', { hasText: 'Review 1 company' }).click();
  await expect(page.locator('.irow2 .itag')).toHaveText('Updates Foventa');
  await page.locator('.afoot .primary', { hasText: 'Import 1 company' }).click();
  await expect(page.locator('#isheet')).toContainText('0 new · 1 updated');

  data = await (await page.request.get('/api/dataset')).json();
  expect(data.companies.filter((c: { name: string }) => c.name.startsWith('Foventa'))).toHaveLength(1);
  foventa = data.companies.find((c: { name: string }) => c.name === 'Foventa');
  expect(foventa.cat).toBe('Phase 2 start · Q3 2027');
  expect(foventa.city).toBe('Cambridge');
  expect(foventa.notes.length).toBe(notesBefore + 2); // update stamp + the new email; the repeated call is skipped
  expect(foventa.notes.map((n: { text: string }) => n.text)).toContain('Received the non-confidential deck.');
});

test('reports unreadable files without blocking the rest', async ({ page }) => {
  await page.goto('/companies');
  await page.locator('.vact button', { hasText: 'Import' }).click();
  await page.locator('#import-files').setInputFiles([fx('notes.xlsx'), fx('import-two.json')]);
  await expect(page.locator('.ifile', { hasText: 'notes.xlsx' })).toContainText("Can't read .xlsx files");
  await expect(page.locator('.ifile', { hasText: 'import-two.json' })).toContainText('2 companies');
  await expect(page.locator('.afoot .primary')).toHaveText('Review 2 companies');
});

test('imports the seven Senju review companies and leaves sample records alone', async ({ page }) => {
  await openImport(page);
  await page.locator('#import-files').setInputFiles(path.join(__dirname, '..', '..', 'docs', 'examples', 'senju-review-7.json'));
  await page.locator('.afoot .primary', { hasText: 'Review 7 companies' }).click();
  await expect(page.locator('.irow2 .itag.new')).toHaveCount(7);
  await page.locator('.afoot .primary', { hasText: 'Import 7 companies' }).click();
  await expect(page.locator('#isheet')).toContainText('7 new · 0 updated');
  const data = await (await page.request.get('/api/dataset')).json();
  const vantage = data.companies.find((c: { name: string }) => c.name === 'Vantage');
  expect(vantage.phase).toBe('Phase 2');
  expect(vantage.phaseLabel).toBe('Phase 2 · Phase 3 starting soon');
  expect(data.companies.find((c: { name: string }) => c.name === 'Sunregen').region).toBe('Europe');
  // "Vantage" did not merge into the sample company "Vantage Therapeutics"
  expect(data.companies.find((c: { name: string }) => c.name === 'Vantage Therapeutics').sample).toBe(true);
});

test('accepts PowerPoint decks and explains a deck it cannot open', async ({ page }) => {
  await openImport(page);
  await page.locator('#import-files').setInputFiles([fx('deck.pptx'), fx('broken.pptx')]);
  // The test server has no Anthropic key: a readable deck gets past the file check and stops at the key.
  await expect(page.locator('.ifile', { hasText: 'deck.pptx' }).first()).toContainText(/ANTHROPIC_API_KEY is not set|compan/);
  await expect(page.locator('.ifile', { hasText: 'broken.pptx' })).toContainText('Could not read the slides');
});

test('a failed save is reported with its reason, not counted, and can be retried', async ({ page }) => {
  // Make the server refuse SeaBeLife once.
  let refused = false;
  await page.route('**/api/companies', async route => {
    const body = route.request().postData() || '';
    if (!refused && body.includes('"name":"SeaBeLife Bio"')) { refused = true; return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'P2028: Transaction already closed' }) }); }
    return route.continue();
  });
  await openImport(page);
  await page.locator('#import-files').setInputFiles(path.join(__dirname, '..', '..', 'docs', 'examples', 'senju-review-7.json'));
  await page.locator('.afoot .primary', { hasText: 'Review 7 companies' }).click();
  await page.locator('.afoot .primary', { hasText: 'Import 7 companies' }).click();
  await expect(page.locator('#isheet h2')).toHaveText('Imported 6 of 7 companies');
  await expect(page.locator('.ifail .ifile')).toContainText('SeaBeLife Bio');
  await expect(page.locator('.ifail .ifile')).toContainText('P2028: Transaction already closed');
  let data = await (await page.request.get('/api/dataset')).json();
  expect(data.companies.some((c: { name: string }) => c.name === 'SeaBeLife Bio')).toBe(false);
  await page.locator('.afoot .sec', { hasText: 'Retry 1 not saved' }).click();
  await expect(page.locator('#isheet h2')).toHaveText('Imported 7 companies');
  data = await (await page.request.get('/api/dataset')).json();
  expect(data.companies.filter((c: { name: string }) => c.name === 'SeaBeLife Bio')).toHaveLength(1);
});

test('the server returns the reason when a save fails', async ({ request }) => {
  const r = await request.post('/api/companies', { data: { id: 'bad-1', name: 'Broken', notes: [{ id: 'n1', date: 'not-a-date', type: 'Note', text: 'x', priv: false }] } });
  expect(r.status()).toBe(500);
  const j = await r.json();
  expect(typeof j.error).toBe('string');
  expect(j.error.length).toBeGreaterThan(5);
});
