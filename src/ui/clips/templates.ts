/**
 * Play scripts, one per clip template. Each authors the set-up in the canonical frame (offense
 * attacking the right basket; actors 0–4 offense, 5–9 defense, 5 + i guarding i) and either
 * hands a Finish to the shared endings or scripts its own ending.
 */

import { HOOP_X, HOOP_X_LEFT, MID_Y, RIM_HEIGHT } from './court';
import { dist, lerpP, toward, type P } from './builder';
import {
  begin,
  flightFor,
  guardAll,
  RELEASE_H,
  rise,
  type Ctx,
  type Done,
  type Finish,
  type Scripted,
  type ShotKind,
} from './finish';

const H: P = [HOOP_X, MID_Y];

function finish(o: Omit<Finish, 'kind'>): Finish {
  return { kind: 'finish', ...o };
}

function userOf(c: Ctx, shooter: number, passer: number): number {
  return c.role === 'passer' ? passer : shooter;
}

// ---------------------------------------------------------------- half-court offense

function isoPullup(c: Ctx): Scripted {
  const { s } = c;
  const tx = s.top[0];
  const three = c.shotType === 'three';
  const b = begin(c, [[tx - 3.5, 30], s.wingB, s.cornerT, s.wingT, s.blockT]);
  const pu: P = three ? [tx + 1, 34.2] : [s.elbowB[0] - 0.6, s.elbowB[1] + 1.4];
  b.path(0, [
    [0.95, tx - 0.6, 27.4],
    [1.6, tx + 0.2, 26.4],
    [2.05, tx + 2.6, 24.2],
    [2.45, tx + 1.8, 27.8],
  ]);
  const release = three ? 3.35 : 3.7;
  if (three) b.key(0, 2.95, pu);
  else b.key(0, 3.05, [pu[0] - 2.8, pu[1] - 0.8]).key(0, 3.35, pu);
  b.wait(0, release + 0.4);
  b.path(1, [
    [0.5, s.wingB[0], s.wingB[1]],
    [1.8, s.wingB[0] + 4, s.wingB[1] + 2.5],
    [2.7, s.cornerB[0], s.cornerB[1]],
  ]);
  b.key(3, 2.4, [s.wingT[0] - 3, s.wingT[1] + 1]);
  b.key(4, 2.5, s.dunkerT);
  b.pass(1, 0, 0.45, 0.95);
  rise(b, 0, release, three ? 'three' : 'jumper', { dribble: true });
  guardAll(b, 0, release);
  return {
    b,
    out: finish({
      user: userOf(c, 0, 1),
      shooter: 0,
      release,
      shot: three ? 'three' : 'jumper',
      contester: 5,
      stealAt: 2.3,
      pass: { from: 1, t0: 0.45, t1: 0.95 },
    }),
  };
}

function stepBackThree(c: Ctx): Scripted {
  const { s } = c;
  const w = s.wingB;
  const b = begin(c, [[w[0] - 4, w[1] - 3.5], s.top, s.cornerT, s.wingT, s.blockT]);
  const drive: P = [w[0] + 6, w[1] - 2.4];
  const release = 3.05;
  b.path(0, [
    [0.95, w[0] + 0.4, w[1] - 0.6],
    [1.55, w[0] - 0.2, w[1] - 0.2],
    [2.2, drive[0], drive[1]],
    [2.75, w[0] - 0.7, w[1] + 0.5],
  ]);
  b.wait(0, release + 0.4);
  b.path(1, [
    [0.5, s.top[0], s.top[1]],
    [2.4, s.slotT[0], s.slotT[1]],
  ]);
  b.key(3, 2.0, [s.wingT[0] - 2, s.wingT[1] + 1.5]);
  b.key(4, 2.2, s.dunkerT);
  b.pass(1, 0, 0.5, 0.95);
  rise(b, 0, release, 'three', { dribble: true, gather: 0.08 });
  guardAll(b, 0, 2.2);
  b.key(5, 2.6, toward(drive, H, 3.4));
  return {
    b,
    out: finish({
      user: userOf(c, 0, 1),
      shooter: 0,
      release,
      shot: 'three',
      contester: 5,
      closeFrom: 2.6,
      stealAt: 1.9,
      pass: { from: 1, t0: 0.5, t1: 0.95 },
    }),
  };
}

function catchShootThree(c: Ctx): Scripted {
  const { s } = c;
  const tx = s.top[0];
  const corner = s.cornerT;
  const b = begin(c, [[tx - 3, 26.5], s.wingB, corner, s.wingT, s.blockB]);
  const kick = 2.2;
  const catchT = 2.7;
  const release = 3.1;
  b.path(0, [
    [0.8, tx + 0.4, 25.6],
    [1.55, tx + 6.5, 21.8],
    [2.15, s.elbowT[0] + 2.4, s.elbowT[1] + 2.6],
    [2.7, s.elbowT[0] + 2.6, s.elbowT[1] + 3.2],
  ]);
  b.key(2, kick, corner).key(2, catchT, [corner[0] - 0.4, corner[1] + 0.3]);
  b.wait(2, release + 0.4);
  b.key(3, 1.5, [s.wingT[0] - 4.5, s.wingT[1] + 2]);
  b.key(4, 1.8, s.dunkerB);
  b.hold(0, kick, { dribble: true });
  b.fly({ a: 2, h: 3.6 }, catchT, 0.9);
  rise(b, 2, release, 'three', { gather: 0.08 });
  guardAll(b, 0, 2.0, [7]);
  b.guard(7, 2, 0, 1.4);
  b.key(7, 2.15, [s.elbowT[0] + 7.5, s.elbowT[1] - 3.5]);
  return {
    b,
    out: finish({
      user: userOf(c, 2, 0),
      shooter: 2,
      release,
      shot: 'three',
      contester: 7,
      closeFrom: 2.25,
      pass: { from: 0, t0: kick, t1: catchT },
    }),
  };
}

