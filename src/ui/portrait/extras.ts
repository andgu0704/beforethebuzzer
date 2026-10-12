/** Facial hair and accessories. */
import { INK } from './colours';
import { earGeom, type EyeDef, type MouthShape } from './features';
import { CX } from './head';
import {
  band,
  clamp,
  ellipse,
  ellipsePts,
  hole,
  join,
  mirror,
  poly,
  type Pt,
  range,
  roundRectPts,
  smoothstep,
  spline,
  vband,
} from './shapes';
import { add, type Ctx } from './types';

export const FACIAL_HAIR_NAMES = [
  'clean-shaven',
  'stubble',
  'moustache',
  'circle beard',
  'short beard',
  'full beard',
  'goatee',
  'pencil and patch',
] as const;

export const ACCESSORY_NAMES = ['none', 'headband', 'earrings', 'chain'] as const;
export const STAFF_ACCESSORY_NAMES = ['none', 'glasses', 'earrings', 'round glasses'] as const;

interface BeardSpec {
  /** Inner edge control points (dx, y) from the sideburn to the centre line. */
  readonly inner: readonly Pt[];
  /** Extra volume below the chin. */
  readonly extra: number;
}

/** A beard region: the jaw outline grown by `extra`, inside edge from `inner`. */
function beardPts(ctx: Ctx, y0: number, spec: BeardSpec): Pt[] {
  const { head } = ctx;
  const { chinY, chinW } = head.d;
  const out = (y: number) => 0.15 + spec.extra * smoothstep(y0, chinY + 2, y) ** 1.6;
  const outerRight: Pt[] = [
    ...range(y0, chinY, 18).map((y): Pt => [CX + head.hw(y) + out(y) * 0.8, y]),
    ...range(chinW, 0, 8)
      .slice(1)
      .map((x): Pt => [CX + x + (spec.extra * 0.25 * x) / chinW, head.jawY(x) + out(chinY + 2)]),
  ];
  const outer = [...outerRight, ...mirror(outerRight).reverse().slice(1)];
  const innerRight = spline(spec.inner, 8).map(([dx, y]): Pt => [CX + Math.max(0, dx), y]);
  const innerLeft = mirror(innerRight);
  // outer runs right-top → bottom → left-top; inner returns left-top → centre → right-top.
  return [...outer, ...innerLeft, ...innerRight.reverse().slice(1)];
}

export interface BeardResult {
  /** How far the beard hangs below the jaw (for the neck shadow). */
  readonly extra: number;
}

