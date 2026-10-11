/**
 * Neck, shoulders and clothing: a basketball jersey (tank top with collar trim and number) for
 * players, or a shirt, tie and blazer for staff.
 */
import { INK, numberColour, tone } from './colours';
import { numberPath } from './digits';
import { CX } from './head';
import { band, ellipse, join, mirror, poly, type Pt, range, spline, strand, vband } from './shapes';
import { add, type Ctx } from './types';

/** The shoulder line, as (dx, y) pairs from the neck outwards. */
function shoulderLine(neck: number): Pt[] {
  return spline(
    [
      [neck, 71],
      [neck + 2.3, 76.3],
      [19, 79.8],
      [30, 83],
      [38, 88.5],
      [42.5, 96],
      [44, 104],
    ],
    10,
  );
}

/** Height of the shoulder surface at horizontal offset d. */
function shoulderY(line: readonly Pt[], d: number): number {
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1];
    const b = line[i];
    if (a === undefined || b === undefined) continue;
    if (d <= b[0]) {
      const t = (d - a[0]) / (b[0] - a[0] || 1);
      return a[1] + (b[1] - a[1]) * Math.max(0, Math.min(1, t));
    }
  }
  return line[line.length - 1]?.[1] ?? 100;
}

export function torso(ctx: Ctx): void {
  const { f, head, skin, out } = ctx;
  const n = f.neck;
  const line = shoulderLine(n);
  const right: Pt[] = [
    [CX + n, head.d.chinY - 10],
    ...line.map(([d, y]): Pt => [CX + d, y]),
    [CX, 104],
  ];
  add(out, 'body', poly([...mirror(right).reverse(), ...right.slice(0, -1)]), skin.base);
  // The neck turns away from the light on the right.
  add(
    out,
    'body.shadow',
    poly(
      vband(
        head.d.chinY - 6,
        74,
        (y) => CX + n - 2.1 + (y - 66) * 0.05,
        () => CX + n,
        10,
      ),
    ),
    skin.shadow,
  );
}

/** The shadow the jaw (and any beard) casts on the neck. */
export function neckShadow(ctx: Ctx, extra: number): void {
  const { f, head, skin, out } = ctx;
  const n = f.neck + 0.2;
  add(
    out,
    'neck.shadow',
    poly(
      band(
        CX - n,
        CX + n,
        (x) => head.jawY(x - CX) - 1,
        (x) => head.jawY(x - CX) + extra + 2.6 + 0.9 * ((x - CX) / n),
        24,
      ),
    ),
    skin.shadow,
  );
}

export function jersey(ctx: Ctx, primary: string, secondary: string, num?: number): void {
  const { f, out } = ctx;
  const n = f.neck;
  const line = shoulderLine(n);
  const nl = n + 3.4;
  const ah = nl + 6.2;
  const nb = 83.2;
  const neckline = spline(
    [
      [CX - nl, shoulderY(line, nl)],
      [CX - nl * 0.62, nb - 3.3],
      [CX, nb],
      [CX + nl * 0.62, nb - 3.3],
      [CX + nl, shoulderY(line, nl)],
    ],
    8,
  );
  const shoulder = range(nl, ah, 8).map((d): Pt => [CX + d, shoulderY(line, d) - 0.05]);
  const armhole = spline(
    [
      [CX + ah, shoulderY(line, ah)],
      [CX + ah + 0.7, 87.5],
      [CX + ah + 3.6, 95.5],
      [CX + ah + 8, 104],
    ],
    8,
  );
  const right = [...shoulder, ...armhole.slice(1)];
  const body: Pt[] = [...neckline, ...right.slice(1), ...mirror(right).reverse()];
  add(out, 'jersey', poly(body), primary);

  const trimColour = numberColour(primary, secondary);
  const collar = strand(neckline, () => 1.7, 1);
  const holes = [strand(armhole, () => 1.3, 1), strand(mirror(armhole), () => 1.3, -1)];
  add(out, 'jersey.trim', join(poly(collar), ...holes.map(poly)), trimColour);
  if (num !== undefined) {
    add(out, 'jersey.number', numberPath(num, CX, nb + 3.4, 8.4), trimColour);
  }
}

