import type { Rng } from '../core/rng';
import type { NationDef } from '../content/world-types';
import type { Portrait } from '../model/person';

/** Number of variants per portrait part. The UI's art set must provide each index. */
export const PORTRAIT_PARTS = {
  head: 6,
  skin: 10,
  eyes: 8,
  brows: 6,
  nose: 8,
  mouth: 8,
  hair: 18,
  hairColour: 6,
  facialHair: 8,
  accessory: 4,
} as const satisfies Record<keyof Portrait, number>;

/**
 * Skin-tone weights (index 0 lightest, 9 deepest). Deliberately broad and overlapping:
 * every nation's roster should look varied, and nothing else is tied to nationality.
 */
function skinWeights(nation: NationDef): number[] {
  const african = nation.naming
    .filter((n) => /african|sudanese|angolan|caribbean/.test(n.id))
    .reduce((s, n) => s + n.weight, 0);
  const american = nation.naming
    .filter((n) => n.id === 'american' || n.id === 'brazilian_portuguese')
    .reduce((s, n) => s + n.weight, 0);
  const light = [5, 6, 6, 5, 4, 3, 2, 1.2, 0.8, 0.5];
  const deep = [0.3, 0.4, 0.6, 1, 1.5, 2.5, 4, 5, 5, 4];
  const broad = [1.5, 2, 2.5, 3, 3, 3, 3, 3, 2.5, 2];
  const rest = Math.max(0, 1 - african - american);
  return light.map(
    (l, i) => l * rest + (deep[i] ?? 0) * african + (broad[i] ?? 0) * american + 0.2,
  );
}

export function generatePortrait(rng: Rng, nation: NationDef): Portrait {
  const weights = skinWeights(nation);
  const skin = rng.weighted(
    weights.map((w, i) => ({ w, i })),
    (x) => x.w,
  ).i;
  return {
    head: rng.int(0, PORTRAIT_PARTS.head - 1),
    skin,
    eyes: rng.int(0, PORTRAIT_PARTS.eyes - 1),
    brows: rng.int(0, PORTRAIT_PARTS.brows - 1),
    nose: rng.int(0, PORTRAIT_PARTS.nose - 1),
    mouth: rng.int(0, PORTRAIT_PARTS.mouth - 1),
    hair: rng.int(0, PORTRAIT_PARTS.hair - 1),
    hairColour: rng.weighted([0, 1, 2, 3, 4, 5], (c) => (c === 0 ? 6 : c === 1 ? 3 : 1)),
    facialHair: rng.chance(0.55) ? 0 : rng.int(1, PORTRAIT_PARTS.facialHair - 1),
    accessory: rng.chance(0.8) ? 0 : rng.int(1, PORTRAIT_PARTS.accessory - 1),
  };
}
