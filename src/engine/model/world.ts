import type { GameDate } from '../core/calendar';
import type { ContractId, GameId, IdCounters, PersonId, TeamId, TournamentId } from '../core/ids';
import type { NationCode } from '../content/world-types';
import type { GameRecord, TeamRecord } from './game';
import type { Person } from './person';
import type { Team } from './team';
import type { Tournament } from './tournament';

export interface Contract {
  readonly id: ContractId;
  readonly playerId: PersonId;
  readonly teamId: TeamId;
  /** Salary per season, in dollars. */
  readonly salary: number;
  readonly firstSeason: number;
  readonly lastSeason: number;
  readonly kind: 'rookie' | 'standard' | 'minimum';
  readonly playerOption: boolean;
  readonly noTrade: boolean;
}

export type Transaction =
  | {
      readonly kind: 'drafted';
      readonly date: GameDate;
      readonly playerId: PersonId;
      readonly teamId: TeamId;
      readonly pick: number;
    }
  | {
      readonly kind: 'signed';
      readonly date: GameDate;
      readonly playerId: PersonId;
      readonly teamId: TeamId;
    }
  | {
      readonly kind: 'released';
      readonly date: GameDate;
      readonly playerId: PersonId;
      readonly teamId: TeamId;
    }
  | { readonly kind: 'retired'; readonly date: GameDate; readonly playerId: PersonId }
  | {
      readonly kind: 'committed';
      readonly date: GameDate;
      readonly playerId: PersonId;
      readonly teamId: TeamId;
    }
  | {
      readonly kind: 'wentOverseas';
      readonly date: GameDate;
      readonly playerId: PersonId;
      readonly club: string;
    };

export interface PollEntry {
  readonly teamId: TeamId;
  readonly points: number;
}

export interface CollegeSeason {
  readonly records: Record<string, TeamRecord>;
  /** Weekly national top 25, latest last. */
  readonly polls: { readonly week: number; readonly ranking: readonly TeamId[] }[];
  conferenceTournaments: Record<string, TournamentId>;
  national: TournamentId | null;
  holiday: TournamentId | null;
}

export interface ProSeason {
  readonly records: Record<string, TeamRecord>;
  playoffs: TournamentId | null;
  /** Draft order for the following draft, worst first, set after the lottery. */
  draftOrder: TeamId[] | null;
  lottery: { readonly teamId: TeamId; readonly pick: number; readonly from: number }[] | null;
}

export interface Season {
  readonly year: number;
  readonly college: CollegeSeason;
  readonly pro: ProSeason;
  /** International competitions played in the summer that opened this season. */
  international: TournamentId[];
  awards: AwardEntry[];
  /** Finished tournaments whose awards and ranking points have been handed out. */
  processed: string[];
}

export type AwardKind =
  | 'nationalPoy'
  | 'freshmanOfYear'
  | 'allAmericanFirst'
  | 'allAmericanSecond'
  | 'conferencePoy'
  | 'allConference'
  | 'tournamentMop'
  | 'proMvp'
  | 'proRookie'
  | 'proChampion'
  | 'collegeChampion'
  | 'tournamentMvp'
  | 'allTournament'
  | 'medalGold'
  | 'medalSilver'
  | 'medalBronze';

export interface AwardEntry {
  readonly kind: AwardKind;
  readonly personId: PersonId | null;
  readonly teamId: TeamId | null;
  /** Conference id or tournament id where relevant. */
  readonly scope: string | null;
}

export interface DraftPick {
  readonly pick: number;
  readonly round: 1 | 2;
  readonly teamId: TeamId;
  playerId: PersonId | null;
}

export interface DraftState {
  readonly season: number;
  /** Players who declared or are automatically eligible. */
  pool: PersonId[];
  /** Consensus big board, best first. */
  board: PersonId[];
  /** The board a week ago, for movement arrows. */
  previousBoard: PersonId[];
  picks: DraftPick[];
  /** Index of the next pick to be made on draft night. */
  next: number;
  combine: Record<string, CombineResult>;
}

export interface CombineResult {
  readonly heightInShoesCm: number;
  readonly wingspanCm: number;
  readonly standingReachCm: number;
  readonly verticalCm: number;
  readonly laneAgilitySec: number;
  readonly sprintSec: number;
  /** Shooting drill makes out of 25. */
  readonly shooting: number;
}

export interface NationState {
  readonly code: NationCode;
  /** Ranking points; higher is better. Moves with results. */
  points: number;
  seniorTeam: TeamId;
  u20Team: TeamId;
}

export interface HistorySeason {
  readonly year: number;
  readonly collegeChampion: TeamId | null;
  readonly proChampion: TeamId | null;
  readonly awards: readonly AwardEntry[];
  readonly draft: readonly {
    readonly pick: number;
    readonly teamId: TeamId;
    readonly playerId: PersonId;
  }[];
}

export interface NameOverrides {
  readonly teams: Record<string, { name?: string; nickname?: string; abbr?: string }>;
  readonly people: Record<string, { given?: string; family?: string }>;
}

export interface World {
  readonly seed: string;
  date: GameDate;
  counters: IdCounters;
  people: Record<string, Person>;
  teams: Record<string, Team>;
  games: Record<string, GameRecord>;
  tournaments: Record<string, Tournament>;
  seasons: Record<string, Season>;
  draft: DraftState | null;
  contracts: Record<string, Contract>;
  transactions: Transaction[];
  nations: Record<string, NationState>;
  history: HistorySeason[];
  overrides: NameOverrides;
  /** Upcoming high-school class (graduating this year), best first. */
  recruitingClass: PersonId[];
}

export function person(world: World, id: PersonId): Person | undefined {
  return world.people[id];
}

export function team(world: World, id: TeamId): Team | undefined {
  return world.teams[id];
}

export function game(world: World, id: GameId): GameRecord | undefined {
  return world.games[id];
}
