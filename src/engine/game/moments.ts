/**
 * Key moments: when one fires, which options the player sees, and how a choice resolves into a
 * scripted possession and a clip description.
 */

import { clamp, shiftProbability } from '../core/math';
import { createRng, type Rng } from '../core/rng';
import type { TeamId } from '../core/ids';
import type { GameContext, MomentDef, MomentOptionDef } from '../content/story-types';
import type { PlayStyle } from '../model/skills';
import type { Role } from './prepare';
import { rulesFor } from './sim';
import type { LiveGame, PossessionScript, ShotType, Side, SimPlayer } from './types';

/** Rating points per unit of log-odds; matches the simulator's shot model. */
const SHOT_SCALE = 44;

export interface MomentCandidate {
  readonly live: LiveGame;
  readonly offense: Side;
  readonly userSide: Side;
  readonly context: GameContext;
  readonly role: Role;
  readonly style: PlayStyle;
  readonly traits: readonly string[];
  readonly hurt: boolean;
  /** Most moments this game may still have. */
  readonly budget: number;
}

export function userIndexOn(live: LiveGame, side: Side): number {
  return live.teams[side].players.findIndex((p) => p.isUser);
}

function marginFor(live: LiveGame, side: Side): number {
  return live.score[side] - live.score[side === 0 ? 1 : 0];
}

export function triggerMatches(def: MomentDef, c: MomentCandidate): boolean {
  const t = def.trigger;
  const live = c.live;
  const rules = rulesFor(live.rulesId);
  const last = live.period >= rules.periods;
  const userOffense = c.offense === c.userSide;
  if (t.side === 'offense' && !userOffense) return false;
  if (t.side === 'defense' && userOffense) return false;
  if (t.lastPeriodOnly && !last) return false;
  if (t.clockUnder !== undefined && live.clock > t.clockUnder) return false;
  if (t.clockOver !== undefined && live.clock < t.clockOver) return false;
  if (t.margin) {
    const m = marginFor(live, c.userSide);
    if (m < t.margin[0] || m > t.margin[1]) return false;
  }
  if (t.transition !== undefined && t.transition !== live.transition) return false;
  if (t.contexts && !t.contexts.includes(c.context)) return false;
  if (t.roles && !t.roles.includes(c.role)) return false;
  if (t.styles && !t.styles.includes(c.style)) return false;
  if (t.traitsAny && !t.traitsAny.some((x) => c.traits.includes(x))) return false;
  if (t.hurt !== undefined && t.hurt !== c.hurt) return false;
  return true;
}

/**
 * Decides whether this possession becomes a key moment and which one. Late, close moments
 * almost always fire; others are spread through the game. A game the player is in gets at
 * least one if any situation fits late on.
 */
export function pickMoment(moments: readonly MomentDef[], c: MomentCandidate): MomentDef | null {
  const live = c.live;
  if (c.budget <= 0) return null;
  const userIndex = userIndexOn(live, c.userSide);
  if (userIndex < 0 || !live.onCourt[c.userSide].includes(userIndex)) return null;
  const matching = moments.filter((m) => triggerMatches(m, c));
  if (matching.length === 0) return null;
  const rng = createRng(live.rng.base, 'trigger', live.gameId, Math.round(live.elapsed * 10));
  const rules = rulesFor(live.rulesId);
  const late =
    live.period >= rules.periods && live.clock <= 75 && Math.abs(marginFor(live, c.userSide)) <= 6;
  const neverHadOne = live.momentsUsed === 0 && live.period >= rules.periods && live.clock < 360;
  const chance = late ? 0.7 : neverHadOne ? 0.25 : 0.022;
  if (!rng.chance(chance)) return null;
  return rng.weighted(matching, (m) => m.weight);
}

// ---------------------------------------------------------------- resolution

export interface ClipSpec {
  readonly template: string;
  readonly success: boolean;
  readonly outcome:
    'make' | 'miss' | 'block' | 'steal' | 'turnover' | 'assist' | 'stop' | 'scored' | 'pain';
  readonly shotType: ShotType | null;
  readonly offenseTeam: TeamId;
  readonly defenseTeam: TeamId;
  readonly userSide: Side;
  readonly userJersey: number;
  readonly period: number;
  readonly clock: number;
  readonly scoreBefore: readonly [number, number];
  /** Seed for small variations in the animation. */
  readonly variation: number;
}

