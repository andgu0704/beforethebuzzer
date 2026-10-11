import type {
  ConsequenceDef,
  EventDef,
  MomentDef,
  SocialTemplateDef,
  TraitDef,
} from './story-types';
import type {
  CollegeDef,
  ConferenceDef,
  DenyLists,
  NamingCultureDef,
  NationDef,
  ProTeamDef,
} from './world-types';

/** Everything the engine reads from content, injected by the caller. */
export interface ContentRegistry {
  readonly version: string;
  readonly nations: readonly NationDef[];
  readonly namingCultures: readonly NamingCultureDef[];
  readonly conferences: readonly ConferenceDef[];
  readonly colleges: readonly CollegeDef[];
  readonly proTeams: readonly ProTeamDef[];
  readonly denyLists: DenyLists;
  readonly traits: readonly TraitDef[];
  readonly events: readonly EventDef[];
  readonly consequences: readonly ConsequenceDef[];
  readonly moments: readonly MomentDef[];
  readonly social: readonly SocialTemplateDef[];
}

/** Lookup tables built once from a registry. */
export interface ContentIndex {
  readonly content: ContentRegistry;
  readonly nation: ReadonlyMap<string, NationDef>;
  readonly culture: ReadonlyMap<string, NamingCultureDef>;
  readonly trait: ReadonlyMap<string, TraitDef>;
  readonly event: ReadonlyMap<string, EventDef>;
  readonly consequence: ReadonlyMap<string, ConsequenceDef>;
  readonly moment: ReadonlyMap<string, MomentDef>;
  readonly conference: ReadonlyMap<string, ConferenceDef>;
  /** Lower-cased deny-list of real full names. */
  readonly realNames: ReadonlySet<string>;
}

function byId<T extends { readonly id: string }>(items: readonly T[]): Map<string, T> {
  return new Map(items.map((item) => [item.id, item]));
}

export function foldName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[łŁ]/g, 'l')
    .replace(/[øØ]/g, 'o')
    .replace(/[ıI]/g, 'i')
    .replace(/[ðÐ]/g, 'd')
    .replace(/[þÞ]/g, 'th')
    .replace(/ß/g, 'ss')
    .toLowerCase()
    .trim();
}

export function indexContent(content: ContentRegistry): ContentIndex {
  return {
    content,
    nation: new Map(content.nations.map((n) => [n.code, n])),
    culture: byId(content.namingCultures),
    trait: byId(content.traits),
    event: byId(content.events),
    consequence: byId(content.consequences),
    moment: byId(content.moments),
    conference: byId(content.conferences),
    realNames: new Set(content.denyLists.players.map(foldName)),
  };
}