function driveLayup(c: Ctx): Scripted {
  const { s } = c;
  const w = s.wingB;
  const b = begin(c, [
    [w[0] - 2.5, w[1] - 3.5],
    [s.top[0] - 1.5, 24],
    s.cornerT,
    s.wingT,
    s.elbowT,
  ]);
  const release = 3.1;
  b.path(0, [
    [1.0, w[0], w[1] - 0.6],
    [1.35, w[0] + 1.3, w[1] - 1.9],
    [1.65, w[0] - 0.2, w[1] - 0.9],
    [2.15, w[0] + 6.5, w[1] - 3.2],
    [2.6, 84.3, 36.4],
    [2.95, 86.6, 32.4],
    [3.25, 87.5, 30.4],
  ]);
  b.path(1, [
    [0.55, s.top[0] - 1.5, 24],
    [2.0, s.slotT[0], s.slotT[1]],
  ]);
  b.key(3, 1.6, [s.wingT[0] - 3, s.wingT[1] + 1]);
  b.key(4, 2.2, [s.elbowT[0] - 0.5, s.elbowT[1] - 1]);
  b.pass(1, 0, 0.55, 1.0);
  rise(b, 0, release, 'layup', { dribble: true, gather: 0.12 });
  guardAll(b, 0, 1.65, [9]);
  b.guard(5, 0, 1.65, release, { gap: 2.6, lag: 0.38 });
  b.guard(9, 4, 0, 2.2);
  b.key(9, 2.65, [84.6, 27.6]);
  return {
    b,
    out: finish({
      user: userOf(c, 0, 1),
      shooter: 0,
      release,
      shot: 'layup',
      contester: 9,
      closeFrom: 2.65,
      stealAt: 1.95,
      stripper: 5,
      pass: { from: 1, t0: 0.55, t1: 1.0 },
    }),
  };
}

/** Pick and roll: the big comes up to screen for the handler at the top. */
function pnrSetup(c: Ctx) {
  const { s } = c;
  const tx = s.top[0];
  const b = begin(c, [[tx - 3.5, 31], s.wingB, s.cornerT, s.wingT, s.blockB]);
  const ss: P = [tx + 2.0, 25.4];
  b.path(0, [
    [0.95, tx - 0.8, 29.6],
    [1.6, tx - 0.4, 29.4],
  ]).wait(0, 1.9);
  b.path(4, [
    [0.6, 84, 32],
    [1.75, ss[0], ss[1]],
  ]).wait(4, 2.3);
  b.path(1, [
    [0.5, s.wingB[0], s.wingB[1]],
    [2.0, s.cornerB[0], s.cornerB[1]],
  ]);
  b.key(3, 1.8, [s.wingT[0] - 4.5, s.wingT[1] - 1.5]);
  b.pass(1, 0, 0.5, 0.95);
  return { b, ss, tx };
}

function pickAndRollPullup(c: Ctx): Scripted {
  const { s } = c;
  const { b, ss, tx } = pnrSetup(c);
  const three = c.shotType === 'three';
  b.key(0, 2.3, [tx - 0.6, 24.2]);
  const release = three ? 3.15 : 3.45;
  if (three) b.key(0, 2.8, [tx + 1.2, 19.0]);
  else b.key(0, 2.75, [tx + 5, 20.4]).key(0, 3.1, [s.elbowT[0] - 1.2, s.elbowT[1] + 0.8]);
  b.wait(0, release + 0.4);
  b.path(4, [
    [2.85, tx + 9, 26.4],
    [3.4, 83.4, 26.2],
    [3.9, 85.6, 26],
  ]);
  rise(b, 0, release, three ? 'three' : 'jumper', { dribble: true });
  guardAll(b, 0, 1.9, [9]);
  b.path(5, [
    [2.2, tx + 3.4, 27.8],
    [2.7, tx + 5.2, 23.6],
  ]);
  b.guard(9, 4, 0, 1.5);
  b.key(9, 1.75, toward(ss, H, 4.5));
  b.key(9, 2.45, [s.elbowT[0] + 1.5, 24.2]);
  return {
    b,
    out: finish({
      user: userOf(c, 0, 1),
      shooter: 0,
      release,
      shot: three ? 'three' : 'jumper',
      contester: three ? 5 : 9,
      closeFrom: 2.75,
      stealAt: 2.5,
      stripper: 5,
      pass: { from: 1, t0: 0.5, t1: 0.95 },
    }),
  };
}

