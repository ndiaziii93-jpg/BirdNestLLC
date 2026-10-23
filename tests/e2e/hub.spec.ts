import { test, expect, type Page } from '@playwright/test';

// Every test starts from a fresh copy of the sample data.
test.beforeEach(async ({ request }) => {
  expect((await request.post('/api/settings', { data: { key: 'weights', value: [25, 20, 15, 15, 15, 10] } })).ok()).toBeTruthy();
  const data = await (await request.get('/api/dataset')).json();
  for (const c of data.companies.filter((x: { sample: boolean }) => !x.sample)) await request.delete(`/api/companies/${c.id}`);
  expect((await request.post('/api/sample')).ok()).toBeTruthy();
});

const openAccount = async (page: Page, name: string) => {
  await page.goto('/');
  await page.locator('.strip .res', { hasText: name }).first().click();
  await page.locator('#card .primary').click();
  await expect(page.locator('#acsheet')).toBeVisible();
};

test('dashboard shows the sample ranking and filters combine', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.count b')).toHaveText('60');
  const first = page.locator('.strip .res').first();
  await expect(first).toContainText('Eskil Bio');
  await expect(first.locator('.fn')).toHaveText('84');
  await page.locator('.rg', { hasText: 'Europe' }).click();
  await expect(page.locator('.count b')).toHaveText('23');
  await page.locator('#trCol .sw2 button', { hasText: 'Drug' }).click();
  await expect(page.locator('.count b')).toHaveText('20');
  await page.locator('#phaseCol .steps button').nth(1).click(); // Ph 1 start
  await page.locator('#phaseCol .steps button').nth(2).click(); // Ph 2 end
  await expect(page.locator('.count b')).toHaveText('9');
  await page.locator('.sleft button', { hasText: 'Reset' }).click();
  await expect(page.locator('.count b')).toHaveText('60');
});

test('search filters the strip and the map dots', async ({ page }) => {
  await page.goto('/');
  await page.locator('#q').fill('oslo');
  await expect(page.locator('.strip .res')).toHaveCount(2);
  await expect(page.locator('.strip .res').first()).toContainText('Lumen Ocular');
});

test('profile edits persist: score change moves the fit and survives a reload', async ({ page }) => {
  await openAccount(page, 'Lumen Ocular');
  await page.locator('#acsheet .lbtn', { hasText: 'Edit profile' }).click();
  await expect(page.locator('#pring b')).toHaveText('82');
  await page.locator('.sc').nth(2).locator('.segs button', { hasText: '5' }).click(); // De-risking 3 → 5
  await expect(page.locator('#pring b')).toHaveText('88');
  await page.locator('#pnote').fill('Called the CEO about the data room.');
  await page.locator('#pnote').press('Enter');
  await page.locator('#psave').click();
  await expect(page.locator('#psheet')).toBeHidden();
  await page.reload();
  const row = page.locator('.strip .res', { hasText: 'Lumen Ocular' }).first();
  await expect(row.locator('.fn')).toHaveText('88');
  await row.click();
  await expect(page.locator('#card .metrics')).toContainText('Called the CEO about the data room');
});

test('account pop-up shows introductions and matches, and introduce adds one', async ({ page }) => {
  await openAccount(page, 'Aldren Pharma');
  await expect(page.locator('.acst b').first()).toHaveText('2');
  await expect(page.locator('.bk.f .fr').first()).toContainText('Halden Therapeutics');
  await page.locator('.bk.f .fr').first().locator('.ibtn').click();
  await expect(page.locator('.acst b').first()).toHaveText('3');
  await expect(page.locator('.bk.i')).toContainText('Halden Therapeutics');
  await page.locator('.mxbtn').click();
  await expect(page.locator('#mxs')).toBeVisible();
  await expect(page.locator('#mxs .mxr', { hasText: 'Halden Therapeutics' })).toContainText('Introduced');
});

test('one-pager renders A4 and hides private notes', async ({ page }) => {
  await openAccount(page, 'Lumen Ocular');
  await page.locator('#acsheet .gbtn').click();
  const pg = page.locator('#xpage');
  await expect(pg).toBeVisible();
  const box = await pg.evaluate(e => ({ w: e.clientWidth, h: e.clientHeight }));
  expect(box).toEqual({ w: 794, h: 1123 });
  await expect(pg).toContainText('Only XLRS programme');
  await expect(pg).not.toContainText('Banker indicates upfront floor');
  await page.locator('.xseg button', { hasText: 'Letter' }).click();
  expect(await pg.evaluate(e => e.clientWidth)).toBe(816);
  await page.locator('.xtg', { hasText: 'Scorecard' }).click();
  await expect(pg).not.toContainText('FIT SCORECARD');
});

