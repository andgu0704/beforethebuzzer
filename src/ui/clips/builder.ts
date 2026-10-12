/**
 * Authoring tools for play scripts (JS thread only). Templates add keyframes for the ten actors
 * and a contiguous chain of ball operations; `finalise` flattens everything into a Play.
 */

import { COURT_WIDTH, HOOP_X, MID_Y, type CourtGeometry, type Spots } from './court';
import { flightHeight, handX, handY, hermite, tangents } from './track';

export type P = readonly [number, number];

/** A ball end: in an actor's hand at a height, or a fixed point. */
export type End =
  | { readonly a: number; readonly h: number }
  | { readonly x: number; readonly y: number; readonly h: number };

interface Key {
  t: number;
  x: number;
  y: number;
}

interface HoldOp {
  readonly kind: 'hold';
  readonly a: number;
  t0: number;
  t1: number;
  readonly dribble: boolean;
  readonly hand: number;
  riseH: number;
  riseDur: number;
  readonly hoopX: number;
}

interface FlyOp {
  readonly kind: 'fly';
  t0: number;
  t1: number;
  from: End;
  to: End;
  arc: number;
}

type BallOp = HoldOp | FlyOp;

export interface HoldOptions {
  readonly dribble?: boolean;
  readonly hand?: number;
  readonly rise?: readonly [height: number, seconds: number];
  readonly hoopX?: number;
}

export const HAND_HEIGHT = 3.6;
/** Closest two players' centres come while guarding, in feet. */
const SEPARATION = 3.1;

/** Camera centre limits: the view is about 55 ft wide and stops 2 ft past either baseline. */
export const CAMERA_HALF_SPAN = 27.7;
export const CAMERA_MIN_X = -2 + CAMERA_HALF_SPAN;
export const CAMERA_MAX_X = 96 - CAMERA_HALF_SPAN;

export function dist(a: P, b: P): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

export function lerpP(a: P, b: P, u: number): P {
  return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
}

/** Point at distance d from a toward b. */
export function toward(a: P, b: P, d: number): P {
  const l = dist(a, b);
  if (l < 1e-6) return a;
  return [a[0] + ((b[0] - a[0]) / l) * d, a[1] + ((b[1] - a[1]) / l) * d];
}

export class PlayBuilder {
  readonly keys: Key[][] = [];
  readonly lifts: { a: number; t0: number; t1: number; amp: number; plateau: boolean }[] = [];
  readonly ops: BallOp[] = [];
  readonly contests: { a: number; t0: number; t1: number; s: number }[] = [];
  readonly phases: { t: number; key: string }[] = [];
  readonly scores: { t: number; team: 0 | 1; pts: number }[] = [];
  readonly nets: number[] = [];
  /** When the ball changes direction (a turnover), the camera leads the other way. */
  readonly camTurns: { t: number; dir: number }[] = [];
  readonly hoop: P;

  constructor(
    readonly geo: CourtGeometry,
    readonly spots: Spots,
    start: readonly P[],
  ) {
    for (let a = 0; a < 10; a++) {
      const p = start[a] ?? [47, MID_Y];
      this.keys.push([{ t: 0, x: p[0], y: p[1] }]);
    }
    this.hoop = [HOOP_X, MID_Y];
  }

  private track(a: number): Key[] {
    const k = this.keys[a];
    if (!k) throw new Error(`no actor ${a}`);
    return k;
  }

  // ------------------------------------------------------------------ actors

  key(a: number, t: number, p: P): this {
    const k = this.track(a);
    const i = k.findIndex((e) => Math.abs(e.t - t) < 0.02);
    if (i >= 0) {
      k[i] = { t, x: p[0], y: p[1] };
      return this;
    }
    k.push({ t, x: p[0], y: p[1] });
    k.sort((u, v) => u.t - v.t);
    return this;
  }

  /** Several keyframes: [t, x, y] each. */
  path(a: number, pts: readonly (readonly [number, number, number])[]): this {
    for (const [t, x, y] of pts) this.key(a, t, [x, y]);
    return this;
  }

  /** Stay where the last keyframe left the actor until t. */
  wait(a: number, t: number): this {
    const k = this.track(a);
    const last = k[k.length - 1];
    if (last && t > last.t) k.push({ t, x: last.x, y: last.y });
    return this;
  }

  lastT(a: number): number {
    const k = this.track(a);
    return k[k.length - 1]?.t ?? 0;
  }

  pos(a: number, t: number): P {
    const k = this.track(a);
    const ts = k.map((e) => e.t);
    const xs = k.map((e) => e.x);
    const ys = k.map((e) => e.y);
    const { mx, my } = tangents(ts, xs, ys);
    return [hermite(ts, xs, mx, t), hermite(ts, ys, my, t)];
  }

  /** Drop everything after t, keeping the actor where he was at t. */
  cut(a: number, t: number): this {
    const p = this.pos(a, t);
    const k = this.track(a).filter((e) => e.t < t - 0.02);
    k.push({ t, x: p[0], y: p[1] });
    this.keys[a] = k;
    return this;
  }

