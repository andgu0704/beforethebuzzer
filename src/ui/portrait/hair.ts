/**
 * Hairstyles. Every style is built from the head's own profile (a cap grown out from the dome,
 * a hairline drawn across the forehead, sideburns down the face edge), so it sits on any of
 * the six head shapes. `hairBack` draws what falls behind the head and shoulders, `hairFront`
 * everything over the face.
 */
import { CX, type Head } from './head';
import {
  band,
  clamp,
  clipAbove,
  ellipse,
  gauss,
  join,
  lerp,
  mirror,
  poly,
  type Pt,
  range,
  roundRectPts,
  smoothstep,
  spline,
  strand,
  vband,
} from './shapes';
import { add, type Ctx } from './types';

export const HAIR_NAMES = [
  'shaved',
  'buzz cut',
  'crew fade',
  'high-top fade',
  'waves',
  'curly top',
  'twists',
  'locs',
  'cornrows',
  'afro',
  'top knot',
  'long',
  'receding',
  'side part',
  'curls',
  'textured fringe',
  'quiff',
  'horseshoe',
] as const;

export const TOP_KNOT = 10;
export const LONG_STYLES: readonly number[] = [7, 11];
export const QUIFF = 16;
export const HORSESHOE = 17;
export const SHAVED = 0;

interface CapSpec {
  readonly tTop: number;
  readonly tSide: number;
  /** Hairline height across the forehead, u from −1 (left temple) to 1 (right temple). */
  readonly line: (u: number) => number;
  readonly temple: number;
  readonly sb: number;
  readonly sbW: number;
  readonly bump?: (phi: number) => number;
}

/** A cap of hair grown from the dome, with a hairline and sideburns. */
function capPts(head: Head, s: CapSpec): Pt[] {
  const { cheekY, e } = head.d;
  const t = (phi: number) =>
    s.tSide + (s.tTop - s.tSide) * Math.cos(phi) ** 2 + (s.bump ? s.bump(phi) : 0);
  let phiEnd = Math.PI / 2;
  if (s.sb < cheekY) {
    const ratio = clamp((cheekY - s.sb) / (head.H + s.tSide), 0, 1);
    phiEnd = Math.acos(ratio ** (e / 2));
  }
  const outer = range(-phiEnd, phiEnd, 56).map((phi) => head.domePt(phi, t(phi)));
  const sideYs = s.sb > cheekY ? range(cheekY, s.sb, 6).slice(1) : [];
  const rightSide = sideYs.map((y): Pt => [CX + head.hw(y) + s.tSide, y]);
  const leftSide = mirror(rightSide).reverse();
  const xt = head.hw(s.temple) - s.sbW;
  const sbRight = range(s.sb, s.temple, 8).map((y): Pt => [CX + head.hw(y) - s.sbW, y]);
  const hairline = range(1, -1, 44).map((u): Pt => [CX + u * xt, s.line(u)]);
  const sbLeft = mirror(sbRight).reverse();
  return [...leftSide, ...outer, ...rightSide, ...sbRight, ...hairline, ...sbLeft];
}

interface Kit {
  readonly head: Head;
  readonly T: number;
  readonly W: number;
  readonly hl: number;
  readonly temple: number;
  readonly sb: number;
  readonly fadeY: number;
  readonly round: (dy?: number) => (u: number) => number;
  readonly straight: (dy?: number) => (u: number) => number;
  readonly cap: (s: Partial<CapSpec> & Pick<CapSpec, 'tTop' | 'tSide'>) => Pt[];
  /** Hairline height above x for a given hairline function. */
  readonly lineAt: (line: (u: number) => number, x: number, sbW?: number) => number;
}

function kit(ctx: Ctx): Kit {
  const { head, f } = ctx;
  const hl = f.hairlineY;
  const temple = f.templeY;
  const sb = f.sideburnY;
  const round =
    (dy = 0) =>
    (u: number) =>
      hl + dy + (temple - hl - dy) * Math.abs(u) ** 2.4;
  const straight =
    (dy = 0) =>
    (u: number) =>
      hl + dy + (temple - hl - dy) * Math.abs(u) ** 6;
  return {
    head,
    T: head.d.top,
    W: head.d.W,
    hl,
    temple,
    sb,
    fadeY: temple - 0.5,
    round,
    straight,
    cap: (s) => capPts(head, { line: round(), temple, sb, sbW: 1.4, ...s }),
    lineAt: (line, x, sbW = 1.4) => line(clamp((x - CX) / (head.hw(temple) - sbW), -1, 1)),
  };
}

