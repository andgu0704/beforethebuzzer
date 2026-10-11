import { weekIndex, type GameDate } from '../core/calendar';
import type { Rng } from '../core/rng';
import type { GameRecord } from '../model/game';
import type { World } from '../model/world';
import { recordResult } from '../season/standings';
import { teamRating } from '../season/strength';

/**
 * A result from team ratings alone, with no box score. Used only to give a new world a past
 * (the part of the season that happened before the career begins).
 */
export function quickPlay(world: World, game: GameRecord, rng: Rng): void {
  const home = teamRating(world, game.home);
  const away = teamRating(world, game.away);
  const base = game.league === 'pro' ? 113 : 72;
  const edge = (home - away) * 1.6 + (game.neutral ? 0 : 3);
  let h = Math.round(base + edge / 2 + rng.normal(0, 9));
  let a = Math.round(base - edge / 2 + rng.normal(0, 9));
  let overtimes = 0;
  while (h === a) {
    overtimes += 1;
    h += rng.int(4, 14);
    a += rng.int(4, 14);
  }
  game.result = { home: h, away: a, overtimes, box: null };
  recordResult(world, game);
}

export function quickPlayWeeks(world: World, rng: Rng, before: GameDate): void {
  const cutoff = weekIndex(before);
  const games = Object.values(world.games)
    .filter((g) => !g.result && weekIndex(g.date) < cutoff)
    .sort((x, y) => weekIndex(x.date) - weekIndex(y.date) || x.slot - y.slot);
  for (const g of games) quickPlay(world, g, rng);
}
