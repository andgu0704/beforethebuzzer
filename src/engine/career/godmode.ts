/**
 * God Mode commands. Every command marks the career permanently: it gets a badge and is kept
 * out of records, rankings and achievements. Unlocking alone does not mark it; using any
 * command (including looking at hidden values) does.
 */

import { weekIndex, type GameDate } from '../core/calendar';
import type { TeamId } from '../core/ids';
import { clamp } from '../core/math';
import { createRng } from '../core/rng';
import type { ContentIndex } from '../content/registry';
import type { StatusKey } from '../content/story-types';
import { overallOf } from '../game/ratings';
import type { ScheduledConsequence } from '../model/career';
import { SKILLS, type Skill, type Skills } from '../model/skills';
import { makeInjury } from '../player/injury';
import { BOTS } from '../bots/bots';
import { changeStatus } from './effects';
import { raiseEvent } from './events';
import { cause, msg, pushTimeline, userOf, type GameState } from './state';
import { advance, resolve } from './turn';

function mark(state: GameState, action: string): void {
  if (!state.career.godMode.unlocked) throw new Error('God Mode is locked for this career');
  if (!state.meta.integrity.godMode) {
    pushTimeline(state, msg('timeline.godMode'), cause(state, 'godMode', action), true);
  }
  state.meta.integrity.godMode = true;
  state.meta.integrity.log.push({ date: state.world.date, action });
}

/** Called after the passcode is accepted. */
export function unlockGodMode(state: GameState): void {
  state.career.godMode.unlocked = true;
}

export function setSkill(state: GameState, skill: Skill, value: number): void {
  mark(state, `skill:${skill}=${value}`);
  const user = userOf(state);
  user.skills[skill] = clamp(value, 1, 99);
  user.ceiling[skill] = Math.max(user.ceiling[skill], user.skills[skill]);
}

export function setCeiling(state: GameState, skill: Skill | 'all', value: number): void {
  mark(state, `ceiling:${skill}=${value}`);
  const user = userOf(state);
  for (const s of skill === 'all' ? SKILLS : [skill])
    user.ceiling[s] = clamp(Math.max(value, user.skills[s]), 1, 99);
}

export function setStatus(
  state: GameState,
  index: ContentIndex,
  key: StatusKey,
  value: number,
): void {
  mark(state, `status:${key}=${value}`);
  const user = userOf(state);
  const current =
    key === 'energy'
      ? user.energy
      : key === 'health'
        ? user.health
        : key === 'confidence'
          ? user.confidence
          : state.career[key];
  changeStatus(state, index, key, value - current);
}

export function heal(state: GameState): void {
  mark(state, 'heal');
  const user = userOf(state);
  user.injury = null;
  user.health = 100;
}

export function injure(state: GameState, kind: string, weeks: number): void {
  mark(state, `injure:${kind}:${weeks}`);
  const user = userOf(state);
  const severity =
    weeks <= 2 ? 'minor' : weeks <= 6 ? 'moderate' : weeks <= 14 ? 'major' : 'severe';
  const injury = makeInjury(
    createRng(state.world.seed, 'godInjury', weekIndex(state.world.date)),
    state.world.date,
    severity,
    1,
    kind,
  );
  injury.weeksLeft = weeks;
  user.injury = injury;
}

export function forceNextMoment(state: GameState, result: 'success' | 'failure'): void {
  mark(state, `forceMoment:${result}`);
  state.career.godMode.forceNextMoment = result;
}

export function forceNextGame(state: GameState, result: 'win' | 'loss'): void {
  mark(state, `forceGame:${result}`);
  state.career.godMode.forceNextGame = result;
}

/** Draft stock in board points; positive moves him up. */
export function setDraftStock(state: GameState, points: number): void {
  mark(state, `stock=${points}`);
  state.career.stock = points;
}

export function setDraftingTeam(state: GameState, teamId: TeamId | null): void {
  mark(state, `draftTeam=${teamId ?? 'none'}`);
  state.career.godMode.draftTeam = teamId;
}

export function forceCallUp(state: GameState): void {
  mark(state, 'callUp');
  state.career.godMode.forceCallUp = true;
}

export function triggerEvent(state: GameState, index: ContentIndex, eventId: string): void {
  const e = index.event.get(eventId);
  if (!e) throw new Error(`no event ${eventId}`);
  mark(state, `event:${eventId}`);
  raiseEvent(state, index, e, cause(state, 'godMode', eventId));
}

/**
 * Jumps to a date. Weeks in between are played with his current plan; every decision on the
 * way is made the way an expert would make it.
 */
export function jumpTo(state: GameState, index: ContentIndex, target: GameDate): number {
  mark(state, `jump:${target.year}-${target.week}`);
  let weeks = 0;
  for (let guard = 0; guard < 20000 && weekIndex(state.world.date) < weekIndex(target); guard++) {
    const step = advance(state, index);
    if (step.kind === 'ended') break;
    if (step.kind === 'weekDone') {
      weeks++;
      continue;
    }
    resolve(state, index, step.interrupt.id, BOTS.expert.choose(state, index, step.interrupt));
  }
  return weeks;
}

export interface HiddenValues {
  readonly ceiling: Skills;
  readonly ceilingOverall: number;
  readonly growthRate: number;
  readonly stock: number;
  readonly flags: readonly string[];
  readonly scheduled: readonly ScheduledConsequence[];
}

export function revealHidden(state: GameState): HiddenValues {
  mark(state, 'reveal');
  state.career.godMode.revealHidden = true;
  const user = userOf(state);
  return {
    ceiling: { ...user.ceiling },
    ceilingOverall: overallOf(user.ceiling, user.position, user.heightCm),
    growthRate: user.growthRate,
    stock: state.career.stock,
    flags: Object.keys(state.career.flags),
    scheduled: [...state.career.scheduled],
  };
}
