// Plays a career in the web build and screenshots each screen.
//   node scripts/screens/flow.mjs [baseUrl] [outDir] [scheme] [width] [height] [weeks] [ahead]
// "ahead" uses simulate ahead between decisions; every decision takes its first option.
import { mkdirSync } from 'node:fs';

import { chromium } from '@playwright/test';

const [
  base = 'http://localhost:8081',
  out = 'docs/screens',
  scheme = 'light',
  w = '390',
  h = '844',
  weeksArg = '3',
  mode = 'next',
] = process.argv.slice(2);
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
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${out}/${name}-${tag}.png` });
};
const id = (x) => page.getByTestId(x);
const visible = (loc) => loc.isVisible().catch(() => false);
const seen = new Set();

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

async function decide() {
  for (let guard = 0; guard < 12; guard++) {
    await page.waitForTimeout(300);
    if (await visible(id('draft-night'))) {
      await shot('20-draft-night-early');
      const skip = page.getByText(/skip to your pick/i);
      if (await visible(skip)) await skip.click();
      await page.waitForTimeout(1500);
      await shot('21-draft-night-reveal');
      await id('draft-continue').click();
      return 'ended';
    }
    if (!(await visible(id('decide').last()))) return 'none';
    const cont = id('decide-continue');
    if (await visible(cont)) {
      await cont.click();
      continue;
    }
    const kind = await page
      .locator(
        '[data-testid^="choice-"], [data-testid^="moment-"], [data-testid^="offer-"], [data-testid^="workout-"]',
      )
      .first()
      .getAttribute('data-testid')
      .catch(() => null);
    const prefix = kind ? kind.split('-')[0] : 'x';
    if (!seen.has(prefix)) {
      seen.add(prefix);
      await shot(`10-decide-${prefix}`);
    }
    if (prefix === 'workout') {
      await page.locator('[data-testid^="workout-"]').first().click();
      await id('confirm-workouts').click();
      continue;
    }
    if (kind) await page.getByTestId(kind).click();
    if (prefix === 'moment') {
      await page.waitForTimeout(2500);
      if (!seen.has('clip')) {
        seen.add('clip');
        await shot('11-moment-clip');
      }
    }
  }
  return 'busy';
}

const weeks = Number(weeksArg);
let ended = false;
for (let turn = 0; turn < weeks && !ended; turn++) {
  const label = (
    await id('next-week')
      .innerText({ timeout: 5000 })
      .catch(() => '')
  ).toLowerCase();
  if (/see how it ended/.test(label)) break;
  if (/decide/.test(label)) await id('next-week').click();
  else if (
    mode === 'ahead' &&
    (await id('simulate-ahead')
      .isEnabled()
      .catch(() => false))
  )
    await id('simulate-ahead').click();
  else await id('next-week').click();
  for (let guard = 0; guard < 200; guard++) {
    const r = await decide();
    if (r === 'ended') {
      ended = true;
      break;
    }
    const now = (
      await id('next-week')
        .innerText({ timeout: 2000 })
        .catch(() => '')
    ).toLowerCase();
    if (process.env.FLOW_DEBUG) console.log(turn, guard, page.url(), now);
    if (/next week|see how it ended/.test(now) && r === 'none') break;
    if (/decide/.test(now) && r === 'none') {
      const ok = await id('next-week')
        .click({ timeout: 8000 })
        .then(() => true)
        .catch(() => false);
      if (!ok) {
        await shot(`99-stuck-${turn}-${guard}`);
        console.log('stuck at', page.url(), now);
        await page.goto(base, { waitUntil: 'networkidle' });
      }
    }
    await page.waitForTimeout(250);
  }
}

if (ended) {
  await id('ending')
    .waitFor({ timeout: 10000 })
    .catch(() => undefined);
  await shot('22-ending');
  await page.goto(base, { waitUntil: 'networkidle' }).catch(() => undefined);
}
await id('home')
  .waitFor({ timeout: 30000 })
  .catch(() => undefined);
await shot('30-home');
for (const tab of ['train', 'team', 'career', 'social']) {
  await id(`tab-${tab}`).click();
  await page.waitForTimeout(500);
  await shot(`31-${tab}`);
  if (tab === 'team') {
    for (const sub of ['coach', 'schedule', 'standings']) {
      await id(`team-tabs-${sub}`).click();
      await shot(`32-team-${sub}`);
    }
  }
  if (tab === 'social') {
    for (const sub of ['press', 'rival']) {
      await id(`social-tabs-${sub}`).click();
      await shot(`33-social-${sub}`);
    }
  }
}
await id('tab-home').click();
const box = page.getByText(/^box score$/i).first();
if (await visible(box)) {
  await box.click();
  await id('game-report')
    .waitFor({ timeout: 10000 })
    .catch(() => undefined);
  await shot('41-game-report');
  await page.goBack();
}
await id('tab-team').click();
await id('team-tabs-standings').click();
const tour = page.locator('[data-testid^="tournament-"]').first();
if (await visible(tour)) {
  await tour.click();
  await shot('42-bracket');
  await page.goBack();
}
await id('tab-career').click();
if (await visible(id('open-combine'))) {
  await id('open-combine').click();
  await shot('43-combine');
  await page.goBack();
}
await id('tab-home').click();
await id('open-profile').click();
await shot('40-profile');
await page.mouse.wheel(0, 4000);
await shot('40-profile-timeline');
await id('profile-settings').click();
await shot('50-settings');
console.log(`ended: ${ended}`);
console.log(
  errors.length ? `ERRORS:\n${[...new Set(errors)].slice(0, 15).join('\n')}` : 'no page errors',
);
await browser.close();