function pickAndRollRoll(c: Ctx): Scripted {
  const { b, tx } = pnrSetup(c);
  const passT = 2.75;
  const catchT = 3.15;
  const release = 3.55;
  b.path(0, [
    [2.3, tx - 0.6, 24.2],
    [passT, tx + 4.4, 21.2],
    [3.2, tx + 6, 20.6],
  ]);
  b.path(4, [
    [2.8, tx + 10, 26.5],
    [catchT, 82.4, 26.6],
    [3.45, 85.4, 25.9],
    [3.7, 86.0, 25.8],
  ]);
  b.hold(0, passT, { dribble: true });
  b.pass(0, 4, passT, catchT, { bounce: true });
  rise(b, 4, release, 'dunk', { gather: 0.05 });
  guardAll(b, 0, 1.9, [8, 9]);
  b.guard(8, 3, 0, 2.0);
  b.key(8, 3.0, [83.5, 21.5]);
  b.path(5, [
    [2.25, tx + 1.6, 28.4],
    [2.9, tx + 4.6, 24.6],
  ]);
  b.guard(9, 4, 0, 1.5);
  b.key(9, 2.3, [tx + 2.6, 21.0]);
  b.key(9, 3.3, [79.8, 25.0]);
  return {
    b,
    out: finish({
      user: userOf(c, 4, 0),
      shooter: 4,
      release,
      shot: 'dunk',
      contester: 8,
      closeFrom: 3.0,
      stealAt: catchT + 0.12,
      stripper: 8,
      pass: { from: 0, t0: passT, t1: catchT, interceptor: 8 },
    }),
  };
}

function driveAndKick(c: Ctx): Scripted {
  const { s } = c;
  const tx = s.top[0];
  const b = begin(c, [[tx - 3, 23], s.cornerB, s.wingT, s.cornerT, s.blockB]);
  const kick = 2.3;
  b.path(0, [
    [0.9, tx + 0.4, 24.6],
    [1.2, tx + 0.8, 25.5],
    [1.75, tx + 8, 28.6],
    [2.25, s.elbowB[0] + 5.2, MID_Y + 3.6],
    [2.8, s.elbowB[0] + 5.6, MID_Y + 3.4],
  ]);
  b.hold(0, kick, { dribble: true });
  guardAll(b, 0, 1.6);
  b.key(6, 2.2, [84.6, 35.2]);
  b.key(9, 2.2, [84.0, 29.6]);
  let shooter: number;
  let release: number;
  let shot: ShotKind;
  let catchT: number;
  if (c.shotType === 'rim') {
    shooter = 4;
    catchT = 2.6;
    release = 2.95;
    shot = 'layup';
    b.key(4, 1.8, s.dunkerB).key(4, catchT, [s.dunkerB[0] - 0.4, s.dunkerB[1] - 1]);
    b.key(4, 3.1, [89.2, 30.2]);
    b.fly({ a: 4, h: 3.6 }, catchT, 0.4);
    rise(b, 4, release, shot, { gather: 0.04 });
  } else if (c.shotType === 'mid') {
    shooter = 2;
    catchT = 2.85;
    release = 3.25;
    shot = 'jumper';
    b.key(2, 2.0, s.wingT)
      .key(2, 2.7, [s.elbowT[0] - 1, s.elbowT[1] - 1.5])
      .wait(2, 3.7);
    b.key(4, 1.8, s.dunkerB);
    b.fly({ a: 2, h: 3.6 }, catchT, 0.8);
    rise(b, 2, release, shot, { gather: 0.08 });
  } else {
    shooter = 1;
    catchT = 2.8;
    release = 3.15;
    shot = 'three';
    b.key(1, kick, s.cornerB).key(1, catchT, [s.cornerB[0] - 0.4, s.cornerB[1] - 0.3]);
    b.wait(1, 3.6);
    b.key(4, 1.8, s.dunkerB);
    b.fly({ a: 1, h: 3.6 }, catchT, 0.9);
    rise(b, 1, release, shot, { gather: 0.08 });
  }
  return {
    b,
    out: finish({
      user: userOf(c, shooter, 0),
      shooter,
      release,
      shot,
      contester: shooter + 5,
      closeFrom: kick + 0.05,
      pass: { from: 0, t0: kick, t1: catchT },
    }),
  };
}

function postUp(c: Ctx): Scripted {
  const { s } = c;
  const w = s.wingB;
  const b = begin(
    c,
    [s.top, [w[0] + 1, w[1] - 1], s.cornerT, s.wingT, [82.5, 35.5]],
    [null, null, null, null, [84.4, 32.9]],
  );
  const dropStep = c.rng() < 0.5;
  const release = 3.3;
  b.path(4, [
    [1.0, 86.4, 35.2],
    [1.5, 86.4, 35.2],
    [2.1, 86.8, 34.0],
    [2.7, 87.4, 33.0],
  ]);
  if (dropStep) b.key(4, 3.05, [89.4, 30.6]);
  else b.key(4, 3.0, [86.3, 33.8]);
  b.wait(4, release + 0.4);
  b.key(1, 1.05, [w[0] + 1, w[1] - 1]).key(1, 2.6, [w[0] - 2, w[1] + 1.5]);
  b.key(0, 2.0, s.slotB);
  b.hold(1, 1.05, { dribble: true });
  b.fly({ a: 4, h: 3.6 }, 1.5, 0.8);
  const shot: ShotKind = dropStep ? 'hook' : 'jumper';
  rise(b, 4, release, shot, { dribble: true, gather: 0.1 });
  guardAll(b, 0, release, [9]);
  b.guard(9, 4, 0, 2.75, { gap: 3.0, offGap: 3.0, lag: 0.1, help: 0 });
  return {
    b,
    out: finish({
      user: userOf(c, 4, 1),
      shooter: 4,
      release,
      shot,
      contester: 9,
      closeFrom: release - 0.3,
      stealAt: 2.35,
      pass: { from: 1, t0: 1.05, t1: 1.5 },
    }),
  };
}

