/**
 * 2D clip plays (PLAN.md §12). `buildPlay` turns a moment's ClipSpec into a Play: ten actors and
 * the ball as keyframed splines, contest rings, clocks, score and phase labels, all as plain
 * arrays. `sample` reads one frame from it; it is a worklet, so Reanimated can drive it on the
 * UI thread with no React work per frame. Pure TypeScript: no React, no Skia.
 */

import { COURTS, HOOP_X, spotsFor, type CourtGeometry, type CourtKind } from './court';
import { CAMERA_MAX_X, CAMERA_MIN_X, HAND_HEIGHT, type PlayBuilder } from './builder';
import { resolveFinish, type Ctx, type Done, type Role } from './finish';
import { DEFENSE_TEMPLATES, PASS_TEMPLATES, TEMPLATES } from './templates';
import { flightHeight, handX, handY, heldHeight, hermite, tangents } from './track';
import type {
  BallTrack,
  ClipOutcome,
  FrameState,
  Play,
  PlayParams,
  PlayResult,
  PlaySpec,
} from './types';

export type { FrameState, Play, PlayParams, PlayResult, PlaySpec } from './types';
export { COURTS, isThree, spotsFor, type CourtGeometry, type CourtKind } from './court';

/** Every template id the renderer knows. */
export const PLAY_TEMPLATES: readonly string[] = Object.keys(TEMPLATES);

export const MIN_DURATION = 5.2;
export const MAX_DURATION = 10;

// ---------------------------------------------------------------- spec → script

/** A small seeded generator (mulberry32) for variations. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** The template to draw: the spec's own, or the closest one for an unknown id. */
export function templateFor(spec: PlaySpec): string {
  if (spec.template in TEMPLATES) return spec.template;
  if (spec.outcome === 'pain') return 'checkup';
  if (spec.outcome === 'stop' || spec.outcome === 'scored') return 'block';
  switch (spec.shotType) {
    case 'three':
      return 'catch_shoot_three';
    case 'mid':
      return 'iso_pullup';
    case 'post':
      return 'post_up';
    default:
      return 'drive_layup';
  }
}

export function roleFor(template: string, spec: PlaySpec, params: PlayParams): Role {
  if (template === 'checkup') return 'pain';
  if (template === 'free_throws') return 'ft';
  if (DEFENSE_TEMPLATES.includes(template)) return 'defender';
  if (params.userRole) return params.userRole;
  if (spec.outcome === 'assist' || spec.outcome === 'turnover') return 'passer';
  if (PASS_TEMPLATES.includes(template) && spec.outcome !== 'make') return 'passer';
  return 'shooter';
}

export function resultFor(template: string, outcome: ClipOutcome, success: boolean): PlayResult {
  if (template === 'checkup') return success ? 'playThrough' : 'sit';
  if (template === 'free_throws') {
    return outcome === 'make' || outcome === 'assist' || (success && outcome !== 'miss')
      ? 'ftBoth'
      : 'ftSplit';
  }
  const defense = DEFENSE_TEMPLATES.includes(template);
  switch (outcome) {
    case 'make':
    case 'assist':
      return 'make';
    case 'scored':
      return template === 'charge' ? 'foulMake' : 'make';
    case 'miss':
      return 'miss';
    case 'block':
      return 'block';
    case 'steal':
      if (template === 'steal_runout') return 'pickoff';
      return 'strip';
    case 'turnover':
      return 'pickoff';
    case 'stop':
      if (template === 'block') return 'block';
      if (template === 'charge') return 'charge';
      if (template === 'steal_runout') return 'deflect';
      return 'miss';
    case 'pain':
      return defense ? 'miss' : success ? 'make' : 'miss';
  }
}

const JERSEYS = [
  0, 1, 2, 3, 4, 5, 10, 11, 12, 13, 14, 15, 20, 21, 22, 23, 24, 25, 30, 31, 32, 33, 34, 35, 40, 41,
  42, 43, 44, 45, 50, 51, 52, 53, 54, 55,
];

