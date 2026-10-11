import type { GameDate } from '../core/calendar';
import type { GameId, PersonId, TeamId, TournamentId } from '../core/ids';
import type { League } from './person';

export interface PlayerLine {
  readonly id: PersonId;
  starter: boolean;
  /** Seconds played; minutes are rounded only for display, with team totals preserved. */
  sec: number;
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
  pm: number;
}

export interface TeamBox {
  readonly teamId: TeamId;
  readonly players: PlayerLine[];
}

export interface BoxScore {
  readonly home: TeamBox;
  readonly away: TeamBox;
}

export interface GameResult {
  readonly home: number;
  readonly away: number;
  readonly overtimes: number;
  /** Kept only for games that matter to the career; see retention rules. */
  box: BoxScore | null;
}

export type GameKind =
  | 'exhibition'
  | 'nonConference'
  | 'conference'
  | 'tournament'
  | 'regular'
  | 'playoff'
  | 'international'
  | 'showcase';

export interface GameRecord {
  readonly id: GameId;
  readonly date: GameDate;
  /** Order within the week, 0-based. */
  readonly slot: number;
  readonly league: League;
  readonly kind: GameKind;
  readonly home: TeamId;
  readonly away: TeamId;
  readonly neutral: boolean;
  readonly tournamentId: TournamentId | null;
  /** Round label inside a tournament, e.g. "r64" or "groupA". */
  readonly round: string | null;
  result: GameResult | null;
}

export interface TeamRecord {
  w: number;
  l: number;
  confW: number;
  confL: number;
  pf: number;
  pa: number;
  homeW: number;
  homeL: number;
  /** Positive for a winning streak, negative for a losing one. */
  streak: number;
}

export function emptyRecord(): TeamRecord {
  return { w: 0, l: 0, confW: 0, confL: 0, pf: 0, pa: 0, homeW: 0, homeL: 0, streak: 0 };
}
