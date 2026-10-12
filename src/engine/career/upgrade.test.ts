import { describe, expect, it } from 'vitest';

import { content } from '@/content';

import { BOTS } from '../bots/bots';
import { indexContent } from '../content/registry';
import { testPlayer } from '../testing/creation';
import { createCareer, STARTING_SKILL_POINTS } from './create';
import { userOf, type GameState } from './state';
import { advanceSlice, resolve } from './turn';
import { timingEdge } from './game';
import { autoSpend, gamePoints, upgradeCost, upgradeSkill } from './upgrade';

const index = indexContent(content);

/** Plays on with a bot until his first game tips off. */
function toFirstGame(state: GameState): string {
  for (let guard = 0; guard < 5000; guard++) {
    const step = advanceSlice(state, index, Infinity, { gameStart: true });
    if (step.kind === 'gameStart') return step.gameId;
    if (step.kind === 'interrupt')
      resolve(state, index, step.interrupt.id, BOTS.casual.choose(state, index, step.interrupt));
    if (step.kind === 'ended') break;
  }
  throw new Error('no game');
}

describe('skill points', () => {
  it('start with a few to spend, and spending one raises the skill at once', () => {
    const state = createCareer(index, testPlayer('points-a'));
    expect(state.career.skillPoints).toBe(STARTING_SKILL_POINTS);
    const user = userOf(state);
    const before = user.skills.shooting;
    const cost = upgradeCost(user, 'shooting');
    expect(upgradeSkill(state, 'shooting')).toBe(true);
    expect(user.skills.shooting).toBeCloseTo(before + 1);
    expect(state.career.skillPoints).toBeCloseTo(STARTING_SKILL_POINTS - cost);
    expect(state.career.feed.at(-1)?.message.key).toBe('feed.skillUp');
  });

  it('cost more as a skill climbs and refuse what he cannot afford', () => {
    const state = createCareer(index, testPlayer('points-b'));
    const user = userOf(state);
    user.skills.defence = 30;
    const cheap = upgradeCost(user, 'defence');
    user.skills.defence = 80;
    expect(upgradeCost(user, 'defence')).toBeGreaterThan(cheap);
    state.career.skillPoints = 0;
    expect(upgradeSkill(state, 'defence')).toBe(false);
    expect(user.skills.defence).toBe(80);
  });

  it('come from practice and from games', () => {
    expect(gamePoints(0, 10, true)).toBe(0);
    expect(gamePoints(32, 8, true)).toBeGreaterThan(gamePoints(32, -4, false));
    const state = createCareer(index, testPlayer('points-c'));
    const earned = state.career.skillPointsEarned;
    toFirstGame(state);
    for (let guard = 0; guard < 20; guard++) {
      const step = advanceSlice(state, index, Infinity, { gameEnd: true });
      if (step.kind === 'interrupt')
        resolve(state, index, step.interrupt.id, BOTS.casual.choose(state, index, step.interrupt));
      else if (step.kind === 'gameEnd') break;
    }
    expect(state.career.skillPointsEarned).toBeGreaterThan(earned);
    // A week of practice adds more.
    const afterGame = state.career.skillPointsEarned;
    state.career.plan = { ...state.career.plan, train: {}, practice: 4 };
    for (let guard = 0; guard < 100; guard++) {
      const step = advanceSlice(state, index, Infinity);
      if (step.kind === 'interrupt')
        resolve(state, index, step.interrupt.id, BOTS.casual.choose(state, index, step.interrupt));
      else if (step.kind === 'weekDone') break;
    }
    expect(state.career.skillPointsEarned).toBeGreaterThan(afterGame);
  }, 60_000);

  it('can be spent automatically by weights', () => {
    const state = createCareer(index, testPlayer('points-d'));
    state.career.skillPoints = 12;
    const before = { ...userOf(state).skills };
    autoSpend(state, {
      ...before,
      shooting: 1,
      playmaking: 0,
      handling: 0,
      defence: 0,
      rebounding: 0,
      athleticism: 0,
      gameSense: 0,
    });
    expect(userOf(state).skills.shooting).toBeGreaterThan(before.shooting);
    expect(state.career.skillPoints).toBeLessThan(upgradeCost(userOf(state), 'shooting'));
  });
});

describe('watching a game', () => {
  it('stops at his tip-off and at the final buzzer, with the play log kept', () => {
    const state = createCareer(index, testPlayer('live-a'));
    const gameId = toFirstGame(state);
    expect(state.career.cursor.live?.gameId).toBe(gameId);
    let ended = false;
    for (let guard = 0; guard < 20 && !ended; guard++) {
      const step = advanceSlice(state, index, Infinity, { gameEnd: true });
      if (step.kind === 'interrupt')
        resolve(state, index, step.interrupt.id, BOTS.casual.choose(state, index, step.interrupt));
      else if (step.kind === 'gameEnd') {
        expect(step.gameId).toBe(gameId);
        ended = true;
      }
    }
    expect(ended).toBe(true);
    const finished = state.career.cursor.finished;
    expect(finished?.gameId).toBe(gameId);
    expect(finished?.live.plays.length).toBeGreaterThan(50);
    expect(state.world.games[gameId]?.result).toBeTruthy();
  }, 60_000);

  it('plays a scorer more and a defender less on offence', () => {
    const shots = (approach: 'score' | 'defend') => {
      const state = createCareer(index, testPlayer('live-b'));
      state.career.approach = approach;
      toFirstGame(state);
      for (let guard = 0; guard < 20; guard++) {
        const step = advanceSlice(state, index, Infinity, { gameEnd: true });
        if (step.kind === 'interrupt')
          resolve(
            state,
            index,
            step.interrupt.id,
            BOTS.casual.choose(state, index, step.interrupt),
          );
        else if (step.kind === 'gameEnd') break;
      }
      const live = state.career.cursor.finished;
      const line = live?.live.stats[live.userSide].find((l) => l.id === state.career.playerId);
      return line?.fga ?? 0;
    };
    expect(shots('score')).toBeGreaterThan(shots('defend'));
  }, 120_000);
});

describe('the skill check', () => {
  it('turns timing into odds: perfect helps, bad hurts, none is neutral', () => {
    expect(timingEdge(undefined)).toBe(0);
    expect(timingEdge(0.5)).toBe(0);
    expect(timingEdge(1)).toBeGreaterThan(0.5);
    expect(timingEdge(0)).toBeLessThan(-0.5);
    expect(timingEdge(7)).toBe(timingEdge(1));
  });
});
