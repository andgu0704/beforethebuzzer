/**
 * Small, pure path helpers for the portrait geometry. Every shape is built as a dense polygon
 * (or an arc for circles) in the 100×100 portrait box and serialised as SVG path data, so the
 * same strings feed Skia in the app, Skia in Node and plain SVG.
 */

export type Pt = readonly [number, number];

/** Index into a non-empty table, wrapping out-of-range indices. */
export function pick<T>(table: readonly T[], index: number): T {
  const n = table.length;
  const i = ((Math.floor(index) % n) + n) % n;
  const v = table[i];
  if (v === undefined) throw new Error('portrait: empty part table');
  return v;
}

export const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const smoothstep = (a: number, b: number, v: number): number => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
export const gauss = (v: number, mid: number, width: number): number =>
  Math.exp(-(((v - mid) / width) ** 2));

/** Rounds to two decimals; enough for a 240-pt portrait, short enough to parse quickly. */
export function num(n: number): string {
  const r = Math.round(n * 100) / 100;
  return Object.is(r, -0) ? '0' : String(r);
}

/** Twice the signed area; positive when the polygon runs clockwise on screen (y down). */
function signedArea(pts: readonly Pt[]): number {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % pts.length];
    if (p === undefined || q === undefined) continue;
    a += p[0] * q[1] - q[0] * p[1];
  }
  return a;
}

/**
 * A closed polygon, always written clockwise so that any polygons joined into one path union
 * under the non-zero rule. Fewer than three points gives an empty string, which callers drop.
 */
export function poly(pts: readonly Pt[]): string {
  if (pts.length < 3) return '';
  const ordered = signedArea(pts) < 0 ? [...pts].reverse() : pts;
  let s = '';
  ordered.forEach(([x, y], i) => {
    s += `${i === 0 ? 'M' : 'L'}${num(x)} ${num(y)}`;
  });
  return `${s}Z`;
}

/**
 * A hole: the same polygon written anticlockwise, so inside a path with clockwise outer
 * contours it cuts out under the non-zero rule (counters in numerals, lenses in frames).
 */
export function hole(pts: readonly Pt[]): string {
  if (pts.length < 3) return '';
  const ordered = signedArea(pts) > 0 ? [...pts].reverse() : pts;
  let s = '';
  ordered.forEach(([x, y], i) => {
    s += `${i === 0 ? 'M' : 'L'}${num(x)} ${num(y)}`;
  });
  return `${s}Z`;
}

/** Joins several sub-paths into one path string (all drawn with one paint). */
export function join(...parts: readonly string[]): string {
  return parts.filter((p) => p.length > 0).join('');
}

/** An axis-aligned ellipse (as a polygon, so it unions with the other shapes in a path). */
export function ellipse(cx: number, cy: number, rx: number, ry: number): string {
  if (rx <= 0 || ry <= 0) return '';
  const n = Math.round(clamp(Math.max(rx, ry) * 7, 20, 80));
  return poly(ellipsePts(cx, cy, rx, ry, 0, n));
}

export const circle = (cx: number, cy: number, r: number): string => ellipse(cx, cy, r, r);

/** A rotated ellipse as a polygon (angle in radians). */
export function ellipsePts(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  angle = 0,
  n = 28,
): Pt[] {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const x = Math.cos(t) * rx;
    const y = Math.sin(t) * ry;
    out.push([cx + x * c - y * s, cy + x * s + y * c]);
  }
  return out;
}

/** A rounded rectangle polygon. */
export function roundRectPts(x: number, y: number, w: number, h: number, r: number): Pt[] {
  const rr = Math.min(r, w / 2, h / 2);
  const out: Pt[] = [];
  const corner = (cx: number, cy: number, from: number) => {
    for (let i = 0; i <= 6; i++) {
      const a = from + (i / 6) * (Math.PI / 2);
      out.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
    }
  };
  corner(x + w - rr, y + rr, -Math.PI / 2);
  corner(x + w - rr, y + h - rr, 0);
  corner(x + rr, y + h - rr, Math.PI / 2);
  corner(x + rr, y + rr, Math.PI);
  return out;
}

/** Evenly spaced samples of [a, b], inclusive. */
export function range(a: number, b: number, n: number): number[] {
  const out: number[] = [];
  for (let i = 0; i <= n; i++) out.push(lerp(a, b, i / n));
  return out;
}

/**
 * The region between two curves over x: `top(x)` above, `bottom(x)` below. Where the bottom
 * would rise above the top the band pinches to nothing, which is how features are clipped to
 * an opening (an iris to the eyelids, teeth to the mouth) without boolean operations.
 */