  /** Remove keyframes strictly inside (t0, t1). */
  clear(a: number, t0: number, t1: number): this {
    this.keys[a] = this.track(a).filter((e) => e.t <= t0 + 0.02 || e.t >= t1 - 0.02);
    return this;
  }

  jump(a: number, t0: number, t1: number, amp = 1): this {
    this.lifts.push({ a, t0, t1, amp, plateau: false });
    return this;
  }

  /** Crouch or fall: a held negative lift. */
  down(a: number, t0: number, t1: number, amp = -1): this {
    this.lifts.push({ a, t0, t1, amp, plateau: true });
    return this;
  }

  contest(a: number, t0: number, t1: number, s = 1): this {
    this.contests.push({ a, t0, t1, s });
    return this;
  }

  phase(t: number, key: string): this {
    this.phases.push({ t, key });
    return this;
  }

  /**
   * Keep a defender between his man and the basket from t0 to t1: tight on the ball, sagging
   * and shading toward the ball off it.
   */
  guard(
    d: number,
    man: number,
    t0: number,
    t1: number,
    o: { gap?: number; offGap?: number; lag?: number; help?: number } = {},
  ): this {
    this.clear(d, t0, t1 + 0.05);
    const lag = o.lag ?? 0.15;
    const steps = Math.max(1, Math.round((t1 - t0) / 0.25));
    for (let s = 0; s <= steps; s++) {
      const t = t0 + ((t1 - t0) * s) / steps;
      const m = this.pos(man, Math.max(0, t - lag));
      const toHoop = dist(m, this.hoop);
      const onBall = this.holder(t) === man;
      let gap = onBall ? (o.gap ?? 3.3) : (o.offGap ?? Math.min(toHoop * 0.42, 4 + toHoop * 0.12));
      gap = Math.max(1.2, Math.min(gap, toHoop - 1.6));
      let p = toward(m, this.hoop, gap);
      if (!onBall) {
        const b = this.ballPoint(t);
        p = lerpP(p, b, o.help ?? 0.16);
      }
      // Never stand on top of the man: keep a body's width from where he is now.
      const now = this.pos(man, t);
      const sep = dist(p, now);
      if (sep < SEPARATION) {
        const away: P =
          sep > 0.05
            ? [(p[0] - now[0]) / sep, (p[1] - now[1]) / sep]
            : [0.6, now[1] > MID_Y ? -0.8 : 0.8];
        p = [now[0] + away[0] * SEPARATION, now[1] + away[1] * SEPARATION];
      }
      this.key(d, t, p);
    }
    return this;
  }

  // ------------------------------------------------------------------ ball

  ballEnd(): number {
    return this.ops[this.ops.length - 1]?.t1 ?? 0;
  }

  private lastEnd(): End {
    const op = this.ops[this.ops.length - 1];
    if (!op) throw new Error('the ball has no owner yet');
    if (op.kind === 'fly') return op.to;
    return { a: op.a, h: op.riseDur > 0 ? op.riseH : op.hand };
  }

  /** The actor holds (or dribbles) the ball until t1. */
  hold(a: number, t1: number, o: HoldOptions = {}): this {
    const t0 = this.ballEnd();
    const prev = this.ops[this.ops.length - 1];
    if (prev?.kind === 'hold' && prev.a === a && prev.riseDur === 0 && !o.rise) {
      if ((o.dribble ?? false) === prev.dribble) {
        prev.t1 = Math.max(prev.t1, t1);
        return this;
      }
    }
    if (t1 <= t0) return this;
    this.ops.push({
      kind: 'hold',
      a,
      t0,
      t1,
      dribble: o.dribble ?? false,
      hand: o.hand ?? HAND_HEIGHT,
      riseH: o.rise?.[0] ?? 0,
      riseDur: o.rise?.[1] ?? 0,
      hoopX: o.hoopX ?? HOOP_X,
    });
    return this;
  }

  fly(to: End, t1: number, arc: number): this {
    const t0 = this.ballEnd();
    if (t1 <= t0) return this;
    this.ops.push({ kind: 'fly', t0, t1, from: this.lastEnd(), to, arc });
    return this;
  }

  /** A pass from whoever holds the ball (held until t0) to an actor, caught at t1. */
  pass(
    from: number,
    to: number,
    t0: number,
    t1: number,
    o: { arc?: number; h?: number; bounce?: boolean; dribble?: boolean } = {},
  ): this {
    this.hold(from, t0, { dribble: o.dribble ?? false });
    const h = o.h ?? HAND_HEIGHT;
    if (o.bounce) {
      const a = this.pos(from, t0);
      const b = this.pos(to, t1);
      const m = lerpP(a, b, 0.58);
      const tm = t0 + (t1 - t0) * 0.55;
      this.fly({ x: m[0], y: m[1], h: 0 }, tm, 0.2);
      return this.fly({ a: to, h }, t1, 0.3);
    }
    return this.fly({ a: to, h }, t1, o.arc ?? 0.7);
  }