function floater(c: Ctx): Scripted {
  const { s } = c;
  const tx = s.top[0];
  const fx = s.ftLine[0];
  const b = begin(c, [[tx - 5, 28.5], s.wingB, s.cornerT, s.wingT, s.dunkerB]);
  const release = 2.75;
  b.path(0, [
    [0.9, tx - 1.2, 27.6],
    [1.35, tx - 0.4, 26.8],
    [1.55, tx - 0.2, 26.6],
    [2.1, tx + 6.5, 25.8],
    [2.5, fx + 3.5, 25.6],
    [2.75, fx + 5.4, 25.5],
    [3.05, fx + 6, 25.4],
  ]);
  b.key(1, 0.45, s.wingB).key(1, 2.0, [s.wingB[0] - 1.5, s.wingB[1] + 1.2]);
  b.pass(1, 0, 0.45, 0.9);
  rise(b, 0, release, 'floater', { dribble: true, gather: 0.1 });
  guardAll(b, 0, 1.55, [9]);
  b.guard(5, 0, 1.55, release, { gap: 2.6, lag: 0.38 });
  b.guard(9, 4, 0, 1.6);
  b.key(9, 2.3, [85.0, 26.0]);
  return {
    b,
    out: finish({
      user: userOf(c, 0, 1),
      shooter: 0,
      release,
      shot: 'floater',
      contester: 9,
      closeFrom: 2.4,
      contestGap: 4.6,
      stealAt: 1.95,
      stripper: 5,
      pass: { from: 1, t0: 0.45, t1: 0.9 },
    }),
  };
}

function alleyOop(c: Ctx): Scripted {
  const { s } = c;
  const w = s.wingB;
  const wt = s.wingT;
  const b = begin(c, [
    [wt[0] - 1.5, wt[1] + 1.5],
    s.top,
    s.cornerT,
    [w[0] - 1, w[1] - 0.5],
    s.blockT,
  ]);
  const lob = 1.85;
  const catchT = 2.6;
  const release = 2.8;
  b.key(0, 1.0, [wt[0] + 0.5, wt[1] + 2.5]).wait(0, 2.4);
  b.path(3, [
    [1.0, w[0] - 2.4, w[1] + 0.4],
    [1.15, w[0] - 2.2, w[1] + 0.6],
    [1.75, 77.0, 37.0],
    [2.25, 83.5, 31.0],
    [catchT, 87.0, 27.4],
    [3.0, 88.0, 26.3],
  ]);
  b.key(4, 1.5, s.elbowT);
  b.hold(0, lob, { dribble: true });
  b.fly({ a: 3, h: RELEASE_H.oop }, catchT, 3.5);
  b.hold(3, release, { hand: RELEASE_H.oop });
  b.jump(3, 2.3, 3.0, 1.3);
  guardAll(b, 0, 1.0, [8, 9]);
  b.guard(5, 0, 1.0, lob);
  b.guard(8, 3, 0, 1.0, { offGap: 3.2, help: 0.35 });
  b.path(8, [
    [1.65, w[0] + 0.6, w[1] - 3.4],
    [2.2, 80.5, 34.0],
    [2.7, 84.0, 30.6],
  ]);
  b.guard(9, 4, 0, 1.9);
  b.key(9, 2.5, [85.6, 24.0]);
  return {
    b,
    out: finish({
      user: userOf(c, 3, 0),
      shooter: 3,
      release,
      shot: 'oop',
      contester: 9,
      closeFrom: 2.5,
      pass: { from: 0, t0: lob, t1: catchT, interceptor: 9 },
    }),
  };
}

function putBack(c: Ctx): Scripted {
  const { s } = c;
  const w = s.wingB;
  const b = begin(c, [s.top, [w[0] - 1, w[1] - 1.5], s.cornerT, s.wingT, s.blockT]);
  const shot1 = 1.45;
  b.key(1, 0.85, w).wait(1, 2.2);
  b.pass(0, 1, 0.4, 0.85);
  rise(b, 1, shot1, 'three', { gather: 0.08 });
  const rel = b.resolve({ a: 1, h: RELEASE_H.three }, shot1);
  const d = dist([rel.x, rel.y], H);
  const tr1 = shot1 + flightFor('three', d).tf;
  const dir: P = [(H[0] - rel.x) / d, (H[1] - rel.y) / d];
  b.fly(
    { x: H[0] + dir[0] * 0.75, y: H[1] + dir[1] * 0.75, h: RIM_HEIGHT + 0.1 },
    tr1,
    flightFor('three', d).arc,
  );
  const catchT = tr1 + 0.42;
  const release = catchT + 0.16;
  const tip: P = [86.6, MID_Y + 2.4];
  b.path(4, [
    [shot1, s.blockT[0], s.blockT[1]],
    [shot1 + 0.5, 86.0, 21.0],
    [tr1 - 0.1, 85.6, 24.4],
    [catchT, tip[0] - 0.9, tip[1] - 0.8],
  ]);
  b.wait(4, release + 0.3);
  b.fly({ a: 4, h: RELEASE_H.tip }, catchT, 1.1);
  b.hold(4, release, { hand: RELEASE_H.tip });
  b.jump(4, catchT - 0.3, release + 0.3, 1.2);
  guardAll(b, 0, shot1, [9]);
  b.guard(9, 4, 0, shot1);
  b.path(9, [
    [shot1 + 0.6, 86.8, 22.2],
    [tr1, 87.4, 24.6],
  ]);
  b.key(0, 2.4, [s.top[0] - 2, s.top[1]]);
  return {
    b,
    out: finish({
      user: 4,
      shooter: 4,
      release,
      shot: 'tip',
      contester: 9,
      closeFrom: tr1,
      contestGap: 3,
      stealAt: release - 0.06,
      stripper: 9,
      shotTo: tr1,
    }),
  };
}

