import { z } from 'zod';

import { foldName, type ContentRegistry } from '@/engine/content/registry';
import type { Conditions, Effect } from '@/engine/content/story-types';

import { CLIP_TEMPLATES } from './story/clips';
import {
  collegeSchema,
  conferenceSchema,
  consequenceSchema,
  eventSchema,
  momentSchema,
  namingCultureSchema,
  nationSchema,
  proTeamSchema,
  socialSchema,
  traitSchema,
} from './schemas';

export interface ContentProblem {
  readonly where: string;
  readonly message: string;
}

function parseAll(
  problems: ContentProblem[],
  label: string,
  schema: z.ZodType,
  items: readonly unknown[],
  idOf: (x: never) => string,
): void {
  items.forEach((item, i) => {
    const result = schema.safeParse(item);
    if (!result.success) {
      const id = (() => {
        try {
          return idOf(item as never);
        } catch {
          return String(i);
        }
      })();
      for (const issue of result.error.issues)
        problems.push({ where: `${label}:${id}:${issue.path.join('.')}`, message: issue.message });
    }
  });
}

function duplicates(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const out = new Set<string>();
  for (const v of values) {
    if (seen.has(v)) out.add(v);
    seen.add(v);
  }
  return [...out];
}

function walkEffects(effects: readonly Effect[], visit: (e: Effect) => void): void {
  for (const e of effects) {
    visit(e);
    if (e.kind === 'chance') {
      walkEffects(e.then, visit);
      walkEffects(e.otherwise ?? [], visit);
    }
    if (e.kind === 'check') {
      walkEffects(e.then, visit);
      walkEffects(e.otherwise, visit);
    }
  }
}

function conditionTraits(c: Conditions | undefined): string[] {
  return [...(c?.traitsAny ?? []), ...(c?.traitsNone ?? [])];
}

