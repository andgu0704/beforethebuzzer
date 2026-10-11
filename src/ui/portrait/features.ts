/**
 * Face parts: ears, the face's light and shadow, eyes, brows, nose and mouth. Light always
 * comes from the upper left, so shadows sit on the viewer's right.
 */
import { tone } from './colours';
import { CX } from './head';
import {
  band,
  clamp,
  ellipse,
  ellipsePts,
  gauss,
  join,
  lerp,
  mirror,
  poly,
  type Pt,
  range,
  smoothstep,
  spline,
  strand,
  vband,
} from './shapes';
import { add, type Ctx } from './types';

const sq = (v: number) => Math.max(0, v);

// ---------------------------------------------------------------- ears

export function earGeom(ctx: Ctx): { right: Pt[]; lobe: Pt } {
  const { head, f } = ctx;
  const top = f.eyeY - 2.7;
  const bottom = f.noseY + 0.7;
  const cy = (top + bottom) / 2;
  const ry = (bottom - top) / 2;
  const wide = head.d.ear === 1;
  const rx = wide ? 2.85 : 2.5;
  const cx = CX + head.hw(cy) + (wide ? 0.95 : 0.6);
  const tilt = wide ? 0.16 : 0.1;
  const pts: Pt[] = [];
  for (let i = 0; i < 36; i++) {
    const t = (i / 36) * Math.PI * 2;
    const lobe = Math.sin(t) > 0 ? lerp(1, 0.74, Math.sin(t) ** 2) : 1;
    const x = Math.cos(t) * rx * lobe;
    const y = Math.sin(t) * ry;
    pts.push([
      cx + x * Math.cos(tilt) - y * Math.sin(tilt),
      cy + x * Math.sin(tilt) + y * Math.cos(tilt),
    ]);
  }
  const lobe: Pt = [cx - 0.1 + ry * 0.75 * Math.sin(-tilt), cy + ry * 0.78];
  return { right: pts, lobe };
}

export function ears(ctx: Ctx): void {
  const { skin, out } = ctx;
  const { right } = earGeom(ctx);
  const [cx, cy] = centroid(right);
  const wide = ctx.head.d.ear === 1;
  const inner = ellipsePts(
    cx - 0.45,
    cy - 0.4,
    wide ? 1.45 : 1.25,
    wide ? 3.6 : 3.4,
    wide ? 0.16 : 0.1,
  );
  add(out, 'ear', join(poly(right), poly(mirror(right))), skin.base);
  add(out, 'ear.inner', join(poly(inner), poly(mirror(inner))), skin.shadow);
}

function centroid(pts: readonly Pt[]): Pt {
  let x = 0;
  let y = 0;
  for (const p of pts) {
    x += p[0];
    y += p[1];
  }
  return [x / pts.length, y / pts.length];
}

// ---------------------------------------------------------------- face light and shadow

export function faceShading(ctx: Ctx): void {
  const { head, f, skin, out } = ctx;
  const { top, chinY, W } = head.d;
  // A shadow down the right side, narrow on the cheekbone and wider under it.
  const w = (y: number) =>
    2.3 - 0.9 * gauss(y, f.eyeY + 2.5, 3.5) + 1.0 * gauss(y, f.mouthY - 0.5, 4.5);
  const side = vband(
    top + 7,
    chinY,
    (y) => CX + Math.max(head.hw(y) * 0.45, head.hw(y) - w(y)),
    (y) => CX + head.hw(y),
    36,
  );
  add(out, 'face.shadow', poly(side), skin.shadow);
  // Highlights: forehead, left cheekbone, chin.
  add(
    out,
    'face.highlight',
    join(
      ellipse(CX - W * 0.3, top + (f.eyeY - top) * 0.38, W * 0.22, 1.2),
      poly(ellipsePts(CX - W * 0.56, f.eyeY + 4.4, 1.9, 0.9, -0.3)),
      ellipse(CX - 1.4, chinY - 1.7, 1.3, 0.55),
    ),
    skin.highlight,
  );
}

// ---------------------------------------------------------------- eyes

