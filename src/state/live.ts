/**
 * Read-only helpers for his games as they happen: which game is next, where a moment in the
 * play log falls on the clock, and what each play was.
 */

import type { GameState } from '@/engine/career/state';
import { weekIndex } from '@/engine/core/calendar';
import type { TeamId } from '@/engine/core/ids';
import { rulesFor } from '@/engine/game/sim';
import type { LiveGame, PlayEvent, Side } from '@/engine/game/types';
import type { LiveUserGame } from '@/engine/model/career';
import type { GameRecord } from '@/engine/model/game';

/** Every team that lists him: his club, and a showcase or national side he has joined. */
export function userTeams(state: GameState): ReadonlySet<TeamId> {
  const id = state.career.playerId;
  const out = new Set<TeamId>();
  for (const t of Object.values(state.world.teams)) if (t.roster.includes(id)) out.add(t.id);
  return out;
}

/** His next unplayed game (for any team he is on), or the one in progress. */
export function nextUserGame(state: GameState): GameRecord | null {
  const live = state.career.cursor.live;
  if (live) return state.world.games[live.gameId] ?? null;
  const teams = userTeams(state);
  if (teams.size === 0) return null;
  let best: GameRecord | null = null;
  for (const g of Object.values(state.world.games)) {
    if (g.result || (!teams.has(g.home) && !teams.has(g.away))) continue;
    if (
      !best ||
      weekIndex(g.date) < weekIndex(best.date) ||
      (weekIndex(g.date) === weekIndex(best.date) && g.slot < best.slot)
    )
      best = g;
  }
  return best;
}

/** Weeks from now until a game: 0 means this week. */
export function weeksUntil(state: GameState, game: GameRecord): number {
  return Math.max(0, weekIndex(game.date) - weekIndex(state.world.date));
}

export function sideOf(state: GameState, game: GameRecord): Side {
  return state.world.teams[game.away]?.roster.includes(state.career.playerId) ? 1 : 0;
}

/** The side he plays for in a game. */
export function ownTeamOf(state: GameState, game: GameRecord): TeamId {
  return sideOf(state, game) === 0 ? game.home : game.away;
}

export function opponentOf(state: GameState, game: GameRecord): TeamId {
  return sideOf(state, game) === 0 ? game.away : game.home;
}

/** 'home', 'away' or 'neutral', from his side. */
export function venueOf(state: GameState, game: GameRecord): 'home' | 'away' | 'neutral' {
  if (game.neutral) return 'neutral';
  return sideOf(state, game) === 0 ? 'home' : 'away';
}

/** The game to show: the one in progress, else the one just finished. */
export function shownGame(state: GameState): LiveUserGame | null {
  return state.career.cursor.live ?? state.career.cursor.finished ?? null;
}

/** Period (1-based) and seconds left on the clock, `t` seconds after tip-off. */
export function clockAt(live: LiveGame, t: number): { period: number; clock: number } {
  const rules = rulesFor(live.rulesId);
  const regulation = rules.periods * rules.periodSec;
  if (t < regulation) {
    const period = Math.min(rules.periods, Math.floor(t / rules.periodSec) + 1);
    return { period, clock: period * rules.periodSec - t };
  }
  const ot = Math.floor((t - regulation) / rules.overtimeSec);
  return {
    period: rules.periods + ot + 1,
    clock: regulation + (ot + 1) * rules.overtimeSec - t,
  };
}

/** Points a play scored, 0 for anything else. */
export function pointsOf(p: PlayEvent): number {
  return p.kind === 'fg3' ? 3 : p.kind === 'fg2' ? 2 : p.kind === 'ft' ? 1 : 0;
}

/** The player behind a play, as a person id. */
export function playerOf(live: LiveGame, p: PlayEvent): string | null {
  return live.teams[p.side].players[p.player]?.id ?? null;
}

/** His line so far: points, rebounds, assists and the rest, counted from the play log. */
export function lineSoFar(
  live: LiveGame,
  userId: string,
  shown: number,
): { pts: number; reb: number; ast: number; stl: number; blk: number; fgm: number; fga: number } {
  const out = { pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, fgm: 0, fga: 0 };
  for (const p of live.plays.slice(0, shown)) {
    if (playerOf(live, p) !== userId) continue;
    out.pts += pointsOf(p);
    if (p.kind === 'reb') out.reb += 1;
    if (p.kind === 'ast') out.ast += 1;
    if (p.kind === 'stl') out.stl += 1;
    if (p.kind === 'blk') out.blk += 1;
    if (p.kind === 'fg2' || p.kind === 'fg3') {
      out.fgm += 1;
      out.fga += 1;
    }
    if (p.kind === 'miss2' || p.kind === 'miss3') out.fga += 1;
  }
  return out;
}
