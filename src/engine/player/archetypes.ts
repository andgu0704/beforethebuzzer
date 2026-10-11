import type { Rng } from '../core/rng';
import { clamp } from '../core/math';
import {
  mapSkills,
  POSITION_HEIGHT,
  type PlayStyle,
  type Position,
  type Skills,
} from '../model/skills';

/** How each playing style shifts skills away from the player's base level. */
export const STYLE_OFFSETS: Record<PlayStyle, Skills> = {
  shooter: {
    shooting: 13,
    playmaking: 0,
    handling: 3,
    defence: -4,
    rebounding: -6,
    athleticism: -1,
    gameSense: 3,
  },
  playmaker: {
    shooting: 1,
    playmaking: 13,
    handling: 10,
    defence: -1,
    rebounding: -9,
    athleticism: 0,
    gameSense: 5,
  },
  slasher: {
    shooting: -4,
    playmaking: 1,
    handling: 7,
    defence: -1,
    rebounding: -2,
    athleticism: 11,
    gameSense: 0,
  },
  defender: {
    shooting: -5,
    playmaking: -2,
    handling: -1,
    defence: 13,
    rebounding: 2,
    athleticism: 5,
    gameSense: 3,
  },
  bigMan: {
    shooting: -10,
    playmaking: -8,
    handling: -13,
    defence: 6,
    rebounding: 15,
    athleticism: 3,
    gameSense: 1,
  },
};

/** Likely styles for a position, as weights. */
export const POSITION_STYLES: Record<Position, Partial<Record<PlayStyle, number>>> = {
  PG: { playmaker: 5, shooter: 2, slasher: 2, defender: 1 },
  SG: { shooter: 5, slasher: 3, playmaker: 1, defender: 2 },
  SF: { slasher: 3, shooter: 3, defender: 3, playmaker: 0.5 },
  PF: { bigMan: 4, defender: 2, slasher: 1, shooter: 1 },
  C: { bigMan: 8, defender: 2 },
};

export function pickStyle(rng: Rng, position: Position): PlayStyle {
  const entries = Object.entries(POSITION_STYLES[position]) as [PlayStyle, number][];
  return rng.weighted(entries, ([, w]) => w)[0];
}

export function pickHeight(rng: Rng, position: Position): number {
  return Math.round(rng.normal(POSITION_HEIGHT[position], 4));
}

export function pickWingspan(rng: Rng, heightCm: number): number {
  return Math.round(heightCm + rng.normal(5, 4.5));
}

export function pickWeight(rng: Rng, heightCm: number, position: Position): number {
  const bigBonus = position === 'C' ? 8 : position === 'PF' ? 5 : 0;
  return Math.round(heightCm - 104 + bigBonus + rng.normal(0, 5));
}

/** Skills around a base level, shaped by style, with individual noise. */
export function rollSkills(rng: Rng, base: number, style: PlayStyle, spread = 5): Skills {
  const offsets = STYLE_OFFSETS[style];
  return mapSkills((skill) =>
    clamp(Math.round(base + offsets[skill] + rng.normal(0, spread)), 5, 99),
  );
}