export interface EyeDef {
  readonly name: string;
  /** Half-width. */
  readonly a: number;
  /** Upper and lower opening. */
  readonly hu: number;
  readonly hl: number;
  /** Outer-corner offset; negative tilts up. */
  readonly tilt: number;
  /** Moves the lid's peak towards the outer corner. */
  readonly skew: number;
  /** 0 no lid shadow, 1 a crease, 2 a heavier hooded lid. */
  readonly crease: 0 | 1 | 2;
  readonly dx: number;
  readonly lash: number;
  readonly socket: boolean;
}

export const EYES: readonly EyeDef[] = [
  {
    name: 'almond',
    a: 3.39,
    hu: 1.8,
    hl: 0.95,
    tilt: -0.3,
    skew: 0.2,
    crease: 1,
    dx: 0,
    lash: 0.6,
    socket: false,
  },
  {
    name: 'round',
    a: 3.18,
    hu: 2.12,
    hl: 1.2,
    tilt: 0,
    skew: 0,
    crease: 1,
    dx: 0,
    lash: 0.55,
    socket: false,
  },
  {
    name: 'hooded',
    a: 3.39,
    hu: 1.43,
    hl: 0.9,
    tilt: 0,
    skew: 0.3,
    crease: 2,
    dx: 0,
    lash: 0.5,
    socket: false,
  },
  {
    name: 'monolid',
    a: 3.5,
    hu: 1.33,
    hl: 0.8,
    tilt: -0.4,
    skew: 0.35,
    crease: 0,
    dx: 0.1,
    lash: 0.7,
    socket: false,
  },
  {
    name: 'upturned',
    a: 3.39,
    hu: 1.64,
    hl: 0.85,
    tilt: -0.75,
    skew: 0.25,
    crease: 1,
    dx: 0,
    lash: 0.6,
    socket: false,
  },
  {
    name: 'downturned',
    a: 3.39,
    hu: 1.7,
    hl: 1.0,
    tilt: 0.55,
    skew: -0.15,
    crease: 1,
    dx: 0,
    lash: 0.55,
    socket: false,
  },
  {
    name: 'deep-set',
    a: 3.18,
    hu: 1.59,
    hl: 0.9,
    tilt: -0.1,
    skew: 0.1,
    crease: 2,
    dx: -0.1,
    lash: 0.55,
    socket: true,
  },
  {
    name: 'wide',
    a: 3.66,
    hu: 1.96,
    hl: 1.05,
    tilt: -0.2,
    skew: 0.1,
    crease: 1,
    dx: 0.25,
    lash: 0.6,
    socket: false,
  },
];

export function eyes(ctx: Ctx, def: EyeDef): void {
  for (const side of [-1, 1] as const) eye(ctx, def, side);
}

