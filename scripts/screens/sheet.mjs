// Lays out a screenshot run as one contact sheet per theme and size, as JPEGs.
//   node scripts/screens/sheet.mjs <screenshotDir> <outDir>
import { mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { chromium } from '@playwright/test';

const [dir = 'docs/screens/raw', out = 'docs/screens'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const files = readdirSync(dir).filter((f) => f.endsWith('.png') && !f.startsWith('99-'));
const groups = new Map();
for (const f of files) {
  const m = f.match(/^(.*)-(light|dark)-(\d+)\.png$/);
  if (!m) continue;
  const key = `${m[2]}-${m[3]}`;
  groups.set(key, [...(groups.get(key) ?? []), { name: m[1], file: f }]);
}
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
for (const [key, list] of groups) {
  list.sort((a, b) => a.name.localeCompare(b.name));
  const dark = key.startsWith('dark');
  const cells = list
    .map(
      ({ name, file }) =>
        `<figure><img src="data:image/png;base64,${readFileSync(join(dir, file)).toString('base64')}"/><figcaption>${name.replace(/^\d+-/, '')}</figcaption></figure>`,
    )
    .join('');
  const page = await browser.newPage({ viewport: { width: 2400, height: 1000 } });
  await page.setContent(`<html><head><style>
    body{margin:0;padding:24px;background:${dark ? '#0F0F10' : '#E7E4DD'};font:600 18px system-ui;color:${dark ? '#F1EFEA' : '#141414'}}
    h1{font-size:28px;margin:0 0 16px}
    main{display:grid;grid-template-columns:repeat(8,1fr);gap:16px}
    figure{margin:0} img{width:100%;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,.2)}
    figcaption{margin-top:6px;font-size:14px;opacity:.75}
  </style></head><body><h1>Before the Buzzer · ${key.replace('-', ' · ')} pt wide</h1><main>${cells}</main></body></html>`);
  await page.waitForTimeout(300);
  await page.screenshot({
    path: join(out, `screens-${key}.jpg`),
    fullPage: true,
    type: 'jpeg',
    quality: 72,
  });
  await page.close();
  console.log(`screens-${key}.jpg: ${list.length} screens`);
}
await browser.close();
