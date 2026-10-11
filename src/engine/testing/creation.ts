import type { CreationInput } from '../career/create';
import type { ContentIndex } from '../content/registry';
import { createRng } from '../core/rng';
import { POSITIONS } from '../model/skills';
import { pickHeight, pickStyle } from '../player/archetypes';

/** A ready-made player for tests and scripts. */
export function testPlayer(seed: string, overrides: Partial<CreationInput> = {}): CreationInput {
  return {
    given: 'Nika',
    family: 'Beridze',
    nation: 'GEO',
    hometown: 'Tbilisi',
    heightCm: 196,
    position: 'SG',
    style: 'shooter',
    jersey: 7,
    portrait: {
      head: 0,
      skin: 2,
      eyes: 1,
      brows: 1,
      nose: 1,
      mouth: 1,
      hair: 3,
      hairColour: 0,
      facialHair: 0,
      accessory: 0,
    },
    gift: 'clutch',
    flaw: 'streaky',
    seed,
    startYear: 2030,
    ...overrides,
  };
}

/** A random but plausible player, for balance runs: any nation, position, style and traits. */
export function randomCreation(index: ContentIndex, seed: string): CreationInput {
  const rng = createRng(seed, 'creation');
  const nation = rng.weighted(index.content.nations, (n) => Math.sqrt(n.talentShare));
  const position = rng.pick(POSITIONS);
  const consequenceTraits = new Set(
    index.content.consequences.flatMap((c) =>
      c.effects.flatMap((e) => (e.kind === 'trait' ? [e.id] : [])),
    ),
  );
  const gifts = index.content.traits.filter((t) => t.kind === 'gift');
  const flaws = index.content.traits.filter(
    (t) => t.kind === 'flaw' && !t.unlock && !consequenceTraits.has(t.id),
  );
  return testPlayer(seed, {
    nation: nation.code,
    hometown: nation.cities[0] ?? nation.code,
    position,
    style: pickStyle(rng, position),
    heightCm: pickHeight(rng, position),
    gift: rng.pick(gifts).id,
    flaw: rng.pick(flaws).id,
  });
}
