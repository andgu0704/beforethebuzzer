/**
 * Renders the portrait review sheets headless with Skia (CanvasKit in Node), from the same
 * geometry the app draws:
 *
 *   docs/design/portrait-parts.png    every part and expression, labelled
 *   docs/design/portrait-samples.png  24 random faces, light and dark, plus a size ladder
 *   docs/design/portrait-lab.png      100 random faces (the hidden lab screen's view)
 *
 * Usage: npm run portraits [-- --out <dir>] [-- --zoom]
 *   --zoom also writes portrait-zoom.png: twelve faces at 240 pt for close critique.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import type { Skia, SkCanvas, SkFont } from '@shopify/react-native-skia';
import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/commonjs/web/LoadSkiaWeb';

import type { Portrait } from '../../src/engine/model/person';
import { proTeams } from '../../src/content/world/pro-teams';
import {
  ACCESSORY_NAMES,
  EXPRESSIONS,
  type Expression,
  FACIAL_HAIR_NAMES,
  framingFor,
  HAIR_NAMES,
  HAIR_TONES,
  PART_NAMES,
  portraitLayers,
  labFaces,
  type PortraitOptions,
  SKIN_TONES,
  STAFF_ACCESSORY_NAMES,
} from '../../src/ui/portrait/geometry';
import { toSkiaLayers } from '../../src/ui/portrait/skia';
import { palette } from '../../src/ui/theme/tokens';

const args = process.argv.slice(2);
const outDir = args.includes('--out')
  ? (args[args.indexOf('--out') + 1] ?? 'docs/design')
  : 'docs/design';
const zoom = args.includes('--zoom');

interface Env {
  readonly Skia: typeof Skia;
  readonly display: SkFont;
  readonly text: SkFont;
  readonly title: SkFont;
}

type Shape = 'circle' | 'card';

interface Face {
  readonly portrait: Portrait;
  readonly opts: PortraitOptions;
}

const BASE: Portrait = {
  head: 0,
  skin: 4,
  eyes: 0,
  brows: 0,
  nose: 0,
  mouth: 0,
  hair: 2,
  hairColour: 0,
  facialHair: 0,
  accessory: 0,
};

const HERONS = { primary: '#14634A', secondary: '#F2F2F2' };

function teamColours(i: number): { primary: string; secondary: string } {
  const team = proTeams[i % proTeams.length];
  return team ? team.colours : HERONS;
}

/** Draws one portrait into a size×size box at (x, y), optionally zoomed on a point. */
function drawFace(
  env: Env,
  canvas: SkCanvas,
  face: Face,
  x: number,
  y: number,
  size: number,
  bg: string,
  shape: Shape = 'circle',
  focus?: { cx: number; cy: number; scale: number },
): void {
  const { Skia } = env;
  canvas.save();
  const rect = Skia.XYWHRect(x, y, size, size);
  const rr =
    shape === 'circle'
      ? Skia.RRectXY(rect, size / 2, size / 2)
      : Skia.RRectXY(rect, Math.min(14, size * 0.12), Math.min(14, size * 0.12));
  // ClipOp.Intersect; the headless build's enum is typed from a different declaration copy.
  // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-assignment
  canvas.clipRRect(rr, 1, true);
  const bgPaint = Skia.Paint();
  bgPaint.setColor(Skia.Color(bg));
  canvas.drawRect(rect, bgPaint);
  canvas.translate(x, y);
  const s = size / 100;
  const frame = focus ?? framingFor(size);
  canvas.scale(s * frame.scale, s * frame.scale);
  canvas.translate(50 / frame.scale - frame.cx, 50 / frame.scale - frame.cy);
  const paint = Skia.Paint();
  paint.setAntiAlias(true);
  for (const layer of toSkiaLayers(Skia, portraitLayers(face.portrait, face.opts))) {
    paint.setColor(Skia.Color(layer.color));
    paint.setAlphaf(layer.opacity);
    canvas.drawPath(layer.path, paint);
  }
  canvas.restore();
}

function label(
  env: Env,
  canvas: SkCanvas,
  text: string,
  x: number,
  y: number,
  colour: string,
  font = env.text,
) {
  const paint = env.Skia.Paint();
  paint.setAntiAlias(true);
  paint.setColor(env.Skia.Color(colour));
  canvas.drawText(text, x, y, paint, font);
}