function jerseys(rng: () => number, user: number, userActor: number): number[] {
  const out: number[] = [];
  for (let team = 0; team < 2; team++) {
    // The user's number is his alone on the floor, so nobody else wears it.
    const used = new Set<number>([user]);
    for (let i = 0; i < 5; i++) {
      const a = team * 5 + i;
      if (a === userActor) {
        out.push(user);
        continue;
      }
      let n = JERSEYS[Math.floor(rng() * JERSEYS.length)] ?? 0;
      while (used.has(n)) n = JERSEYS[Math.floor(rng() * JERSEYS.length)] ?? 0;
      used.add(n);
      out.push(n);
    }
  }
  return out;
}

function goodFor(role: Role, result: PlayResult): boolean {
  switch (result) {
    case 'make':
    case 'ftBoth':
    case 'playThrough':
      return role !== 'defender';
    case 'foulMake':
      return false;
    case 'miss':
    case 'block':
    case 'strip':
    case 'pickoff':
      return role === 'defender';
    case 'charge':
    case 'deflect':
      return true;
    case 'sit':
    case 'ftSplit':
      return false;
  }
}

// ---------------------------------------------------------------- flatten

function flattenBall(b: PlayBuilder, end: number): BallTrack {
  const t: BallTrack = {
    kind: [],
    t0: [],
    t1: [],
    actor: [],
    dribble: [],
    hand: [],
    riseH: [],
    riseDur: [],
    hoopX: [],
    x0: [],
    y0: [],
    h0: [],
    x1: [],
    y1: [],
    h1: [],
    arc: [],
  };
  const push = (k: keyof BallTrack, v: number) => {
    (t[k] as number[]).push(v);
  };
  if (b.ballEnd() < end) {
    const last = b.ops[b.ops.length - 1];
    if (last?.kind === 'hold') b.hold(last.a, end, { hoopX: last.hoopX });
    else b.rest(end);
  }
  for (const op of b.ops) {
    push('t0', op.t0);
    push('t1', op.t1);
    if (op.kind === 'hold') {
      push('kind', 0);
      push('actor', op.a);
      push('dribble', op.dribble ? 1 : 0);
      push('hand', op.hand);
      push('riseH', op.riseH);
      push('riseDur', op.riseDur);
      push('hoopX', op.hoopX);
      for (const k of ['x0', 'y0', 'h0', 'x1', 'y1', 'h1', 'arc'] as const) push(k, 0);
    } else {
      const a = b.resolve(op.from, op.t0);
      const z = b.resolve(op.to, op.t1);
      push('kind', 1);
      push('actor', -1);
      push('dribble', 0);
      push('hand', HAND_HEIGHT);
      push('riseH', 0);
      push('riseDur', 0);
      push('hoopX', HOOP_X);
      push('x0', a.x);
      push('y0', a.y);
      push('h0', a.h);
      push('x1', z.x);
      push('y1', z.y);
      push('h1', z.h);
      push('arc', op.arc);
    }
  }
  return t;
}

function camera(b: PlayBuilder, end: number): { t: number[]; x: number[]; m: number[] } {
  const ts: number[] = [];
  const xs: number[] = [];
  const step = 0.3;
  let cx = 0;
  for (let t = 0, i = 0; t <= end + 1e-6; t += step, i++) {
    let dir = 1;
    for (const turn of b.camTurns) if (t >= turn.t) dir = turn.dir;
    const bx = b.ballPoint(t)[0];
    const target = Math.max(CAMERA_MIN_X, Math.min(CAMERA_MAX_X, bx + dir * 11));
    cx = i === 0 ? target : cx + (target - cx) * 0.45;
    ts.push(t);
    xs.push(cx);
  }
  const { mx } = tangents(ts, xs, new Array<number>(xs.length).fill(0));
  return { t: ts, x: xs, m: mx };
}

// ---------------------------------------------------------------- build

