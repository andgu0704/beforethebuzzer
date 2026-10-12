/**
 * Shared endings for play scripts: the shot (make, miss, block), the strip and the picked-off
 * pass, and how everyone drifts afterwards. Templates author the set-up and hand over a Finish.
 */

import { HOOP_X_LEFT, MID_Y, RIM_HEIGHT, isThree, type CourtGeometry, type Spots } from './court';
import { PlayBuilder, dist, lerpP, toward, type P } from './builder';
import type { PlayResult, ShotType } from './types';

export type Role = 'shooter' | 'passer' | 'defender' | 'pain' | 'ft';

export type ShotKind =
  'layup' | 'dunk' | 'oop' | 'jumper' | 'three' | 'floater' | 'hook' | 'tip' | 'heave' | 'ft';

export interface Ctx {
  readonly geo: CourtGeometry;
  readonly s: Spots;
  readonly rng: () => number;
  readonly role: Role;
  readonly result: PlayResult;
  readonly shotType: ShotType | null;
  /** Shot clock length for the level. */
  readonly shotLen: number;
}

export interface Finish {
  readonly kind: 'finish';
  readonly user: number;
  readonly shooter: number;
  readonly release: number;
  readonly shot: ShotKind;
  readonly contester: number;
  /** When the contester leaves his guarding path to close out (default release − 0.45). */
  readonly closeFrom?: number;
  /** Contest distance override, centre to centre in feet. */
  readonly contestGap?: number;
  readonly noContest?: boolean;
  readonly blocker?: number;
  readonly stripper?: number;
  readonly stealAt?: number;
  /** The last pass before the shot, which a pick-off intercepts. */
  readonly pass?: {
    readonly from: number;
    readonly t0: number;
    readonly t1: number;
    readonly interceptor?: number;
  };
  readonly rebounder?: number;
  /** The defender jumps too early (a pump fake) instead of contesting. */
  readonly fake?: boolean;
  readonly shotStart?: number;
  readonly clockFrom?: number;
  readonly shotTo?: number;
  readonly shotClockOff?: boolean;
  readonly clockStopped?: boolean;
}

/** A finished script: what buildPlay needs beyond the builder. */
export interface Done {
  readonly kind: 'done';
  readonly user: number;
  readonly resultT: number;
  readonly end: number;
  readonly beat: readonly [number, number];
  /** Game clock runs from here (play seconds) until liveTo. */
  readonly clockFrom?: number;
  readonly liveTo: number;
  /** When the game clock should reach zero if the moment is in the final seconds. */
  readonly buzzerT?: number;
  readonly shotStart?: number;
  readonly shotTo?: number;
  readonly shotClockOff?: boolean;
  readonly clockStopped?: boolean;
}

export interface Scripted {
  readonly b: PlayBuilder;
  readonly out: Finish | Done;
}

interface Flight {
  readonly tf: number;
  readonly arc: number;
}

/** Release height for each kind of shot. */
export const RELEASE_H: Readonly<Record<ShotKind, number>> = {
  layup: 9.6,
  dunk: 10.9,
  oop: 11.2,
  jumper: 8.7,
  three: 8.7,
  floater: 9.3,
  hook: 9.9,
  tip: 10.8,
  heave: 8.4,
  ft: 8.3,
};

export function flightFor(kind: ShotKind, d: number): Flight {
  switch (kind) {
    case 'dunk':
    case 'oop':
      return { tf: 0.2, arc: 0.1 };
    case 'layup':
      return { tf: 0.3 + d * 0.035, arc: Math.max(0.8, d * 0.28) };
    case 'tip':
      return { tf: 0.32, arc: 1 };
    case 'floater':
      return { tf: 0.7 + d * 0.02, arc: 5.2 };
    case 'hook':
      return { tf: 0.5 + d * 0.02, arc: 2.4 + d * 0.12 };
    case 'heave':
      return { tf: 0.6 + d * 0.025, arc: 12.5 };
    case 'ft':
      return { tf: 0.9, arc: 4.3 };
    case 'jumper':
    case 'three':
      return { tf: 0.42 + d * 0.027, arc: 3 + d * 0.2 };
  }
}

const RISE_DUR = 0.28;