/** Every problem in the registry. An empty list means the content is sound. */
export function validateContent(c: ContentRegistry): ContentProblem[] {
  const problems: ContentProblem[] = [];
  const p = (where: string, message: string) => problems.push({ where, message });

  parseAll(problems, 'nation', nationSchema, c.nations, (n: { code: string }) => n.code);
  parseAll(problems, 'naming', namingCultureSchema, c.namingCultures, (n: { id: string }) => n.id);
  parseAll(problems, 'conference', conferenceSchema, c.conferences, (n: { id: string }) => n.id);
  parseAll(problems, 'college', collegeSchema, c.colleges, (n: { id: string }) => n.id);
  parseAll(problems, 'proTeam', proTeamSchema, c.proTeams, (n: { id: string }) => n.id);
  parseAll(problems, 'trait', traitSchema, c.traits, (n: { id: string }) => n.id);
  parseAll(problems, 'event', eventSchema, c.events, (n: { id: string }) => n.id);
  parseAll(problems, 'consequence', consequenceSchema, c.consequences, (n: { id: string }) => n.id);
  parseAll(problems, 'moment', momentSchema, c.moments, (n: { id: string }) => n.id);
  parseAll(problems, 'social', socialSchema, c.social, (n: { id: string }) => n.id);

  const checkUnique = (label: string, ids: readonly string[]) => {
    duplicates(ids).forEach((d) => p(label, `duplicate id ${d}`));
  };
  checkUnique(
    'nation',
    c.nations.map((n) => n.code),
  );
  checkUnique(
    'naming',
    c.namingCultures.map((n) => n.id),
  );
  checkUnique(
    'college',
    c.colleges.map((n) => n.id),
  );
  checkUnique(
    'college.abbr',
    c.colleges.map((n) => n.abbr),
  );
  checkUnique(
    'proTeam',
    c.proTeams.map((n) => n.id),
  );
  checkUnique(
    'proTeam.abbr',
    c.proTeams.map((n) => n.abbr),
  );
  checkUnique(
    'trait',
    c.traits.map((n) => n.id),
  );
  checkUnique(
    'event',
    c.events.map((n) => n.id),
  );
  checkUnique(
    'consequence',
    c.consequences.map((n) => n.id),
  );
  checkUnique(
    'moment',
    c.moments.map((n) => n.id),
  );
  checkUnique(
    'social',
    c.social.map((n) => n.id),
  );

  // References.
  const cultures = new Set(c.namingCultures.map((n) => n.id));
  for (const n of c.nations)
    for (const ref of n.naming)
      if (!cultures.has(ref.id)) p(`nation:${n.code}`, `unknown naming culture ${ref.id}`);
  const conferences = new Set(c.conferences.map((x) => x.id));
  for (const col of c.colleges)
    if (!conferences.has(col.conferenceId))
      p(`college:${col.id}`, `unknown conference ${col.conferenceId}`);
  const traits = new Set(c.traits.map((t) => t.id));
  const consequences = new Set(c.consequences.map((x) => x.id));
  const events = new Set(c.events.map((x) => x.id));
  const social = new Set(c.social.map((x) => x.id));
  const checkEffects = (where: string, effects: readonly Effect[]) => {
    walkEffects(effects, (e) => {
      if (e.kind === 'later' && !consequences.has(e.consequence))
        p(where, `unknown consequence ${e.consequence}`);
      if (e.kind === 'trait' && !traits.has(e.id)) p(where, `unknown trait ${e.id}`);
      if (e.kind === 'social' && !social.has(e.template))
        p(where, `unknown social template ${e.template}`);
    });
  };
  for (const e of c.events) {
    for (const t of conditionTraits(e.when))
      if (!traits.has(t)) p(`event:${e.id}`, `unknown trait ${t}`);
    for (const ch of e.choices) {
      checkEffects(`event:${e.id}.${ch.id}`, ch.effects);
      for (const t of conditionTraits(ch.requires))
        if (!traits.has(t)) p(`event:${e.id}.${ch.id}`, `unknown trait ${t}`);
    }
  }
  for (const x of c.consequences) {
    checkEffects(`consequence:${x.id}`, x.effects);
    if (x.event && !events.has(x.event)) p(`consequence:${x.id}`, `unknown event ${x.event}`);
  }
  for (const t of c.traits)
    for (const ex of t.excludes ?? [])
      if (!traits.has(ex)) p(`trait:${t.id}`, `unknown excluded trait ${ex}`);
  const clips = new Set<string>(CLIP_TEMPLATES);
  for (const m of c.moments) {
    for (const t of m.trigger.traitsAny ?? [])
      if (!traits.has(t)) p(`moment:${m.id}`, `unknown trait ${t}`);
    for (const o of m.options)
      if (!clips.has(o.clip)) p(`moment:${m.id}.${o.id}`, `unknown clip template ${o.clip}`);
  }
  if (!c.traits.some((t) => t.kind === 'gift') || !c.traits.some((t) => t.kind === 'flaw'))
    p('trait', 'creation needs gifts and flaws');

  // The naming rules: nothing invented may be a real team or school.
  const realColleges = new Set(c.denyLists.colleges.map(foldName));
  const realNicknames = new Set(c.denyLists.proNicknames.map(foldName));
  const realTeams = new Set(c.denyLists.proTeams.map(foldName));
  for (const col of c.colleges) {
    if (realColleges.has(foldName(col.name)))
      p(`college:${col.id}`, `"${col.name}" is a real school`);
    if (
      realTeams.has(foldName(`${col.name} ${col.nickname}`)) ||
      realColleges.has(foldName(`${col.name} ${col.nickname}`))
    )
      p(`college:${col.id}`, 'name and nickname match a real team');
  }
  for (const t of c.proTeams) {
    if (realNicknames.has(foldName(t.nickname)))
      p(`proTeam:${t.id}`, `"${t.nickname}" is a real professional nickname`);
    if (realTeams.has(foldName(`${t.city} ${t.nickname}`)))
      p(`proTeam:${t.id}`, 'full name matches a real team');
  }
  for (const n of c.nations)
    for (const club of n.clubs)
      if (realTeams.has(foldName(club))) p(`nation:${n.code}`, `club "${club}" is a real club`);
  return problems;
}
