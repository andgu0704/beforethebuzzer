/**
 * Worklet-safe maths shared by the play builder (JS thread) and the sampler (UI thread): cubic
 * Hermite splines with Catmull-Rom tangents over keyframes, and where a player carries the ball.
 * Everything here is plain arithmetic over plain arrays.
 */

import { MID_Y } from './court';

/** Distance from a player's centre to the ball in his hand, in feet. */
export const HAND = 1.55;
const HAND_COS = 0.766;
const HAND_SIN = 0.643;

/** Index of the keyframe segment holding time t (ts sorted, length ≥ 1). */
export function segmentAt(ts: readonly number[], t: number): number {
  'worklet';
  const n = ts.length;
  let i = 0;
  while (i < n - 2 && t > (ts[i + 1] ?? 0)) i++;
  return i;
}

/** Cubic Hermite interpolation of one coordinate at time t. */
export function hermite(
  ts: readonly number[],
  vs: readonly number[],
  ms: readonly number[],
  t: number,
): number {
  'worklet';
  const n = ts.length;
  if (n === 0) return 0;
  const first = ts[0] ?? 0;
  if (n === 1 || t <= first) return vs[0] ?? 0;
  const last = ts[n - 1] ?? 0;
  if (t >= last) return vs[n - 1] ?? 0;
  const i = segmentAt(ts, t);
  const t0 = ts[i] ?? 0;
  const h = (ts[i + 1] ?? 0) - t0;
  if (h <= 1e-9) return vs[i + 1] ?? 0;
  const u = (t - t0) / h;
  const u2 = u * u;
  const u3 = u2 * u;
  return (
    (2 * u3 - 3 * u2 + 1) * (vs[i] ?? 0) +
    (u3 - 2 * u2 + u) * h * (ms[i] ?? 0) +
    (-2 * u3 + 3 * u2) * (vs[i + 1] ?? 0) +
    (u3 - u2) * h * (ms[i + 1] ?? 0)
  );
}

/**
 * Tangents for a 2D keyframed path: Catmull-Rom, but zero where the player stops or turns back
 * and limited so the curve never overshoots a slow neighbour segment.
 */
export function tangents(
  ts: readonly number[],
  xs: readonly number[],
  ys: readonly number[],
): { mx: number[]; my: number[] } {
  const n = ts.length;
  const mx: number[] = new Array<number>(n).fill(0);
  const my: number[] = new Array<number>(n).fill(0);
  const v = (i: number): [number, number, number] => {
    const dt = Math.max(1e-6, (ts[i + 1] ?? 0) - (ts[i] ?? 0));
    const vx = ((xs[i + 1] ?? 0) - (xs[i] ?? 0)) / dt;
    const vy = ((ys[i + 1] ?? 0) - (ys[i] ?? 0)) / dt;
    return [vx, vy, Math.hypot(vx, vy)];
  };
  for (let i = 0; i < n; i++) {
    if (n < 2) break;
    if (i === 0 || i === n - 1) {
      const [vx, vy] = v(i === 0 ? 0 : n - 2);
      mx[i] = vx * 0.5;
      my[i] = vy * 0.5;
      continue;
    }
    const [px, py, ps] = v(i - 1);
    const [nx, ny, ns] = v(i);
    if (ps < 0.4 || ns < 0.4 || px * nx + py * ny <= 0) continue;
    const dt = Math.max(1e-6, (ts[i + 1] ?? 0) - (ts[i - 1] ?? 0));
    let tx = ((xs[i + 1] ?? 0) - (xs[i - 1] ?? 0)) / dt;
    let ty = ((ys[i + 1] ?? 0) - (ys[i - 1] ?? 0)) / dt;
    const limit = 1.4 * Math.min(ps, ns);
    const len = Math.hypot(tx, ty);
    if (len > limit) {
      tx *= limit / len;
      ty *= limit / len;
    }
    mx[i] = tx;
    my[i] = ty;
  }
  return { mx, my };
}

/** Where the ball sits in a player's hand: ahead of him toward the hoop he attacks. */
export function handX(px: number, py: number, hoopX: number): number {
  'worklet';
  const dx = hoopX - px;
  const dy = MID_Y - py;
  const d = Math.hypot(dx, dy);
  const ux = d < 0.01 ? Math.sign(hoopX - 47) : dx / d;
  const uy = d < 0.01 ? 0 : dy / d;
  return px + (ux * HAND_COS - uy * HAND_SIN) * HAND;
}

export function handY(px: number, py: number, hoopX: number): number {
  'worklet';
  const dx = hoopX - px;
  const dy = MID_Y - py;
  const d = Math.hypot(dx, dy);
  const ux = d < 0.01 ? Math.sign(hoopX - 47) : dx / d;
  const uy = d < 0.01 ? 0 : dy / d;
  return py + (ux * HAND_SIN + uy * HAND_COS) * HAND;
}

/** Height of a ball in flight: a parabola over the straight line between its ends. */
export function flightHeight(h0: number, h1: number, arc: number, u: number): number {
  'worklet';
  return h0 + (h1 - h0) * u + 4 * arc * u * (1 - u);
}

/** Height of a held or dribbled ball. */
export function heldHeight(
  t: number,
  t0: number,
  t1: number,
  hand: number,
  dribble: boolean,
  riseH: number,
  riseDur: number,
): number {
  'worklet';
  const riseFrom = t1 - riseDur;
  if (riseDur > 0 && t > riseFrom) {
    const u = Math.min(1, (t - riseFrom) / riseDur);
    return hand + (riseH - hand) * u * (2 - u);
  }
  if (!dribble) return hand;
  const env = Math.max(0, Math.min(1, (riseFrom - t) / 0.18, (t - t0) / 0.08));
  return hand - (hand - 0.35) * Math.abs(Math.sin((Math.PI * (t - t0)) / 0.48)) * env;
}
