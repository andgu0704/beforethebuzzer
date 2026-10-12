/**
 * Skill points: earned in practice and in games, spent by the player on the skills he chooses.
 * Every point spent shows at once in his ratings and in the next game. Ageing still takes its
 * toll on its own (see player/growth), and a little comes from simply playing.
 */

import { ageAt } from '../core/calendar';
import { clamp } from '../core/math';
import type { ContentIndex } from '../content/registry';
import { ageFactor } from '../player/growth';
import { SKILLS, type Skill } from '../model/skills';
import type { Player } from '../model/person';
import { msg, pushFeed, userOf, userTeamId, type GameState } from './state';
import { mergeTraits } from './traits';

/** Points per practice block for a young player with an average coach, before tiredness. */
export const PRACTICE_RATE = 0.25;
/** Practice blocks beyond this earn less each. */
const FULL_RETURN_BLOCKS = 4;
export const MAX_SKILL = 99;

/** Points from a week's practice blocks: full value up to four, then less for each extra. */
export function practicePoints(state: GameState, index: ContentIndex, blocks: number): number {
  if (blocks <= 0) return 0;
  const user = userOf(state);
  const teamId = userTeamId(state);
  const team = teamId ? state.world.teams[teamId] : undefined;
  const coach = team?.coachId ? state.world.people[team.coachId] : undefined;
  const development = coach?.kind === 'coach' ? coach.development : 50;
  const traits = mergeTraits(index, user);
  const fatigue = clamp((40 - user.energy) / 40, 0, 1);
  const effective =
    Math.min(blocks, FULL_RETURN_BLOCKS) + Math.max(0, blocks - FULL_RETURN_BLOCKS) * 0.45;
  const age = Math.max(0.25, ageFactor(ageAt(user.birthYear, state.world.date)));
  return (
    PRACTICE_RATE *
    effective *
    age *
    (0.78 + development / 230) *
    user.growthRate *
    traits.growth *
    (1 - 0.6 * fatigue)
  );
}

/**
 * Points from a game: playing time, more for a game that beat what was expected of him, a
 * little for a win. Young players learn more from each game than veterans do.
 */
export function gamePoints(minutes: number, vsExpected: number, won: boolean, age = 20): number {
  if (minutes <= 0) return 0;
  const learning = Math.max(0.3, ageFactor(age));
  return ((minutes / 40) * 1.2 + clamp(vsExpected * 0.15, 0, 1.8) + (won ? 0.45 : 0)) * learning;
}

export function earnPoints(state: GameState, points: number): void {
  if (points <= 0) return;
  const career = state.career;
  career.skillPoints = Math.round((career.skillPoints + points) * 100) / 100;
  career.skillPointsEarned = Math.round((career.skillPointsEarned + points) * 100) / 100;
}

/** Points to raise a skill by one: dearer as it climbs, and far dearer past his natural ceiling. */
export function upgradeCost(user: Player, skill: Skill): number {
  const value = user.skills[skill];
  if (value >= MAX_SKILL) return Infinity;
  const base = value < 40 ? 3 : value < 60 ? 6 : value < 72 ? 9 : value < 84 ? 12 : 15;
  const ceiling = user.ceiling[skill];
  return value >= ceiling ? base * 3 : value >= ceiling - 4 ? Math.ceil(base * 1.5) : base;
}

/** How close a skill is to his ceiling, as the coaches would describe it. */
export function headroom(user: Player, skill: Skill): 'lots' | 'some' | 'little' | 'none' {
  const gap = user.ceiling[skill] - user.skills[skill];
  return gap >= 12 ? 'lots' : gap >= 5 ? 'some' : gap > 0 ? 'little' : 'none';
}

export function canUpgrade(state: GameState, skill: Skill): boolean {
  const user = userOf(state);
  return state.career.skillPoints >= upgradeCost(user, skill);
}

/** Spends points to raise one skill by a point. Returns false if he cannot afford it. */
export function upgradeSkill(state: GameState, skill: Skill): boolean {
  const user = userOf(state);
  const cost = upgradeCost(user, skill);
  if (state.career.skillPoints < cost) return false;
  const before = user.skills[skill];
  user.skills[skill] = Math.min(MAX_SKILL, Math.round((before + 1) * 100) / 100);
  state.career.skillPoints = Math.round((state.career.skillPoints - cost) * 100) / 100;
  if (Math.floor(user.skills[skill]) > Math.floor(before))
    pushFeed(
      state,
      'development',
      msg('feed.skillUp', { skill, value: Math.floor(user.skills[skill]) }),
      { data: { from: Math.floor(before), to: Math.floor(user.skills[skill]), spent: cost } },
    );
  return true;
}

/**
 * Spends every point he can, a skill at a time, by the weights given (higher weight per point
 * of cost first). Bots and simulate-ahead use this; the player spends his own by hand.
 */
export function autoSpend(state: GameState, weights: Readonly<Record<Skill, number>>): void {
  const user = userOf(state);
  for (let guard = 0; guard < 200; guard++) {
    let best: Skill | null = null;
    let bestValue = 0;
    for (const skill of SKILLS) {
      const cost = upgradeCost(user, skill);
      if (cost > state.career.skillPoints) continue;
      const value = weights[skill] / cost;
      if (value > bestValue) {
        best = skill;
        bestValue = value;
      }
    }
    if (!best || !upgradeSkill(state, best)) return;
  }
}
