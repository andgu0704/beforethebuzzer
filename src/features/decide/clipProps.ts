import { userTeamId, type GameState } from '@/engine/career/state';
import type { GameId } from '@/engine/core/ids';
import { rulesForGame } from '@/engine/season/play';
import type { NameResolver } from '@/i18n';
import type { PlayParams, PlaySpec } from '@/ui/clips/types';
import type { TeamLook } from '@/ui/clips/scene';

/** Team colours, court and side for a clip of one of his games. */
export function clipSetup(
  state: GameState,
  gameId: GameId | undefined,
  names: NameResolver,
): { home: TeamLook; away: TeamLook; params: PlayParams; userSide: 0 | 1 } {
  const game = gameId ? state.world.games[gameId] : undefined;
  const look = (id: string | undefined, fallback: string): TeamLook => {
    const team = id ? state.world.teams[id] : undefined;
    return {
      abbr: id ? names.team(id, 'abbr') || fallback : fallback,
      primary: team?.colours.primary ?? (fallback === 'HOME' ? '#1B7A5A' : '#8A2432'),
      secondary: team?.colours.secondary ?? '#F1EFEA',
    };
  };
  const rules = game ? rulesForGame(game) : null;
  const mine = userTeamId(state);
  const userSide: 0 | 1 = game && mine && game.away === mine ? 1 : 0;
  return {
    home: look(game?.home, 'HOME'),
    away: look(game?.away, 'AWAY'),
    params: {
      court: rules?.id === 'college' ? 'college' : 'pro',
      ...(rules ? { shotClock: rules.shotClock, periods: rules.periods } : {}),
    },
    userSide,
  };
}

/** A feed entry's clip data as a spec. */
export function specFromFeed(
  data: Readonly<Record<string, number | string>>,
  userSide: 0 | 1,
  jersey: number,
): PlaySpec {
  return {
    template: String(data['template'] ?? 'iso_pullup'),
    outcome: String(data['outcome'] ?? 'miss') as PlaySpec['outcome'],
    success: Number(data['success']) === 1,
    period: Number(data['period'] ?? 1),
    clock: Number(data['clock'] ?? 60),
    userSide,
    userJersey: jersey,
  };
}