function eye(ctx: Ctx, def: EyeDef, side: -1 | 1): void {
  const { f, skin, out, expr } = ctx;
  const e = expr.eye;
  const ex = CX + side * (f.eyeDX + def.dx);
  const ey = f.eyeY;
  const a = def.a;
  const yb = (u: number) => ey + (def.tilt * u) / 2;
  const upper = (u: number) =>
    yb(u) - def.hu * e.open * sq(1 - u * u) ** e.lid * (1 + def.skew * u * 0.5);
  const lowerRaw = (u: number) => yb(u) + def.hl * (1 - 1.55 * e.raise) * sq(1 - u * u) ** 0.9;
  const lower = (u: number) => Math.max(lowerRaw(u), upper(u) + 0.12 * sq(1 - u * u));
  const xOf = (u: number) => ex + side * u * a;
  const uOf = (x: number) => clamp((side * (x - ex)) / a, -1, 1);

  if (def.socket) {
    add(
      out,
      'eye.socket',
      poly(ellipsePts(ex + side * 0.2, ey - 2.5, a * 1.05, 1.35, 0)),
      skin.shadow,
    );
  }

  const us = range(-1, 1, 24);
  const aperture: Pt[] = [
    ...us.map((u): Pt => [xOf(u), upper(u)]),
    ...[...us].reverse().map((u): Pt => [xOf(u), lower(u)]),
  ];
  add(out, 'eye.white', poly(aperture), '#F6F1EA');

  // The iris, clipped to the lids by construction.
  const r = 1.42 * (a / 3.2) ** 0.6 * e.irisScale;
  const ix = ex + side * 0.05;
  const iy = yb(0) + 0.1;
  const x0 = Math.max(ix - r, ex - a);
  const x1 = Math.min(ix + r, ex + a);
  const iris = band(
    x0,
    x1,
    (x) => Math.max(iy - Math.sqrt(sq(r * r - (x - ix) ** 2)), upper(uOf(x))),
    (x) => Math.min(iy + Math.sqrt(sq(r * r - (x - ix) ** 2)), lower(uOf(x))),
    20,
  );
  add(out, 'eye.iris', poly(iris), '#2A1C15');
  const clx = ix - r * 0.32;
  const cly = iy - r * 0.36;
  const cr = r * 0.28;
  if (cly - cr > upper(uOf(clx)) + 0.05 && cly + cr < lower(uOf(clx))) {
    add(out, 'eye.catchlight', ellipse(clx, cly, cr, cr), '#FFFFFF');
  }

  if (e.glint) {
    const g = band(
      xOf(side > 0 ? -0.75 : 0.65),
      xOf(side > 0 ? 0.65 : -0.75),
      (x) => lower(uOf(x)) - 0.42 * sq(1 - (uOf(x) / 0.8) ** 2),
      (x) => lower(uOf(x)) - 0.04,
      16,
    );
    add(out, 'eye.glint', poly(g), '#FFFFFF', 0.85);
  }

  // Lid shadow above the lash line.
  if (def.crease > 0) {
    const depth = def.crease === 2 ? 1.5 : 1.05;
    const ls = band(
      Math.min(xOf(-0.85), xOf(1)),
      Math.max(xOf(-0.85), xOf(1)),
      (x) => upper(uOf(x)) - 0.35 - depth * sq(1 - uOf(x) ** 2) ** 0.6,
      (x) => upper(uOf(x)) - 0.1,
      20,
    );
    add(out, 'eye.lid', poly(ls), skin.shadow);
  }

  // Lash line: a tapered shape along the upper lid with a small flick at the outer corner.
  const lt = (u: number) => def.lash * (0.3 + 0.7 * smoothstep(-1, 0.85, u));
  const topEdge = us.map((u): Pt => [xOf(u), upper(u) - lt(u)]);
  const tip: Pt = [xOf(1.17), yb(1) - 0.5 - 0.3 * def.lash];
  const bottomEdge = [...us].reverse().map((u): Pt => [xOf(u), upper(u) + 0.14]);
  add(out, 'eye.lash', poly([...topEdge, tip, ...bottomEdge]), '#1A1310');
}

// ---------------------------------------------------------------- brows

export interface BrowDef {
  readonly name: string;
  readonly inner: number;
  readonly outer: number;
  readonly arch: number;
  /** Where along the brow the arch peaks (0 inner, 1 outer). */
  readonly peak: number;
  readonly len: number;
  readonly dy: number;
}

export const BROWS: readonly BrowDef[] = [
  { name: 'straight', inner: 1.25, outer: 0.75, arch: 0.4, peak: 0.6, len: 1, dy: 0 },
  { name: 'arched', inner: 1.1, outer: 0.6, arch: 1.15, peak: 0.62, len: 1, dy: -0.2 },
  { name: 'thick', inner: 1.7, outer: 1.05, arch: 0.35, peak: 0.6, len: 1.02, dy: 0.1 },
  { name: 'soft', inner: 0.85, outer: 0.5, arch: 0.65, peak: 0.55, len: 0.95, dy: -0.1 },
  { name: 'angled', inner: 1.3, outer: 0.65, arch: 1.0, peak: 0.66, len: 1, dy: 0 },
  { name: 'full', inner: 1.75, outer: 1.2, arch: 0.6, peak: 0.55, len: 1.06, dy: 0.35 },
];