export function staffClothes(ctx: Ctx, primary: string, secondary: string): void {
  const { f, out } = ctx;
  const n = f.neck;
  const line = shoulderLine(n);
  // Blazer over the shoulders, open in a V.
  const inset = n + 1.4;
  const right = line.filter(([d]) => d >= inset).map(([d, y]): Pt => [CX + d, y]);
  const blazer: Pt[] = [
    [CX + inset, shoulderY(line, inset)],
    ...right,
    [CX, 104],
    ...mirror(right).reverse(),
    [CX - inset, shoulderY(line, inset)],
  ];
  add(out, 'blazer', poly(blazer), INK.blazer);
  // Shirt front between the lapels.
  add(
    out,
    'shirt',
    poly([
      [CX - n - 1.6, 72.4],
      [CX + n + 1.6, 72.4],
      [CX + 1.2, 99.5],
      [CX - 1.2, 99.5],
    ]),
    INK.shirt,
  );
  // Collar band round the neck.
  add(
    out,
    'shirt.band',
    poly(
      band(
        CX - n - 0.4,
        CX + n + 0.4,
        (x) => 69.2 + 2.2 * (1 - ((x - CX) / (n + 0.4)) ** 2),
        (x) => 73.6 + 2.0 * (1 - ((x - CX) / (n + 0.4)) ** 2),
        16,
      ),
    ),
    INK.shirtShadow,
  );
  // Tie.
  add(
    out,
    'tie',
    join(
      poly([
        [CX - 1.05, 78.6],
        [CX + 1.05, 78.6],
        [CX + 2.4, 97.5],
        [CX, 100],
        [CX - 2.4, 97.5],
      ]),
    ),
    primary,
  );
  add(
    out,
    'tie.knot',
    poly([
      [CX - 1.7, 75.4],
      [CX + 1.7, 75.4],
      [CX + 1.15, 78.9],
      [CX - 1.15, 78.9],
    ]),
    tone(primary, -0.06),
  );
  // Collar points.
  const collarRight: Pt[] = [
    [CX + 0.9, 75.6],
    [CX + n + 0.2, 69.6],
    [CX + n + 2.6, 73.4],
    [CX + 4.8, 80.6],
  ];
  add(out, 'shirt.collar', join(poly(collarRight), poly(mirror(collarRight))), INK.shirt);
  // Lapels.
  const lapel: Pt[] = [
    [CX + inset - 0.1, shoulderY(line, inset) - 0.1],
    [CX + inset + 4.6, shoulderY(line, inset + 4.6)],
    [CX + 14.4, 86.6],
    [CX + 12.1, 87.4],
    [CX + 13.4, 89.2],
    [CX + 2.4, 100.5],
    [CX + 1.2, 99.5],
  ];
  add(out, 'blazer.lapel', join(poly(lapel), poly(mirror(lapel))), INK.blazerDark);
  add(out, 'blazer.pin', ellipse(CX - 11.6, 91.2, 0.85, 0.85), secondary);
}

/** A thin gold chain lying on the collarbones. */
export function chain(ctx: Ctx): void {
  const n = ctx.f.neck;
  const curve = spline(
    [
      [CX - n + 0.4, 72.5],
      [CX - n * 0.6, 78.4],
      [CX, 80.6],
      [CX + n * 0.6, 78.4],
      [CX + n - 0.4, 72.5],
    ],
    10,
  );
  const links: string[] = [];
  let acc = 0;
  for (let i = 1; i < curve.length; i++) {
    const a = curve[i - 1];
    const b = curve[i];
    if (a === undefined || b === undefined) continue;
    acc += Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (acc >= 0.62) {
      acc = 0;
      links.push(ellipse(b[0], b[1], 0.42, 0.42));
    }
  }
  add(ctx.out, 'chain', join(...links), INK.gold);
}