function centredLabel(
  env: Env,
  canvas: SkCanvas,
  text: string,
  cx: number,
  y: number,
  colour: string,
  font = env.text,
) {
  const w = font.getGlyphWidths(font.getGlyphIDs(text)).reduce((a, b) => a + b, 0);
  label(env, canvas, text, cx - w / 2, y, colour, font);
}

function save(
  env: Env,
  surface: ReturnType<Env['Skia']['Surface']['MakeOffscreen']>,
  name: string,
) {
  if (!surface) throw new Error('no surface');
  surface.flush();
  const bytes = surface.makeImageSnapshot().encodeToBytes();
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, name), bytes);
  console.log(`wrote ${join(outDir, name)}`);
}

// ---------------------------------------------------------------- parts sheet

interface Row {
  readonly title: string;
  readonly cells: readonly {
    face: Face;
    name: string;
    focus?: { cx: number; cy: number; scale: number };
  }[];
}

function partsRows(): Row[] {
  const player = (p: Partial<Portrait>, expression: Expression = 'neutral', jersey = 23): Face => ({
    portrait: { ...BASE, ...p },
    opts: { expression, jersey, ...HERONS },
  });
  const staff = (p: Partial<Portrait>): Face => ({
    portrait: { ...BASE, ...p },
    opts: { expression: 'neutral', staff: true, ...HERONS },
  });
  const pad = (i: number) => String(i).padStart(2, '0');
  const eyeFocus = { cx: 50, cy: 37.5, scale: 2.4 };
  const noseFocus = { cx: 50, cy: 46.5, scale: 3 };
  const mouthFocus = { cx: 50, cy: 52.5, scale: 3 };
  const rows: Row[] = [
    {
      title: 'HEAD SHAPES',
      cells: PART_NAMES.head.map((n, i) => ({
        face: player({ head: i, hair: 0 }),
        name: `${pad(i)} ${n}`,
      })),
    },
    {
      title: 'SKIN TONES · BASE, SHADOW, HIGHLIGHT',
      cells: SKIN_TONES.map((t, i) => ({
        face: player({ skin: i, hair: 1 }),
        name: `${pad(i)} ${t.name}`,
      })),
    },
    {
      title: 'EYES',
      cells: PART_NAMES.eyes.map((n, i) => ({
        face: player({ eyes: i, skin: (i * 3) % 10 }),
        name: `${pad(i)} ${n}`,
        focus: eyeFocus,
      })),
    },
    {
      title: 'BROWS',
      cells: PART_NAMES.brows.map((n, i) => ({
        face: player({ brows: i, skin: (i * 3 + 1) % 10, hairColour: i % 3 }),
        name: `${pad(i)} ${n}`,
        focus: eyeFocus,
      })),
    },
    {
      title: 'NOSES',
      cells: PART_NAMES.nose.map((n, i) => ({
        face: player({ nose: i, skin: (i * 3 + 2) % 10 }),
        name: `${pad(i)} ${n}`,
        focus: noseFocus,
      })),
    },
    {
      title: 'MOUTHS',
      cells: PART_NAMES.mouth.map((n, i) => ({
        face: player({ mouth: i, skin: (i * 3 + 1) % 10 }),
        name: `${pad(i)} ${n}`,
        focus: mouthFocus,
      })),
    },
    {
      title: 'HAIR (1 OF 2)',
      cells: HAIR_NAMES.slice(0, 9).map((n, i) => ({
        face: player({ hair: i, skin: (i * 3 + 5) % 10, hairColour: i % 3 === 2 ? 2 : 0 }),
        name: `${pad(i)} ${n}`,
      })),
    },
    {
      title: 'HAIR (2 OF 2)',
      cells: HAIR_NAMES.slice(9).map((n, i) => ({
        face: player({
          hair: i + 9,
          skin: (i * 3 + 1) % 10,
          hairColour: (i + 9) % 3 === 2 ? 4 : 1,
        }),
        name: `${pad(i + 9)} ${n}`,
      })),
    },
    {
      title: 'HAIR COLOURS',
      cells: HAIR_TONES.map((t, i) => ({
        face: player({ hairColour: i, hair: 13, facialHair: 4, skin: 2 + (i % 3) }),
        name: `${pad(i)} ${t.name}`,
      })),
    },
    {
      title: 'FACIAL HAIR',
      cells: FACIAL_HAIR_NAMES.map((n, i) => ({
        face: player({ facialHair: i, skin: (i * 3 + 2) % 10, hair: 1, hairColour: i % 2 }),
        name: `${pad(i)} ${n}`,
      })),
    },
    {
      title: 'ACCESSORIES · PLAYERS AND STAFF',
      cells: [
        ...ACCESSORY_NAMES.map((n, i) => ({
          face: player({ accessory: i, hair: i === 1 ? 9 : 4, skin: 7 }),
          name: `${pad(i)} ${n}`,
        })),
        ...STAFF_ACCESSORY_NAMES.map((n, i) => ({
          face: staff({
            accessory: i,
            hair: 12 + (i % 2),
            skin: 1 + i * 2,
            hairColour: i,
            facialHair: i === 2 ? 0 : 4,
          }),
          name: `staff ${pad(i)} ${n}`,
        })),
      ],
    },
  ];
  const exprFaces: Partial<Portrait>[] = [
    { skin: 8, hair: 6, eyes: 0, mouth: 1, facialHair: 0 },
    { skin: 1, hair: 13, eyes: 2, mouth: 0, hairColour: 3, facialHair: 1 },
    { skin: 5, hair: 9, eyes: 4, mouth: 3, head: 1, hairColour: 0, facialHair: 3 },
  ];
  exprFaces.forEach((p, k) => {
    rows.push({
      title: k === 0 ? 'EXPRESSIONS' : '',
      cells: EXPRESSIONS.map((e) => ({
        face: player(p, e, 7 + k * 11),
        name: e,
        focus: { cx: 50, cy: 45, scale: 1.45 },
      })),
    });
  });
  return rows;
}