test('partnering board moves a card and logs it', async ({ page }) => {
  await page.goto('/partnering');
  await expect(page.locator('.ppulse b').first()).toHaveText('60');
  await page.locator('.kc', { hasText: 'Eskil Bio' }).click();
  await page.locator('.pdrawer [class="primary"], .pdrawer .primary').first().click();
  await expect(page.locator('.pdrawer .lab b')).toHaveText('Intro call');
  await expect(page.locator('.kcol[data-stage="2"] .kc', { hasText: 'Eskil Bio' })).toBeVisible();
  await expect(page.locator('.pdrawer .pnl')).toContainText('Deal stage moved to Intro call');
});

test('discussions quick add and hide private', async ({ page }) => {
  await page.goto('/discussions');
  await expect(page.locator('.vhead span')).toContainText('127 entries');
  await page.locator('.dadd select').selectOption({ label: 'Sorrel Bio' });
  await page.locator('.dadd input[type=text]').fill('Term sheet draft discussed.');
  await page.locator('.dadd .dpriv').click();
  await page.locator('.dadd .primary').click();
  await expect(page.locator('.vhead span')).toContainText('128 entries');
  await expect(page.locator('.drow', { hasText: 'Term sheet draft discussed.' })).toContainText('Private');
  await page.locator('.vbar .dpriv', { hasText: 'Hide private' }).click();
  await expect(page.locator('.drow', { hasText: 'Term sheet draft discussed.' })).toHaveCount(0);
});

test('settings rebalance weights and apply recomputes every fit', async ({ page }) => {
  await page.goto('/settings');
  const first = page.locator('.wrow input[type=number]').first();
  await first.fill('40');
  await first.press('Enter');
  await expect(first).toHaveValue('40');
  await expect(page.locator('#wtot')).toHaveText('100');
  const boxes = await page.locator('.wrow input[type=number]').evaluateAll(els => els.map(e => +(e as HTMLInputElement).value));
  expect(boxes).toEqual([40, 10, 10, 15, 15, 10]); // raising one weight takes from the largest others, 5 at a time
  const preview = await page.locator('#wprev .prow', { hasText: 'Lumen Ocular' }).locator('.fn').textContent();
  await page.locator('.wtot .primary').click();
  await expect(page.locator('.wmsg')).toContainText('fit recalculated for 60');
  await page.goto('/');
  await page.locator('.strip .res', { hasText: 'Lumen Ocular' }).first().click();
  await expect(page.locator('#card .fring b')).toHaveText(preview!.trim());
  await expect(page.locator('#card .fring b')).toHaveText('86');
});

test('present mode hides editing and private notes', async ({ page }) => {
  await page.goto('/');
  await page.locator('.top .pres').click();
  await expect(page.locator('.top .primary')).toBeHidden();
  await page.goto('/discussions');
  await expect(page.locator('.dadd')).toBeHidden();
  await expect(page.locator('.drow .pv:visible')).toHaveCount(0);
  await page.locator('.top .pres').click();
  await expect(page.locator('.top .primary')).toBeVisible();
});

test('add company manually opens the new profile and saves it', async ({ page }) => {
  await page.goto('/');
  await page.locator('.top .primary').click();
  await page.locator('#asheet input').first().fill('Orchid Retina');
  await page.locator('#asheet .sec', { hasText: 'Skip and fill in manually' }).click();
  await expect(page.locator('#psheet')).toBeVisible();
  await page.locator('#psheet .pgrid input').nth(1).fill('Zurich');
  await page.locator('#psheet .pgrid input').nth(2).fill('Switzerland');
  await page.locator('#psheet .pgrid').nth(1).locator('input').nth(1).fill('Retinitis');
  await page.locator('#psave').click();
  await expect(page.locator('#psheet')).toBeHidden();
  await expect(page.locator('#card .cname')).toHaveText('Orchid Retina');
  await expect(page.locator('#card .cmeta')).toContainText('Zurich, Switzerland');
  await page.goto('/settings');
  await page.locator('.stabs button', { hasText: 'Picklists' }).click();
  await expect(page.locator('.spanel', { hasText: 'Posterior indications' })).toContainText('Retinitis');
});
