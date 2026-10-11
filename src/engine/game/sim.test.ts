import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { asGameId } from '../core/ids';
import { createRng } from '../core/rng';
import type { PlayerLine } from '../model/game';
import { fixtureTeam } from '../testing/fixtures';
import { prepareTeam } from './prepare';
import { COLLEGE_RULES, PRO_RULES, totalRegulationSec, type LeagueRules } from './rules';
import { playScripted, runGame, startGame } from './sim';
import type { LiveGame } from './types';

function play(seed: string, rules: LeagueRules, level: number): LiveGame {
  const rng = createRng(seed, 'fixture');
  const h = fixtureTeam(rng, 'home', level);
  const a = fixtureTeam(rng, 'away', level);
  const home = prepareTeam({
    teamId: h.teamId,
    roster: h.roster,
    tactics: h.tactics,
    acumen: 50,
    rules,
  });
  const away = prepareTeam({
    teamId: a.teamId,
    roster: a.roster,
    tactics: a.tactics,
    acumen: 50,
    rules,
  });
  const live = startGame({
    gameId: asGameId('g'),
    rules,
    home: home.team,
    away: away.team,
    homeCourt: true,
    seed,
    recordPlays: true,
  });
  runGame(live, null);
  return live;
}

const total = (lines: readonly PlayerLine[], key: keyof Omit<PlayerLine, 'id' | 'starter'>) =>
  lines.reduce((s, l) => s + l[key], 0);

describe('game simulation invariants', () => {
  for (const rules of [COLLEGE_RULES, PRO_RULES]) {
    it(`keeps ${rules.id} box scores consistent`, () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 8 }),
          fc.integer({ min: 30, max: 75 }),
          (seed, level) => {
            const g = play(seed, rules, level);
            expect(g.finished).toBe(true);
            expect(g.score[0]).not.toBe(g.score[1]);
            const overtimes = Math.max(0, g.period - rules.periods);
            const gameSec = totalRegulationSec(rules) + overtimes * rules.overtimeSec;
            for (const side of [0, 1] as const) {
              const lines = g.stats[side];
              const other = g.stats[side === 0 ? 1 : 0];
              expect(total(lines, 'pts')).toBe(g.score[side]);
              for (const l of lines) {
                expect(l.pts).toBe(2 * (l.fgm - l.tpm) + 3 * l.tpm + l.ftm);
                expect(l.fgm).toBeLessThanOrEqual(l.fga);
                expect(l.tpm).toBeLessThanOrEqual(l.tpa);
                expect(l.tpa).toBeLessThanOrEqual(l.fga);
                expect(l.ftm).toBeLessThanOrEqual(l.fta);
                expect(l.pf).toBeLessThanOrEqual(rules.foulOut);
                for (const v of [l.sec, l.orb, l.drb, l.ast, l.stl, l.blk, l.tov])
                  expect(v).toBeGreaterThanOrEqual(0);
              }
              expect(total(lines, 'sec')).toBeCloseTo(gameSec * 5, 3);
              expect(total(lines, 'pm')).toBe(5 * (g.score[side] - g.score[side === 0 ? 1 : 0]));
              const misses =
                total(other, 'fga') -
                total(other, 'fgm') +
                (total(other, 'fta') - total(other, 'ftm'));
              expect(total(lines, 'drb') + total(other, 'orb')).toBeLessThanOrEqual(misses);
              expect(total(lines, 'blk')).toBeLessThanOrEqual(
                total(other, 'fga') - total(other, 'fgm'),
              );
              expect(total(lines, 'stl')).toBeLessThanOrEqual(total(other, 'tov'));
            }
          },
        ),
        { numRuns: 60 },
      );
    });
  }

  it('is deterministic for the same seed', () => {
    const a = play('same', COLLEGE_RULES, 48);
    const b = play('same', COLLEGE_RULES, 48);
    expect(a.score).toEqual(b.score);
    expect(a.stats).toEqual(b.stats);
  });

  it('resumes identically after a JSON round trip mid-game', () => {
    const rng = createRng('resume', 'fixture');
    const h = fixtureTeam(rng, 'home', 50);
    const a = fixtureTeam(rng, 'away', 50);
    const rules = COLLEGE_RULES;
    const home = prepareTeam({
      teamId: h.teamId,
      roster: h.roster,
      tactics: h.tactics,
      acumen: 50,
      rules,
    });
    const away = prepareTeam({
      teamId: a.teamId,
      roster: a.roster,
      tactics: a.tactics,
      acumen: 50,
      rules,
    });
    const make = () =>
      startGame({
        gameId: asGameId('g'),
        rules,
        home: home.team,
        away: away.team,
        homeCourt: true,
        seed: 'r',
        recordPlays: false,
      });
    let possessions = 0;
    const pauseAt60 = () => ++possessions === 60;

    const straight = make();
    possessions = 0;
    runGame(straight, pauseAt60);
    runGame(straight, null);

    const paused = make();
    possessions = 0;
    runGame(paused, pauseAt60);
    const restored = JSON.parse(JSON.stringify(paused)) as LiveGame;
    runGame(restored, null);

    expect(restored.score).toEqual(straight.score);
    expect(restored.stats).toEqual(straight.stats);
  });

  it('applies a scripted game-winner', () => {
    const rng = createRng('script', 'fixture');
    const h = fixtureTeam(rng, 'home', 50);
    const a = fixtureTeam(rng, 'away', 50);
    const rules = COLLEGE_RULES;
    const home = prepareTeam({
      teamId: h.teamId,
      roster: h.roster,
      tactics: h.tactics,
      acumen: 50,
      rules,
    });
    const away = prepareTeam({
      teamId: a.teamId,
      roster: a.roster,
      tactics: a.tactics,
      acumen: 50,
      rules,
    });
    const live = startGame({
      gameId: asGameId('g'),
      rules,
      home: home.team,
      away: away.team,
      homeCourt: true,
      seed: 's',
      recordPlays: false,
    });
    runGame(live, (c) => c.live.period === 2 && c.live.clock < 120);
    const before = live.score[0];
    const shooter = live.onCourt[0][0]!;
    live.possession = 0;
    playScripted(live, 0, {
      kind: 'shot',
      shooter,
      shotType: 'three',
      made: true,
      assistBy: null,
      fouled: false,
      duration: 10,
    });
    expect(live.score[0]).toBe(before + 3);
    expect(live.momentsUsed).toBe(1);
    runGame(live, null);
    expect(live.finished).toBe(true);
  });
});
