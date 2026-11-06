import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const fx = (f: string) => path.join(__dirname, '..', 'fixtures', f);
const PNG = 'data:image/png;base64,' + fs.readFileSync(fx('logo-main.png')).toString('base64');

test.beforeEach(async ({ request }) => {
  const data = await (await request.get('/api/dataset')).json();
  for (const c of data.companies.filter((x: { sample: boolean }) => !x.sample)) await request.delete(`/api/companies/${c.id}`);
  expect((await request.post('/api/sample')).ok()).toBeTruthy();
});

/** Stands in for the server's website lookup: each company gets a logo; after a rejection, the next image. */
async function fakeFinder(page: Page) {
  const calls: { name: string; exclude: string[] }[] = [];
  await page.route('**/api/logo/find', async route => {
    const b = JSON.parse(route.request().postData() || '{}');
    calls.push({ name: b.name, exclude: b.exclude || [] });
    const n = (b.exclude || []).length;
    await route.fulfill({ json: { ok: true, logo: PNG, origin: `https://${b.name.toLowerCase().replace(/\W/g, '')}.test/logo-${n}.png`, website: `https://${b.name.toLowerCase().replace(/\W/g, '')}.test/`, method: 'claude', confidence: 'high', reason: 'Header logo' } });
  });
  return calls;
}
const dataset = async (page: Page) => (await page.request.get('/api/dataset')).json();
const byName = (d: { companies: { name: string }[] }, n: string) => d.companies.find(c => c.name === n) as unknown as { logo: string | null; logoSource: string | null; logoOrigin: string | null; logoRejected: string[]; website: string };

test('import finds a logo for each new company; Right confirms, Wrong tries another', async ({ page }) => {
  const calls = await fakeFinder(page);
  await page.goto('/settings');
  await page.locator('.stabs button', { hasText: 'Data' }).click();
  await page.locator('.spanel', { hasText: 'Import' }).locator('button', { hasText: 'Import profiles' }).click();
  await page.locator('#import-files').setInputFiles(fx('import-two.json'));
  await page.locator('.afoot .primary', { hasText: 'Review 2 companies' }).click();
  await page.locator('.afoot .primary', { hasText: 'Import 2 companies' }).click();
  await expect(page.locator('#isheet')).toContainText('Logos found for 2 of 2');
  expect(calls.map(c => c.name).sort()).toEqual(['Arctic Bio', 'Foventa']);

  let d = await dataset(page);
  expect(byName(d, 'Foventa')).toMatchObject({ logoSource: 'auto', logoOrigin: 'https://foventa.test/logo-0.png', website: 'foventa.test' });

  // Right
  await page.locator('.ifile', { hasText: 'Foventa' }).click();
  await expect(page.locator('#acsheet .lchk')).toContainText('Logo found by Claude');
  await page.locator('#acsheet .lchk button', { hasText: 'Right' }).click();
  await expect(page.locator('#acsheet .lchk')).toHaveCount(0);
  d = await dataset(page);
  expect(byName(d, 'Foventa').logoSource).toBe('confirmed');

  // Wrong
  await page.keyboard.press('Escape');
  await page.goto('/companies');
  await page.locator('.crow', { hasText: 'Arctic Bio' }).click();
  await page.locator('#acsheet .lchk button', { hasText: 'Wrong' }).click();
  await expect(page.locator('#acsheet .lchk em')).toContainText('Found on arcticbio.test');
  d = await dataset(page);
  const arctic = byName(d, 'Arctic Bio');
  expect(arctic.logoRejected).toEqual(['https://arcticbio.test/logo-0.png']);
  expect(arctic.logoOrigin).toBe('https://arcticbio.test/logo-1.png');
  expect(arctic.logoSource).toBe('auto');
  expect(calls.at(-1)).toEqual({ name: 'Arctic Bio', exclude: ['https://arcticbio.test/logo-0.png'] });
});

test('Settings finds every missing logo and lists them for checking; sample companies are skipped', async ({ page }) => {
  // Add two companies with no logo, without the finder running.
  await page.route('**/api/logo/find', route => route.fulfill({ json: { ok: false, website: null, reason: 'held for the test' } }));
  await page.goto('/settings');
  await page.locator('.stabs button', { hasText: 'Data' }).click();
  await page.locator('.spanel', { hasText: 'Import' }).locator('button', { hasText: 'Import profiles' }).click();
  await page.locator('#import-files').setInputFiles(fx('import-two.json'));
  await page.locator('.afoot .primary', { hasText: 'Review 2 companies' }).click();
  await page.locator('.afoot .primary', { hasText: 'Import 2 companies' }).click();
  await expect(page.locator('#isheet')).toContainText('Logos found for 0 of 2');
  await page.locator('.afoot .primary', { hasText: 'Done' }).click();
  await page.unroute('**/api/logo/find');

  const calls = await fakeFinder(page);
  const panel = page.locator('.lpanel');
  await expect(panel.locator('.lsum')).toContainText('2 without a logo');
  await panel.locator('button', { hasText: 'Find 2 missing logos' }).click();
  await expect(panel.locator('.wmsg')).toContainText('Found 2 of 2');
  await expect(panel.locator('.lsum')).toContainText('2 to check');
  expect(calls).toHaveLength(2);
  await panel.locator('.lrow', { hasText: 'Foventa' }).locator('button', { hasText: 'Right' }).click();
  await expect(panel.locator('.lsum')).toContainText('1 to check');
});
