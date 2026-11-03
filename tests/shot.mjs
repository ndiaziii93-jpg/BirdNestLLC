// Quick screenshot helper for manual visual checks: node tests/shot.mjs <path> <out.png> [width]
import { chromium } from '@playwright/test';

const [, , path = '/', out = 'shot.png', width = '1440', height = '1200'] = process.argv;
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: +width, height: +height }, deviceScaleFactor: 1 });
page.on('console', m => { if (m.type() === 'error') console.log('console.error:', m.text()); });
page.on('pageerror', e => console.log('pageerror:', e.message));
await page.goto('http://localhost:3000' + path, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log('saved', out);
