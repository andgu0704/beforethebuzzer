import { describe, expect, it } from 'vitest';

import { HOOP_X, MID_Y, RIM_HEIGHT } from './court';
import {
  buildPlay,
  gameClockAt,
  MAX_DURATION,
  MIN_DURATION,
  PLAY_TEMPLATES,
  sample,
} from './plays';
import { describeFrame, resolveLook } from './scene';
import { clipTextEn, sceneLabels } from './text';
import { mainEnd, timelineAt, totalSeconds } from './timeline';
import type { ClipOutcome, Play, PlaySpec } from './types';

const OUTCOMES: readonly ClipOutcome[] = [
  'make',
  'miss',
  'block',
  'steal',
  'turnover',
  'assist',
  'stop',
  'scored',
  'pain',
];

const EXTRA_TEMPLATES = ['floater', 'put_back', 'last_second_heave', 'free_throws'];

function spec(template: string, outcome: ClipOutcome, over: Partial<PlaySpec> = {}): PlaySpec {
  return {
    template,
    outcome,
    success: outcome === 'make' || outcome === 'assist' || outcome === 'stop',
    shotType: null,
    userSide: 0,
    userJersey: 23,
    period: 2,
    clock: 300,
    scoreBefore: [50, 48],
    variation: 11,
    ...over,
  };
}

const STEPS = 240;

function frames(play: Play) {
  return Array.from({ length: STEPS + 1 }, (_, i) => sample(play, i / STEPS));
}

function everyPlay(): { name: string; play: Play }[] {
  const out: { name: string; play: Play }[] = [];
  for (const template of PLAY_TEMPLATES) {
    for (const outcome of OUTCOMES) {
      for (const variation of [3, 4]) {
        out.push({
          name: `${template}/${outcome}/${variation}`,
          play: buildPlay(spec(template, outcome, { variation })),
        });
      }
    }
  }
  return out;
}

const ALL = everyPlay();

/** Whether the ball drops through the hoop: centred over the rim at rim height, then below it. */
function goesIn(play: Play): boolean {
  const fs = frames(play);
  let over = -1;
  for (let i = 0; i < fs.length; i++) {
    const f = fs[i]!;
    const d = Math.hypot(f.ballX - HOOP_X, f.ballY - MID_Y);
    if (d < 0.35 && Math.abs(f.ballH - RIM_HEIGHT) < 0.6) over = i;
    if (over >= 0 && i > over && d < 0.6 && f.ballH < RIM_HEIGHT - 2) return true;
  }
  return false;
}

/** Whether the ball is ever inside the rim's cylinder below the rim. */
function belowRimInside(play: Play): boolean {
  return frames(play).some(
    (f) => Math.hypot(f.ballX - HOOP_X, f.ballY - MID_Y) < 0.5 && f.ballH < RIM_HEIGHT - 0.3,
  );
}

