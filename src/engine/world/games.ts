import type { GameDate } from '../core/calendar';
import { asGameId, nextId, type TeamId, type TournamentId } from '../core/ids';
import type { GameKind, GameRecord } from '../model/game';
import type { League } from '../model/person';
import type { World } from '../model/world';
import { indexGame } from './game-index';

export interface NewGame {
  readonly date: GameDate;
  readonly slot: number;
  readonly league: League;
  readonly kind: GameKind;
  readonly home: TeamId;
  readonly away: TeamId;
  readonly neutral?: boolean;
  readonly tournamentId?: TournamentId | null;
  readonly round?: string | null;
}

export function createGame(world: World, g: NewGame): GameRecord {
  const record: GameRecord = {
    id: asGameId(nextId(world.counters, 'game', 'g')),
    date: g.date,
    slot: g.slot,
    league: g.league,
    kind: g.kind,
    home: g.home,
    away: g.away,
    neutral: g.neutral ?? false,
    tournamentId: g.tournamentId ?? null,
    round: g.round ?? null,
    result: null,
  };
  world.games[record.id] = record;
  indexGame(world, record);
  return record;
}

export function winnerOf(game: GameRecord): TeamId | null {
  if (!game.result) return null;
  return game.result.home > game.result.away ? game.home : game.away;
}

export function loserOf(game: GameRecord): TeamId | null {
  if (!game.result) return null;
  return game.result.home > game.result.away ? game.away : game.home;
}