function fade(ctx: Ctx, k: Kit): void {
  add(
    ctx.out,
    'hair.fade',
    poly(k.cap({ tTop: 0.45, tSide: 0.3, line: k.straight() })),
    ctx.hair.base,
    0.55,
  );
}

const taper =
  (w: number, from = 0.85, to = 0.45) =>
  (t: number) =>
    w * (t > from ? lerp(1, to, (t - from) / (1 - from)) : 1);

const spindle = (w: number) => (t: number) => w * Math.sin(Math.PI * clamp(t, 0.03, 0.97)) ** 0.7;

/** Sideburn bottom for beards to join, or null when the style has none. */
export function sideburnFor(style: number, ctx: Ctx): number | null {
  return style === SHAVED ? null : ctx.f.sideburnY;
}

export function hairBack(ctx: Ctx, style: number): void {
  const k = kit(ctx);
  const { head, hair, out, f } = ctx;
  const { T, W } = k;
  const cheekY = head.d.cheekY;
  switch (style) {
    case 7: {
      const strands: string[] = [];
      for (const side of [-1, 1] as const) {
        for (let i = 0; i < 6; i++) {
          const phi = side * (0.7 + i * 0.14);
          const s = head.domePt(phi, -0.5);
          const line = spline(
            [
              s,
              [s[0] + side * (1.0 + i * 0.3), s[1] + 8],
              [CX + side * (W + 1.0 + i * 1.0), f.mouthY],
              [CX + side * (W + 1.4 + i * 1.05), 71 - i * 1.3],
            ],
            8,
          );
          strands.push(poly(strand(line, () => 2.0)), circleAt(line[line.length - 1] ?? s, 1.0));
        }
      }
      add(out, 'hair.back', join(...strands), hair.dark);
      break;
    }
    case 9: {
      const top = T - 8.5;
      const bottom = cheekY + 8.5;
      const cy = (top + bottom) / 2;
      const ry = (bottom - top) / 2;
      const rx = W + 7.2;
      add(out, 'hair.back', poly(superellipse(CX, cy, rx, ry, 2.4, 96)), hair.base);
      break;
    }
    case 10: {
      add(out, 'hair.bun', ellipse(CX, T - 3.5, 4.1, 3.9), hair.base);
      const arc = range(1.12, 1.45, 10).map((t): Pt => [
        CX + Math.cos(t * Math.PI) * 2.7,
        T - 3.5 + Math.sin(t * Math.PI) * 2.6,
      ]);
      add(out, 'hair.bun.light', poly(strand(arc, spindle(1.0))), hair.light);
      break;
    }
    case 11: {
      const right: Pt[] = [
        ...range(0, Math.PI / 2, 20).map((phi) => head.domePt(phi, 2.4)),
        ...range(cheekY, 69, 10)
          .slice(1)
          .map((y): Pt => [CX + head.hw(cheekY) + 2.2 + 0.9 * smoothstep(cheekY, 69, y), y]),
        [CX + W * 0.55, 69],
      ];
      add(out, 'hair.back', poly([...mirror(right).reverse(), ...right.slice(1)]), hair.dark);
      break;
    }
    default:
      break;
  }
}

function superellipse(cx: number, cy: number, rx: number, ry: number, n: number, steps: number) {
  const pts: Pt[] = [];
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const c = Math.cos(t);
    const s = Math.sin(t);
    pts.push([
      cx + rx * Math.sign(c) * Math.abs(c) ** (2 / n),
      cy + ry * Math.sign(s) * Math.abs(s) ** (2 / n),
    ]);
  }
  return pts;
}