describe('buildPlay', () => {
  it('knows every template the moments use, and the new ones', () => {
    for (const t of [
      'iso_pullup',
      'step_back_three',
      'catch_shoot_three',
      'drive_layup',
      'pick_and_roll_pullup',
      'pick_and_roll_roll',
      'drive_and_kick',
      'post_up',
      'fast_break',
      'alley_oop',
      'block',
      'steal_runout',
      'charge',
      'checkup',
      ...EXTRA_TEMPLATES,
    ]) {
      expect(PLAY_TEMPLATES).toContain(t);
    }
  });

  it('builds every template × outcome with a 5–10 s duration', () => {
    for (const { name, play } of ALL) {
      expect(play.duration, name).toBeGreaterThanOrEqual(MIN_DURATION);
      expect(play.duration, name).toBeLessThanOrEqual(MAX_DURATION);
      expect(play.kt.length, name).toBe(10);
      expect(play.resultT, name).toBeLessThanOrEqual(play.duration);
      expect(play.actorNumber[play.userActor], name).toBe(23);
      expect(new Set(play.actorNumber.slice(0, 5)).size, name).toBe(5);
      expect(new Set(play.actorNumber.slice(5)).size, name).toBe(5);
    }
  });

  it('is deterministic for the same spec', () => {
    for (const template of PLAY_TEMPLATES) {
      const a = buildPlay(spec(template, 'make', { variation: 77 }));
      const b = buildPlay(spec(template, 'make', { variation: 77 }));
      expect(a).toEqual(b);
      expect(sample(a, 0.6)).toEqual(sample(b, 0.6));
    }
  });

  it('varies with the variation seed', () => {
    const plays = [1, 2, 3, 4, 5, 6].map((v) =>
      buildPlay(spec('iso_pullup', 'make', { variation: v })),
    );
    const starts = new Set(
      plays.map((p) => `${p.kx[0]?.[0]?.toFixed(2)},${p.ky[0]?.[0]?.toFixed(2)}`),
    );
    expect(starts.size).toBeGreaterThan(3);
  });

  it('builds from a feed entry with only template, outcome, success, period and clock', () => {
    const play = buildPlay({
      template: 'post_up',
      outcome: 'make',
      success: true,
      period: 1,
      clock: 640,
    });
    expect(play.showScore).toBe(false);
    expect(play.duration).toBeGreaterThanOrEqual(MIN_DURATION);
  });

  it('falls back to a close template for an unknown id', () => {
    expect(buildPlay(spec('spin_baseline', 'make', { shotType: 'three' })).template).toBe(
      'catch_shoot_three',
    );
    expect(buildPlay(spec('mystery', 'pain')).template).toBe('checkup');
    expect(buildPlay(spec('mystery', 'stop')).template).toBe('block');
  });
});

