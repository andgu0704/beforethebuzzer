import type { GameDate } from '../core/calendar';
import type { Rng } from '../core/rng';
import type { Injury } from '../model/person';

export const INJURY_KINDS = {
  minor: ['ankleSprain', 'bruisedThigh', 'fingerSprain', 'backSpasms', 'illness'],
  moderate: ['hamstringStrain', 'groinStrain', 'highAnkleSprain', 'concussion', 'wristSprain'],
  major: ['brokenHand', 'kneeSprain', 'stressReaction', 'shoulderSprain'],
  severe: ['tornAcl', 'achillesRupture', 'brokenFoot'],
} as const;

const SEVERITY_WEEKS = {
  minor: [1, 2],
  moderate: [3, 6],
  major: [7, 14],
  severe: [26, 42],
} as const;

/** Chance of an injury in one game, by minutes played and a risk multiplier. */
export function injuryChance(minutes: number, risk: number): number {
  return 0.0105 * (minutes / 30) * risk;
}

export function rollInjury(
  rng: Rng,
  date: GameDate,
  minutes: number,
  risk: number,
  recovery = 1,
): Injury | null {
  if (minutes <= 0 || !rng.chance(injuryChance(minutes, risk))) return null;
  const roll = rng.next();
  const severity =
    roll < 0.6 ? 'minor' : roll < 0.89 ? 'moderate' : roll < 0.985 ? 'major' : 'severe';
  return makeInjury(rng, date, severity, recovery);
}

export function makeInjury(
  rng: Rng,
  date: GameDate,
  severity: Injury['severity'],
  recovery = 1,
  kind?: string,
): Injury {
  const [lo, hi] = SEVERITY_WEEKS[severity];
  return {
    kind: kind ?? rng.pick(INJURY_KINDS[severity]),
    severity,
    weeksLeft: Math.max(1, Math.round(rng.int(lo, hi) * recovery)),
    since: date,
    playedThrough: false,
  };
}
