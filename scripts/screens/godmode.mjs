// Screenshots God Mode, its panel, the style guide and the portrait lab in a God Mode web build.
//   node scripts/screens/godmode.mjs <baseUrl> <outDir> <passcode> [scheme]
import { mkdirSync } from 'node:fs';

import { chromium } from '@playwright/test';

const [base, out, code, scheme = 'light'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  colorScheme: scheme,
});
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const id = (x) => page.getByTestId(x);
const shot = async (name) => {
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${out}/${name}-${scheme}.png` });
};
await page.goto(base, { waitUntil: 'networkidle' });
await id('new-career').first().click();
await id('given').fill('Nika');
await id('family').fill('Beridze');
for (let i = 0; i < 6; i++) await id('create-next').click();
await id('home').waitFor({ timeout: 120000 });
await id('open-profile').click();
await id('profile-settings').click();
for (let i = 0; i < 7; i++) await id('version').click();
await id('passcode').waitFor({ timeout: 10000 });
await shot('60-godmode-prompt');
await id('passcode').fill(code);
await id('unlock').click();
await shot('61-godmode-panel');
await page.mouse.wheel(0, 3000);
await shot('62-godmode-panel-more');
await page.getByText('Open the style guide').click();
await shot('63-styleguide');
await page.mouse.wheel(0, 2500);
await shot('64-styleguide-more');
await page.goBack();
await page.getByText('Open the portrait lab').click();
await shot('65-portrait-lab');
console.log(errors.length ? errors.slice(0, 5).join('\n') : 'no page errors');
await browser.close();