/**
 * The shooter gathers, rises and lets go at `release`. He holds the ball from wherever the
 * chain stands until the gather; pass `dribble` to keep dribbling until then.
 */
export function rise(
  b: PlayBuilder,
  a: number,
  release: number,
  kind: ShotKind,
  o: { dribble?: boolean; gather?: number } = {},
): void {
  const gather = o.gather ?? 0.14;
  b.hold(a, release - RISE_DUR - gather, { dribble: o.dribble ?? false });
  b.hold(a, release - RISE_DUR, {});
  b.hold(a, release, { rise: [RELEASE_H[kind], RISE_DUR] });
  if (kind !== 'ft') b.jump(a, release - RISE_DUR, release + 0.32, kind === 'dunk' ? 1.2 : 0.8);
}

/** Start positions: offense given, each defender between his man and the basket. */
export function begin(c: Ctx, off: readonly P[], def?: readonly (P | null)[]): PlayBuilder {
  const hoop: P = [88.75, MID_Y];
  const all: P[] = [...off];
  for (let i = 0; i < 5; i++) {
    const m = off[i] ?? [60, MID_Y];
    all.push(def?.[i] ?? toward(m, hoop, i === 0 ? 3.4 : Math.min(6, dist(m, hoop) * 0.3)));
  }
  return new PlayBuilder(c.geo, c.s, all);
}

/** Each defender guards his man (5 + i guards i) except those listed. */
export function guardAll(b: PlayBuilder, t0: number, t1: number, except: readonly number[] = []) {
  for (let i = 0; i < 5; i++) {
    if (!except.includes(5 + i)) b.guard(5 + i, i, t0, t1);
  }
}

function clampCourt(p: P, margin = 1): P {
  return [
    Math.max(margin, Math.min(94 - margin, p[0])),
    Math.max(margin, Math.min(50 - margin, p[1])),
  ];
}

function rot(v: P, ang: number): P {
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  return [v[0] * c - v[1] * s, v[0] * s + v[1] * c];
}

function unit(a: P, b: P): P {
  const d = dist(a, b);
  return d < 1e-6 ? [1, 0] : [(b[0] - a[0]) / d, (b[1] - a[1]) / d];
}

/** Everyone without a later keyframe drifts to fn(actor, position) by `end`. */
function settle(b: PlayBuilder, from: number, end: number, fn: (a: number, p: P) => P): void {
  for (let a = 0; a < 10; a++) {
    if (b.lastT(a) > end - 0.3) continue;
    const t = Math.max(from, b.lastT(a));
    const p = b.pos(a, t);
    b.wait(a, t);
    b.key(a, end, clampCourt(fn(a, p), 1.2));
  }
}

/** Defensive (or offensive) actor nearest a point at time t. */
function nearest(b: PlayBuilder, team: 0 | 1, p: P, t: number, except: number[]): number {
  let best = team === 0 ? 0 : 5;
  let bestD = Infinity;
  for (let a = team * 5; a < team * 5 + 5; a++) {
    if (except.includes(a)) continue;
    const d = dist(b.pos(a, t), p);
    if (d < bestD) {
      bestD = d;
      best = a;
    }
  }
  return best;
}

/** After a turnover: the new ball handler runs the other way, everyone turns and follows. */
function runOut(c: Ctx, b: PlayBuilder, handler: number, from: number): number {
  const start = b.pos(handler, from);
  const laneY = start[1] + (MID_Y - start[1]) * 0.5;
  const end = from + 2.5;
  const p1: P = [Math.max(14, start[0] - 13), laneY];
  const p2: P = [Math.max(10, start[0] - 27), MID_Y + (laneY - MID_Y) * 0.4];
  b.key(handler, from + 1.2, p1).key(handler, end, p2);
  b.hold(handler, end, { dribble: true, hoopX: HOOP_X_LEFT });
  b.camTurns.push({ t: from, dir: -1 });
  for (let a = 0; a < 10; a++) {
    if (a === handler) continue;
    const p = b.pos(a, from + 0.15);
    const sameTeam = a < 5 === handler < 5;
    const run = sameTeam ? 14 + c.rng() * 5 : 11 + c.rng() * 4;
    b.cut(a, from + 0.15);
    const target: P = [Math.max(6, p[0] - run), p[1] + (MID_Y - p[1]) * (sameTeam ? 0.15 : 0.35)];
    b.key(a, end, clampCourt(target, 1.5));
  }
  return end;
}

