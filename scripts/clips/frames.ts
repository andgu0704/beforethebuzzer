/**
 * Contact sheets for the 2D clips: key frames (t = 0, .25, .5, .75, 1 and the result) of every
 * template and outcome, painted with headless Skia from the same draw description the app uses.
 * Also times sample() and the frame description in Node and writes docs/clips/timing.md.
 *
 *   npm run clips:frames [-- --only fast_break] [--scheme dark] [--scale 1]
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';

import CanvasKitInit from 'canvaskit-wasm/full';
import { format } from 'prettier';

import type { SkFont, SkPicture, Skia } from '@shopify/react-native-skia';

import { COURTS } from '@/ui/clips/court';
import { paintOps, recordCourt } from '@/ui/clips/paint';
import { PLAY_TEMPLATES, buildPlay, sample } from '@/ui/clips/plays';
import {
  FONT_SIZES,
  VIEW_H,
  VIEW_W,
  describeFrame,
  resolveLook,
  type SceneLook,
} from '@/ui/clips/scene';
import { clipTextEn, sceneLabels } from '@/ui/clips/text';
import type { ClipOutcome, Play, PlaySpec } from '@/ui/clips/types';
import type { Scheme } from '@/ui/theme/tokens';

type SkiaApi = typeof Skia;

interface Args {
  only: string | null;
  scheme: Scheme;
  scale: number;
  out: string;
  timing: boolean;
}

function parseArgs(argv: readonly string[]): Args {
  const get = (name: string) => {
    const i = argv.indexOf(`--${name}`);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  return {
    only: get('only') ?? null,
    scheme: get('scheme') === 'dark' ? 'dark' : 'light',
    scale: Number(get('scale') ?? '1'),
    out: get('out') ?? 'docs/clips',
    timing: !argv.includes('--no-timing'),
  };
}

const HOME = { abbr: 'HSH', primary: '#14634A', secondary: '#E9C46A' };
const AWAY = { abbr: 'RVR', primary: '#8A1C2B', secondary: '#F4F1E8' };

interface Variant {
  readonly outcome: ClipOutcome;
  readonly success: boolean;
  readonly label: string;
}

const v = (outcome: ClipOutcome, success: boolean, label: string = outcome): Variant => ({
  outcome,
  success,
  label,
});

/** The outcomes worth drawing for each template. */
export function variantsFor(template: string): Variant[] {
  switch (template) {
    case 'block':
    case 'charge':
    case 'steal_runout':
      return [v('stop', true), v('steal', true), v('scored', false)];
    case 'checkup':
      return [v('pain', true, 'play through'), v('pain', false, 'sit down')];
    case 'free_throws':
      return [v('make', true), v('miss', false)];
    case 'drive_and_kick':
    case 'pick_and_roll_roll':
      return [
        v('assist', true),
        v('miss', false),
        v('turnover', false),
        v('make', true, 'make (finisher)'),
      ];
    case 'alley_oop':
      return [
        v('assist', true),
        v('turnover', false),
        v('make', true, 'make (finisher)'),
        v('miss', false),
        v('block', false),
      ];
    case 'fast_break':
      return [
        v('make', true),
        v('miss', false),
        v('block', false),
        v('steal', false),
        v('assist', true),
      ];
    default:
      return [v('make', true), v('miss', false), v('block', false), v('steal', false)];
  }
}

export function specFor(template: string, variant: Variant, variation = 7): PlaySpec {
  const late = template === 'last_second_heave';
  return {
    template,
    outcome: variant.outcome,
    success: variant.success,
    shotType: null,
    userSide: 0,
    userJersey: 23,
    period: late ? 2 : 2,
    clock: late ? 2.4 : 312,
    scoreBefore: late ? [64, 66] : [61, 58],
    variation,
  };
}

async function loadSkia(): Promise<SkiaApi> {
  const ck = await CanvasKitInit({});
  (globalThis as unknown as { CanvasKit: unknown }).CanvasKit = ck;
  // The headless entry reads the global CanvasKit; it is loaded only after it is set.
  const headless = await import('@shopify/react-native-skia/lib/commonjs/headless');
  // The headless build ships its own copy of the type declarations; the API is the same.
  return headless.getSkiaExports().Skia as unknown as SkiaApi;
}