function partsSheet(env: Env): void {
  const { Skia } = env;
  const cell = 124;
  const gap = 12;
  const margin = 32;
  const cols = 10;
  const rows = partsRows();
  const rowH = cell + 30 + 26;
  const width = margin * 2 + cols * cell + (cols - 1) * gap;
  const height = margin * 2 + 60 + rows.length * rowH;
  const surface = Skia.Surface.MakeOffscreen(width, height);
  if (!surface) throw new Error('surface');
  const canvas = surface.getCanvas();
  const p = palette.light;
  canvas.clear(Skia.Color(p.canvas));
  label(env, canvas, 'PORTRAIT PARTS', margin, margin + 30, p.ink, env.title);
  label(
    env,
    canvas,
    'Flat shapes, light from the upper left. Eyes, brows, nose and mouth rows are shown zoomed.',
    margin + 230,
    margin + 28,
    p.inkSecondary,
  );
  let y = margin + 60;
  for (const row of rows) {
    if (row.title) label(env, canvas, row.title, margin, y + 14, p.inkSecondary, env.display);
    row.cells.forEach((c, i) => {
      const x = margin + i * (cell + gap);
      drawFace(
        env,
        canvas,
        c.face,
        x,
        y + 22,
        cell,
        c.focus ? p.surface : p.sunken,
        c.focus ? 'card' : 'circle',
        c.focus,
      );
      centredLabel(env, canvas, c.name, x + cell / 2, y + 22 + cell + 16, p.ink);
    });
    y += rowH;
  }
  save(env, surface, 'portrait-parts.png');
}

// ---------------------------------------------------------------- samples

function sampleFaces(seed: number, n: number): Face[] {
  return labFaces(
    seed,
    n,
    proTeams.map((t) => t.colours),
  );
}