// ---------------------------------------------------------------- transition and late game

function fastBreak(c: Ctx): Scripted {
  const b = begin(
    c,
    [
      [22, 23.5],
      [18, 9],
      [16, 42],
      [6, 30],
      [4, 20],
    ],
    [
      [14, 26],
      [10, 12],
      [9, 38],
      [3, 28],
      [52, 24],
    ],
  );
  b.path(0, [
    [0.8, 36, 24.5],
    [1.6, 50, 25.5],
    [2.3, 63, 26],
    [3.0, 74.5, 26.4],
    [3.5, 82, 26.6],
    [3.85, 85.8, 26.2],
    [4.1, 87.0, 26.0],
  ]);
  b.path(1, [
    [1.1, 40, 7.5],
    [2.2, 62, 7.5],
    [3.0, 78, 9.5],
    [3.6, 85.2, 14.2],
    [4.0, 87.2, 17.5],
  ]);
  b.path(2, [
    [1.1, 38, 43],
    [2.2, 60, 43.5],
    [3.1, 77, 41],
    [3.8, 82, 38],
  ]);
  b.path(3, [
    [1.4, 28, 30],
    [3.0, 50, 28],
    [3.8, 58, 27],
  ]);
  b.path(4, [
    [1.4, 22, 21],
    [3.0, 44, 22],
    [3.8, 52, 23],
  ]);
  b.path(9, [
    [0.9, 66, 24.5],
    [1.9, 78, 25],
    [2.8, 84.5, 25],
    [3.3, 83.6, 25.6],
  ]);
  b.path(5, [
    [0.8, 30, 25.5],
    [1.6, 45, 26.8],
    [2.3, 59, 27.4],
    [3.0, 71, 27.8],
    [3.5, 79, 28.2],
  ]);
  b.path(6, [
    [2.2, 50, 12],
    [3.6, 70, 15],
  ]);
  b.path(7, [
    [2.2, 48, 38],
    [3.6, 68, 35.5],
  ]);
  b.path(8, [
    [1.4, 24, 28],
    [3.0, 44, 27],
    [3.8, 52, 26],
  ]);
  const passer = c.role === 'passer';
  if (passer) {
    const passT = 3.25;
    const catchT = 3.6;
    const release = 3.95;
    b.hold(0, passT, { dribble: true });
    b.fly({ a: 1, h: 3.6 }, catchT, 0.6);
    rise(b, 1, release, 'layup', { gather: 0.04 });
    return {
      b,
      out: finish({
        user: 0,
        shooter: 1,
        release,
        shot: 'layup',
        contester: 9,
        closeFrom: 3.5,
        pass: { from: 0, t0: passT, t1: catchT, interceptor: 9 },
        shotStart: c.shotLen - 2,
      }),
    };
  }
  const release = 3.85;
  const dunk = c.rng() < 0.5;
  rise(b, 0, release, dunk ? 'dunk' : 'layup', { dribble: true, gather: 0.08 });
  return {
    b,
    out: finish({
      user: 0,
      shooter: 0,
      release,
      shot: dunk ? 'dunk' : 'layup',
      contester: 9,
      closeFrom: 3.3,
      blocker: c.rng() < 0.5 ? 5 : 9,
      stealAt: 3.2,
      stripper: 9,
      shotStart: c.shotLen - 2,
    }),
  };
}

function lastSecondHeave(c: Ctx): Scripted {
  const b = begin(
    c,
    [
      [34, 14],
      [60, 8],
      [58, 40],
      [38.5, -0.7],
      [62, 26],
    ],
    [
      [36.5, 11.8],
      [64, 10],
      [62, 38],
      [39.5, 2.2],
      [66, 26],
    ],
  );
  const inbound = 1.3;
  const catchT = 1.75;
  const release = 2.6;
  b.path(0, [
    [0.8, 37.5, 10.5],
    [1.2, 40, 8.6],
    [catchT, 41.5, 8.2],
    [2.3, 45.5, 12],
    [2.5, 47.4, 13.8],
  ]);
  b.wait(0, release + 0.4);
  b.wait(3, inbound).key(3, 2.6, [41, 3.5]);
  b.path(1, [[2.0, 72, 9]]);
  b.path(2, [[2.0, 76, 41]]);
  b.path(4, [[2.4, 82, 28]]);
  b.hold(3, inbound);
  b.fly({ a: 0, h: 3.6 }, catchT, 0.9);
  rise(b, 0, release, 'heave', { dribble: true, gather: 0.06 });
  guardAll(b, 0, release, [8]);
  b.guard(5, 0, 0, release, { gap: 3.2, offGap: 3.2, lag: 0.12, help: 0 });
  b.key(8, 1.0, [40.5, 3.0]).key(8, 2.4, [44, 7]);
  b.jump(8, 0.9, 1.25, 0.7);
  return {
    b,
    out: finish({
      user: 0,
      shooter: 0,
      release,
      shot: 'heave',
      contester: 5,
      closeFrom: 2.2,
      pass: { from: 3, t0: inbound, t1: catchT, interceptor: 5 },
      clockFrom: catchT,
      shotClockOff: true,
    }),
  };
}

