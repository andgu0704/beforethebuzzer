import { clamp } from '../core/math';
import type { Rng } from '../core/rng';
import { mapSkills, type PlayStyle, type Skills } from '../model/skills';
import { STYLE_OFFSETS } from './archetypes';

/** Typical room to grow, in skill points, by age. Young players have the most. */
export function typicalGap(age: number): number {
  if (age <= 17) return 19;
  if (age >= 30) return 0.5;
  const table: Record<number, number> = {
    18: 17,
    19: 14.5,
    20: 12,
    21: 9.5,
    22: 7.5,
    23: 5.5,
    24: 4,
    25: 3,
    26: 2,
    27: 1.4,
    28: 1,
    29: 0.7,
  };
  return table[age] ?? 1;
}

/**
 * Hidden per-skill ceilings. `ceilingBase` is the level the player could reach overall; the
 * style shapes where that growth lands.
 */
export function rollCeilings(
  rng: Rng,
  skills: Skills,
  style: PlayStyle,
  ceilingBase: number,
): Skills {
  const offsets = STYLE_OFFSETS[style];
  return mapSkills((skill) => {
    const target = ceilingBase + offsets[skill] * 1.1 + rng.normal(0, 4);
    return clamp(Math.round(Math.max(target, skills[skill] + 1)), 1, 99);
  });
}

/** Average room left to grow across all skills. */
export function remainingGrowth(skills: Skills, ceiling: Skills): number {
  let total = 0;
  let n = 0;
  for (const key of Object.keys(skills) as (keyof Skills)[]) {
    total += Math.max(0, ceiling[key] - skills[key]);
    n++;
  }
  return total / n;
}