/** Build the play for a moment. Deterministic for the same spec and params. */
export function buildPlay(spec: PlaySpec, params: PlayParams = {}): Play {
  const courtKind: CourtKind = params.court ?? 'college';
  const geo: CourtGeometry = COURTS[courtKind];
  const shotLen = params.shotClock ?? (courtKind === 'pro' ? 24 : 30);
  const periods = params.periods ?? (courtKind === 'pro' ? 4 : 2);
  const template = templateFor(spec);
  const variation = spec.variation ?? 0;
  const rng = seeded(hashString(`${template}:${spec.outcome}`) ^ Math.imul(variation, 2654435761));
  const role = roleFor(template, spec, params);
  const result = resultFor(template, spec.outcome, spec.success);
  const ctx: Ctx = {
    geo,
    s: spotsFor(geo),
    rng,
    role,
    result,
    shotType: spec.shotType ?? null,
    shotLen,
  };
  const script = TEMPLATES[template];
  if (!script) throw new Error(`unknown clip template ${template}`);
  const { b, out } = script(ctx);
  const done: Done = out.kind === 'finish' ? resolveFinish(ctx, b, out) : out;

  const end = Math.min(MAX_DURATION, Math.max(MIN_DURATION, done.end));
  if (rng() < 0.5) b.mirror();
  b.jitter(rng, 0.9, [0, 1, 2, 3, 4]);

  const userSide = spec.userSide ?? 0;
  const defenseUser = role === 'defender';
  const offenseSide = (defenseUser ? 1 - userSide : userSide) as 0 | 1;
  const defenseSide = (1 - offenseSide) as 0 | 1;

  const kt: number[][] = [];
  const kx: number[][] = [];
  const ky: number[][] = [];
  const kmx: number[][] = [];
  const kmy: number[][] = [];
  for (const k of b.keys) {
    const ts = k.map((e) => e.t);
    const xs = k.map((e) => e.x);
    const ys = k.map((e) => e.y);
    const { mx, my } = tangents(ts, xs, ys);
    kt.push(ts);
    kx.push(xs);
    ky.push(ys);
    kmx.push(mx);
    kmy.push(my);
  }

  const lifts: number[] = [];
  for (const l of b.lifts) lifts.push(l.a, l.t0, l.t1, l.amp, l.plateau ? 1 : 0);
  const contests: number[] = [];
  for (const c of b.contests) contests.push(c.a, c.t0, c.t1, c.s);

  const ball = flattenBall(b, end);
  const cam = camera(b, end);

  // Clocks. The game clock runs from clockFrom to the result; when the moment comes in the
  // final seconds it is scaled so the buzzer sounds with the ball in the air.
  const clockStart = Math.max(0, spec.clock);
  const clockFrom = done.clockFrom ?? 0;
  const clockTo = done.clockStopped ? clockFrom : Math.max(clockFrom, done.liveTo);
  const span = clockTo - clockFrom;
  let clockRate = done.clockStopped ? 0 : 1;
  let buzzerAt = -1;
  if (!done.clockStopped && span > 0 && clockStart <= span + 0.05) {
    const bz = Math.min(clockTo, Math.max(clockFrom + 0.3, done.buzzerT ?? clockTo));
    clockRate = clockStart / (bz - clockFrom);
    buzzerAt = bz;
  }
  if (clockStart <= 0) {
    clockRate = 0;
    buzzerAt = -1;
  }
  const shotTo = Math.min(clockTo, done.shotTo ?? clockTo);
  let shotStart = done.shotClockOff
    ? -1
    : Math.min(shotLen, done.shotStart ?? shotLen - (5 + rng() * 7));
  if (shotStart >= 0) {
    shotStart = Math.max(shotStart, clockRate * (shotTo - clockFrom) + 0.6);
    if (shotStart > clockStart) shotStart = -1;
  }

  const userActor = done.user;
  const scoreT: number[] = [];
  const scoreSide: number[] = [];
  const scorePts: number[] = [];
  for (const sc of [...b.scores].sort((u, v) => u.t - v.t)) {
    scoreT.push(sc.t);
    scoreSide.push(sc.team === 0 ? offenseSide : defenseSide);
    scorePts.push(sc.pts);
  }
  const phases = [{ t: 0, key: `intro_${template}` }, ...b.phases].sort((u, v) => u.t - v.t);

  return {
    template,
    outcome: spec.outcome,
    result,
    good: goodFor(role, result),
    court: courtKind,
    duration: end,
    offenseSide,
    actorSide: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((a) => (a < 5 ? offenseSide : defenseSide)),
    actorNumber: jerseys(rng, spec.userJersey ?? 1, userActor),
    userActor,
    kt,
    kx,
    ky,
    kmx,
    kmy,
    lifts,
    ball,
    contests,
    camT: cam.t,
    camX: cam.x,
    camM: cam.m,
    clockStart,
    clockRate,
    clockFrom,
    clockTo,
    shotStart,
    shotTo,
    buzzerAt,
    period: spec.period,
    periods,
    scoreBefore: spec.scoreBefore ?? [0, 0],
    showScore: spec.scoreBefore !== undefined,
    scoreT,
    scoreSide,
    scorePts,
    phaseT: phases.map((p) => Math.max(0, p.t)),
    phaseKey: phases.map((p) => p.key),
    resultT: done.resultT,
    beat: [Math.max(0, done.beat[0]), Math.min(end, done.beat[1])],
    netT: [...b.nets],
    hoopX: HOOP_X,
  };
}