function freeThrows(c: Ctx): Scripted {
  const { s, geo } = c;
  const lane = geo.laneHalfWidth + 1.2;
  const ft = s.ftLine;
  const tx = s.top[0];
  const b = begin(
    c,
    [
      [ft[0] - 1.2, ft[1]],
      [tx - 1.5, 13],
      [tx - 1.5, 37],
      [82.6, MID_Y - lane],
      [82.6, MID_Y + lane],
    ],
    [
      [tx - 0.5, MID_Y - 4],
      [79.4, MID_Y + lane],
      [79.4, MID_Y - lane],
      [86.2, MID_Y - lane],
      [86.2, MID_Y + lane],
    ],
  );
  b.key(0, 0.6, ft);
  const r1 = 1.6;
  const rel = b.resolve({ a: 0, h: RELEASE_H.ft }, r1);
  const d = dist([rel.x, rel.y], H);
  const fl = flightFor('ft', d);
  const tr1 = r1 + fl.tf;
  b.hold(0, 0.5);
  rise(b, 0, r1, 'ft', { dribble: true, gather: 0.12 });
  b.fly({ x: H[0], y: H[1], h: RIM_HEIGHT }, tr1, fl.arc);
  b.fly({ x: H[0] + 0.15, y: H[1], h: 4.4 }, tr1 + 0.28, 0);
  b.fly({ x: H[0] + 1, y: H[1] + 0.6, h: 0 }, tr1 + 0.55, 0);
  b.fly({ a: 0, h: 3.6 }, tr1 + 1.5, 2.2);
  b.scores.push({ t: tr1, team: 0, pts: 1 });
  b.nets.push(tr1);
  b.phase(tr1, 'ft1');
  const r2 = tr1 + 2.55;
  rise(b, 0, r2, 'ft', { dribble: true, gather: 0.12 });
  for (const [a, inward] of [
    [3, 1],
    [4, -1],
    [5, 0],
    [6, -1],
    [7, 1],
    [8, 1],
    [9, -1],
  ] as const) {
    const p = b.pos(a, 0);
    b.wait(a, r2 + 0.05);
    b.key(a, r2 + 0.6, [p[0] + (inward === 0 ? 2 : 0.6), p[1] + inward * 2]);
  }
  return {
    b,
    out: finish({
      user: 0,
      shooter: 0,
      release: r2,
      shot: 'ft',
      contester: 9,
      noContest: true,
      rebounder: c.rng() < 0.75 ? 8 + Math.round(c.rng()) : 3,
      shotClockOff: true,
      clockStopped: true,
    }),
  };
}

// ---------------------------------------------------------------- defense

function blockTemplate(c: Ctx): Scripted {
  const { s } = c;
  const tx = s.top[0];
  const b = begin(c, [[tx - 3, 28], s.wingB, s.cornerT, s.wingT, s.dunkerT]);
  const release = 2.85;
  b.path(0, [
    [0.95, tx - 0.6, 27.2],
    [1.3, tx + 0.2, 26.8],
    [1.85, tx + 6.5, 26.4],
    [2.3, 79.5, 26.0],
    [2.65, 84.0, 25.8],
    [2.95, 85.6, 25.6],
  ]);
  b.key(1, 0.5, s.wingB).key(1, 2.2, s.cornerB);
  b.pass(1, 0, 0.5, 0.95);
  rise(b, 0, release, 'layup', { dribble: true, gather: 0.08 });
  guardAll(b, 0, 1.3, [9]);
  b.guard(5, 0, 1.3, release, { gap: 2.6, lag: 0.38 });
  b.guard(9, 4, 0, 1.9);
  b.key(9, 2.45, [86.4, 23.2]);
  return {
    b,
    out: finish({
      user: 9,
      shooter: 0,
      release,
      shot: 'layup',
      contester: 9,
      blocker: 9,
      closeFrom: 2.45,
      stealAt: 2.55,
      stripper: 9,
      fake: c.result === 'make',
      pass: { from: 1, t0: 0.5, t1: 0.95 },
    }),
  };
}

