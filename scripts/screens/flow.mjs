// Plays the opening of a career in the web build and screenshots each screen.
//   node scripts/screens/flow.mjs [baseUrl] [outDir] [scheme] [width] [height] [weeks]
import { mkdirSync } from 'node:fs';

import { chromium } from '@playwright/test';

const [base = 'http://localhost:8081', out = 'docs/screens', scheme = 'light', w = '390', h = '844', weeksArg = '3'] =
  process.argv.slice(2);
mkdirSync(out, { recursive: true });
const tag = `${scheme}-${w}`;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({
  viewport: { width: Number(w), height: Number(h) },
  deviceScaleFactor: 2,
  colorScheme: scheme,
});
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});
const shot = async (name) => {
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${out}/${name}-${tag}.png` });
};
const id = (x) => page.getByTestId(x);

await page.goto(base, { waitUntil: 'networkidle' });
await id('new-career').first().waitFor({ timeout: 30000 });
await shot('01-welcome');
await id('new-career').first().click();
await id('given').fill('Nika');
await id('family').fill('Beridze');
await shot('02-create-who');
for (const step of ['body', 'game', 'look', 'traits', 'review']) {
  await id('create-next').click();
  await page.waitForTimeout(200);
  await shot(`03-create-${step}`);
}
await id('create-next').click();
await id('home').waitFor({ timeout: 120000 });
await shot('04-home-first');

// Play weeks, answering every decision with its first option.
const weeks = Number(weeksArg);
for (let week = 0; week < weeks; week++) {
  await id('next-week').click();
  for (let guard = 0; guard < 40; guard++) {
    await page.waitForTimeout(400);
    if (await id('decide').last().isVisible().catch(() => false)) {
      if (guard === 0 || week === 0) await shot(`05-decide-w${week}-${guard}`);
      const cont = id('decide-continue');
      if (await cont.isVisible().catch(() => false)) {
        await shot(`06-outcome-w${week}-${guard}`);
        await cont.click();
        continue;
      }
      const choice = page.locator('[data-testid^="choice-"], [data-testid^="moment-"], [data-testid^="offer-"]').first();
      if (await choice.isVisible().catch(() => false)) {
        await choice.click();
        continue;
      }
      const workout = page.locator('[data-testid^="workout-"]').first();
      if (await workout.isVisible().catch(() => false)) {
        await workout.click();
        await id('confirm-workouts').click();
        continue;
      }
    }
    const label = await id('next-week').innerText({ timeout: 2000 }).catch(() => '');
    if (process.env.FLOW_DEBUG) console.log(week, guard, page.url(), JSON.stringify(label));
    if (/next week/i.test(label)) break;
    if (/decide/i.test(label)) await id('next-week').click();
  }
}
await shot('07-home-after');
console.log(errors.length ? `ERRORS:\n${errors.slice(0, 15).join('\n')}` : 'no page errors');
await browser.close();
