import type { GameId, TeamId, TournamentId } from '../core/ids';

export type TournamentKind =
  'conference' | 'national' | 'holiday' | 'proPlayoffs' | 'international' | 'showcase';

export interface TournamentFormat {
  readonly groups?: {
    readonly count: number;
    readonly size: number;
    /** Teams that go through from each group. */
    readonly advance: number;
    /** Extra places for the best third-placed teams across groups. */
    readonly bestThirds: number;
    /** Matchdays played in each week of the group stage, e.g. [3]. */
    readonly matchdaysPerWeek: readonly number[];
  };
  readonly knockout: {
    /** Bracket size, a power of two. Fewer teams means byes for the top seeds. */
    readonly size: number;
    readonly bestOf: 1 | 3 | 5 | 7;
    readonly thirdPlace: boolean;
    /** Knockout rounds played in each week, e.g. [2, 2, 2] for a 64-team bracket. */
    readonly roundsPerWeek: readonly number[];
    /** Separate regions (or conferences) whose winners meet late. */
    readonly regions?: number;
    /** 'snake' spreads seed lines across regions (S-curve); 'straight' keeps entrant i in region i % regions. */
    readonly regionSeeding?: 'snake' | 'straight';
  };
  readonly neutral: boolean;
  /** Key moments allowed per game for the user. */
  readonly momentsPerGame: readonly [number, number];
}

export interface GroupStanding {
  readonly teamId: TeamId;
  w: number;
  l: number;
  pf: number;
  pa: number;
}

export interface Group {
  readonly name: string;
  readonly standings: GroupStanding[];
  readonly games: GameId[];
}

export interface Series {
  /** Higher seed first. */
  a: TeamId | null;
  b: TeamId | null;
  readonly seedA: number;
  readonly seedB: number;
  winsA: number;
  winsB: number;
  readonly games: GameId[];
  winner: TeamId | null;
}

export interface KnockoutRound {
  readonly index: number;
  readonly series: Series[];
}

export interface Tournament {
  readonly id: TournamentId;
  readonly kind: TournamentKind;
  /** Content key for the name, e.g. "tournament.worldChampionship". */
  readonly nameKey: string;
  readonly nameParams: Readonly<Record<string, string | number>>;
  readonly season: number;
  readonly rules: 'college' | 'pro' | 'international';
  readonly format: TournamentFormat;
  /** Entrants in seed order. */
  readonly teams: TeamId[];
  readonly startWeek: number;
  readonly startYear: number;
  stage: 'groups' | 'knockout' | 'done';
  groups: Group[];
  rounds: KnockoutRound[];
  /** Week offset (0-based) at which each knockout round is played. */
  readonly roundWeek: number[];
  /** Third-place game, when the format has one. */
  thirdPlace: Series | null;
  champion: TeamId | null;
  /** Final placings, winner first, filled as teams go out. */
  placings: TeamId[];
}