function stealRunout(c: Ctx): Scripted {
  const { s } = c;
  const tx = s.top[0];
  const w = s.wingB;
  const start1: P = [w[0] - 1.5, w[1] + 2.2];
  const start0: P = [tx - 3.5, 26.5];
  const b = begin(
    c,
    [start0, start1, s.cornerT, s.wingT, s.blockT],
    [null, toward(start1, start0, 3.4)],
  );
  b.path(0, [
    [1.0, tx - 0.8, 27.6],
    [1.55, tx + 0.2, 28.6],
  ]);
  b.wait(0, 2.1);
  b.key(1, 0.9, [w[0] + 2.2, w[1] + 1.2]).key(1, 1.7, [w[0] - 1.2, w[1] - 1.0]);
  guardAll(b, 0, 1.5, [6]);
  const user = 6;
  if (c.result === 'make' || c.result === 'miss' || c.result === 'block') {
    // He looks you off: the lane is jumped, the cutter goes behind.
    const passT = 2.15;
    const catchT = 2.6;
    const release = 2.95;
    b.path(1, [
      [2.25, 80.5, 38.0],
      [catchT, 84.4, 33.6],
      [3.1, 86.8, 29.4],
    ]);
    b.hold(0, passT, { dribble: true });
    b.pass(0, 1, passT, catchT, { bounce: true });
    rise(b, 1, release, 'layup', { gather: 0.04 });
    b.guard(6, 1, 0, 1.5, { offGap: 3.2, help: 0.3 });
    b.path(6, [
      [1.9, w[0] - 3.4, w[1] - 4.6],
      [2.6, w[0] + 2.6, w[1] - 4.0],
    ]);
    b.jump(6, 1.65, 1.95, 0.5);
    b.guard(9, 4, 0, 2.0);
    return {
      b,
      out: finish({
        user,
        shooter: 1,
        release,
        shot: 'layup',
        contester: 9,
        closeFrom: 2.45,
        pass: { from: 0, t0: passT, t1: catchT },
      }),
    };
  }
  const passT = 1.6;
  const catchT = 2.05;
  b.key(1, catchT, [w[0] - 1.6, w[1] - 1.4]).wait(1, 2.6);
  b.hold(0, passT, { dribble: true });
  b.fly({ a: 1, h: 3.6 }, catchT, 0.7);
  b.guard(6, 1, 0, 1.3, { offGap: 3.2, help: 0.3 });
  if (c.result === 'deflect') {
    const a = b.resolve({ a: 0, h: 3.6 }, passT);
    const r = b.pos(1, catchT);
    const ti = passT + (catchT - passT) * 0.6;
    const ip = lerpP([a.x, a.y], r, 0.6);
    b.cutBall(passT);
    b.key(6, ti, toward(ip, b.pos(6, 1.3), 1.3));
    b.jump(6, ti - 0.2, ti + 0.25, 0.7);
    b.contest(6, ti - 0.4, ti + 0.2, 0.9);
    b.fly({ x: ip[0], y: ip[1], h: 4 }, ti, 0.3);
    b.fly({ x: ip[0] - 3, y: 50.7, h: 0.8 }, ti + 0.75, 1.6);
    const end = ti + 2.6;
    b.rest(end);
    b.phase(ti, 'deflect');
    b.key(6, ti + 0.8, toward(ip, [ip[0] - 2, 50], 2.5));
    const done: Done = {
      kind: 'done',
      user,
      resultT: ti,
      end,
      beat: [passT - 0.6, ti + 1.0],
      liveTo: ti,
    };
    return { b, out: done };
  }
  return {
    b,
    out: finish({
      user,
      shooter: 1,
      release: 2.6,
      shot: 'jumper',
      contester: 6,
      pass: { from: 0, t0: passT, t1: catchT, interceptor: 6 },
      stripper: 6,
    }),
  };
}

function chargeTemplate(c: Ctx): Scripted {
  const { s } = c;
  const tx = s.top[0];
  const w = s.wingB;
  const b = begin(
    c,
    [[w[0] - 2, w[1] - 3.5], [tx - 1, 24], s.cornerT, s.dunkerT, s.elbowT],
    [null, null, null, [84.5, 21.0]],
  );
  const user = 8;
  const approach: P = [82.6, 36.4];
  const spot: P = [85.6, 31.4];
  const contact = toward(spot, approach, 2.9);
  const tc = 2.35;
  b.path(0, [
    [0.95, w[0] + 0.3, w[1] - 0.7],
    [1.25, w[0] + 1.2, w[1] - 1.6],
    [1.75, w[0] + 6.4, w[1] - 3.0],
    [2.1, approach[0], approach[1]],
    [tc, contact[0], contact[1]],
  ]);
  b.key(1, 0.5, [tx - 1, 24]).key(1, 2.2, s.slotT);
  b.pass(1, 0, 0.5, 0.95);
  guardAll(b, 0, 1.25, [8]);
  b.guard(5, 0, 1.25, tc, { gap: 2.6, lag: 0.4 });
  b.wait(8, 1.3);
  if (c.result === 'charge') {
    const back = toward(contact, approach, 1.0);
    b.key(0, tc + 0.3, back).wait(0, tc + 2.2);
    b.key(8, 2.0, spot).wait(8, tc);
    b.key(8, tc + 0.35, toward(spot, contact, -2.2));
    b.down(8, tc + 0.05, tc + 2.4, -1);
    b.hold(0, tc, { dribble: true });
    const n = dist(contact, approach);
    const u: P = [(contact[0] - approach[0]) / n, (contact[1] - approach[1]) / n];
    const l1: P = [contact[0] + u[0] * 2.5 - u[1] * 2, contact[1] + u[1] * 2.5 + u[0] * 2];
    const l2: P = [l1[0] + u[0] * 1.5 - u[1] * 3, l1[1] + u[1] * 1.5 + u[0] * 3];
    b.fly({ x: l1[0], y: l1[1], h: 0 }, tc + 0.4, 1.1);
    b.fly({ x: l2[0], y: l2[1], h: 0 }, tc + 0.85, 0.7);
    const end = tc + 2.6;
    b.rest(end);
    b.phase(tc, 'charge');
    const done: Done = {
      kind: 'done',
      user,
      resultT: tc,
      end,
      beat: [tc - 1.0, tc + 1.0],
      liveTo: tc,
    };
    return { b, out: done };
  }
  if (c.result === 'foulMake') {
    b.key(8, 2.0, toward(spot, [84.6, 26.5], 2.2)).key(8, tc + 0.03, spot);
    b.key(8, tc + 0.35, toward(spot, contact, -1.6));
    b.down(8, tc + 0.1, tc + 2.6, -1);
    const release = tc + 0.35;
    b.key(0, release, toward(contact, H, 1.3)).wait(0, release + 0.6);
    rise(b, 0, release, 'layup', { dribble: true, gather: 0.05 });
    return {
      b,
      out: finish({
        user,
        shooter: 0,
        release,
        shot: 'layup',
        contester: 8,
        noContest: true,
      }),
    };
  }
  const release = 2.75;
  b.key(8, 2.1, toward(spot, [84.6, 26.5], 1.2));
  b.clear(0, 2.1, 3);
  b.key(0, tc, toward(approach, H, 2.4))
    .key(0, 2.6, [85.4, 33.6])
    .wait(0, 3.2);
  rise(b, 0, release, 'layup', { dribble: true, gather: 0.06 });
  return {
    b,
    out: finish({
      user,
      shooter: 0,
      release,
      shot: 'layup',
      contester: 8,
      closeFrom: 2.15,
      stealAt: 2.2,
      stripper: 8,
      pass: { from: 1, t0: 0.5, t1: 0.95 },
    }),
  };
}

