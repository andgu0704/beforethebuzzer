import { clamp } from '../core/math';
import { asPersonId, nextId, type TeamId } from '../core/ids';
import { foldName } from '../content/registry';
import type { NationDef } from '../content/world-types';
import type { Agent, Coach, Journalist } from '../model/person';
import type { GenContext } from '../player/generate';
import { pickHometown } from '../player/generate';
import { generateName } from './names';
import { generatePortrait } from './portrait';

function base(ctx: GenContext, nation: NationDef, age: number) {
  const name = generateName(ctx.rng, ctx.index, nation, ctx.taken);
  ctx.taken.add(foldName(`${name.given} ${name.family}`));
  return {
    id: asPersonId(nextId(ctx.world.counters, 'person', 'p')),
    given: name.given,
    family: name.family,
    nation: nation.code,
    hometown: pickHometown(ctx.rng, nation),
    birthYear: ctx.world.date.year - age,
    portrait: generatePortrait(ctx.rng, nation),
  };
}

/** A head coach. `quality` (1–100) tracks the programme's prestige. */
export function generateCoach(
  ctx: GenContext,
  nation: NationDef,
  teamId: TeamId,
  quality: number,
): Coach {
  const { rng } = ctx;
  return {
    ...base(ctx, nation, rng.int(36, 68)),
    kind: 'coach',
    teamId,
    development: clamp(Math.round(rng.normal(40 + quality * 0.25, 14)), 10, 98),
    discipline: clamp(Math.round(rng.normal(55, 18)), 5, 98),
    acumen: clamp(Math.round(rng.normal(38 + quality * 0.3, 12)), 10, 98),
    tactics: {
      pace: clamp(Math.round(rng.normal(50, 14)), 15, 90),
      threeRate: clamp(Math.round(rng.normal(52, 16)), 10, 95),
      pressure: clamp(Math.round(rng.normal(50, 15)), 10, 95),
      depth: rng.int(7, 10),
    },
  };
}

export function generateAgent(ctx: GenContext, nation: NationDef, quality: number): Agent {
  return {
    ...base(ctx, nation, ctx.rng.int(30, 64)),
    kind: 'agent',
    quality,
    fee: Math.round((0.02 + quality / 2500) * 1000) / 1000,
  };
}

export function generateJournalist(ctx: GenContext, nation: NationDef, outlet: string): Journalist {
  return { ...base(ctx, nation, ctx.rng.int(26, 55)), kind: 'journalist', outlet };
}