// ---------------------------------------------------------------- sampling (worklets)

const TRAIL = 5;
const TRAIL_DT = 0.035;

/** Index of the ball segment at time t. */
function ballSegment(ball: BallTrack, t: number): number {
  'worklet';
  const n = ball.t0.length;
  let i = 0;
  while (i < n - 1 && t >= (ball.t1[i] ?? 0)) i++;
  return i;
}

/** Ball position for a flight segment (x, y, h written into out). */
function flightAt(ball: BallTrack, i: number, t: number, out: number[]): void {
  'worklet';
  const t0 = ball.t0[i] ?? 0;
  const t1 = ball.t1[i] ?? 0;
  const u = t1 - t0 <= 1e-6 ? 1 : Math.max(0, Math.min(1, (t - t0) / (t1 - t0)));
  const x0 = ball.x0[i] ?? 0;
  const y0 = ball.y0[i] ?? 0;
  out[0] = x0 + ((ball.x1[i] ?? 0) - x0) * u;
  out[1] = y0 + ((ball.y1[i] ?? 0) - y0) * u;
  out[2] = flightHeight(ball.h0[i] ?? 0, ball.h1[i] ?? 0, ball.arc[i] ?? 0, u);
}

function clockAt(play: Play, time: number): number {
  'worklet';
  const run = Math.max(0, Math.min(time, play.clockTo) - play.clockFrom);
  return Math.max(0, play.clockStart - run * play.clockRate);
}