// ---------------------------------------------------------------- dead balls

function checkup(c: Ctx): Scripted {
  const b = begin(
    c,
    [
      [68, 22],
      [72, 40],
      [79, 31.5],
      [82, 18],
      [85, 28],
    ],
    [
      [69.5, 26],
      [75, 38],
      [81, 35],
      [84, 20.5],
      [87.5, 34],
    ],
  );
  const user = 2;
  b.hold(9, 0.1, { hoopX: HOOP_X_LEFT });
  if (c.result === 'playThrough') {
    b.down(2, 0, 1.7, -0.6);
    b.key(0, 1.3, [76.8, 29.2]).wait(0, 2.4).key(0, 4.6, [64.5, 24]);
    b.key(2, 1.7, [79, 31.5]).key(2, 2.1, [78.2, 32.6]).wait(2, 3.2);
    b.jump(2, 2.25, 2.6, 0.8);
    b.jump(2, 2.75, 3.1, 0.8);
    b.key(2, 4.8, [72.5, 41.5]);
    b.key(1, 3.4, [70.5, 44]);
    b.key(4, 2.8, [84.4, 27]);
    b.hold(9, 5.6, { hoopX: HOOP_X_LEFT });
    b.phase(2.2, 'playThrough');
    const done: Done = {
      kind: 'done',
      user,
      resultT: 2.2,
      end: 5.6,
      beat: [1.9, 3.3],
      liveTo: 0,
      clockStopped: true,
      shotClockOff: true,
    };
    return { b, out: done };
  }
  b.down(2, 0, 1.9, -0.75);
  b.down(2, 1.9, 6.4, -0.35);
  b.path(2, [
    [1.6, 79, 31.5],
    [2.6, 78, 34.5],
    [3.6, 76.6, 37.8],
    [4.6, 75.2, 41.2],
    [5.6, 73.8, 44.6],
    [6.4, 72.8, 47.4],
  ]);
  b.path(3, [
    [1.2, 80.6, 30.2],
    [2.6, 80.2, 33.4],
    [3.6, 78.8, 36.6],
    [4.6, 77.4, 39.8],
    [5.4, 76.4, 42],
  ]);
  b.key(0, 2.0, [75, 27]);
  b.hold(9, 6.6, { hoopX: HOOP_X_LEFT });
  b.phase(1.2, 'sit');
  const done: Done = {
    kind: 'done',
    user,
    resultT: 1.2,
    end: 6.6,
    beat: [0.4, 2.4],
    liveTo: 0,
    clockStopped: true,
    shotClockOff: true,
  };
  return { b, out: done };
}

// ---------------------------------------------------------------- registry

export type TemplateFn = (c: Ctx) => Scripted;

export const TEMPLATES: Readonly<Record<string, TemplateFn>> = {
  fast_break: fastBreak,
  pick_and_roll_pullup: pickAndRollPullup,
  pick_and_roll_roll: pickAndRollRoll,
  iso_pullup: isoPullup,
  step_back_three: stepBackThree,
  catch_shoot_three: catchShootThree,
  drive_layup: driveLayup,
  drive_and_kick: driveAndKick,
  post_up: postUp,
  floater,
  alley_oop: alleyOop,
  put_back: putBack,
  block: blockTemplate,
  steal_runout: stealRunout,
  charge: chargeTemplate,
  checkup,
  last_second_heave: lastSecondHeave,
  free_throws: freeThrows,
};

/** Templates where the user's team is defending. */
export const DEFENSE_TEMPLATES: readonly string[] = ['block', 'steal_runout', 'charge'];

/** Templates whose moment is always a pass by the user. */
export const PASS_TEMPLATES: readonly string[] = ['drive_and_kick', 'pick_and_roll_roll'];
