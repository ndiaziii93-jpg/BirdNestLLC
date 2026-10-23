// Opens each pop-up and screenshots it: node tests/walk.mjs <outdir> [width] [height]
import { chromium } from '@playwright/test';

const [, , out = '.', width = '1440', height = '1000'] = process.argv;
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: +width, height: +height } });
page.on('pageerror', e => console.log('pageerror:', e.message));
page.on('console', m => { if (m.type() === 'error') console.log('console.error:', m.text().slice(0, 200)); });
const shot = async (n) => { await page.waitForTimeout(600); await page.screenshot({ path: `${out}/walk-${n}.png` }); console.log('saved', n); };
await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
// Select Lumen Ocular from the strip and open the account pop-up
await page.locator('.strip .res', { hasText: 'Lumen Ocular' }).first().click();
await page.locator('#card .primary').click();
await shot('account-seeking');
await page.locator('[data-mx], .mxbtn').first().click();
await shot('matrix');
await page.keyboard.press('Escape');
await page.locator('#acsheet .lbtn', { hasText: 'Edit profile' }).click();
await shot('profile');
await page.keyboard.press('Escape');
await page.locator('.strip .res', { hasText: 'Aldren Pharma' }).first().click();
await page.locator('#card .primary').click();
await shot('account-pharma');
await page.locator('#acsheet .gbtn').click();
await shot('export');
await page.keyboard.press('Escape');
await page.locator('.sleft button', { hasText: 'Full list' }).click();
await shot('list');
await page.keyboard.press('Escape');
await page.locator('.top .primary').click();
await shot('add');
await page.keyboard.press('Escape');
// Filters: region + type + phase
await page.locator('.rg', { hasText: 'Europe' }).click();
await page.locator('#trCol [data-ty="Drug"], #trCol .sw2 button', { hasText: 'Drug' }).first().click();
await page.waitForTimeout(900);
await shot('filtered');
await browser.close();
