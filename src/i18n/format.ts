/**
 * The one localisation layer. Catalogs are nested objects of strings; a leaf can also be a
 * plural form chosen by one numeric parameter. The engine emits message descriptors
 * ({ key, params }); people and teams inside them are resolved to names only here, so the
 * name editor's renames apply everywhere, including old feed entries.
 */

import type { Message, MessageParam } from '@/engine/model/career';

export interface PluralForm {
  readonly by: string;
  readonly zero?: string;
  readonly one: string;
  readonly two?: string;
  readonly few?: string;
  readonly many?: string;
  readonly other: string;
}

export type CatalogLeaf = string | PluralForm;
export interface Catalog {
  readonly [key: string]: CatalogLeaf | Catalog;
}

export interface NameResolver {
  person(id: string, part?: 'given' | 'family'): string;
  team(id: string, part?: 'name' | 'nickname' | 'abbr'): string;
}

export type Params = Readonly<Record<string, string | number>>;

function isPlural(v: unknown): v is PluralForm {
  return typeof v === 'object' && v !== null && 'other' in v && 'by' in v;
}

export function lookup(catalog: Catalog, key: string): CatalogLeaf | undefined {
  let node: CatalogLeaf | Catalog | undefined = catalog;
  for (const part of key.split('.')) {
    if (node === undefined || typeof node === 'string' || isPlural(node)) return undefined;
    node = node[part];
  }
  if (typeof node === 'string' || isPlural(node)) return node;
  return undefined;
}

/** Parameters whose values are themselves keys, translated before interpolation. */
const PARAM_KEYS: Readonly<Record<string, string>> = {
  trait: 'traits.{}.name',
  skill: 'skills.{}',
  role: 'roles.{}',
  injury: 'injuries.{}',
  clip: 'clips.{}',
  level: 'levels.{}',
};

export interface Translator {
  readonly locale: string;
  t(key: string, params?: Params): string;
  has(key: string): boolean;
  number(value: number, options?: Intl.NumberFormatOptions): string;
  message(m: Message, names: NameResolver): string;
}

export function createTranslator(locale: string, catalog: Catalog): Translator {
  const plural = new Intl.PluralRules(locale);
  const numbers = new Intl.NumberFormat(locale);
  const t = (key: string, params: Params = {}): string => {
    const leaf = lookup(catalog, key);
    if (leaf === undefined) return key;
    let template: string;
    if (typeof leaf === 'string') template = leaf;
    else {
      const n = Number(params[leaf.by] ?? 0);
      const category = plural.select(n) as keyof PluralForm;
      template = leaf[category] ?? leaf.other;
    }
    return template.replace(/\{(\w+)\}/g, (_, name: string) => {
      const value = params[name];
      if (value === undefined) return `{${name}}`;
      const path = PARAM_KEYS[name];
      if (path && typeof value === 'string') return t(path.replace('{}', value));
      return typeof value === 'number' ? numbers.format(value) : value;
    });
  };
  return {
    locale,
    t,
    has: (key) => lookup(catalog, key) !== undefined,
    number: (value, options) => new Intl.NumberFormat(locale, options).format(value),
    message(m, names) {
      const params: Record<string, string | number> = {};
      const entries: [string, MessageParam][] = Object.entries(m.params ?? {});
      for (const [k, v] of entries) {
        if (typeof v === 'object')
          params[k] = 'person' in v ? names.person(v.person, v.part) : names.team(v.team, v.part);
        else params[k] = v;
      }
      return t(m.key, params);
    },
  };
}

/** Every leaf key in a catalog, dotted. */
export function catalogKeys(catalog: Catalog, prefix = ''): string[] {
  const out: string[] = [];
  for (const [k, v] of Object.entries(catalog)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string' || isPlural(v)) out.push(key);
    else out.push(...catalogKeys(v, key));
  }
  return out;
}