export function brows(ctx: Ctx, def: BrowDef, eyeDef: EyeDef, colour: string): void {
  const { f, out, expr } = ctx;
  const b = expr.brow;
  const paths: string[] = [];
  for (const side of [-1, 1] as const) {
    const ex = CX + side * (f.eyeDX + eyeDef.dx);
    const a = eyeDef.a;
    const xIn = ex - side * (a * 0.95 - b.knit);
    const xOut = ex + side * a * 1.22 * def.len;
    const base = f.browY + def.dy + b.dy;
    const archShape = (u: number) =>
      u < def.peak
        ? Math.sin(((Math.PI / 2) * u) / def.peak)
        : Math.cos(((Math.PI / 2) * (u - def.peak)) / (1 - def.peak));
    const centre = (u: number) =>
      base + b.inner * (1 - u) ** 1.5 - def.arch * b.arch * archShape(u) + 0.6 * u * u;
    const thick = (u: number) =>
      lerp(def.inner, def.outer, u) *
      (u < 0.1 ? lerp(0.72, 1, u / 0.1) : 1) *
      (u > 0.78 ? lerp(1, 0.2, (u - 0.78) / 0.22) : 1);
    const us = range(0, 1, 22);
    const topEdge = us.map((u): Pt => [lerp(xIn, xOut, u), centre(u) - thick(u) * 0.55]);
    const bottomEdge = [...us]
      .reverse()
      .map((u): Pt => [lerp(xIn, xOut, u), centre(u) + thick(u) * 0.45]);
    paths.push(poly([...topEdge, ...bottomEdge]));
  }
  add(out, 'brows', join(...paths), colour);

  if (expr.furrow > 0) {
    const y0 = f.browY + b.dy + b.inner * 0.6 - 0.2;
    const creases: Pt[][] = [];
    const offsets = expr.furrow === 2 ? [-1.0, 1.0] : [-0.8];
    for (const o of offsets) {
      creases.push(
        strand(
          [
            [CX + o, y0],
            [CX + o * 0.75, y0 + 2.4],
          ],
          (t) => 0.5 * Math.sin(Math.PI * clamp(t, 0.05, 0.95)),
        ),
      );
    }
    add(out, 'brows.furrow', join(...creases.map(poly)), ctx.skin.shadow);
  }
}

// ---------------------------------------------------------------- nose

export interface NoseDef {
  readonly name: string;
  /** Half-width across the nostrils. */
  readonly nw: number;
  readonly dy: number;
  /** Length of the bridge shadow. */
  readonly bridge: number;
  readonly tip: number;
  readonly nostril: number;
}

export const NOSES: readonly NoseDef[] = [
  { name: 'straight', nw: 2.4, dy: 0, bridge: 5.5, tip: 1, nostril: 1 },
  { name: 'button', nw: 2.1, dy: -0.5, bridge: 3.2, tip: 1.1, nostril: 0.85 },
  { name: 'broad', nw: 3.2, dy: 0.1, bridge: 4.2, tip: 1.25, nostril: 1.2 },
  { name: 'long', nw: 2.3, dy: 0.8, bridge: 7, tip: 0.95, nostril: 0.9 },
  { name: 'wide-round', nw: 2.9, dy: 0.2, bridge: 3.8, tip: 1.35, nostril: 1.1 },
  { name: 'narrow', nw: 1.9, dy: 0.3, bridge: 6.5, tip: 0.8, nostril: 0.8 },
  { name: 'flat-bridge', nw: 3.0, dy: 0, bridge: 2.6, tip: 1.2, nostril: 1.25 },
  { name: 'aquiline', nw: 2.35, dy: 0.5, bridge: 7.2, tip: 1, nostril: 0.95 },
];

export function nose(ctx: Ctx, def: NoseDef): void {
  const { f, skin, out } = ctx;
  const ny = f.noseY + def.dy;
  const nw = def.nw;
  const baseY = (u: number) => ny + 0.45 * sq(1 - u * u) ** 0.8 - 0.55 * u * u;
  const th = (u: number) => (0.75 + 0.85 * gauss(Math.abs(u), 0.78, 0.26)) * (1 + 0.22 * u);

  // Bridge shadow on the right side, widening into the nostril wing.
  const y0 = ny - def.bridge;
  const y1 = ny - 0.6;
  const bridge = vband(
    y0,
    y1,
    (y) => CX + 0.55 + 0.35 * smoothstep(y0, y1, y),
    (y) => CX + 1.05 + nw * 0.58 * smoothstep(y0, y1, y) ** 1.6,
    16,
  );
  add(out, 'nose.bridge', poly(bridge), skin.shadow);

  const under = band(
    CX - nw,
    CX + nw,
    (x) => baseY((x - CX) / nw) - th((x - CX) / nw),
    (x) => baseY((x - CX) / nw),
    24,
  );
  add(out, 'nose.base', poly(under), skin.shadow);

  const nostrils = [-1, 1].map((s) =>
    poly(
      ellipsePts(
        CX + s * nw * 0.42,
        baseY(0.42) - 0.3,
        0.6 * def.nostril,
        0.3 * def.nostril,
        s * 0.28,
        16,
      ),
    ),
  );
  add(out, 'nose.nostrils', join(...nostrils), skin.lipDark);
  add(
    out,
    'nose.tip',
    ellipse(CX - 0.6, ny - 1.35, 0.85 * def.tip, 0.55 * def.tip),
    skin.highlight,
  );
}

