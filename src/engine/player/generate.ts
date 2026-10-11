import { clamp } from '../core/math';
import { asPersonId, nextId } from '../core/ids';
import type { Rng } from '../core/rng';
import { foldName, type ContentIndex } from '../content/registry';
import type { NationDef } from '../content/world-types';
import type { Affiliation, Player } from '../model/person';
import type { PlayStyle, Position } from '../model/skills';
import type { World } from '../model/world';
import { generateName } from '../world/names';
import { generatePortrait } from '../world/portrait';
import { pickHeight, pickStyle, pickWeight, pickWingspan, rollSkills } from './archetypes';
import { rollCeilings, typicalGap } from './potential';

export interface GenContext {
  readonly rng: Rng;
  readonly index: ContentIndex;
  readonly world: World;
  /** Folded full names already in use. */
  readonly taken: Set<string>;
}

export interface PlayerSpec {
  readonly nation: NationDef;
  readonly birthYear: number;
  /** Current base skill level before style offsets. */
  readonly level: number;
  /** Extra room to grow beyond what is typical for the age (can be negative). */
  readonly gapBonus?: number;
  readonly position?: Position;
  readonly style?: PlayStyle;
  readonly affiliation: Affiliation;
  readonly hometown?: string;
}

const POSITION_WEIGHTS: readonly [Position, number][] = [
  ['PG', 1],
  ['SG', 1.1],
  ['SF', 1],
  ['PF', 0.95],
  ['C', 0.75],
];

export function randomPosition(rng: Rng): Position {
  return rng.weighted(POSITION_WEIGHTS, ([, w]) => w)[0];
}

export function pickHometown(rng: Rng, nation: NationDef): string {
  const cities = nation.cities;
  const u = rng.next();
  return cities[Math.floor(cities.length * u * u)] ?? cities[0] ?? nation.code;
}

export function generatePlayer(ctx: GenContext, spec: PlayerSpec): Player {
  const { rng, world } = ctx;
  const position = spec.position ?? randomPosition(rng);
  const style = spec.style ?? pickStyle(rng, position);
  const heightCm = pickHeight(rng, position);
  const age = world.date.year - spec.birthYear;
  const skills = rollSkills(rng, spec.level, style);
  const gap = clamp(
    typicalGap(age) + (spec.gapBonus ?? 0) + rng.normal(0, typicalGap(age) * 0.35 + 1.5),
    0,
    34,
  );
  const name = generateName(rng, ctx.index, spec.nation, ctx.taken);
  ctx.taken.add(foldName(`${name.given} ${name.family}`));
  const id = asPersonId(nextId(world.counters, 'person', 'p'));
  return {
    id,
    kind: 'player',
    given: name.given,
    family: name.family,
    nation: spec.nation.code,
    hometown: spec.hometown ?? pickHometown(rng, spec.nation),
    birthYear: spec.birthYear,
    portrait: generatePortrait(rng, spec.nation),
    heightCm,
    wingspanCm: pickWingspan(rng, heightCm),
    weightKg: pickWeight(rng, heightCm, position),
    position,
    style,
    skills,
    ceiling: rollCeilings(rng, skills, style, spec.level + gap),
    growthRate: Math.round(clamp(rng.normal(1, 0.12), 0.7, 1.35) * 1000) / 1000,
    traits: [],
    health: 100,
    energy: 85,
    confidence: clamp(Math.round(rng.normal(55, 8)), 25, 85),
    injury: null,
    chronic: [],
    jersey: rng.pick(JERSEYS),
    affiliation: spec.affiliation,
    stints: [],
    lines: [],
    draft: null,
    recruitRank: null,
    isUser: false,
  };
}

export const JERSEYS = [
  0, 1, 2, 3, 4, 5, 10, 11, 12, 13, 14, 15, 20, 21, 22, 23, 24, 25, 30, 31, 32, 33, 34, 35, 40, 41,
  42, 43, 44, 45, 50, 51, 52, 53, 54, 55,
] as const;