function loadFonts(Skia: SkiaApi): SkFont[] {
  const face = (weight: string) =>
    Skia.Typeface.MakeFreeTypeFaceFromData(
      Skia.Data.fromBytes(
        new Uint8Array(
          readFileSync(
            join('node_modules/@expo-google-fonts/antonio', weight, `Antonio_${weight}.ttf`),
          ),
        ),
      ),
    );
  const bold = face('700Bold');
  const semi = face('600SemiBold');
  if (!bold || !semi) throw new Error('could not load Antonio');
  return [
    Skia.Font(bold, FONT_SIZES[0]),
    Skia.Font(bold, FONT_SIZES[1]),
    Skia.Font(semi, FONT_SIZES[2]),
    Skia.Font(semi, FONT_SIZES[3]),
  ];
}

const COLS: readonly { label: string; t: (p: Play) => number }[] = [
  { label: 't = 0', t: () => 0 },
  { label: 't = .25', t: () => 0.25 },
  { label: 't = .5', t: () => 0.5 },
  { label: 't = .75', t: () => 0.75 },
  { label: 't = 1', t: () => 1 },
  { label: 'result', t: (p) => Math.min(1, (p.resultT + 0.12) / p.duration) },
];

const GAP = 10;
const HEAD = 26;

function renderSheet(
  Skia: SkiaApi,
  fonts: SkFont[],
  courts: Map<string, SkPicture>,
  look: SceneLook,
  template: string,
  scale: number,
): Uint8Array {
  const variants = variantsFor(template);
  const cellW = VIEW_W * scale;
  const cellH = VIEW_H * scale;
  const width = COLS.length * (cellW + GAP) + GAP;
  const height = variants.length * (cellH + HEAD + GAP) + GAP + HEAD;
  const surface = Skia.Surface.MakeOffscreen(width, height);
  if (!surface) throw new Error('no surface');
  const canvas = surface.getCanvas();
  canvas.clear(Skia.Color('#F3F1EC'));
  const ink = Skia.Paint();
  ink.setColor(Skia.Color('#141414'));
  ink.setAntiAlias(true);
  const titleFont = fonts[1];
  const labelFont = fonts[2];
  if (!titleFont || !labelFont) throw new Error('fonts');
  canvas.drawText(template, GAP, HEAD - 4, ink, titleFont);
  variants.forEach((variant, row) => {
    const play = buildPlay(specFor(template, variant));
    const court = courts.get(play.court);
    if (!court) throw new Error('court');
    const labels = sceneLabels(play, clipTextEn, [HOME.abbr, AWAY.abbr]);
    const y = HEAD + GAP + row * (cellH + HEAD + GAP);
    canvas.drawText(
      `${variant.label} — ${play.result} · ${play.duration.toFixed(1)} s · ${play.good ? 'good' : 'bad'} for the user`,
      GAP,
      y + HEAD - 8,
      ink,
      labelFont,
    );
    COLS.forEach((col, i) => {
      const x = GAP + i * (cellW + GAP);
      const t = col.t(play);
      const frame = sample(play, t);
      const ops = describeFrame(play, frame, look, labels, false);
      // Each cell is its own surface, which also clips the court to the view.
      const cell = Skia.Surface.MakeOffscreen(cellW, cellH);
      if (!cell) throw new Error('no cell surface');
      const cc = cell.getCanvas();
      cc.scale(scale, scale);
      paintOps(Skia, cc, ops, fonts, court);
      cell.flush();
      canvas.drawImage(cell.makeImageSnapshot(), x, y + HEAD);
      if (row === 0) canvas.drawText(col.label, x + cellW - 60, HEAD - 4, ink, labelFont);
    });
  });
  surface.flush();
  const image = surface.makeImageSnapshot();
  return image.encodeToBytes();
}

function time(fn: () => void, n: number): number {
  const t0 = performance.now();
  for (let i = 0; i < n; i++) fn();
  return (performance.now() - t0) / n;
}

