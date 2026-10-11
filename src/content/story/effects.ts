/**
 * Small constructors for story effects, so event and consequence files read like a list of
 * outcomes instead of a wall of object literals. They add nothing the schema does not check.
 */

import type { Effect, Feat, Relation, StatusKey } from '@/engine/content/story-types';
import type { Skill } from '@/engine/model/skills';

export const status = (key: StatusKey, delta: number): Effect => ({ kind: 'status', key, delta });
export const rel = (who: Relation, delta: number): Effect => ({ kind: 'relation', who, delta });
export const skill = (s: Skill, delta: number): Effect => ({ kind: 'skill', skill: s, delta });
export const flag = (id: string, set = true): Effect => ({ kind: 'flag', id, set });
export const later = (
  consequence: string,
  inWeeks: readonly [number, number],
  chance: number,
): Effect => ({ kind: 'later', consequence, inWeeks, chance });
export const stock = (delta: number): Effect => ({ kind: 'draftStock', delta });
export const feat = (f: Feat, delta: number): Effect => ({ kind: 'feat', feat: f, delta });
export const injury = (kind: string, weeks: readonly [number, number]): Effect => ({
  kind: 'injury',
  injury: kind,
  weeks,
});
export const post = (template: string): Effect => ({ kind: 'social', template });
export const suspension = (games: number): Effect => ({ kind: 'suspension', games });
export const chance = (
  p: number,
  then: readonly Effect[],
  otherwise: readonly Effect[] = [],
): Effect => ({ kind: 'chance', p, then, otherwise });
export const checkStatus = (
  key: StatusKey,
  against: number,
  then: readonly Effect[],
  otherwise: readonly Effect[],
): Effect => ({ kind: 'check', status: key, against, then, otherwise });
export const checkSkill = (
  s: Skill,
  against: number,
  then: readonly Effect[],
  otherwise: readonly Effect[],
): Effect => ({ kind: 'check', skill: s, against, then, otherwise });