function strip(c: Ctx, b: PlayBuilder, f: Finish, ts: number): Done {
  const stripper = f.stripper ?? f.contester;
  const carrier = b.holder(ts) >= 0 ? b.holder(ts) : f.shooter;
  const cp = b.pos(carrier, ts);
  const hand = b.resolve({ a: carrier, h: 2.4 }, ts);
  const sp = b.pos(stripper, Math.max(0, ts - 0.35));
  b.cutBall(ts);
  b.cut(stripper, Math.max(0, ts - 0.35));
  const reach = toward([hand.x, hand.y], sp, 2.6);
  b.key(stripper, ts, reach);
  const away = unit(cp, [hand.x, hand.y]);
  const loose = clampCourt(
    [hand.x + away[0] * 1.5 - 3, hand.y + (reach[1] - cp[1]) * 0.6 + away[1] * 1.5],
    2,
  );
  b.fly({ x: loose[0], y: loose[1], h: 0.7 }, ts + 0.3, 0.6);
  const grab = toward(loose, reach, 1.4);
  b.key(stripper, ts + 0.45, grab);
  b.fly({ a: stripper, h: 2.6 }, ts + 0.45, 0.5);
  b.cut(carrier, ts);
  b.key(carrier, ts + 0.4, toward(cp, b.hoop, -0.8));
  b.contest(stripper, ts - 0.35, ts + 0.2, 0.8);
  b.phase(ts, c.role === 'defender' ? 'steal' : 'stripped');
  const end = runOut(c, b, stripper, ts + 0.45);
  return {
    kind: 'done',
    user: f.user,
    resultT: ts,
    end,
    beat: [ts - 0.8, ts + 1.2],
    liveTo: ts,
    ...clockBits(f),
  };
}

function pickoff(c: Ctx, b: PlayBuilder, f: Finish): Done {
  const pass = f.pass;
  if (!pass) return strip(c, b, f, f.stealAt ?? f.release - 0.6);
  const receiver = b.holder(pass.t1);
  const ic = pass.interceptor ?? (receiver >= 0 && receiver < 5 ? receiver + 5 : f.contester);
  const a = b.resolve({ a: pass.from, h: 3.6 }, pass.t0);
  const r = receiver >= 0 ? b.pos(receiver, pass.t1) : b.hoop;
  const ti = pass.t0 + (pass.t1 - pass.t0) * 0.6;
  const ip = lerpP([a.x, a.y], r, 0.6);
  const prev = b.pos(ic, Math.max(0, ti - 0.5));
  b.cutBall(pass.t0);
  b.cut(ic, Math.max(0, ti - 0.5));
  const at = toward(ip, prev, 1.2);
  b.key(ic, ti, at);
  b.jump(ic, ti - 0.2, ti + 0.25, 0.6);
  b.fly({ a: ic, h: 4.2 }, ti, 0.4);
  b.contest(ic, ti - 0.4, ti + 0.15, 0.8);
  if (receiver >= 0) {
    b.cut(receiver, pass.t1);
  }
  b.phase(ti, c.role === 'defender' ? 'steal' : 'pickedOff');
  const end = runOut(c, b, ic, ti + 0.1);
  return {
    kind: 'done',
    user: f.user,
    resultT: ti,
    end,
    beat: [pass.t0 - 0.6, ti + 1.2],
    liveTo: ti,
    ...clockBits(f),
  };
}

function clockBits(f: Finish): Partial<Done> {
  const o: {
    -readonly [K in keyof Done]?: Done[K];
  } = {};
  if (f.shotStart !== undefined) o.shotStart = f.shotStart;
  if (f.clockFrom !== undefined) o.clockFrom = f.clockFrom;
  if (f.shotTo !== undefined) o.shotTo = f.shotTo;
  if (f.shotClockOff) o.shotClockOff = true;
  if (f.clockStopped) o.clockStopped = true;
  return o;
}

