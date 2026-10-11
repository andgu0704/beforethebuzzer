/** Rules and league-level calibration for each level of play. */

export interface LeagueRules {
  readonly id: 'college' | 'pro' | 'international';
  readonly periods: number;
  readonly periodSec: number;
  readonly overtimeSec: number;
  readonly shotClock: number;
  readonly foulOut: number;
  /** Team fouls in a period (or half) after which non-shooting fouls give free throws. */
  readonly bonusAt: number;
  /** College plays one-and-one before the double bonus. */
  readonly oneAndOneUntil: number | null;
  /** Periods that share a team-foul count (2 for college halves, 1 otherwise). */
  readonly foulPeriodGroup: number;
  /** Average seconds used by a first shot of a possession at a neutral pace. */
  readonly possessionSec: number;
  /** Base make probability at even match-ups, by shot type. */
  readonly make: {
    readonly rim: number;
    readonly post: number;
    readonly mid: number;
    readonly three: number;
  };
  /** Base turnover chance per possession. */
  readonly turnover: number;
  /** Base offensive rebound chance on a miss. */
  readonly offRebound: number;
  /** Multiplier on three-point tendency for the level (pros shoot more threes). */
  readonly threeAppetite: number;
  /** Chance a made basket is assisted, by shot type. */
  readonly assist: {
    readonly rim: number;
    readonly post: number;
    readonly mid: number;
    readonly three: number;
  };
  /** Non-shooting foul chance per possession. */
  readonly looseFoul: number;
  /** Home advantage in log-odds on shots. */
  readonly homeEdge: number;
}

export const COLLEGE_RULES: LeagueRules = {
  id: 'college',
  periods: 2,
  periodSec: 20 * 60,
  overtimeSec: 5 * 60,
  shotClock: 30,
  foulOut: 5,
  bonusAt: 7,
  oneAndOneUntil: 10,
  foulPeriodGroup: 1,
  possessionSec: 17.4,
  make: { rim: 0.56, post: 0.45, mid: 0.35, three: 0.293 },
  turnover: 0.16,
  offRebound: 0.29,
  threeAppetite: 1,
  assist: { rim: 0.38, post: 0.24, mid: 0.4, three: 0.72 },
  looseFoul: 0.165,
  homeEdge: 0.07,
};

export const PRO_RULES: LeagueRules = {
  id: 'pro',
  periods: 4,
  periodSec: 12 * 60,
  overtimeSec: 5 * 60,
  shotClock: 24,
  foulOut: 6,
  bonusAt: 5,
  oneAndOneUntil: null,
  foulPeriodGroup: 1,
  possessionSec: 14.9,
  make: { rim: 0.6, post: 0.47, mid: 0.38, three: 0.302 },
  turnover: 0.125,
  offRebound: 0.25,
  threeAppetite: 1.2,
  assist: { rim: 0.45, post: 0.3, mid: 0.45, three: 0.78 },
  looseFoul: 0.13,
  homeEdge: 0.05,
};

export const INTERNATIONAL_RULES: LeagueRules = {
  ...PRO_RULES,
  id: 'international',
  periodSec: 10 * 60,
  possessionSec: 13.4,
  make: { rim: 0.6, post: 0.48, mid: 0.4, three: 0.35 },
  threeAppetite: 1.25,
  homeEdge: 0.06,
};

export function totalRegulationSec(rules: LeagueRules): number {
  return rules.periods * rules.periodSec;
}