// ---------------------------------------------------------------- mouth

export interface MouthDef {
  readonly name: string;
  readonly w: number;
  readonly upper: number;
  readonly lower: number;
  readonly bow: number;
  readonly corner: number;
}

export const MOUTHS: readonly MouthDef[] = [
  { name: 'balanced', w: 5.0, upper: 1.0, lower: 1.45, bow: 0.35, corner: 0 },
  { name: 'full', w: 5.5, upper: 1.3, lower: 1.85, bow: 0.4, corner: 0 },
  { name: 'small', w: 4.4, upper: 0.8, lower: 1.15, bow: 0.25, corner: 0 },
  { name: 'wide full', w: 5.8, upper: 1.4, lower: 1.9, bow: 0.5, corner: 0.05 },
  { name: 'pout', w: 4.8, upper: 0.9, lower: 1.65, bow: 0.2, corner: 0 },
  { name: 'wide thin', w: 5.7, upper: 0.8, lower: 1.2, bow: 0.3, corner: 0.1 },
  { name: 'bow', w: 4.8, upper: 1.15, lower: 1.4, bow: 0.6, corner: 0 },
  { name: 'set', w: 5.2, upper: 1.0, lower: 1.5, bow: 0.3, corner: 0.3 },
];

/** Curves later parts (moustache, goatee) need to fit the mouth as it is drawn. */
export interface MouthShape {
  readonly w: number;
  /** Top of the upper lip at x. */
  readonly upperTop: (x: number) => number;
  /** Bottom of the lower lip at x. */
  readonly lowerBottom: (x: number) => number;
  readonly cornerY: number;
}

export function mouthShape(ctx: Ctx, def: MouthDef): MouthShape & { parts: MouthParts } {
  const m = ctx.expr.mouth;
  const w = def.w * m.width;
  const my = ctx.f.mouthY;
  const corner = m.corner + def.corner;
  const uOf = (x: number) => clamp((x - CX) / w, -1, 1);
  const line = (u: number) => my + corner * Math.abs(u) ** 2.1;
  const openTop = (u: number) => line(u) - m.openUp * sq(1 - u * u) ** m.kTop;
  const openBottom = (u: number) => line(u) + m.openDown * sq(1 - u * u) ** m.kBottom;
  const upperTopU = (u: number) =>
    openTop(u) -
    def.upper * m.press * sq(1 - u * u) ** 0.55 * (1 + 0.3 * gauss(Math.abs(u), 0.25, 0.15)) +
    def.bow * m.press * gauss(u, 0, 0.1);
  const lowerBottomU = (u: number) => openBottom(u) + def.lower * m.press * sq(1 - u * u) ** 0.6;
  return {
    w,
    upperTop: (x) => upperTopU(uOf(x)),
    lowerBottom: (x) => lowerBottomU(uOf(x)),
    cornerY: line(1),
    parts: { uOf, line, openTop, openBottom, upperTopU, lowerBottomU },
  };
}

interface MouthParts {
  readonly uOf: (x: number) => number;
  readonly line: (u: number) => number;
  readonly openTop: (u: number) => number;
  readonly openBottom: (u: number) => number;
  readonly upperTopU: (u: number) => number;
  readonly lowerBottomU: (u: number) => number;
}

/** The soft shadow under the lower lip; drawn before any beard. */
export function underLip(ctx: Ctx, shape: MouthShape): void {
  const w = shape.w * 0.5;
  const s = band(
    CX - w,
    CX + w,
    (x) => shape.lowerBottom(x) + 0.45,
    (x) => shape.lowerBottom(x) + 0.45 + 0.95 * sq(1 - ((x - CX) / w) ** 2) ** 0.7,
    16,
  );
  add(ctx.out, 'mouth.chin', poly(s), ctx.skin.shadow);
}