/** Turn a template's Finish into the full ending for the play's result. */
export function resolveFinish(c: Ctx, b: PlayBuilder, f: Finish): Done {
  if (c.result === 'strip') {
    if (f.stealAt !== undefined) return strip(c, b, f, f.stealAt);
    return pickoff(c, b, f);
  }
  if (c.result === 'pickoff') return pickoff(c, b, f);
  return shoot(c, b, f);
}

function shoot(c: Ctx, b: PlayBuilder, f: Finish): Done {
  const H = b.hoop;
  const rel = b.resolve({ a: f.shooter, h: RELEASE_H[f.shot] }, f.release);
  const relP: P = [rel.x, rel.y];
  const d = dist(relP, H);
  const fl = flightFor(f.shot, d);
  const tr = f.release + fl.tf;
  const result = c.result;
  const made = result === 'make' || result === 'foulMake' || result === 'ftBoth';
  const blocked = result === 'block';
  const shooterP = b.pos(f.shooter, f.release);
  const pts = f.shot === 'ft' ? 1 : isThree(c.geo, shooterP[0], shooterP[1], H[0]) ? 3 : 2;
  const shotPhase = `shot_${f.shot}`;
  b.phase(f.release - 0.3, shotPhase);

  // The contest.
  if (!f.noContest && !blocked) {
    const late = made;
    const gap = f.contestGap ?? (late ? 3.9 : 3.1);
    const from = f.fake
      ? Math.min(f.closeFrom ?? f.release, f.release - 0.9)
      : (f.closeFrom ?? f.release - 0.45);
    b.cut(f.contester, from);
    const spot = toward(shooterP, H, Math.min(gap, Math.max(3, d * 0.75)));
    if (f.fake) {
      b.key(f.contester, f.release - 0.5, toward(shooterP, H, 3.4));
      b.jump(f.contester, f.release - 0.75, f.release - 0.2, 1);
      b.contest(f.contester, f.release - 0.8, f.release - 0.3, 0.6);
    } else {
      b.key(f.contester, f.release + (late ? 0.12 : 0), spot);
      b.jump(f.contester, f.release - 0.12, f.release + 0.42, late ? 0.6 : 0.95);
      b.contest(f.contester, f.release - 0.55, f.release + 0.35, late ? 0.55 : 1);
    }
  }

  const sideSign = shooterP[1] > MID_Y ? 1 : -1;

  if (blocked) {
    const blocker = f.blocker ?? f.contester;
    const close = f.shot === 'layup' || f.shot === 'dunk' || f.shot === 'oop' || f.shot === 'tip';
    const u = close ? 0.45 : f.shot === 'floater' ? 0.22 : 0.14;
    const tb = f.release + fl.tf * u;
    const bp = lerpP(relP, H, u);
    const hb = rel.h + (RIM_HEIGHT - rel.h) * u + 4 * fl.arc * u * (1 - u);
    const dir = unit(relP, H);
    const bpos = toward(bp, [bp[0] + dir[0] - dir[1] * 0.4, bp[1] + dir[1] + dir[0] * 0.4], 1.5);
    const from = f.closeFrom ?? f.release - 0.5;
    b.cut(blocker, from);
    b.key(blocker, tb, bpos);
    b.jump(blocker, tb - 0.32, tb + 0.38, 1.25);
    b.contest(blocker, f.release - 0.45, tb + 0.3, 1);
    b.fly({ x: bp[0], y: bp[1], h: hb }, tb, fl.arc * u * u);
    const out = rot([-dir[0], -dir[1]], sideSign * (0.9 + c.rng() * 0.4));
    const sw = clampCourt([bp[0] + out[0] * 12, bp[1] + out[1] * 12], 2);
    const sw2 = clampCourt([sw[0] + out[0] * 5, sw[1] + out[1] * 5], 2.5);
    b.fly({ x: sw[0], y: sw[1], h: 0 }, tb + 0.42, 1.1);
    b.fly({ x: sw2[0], y: sw2[1], h: 0 }, tb + 0.95, 1.2);
    const rec = nearest(b, 1, sw2, tb, [blocker]);
    b.cut(rec, tb);
    b.key(rec, tb + 1.25, toward(sw2, b.pos(rec, tb), 1.2));
    b.fly({ a: rec, h: 2.4 }, tb + 1.3, 0.4);
    const end = tb + 2.2;
    b.hold(rec, end, { hoopX: HOOP_X_LEFT });
    b.key(rec, end, clampCourt([sw2[0] - 4, sw2[1] + (MID_Y - sw2[1]) * 0.3], 2));
    b.phase(tb, c.role === 'defender' ? 'block' : 'blocked');
    settle(b, tb, end, (a, p) => toward(p, sw2, a < 5 ? 2 : 3));
    return {
      kind: 'done',
      user: f.user,
      resultT: tb,
      end,
      beat: [f.release - 0.7, tb + 0.9],
      liveTo: tb,
      buzzerT: tb,
      ...clockBits(f),
    };
  }

  if (made) {
    b.fly({ x: H[0], y: H[1], h: RIM_HEIGHT }, tr, fl.arc);
    b.fly({ x: H[0] + 0.15, y: H[1], h: 4.4 }, tr + 0.28, 0);
    b.fly({ x: H[0] + 0.9, y: H[1] + sideSign * 0.7, h: 0 }, tr + 0.55, 0);
    b.fly({ x: H[0] - 1.4, y: H[1] + sideSign * 2.4, h: 0 }, tr + 1.0, 1.3);
    b.fly({ x: H[0] - 3, y: H[1] + sideSign * 3.6, h: 0 }, tr + 1.45, 0.45);
    b.scores.push({ t: tr, team: 0, pts });
    b.nets.push(tr);
    b.phase(
      tr,
      f.shot === 'ft'
        ? 'ftBoth'
        : result === 'foulMake'
          ? 'foulMake'
          : c.role === 'defender'
            ? 'scored'
            : 'make',
    );
    const end = tr + 1.6;
    b.rest(end);
    settle(b, tr, end, (a, p) => [p[0] - (a < 5 ? 4.5 : 2), p[1] + (MID_Y - p[1]) * 0.08]);
    return {
      kind: 'done',
      user: f.user,
      resultT: tr,
      end,
      beat: [f.release - 0.75, tr + 0.6],
      liveTo: tr,
      buzzerT: f.release + fl.tf * 0.55,
      ...clockBits(f),
    };
  }

  // A miss: off the back of the rim and out to a rebounder.
  const dir = unit(relP, H);
  const contact: P = [H[0] + dir[0] * 0.75, H[1] + dir[1] * 0.75];
  b.fly({ x: contact[0], y: contact[1], h: RIM_HEIGHT + 0.1 }, tr, fl.arc);
  const long = d > 18;
  const ang = (c.rng() < 0.5 ? 1 : -1) * (0.45 + c.rng() * 0.6);
  const back = rot([-dir[0], -dir[1]], ang);
  const len = long ? 8.5 + c.rng() * 3 : 6 + c.rng() * 2;
  const rs = clampCourt([H[0] + back[0] * len, H[1] + back[1] * len], 3);
  const trb = tr + 0.62 + len * 0.02;
  const rebounder = f.rebounder ?? nearest(b, 1, rs, f.release, []);
  const rp = b.pos(rebounder, Math.max(0, tr - 0.4));
  b.cut(rebounder, Math.max(0, tr - 0.4));
  b.key(rebounder, trb, toward(rs, rp, 0.9));
  b.jump(rebounder, trb - 0.35, trb + 0.25, 1);
  b.fly({ a: rebounder, h: 8.8 }, trb, 2.6);
  const end = trb + 1.3;
  const team = rebounder < 5 ? 0 : 1;
  b.hold(rebounder, end, team === 1 ? { hoopX: HOOP_X_LEFT } : {});
  if (team === 1) b.key(rebounder, end, clampCourt([rs[0] - 5, rs[1] + (MID_Y - rs[1]) * 0.4], 2));
  b.phase(tr, f.shot === 'ft' ? 'ftSplit' : c.role === 'defender' ? 'stop' : 'miss');
  settle(b, tr, end, (a, p) => {
    const q = toward(p, rs, a < 5 ? 2.5 : 3);
    return [q[0] - (a >= 5 ? 1.5 : 0), q[1]];
  });
  return {
    kind: 'done',
    user: f.user,
    resultT: tr,
    end,
    beat: [f.release - 0.75, tr + 0.7],
    liveTo: tr,
    buzzerT: f.release + fl.tf * 0.55,
    ...clockBits(f),
  };
}