/** Facial hair drawn under the mouth (everything but the moustache). */
export function beard(
  ctx: Ctx,
  style: number,
  sideburn: number | null,
  shape: MouthShape,
): BeardResult {
  const { head, f, hair, out } = ctx;
  const y0 = sideburn ?? f.eyeY + 1;
  const hw = (y: number) => head.hw(y);
  const w = shape.w;
  const below = shape.lowerBottom(CX);
  const full: BeardSpec = {
    inner: [
      [hw(y0) - 1.9, y0],
      [head.d.W * 0.66, f.noseY - 0.2],
      [w + 1.3, shape.cornerY + 0.2],
      [w * 0.4, below + 0.4],
      [0, below + 0.55],
    ],
    extra: 2.6,
  };
  switch (style) {
    case 1: {
      // Stubble: the full-beard area and the moustache area as one translucent shape.
      const stubble: BeardSpec = {
        inner: [
          [hw(y0) - 1.5, y0],
          [hw(f.noseY + 2.5) - 2.6, f.noseY + 2.5],
          [w + 1.4, shape.cornerY + 1.2],
          [w * 0.4, below + 0.5],
          [0, below + 0.6],
        ],
        extra: 0,
      };
      add(
        out,
        'beard.stubble',
        join(poly(beardPts(ctx, y0, stubble)), poly(moustachePts(ctx, shape, 1))),
        hair.base,
        0.22,
      );
      return { extra: 0 };
    }
    case 3: {
      const gw = w * 0.78;
      const chin = band(
        CX - gw,
        CX + gw,
        (x) => shape.lowerBottom(x) + 0.4,
        (x) => {
          const top = shape.lowerBottom(x) + 0.4;
          const u = (x - CX) / gw;
          return top + (head.jawY(x - CX) + 0.5 - top) * Math.max(0, 1 - u * u) ** 0.3;
        },
        24,
      );
      const sides = [-1, 1].map((s) =>
        poly(
          vband(
            shape.cornerY - 0.6,
            shape.lowerBottom(CX) + 1.6,
            (y) =>
              CX +
              (s > 0 ? w - 0.1 : -w - 0.8) -
              s * 0.3 * smoothstep(shape.cornerY, shape.lowerBottom(CX) + 1.6, y),
            (y) =>
              CX +
              (s > 0 ? w + 0.8 : -w + 0.1) -
              s * 0.3 * smoothstep(shape.cornerY, shape.lowerBottom(CX) + 1.6, y),
            8,
          ),
        ),
      );
      add(out, 'beard', join(poly(chin), ...sides), hair.base);
      return { extra: 0.5 };
    }
    case 4: {
      add(
        out,
        'beard',
        poly(
          beardPts(ctx, y0, {
            inner: [
              [hw(y0) - 1.5, y0],
              [hw(f.noseY + 1) - 2.6, f.noseY + 1],
              [w + 1.5, shape.cornerY + 1.6],
              [w * 0.4, below + 0.8],
              [0, below + 0.9],
            ],
            extra: 0.8,
          }),
        ),
        hair.base,
      );
      return { extra: 0.8 };
    }
    case 5: {
      add(out, 'beard', poly(beardPts(ctx, y0, full)), hair.base);
      return { extra: full.extra };
    }
    case 6: {
      const gw = w * 0.55;
      const goatee = band(
        CX - gw,
        CX + gw,
        (x) => shape.lowerBottom(x) + 0.35,
        (x) => {
          const top = shape.lowerBottom(x) + 0.35;
          const u = (x - CX) / gw;
          return top + (head.jawY(x - CX) + 1.2 - top) * Math.max(0, 1 - u * u) ** 0.55;
        },
        24,
      );
      add(out, 'beard', poly(goatee), hair.base);
      return { extra: 1.0 };
    }
    case 7: {
      const top = shape.lowerBottom(CX) + 0.5;
      add(
        out,
        'beard',
        poly([
          [CX - 0.95, top],
          [CX + 0.95, top],
          [CX + 0.35, top + 2.3],
          [CX - 0.35, top + 2.3],
        ]),
        hair.base,
      );
      return { extra: 0 };
    }
    default:
      return { extra: 0 };
  }
}

/** The moustache: drawn after the mouth so it sits on the upper lip. */
export function moustache(ctx: Ctx, style: number, shape: MouthShape): void {
  if (style >= 2 && style <= 6) {
    add(
      ctx.out,
      'moustache',
      poly(moustachePts(ctx, shape, style === 5 ? 1.15 : 1)),
      ctx.hair.base,
    );
  } else if (style === 7) {
    add(ctx.out, 'moustache', poly(moustachePts(ctx, shape, 0.42)), ctx.hair.base);
  }
}

function moustachePts(ctx: Ctx, shape: MouthShape, weight: number): Pt[] {
  const noseBase = ctx.f.noseY + 0.95;
  const mw = shape.w + 0.7;
  const bottom = (x: number) => {
    const u = Math.abs((x - CX) / mw);
    return (
      shape.upperTop(clamp(x, CX - shape.w, CX + shape.w)) + 0.2 + 1.1 * smoothstep(0.82, 1, u)
    );
  };
  const top = (x: number) => {
    const u = (x - CX) / mw;
    const natural = noseBase + 0.5 * u * u + 0.7 * smoothstep(0.75, 1, Math.abs(u));
    const b = bottom(x);
    const thick =
      Math.max(0.5, (b - natural) * weight) * (1 - 0.5 * smoothstep(0.45, 1, Math.abs(u)));
    return Math.min(b - 0.4, b - thick);
  };
  return band(CX - mw, CX + mw, top, bottom, 30);
}

