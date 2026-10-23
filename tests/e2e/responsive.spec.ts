import { test, expect } from '@playwright/test';

test.beforeEach(async ({ request }) => { expect((await request.post('/api/sample')).ok()).toBeTruthy(); });

for (const path of ['/', '/companies', '/partnering', '/discussions', '/settings']) {
  test(`no horizontal page scroll on ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForTimeout(500);
    const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: window.innerWidth }));
    expect(sw).toBeLessThanOrEqual(vw + 1);
  });
}

test('pop-ups fill the phone screen and can be closed', async ({ page }) => {
  await page.goto('/');
  await page.locator('.strip .res').first().click();
  await page.locator('#card .primary').click();
  await expect(page.locator('#acsheet')).toBeVisible();
  const w = await page.locator('#acsheet').evaluate(e => e.getBoundingClientRect().width);
  expect(Math.round(w)).toBe(await page.evaluate(() => window.innerWidth));
  await page.locator('#acsheet .x').click();
  await expect(page.locator('#acsheet')).toHaveCount(0);
});
