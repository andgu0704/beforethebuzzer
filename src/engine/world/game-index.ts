import { weekIndex } from '../core/calendar';
import type { GameRecord } from '../model/game';
import type { World } from '../model/world';

/**
 * Games by week, built on first use and kept in step by `createGame`. It is a cache, not
 * state: it is never saved and is rebuilt after a load.
 */
const byWorld = new WeakMap<World, Map<number, Set<string>>>();

function build(world: World): Map<number, Set<string>> {
  const index = new Map<number, Set<string>>();
  for (const g of Object.values(world.games)) add(index, g);
  byWorld.set(world, index);
  return index;
}

function add(index: Map<number, Set<string>>, g: GameRecord): void {
  const w = weekIndex(g.date);
  let set = index.get(w);
  if (!set) {
    set = new Set();
    index.set(w, set);
  }
  set.add(g.id);
}

export function indexGame(world: World, g: GameRecord): void {
  const index = byWorld.get(world);
  if (index) add(index, g);
}

export function forgetGameIndex(world: World): void {
  byWorld.delete(world);
}

export function gamesInWeek(world: World, week: number): GameRecord[] {
  const index = byWorld.get(world) ?? build(world);
  const out: GameRecord[] = [];
  for (const id of index.get(week) ?? []) {
    const g = world.games[id];
    if (g) out.push(g);
  }
  return out;
}