function samplesSheet(env: Env): void {
  const { Skia } = env;
  const faces = sampleFaces(2026, 24);
  const cell = 150;
  const gap = 14;
  const cols = 6;
  const panelW = cols * cell + (cols - 1) * gap + 48;
  const panelH = 4 * (cell + gap) + 48 + 40;
  const ladder = [32, 48, 64, 96, 160, 240];
  const ladderH = 240 + 80;
  const width = panelW * 2 + 32 * 3;
  const height = 32 + panelH + 32 + ladderH + 32;
  const surface = Skia.Surface.MakeOffscreen(width, height);
  if (!surface) throw new Error('surface');
  const canvas = surface.getCanvas();
  canvas.clear(Skia.Color('#D9D6CF'));
  (['light', 'dark'] as const).forEach((scheme, k) => {
    const p = palette[scheme];
    const x0 = 32 + k * (panelW + 32);
    const bg = Skia.Paint();
    bg.setColor(Skia.Color(p.canvas));
    canvas.drawRRect(Skia.RRectXY(Skia.XYWHRect(x0, 32, panelW, panelH), 18, 18), bg);
    label(
      env,
      canvas,
      `24 SAMPLES · ${scheme.toUpperCase()}`,
      x0 + 24,
      32 + 34,
      p.inkSecondary,
      env.display,
    );
    faces.forEach((face, i) => {
      const cx = x0 + 24 + (i % cols) * (cell + gap);
      const cy = 32 + 52 + Math.floor(i / cols) * (cell + gap);
      drawFace(env, canvas, face, cx, cy, cell, p.sunken);
    });
  });
  // Size ladder on both schemes: the same four faces from a 32-pt avatar to the ending card.
  const y0 = 32 + panelH + 32;
  (['light', 'dark'] as const).forEach((scheme, k) => {
    const p = palette[scheme];
    const x0 = 32 + k * (panelW + 32);
    const bg = Skia.Paint();
    bg.setColor(Skia.Color(p.canvas));
    canvas.drawRRect(Skia.RRectXY(Skia.XYWHRect(x0, y0, panelW, ladderH), 18, 18), bg);
    label(
      env,
      canvas,
      'SIZE LADDER · 32 TO 240 PT, DRAWN AT 1X',
      x0 + 24,
      y0 + 34,
      p.inkSecondary,
      env.display,
    );
    let x = x0 + 24;
    ladder.forEach((s, i) => {
      const face = faces[(i * 5 + k * 3) % faces.length];
      if (!face) return;
      drawFace(
        env,
        canvas,
        face,
        x,
        y0 + 56 + (240 - s),
        s,
        p.sunken,
        s >= 160 ? 'card' : 'circle',
      );
      centredLabel(env, canvas, `${s}`, x + s / 2, y0 + 56 + 240 + 18, p.inkSecondary);
      x += s + 18;
    });
  });
  save(env, surface, 'portrait-samples.png');
}

// ---------------------------------------------------------------- lab

function labSheet(env: Env): void {
  const { Skia } = env;
  const faces = sampleFaces(100, 100);
  const cell = 104;
  const gap = 10;
  const cols = 10;
  const width = 32 * 2 + cols * cell + (cols - 1) * gap;
  const height = 32 * 2 + 50 + 10 * (cell + gap) + 20;
  const surface = Skia.Surface.MakeOffscreen(width, height);
  if (!surface) throw new Error('surface');
  const canvas = surface.getCanvas();
  canvas.clear(Skia.Color(palette.light.canvas));
  const darkBg = Skia.Paint();
  darkBg.setColor(Skia.Color(palette.dark.canvas));
  const half = 32 + 50 + 5 * (cell + gap) - gap / 2;
  canvas.drawRect(Skia.XYWHRect(0, half, width, height - half), darkBg);
  label(
    env,
    canvas,
    'PORTRAIT LAB · 100 RANDOM FACES',
    32,
    32 + 28,
    palette.light.inkSecondary,
    env.display,
  );
  faces.forEach((face, i) => {
    const row = Math.floor(i / cols);
    const scheme = row < 5 ? 'light' : 'dark';
    const x = 32 + (i % cols) * (cell + gap);
    const y = 32 + 50 + row * (cell + gap) + (row >= 5 ? 20 : 0);
    drawFace(env, canvas, face, x, y, cell, palette[scheme].sunken);
  });
  save(env, surface, 'portrait-lab.png');
}

