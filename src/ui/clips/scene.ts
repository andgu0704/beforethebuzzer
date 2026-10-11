/**
 * The clip as a draw description: plain draw operations that the app paints with Skia on the
 * UI thread and the contact-sheet script paints with headless Skia, so both show the same
 * scene. `describeFrame` is a worklet; the court is described once, in feet, and recorded as a
 * picture.
 */

import { contrast, parseHex, rgbToOklch, withContrast } from '@/ui/theme/colour';
import { palette, type Scheme } from '@/ui/theme/tokens';
import {
  COURT_LENGTH,
  COURT_WIDTH,
  HOOP_X,
  HOOP_X_LEFT,
  MID_Y,
  cornerDepth,
  type CourtGeometry,
} from './court';
import type { FrameState, Play } from './types';

/** Logical canvas: 360 wide; the app scales it to the real width. */
export const VIEW_W = 360;
/** Pixels per foot. The court view spans y −1..51 and about 55 ft of length. */
export const PX = 6.5;
export const COURT_PX_H = 52 * PX;
export const BOARD_H = 36;
export const VIEW_H = COURT_PX_H + BOARD_H;
export const PLAYER_R = 1.4;
const BALL_R = 0.5;

/** Font slots: jersey numbers, scoreboard large, scoreboard small, labels. */
export type FontSlot = 0 | 1 | 2 | 3;
export const FONT_SIZES: readonly [number, number, number, number] = [10, 21, 14, 11];
/** Antonio weights per slot. */
export const FONT_WEIGHTS: readonly [700, 700, 600, 600] = [700, 700, 600, 600];

export type DrawOp =
  | { readonly k: 'court'; readonly tx: number; readonly ty: number; readonly s: number }
  | {
      readonly k: 'circle';
      readonly x: number;
      readonly y: number;
      readonly r: number;
      readonly color: string;
      readonly alpha: number;
      readonly stroke: number;
    }
  | {
      readonly k: 'rect';
      readonly x: number;
      readonly y: number;
      readonly w: number;
      readonly h: number;
      readonly r: number;
      readonly color: string;
      readonly alpha: number;
      readonly stroke: number;
    }
  | {
      readonly k: 'line';
      readonly x0: number;
      readonly y0: number;
      readonly x1: number;
      readonly y1: number;
      readonly color: string;
      readonly alpha: number;
      readonly width: number;
    }
  | {
      readonly k: 'arc';
      readonly x: number;
      readonly y: number;
      readonly r: number;
      readonly start: number;
      readonly sweep: number;
      readonly color: string;
      readonly alpha: number;
      readonly width: number;
    }
  | {
      readonly k: 'text';
      readonly x: number;
      readonly y: number;
      readonly text: string;
      readonly font: FontSlot;
      readonly color: string;
      readonly alpha: number;
      /** 0 left, 1 centre, 2 right. */
      readonly align: 0 | 1 | 2;
    }
  | {
      readonly k: 'pill';
      readonly x: number;
      readonly y: number;
      readonly h: number;
      readonly text: string;
      readonly font: FontSlot;
      readonly color: string;
      readonly bg: string;
      readonly alpha: number;
      /** 0: x is the left edge; 2: x is the right edge. */
      readonly align: 0 | 2;
    };

export interface TeamLook {
  readonly abbr: string;
  readonly primary: string;
  readonly secondary?: string;
}

export interface SceneLook {
  readonly wood: string;
  readonly woodDark: string;
  readonly line: string;
  readonly paint: string;
  /** Per game side (0 home, 1 away). */
  readonly fill: readonly [string, string];
  readonly number: readonly [string, string];
  readonly edge: readonly [string, string];
  readonly bar: readonly [string, string];
  readonly user: string;
  readonly ball: string;
  readonly seam: string;
  readonly rim: string;
  readonly shadow: string;
  readonly contest: string;
  readonly board: string;
  readonly boardText: string;
  readonly boardDim: string;
  readonly shot: string;
  readonly shotLow: string;
  readonly pill: string;
  readonly pillText: string;
  readonly good: string;
  readonly bad: string;
}

