// Checks that a reload in the middle of a key moment brings the same moment back.
//   node scripts/screens/resume.mjs [baseUrl]
import { chromium } from '@playwright/test';

const base = process.argv[2] ?? 'http://localhost:8081';
const decision = '[data-testid^="moment-"], [data-testid^="choice-"], [data-testid^="offer-"]';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const id = (x) => page.getByTestId(x);
const options = () =>
  page.locator(decision).evaluateAll((els) => els.map((e) => e.getAttribute('data-testid')));

await page.goto(base, { waitUntil: 'networkidle' });
await id('new-career').first().click();
await id('given').fill('Nika');
await id('family').fill('Beridze');
for (let i = 0; i < 6; i++) await id('create-next').click();
await id('home').waitFor({ timeout: 120000 });
await id('next-week').click();
await page.locator(decision).first().waitFor({ timeout: 60000 });
const before = await options();
await page.waitForTimeout(1500);
await page.reload({ waitUntil: 'networkidle' });
await page.locator(decision).first().waitFor({ timeout: 60000 });
const after = await options();
await browser.close();
const same = JSON.stringify(before) === JSON.stringify(after);
console.log(
  same ? `resumed the same decision: ${before.join(', ')}` : `different: ${before} vs ${after}`,
);
process.exit(same ? 0 : 1);