function zoomSheet(env: Env): void {
  const { Skia } = env;
  const faces = sampleFaces(Number(process.env.SEED ?? 7), 12);
  const size = 240;
  const gap = 16;
  const cols = 4;
  const width = cols * size + (cols + 1) * gap;
  const height = 3 * size + 4 * gap;
  const surface = Skia.Surface.MakeOffscreen(width, height);
  if (!surface) throw new Error('surface');
  const canvas = surface.getCanvas();
  canvas.clear(Skia.Color(palette.light.canvas));
  faces.forEach((face, i) => {
    drawFace(
      env,
      canvas,
      face,
      gap + (i % cols) * (size + gap),
      gap + Math.floor(i / cols) * (size + gap),
      size,
      palette.light.sunken,
      'card',
    );
  });
  save(env, surface, 'portrait-zoom.png');
}

/** A close-up grid of faces for critique (written with --zoom). */
function closeUps(
  env: Env,
  name: string,
  faces: readonly Face[],
  cols: number,
  size: number,
): void {
  const { Skia } = env;
  const gap = 12;
  const rows = Math.ceil(faces.length / cols);
  const surface = Skia.Surface.MakeOffscreen(
    cols * size + (cols + 1) * gap,
    rows * size + (rows + 1) * gap,
  );
  if (!surface) throw new Error('surface');
  const canvas = surface.getCanvas();
  canvas.clear(Skia.Color(palette.light.canvas));
  faces.forEach((face, i) => {
    drawFace(
      env,
      canvas,
      face,
      gap + (i % cols) * (size + gap),
      gap + Math.floor(i / cols) * (size + gap),
      size,
      palette.light.sunken,
      'card',
    );
  });
  save(env, surface, name);
}

function reviewSets(env: Env): void {
  const exprFaces: Partial<Portrait>[] = [
    { skin: 8, hair: 6, eyes: 0, mouth: 1 },
    { skin: 1, hair: 13, eyes: 2, mouth: 0, hairColour: 3, facialHair: 1 },
    { skin: 5, hair: 9, eyes: 4, mouth: 3, head: 1, facialHair: 3 },
  ];
  closeUps(
    env,
    'zoom-expressions.png',
    exprFaces.flatMap((p, k) =>
      EXPRESSIONS.map((expression) => ({
        portrait: { ...BASE, ...p },
        opts: { expression, jersey: 7 + k * 11, ...HERONS },
      })),
    ),
    6,
    200,
  );
  closeUps(
    env,
    'zoom-hair.png',
    HAIR_NAMES.map((_, i) => ({
      portrait: { ...BASE, hair: i, skin: (i * 3 + 2) % 10, hairColour: i % 4, head: i % 6 },
      opts: { expression: 'neutral', jersey: i, ...teamColours(i) },
    })),
    6,
    200,
  );
  closeUps(
    env,
    'zoom-beards.png',
    FACIAL_HAIR_NAMES.map((_, i) => ({
      portrait: {
        ...BASE,
        facialHair: i,
        skin: (i * 3 + 1) % 10,
        hair: (i * 5) % 18,
        hairColour: i % 3,
        head: i % 6,
        mouth: i,
      },
      opts: { expression: i % 2 === 0 ? 'neutral' : 'smile', jersey: i, ...teamColours(i + 3) },
    })),
    4,
    200,
  );
}

async function main(): Promise<void> {
  await LoadSkiaWeb();
  const headless = await import('@shopify/react-native-skia/lib/commonjs/headless');
  // The headless entry point ships its own copy of the type declarations; the API is the same.
  const Skia = headless.getSkiaExports().Skia as unknown as Env['Skia'];
  const font = (file: string, size: number) => {
    const bytes = new Uint8Array(readFileSync(file));
    const face = Skia.Typeface.MakeFreeTypeFaceFromData(Skia.Data.fromBytes(bytes));
    if (!face) throw new Error(`could not load ${file}`);
    return Skia.Font(face, size);
  };
  const env: Env = {
    Skia,
    display: font(
      'node_modules/@expo-google-fonts/antonio/600SemiBold/Antonio_600SemiBold.ttf',
      15,
    ),
    title: font('node_modules/@expo-google-fonts/antonio/700Bold/Antonio_700Bold.ttf', 34),
    text: font(
      'node_modules/@expo-google-fonts/schibsted-grotesk/400Regular/SchibstedGrotesk_400Regular.ttf',
      12,
    ),
  };
  partsSheet(env);
  samplesSheet(env);
  labSheet(env);
  if (zoom) {
    zoomSheet(env);
    reviewSets(env);
  }
}

void main();
