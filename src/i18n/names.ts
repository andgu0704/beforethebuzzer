import type { World } from '@/engine/model/world';

import type { NameResolver, Translator } from './format';

/** Display names for people and teams, with the name editor's overrides applied. */
export function worldNames(world: World, t: Translator): NameResolver {
  return {
    person(id, part) {
      const p = world.people[id];
      if (!p) return '';
      const o = world.overrides.people[id];
      const given = o?.given ?? p.given;
      const family = o?.family ?? p.family;
      if (part === 'given') return given;
      if (part === 'family') return family;
      return `${given} ${family}`;
    },
    team(id, part) {
      const team = world.teams[id];
      // Showcase sides are removed after the showcase; old feed entries still name them.
      if (!team && id.startsWith('showcase-')) {
        const side = id.slice('showcase-'.length);
        const name = t.t(`teams.showcase${side.charAt(0).toUpperCase()}${side.slice(1)}`);
        return part === 'abbr' ? name.slice(0, 1) + 'SEL' : name;
      }
      if (!team) return '';
      const o = world.overrides.teams[id];
      if (team.kind === 'national') {
        const nation = t.t(`nations.${team.nation}`);
        return team.level === 'u20' ? t.t('teams.u20', { nation }) : nation;
      }
      if (team.kind === 'select') return t.t(`teams.${team.name}`);
      const name = o?.name ?? team.name;
      const nickname = o?.nickname ?? team.nickname;
      const abbr = o?.abbr ?? team.abbr;
      if (part === 'abbr') return abbr;
      if (part === 'nickname') return nickname;
      if (part === 'name') return name;
      return team.kind === 'pro' ? `${name} ${nickname}` : name;
    },
  };
}