// ---------------------------------------------------------------- accessories

export function headband(ctx: Ctx, colour: string): void {
  const { head, f } = ctx;
  const yT = f.hairlineY - 0.6;
  const wb = head.hw(yT + 1.8) + 0.45;
  const pts = band(
    CX - wb,
    CX + wb,
    (x) => yT + 1.3 * ((x - CX) / wb) ** 2,
    (x) => yT + 3.0 + 1.5 * ((x - CX) / wb) ** 2,
    28,
  );
  add(ctx.out, 'headband', poly(pts), colour);
}

export function earrings(ctx: Ctx): void {
  const { lobe } = earGeom(ctx);
  const [lx, ly] = lobe;
  const mx = 2 * CX - lx;
  add(
    ctx.out,
    'earrings',
    join(ellipse(lx, ly, 0.85, 0.85), ellipse(mx, ly, 0.85, 0.85)),
    INK.gold,
  );
  add(
    ctx.out,
    'earrings.light',
    join(ellipse(lx - 0.25, ly - 0.25, 0.3, 0.3), ellipse(mx - 0.25, ly - 0.25, 0.3, 0.3)),
    INK.goldLight,
  );
}

export function glasses(ctx: Ctx, eyeDef: EyeDef, round: boolean): void {
  const { f, head, out } = ctx;
  const ey = f.eyeY + 0.25;
  const dx = f.eyeDX + eyeDef.dx;
  const t = 0.62;
  const rings: string[] = [];
  const lenses: string[] = [];
  let outerEdge = 0;
  let innerEdge = 0;
  for (const side of [-1, 1] as const) {
    const ex = CX + side * dx;
    if (round) {
      const r = 3.9;
      rings.push(ellipse(ex, ey, r, r), hole(ellipsePts(ex, ey, r - t, r - t, 0, 40)));
      lenses.push(ellipse(ex, ey, r - t, r - t));
      outerEdge = dx + r;
      innerEdge = dx - r;
    } else {
      const w = 8.8;
      const h = 6.0;
      rings.push(
        poly(roundRectPts(ex - w / 2, ey - h / 2, w, h, 1.7)),
        hole(roundRectPts(ex - w / 2 + t, ey - h / 2 + t, w - 2 * t, h - 2 * t, 1.2)),
      );
      lenses.push(poly(roundRectPts(ex - w / 2 + t, ey - h / 2 + t, w - 2 * t, h - 2 * t, 1.2)));
      outerEdge = dx + w / 2;
      innerEdge = dx - w / 2;
    }
  }
  const colour = round ? INK.frameTortoise : INK.frame;
  add(out, 'glasses.lens', join(...lenses), INK.lens, 0.16);
  add(out, 'glasses', join(...rings), colour);
  const by = ey - 1.0;
  const bridge = band(
    CX - innerEdge - 0.2,
    CX + innerEdge + 0.2,
    (x) => by - 0.7 * (1 - ((x - CX) / (innerEdge + 0.2)) ** 2) - 0.3,
    (x) => by - 0.7 * (1 - ((x - CX) / (innerEdge + 0.2)) ** 2) + 0.3,
    10,
  );
  const ty = ey - 1.6;
  const temples = [-1, 1].map((s) => {
    const a = CX + s * (outerEdge - 0.2);
    const b = CX + s * (head.hw(ty) + 0.1);
    return poly(roundRectPts(Math.min(a, b), ty - 0.32, Math.abs(b - a), 0.64, 0.3));
  });
  add(out, 'glasses.frame', join(poly(bridge), ...temples), colour);
}