export function mouth(ctx: Ctx, shape: MouthShape & { parts: MouthParts }): void {
  const { skin, out, expr } = ctx;
  const m = expr.mouth;
  const { w } = shape;
  const { uOf, line, openTop, openBottom, upperTopU, lowerBottomU } = shape.parts;
  const open = m.openUp + m.openDown > 0;
  const x0 = CX - w;
  const x1 = CX + w;

  if (expr.smileLines) {
    const lines = [-1, 1].map((s) => {
      const pts = spline(
        [
          [CX + s * (w + 0.7), ctx.f.noseY + 1.3],
          [CX + s * (w + 1.25), (ctx.f.noseY + shape.cornerY) / 2 + 0.5],
          [CX + s * (w + 1.0), shape.cornerY + 0.5],
        ],
        8,
      );
      return poly(strand(pts, (t) => 0.45 * Math.sin(Math.PI * clamp(t, 0.02, 0.98)) ** 0.8));
    });
    add(out, 'mouth.lines', join(...lines), skin.shadow);
  }

  if (open) {
    add(
      out,
      'mouth.inside',
      poly(
        band(
          x0,
          x1,
          (x) => openTop(uOf(x)),
          (x) => openBottom(uOf(x)),
          28,
        ),
      ),
      '#3D1C1C',
    );
    if (m.tongue) {
      add(
        out,
        'mouth.tongue',
        poly(
          band(
            CX - w * 0.75,
            CX + w * 0.75,
            (x) =>
              Math.max(
                openTop(uOf(x)),
                openBottom(uOf(x)) - 1.15 * sq(1 - (uOf(x) / 0.78) ** 2) ** 0.5,
              ),
            (x) => openBottom(uOf(x)),
            18,
          ),
        ),
        '#B4575A',
      );
    }
    if (m.teeth === 'upper') {
      add(
        out,
        'mouth.teeth',
        poly(
          band(
            CX - w * 0.94,
            CX + w * 0.94,
            (x) => openTop(uOf(x)),
            (x) =>
              Math.min(
                openBottom(uOf(x)),
                openTop(uOf(x)) + m.teethDepth * sq(1 - uOf(x) ** 2) ** 0.25,
              ),
            24,
          ),
        ),
        '#F7F3EC',
      );
    } else if (m.teeth === 'full') {
      add(
        out,
        'mouth.teeth',
        poly(
          band(
            CX - w * 0.9,
            CX + w * 0.9,
            (x) => openTop(uOf(x)) + 0.12,
            (x) => openBottom(uOf(x)) - 0.12,
            24,
          ),
        ),
        '#F7F3EC',
      );
    }
  }

  add(
    out,
    'mouth.upper',
    poly(
      band(
        x0,
        x1,
        (x) => upperTopU(uOf(x)),
        (x) => openTop(uOf(x)) + (open ? 0 : 0.08),
        28,
      ),
    ),
    skin.lipDark,
  );
  add(
    out,
    'mouth.lower',
    poly(
      band(
        x0,
        x1,
        (x) => openBottom(uOf(x)) - (open ? 0 : 0.04),
        (x) => lowerBottomU(uOf(x)),
        28,
      ),
    ),
    skin.lip,
  );
  const hw = w * 0.36;
  add(
    out,
    'mouth.sheen',
    poly(
      band(
        CX - hw - 0.4,
        CX + hw - 0.4,
        (x) => openBottom(uOf(x)) + (lowerBottomU(uOf(x)) - openBottom(uOf(x))) * 0.3,
        (x) =>
          openBottom(uOf(x)) +
          (lowerBottomU(uOf(x)) - openBottom(uOf(x))) * 0.3 +
          0.4 * sq(1 - ((x - CX + 0.4) / hw) ** 2),
        14,
      ),
    ),
    skin.highlight,
    0.55,
  );
  if (!open) {
    const ext = 1.05;
    add(
      out,
      'mouth.line',
      poly(
        band(
          CX - w * ext,
          CX + w * ext,
          (x) => line(uOf(x)) - 0.2 * sq(1 - ((x - CX) / (w * ext)) ** 2) ** 0.35 - 0.04,
          (x) => line(uOf(x)) + 0.22 * sq(1 - ((x - CX) / (w * ext)) ** 2) ** 0.35,
          30,
        ),
      ),
      tone(skin.lipDark, -0.1),
    );
  }
}
