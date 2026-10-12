// Runs axe-core over every main screen of the web build and lists what it finds.
//   node scripts/screens/a11y.mjs [baseUrl] [scheme] [out.json]
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

import { chromium } from '@playwright/test';

const require = createRequire(import.meta.url);
const axePath = require.resolve('axe-core/axe.min.js');
const [base = 'http://localhost:8081', scheme = 'light', out] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, colorScheme: scheme });
const id = (x) => page.getByTestId(x);
const visible = (loc) => loc.isVisible().catch(() => false);
const results = {};

async function audit(name) {
  await page.waitForTimeout(700);
  await page.addScriptTag({ path: axePath });
  const r = await page.evaluate(async () => {
    // eslint-disable-next-line no-undef
    const res = await axe.run(document, {
      resultTypes: ['violations'],
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'],
      },
    });
    return res.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      nodes: v.nodes.length,
      sample: v.nodes
        .slice(0, 3)
        .map((n) => `${n.target.join(' ')} :: ${n.failureSummary?.split('\n')[1] ?? ''}`),
    }));
  });
  results[name] = r;
  const serious = r.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  console.log(`${name}: ${r.length} rules (${serious.length} serious/critical)`);
  for (const v of r)
    console.log(
      `   [${v.impact}] ${v.id} ×${v.nodes} — ${v.help}\n      ${v.sample.join('\n      ')}`,
    );
}

await page.goto(base, { waitUntil: 'networkidle' });
await id('new-career').first().waitFor({ timeout: 60000 });
await audit('welcome');
await id('new-career').first().click();
await id('given').fill('Nika');
await id('family').fill('Beridze');
await audit('create');
for (let i = 0; i < 6; i++) await id('create-next').click();
await id('home').waitFor({ timeout: 120000 });
await audit('home');
for (const tab of ['train', 'team', 'career', 'social']) {
  await id(`tab-${tab}`).click();
  await audit(tab);
}
await id('tab-home').click();
await id('next-week').click();
await id('tip-off').waitFor({ timeout: 60000 });
await audit('pregame');
await id('tip-off').click();
await page.waitForTimeout(4000);
await audit('live');
for (let g = 0; g < 400; g++) {
  const opt = page.locator('[data-testid^="moment-"]:not([data-testid="moment-continue"])').first();
  if (await visible(opt)) {
    await audit('moment');
    await opt.click();
    if (await visible(id('skill-check'))) {
      await audit('skill-check');
      await id('skill-release').click();
    }
    await page.waitForTimeout(800);
    await id('moment-continue').click();
    break;
  }
  if (await visible(id('live-skip'))) await id('live-skip').click();
  await page.waitForTimeout(200);
}
for (let g = 0; g < 400 && !(await visible(id('live-final'))); g++) {
  const opt = page.locator('[data-testid^="moment-"]:not([data-testid="moment-continue"])').first();
  if (await visible(opt)) {
    await opt.click();
    if (await visible(id('skill-release'))) await id('skill-release').click();
    await page.waitForTimeout(800);
    await id('moment-continue').click();
  } else if (await visible(id('live-skip'))) await id('live-skip').click();
  await page.waitForTimeout(200);
}
await audit('final');
await id('live-done').click();
await page.goto(`${base}/settings`, { waitUntil: 'networkidle' });
await audit('settings');
if (out) writeFileSync(out, JSON.stringify(results, null, 2));
await browser.close();