export interface ResolveInput {
  readonly live: LiveGame;
  readonly def: MomentDef;
  readonly option: MomentOptionDef;
  readonly offense: Side;
  readonly userSide: Side;
  readonly userJersey: number;
  /** Log-odds from traits for this action, plus clutch effects late in games. */
  readonly edge: number;
  /** God Mode can force the result. */
  readonly forced: 'success' | 'failure' | null;
  readonly seed: string;
}

export interface MomentOutcome {
  readonly success: boolean;
  /** The probability of success the player faced (kept for balance reports). */
  readonly probability: number;
  /** Null when the game simply continues (pain decisions). */
  readonly script: PossessionScript | null;
  readonly clip: ClipSpec;
  readonly playedThroughPain: boolean | null;
}

function bestOnCourt(
  live: LiveGame,
  side: Side,
  value: (p: SimPlayer) => number,
  except: number,
): number {
  let best = -1;
  let bestValue = -Infinity;
  for (const i of live.onCourt[side]) {
    if (i === except) continue;
    const p = live.teams[side].players[i];
    if (!p) continue;
    const v = value(p);
    if (v > bestValue) {
      bestValue = v;
      best = i;
    }
  }
  return best;
}

function defenderRating(live: LiveGame, side: Side, type: ShotType): number {
  let total = 0;
  let n = 0;
  for (const i of live.onCourt[side]) {
    const p = live.teams[side].players[i];
    if (!p) continue;
    total += type === 'rim' || type === 'post' ? p.r.intD : p.r.perD;
    n++;
  }
  return n === 0 ? 50 : total / n;
}

function decide(rng: Rng, p: number, forced: 'success' | 'failure' | null): boolean {
  if (forced) return forced === 'success';
  return rng.chance(p);
}