export interface SceneLabels {
  /** One label per play phase, already in display case. */
  readonly phases: readonly string[];
  readonly replay: string;
  readonly period: string;
  /** Abbreviations per game side. */
  readonly abbr: readonly [string, string];
}

const WHITE = '#FFFFFF';
const INK = '#141414';

function oklabDistance(a: string, b: string): number {
  const p = rgbToOklch(parseHex(a));
  const q = rgbToOklch(parseHex(b));
  const pa = p.c * Math.cos((p.h * Math.PI) / 180);
  const pb = p.c * Math.sin((p.h * Math.PI) / 180);
  const qa = q.c * Math.cos((q.h * Math.PI) / 180);
  const qb = q.c * Math.sin((q.h * Math.PI) / 180);
  return Math.hypot(p.l - q.l, pa - qa, pb - qb);
}

/**
 * Colours for a clip. Team fills keep their hue; the away side switches to its secondary, or
 * to road whites, when the two teams would be hard to tell apart.
 */
export function resolveLook(scheme: Scheme, home: TeamLook, away: TeamLook): SceneLook {
  const p = palette[scheme];
  const homeFill = home.primary;
  let awayFill = away.primary;
  let awayNumber: string | null = null;
  if (oklabDistance(homeFill, awayFill) < 0.14) {
    if (away.secondary && oklabDistance(homeFill, away.secondary) >= 0.14) {
      awayFill = away.secondary;
    } else {
      awayFill = WHITE;
      awayNumber = withContrast(away.primary, WHITE, 4.5, 'darker');
    }
  }
  const numberOn = (fill: string) => (contrast(fill, WHITE) >= 3 ? WHITE : INK);
  const edge = scheme === 'light' ? WHITE : '#D9D3C7';
  return {
    wood: p.courtWood,
    woodDark: p.courtWoodDark,
    line: p.courtLine,
    paint: p.courtPaint,
    fill: [homeFill, awayFill],
    number: [numberOn(homeFill), awayNumber ?? numberOn(awayFill)],
    edge: [edge, edge],
    bar: [home.primary, away.primary],
    user: p.brand,
    ball: '#E07A2C',
    seam: '#4A2410',
    rim: '#E8562A',
    shadow: '#000000',
    contest: scheme === 'light' ? INK : '#F1EFEA',
    board: '#141414',
    boardText: '#F1EFEA',
    boardDim: '#A8A49C',
    shot: '#F2B544',
    shotLow: '#FF6B5E',
    pill: '#141414',
    pillText: '#F1EFEA',
    good: palette.light.positive,
    bad: palette.light.negative,
  };
}

/** Period label for the scoreboard: halves in college, quarters in the pro game. */
export function periodLabel(period: number, periods: number): string {
  if (period > periods) {
    const ot = period - periods;
    return ot === 1 ? 'OT' : `${ot}OT`;
  }
  return periods === 2 ? `H${period}` : `Q${period}`;
}

// ---------------------------------------------------------------- court (feet)

