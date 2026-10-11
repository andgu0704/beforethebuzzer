export const SKILLS = [
  'shooting',
  'playmaking',
  'handling',
  'defence',
  'rebounding',
  'athleticism',
  'gameSense',
] as const;

export type Skill = (typeof SKILLS)[number];

/** Each skill on a 1–100 scale. */
export type Skills = Record<Skill, number>;

export const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C'] as const;
export type Position = (typeof POSITIONS)[number];

export const PLAY_STYLES = ['shooter', 'playmaker', 'slasher', 'defender', 'bigMan'] as const;
export type PlayStyle = (typeof PLAY_STYLES)[number];

export function mapSkills(fn: (skill: Skill) => number): Skills {
  return {
    shooting: fn('shooting'),
    playmaking: fn('playmaking'),
    handling: fn('handling'),
    defence: fn('defence'),
    rebounding: fn('rebounding'),
    athleticism: fn('athleticism'),
    gameSense: fn('gameSense'),
  };
}

/** How much each skill matters for a position's overall rating. Rows sum to 1. */
export const POSITION_WEIGHTS: Record<Position, Skills> = {
  PG: {
    shooting: 0.2,
    playmaking: 0.25,
    handling: 0.2,
    defence: 0.1,
    rebounding: 0.03,
    athleticism: 0.1,
    gameSense: 0.12,
  },
  SG: {
    shooting: 0.28,
    playmaking: 0.12,
    handling: 0.15,
    defence: 0.13,
    rebounding: 0.05,
    athleticism: 0.13,
    gameSense: 0.14,
  },
  SF: {
    shooting: 0.2,
    playmaking: 0.1,
    handling: 0.12,
    defence: 0.17,
    rebounding: 0.1,
    athleticism: 0.16,
    gameSense: 0.15,
  },
  PF: {
    shooting: 0.12,
    playmaking: 0.07,
    handling: 0.06,
    defence: 0.2,
    rebounding: 0.22,
    athleticism: 0.18,
    gameSense: 0.15,
  },
  C: {
    shooting: 0.07,
    playmaking: 0.05,
    handling: 0.03,
    defence: 0.25,
    rebounding: 0.27,
    athleticism: 0.18,
    gameSense: 0.15,
  },
};

/** Height in centimetres on a 0–100 basketball scale (170 cm → 0, 225 cm → 100). */
export function heightScore(heightCm: number): number {
  return Math.max(0, Math.min(100, ((heightCm - 170) / 55) * 100));
}

/** Typical height for a position, in centimetres. */
export const POSITION_HEIGHT: Record<Position, number> = {
  PG: 188,
  SG: 195,
  SF: 201,
  PF: 206,
  C: 212,
};