export function band(
  x0: number,
  x1: number,
  top: (x: number) => number,
  bottom: (x: number) => number,
  n = 24,
): Pt[] {
  const xs = range(x0, x1, n);
  const tops = xs.map((x) => [x, top(x)] as const);
  const bottoms = xs.map((x, i) => [x, Math.max(bottom(x), tops[i]?.[1] ?? 0)] as const);
  return [...tops, ...bottoms.reverse()];
}

/** The region between two curves over y: `left(y)` and `right(y)`. */
export function vband(
  y0: number,
  y1: number,
  left: (y: number) => number,
  right: (y: number) => number,
  n = 24,
): Pt[] {
  const ys = range(y0, y1, n);
  const lefts = ys.map((y) => [left(y), y] as const);
  const rights = ys.map((y, i) => [Math.max(right(y), lefts[i]?.[0] ?? 0), y] as const);
  return [...rights, ...lefts.reverse()];
}

/** Mirrors points about the vertical line x = cx. */
export const mirror = (pts: readonly Pt[], cx = 50): Pt[] => pts.map(([x, y]) => [2 * cx - x, y]);

/**
 * A ribbon of varying width along a polyline: hair strands, locs, chains, collar trim.
 * `width(t)` gets t in [0, 1] along the line; `bias` shifts the ribbon to one side
 * (0 centred, 1 entirely on the left of the direction of travel).
 */
export function strand(line: readonly Pt[], width: (t: number) => number, bias = 0): Pt[] {
  const n = line.length;
  if (n < 2) return [];
  const left: Pt[] = [];
  const right: Pt[] = [];
  line.forEach((p, i) => {
    const a = line[Math.max(0, i - 1)] ?? p;
    const b = line[Math.min(n - 1, i + 1)] ?? p;
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const w = width(i / (n - 1));
    const l = (w / 2) * (1 + bias);
    const r = (w / 2) * (1 - bias);
    left.push([p[0] + nx * l, p[1] + ny * l]);
    right.push([p[0] - nx * r, p[1] - ny * r]);
  });
  return [...left, ...right.reverse()];
}

/** Samples a Catmull–Rom spline through `pts` (open curve). */
export function spline(pts: readonly Pt[], perSegment = 8): Pt[] {
  if (pts.length < 2) return [...pts];
  const out: Pt[] = [];
  const at = (i: number): Pt => pts[clamp(i, 0, pts.length - 1)] ?? [0, 0];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    for (let s = 0; s < perSegment; s++) {
      const t = s / perSegment;
      const t2 = t * t;
      const t3 = t2 * t;
      const c = (a: number, b: number, d: number, e: number) =>
        0.5 *
        (2 * b + (-a + d) * t + (2 * a - 5 * b + 4 * d - e) * t2 + (-a + 3 * b - 3 * d + e) * t3);
      out.push([c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(at(pts.length - 1));
  return out;
}

/**
 * Keeps the part of a polygon on one side of a line (Sutherland–Hodgman against one edge).
 * The kept side is where `a·x + b·y + c <= 0`.
 */
export function clipHalfPlane(pts: readonly Pt[], a: number, b: number, c: number): Pt[] {
  const out: Pt[] = [];
  const side = (p: Pt) => a * p[0] + b * p[1] + c;
  for (let i = 0; i < pts.length; i++) {
    const cur = pts[i];
    const prev = pts[(i + pts.length - 1) % pts.length];
    if (cur === undefined || prev === undefined) continue;
    const sc = side(cur);
    const sp = side(prev);
    if (sc <= 0) {
      if (sp > 0) out.push(intersect(prev, cur, sp, sc));
      out.push(cur);
    } else if (sp <= 0) {
      out.push(intersect(prev, cur, sp, sc));
    }
  }
  return out;
}

function intersect(p: Pt, q: Pt, sp: number, sq: number): Pt {
  const t = sp / (sp - sq);
  return [lerp(p[0], q[0], t), lerp(p[1], q[1], t)];
}

/** Keeps the part of a polygon above y = k. */
export const clipAbove = (pts: readonly Pt[], k: number): Pt[] => clipHalfPlane(pts, 0, 1, -k);
/** Keeps the part of a polygon below y = k. */
export const clipBelow = (pts: readonly Pt[], k: number): Pt[] => clipHalfPlane(pts, 0, -1, k);

/** Applies a transform to points. */
export const mapPts = (pts: readonly Pt[], fn: (p: Pt) => Pt): Pt[] => pts.map(fn);