export function resolveMoment(i: ResolveInput): MomentOutcome {
  const { live, option, offense, userSide } = i;
  const rules = rulesFor(live.rulesId);
  const rng = createRng(i.seed, 'moment', live.gameId, live.momentsUsed, option.id);
  const defense: Side = offense === 0 ? 1 : 0;
  const user = userIndexOn(live, userSide);
  const userPlayer = live.teams[userSide].players[user];
  const base = {
    template: option.clip,
    offenseTeam: live.teams[offense].teamId,
    defenseTeam: live.teams[defense].teamId,
    userSide,
    userJersey: i.userJersey,
    period: live.period,
    clock: live.clock,
    scoreBefore: [live.score[0], live.score[1]] as const,
    variation: rng.int(0, 9999),
  };
  const duration = clamp(Math.min(live.clock - 0.4, 6 + rng.next() * 10), 0.6, rules.shotClock);
  const action = option.action;

  if (action.kind === 'pain') {
    return {
      success: action.playThrough,
      probability: 1,
      script: null,
      clip: { ...base, success: action.playThrough, outcome: 'pain', shotType: null },
      playedThroughPain: action.playThrough,
    };
  }

  if (!userPlayer) throw new Error('key moment without the user on the roster');

  if (action.kind === 'shot') {
    const turnoverP = action.turnoverChance * (1.3 - userPlayer.r.security / 100);
    const delta =
      (userPlayer.r[action.shotType] - defenderRating(live, defense, action.shotType)) /
        SHOT_SCALE +
      action.difficulty +
      userPlayer.shotMod +
      i.edge;
    const makeP = shiftProbability(rules.make[action.shotType], delta);
    const probability = (1 - turnoverP) * makeP;
    const success = decide(rng, probability, i.forced);
    if (!success && !i.forced && rng.chance(turnoverP / Math.max(0.01, 1 - probability))) {
      const stolenBy = bestOnCourt(live, defense, (p) => p.r.stl, -1);
      return {
        success: false,
        probability,
        script: {
          kind: 'turnover',
          by: user,
          stolenBy: rng.chance(0.6) ? stolenBy : null,
          duration,
        },
        clip: { ...base, success: false, outcome: 'steal', shotType: action.shotType },
        playedThroughPain: null,
      };
    }
    const fouled = rng.chance(action.foulChance * (success ? 0.4 : 1));
    return {
      success,
      probability,
      script: {
        kind: 'shot',
        shooter: user,
        shotType: action.shotType,
        made: success,
        assistBy: null,
        fouled,
        duration,
      },
      clip: {
        ...base,
        success,
        outcome: success ? 'make' : rng.chance(0.25) ? 'block' : 'miss',
        shotType: action.shotType,
      },
      playedThroughPain: null,
    };
  }

  if (action.kind === 'pass') {
    const shooter = bestOnCourt(live, offense, (p) => p.r[action.shotType] + p.usage * 10, user);
    const target = live.teams[offense].players[shooter];
    const turnoverP = action.turnoverChance * (1.35 - userPlayer.r.pass / 100);
    const delta = target
      ? (target.r[action.shotType] - defenderRating(live, defense, action.shotType)) / SHOT_SCALE +
        action.openness +
        i.edge * 0.5
      : 0;
    const makeP = shiftProbability(rules.make[action.shotType], delta);
    const probability = (1 - turnoverP) * makeP;
    const success = decide(rng, probability, i.forced);
    if (!success && !i.forced && rng.chance(turnoverP / Math.max(0.01, 1 - probability))) {
      return {
        success: false,
        probability,
        script: {
          kind: 'turnover',
          by: user,
          stolenBy: bestOnCourt(live, defense, (p) => p.r.stl, -1),
          duration,
        },
        clip: { ...base, success: false, outcome: 'turnover', shotType: action.shotType },
        playedThroughPain: null,
      };
    }
    return {
      success,
      probability,
      script: {
        kind: 'shot',
        shooter: shooter < 0 ? user : shooter,
        shotType: action.shotType,
        made: success,
        assistBy: success ? user : null,
        fouled: false,
        duration,
      },
      clip: { ...base, success, outcome: success ? 'assist' : 'miss', shotType: action.shotType },
      playedThroughPain: null,
    };
  }

  // Defence: the opponent's best scorer attacks; the user tries to stop him.
  const attacker = bestOnCourt(live, offense, (p) => p.r.scoring * p.usage, -1);
  const opp = live.teams[offense].players[attacker];
  const shotType: ShotType = opp && opp.tend.three > opp.tend.rim ? 'three' : 'rim';
  const userDef = shotType === 'three' ? userPlayer.r.perD : userPlayer.r.intD;
  const oppRating = opp ? opp.r[shotType] : 50;
  const gambleWorks = shiftProbability(
    0.22 + action.gamble * 0.25,
    (userPlayer.r.stl - 50) / 40 + i.edge,
  );
  const contested = shiftProbability(
    rules.make[shotType],
    (oppRating - userDef) / SHOT_SCALE - 0.15 - i.edge,
  );
  const open = shiftProbability(rules.make[shotType], (oppRating - userDef) / SHOT_SCALE + 0.55);
  const stopP =
    action.gamble > 0
      ? action.gamble * (gambleWorks + (1 - gambleWorks) * (1 - open)) +
        (1 - action.gamble) * (1 - contested)
      : 1 - contested;
  const success = decide(rng, stopP, i.forced);
  const takeaway = success && action.gamble > 0 && rng.chance(action.gamble * 0.7);
  return {
    success,
    probability: stopP,
    script: takeaway
      ? { kind: 'turnover', by: attacker, stolenBy: user, duration }
      : {
          kind: 'defence',
          made: !success,
          shotType,
          blockedBy: success && shotType === 'rim' && rng.chance(0.4) ? user : null,
          stolenBy: null,
          duration,
        },
    clip: {
      ...base,
      success,
      outcome: success ? (takeaway ? 'steal' : 'stop') : 'scored',
      shotType,
    },
    playedThroughPain: null,
  };
}

/** Options the user may pick: those without requirements, or whose requirements he meets. */
export function availableOptions(
  def: MomentDef,
  meets: (o: MomentOptionDef) => boolean,
): MomentOptionDef[] {
  return def.options.filter((o) => !o.requires || meets(o));
}

/** The odds an option succeeds right now, without rolling for it (used by bots and hints). */
export function estimateOdds(i: Omit<ResolveInput, 'forced' | 'seed' | 'userJersey'>): number {
  return resolveMoment({ ...i, forced: 'success', seed: 'estimate', userJersey: 0 }).probability;
}