describe('sample', () => {
  it('keeps players and ball on the floor (or just off it) throughout', () => {
    const bad: string[] = [];
    for (const { name, play } of ALL) {
      for (const f of frames(play)) {
        for (let a = 0; a < 10; a++) {
          const x = f.x[a]!;
          const y = f.y[a]!;
          if (x < -2 || x > 96 || y < -2 || y > 52) bad.push(`${name} actor ${a} at ${f.time}`);
        }
        if (f.ballX < -4 || f.ballX > 98 || f.ballY < -4 || f.ballY > 54) {
          bad.push(`${name} ball at ${f.time}`);
        }
        if (f.ballH < 0 || f.ballH > 26) bad.push(`${name} ball height ${f.ballH}`);
        if (f.camX < 20 || f.camX > 75) bad.push(`${name} camera ${f.camX}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('moves players at human speeds and the ball without jumps', () => {
    const bad: string[] = [];
    for (const { name, play } of ALL) {
      const n = Math.round(play.duration * 60);
      let prev = sample(play, 0);
      for (let i = 1; i <= n; i++) {
        const f = sample(play, i / n);
        const dt = f.time - prev.time;
        for (let a = 0; a < 10; a++) {
          const v = Math.hypot(f.x[a]! - prev.x[a]!, f.y[a]! - prev.y[a]!) / dt;
          if (v >= 28) bad.push(`${name} actor ${a} at ${f.time.toFixed(2)}: ${v.toFixed(1)} ft/s`);
        }
        const jump = Math.hypot(f.ballX - prev.ballX, f.ballY - prev.ballY);
        if (jump >= 1.6) bad.push(`${name} ball at ${f.time.toFixed(2)}: ${jump.toFixed(2)} ft`);
        prev = f;
      }
    }
    expect(bad).toEqual([]);
  });

  it('puts the ball through the hoop on makes and not on misses', () => {
    for (const { name, play } of ALL) {
      const scores = ['make', 'foulMake', 'ftBoth'].includes(play.result);
      if (scores) expect(goesIn(play), name).toBe(true);
      if (['miss', 'block', 'strip', 'pickoff', 'charge', 'deflect'].includes(play.result)) {
        expect(goesIn(play), name).toBe(false);
        expect(belowRimInside(play), name).toBe(false);
      }
    }
  });

  it('adds the points to the scoring side once the ball is through', () => {
    for (const { name, play } of ALL) {
      const before = play.scoreBefore[0] + play.scoreBefore[1];
      const after = sample(play, 1).score;
      const gained = after[0] + after[1] - before;
      switch (play.result) {
        case 'make':
        case 'foulMake':
          expect([2, 3], name).toContain(gained);
          expect(after[play.offenseSide] - play.scoreBefore[play.offenseSide], name).toBe(gained);
          break;
        case 'ftBoth':
          expect(gained, name).toBe(2);
          break;
        case 'ftSplit':
          expect(gained, name).toBe(1);
          break;
        default:
          expect(gained, name).toBe(0);
      }
      expect(sample(play, 0).score).toEqual([...play.scoreBefore]);
    }
  });

  it('credits the user’s side when the user scores and the other side when he is scored on', () => {
    const mine = buildPlay(spec('drive_layup', 'make', { userSide: 1 }));
    expect(sample(mine, 1).score).toEqual([50, 50]);
    const theirs = buildPlay(spec('block', 'scored', { userSide: 1 }));
    expect(sample(theirs, 1).score).toEqual([52, 48]);
  });

  it('runs the game and shot clocks down, and sounds the buzzer only in the final seconds', () => {
    const play = buildPlay(spec('iso_pullup', 'make', { clock: 300 }));
    expect(sample(play, 1).gameClock).toBeLessThan(300);
    expect(sample(play, 1).gameClock).toBeGreaterThan(290);
    expect(play.buzzerAt).toBe(-1);
    expect(sample(play, 1).shotClock).toBeLessThan(sample(play, 0).shotClock);

    const heave = buildPlay(spec('last_second_heave', 'make', { clock: 2.4 }));
    expect(heave.buzzerAt).toBeGreaterThan(0);
    expect(gameClockAt(heave, 0)).toBeCloseTo(2.4);
    expect(gameClockAt(heave, heave.buzzerAt / heave.duration)).toBeCloseTo(0);
    expect(gameClockAt(heave, 1)).toBe(0);
    expect(sample(heave, 0).shotClock).toBe(-1);

    const ft = buildPlay(spec('free_throws', 'make'));
    expect(sample(ft, 1).gameClock).toBe(300);
  });

  it('draws the ball trail only while the ball is in the air', () => {
    const play = buildPlay(spec('catch_shoot_three', 'make'));
    const flying = frames(play).filter((f) => f.trailX.length > 0);
    expect(flying.length).toBeGreaterThan(10);
    expect(frames(play).some((f) => f.ringA > 0.5)).toBe(true);
  });
});

describe('scene and timeline', () => {
  it('describes a frame with the ten players, the ball and the scoreboard', () => {
    const play = buildPlay(spec('pick_and_roll_pullup', 'make'));
    const look = resolveLook(
      'dark',
      { abbr: 'HSH', primary: '#14634A' },
      { abbr: 'RVR', primary: '#8A1C2B' },
    );
    const ops = describeFrame(
      play,
      sample(play, 0.5),
      look,
      sceneLabels(play, clipTextEn, ['HSH', 'RVR']),
      false,
    );
    const texts = ops.flatMap((o) => (o.k === 'text' ? [o.text] : []));
    expect(texts).toContain('23');
    expect(texts).toContain('HSH');
    expect(texts).toContain('H2');
    expect(ops[0]?.k).toBe('court');
  });

  it('switches the away side to road whites when the teams clash', () => {
    const look = resolveLook(
      'light',
      { abbr: 'A', primary: '#14634A' },
      { abbr: 'B', primary: '#166B4E' },
    );
    expect(look.fill[1]).toBe('#FFFFFF');
  });

  it('adds a slow-motion replay of the final beat for a signature move', () => {
    const play = buildPlay(spec('step_back_three', 'make'));
    expect(totalSeconds(play, true)).toBeGreaterThan(play.duration + 1);
    const out = [0, 0];
    timelineAt(play, mainEnd(play, true), true, out);
    expect(out).toEqual([1, 0]);
    timelineAt(play, 1, true, out);
    expect(out[1]).toBe(1);
    expect(out[0]! * play.duration).toBeCloseTo(play.beat[1]);
    timelineAt(play, 0.5, false, out);
    expect(out).toEqual([0.5, 0]);
  });
});