async function timing(Skia: SkiaApi, fonts: SkFont[], look: SceneLook, out: string) {
  const plays: Play[] = [];
  for (const template of PLAY_TEMPLATES) {
    for (const variant of variantsFor(template)) plays.push(buildPlay(specFor(template, variant)));
  }
  const n = 4000;
  let k = 0;
  const pick = () => {
    k = (k + 1) % plays.length;
    return plays[k] as Play;
  };
  const tPoints = Array.from({ length: 97 }, (_, i) => i / 96);
  let j = 0;
  const nextT = () => {
    j = (j + 1) % tPoints.length;
    return tPoints[j] ?? 0;
  };
  // Warm up the JIT first, as the UI thread would be after the first frames.
  time(() => sample(pick(), nextT()), n);
  const build = time(() => {
    const p = pick();
    buildPlay(specFor(p.template, { outcome: p.outcome, success: p.good, label: '' }));
  }, 300);
  const sampleMs = time(() => sample(pick(), nextT()), n * 10);
  const labels = new Map(plays.map((p) => [p, sceneLabels(p, clipTextEn, ['HSH', 'RVR'])]));
  const frameMs = time(() => {
    const p = pick();
    const lab = labels.get(p);
    if (lab) describeFrame(p, sample(p, nextT()), look, lab, false);
  }, n * 5);
  const court = recordCourt(Skia, COURTS.college, look);
  const paintMs = time(() => {
    const p = pick();
    const lab = labels.get(p);
    if (!lab) return;
    const ops = describeFrame(p, sample(p, nextT()), look, lab, false);
    const rec = Skia.PictureRecorder();
    const c = rec.beginRecording(Skia.XYWHRect(0, 0, VIEW_W, VIEW_H));
    paintOps(Skia, c, ops, fonts, court);
    rec.finishRecordingAsPicture();
  }, 1500);
  const fmt = (ms: number) => (ms < 0.01 ? `${(ms * 1000).toFixed(2)} µs` : `${ms.toFixed(3)} ms`);
  const md = `# Clip timing

Measured by \`npm run clips:frames\` in Node ${process.version} on this machine, over ${plays.length} plays
(every template and outcome) at evenly spaced times. The UI-thread budget at 60 fps is 16.7 ms
per frame.

| Work | Per call |
| --- | --- |
| \`buildPlay\` (once per clip, JS thread) | ${fmt(build)} |
| \`sample\` (one frame of positions, clocks and score) | ${fmt(sampleMs)} |
| \`sample\` + \`describeFrame\` (the full frame description) | ${fmt(frameMs)} |
| Full frame painted into a Skia picture (headless CanvasKit, software) | ${fmt(paintMs)} |

On the device the description runs inside a Reanimated worklet and is painted by native Skia; the
CanvasKit line is only an upper bound for the drawing work.
`;
  writeFileSync(join(out, 'timing.md'), await format(md, { parser: 'markdown', printWidth: 100 }));
  return { build, sampleMs, frameMs, paintMs };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  mkdirSync(args.out, { recursive: true });
  const Skia = await loadSkia();
  const fonts = loadFonts(Skia);
  const look = resolveLook(args.scheme, HOME, AWAY);
  const courts = new Map<string, SkPicture>([
    ['college', recordCourt(Skia, COURTS.college, look)],
    ['pro', recordCourt(Skia, COURTS.pro, look)],
  ]);
  const templates = args.only ? [args.only] : PLAY_TEMPLATES;
  for (const template of templates) {
    const png = renderSheet(Skia, fonts, courts, look, template, args.scale);
    const name = args.scheme === 'dark' ? `${template}-dark.png` : `${template}.png`;
    writeFileSync(join(args.out, name), png);
    console.log(`wrote ${join(args.out, name)}`);
  }
  if (args.timing && !args.only) {
    const t = await timing(Skia, fonts, look, args.out);
    console.log(
      `buildPlay ${t.build.toFixed(3)} ms · sample ${(t.sampleMs * 1000).toFixed(2)} µs · ` +
        `frame ${(t.frameMs * 1000).toFixed(2)} µs · painted ${t.paintMs.toFixed(3)} ms`,
    );
  }
}

void main();
