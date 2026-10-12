// Creates a career in the web build and plays its first game on the live screen.
//   node scripts/screens/live.mjs [baseUrl] [outDir] [scheme]
import { mkdirSync } from 'node:fs';

import { chromium } from '@playwright/test';

const [base = 'http://localhost:8081', out = 'docs/screens/live', scheme = 'light'] =
  process.argv.slice(2);
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  colorScheme: scheme,
});
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});
const id = (x) => page.getByTestId(x);
const visible = (loc) => loc.isVisible().catch(() => false);
const shot = async (name) => {
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${out}/${name}-${scheme}.png` });
};

await page.goto(base, { waitUntil: 'networkidle' });
await id('new-career').first().click();
await id('given').fill('Nika');
await id('family').fill('Beridze');
for (let i = 0; i < 6; i++) await id('create-next').click();
await id('home').waitFor({ timeout: 120000 });
await shot('01-home');

// Play games until one stops for a key moment, answering any other decision on the way.
let moments = 0;
for (let game = 0; game < 4 && moments < 1; game++) {
  for (let guard = 0; guard < 20; guard++) {
    if (await visible(id('decide'))) {
      const opt = page.locator('[data-testid^="choice-"], [data-testid^="offer-"]').first();
      if (await visible(opt)) await opt.click();
      await page.waitForTimeout(400);
      if (await visible(id('decide-continue'))) await id('decide-continue').click();
      await page.waitForTimeout(600);
      continue;
    }
    if (await visible(id('tip-off'))) break;
    await id('next-week').click();
    await page.waitForTimeout(1500);
  }
  await id('tip-off').waitFor({ timeout: 60000 });
  await shot(`02-pregame-${game}`);
  await id('approach-score').click();
  await id('tip-off').click();
  await page
    .locator('[data-testid="live-board"], [data-testid^="moment-"]')
    .first()
    .waitFor({ timeout: 60000 });
  await page.waitForTimeout(9000);
  await shot(`03-watching-${game}`);
  await page.mouse.wheel(0, 700);
  await page.waitForTimeout(500);
  await shot(`03b-watching-lineups-${game}`);
  await page.mouse.wheel(0, -700);
  for (let guard = 0; guard < 400; guard++) {
    if (await visible(id('live-final'))) break;
    const option = page.locator('[data-testid^="moment-"]').first();
    if (await visible(option)) {
      moments++;
      await shot(`04-moment-${game}`);
      await option.click();
      if (await visible(id('skill-check'))) {
        await page.waitForTimeout(300);
        await shot(`04b-skill-${game}`);
        await id('skill-release').click();
      }
      await page.waitForTimeout(1500);
      await shot(`05-moment-result-${game}`);
      await id('moment-continue').click();
      continue;
    }
    if (await visible(id('live-skip'))) await id('live-skip').click();
    await page.waitForTimeout(300);
  }
  await shot(`06-final-${game}`);
  await id('live-done').click();
  await id('home').waitFor({ timeout: 30000 });
  await shot(`07-home-after-${game}`);
}
console.log('moments', moments, 'errors', errors.length);
for (const e of errors.slice(0, 10)) console.log('ERR', e.slice(0, 300));
await browser.close();