/** The court in feet, drawn once and recorded as a picture. */
export function describeCourt(geo: CourtGeometry, look: SceneLook): DrawOp[] {
  const ops: DrawOp[] = [];
  const lw = 0.17;
  const line = look.line;
  const rect = (x: number, y: number, w: number, h: number, color: string, alpha = 1) =>
    ops.push({ k: 'rect', x, y, w, h, r: 0, color, alpha, stroke: 0 });
  const stroke = (x: number, y: number, w: number, h: number) =>
    ops.push({ k: 'rect', x, y, w, h, r: 0, color: line, alpha: 1, stroke: lw });
  const seg = (x0: number, y0: number, x1: number, y1: number, width = lw, color = line) =>
    ops.push({ k: 'line', x0, y0, x1, y1, color, alpha: 1, width });
  const arc = (x: number, y: number, r: number, start: number, sweep: number, width = lw) =>
    ops.push({ k: 'arc', x, y, r, start, sweep, color: line, alpha: 1, width });

  rect(-6, -6, COURT_LENGTH + 12, COURT_WIDTH + 12, look.woodDark);
  rect(0, 0, COURT_LENGTH, COURT_WIDTH, look.wood);
  for (let y = 1; y < COURT_WIDTH; y += 2) rect(0, y, COURT_LENGTH, 1, look.woodDark, 0.28);

  const lane = geo.laneHalfWidth;
  const ft = geo.ftInset;
  rect(0, MID_Y - lane, ft, lane * 2, look.paint);
  rect(COURT_LENGTH - ft, MID_Y - lane, ft, lane * 2, look.paint);
  ops.push({
    k: 'circle',
    x: COURT_LENGTH / 2,
    y: MID_Y,
    r: geo.centreRadius,
    color: look.paint,
    alpha: 0.7,
    stroke: 0,
  });

  stroke(0, 0, COURT_LENGTH, COURT_WIDTH);
  seg(COURT_LENGTH / 2, 0, COURT_LENGTH / 2, COURT_WIDTH);
  arc(COURT_LENGTH / 2, MID_Y, geo.centreRadius, 0, 360);
  arc(COURT_LENGTH / 2, MID_Y, 2, 0, 360);

  const corner = geo.threeCorner;
  const depth = cornerDepth(geo);
  const theta = (Math.atan2(corner, depth) * 180) / Math.PI;
  for (const end of [0, 1] as const) {
    const right = end === 1;
    const hx = right ? HOOP_X : HOOP_X_LEFT;
    const base = right ? COURT_LENGTH : 0;
    const dirX = right ? -1 : 1;
    const ftX = base + dirX * ft;
    // Lane, free-throw line and circle: solid outside the lane, dashed inside.
    stroke(right ? ftX : 0, MID_Y - lane, ft, lane * 2);
    arc(ftX, MID_Y, geo.ftRadius, right ? 90 : -90, 180);
    for (let i = 0; i < 6; i++) {
      arc(ftX, MID_Y, geo.ftRadius, (right ? -90 : 90) + i * 30 + 7, 16);
    }
    for (const d of [7, 8, 11, 14]) {
      const x = base + dirX * d;
      seg(x, MID_Y - lane - 0.6, x, MID_Y - lane, d === 8 ? 0.6 : lw);
      seg(x, MID_Y + lane, x, MID_Y + lane + 0.6, d === 8 ? 0.6 : lw);
    }
    // Three-point line.
    const cornerEnd = hx + dirX * depth;
    seg(base, MID_Y - corner, cornerEnd, MID_Y - corner);
    seg(base, MID_Y + corner, cornerEnd, MID_Y + corner);
    arc(hx, MID_Y, geo.threeRadius, right ? 180 - theta : -theta, theta * 2);
    // Restricted area.
    arc(hx, MID_Y, geo.restrictedRadius, right ? 90 : -90, 180);
    // Backboard, rim and net.
    const board = base + dirX * geo.boardInset;
    seg(board, MID_Y - geo.boardHalfWidth, board, MID_Y + geo.boardHalfWidth, 0.35);
    seg(board, MID_Y, hx - dirX * geo.rimRadius, MID_Y, 0.22, look.rim);
    ops.push({
      k: 'circle',
      x: hx,
      y: MID_Y,
      r: geo.rimRadius * 0.72,
      color: WHITE,
      alpha: 0.55,
      stroke: 0.1,
    });
    ops.push({
      k: 'circle',
      x: hx,
      y: MID_Y,
      r: geo.rimRadius,
      color: look.rim,
      alpha: 1,
      stroke: 0.2,
    });
  }
  return ops;
}

// ---------------------------------------------------------------- frame (pixels)

function pad2(n: number): string {
  'worklet';
  return n < 10 ? `0${n}` : `${n}`;
}

/** Broadcast game clock: m:ss above a minute, ss.t below. */
export function formatGameClock(sec: number): string {
  'worklet';
  if (sec >= 60) {
    const whole = Math.ceil(sec - 1e-6);
    const m = Math.floor(whole / 60);
    return `${m}:${pad2(whole - m * 60)}`;
  }
  return (Math.floor(Math.max(0, sec) * 10) / 10).toFixed(1);
}

