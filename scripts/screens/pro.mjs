// Loads a save written by pro-save.ts into the web build and screenshots the pro screens.
//   node scripts/screens/pro.mjs <save.json> <outDir> [baseUrl] [tag]
import { mkdirSync, readFileSync } from 'node:fs';

import { chromium } from '@playwright/test';

const [file, out = 'docs/screens/pro', base = 'http://localhost:8081', tag = 'pro'] =
  process.argv.slice(2);
mkdirSync(out, { recursive: true });
const save = JSON.parse(readFileSync(file, 'utf8'));
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const id = (x) => page.getByTestId(x);
const visible = (loc) => loc.isVisible().catch(() => false);
const shot = async (name) => {
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${out}/${tag}-${name}.png` });
};

await page.goto(base, { waitUntil: 'networkidle' });
await page.evaluate(
  async ({ summary, body }) => {
    const db = await new Promise((resolve, reject) => {
      const req = indexedDB.open('before-the-buzzer', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('saves', { keyPath: 'id' });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    await new Promise((resolve, reject) => {
      const tx = db.transaction('saves', 'readwrite');
      tx.objectStore('saves').put({ id: summary.id, summary, body, backup: null });
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    const raw = localStorage.getItem('settings.v1');
    const settings = raw ? JSON.parse(raw) : {};
    localStorage.setItem('settings.v1', JSON.stringify({ ...settings, lastCareer: summary.id }));
  },
  { summary: save.summary, body: save.body },
);
await page.goto(base, { waitUntil: 'networkidle' });
await page
  .locator('[data-testid="decide"]:visible, [data-testid="home"]:visible')
  .first()
  .waitFor({ timeout: 120000 });
await shot('01-open');
if (await visible(id('decide'))) {
  await shot('02-decision');
  await page.mouse.wheel(0, 700);
  await shot('03-decision-more');
}
if (await visible(id('home'))) {
  for (const tab of ['career', 'train', 'team']) {
    await id(`tab-${tab}`).click();
    await shot(`10-${tab}`);
  }
  await id('tab-home').click();
  await id('next-week').click();
  if (await visible(id('tip-off'))) {
    await shot('20-pregame');
    await id('tip-off').click();
    await page.waitForTimeout(8000);
    await shot('21-live');
    for (let g = 0; g < 400 && !(await visible(id('live-final'))); g++) {
      const opt = page
        .locator('[data-testid^="moment-"]:not([data-testid="moment-continue"])')
        .first();
      if (await visible(opt)) {
        await shot('22-moment');
        await opt.click();
        if (await visible(id('skill-check'))) {
          await shot('23-skill');
          await id('skill-release').click();
        }
        await page.waitForTimeout(1200);
        await id('moment-continue').click();
      } else if (await visible(id('live-skip'))) await id('live-skip').click();
      await page.waitForTimeout(200);
    }
    await shot('24-final');
  }
}
console.log(tag, 'errors', errors.length, errors.slice(0, 3));
await browser.close();
