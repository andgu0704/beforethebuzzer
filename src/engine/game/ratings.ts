import {
  heightScore,
  POSITION_HEIGHT,
  POSITION_WEIGHTS,
  SKILLS,
  type PlayStyle,
  type Position,
  type Skills,
} from '../model/skills';

/** Game ratings derived from skills, size and style. All roughly on the 1–100 skill scale. */
export interface GameRatings {
  three: number;
  mid: number;
  rim: number;
  post: number;
  ft: number;
  pass: number;
  security: number;
  perD: number;
  intD: number;
  reb: number;
  blk: number;
  stl: number;
  discipline: number;
  /** Offensive weight used for usage. */
  scoring: number;
}

/** Shot-selection weights; normalised when used. */
export interface Tendencies {
  three: number;
  mid: number;
  rim: number;
  post: number;
}

export function deriveRatings(skills: Skills, heightCm: number, wingspanCm: number): GameRatings {
  const size = heightScore(heightCm);
  const reach = Math.max(-10, Math.min(10, wingspanCm - heightCm)) * 1.2;
  const s = skills;
  const three = s.shooting * 0.88 + s.gameSense * 0.12;
  const mid = s.shooting * 0.72 + s.handling * 0.13 + s.gameSense * 0.15;
  const rim = s.athleticism * 0.4 + s.handling * 0.2 + size * 0.25 + s.gameSense * 0.15;
  const post =
    size * 0.4 + s.athleticism * 0.15 + s.rebounding * 0.1 + s.shooting * 0.15 + s.gameSense * 0.2;
  return {
    three,
    mid,
    rim,
    post,
    ft: s.shooting * 0.8 + s.gameSense * 0.2,
    pass: s.playmaking * 0.75 + s.gameSense * 0.25,
    security: s.handling * 0.6 + s.gameSense * 0.25 + s.playmaking * 0.15,
    perD: s.defence * 0.6 + s.athleticism * 0.25 + s.gameSense * 0.1 + reach * 0.5,
    intD: s.defence * 0.45 + size * 0.35 + s.athleticism * 0.15 + reach * 0.8,
    reb: s.rebounding * 0.55 + size * 0.3 + s.athleticism * 0.15 + reach * 0.5,
    blk: s.athleticism * 0.3 + s.defence * 0.25 + size * 0.45 + reach,
    stl: s.defence * 0.5 + s.gameSense * 0.3 + s.athleticism * 0.2 + reach * 0.5,
    discipline: s.gameSense * 0.6 + s.defence * 0.4,
    scoring: Math.max(three, mid, rim, post) * 0.6 + ((three + mid + rim) / 3) * 0.4,
  };
}

const STYLE_TENDENCIES: Record<PlayStyle, Tendencies> = {
  shooter: { three: 0.52, mid: 0.24, rim: 0.2, post: 0.04 },
  playmaker: { three: 0.36, mid: 0.24, rim: 0.36, post: 0.04 },
  slasher: { three: 0.22, mid: 0.18, rim: 0.56, post: 0.04 },
  defender: { three: 0.32, mid: 0.2, rim: 0.4, post: 0.08 },
  bigMan: { three: 0.07, mid: 0.13, rim: 0.48, post: 0.32 },
};

const POSITION_THREE: Record<Position, number> = { PG: 1.05, SG: 1.1, SF: 1, PF: 0.75, C: 0.45 };

export function deriveTendencies(
  style: PlayStyle,
  position: Position,
  ratings: GameRatings,
): Tendencies {
  const base = STYLE_TENDENCIES[style];
  // Players lean towards what they do well.
  const lean = (rating: number) => 0.6 + rating / 100;
  return {
    three: base.three * POSITION_THREE[position] * lean(ratings.three) * lean(ratings.three),
    mid: base.mid * lean(ratings.mid),
    rim: base.rim * lean(ratings.rim),
    post: base.post * lean(ratings.post),
  };
}

/** Position-weighted overall rating. */
export function overallOf(skills: Skills, position: Position, heightCm: number): number {
  const w = POSITION_WEIGHTS[position];
  let total = 0;
  for (const key of SKILLS) total += skills[key] * w[key];
  // Size helps every position a little relative to its norm.
  const sizeBonus = (heightCm - POSITION_HEIGHT[position]) * 0.12;
  return Math.max(1, Math.min(99, total + sizeBonus));
}