/** One frame of the play at t in 0..1. */
export function sample(play: Play, t: number): FrameState {
  'worklet';
  const time = Math.max(0, Math.min(1, t)) * play.duration;
  const x: number[] = [];
  const y: number[] = [];
  const lift: number[] = [];
  for (let a = 0; a < 10; a++) {
    const ts = play.kt[a] ?? [];
    x.push(hermite(ts, play.kx[a] ?? [], play.kmx[a] ?? [], time));
    y.push(hermite(ts, play.ky[a] ?? [], play.kmy[a] ?? [], time));
    lift.push(0);
  }
  const L = play.lifts;
  for (let i = 0; i + 4 < L.length; i += 5) {
    const t0 = L[i + 1] ?? 0;
    const t1 = L[i + 2] ?? 0;
    if (time < t0 || time > t1) continue;
    const a = L[i] ?? 0;
    const amp = L[i + 3] ?? 0;
    const v =
      (L[i + 4] ?? 0) > 0
        ? Math.min(1, (time - t0) / 0.18, (t1 - time) / 0.18)
        : Math.sin((Math.PI * (time - t0)) / Math.max(1e-6, t1 - t0));
    lift[a] = (lift[a] ?? 0) + amp * v;
  }

  // Ball.
  const ball = play.ball;
  const seg = ballSegment(ball, time);
  const p = [0, 0, 0];
  if ((ball.kind[seg] ?? 1) === 0) {
    const a = ball.actor[seg] ?? 0;
    const hx = ball.hoopX[seg] ?? HOOP_X;
    const ax = x[a] ?? 0;
    const ay = y[a] ?? 0;
    p[0] = handX(ax, ay, hx);
    p[1] = handY(ax, ay, hx);
    p[2] = heldHeight(
      time,
      ball.t0[seg] ?? 0,
      ball.t1[seg] ?? 0,
      ball.hand[seg] ?? HAND_HEIGHT,
      (ball.dribble[seg] ?? 0) > 0,
      ball.riseH[seg] ?? 0,
      ball.riseDur[seg] ?? 0,
    );
  } else {
    flightAt(ball, seg, time, p);
  }

  // Trail: only while the ball flies.
  const trailX: number[] = [];
  const trailY: number[] = [];
  const trailH: number[] = [];
  const q = [0, 0, 0];
  for (let k = 1; k <= TRAIL; k++) {
    const tk = time - k * TRAIL_DT;
    if (tk < 0) break;
    const j = ballSegment(ball, tk);
    if ((ball.kind[j] ?? 0) !== 1) break;
    flightAt(ball, j, tk, q);
    trailX.push(q[0] ?? 0);
    trailY.push(q[1] ?? 0);
    trailH.push(q[2] ?? 0);
  }

  // Contest ring: the strongest active one.
  let ringA = 0;
  let ringActor = -1;
  let ringS = 0;
  const C = play.contests;
  for (let i = 0; i + 3 < C.length; i += 4) {
    const t0 = C[i + 1] ?? 0;
    const t1 = C[i + 2] ?? 0;
    if (time < t0 || time > t1) continue;
    const env = Math.min(1, (time - t0) / 0.15, (t1 - time) / 0.15);
    const s = (C[i + 3] ?? 0) * env;
    if (s > ringA) {
      ringA = s;
      ringActor = C[i] ?? -1;
      ringS = C[i + 3] ?? 0;
    }
  }
  const ringX = ringActor >= 0 ? (x[ringActor] ?? 0) : 0;
  const ringY = ringActor >= 0 ? (y[ringActor] ?? 0) : 0;
  const ringR = 1.9 + 0.7 * ringS * Math.min(1, ringA * 1.4);

  // Clocks and score.
  const gameClock = clockAt(play, time);
  let shotClock = -1;
  if (play.shotStart >= 0) {
    const run = Math.max(0, Math.min(time, play.shotTo) - play.clockFrom);
    shotClock = Math.max(0, play.shotStart - run * play.clockRate);
  }
  const score: [number, number] = [play.scoreBefore[0], play.scoreBefore[1]];
  for (let i = 0; i < play.scoreT.length; i++) {
    if (time >= (play.scoreT[i] ?? 0)) {
      const side = play.scoreSide[i] ?? 0;
      score[side === 0 ? 0 : 1] += play.scorePts[i] ?? 0;
    }
  }
  let phase = 0;
  for (let i = 0; i < play.phaseT.length; i++) if (time >= (play.phaseT[i] ?? 0)) phase = i;
  let net = -1;
  for (let i = 0; i < play.netT.length; i++) {
    const nt = play.netT[i] ?? 0;
    if (time >= nt && time < nt + 0.7) net = (time - nt) / 0.7;
  }

  return {
    time,
    x,
    y,
    lift,
    ballX: p[0] ?? 0,
    ballY: p[1] ?? 0,
    ballH: Math.max(0, p[2] ?? 0),
    ringX,
    ringY,
    ringR,
    ringA,
    ringActor,
    trailX,
    trailY,
    trailH,
    gameClock,
    shotClock,
    score,
    phase,
    camX: hermite(play.camT, play.camX, play.camM, time),
    net,
    resolved: time >= play.resultT,
  };
}

/** Game clock at play time t in 0..1 (used to fire the buzzer). */
export function gameClockAt(play: Play, t: number): number {
  'worklet';
  return clockAt(play, Math.max(0, Math.min(1, t)) * play.duration);
}
