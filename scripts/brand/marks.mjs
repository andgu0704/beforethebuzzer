// Renders the app icon, adaptive icon, splash mark and favicon from one SVG design.
//   node scripts/brand/marks.mjs
import { chromium } from '@playwright/test';

const ORANGE = '#FF5A1F';
const INK = '#141414';
const PAPER = '#F3F1EC';

// A ball in the moment before the buzzer: seams, and a sweep of the clock running out.
const ball = (stroke, sweep) => `
  <g fill="none" stroke-linecap="round">
    <circle cx="512" cy="512" r="300" stroke="${stroke}" stroke-width="56"/>
    <path d="M512 212 V812" stroke="${stroke}" stroke-width="44"/>
    <path d="M212 512 H812" stroke="${stroke}" stroke-width="44"/>
    <path d="M300 300 C 400 420 400 604 300 724" stroke="${stroke}" stroke-width="44"/>
    <path d="M724 300 C 624 420 624 604 724 724" stroke="${stroke}" stroke-width="44"/>
    <path d="M512 150 A362 362 0 1 1 194 340" stroke="${sweep}" stroke-width="40"/>
  </g>`;

const svg = (body, bg) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${bg ? `<rect width="1024" height="1024" fill="${bg}"/>` : ''}${body}</svg>`;

const files = [
  { path: 'assets/icon.png', size: 1024, svg: svg(ball('#FFFFFF', INK), ORANGE) },
  {
    path: 'assets/adaptive-icon.png',
    size: 1024,
    svg: svg(
      `<g transform="translate(512 512) scale(0.7) translate(-512 -512)">${ball('#FFFFFF', INK)}</g>`,
      null,
    ),
  },
  {
    path: 'assets/splash.png',
    size: 512,
    svg: svg(`<circle cx="512" cy="512" r="470" fill="${ORANGE}"/>${ball('#FFFFFF', INK)}`, null),
  },
  { path: 'assets/favicon.png', size: 64, svg: svg(ball('#FFFFFF', INK), ORANGE) },
  { path: 'docs/design/icon-preview.png', size: 512, svg: svg(ball('#FFFFFF', INK), ORANGE) },
];

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
for (const f of files) {
  const page = await browser.newPage({ viewport: { width: f.size, height: f.size } });
  await page.setContent(
    `<html><body style="margin:0;background:transparent">${f.svg.replace('width="1024" height="1024"', `width="${f.size}" height="${f.size}"`)}</body></html>`,
  );
  await page.screenshot({ path: f.path, omitBackground: true });
  await page.close();
}
await browser.close();
console.log(`wrote ${files.length} images (paper ${PAPER})`);
