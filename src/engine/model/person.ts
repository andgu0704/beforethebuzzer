import type { GameDate } from '../core/calendar';
import type { PersonId, TeamId } from '../core/ids';
import type { NationCode } from '../content/world-types';
import type { PlayStyle, Position, Skills } from './skills';

export interface Portrait {
  readonly head: number;
  readonly skin: number;
  readonly eyes: number;
  readonly brows: number;
  readonly nose: number;
  readonly mouth: number;
  readonly hair: number;
  readonly hairColour: number;
  readonly facialHair: number;
  readonly accessory: number;
}

export interface PersonBase {
  readonly id: PersonId;
  given: string;
  family: string;
  readonly nation: NationCode;
  readonly hometown: string;
  readonly birthYear: number;
  readonly portrait: Portrait;
}

export interface Injury {
  readonly kind: string;
  /** Weeks left before he can play. */
  weeksLeft: number;
  readonly severity: 'minor' | 'moderate' | 'major' | 'severe';
  readonly since: GameDate;
  /** Played through it against advice, which raises the chance of a chronic problem. */
  playedThrough: boolean;
}

export type Affiliation =
  | { readonly kind: 'highSchool'; readonly graduationYear: number }
  | { readonly kind: 'college'; teamId: TeamId; classYear: 1 | 2 | 3 | 4 }
  | { readonly kind: 'pro'; teamId: TeamId }
  | { readonly kind: 'overseas'; club: string; readonly clubNation: NationCode }
  | { readonly kind: 'freeAgent' }
  | { readonly kind: 'retired'; readonly year: number };

export interface Stint {
  readonly team: TeamId | string;
  readonly league: League;
  readonly fromSeason: number;
  toSeason: number | null;
}

export type League = 'highSchool' | 'college' | 'pro' | 'overseas' | 'national';

/** Accumulated box-score totals. */
export interface StatTotals {
  gp: number;
  gs: number;
  min: number;
  pts: number;
  fgm: number;
  fga: number;
  tpm: number;
  tpa: number;
  ftm: number;
  fta: number;
  orb: number;
  drb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  pf: number;
}

export interface SeasonLine extends StatTotals {
  readonly season: number;
  readonly team: TeamId | string;
  readonly league: League;
  /** Tournament id for national-team or postseason lines; absent for regular seasons. */
  readonly competition?: string;
}

export interface DraftResult {
  readonly season: number;
  readonly pick: number | null;
  readonly teamId: TeamId | null;
}

export interface Player extends PersonBase {
  readonly kind: 'player';
  heightCm: number;
  wingspanCm: number;
  weightKg: number;
  position: Position;
  style: PlayStyle;
  skills: Skills;
  /** Hidden ceiling per skill. Growth slows sharply as a skill nears it. */
  ceiling: Skills;
  /** Speed of development, around 1. Shaped by work ethic and traits. */
  growthRate: number;
  traits: string[];
  health: number;
  energy: number;
  confidence: number;
  injury: Injury | null;
  /** Lasting conditions, such as a chronic ankle, from injuries that were not respected. */
  chronic: string[];
  jersey: number;
  affiliation: Affiliation;
  stints: Stint[];
  lines: SeasonLine[];
  draft: DraftResult | null;
  /** National recruiting rank in his high-school class, if ranked. */
  recruitRank: number | null;
  /** True for the user's player. */
  isUser: boolean;
}

export interface CoachTactics {
  /** 0–100; 50 is an average tempo. */
  pace: number;
  /** 0–100; appetite for three-pointers. */
  threeRate: number;
  /** 0–100; defensive pressure (more steals, more fouls). */
  pressure: number;
  /** How many players get real minutes, 7–10. */
  depth: number;
}

export interface Coach extends PersonBase {
  readonly kind: 'coach';
  teamId: TeamId | null;
  /** 1–100: how well his players improve. */
  development: number;
  /** 1–100: how much he punishes off-court trouble. */
  discipline: number;
  /** 1–100: in-game decisions and preparation. */
  acumen: number;
  tactics: CoachTactics;
}

export interface Agent extends PersonBase {
  readonly kind: 'agent';
  /** 1–100. */
  quality: number;
  /** Fraction of earnings, e.g. 0.04. */
  fee: number;
}

export interface Journalist extends PersonBase {
  readonly kind: 'journalist';
  outlet: string;
}

export type Person = Player | Coach | Agent | Journalist;

export function isPlayer(p: Person | undefined): p is Player {
  return p?.kind === 'player';
}

export function emptyTotals(): StatTotals {
  return {
    gp: 0,
    gs: 0,
    min: 0,
    pts: 0,
    fgm: 0,
    fga: 0,
    tpm: 0,
    tpa: 0,
    ftm: 0,
    fta: 0,
    orb: 0,
    drb: 0,
    ast: 0,
    stl: 0,
    blk: 0,
    tov: 0,
    pf: 0,
  };
}
