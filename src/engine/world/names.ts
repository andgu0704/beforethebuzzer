import type { Rng } from '../core/rng';
import { foldName, type ContentIndex } from '../content/registry';
import type { NamingCultureDef, NationDef } from '../content/world-types';

/** Picks from a list favouring the front (the most common names), with a long tail. */
function pickCommon<T>(rng: Rng, items: readonly T[]): T {
  const u = rng.next();
  const index = Math.floor(items.length * u * u * 0.65 + items.length * u * 0.35);
  return items[Math.min(items.length - 1, index)] ?? (items[0] as T);
}

function cultureFor(rng: Rng, index: ContentIndex, nation: NationDef): NamingCultureDef {
  const ref = rng.weighted(nation.naming, (r) => r.weight);
  const culture = index.culture.get(ref.id) ?? index.content.namingCultures[0];
  if (!culture) throw new Error(`no naming culture for ${nation.code}`);
  return culture;
}

/**
 * A plausible name for someone from `nation`. Never returns the name of a real player on
 * the deny-list; also avoids repeating a name already in use.
 */
export function generateName(
  rng: Rng,
  index: ContentIndex,
  nation: NationDef,
  taken: ReadonlySet<string>,
): { given: string; family: string } {
  for (let attempt = 0; attempt < 40; attempt++) {
    const culture = cultureFor(rng, index, nation);
    // Mixed heritage happens: occasionally the family name comes from a second culture.
    const familyCulture = rng.chance(0.08) ? cultureFor(rng, index, nation) : culture;
    const given = pickCommon(rng, culture.given);
    const family = pickCommon(rng, familyCulture.family);
    const full = foldName(`${given} ${family}`);
    if (index.realNames.has(full) || taken.has(full)) continue;
    return { given, family };
  }
  throw new Error(`could not generate a free name for ${nation.code}`);
}
