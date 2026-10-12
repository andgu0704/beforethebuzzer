import { ageAt, seasonOf } from '../core/calendar';
import { clamp } from '../core/math';
import { createRng } from '../core/rng';
import type { PersonId } from '../core/ids';
import { overallOf } from '../game/ratings';
import { isPlayer, type Player, type SeasonLine } from '../model/person';
import type { World } from '../model/world';

/** Competition level of a player's main team this season, 1 = major conference. */
function competitionLevel(world: World, p: Player): number {
  const a = p.affiliation;
  if (a.kind === 'college') {
    const team = world.teams[a.teamId];
    if (team?.kind !== 'college') return 0.85;
    return team.prestige >= 58 ? 1 : team.prestige >= 30 ? 0.9 : 0.8;
  }
  if (a.kind === 'overseas') {
    const strength = (world.nations[a.clubNation]?.points ?? 500) / 10;
    return 0.75 + strength / 400;
  }
  return 0.85;
}

/** Production per 40 minutes, scaled so a typical rotation player is around 50. */
export function production(lines: readonly SeasonLine[]): {
  score: number;
  minutes: number;
  games: number;
} {
  let pts = 0,
    reb = 0,
    ast = 0,
    stl = 0,
    blk = 0,
    tov = 0,
    fga = 0,
    fgm = 0,
    fta = 0,
    ftm = 0,
    min = 0,
    gp = 0;
  for (const l of lines) {
    pts += l.pts;
    reb += l.orb + l.drb;
    ast += l.ast;
    stl += l.stl;
    blk += l.blk;
    tov += l.tov;
    fga += l.fga;
    fgm += l.fgm;
    fta += l.fta;
    ftm += l.ftm;
    min += l.min;
    gp += l.gp;
  }
  if (min < 40) return { score: 45, minutes: min, games: gp };
  const raw =
    pts +
    1.1 * reb +
    1.5 * ast +
    2 * stl +
    1.6 * blk -
    1.6 * tov -
    0.75 * (fga - fgm) -
    0.4 * (fta - ftm);
  const per40 = (raw / min) * 40;
  return { score: clamp(30 + per40 * 1.15, 10, 95), minutes: min, games: gp };
}

export interface ScoutView {
  readonly playerId: PersonId;
  /** What scouts see now (noisy only slightly). */
  readonly current: number;
  /** Their estimate of his ceiling, noisier the less they have seen. */
  readonly ceiling: number;
  readonly production: number;
  readonly age: number;
  /** Consensus value; higher is better. */
  readonly score: number;
  /** One noise scale for the UI's "confidence" of the projection (lower is surer). */
  readonly uncertainty: number;
}

/** Extra draft-stock points from career effects (tournaments, events), keyed by player id. */
export type StockAdjustments = Readonly<Record<string, number>>;

/**
 * How the consensus score blends what he is, what he might become and what he has done.
 * Production carries real weight so that a big role played well moves a prospect up the board.
 */
const WEIGHT = { current: 0.4, ceiling: 0.15, production: 0.45 } as const;

export function scout(world: World, p: Player, adjustments: StockAdjustments = {}): ScoutView {
  const season = seasonOf(world.date);
  const age = ageAt(p.birthYear, world.date);
  const current = overallOf(p.skills, p.position, p.heightCm);
  const trueCeiling = overallOf(p.ceiling, p.position, p.heightCm);
  const recent = p.lines.filter(
    (l) =>
      l.season >= season - 1 &&
      (l.league === 'college' || l.league === 'overseas' || l.league === 'national'),
  );
  const prod = production(recent);
  const seen =
    prod.games + p.lines.filter((l) => l.league === 'college').reduce((s, l) => s + l.gp, 0) * 0.3;
  const uncertainty = 7 / Math.sqrt(1 + seen / 8);
  // Stable per player and season, so the board does not jitter week to week.
  const rng = createRng(world.seed, 'scout', p.id, season);
  const ceilingNoise = rng.normal(0, uncertainty);
  const currentNoise = rng.normal(0, 1.2);
  const estCeiling = Math.max(current, trueCeiling + ceilingNoise);
  const level = competitionLevel(world, p);
  const prodAdjusted = 45 + (prod.score - 45) * level;
  const youth = (20 - age) * 1.0;
  const length = clamp(p.wingspanCm - p.heightCm, -6, 14) * 0.18;
  const injury =
    p.injury && p.injury.severity !== 'minor' ? (p.injury.severity === 'severe' ? -4 : -1.5) : 0;
  const chronic = p.chronic.length * -1.5;
  // Production counts in full once scouts have seen enough minutes; before that it is assumed average.
  const seenMinutes = Math.min(1, prod.minutes / 400);
  const score =
    (current + currentNoise) * WEIGHT.current +
    estCeiling * WEIGHT.ceiling +
    (prodAdjusted * seenMinutes + 45 * (1 - seenMinutes)) * WEIGHT.production +
    youth +
    length +
    injury +
    chronic +
    (adjustments[p.id] ?? 0);
  return {
    playerId: p.id,
    current,
    ceiling: estCeiling,
    production: prodAdjusted,
    age,
    score,
    uncertainty,
  };
}

/** Everyone who could plausibly be drafted this year, whether or not he has declared. */
export function eligibleProspects(world: World): Player[] {
  const year = world.date.year;
  const out: Player[] = [];
  for (const person of Object.values(world.people)) {
    if (!isPlayer(person)) continue;
    const age = year - person.birthYear;
    const a = person.affiliation;
    if (a.kind === 'college' && age >= 19) out.push(person);
    else if (a.kind === 'overseas' && age >= 19 && age <= 23 && !person.draft) out.push(person);
  }
  return out;
}

export function rankProspects(
  world: World,
  players: readonly Player[],
  adjustments: StockAdjustments = {},
): ScoutView[] {
  return players
    .map((p) => scout(world, p, adjustments))
    .sort((a, b) => b.score - a.score || (a.playerId < b.playerId ? -1 : 1));
}
