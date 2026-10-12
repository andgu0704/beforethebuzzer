/**
 * What the live screen shows at a point in the play log: the score and clock, team fouls and
 * the bonus, who has the ball, every player's numbers so far, who is on the floor, and where
 * each shot came from. Pure functions of the log, so replays and resumes show the same thing.
 */

import { rulesFor } from '@/engine/game/sim';
import type { LiveGame, PlayEvent, ShotType, Side } from '@/engine/game/types';
import { clockAt, pointsOf } from '@/state/live';

export interface PlayerSoFar {
  pts: number;
  reb: number;
  ast: number;
  pf: number;
  fgm: number;
  fga: number;
}

export interface LiveView {
  readonly score: readonly [number, number];
  readonly period: number;
  readonly clock: number;
  /** Team fouls in the current foul period (a half in college, a quarter elsewhere). */
  readonly teamFouls: readonly [number, number];
  readonly bonus: readonly [boolean, boolean];
  /** Side with the ball next, or null before tip-off. */
  readonly possession: Side | null;
  /** Numbers so far, by side then player index. */
  readonly players: readonly [readonly PlayerSoFar[], readonly PlayerSoFar[]];
  /** Player indices on the floor, by side. */
  readonly onCourt: readonly [readonly number[], readonly number[]];
  readonly shots: readonly ShotDot[];
}

export interface ShotDot {
  readonly side: Side;
  readonly player: number;
  readonly made: boolean;
  readonly shot: ShotType;
  /** Court position in feet from the basket the side attacks: x towards half court, y across. */
  readonly x: number;
  readonly y: number;
}

const empty = (): PlayerSoFar => ({ pts: 0, reb: 0, ast: 0, pf: 0, fgm: 0, fga: 0 });

/** The side whose possession a play belongs to. */
export function offenseOf(p: PlayEvent): Side {
  const other: Side = p.side === 0 ? 1 : 0;
  return p.kind === 'blk' || p.kind === 'foul' ? other : p.side;
}

export function liveView(live: LiveGame, shown: number): LiveView {
  const rules = rulesFor(live.rulesId);
  const plays = live.plays.slice(0, shown);
  const players: [PlayerSoFar[], PlayerSoFar[]] = [
    live.teams[0].players.map(empty),
    live.teams[1].players.map(empty),
  ];
  let onCourt: [readonly number[], readonly number[]] = [[], []];
  const fouls: [number, number] = [0, 0];
  let foulGroup = 0;
  const shots: ShotDot[] = [];
  for (const p of plays) {
    if (p.on) onCourt = [p.on[0], p.on[1]];
    const group = Math.ceil(clockAt(live, p.t).period / rules.foulPeriodGroup);
    if (group !== foulGroup) {
      foulGroup = group;
      fouls[0] = 0;
      fouls[1] = 0;
    }
    const line = players[p.side][p.player];
    if (!line) continue;
    line.pts += pointsOf(p);
    switch (p.kind) {
      case 'fg2':
      case 'fg3':
      case 'miss2':
      case 'miss3': {
        const made = p.kind === 'fg2' || p.kind === 'fg3';
        line.fga += 1;
        if (made) line.fgm += 1;
        const shot: ShotType = p.shot ?? (p.kind === 'fg3' || p.kind === 'miss3' ? 'three' : 'mid');
        shots.push({ side: p.side, player: p.player, made, shot, ...spot(shot, p.t, p.player) });
        break;
      }
      case 'reb':
        line.reb += 1;
        break;
      case 'ast':
        line.ast += 1;
        break;
      case 'foul':
        line.pf += 1;
        fouls[p.side] += 1;
        break;
      default:
        break;
    }
  }
  // Before the first lineup is written, the floor is the first one the log will show.
  if (onCourt[0].length === 0) {
    const first = live.plays.find((p) => p.on);
    if (first?.on) onCourt = [first.on[0], first.on[1]];
  }
  const last = plays[plays.length - 1];
  const next = live.plays[shown];
  const at = clockAt(live, last?.t ?? 0);
  return {
    score: last ? [last.score[0], last.score[1]] : [0, 0],
    period: at.period,
    clock: at.clock,
    teamFouls: [fouls[0], fouls[1]],
    bonus: [fouls[1] >= rules.bonusAt, fouls[0] >= rules.bonusAt],
    possession: next ? offenseOf(next) : last ? offenseOf(last) : null,
    players,
    onCourt,
    shots,
  };
}

/** A small deterministic hash, so a shot always lands on the same spot. */
function hash(a: number, b: number): number {
  let h = Math.imul(Math.round(a * 10) ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(b + 1, 0xc2b2ae35);
  h ^= h >>> 15;
  h = Math.imul(h, 0x27d4eb2f);
  h ^= h >>> 13;
  return (h >>> 0) / 4294967296;
}

/**
 * Where a shot of a given kind came from, in feet from the basket: x out towards half court,
 * y across the floor (negative is the left side looking at the basket).
 */
export function spot(shot: ShotType, t: number, player: number): { x: number; y: number } {
  const u = hash(t, player);
  const v = hash(t + 0.37, player + 11);
  if (shot === 'three' && u < 0.18) {
    // Corner three: along the baseline.
    return { x: 1 + v * 7, y: (u < 0.09 ? -1 : 1) * (22 + v * 0.8) };
  }
  const [lo, hi] =
    shot === 'rim' ? [0.5, 4] : shot === 'post' ? [4, 10] : shot === 'mid' ? [10, 20] : [23.5, 26];
  const r = lo + v * (hi - lo);
  const angle = (u - 0.5) * Math.PI * (shot === 'post' ? 0.7 : 0.95);
  return { x: Math.max(0.5, Math.cos(angle) * r), y: Math.sin(angle) * r };
}