  /** Ball stays at rest (on the floor or in a hand at a fixed point) until t1. */
  rest(t1: number): this {
    const e = this.resolve(this.lastEnd(), this.ballEnd());
    return this.fly({ x: e.x, y: e.y, h: e.h }, t1, 0);
  }

  /** Who has the ball at time t: the holder, the receiver of a pass in flight, or −1. */
  holder(t: number): number {
    for (const op of this.ops) {
      if (t < op.t0 || t > op.t1) continue;
      if (op.kind === 'hold') return op.a;
      return 'a' in op.to ? op.to.a : -1;
    }
    const last = this.ops[this.ops.length - 1];
    if (last && t > last.t1) return last.kind === 'hold' ? last.a : 'a' in last.to ? last.to.a : -1;
    return -1;
  }

  private hoopFor(a: number, t: number): number {
    for (const op of this.ops) {
      if (op.kind === 'hold' && op.a === a && t >= op.t0 - 0.05 && t <= op.t1 + 0.6) {
        return op.hoopX;
      }
    }
    return HOOP_X;
  }

  resolve(e: End, t: number): { x: number; y: number; h: number } {
    if ('a' in e) {
      const p = this.pos(e.a, t);
      const hx = this.hoopFor(e.a, t);
      return { x: handX(p[0], p[1], hx), y: handY(p[0], p[1], hx), h: e.h };
    }
    return e;
  }

  /** Approximate ball position at t (floor plan only). */
  ballPoint(t: number): P {
    for (const op of this.ops) {
      if (t < op.t0 || t > op.t1) continue;
      if (op.kind === 'hold') return this.pos(op.a, t);
      const a = this.resolve(op.from, op.t0);
      const b = this.resolve(op.to, op.t1);
      const u = (t - op.t0) / Math.max(1e-6, op.t1 - op.t0);
      return [a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * u];
    }
    const last = this.ops[this.ops.length - 1];
    if (!last) return [this.hoop[0] - 25, MID_Y];
    if (last.kind === 'hold') return this.pos(last.a, t);
    const e = this.resolve(last.to, last.t1);
    return [e.x, e.y];
  }

  /** Full ball position at t, as the sampler will draw it for flights. */
  ballAt(t: number): { x: number; y: number; h: number } {
    for (const op of this.ops) {
      if (t < op.t0 || t > op.t1 || op.kind === 'hold') continue;
      const a = this.resolve(op.from, op.t0);
      const b = this.resolve(op.to, op.t1);
      const u = (t - op.t0) / Math.max(1e-6, op.t1 - op.t0);
      return {
        x: a.x + (b.x - a.x) * u,
        y: a.y + (b.y - a.y) * u,
        h: flightHeight(a.h, b.h, op.arc, u),
      };
    }
    const p = this.ballPoint(t);
    return { x: p[0], y: p[1], h: HAND_HEIGHT };
  }

  /** End the ball chain at t; a flight in progress is shortened to where the ball was. */
  cutBall(t: number): this {
    while (this.ops.length > 0) {
      const op = this.ops[this.ops.length - 1];
      if (!op || op.t0 < t) break;
      this.ops.pop();
    }
    const op = this.ops[this.ops.length - 1];
    if (!op || op.t1 <= t) return this;
    if (op.kind === 'hold') {
      op.t1 = t;
      op.riseDur = 0;
      return this;
    }
    const a = this.resolve(op.from, op.t0);
    const b = this.resolve(op.to, op.t1);
    const u = (t - op.t0) / Math.max(1e-6, op.t1 - op.t0);
    op.from = a;
    op.to = {
      x: a.x + (b.x - a.x) * u,
      y: a.y + (b.y - a.y) * u,
      h: flightHeight(a.h, b.h, op.arc, u),
    };
    op.arc *= u * u;
    op.t1 = t;
    return this;
  }

  // ------------------------------------------------------------------ output

  /** Flip the play across the long axis. */
  mirror(): void {
    for (const k of this.keys) for (const e of k) e.y = COURT_WIDTH - e.y;
    const flip = (e: End): End => ('a' in e ? e : { x: e.x, y: COURT_WIDTH - e.y, h: e.h });
    for (const op of this.ops) {
      if (op.kind === 'fly') {
        op.from = flip(op.from);
        op.to = flip(op.to);
      }
    }
  }

  /** Nudge each actor's first keyframe by up to `amount` feet. */
  jitter(next: () => number, amount: number, actors: readonly number[]): void {
    for (const a of actors) {
      const k = this.track(a);
      const first = k[0];
      const second = k[1];
      if (!first) continue;
      const dx = (next() * 2 - 1) * amount;
      const dy = (next() * 2 - 1) * amount;
      first.x += dx;
      first.y += dy;
      if (second && second.t < 0.5) {
        second.x += dx * 0.5;
        second.y += dy * 0.5;
      }
    }
  }
}