export function hairFront(ctx: Ctx, style: number): void {
  const k = kit(ctx);
  const { head, hair, skin, out, f } = ctx;
  const { T, W, hl, temple, sb, fadeY } = k;
  const hc = hair.base;
  const xt = head.hw(temple) - 1.4;
  const scalp = () => {
    add(
      out,
      'hair.scalp',
      poly(
        strand(
          range(-1.0, -0.12, 14).map((phi) => head.domePt(phi, -1.5)),
          spindle(1.5),
        ),
      ),
      skin.highlight,
    );
  };

  switch (style) {
    case 0:
      scalp();
      break;
    case 1:
      add(out, 'hair', poly(k.cap({ tTop: 0.55, tSide: 0.3, line: k.round(-0.2) })), hc, 0.85);
      break;
    case 2:
      fade(ctx, k);
      add(
        out,
        'hair',
        poly(clipAbove(k.cap({ tTop: 2.3, tSide: 1.1, line: k.straight() }), fadeY)),
        hc,
      );
      break;
    case 3: {
      fade(ctx, k);
      add(
        out,
        'hair',
        poly(clipAbove(k.cap({ tTop: 2.0, tSide: 1.1, line: k.straight() }), fadeY)),
        hc,
      );
      const bw = head.hw(hl + 2) + 1.1;
      const top = T - 6.8;
      add(out, 'hair.block', poly(roundRectPts(CX - bw, top, bw * 2, hl + 0.3 - top, 2.6)), hc);
      add(
        out,
        'hair.light',
        poly(roundRectPts(CX - bw + 1.4, top + 0.9, bw * 2 - 2.8, 1.1, 0.55)),
        hair.light,
      );
      break;
    }
    case 4: {
      const line = k.straight(0.2);
      add(out, 'hair', poly(k.cap({ tTop: 1.15, tSide: 0.45, line })), hc);
      const waves: string[] = [];
      for (const d of [-0.5, -2.3, -4.1]) {
        const span = (W + d) * 0.82;
        waves.push(
          poly(
            band(
              CX - span,
              CX + span,
              (x) => head.domeY(x - CX, d),
              (x) =>
                Math.min(
                  head.domeY(x - CX, d) + 0.55 * (1 - ((x - CX) / span) ** 4),
                  k.lineAt(line, x) - 0.8,
                ),
              28,
            ),
          ),
        );
      }
      add(out, 'hair.waves', join(...waves), hair.light);
      break;
    }
    case 5: {
      fade(ctx, k);
      const line = k.round(0.3);
      add(out, 'hair', poly(clipAbove(k.cap({ tTop: 1.8, tSide: 1.0, line }), fadeY + 1)), hc);
      add(
        out,
        'hair.curls',
        join(...range(-1.05, 1.05, 8).map((phi) => circleAt(head.domePt(phi, 1.25), 2.0))),
        hc,
      );
      add(out, 'hair.texture', join(...dots(ctx, k, line, -0.7, 0.85, 6)), hair.dark);
      break;
    }
    case 6: {
      const line = k.round(0.2);
      add(out, 'hair', poly(k.cap({ tTop: 2.0, tSide: 1.1, line })), hc);
      const even: string[] = [];
      const odd: string[] = [];
      range(-1.42, 1.42, 24).forEach((phi, i) => {
        const p = head.domePt(phi, 1.75);
        (i % 2 === 0 ? even : odd).push(circleAt(p, 1.12));
      });
      add(out, 'hair.twists', join(...odd), hair.dark);
      add(out, 'hair.twists', join(...even), hc);
      add(
        out,
        'hair.texture',
        join(...dots(ctx, k, line, 0.2, 1.1, 9), ...dots(ctx, k, line, -1.6, 0.8, 6)),
        hair.dark,
      );
      break;
    }
    case 7: {
      const line = k.round(-0.2);
      add(out, 'hair', poly(k.cap({ tTop: 1.9, tSide: 1.1, line, sbW: 1.6 })), hc);
      add(
        out,
        'hair.parts',
        join(...partings(ctx, k, line, [-0.5, -0.17, 0.17, 0.5], 0.4)),
        hair.dark,
      );
      const locs: [string[], string[]] = [[], []];
      for (const side of [-1, 1] as const) {
        for (let i = 0; i < 4; i++) {
          const end: Pt = [CX + side * (W + 0.4 + i * 1.55), 61 + ((i * 3.5) % 5)];
          const line2 = spline(
            [
              [CX + side * (4 + i * 2.3), hl - 1.6],
              [CX + side * (W - 2.2 + i * 1.7), temple + 0.2],
              [CX + side * (W + 0.2 + i * 1.55), f.eyeY + 6],
              end,
            ],
            10,
          );
          locs[i % 2]?.push(poly(strand(line2, () => 1.6)), circleAt(end, 0.8));
        }
      }
      add(out, 'hair.locs', join(...locs[1]), hair.dark);
      add(out, 'hair.locs', join(...locs[0]), hc);
      break;
    }
    case 8: {
      const line = k.round();
      add(out, 'hair', poly(k.cap({ tTop: 0.95, tSide: 0.5, line, sbW: 1.3 })), hc);
      add(
        out,
        'hair.parts',
        join(...partings(ctx, k, line, [-0.62, -0.31, 0, 0.31, 0.62], 0.5)),
        skin.shadow,
      );
      break;
    }
    case 9: {
      add(out, 'hair', poly(k.cap({ tTop: 3.5, tSide: 1.6, line: k.round(-0.5), sbW: 1.6 })), hc);
      const top = T - 8.5;
      const bottom = head.d.cheekY + 8.5;
      const cy = (top + bottom) / 2;
      const ry = (bottom - top) / 2 - 2.3;
      const rx = W + 7.2 - 2.3;
      const arc = range(1.1, 1.4, 14).map((t): Pt => [
        CX + rx * Math.cos(t * Math.PI),
        cy + ry * Math.sin(t * Math.PI),
      ]);
      add(out, 'hair.light', poly(strand(arc, spindle(1.5))), hair.light);
      break;
    }
    case 10: {
      fade(ctx, k);
      add(
        out,
        'hair',
        poly(clipAbove(k.cap({ tTop: 0.9, tSide: 0.6, line: k.round(-0.2) }), fadeY + 1)),
        hc,
      );
      const lines = [-1, 1].map((s) =>
        poly(
          strand(
            spline(
              [
                [CX + s * 5, hl - 0.6],
                [CX + s * 3.6, T + 2.2],
                [CX + s * 1.6, T + 0.3],
              ],
              6,
            ),
            spindle(0.55),
          ),
        ),
      );
      add(out, 'hair.light', join(...lines), hair.light);
      add(out, 'hair.tie', ellipse(CX, T - 0.15, 2.4, 0.75), hair.dark);
      break;
    }
    case 11: {
      const curtains: string[] = [];
      for (const side of [-1, 1] as const) {
        const cheekY = head.d.cheekY;
        const outer: Pt[] = [
          ...range(0.06, Math.PI / 2, 24).map((phi) => head.domePt(side * phi, 2.0)),
          ...range(cheekY, 67, 10)
            .slice(1)
            .map((y): Pt => [CX + side * (W + 2.0 + 1.2 * smoothstep(cheekY, 67, y)), y]),
          [CX + side * (W + 2.2), 68.4],
          [CX + side * (W + 0.6), 69],
        ];
        const innerCtl: Pt[] = [
          [CX + side * (head.hw(f.mouthY) + 0.5), 67],
          [CX + side * (head.hw(f.mouthY) + 0.2), f.mouthY],
          [CX + side * (head.hw(f.eyeY + 2) + 0.1), f.eyeY + 2],
          [CX + side * (head.hw(temple) - 3.0), temple],
          [CX + side * 5.0, hl + 0.3],
          [CX + side * 0.6, T + 1.0],
        ];
        curtains.push(poly([...outer, ...spline(innerCtl, 6)]));
      }
      add(out, 'hair', join(...curtains), hc);
      const sheen = spline(
        [
          [CX - 3.2, T + 0.3],
          [CX - 9, T + 3.2],
          [CX - 13.5, temple - 1],
        ],
        8,
      );
      add(out, 'hair.light', poly(strand(sheen, spindle(1.1))), hair.light);
      break;
    }
    case 12: {
      const line = (u: number) =>
        hl - 0.4 + (temple - hl + 0.4) * Math.abs(u) ** 2.4 - 4.2 * gauss(Math.abs(u), 0.6, 0.2);
      add(out, 'hair', poly(k.cap({ tTop: 1.4, tSide: 0.6, line, sbW: 1.3 })), hc);
      break;
    }
    case 13: {
      const line = k.round(-0.3);
      add(
        out,
        'hair',
        poly(k.cap({ tTop: 2.5, tSide: 0.7, line, bump: (phi) => 1.1 * gauss(phi, -0.55, 0.45) })),
        hc,
      );
      const px = CX - 0.45 * xt * 0.95;
      const part = spline(
        [
          [px, k.lineAt(line, px) + 0.2],
          [CX - 4.6, T + 4.5],
          [CX - 3.4, T + 1.6],
        ],
        8,
      );
      add(out, 'hair.part', poly(strand(part, taper(0.55, 0.6, 0.1))), skin.shadow);
      const sweep = spline(
        [
          [CX - 2.8, T + 1.6],
          [CX + 3, T - 0.6],
          [CX + 9, T + 1.6],
          [CX + 13, T + 6.4],
        ],
        8,
      );
      add(out, 'hair.light', poly(strand(sweep, spindle(1.0))), hair.light);
      break;
    }
    case 14: {
      const line = k.round(0.4);
      add(out, 'hair', poly(k.cap({ tTop: 2.8, tSide: 1.4, line, sbW: 1.8 })), hc);
      const curls = [
        ...range(-1.5, 1.5, 14).map((phi) => circleAt(head.domePt(phi, 1.9), 2.5)),
        ...range(temple - 3, sb - 1, 3).flatMap((y) =>
          [-1, 1].map((s) => circleAt([CX + s * (head.hw(y) + 0.8), y], 1.9)),
        ),
        ...range(-0.8, 0.8, 6).map((u) =>
          circleAt([CX + u * xt * 0.82, line(u * 0.82) + 0.25], 1.55),
        ),
      ];
      add(out, 'hair.curls', join(...curls), hc);
      add(out, 'hair.texture', join(...dots(ctx, k, line, -0.4, 1.05, 8)), hair.dark);
      break;
    }
    case 15: {
      const line = k.straight(-0.5);
      add(out, 'hair', poly(k.cap({ tTop: 2.6, tSide: 0.8, line })), hc);
      const span = xt * 0.9;
      const tri = (x: number) => Math.abs((((x - CX + 60) / 3.1) % 1) - 0.5) * 2;
      add(
        out,
        'hair.fringe',
        poly(
          band(
            CX - span,
            CX + span,
            (x) => k.lineAt(line, x) - 2.5,
            (x) => hl + 0.2 + (0.9 + 1.9 * tri(x) ** 1.5) * (1 - Math.abs((x - CX) / span) ** 2.5),
            60,
          ),
        ),
        hc,
      );
      break;
    }
    case 16: {
      fade(ctx, k);
      const bump = (phi: number) => 5.2 * gauss(phi, -0.18, 0.42);
      add(
        out,
        'hair',
        poly(clipAbove(k.cap({ tTop: 1.5, tSide: 1.0, line: k.straight(), bump }), fadeY + 1)),
        hc,
      );
      const crest = range(-0.8, 0.5, 12).map((phi) => head.domePt(phi, 1.5 + bump(phi) - 1.5));
      add(out, 'hair.light', poly(strand(crest, spindle(1.2))), hair.light);
      break;
    }
    case 17: {
      const y0 = temple - 2.5;
      const s = (y: number) => smoothstep(y0, temple + 2.5, y);
      const side = vband(
        y0,
        sb,
        (y) => CX + head.hw(y) - 1.5 * s(y),
        (y) => CX + head.hw(y) + 1.3 * s(y) + 0.05,
        14,
      );
      add(out, 'hair', join(poly(side), poly(mirror(side))), hc);
      scalp();
      break;
    }
    default:
      break;
  }
}

