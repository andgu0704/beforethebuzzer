import type { Rng } from '../core/rng';
import type { GameRatings } from './ratings';
import type { LiveGame, Side, SimPlayer } from './types';

export type RatingsKey = keyof GameRatings;

/** Picks an on-court player of `side` with probability proportional to `weight`. */
export function pickOnCourt(
  rng: Rng,
  g: LiveGame,
  side: Side,
  weight: (p: SimPlayer, index: number) => number,
): number {
  const lineup = g.onCourt[side];
  const players = g.teams[side].players;
  let total = 0;
  for (const i of lineup) {
    const p = players[i];
    if (p) total += Math.max(0, weight(p, i));
  }
  const fallback = lineup[0] ?? 0;
  if (total <= 0) return fallback;
  let roll = rng.next() * total;
  for (const i of lineup) {
    const p = players[i];
    if (!p) continue;
    roll -= Math.max(0, weight(p, i));
    if (roll < 0) return i;
  }
  return lineup[lineup.length - 1] ?? fallback;
}

/** Average (or best) of a rating across the five on court. */
export function teamAverage(
  g: LiveGame,
  side: Side,
  key: RatingsKey,
  mode: 'mean' | 'max' = 'mean',
): number {
  const lineup = g.onCourt[side];
  const players = g.teams[side].players;
  let total = 0;
  let best = 0;
  let n = 0;
  for (const i of lineup) {
    const p = players[i];
    if (!p) continue;
    const v = p.r[key];
    total += v;
    if (v > best) best = v;
    n++;
  }
  if (n === 0) return 50;
  return mode === 'max' ? best : total / n;
}
