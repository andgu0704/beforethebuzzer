import { weekIndex } from '../core/calendar';
import { clamp, logistic } from '../core/math';
import type { Rng } from '../core/rng';
import type { Effect, StatusKey } from '../content/story-types';
import type { ContentIndex } from '../content/registry';
import type { Cause } from '../model/career';
import { makeInjury } from '../player/injury';
import { statusValue } from './conditions';
import { postSocial } from './social';
import { msg, pushTimeline, userOf, type GameState } from './state';
import { mergeTraits } from './traits';

/** One visible change, for the outcome screen and the timeline. */
export interface Change {
  readonly kind:
    | 'status'
    | 'skill'
    | 'ceiling'
    | 'relation'
    | 'flag'
    | 'trait'
    | 'injury'
    | 'suspension'
    | 'draftStock'
    | 'feat'
    | 'later';
  readonly key: string;
  readonly delta?: number;
  readonly on?: boolean;
}

const STATUS_RANGE: Record<StatusKey, readonly [number, number]> = {
  energy: [0, 100],
  health: [0, 100],
  confidence: [0, 100],
  coachTrust: [0, 100],
  chemistry: [0, 100],
  reputation: [0, 100],
  money: [-1_000_000, 1_000_000_000],
  gpa: [0, 4],
};

export function changeStatus(
  state: GameState,
  index: ContentIndex,
  key: StatusKey,
  delta: number,
): number {
  const career = state.career;
  const p = userOf(state);
  const traits = mergeTraits(index, p);
  let d = delta;
  if (key === 'confidence') d *= traits.confidenceSwing;
  if (key === 'coachTrust' && d > 0) d *= traits.coachTrust;
  if (key === 'reputation' && d > 0) d *= traits.reputation;
  if (key === 'chemistry' && d > 0) d *= traits.chemistry;
  if (key === 'gpa' && d > 0) d *= traits.grades;
  const [lo, hi] = STATUS_RANGE[key];
  const before = statusValue(career, p, key);
  const after = clamp(Math.round((before + d) * 100) / 100, lo, hi);
  switch (key) {
    case 'energy':
      p.energy = after;
      break;
    case 'health':
      p.health = after;
      break;
    case 'confidence':
      p.confidence = after;
      break;
    default:
      career[key] = after;
  }
  return after - before;
}

export function applyEffects(
  state: GameState,
  index: ContentIndex,
  effects: readonly Effect[],
  why: Cause,
  rng: Rng,
): Change[] {
  const changes: Change[] = [];
  const career = state.career;
  const p = userOf(state);
  for (const e of effects) {
    switch (e.kind) {
      case 'status': {
        const delta = changeStatus(state, index, e.key, e.delta);
        changes.push({ kind: 'status', key: e.key, delta });
        break;
      }
      case 'skill': {
        const before = p.skills[e.skill];
        p.skills[e.skill] = clamp(before + e.delta, 1, Math.max(p.ceiling[e.skill], before));
        changes.push({ kind: 'skill', key: e.skill, delta: p.skills[e.skill] - before });
        break;
      }
      case 'ceiling':
        for (const key of Object.keys(p.ceiling) as (keyof typeof p.ceiling)[])
          p.ceiling[key] = clamp(p.ceiling[key] + e.delta, p.skills[key], 99);
        changes.push({ kind: 'ceiling', key: 'all', delta: e.delta });
        break;
      case 'relation':
        career.relations[e.who] = clamp(career.relations[e.who] + e.delta, 0, 100);
        changes.push({ kind: 'relation', key: e.who, delta: e.delta });
        break;
      case 'flag':
        if (e.set) career.flags[e.id] = { setAt: weekIndex(state.world.date), cause: why };
        else delete career.flags[e.id];
        changes.push({ kind: 'flag', key: e.id, on: e.set });
        break;
      case 'later':
        career.scheduled.push({
          consequence: e.consequence,
          due: weekIndex(state.world.date) + rng.int(e.inWeeks[0], e.inWeeks[1]),
          chance: e.chance,
          cause: why,
        });
        changes.push({ kind: 'later', key: e.consequence });
        break;
      case 'trait':
        if (e.add && !p.traits.includes(e.id)) {
          p.traits.push(e.id);
          pushTimeline(state, msg('timeline.traitGained', { trait: e.id }), why, true);
        } else if (!e.add && p.traits.includes(e.id)) {
          p.traits = p.traits.filter((t) => t !== e.id);
          pushTimeline(state, msg('timeline.traitLost', { trait: e.id }), why, true);
        }
        changes.push({ kind: 'trait', key: e.id, on: e.add });
        break;
      case 'injury': {
        const weeks = rng.int(e.weeks[0], e.weeks[1]);
        const severity =
          weeks <= 2 ? 'minor' : weeks <= 6 ? 'moderate' : weeks <= 14 ? 'major' : 'severe';
        const injury = makeInjury(
          rng,
          state.world.date,
          severity,
          mergeTraits(index, p).recovery,
          e.injury,
        );
        injury.weeksLeft = weeks;
        p.injury = injury;
        changes.push({ kind: 'injury', key: e.injury, delta: weeks });
        break;
      }
      case 'suspension':
        career.suspendedGames += e.games;
        changes.push({ kind: 'suspension', key: 'games', delta: e.games });
        break;
      case 'feat':
        career.feats[e.feat] += e.delta;
        changes.push({ kind: 'feat', key: e.feat, delta: e.delta });
        break;
      case 'social':
        postSocial(state, index, e.template, rng);
        break;
      case 'draftStock':
        career.stock += e.delta;
        changes.push({ kind: 'draftStock', key: 'stock', delta: e.delta });
        break;
      case 'chance':
        changes.push(
          ...applyEffects(state, index, rng.chance(e.p) ? e.then : (e.otherwise ?? []), why, rng),
        );
        break;
      case 'check': {
        const value = e.skill
          ? p.skills[e.skill]
          : e.status
            ? statusValue(career, p, e.status)
            : 50;
        const success = rng.chance(logistic((value - e.against) / 8));
        changes.push(...applyEffects(state, index, success ? e.then : e.otherwise, why, rng));
        break;
      }
    }
  }
  return changes;
}