/** Shot clock: whole seconds, tenths under five. */
export function formatShotClock(sec: number): string {
  'worklet';
  if (sec < 0) return '';
  if (sec < 5) return (Math.floor(sec * 10) / 10).toFixed(1);
  return `${Math.ceil(sec - 1e-6)}`;
}

/** Everything drawn for one frame, in logical pixels (VIEW_W × VIEW_H). */
export function describeFrame(
  play: Play,
  f: FrameState,
  look: SceneLook,
  labels: SceneLabels,
  replay: boolean,
): DrawOp[] {
  'worklet';
  const ops: DrawOp[] = [];
  const s = PX;
  const tx = VIEW_W / 2 - f.camX * s;
  const ty = s;
  ops.push({ k: 'court', tx, ty, s });

  if (f.net >= 0) {
    ops.push({
      k: 'circle',
      x: tx + HOOP_X * s,
      y: ty + MID_Y * s,
      r: (0.9 + f.net * 1.8) * s,
      color: look.line,
      alpha: 0.85 * (1 - f.net),
      stroke: 1.6,
    });
  }

  // Shadows: players, then the ball's on the floor.
  for (let a = 0; a < 10; a++) {
    const lift = Math.max(0, f.lift[a] ?? 0);
    const off = (0.3 + lift * 0.6) * s;
    ops.push({
      k: 'circle',
      x: tx + (f.x[a] ?? 0) * s + off * 0.6,
      y: ty + (f.y[a] ?? 0) * s + off,
      r: PLAYER_R * s,
      color: look.shadow,
      alpha: 0.16 - lift * 0.05,
      stroke: 0,
    });
  }
  const bh = f.ballH;
  ops.push({
    k: 'circle',
    x: tx + (f.ballX + bh * 0.1) * s,
    y: ty + (f.ballY + bh * 0.18) * s,
    r: BALL_R * s * (1 + bh * 0.02),
    color: look.shadow,
    alpha: Math.max(0.06, 0.3 - bh * 0.012),
    stroke: 0,
  });

  // Players: everyone else first, the user last so he is never hidden.
  for (let i = 0; i < 10; i++) {
    const a = i === 9 ? play.userActor : i >= play.userActor && play.userActor >= 0 ? i + 1 : i;
    if (a < 0 || a > 9) continue;
    const side = play.actorSide[a] === 1 ? 1 : 0;
    const lift = f.lift[a] ?? 0;
    const scale = lift >= 0 ? 1 + lift * 0.13 : 1 + lift * 0.12;
    const r = PLAYER_R * s * scale;
    const cx = tx + (f.x[a] ?? 0) * s;
    const cy = ty + (f.y[a] ?? 0) * s;
    const alpha = lift < 0 ? 1 + lift * 0.18 : 1;
    if (a === play.userActor) {
      ops.push({ k: 'circle', x: cx, y: cy, r: r + 3.2, color: look.user, alpha: 1, stroke: 2.2 });
    }
    ops.push({ k: 'circle', x: cx, y: cy, r, color: look.fill[side], alpha, stroke: 0 });
    ops.push({ k: 'circle', x: cx, y: cy, r, color: look.edge[side], alpha: 0.9, stroke: 1.1 });
    ops.push({
      k: 'text',
      x: cx,
      y: cy + 3.6 * scale,
      text: `${play.actorNumber[a] ?? ''}`,
      font: 0,
      color: look.number[side],
      alpha,
      align: 1,
    });
  }

  if (f.ringA > 0.01 && f.ringActor >= 0) {
    ops.push({
      k: 'circle',
      x: tx + f.ringX * s,
      y: ty + f.ringY * s,
      r: f.ringR * s,
      color: look.contest,
      alpha: 0.75 * f.ringA,
      stroke: 1.5,
    });
  }

  // Ball trail and ball.
  for (let i = 0; i < f.trailX.length; i++) {
    const h = f.trailH[i] ?? 0;
    ops.push({
      k: 'circle',
      x: tx + (f.trailX[i] ?? 0) * s,
      y: ty + (f.trailY[i] ?? 0) * s,
      r: BALL_R * s * (1 + h / 20) * (0.85 - i * 0.12),
      color: look.ball,
      alpha: 0.32 * (1 - i / f.trailX.length),
      stroke: 0,
    });
  }
  const br = BALL_R * s * (1 + bh / 20);
  const bx = tx + f.ballX * s;
  const by = ty + f.ballY * s;
  ops.push({ k: 'circle', x: bx, y: by, r: br, color: look.ball, alpha: 1, stroke: 0 });
  ops.push({ k: 'circle', x: bx, y: by, r: br, color: look.seam, alpha: 0.75, stroke: 0.8 });
  ops.push({
    k: 'line',
    x0: bx - br * 0.92,
    y0: by,
    x1: bx + br * 0.92,
    y1: by,
    color: look.seam,
    alpha: 0.6,
    width: 0.7,
  });

  // Phase or result, top left; replay tag top right.
  const label = labels.phases[f.phase] ?? '';
  if (label.length > 0) {
    ops.push({
      k: 'pill',
      x: 8,
      y: 8,
      h: 20,
      text: label,
      font: 3,
      color: look.pillText,
      bg: f.resolved ? (play.good ? look.good : look.bad) : look.pill,
      alpha: 0.92,
      align: 0,
    });
  }
  if (replay) {
    ops.push({
      k: 'pill',
      x: VIEW_W - 8,
      y: 8,
      h: 20,
      text: labels.replay,
      font: 3,
      color: look.pillText,
      bg: look.user,
      alpha: 0.95,
      align: 2,
    });
  }

  // Scoreboard: away @ home, period, game clock, shot clock.
  const y0 = COURT_PX_H;
  ops.push({
    k: 'rect',
    x: 0,
    y: y0,
    w: VIEW_W,
    h: BOARD_H,
    r: 0,
    color: look.board,
    alpha: 1,
    stroke: 0,
  });
  const teams: readonly (0 | 1)[] = [1, 0];
  for (let i = 0; i < 2; i++) {
    const side = teams[i] ?? 0;
    const x0 = i * 108;
    ops.push({
      k: 'rect',
      x: x0,
      y: y0,
      w: 5,
      h: BOARD_H,
      r: 0,
      color: look.bar[side],
      alpha: 1,
      stroke: 0,
    });
    if (side === play.offenseSide && !f.resolved) {
      ops.push({
        k: 'circle',
        x: x0 + 12,
        y: y0 + 18,
        r: 2.2,
        color: look.user,
        alpha: 1,
        stroke: 0,
      });
    }
    ops.push({
      k: 'text',
      x: x0 + 18,
      y: y0 + 23,
      text: labels.abbr[side],
      font: 2,
      color: look.boardText,
      alpha: 1,
      align: 0,
    });
    ops.push({
      k: 'text',
      x: x0 + 100,
      y: y0 + 26,
      text: play.showScore ? `${f.score[side]}` : '',
      font: 1,
      color: look.boardText,
      alpha: 1,
      align: 2,
    });
  }
  ops.push({
    k: 'line',
    x0: 216,
    y0: y0 + 7,
    x1: 216,
    y1: y0 + BOARD_H - 7,
    color: look.boardDim,
    alpha: 0.5,
    width: 1,
  });
  ops.push({
    k: 'text',
    x: 226,
    y: y0 + 23,
    text: labels.period,
    font: 2,
    color: look.boardDim,
    alpha: 1,
    align: 0,
  });
  ops.push({
    k: 'text',
    x: 304,
    y: y0 + 26,
    text: formatGameClock(f.gameClock),
    font: 1,
    color: look.boardText,
    alpha: 1,
    align: 2,
  });
  const shot = formatShotClock(f.shotClock);
  ops.push({
    k: 'rect',
    x: 314,
    y: y0 + 6,
    w: 40,
    h: BOARD_H - 12,
    r: 3,
    color: '#2A2A2D',
    alpha: 1,
    stroke: 0,
  });
  ops.push({
    k: 'text',
    x: 334,
    y: y0 + 25,
    text: shot,
    font: 2,
    color: f.shotClock >= 0 && f.shotClock < 5 ? look.shotLow : look.shot,
    alpha: 1,
    align: 1,
  });
  return ops;
}
