import type { PersonId } from '../core/ids';
import type { NationCode } from '../content/world-types';
import { overallOf } from '../game/ratings';
import { isPlayer, type Player } from '../model/person';
import type { World } from '../model/world';

export const NATIONAL_ROSTER = 12;

/** Selectors' view: ability first, a little credit for experience at the top level. */
export function selectorRating(p: Player): number {
  const overall = overallOf(p.skills, p.position, p.heightCm);
  const proBonus = p.affiliation.kind === 'pro' ? 1.5 : 0;
  const caps = p.lines.filter((l) => l.league === 'national').reduce((s, l) => s + l.gp, 0);
  return overall + proBonus + Math.min(2, caps * 0.1);
}

export interface SelectionOptions {
  readonly nation: NationCode;
  readonly level: 'senior' | 'u20';
  /** People who will not be considered (declined, injured long term). */
  readonly exclude?: ReadonlySet<PersonId>;
}

/** The best twelve by ability, with at least two guards and two bigs when the pool has them. */
export function selectSquad(world: World, o: SelectionOptions): Player[] {
  const year = world.date.year;
  const candidates: Player[] = [];
  for (const person of Object.values(world.people)) {
    if (!isPlayer(person) || person.nation !== o.nation) continue;
    if (person.affiliation.kind === 'retired' || person.affiliation.kind === 'freeAgent') continue;
    if (o.exclude?.has(person.id)) continue;
    if (person.injury && person.injury.weeksLeft > 3) continue;
    const age = year - person.birthYear;
    if (o.level === 'u20' ? age > 20 || age < 16 : age < 17) continue;
    candidates.push(person);
  }
  candidates.sort((a, b) => selectorRating(b) - selectorRating(a) || (a.id < b.id ? -1 : 1));
  const squad = candidates.slice(0, NATIONAL_ROSTER);
  const guards = (list: Player[]) =>
    list.filter((p) => p.position === 'PG' || p.position === 'SG').length;
  const bigs = (list: Player[]) =>
    list.filter((p) => p.position === 'PF' || p.position === 'C').length;
  for (const [count, isRole] of [
    [guards, (p: Player) => p.position === 'PG' || p.position === 'SG'],
    [bigs, (p: Player) => p.position === 'PF' || p.position === 'C'],
  ] as const) {
    while (count(squad) < 2) {
      const extra = candidates.slice(NATIONAL_ROSTER).find((p) => isRole(p) && !squad.includes(p));
      if (!extra) break;
      // Replace the lowest-rated player who does not fill a scarce role.
      const out = squad.findLastIndex((q) => !isRole(q));
      if (out < 0) break;
      squad.splice(out, 1, extra);
    }
  }
  return squad;
}