function circleAt(p: Pt, r: number): string {
  return ellipse(p[0], p[1], r, r);
}

/** Small curl marks inside a cap, kept above the hairline. */
function dots(
  ctx: Ctx,
  k: Kit,
  line: (u: number) => number,
  d: number,
  spread: number,
  n: number,
): string[] {
  const out: string[] = [];
  range(-spread, spread, n).forEach((phi, i) => {
    const p = ctx.head.domePt(phi + (i % 2 === 0 ? 0.05 : -0.05), d - (i % 2) * 1.6);
    if (p[1] < k.lineAt(line, p[0]) - 1.2) out.push(ellipse(p[0], p[1], 0.75, 0.6));
  });
  return out;
}

/** Meridian lines over the crown (cornrow partings, loc sections). */
function partings(
  ctx: Ctx,
  k: Kit,
  line: (u: number) => number,
  us: readonly number[],
  width: number,
): string[] {
  const { head } = ctx;
  return us.map((u) => {
    const pts: Pt[] = [];
    for (const y of range(k.T + 1.4, k.hl + 6, 20)) {
      const x = CX + u * Math.max(0, head.hw(y) - 1.0);
      if (y > k.lineAt(line, x) - 0.25) break;
      pts.push([x, y]);
    }
    return poly(strand(pts, (t) => width * lerp(0.35, 1, t)));
  });
}
