import type { ContentIndex } from '../content/registry';
import type { FeedKind, Interrupt } from '../model/career';
import type { GameState } from './state';
import { advance, resolve } from './turn';

export interface AheadOptions {
  /** Stop at every key moment instead of resolving routine ones from his tendencies. */
  readonly stopAtEveryMoment?: boolean;
  readonly maxWeeks?: number;
}

export interface AheadResult {
  readonly weeks: number;
  readonly stop: 'interrupt' | 'notable' | 'limit' | 'ended';
  readonly interrupt?: Interrupt;
}

const ROUTINE_CONTEXTS = new Set(['regular', 'conference', 'exhibition']);
const NOTABLE: ReadonlySet<FeedKind> = new Set(['injury', 'milestone', 'draft']);

/** The option he has picked most often in this kind of moment; the first one if he never has. */
export function tendencyChoice(
  state: GameState,
  index: ContentIndex,
  interrupt: Extract<Interrupt, { kind: 'keyMoment' }>,
): string {
  const def = index.moment.get(interrupt.momentId);
  let best = interrupt.options[0] ?? '';
  let count = -1;
  for (const id of interrupt.options) {
    const option = def?.options.find((o) => o.id === id);
    if (!option) continue;
    const c = state.career.tendencies[`${option.action.kind}:${id}`] ?? 0;
    if (c > count) {
      count = c;
      best = id;
    }
  }
  return best;
}

/**
 * Skips ahead with the current plan. Routine key moments are resolved from his tendencies;
 * anything that needs the user (an event, an offer, a big-game moment) stops it, and so does a
 * week with something notable in it (an injury, a milestone, draft news).
 */
export function simulateAhead(
  state: GameState,
  index: ContentIndex,
  options: AheadOptions = {},
): AheadResult {
  const maxWeeks = options.maxWeeks ?? 12;
  let weeks = 0;
  let feedMark = state.career.feed.length;
  for (let guard = 0; guard < 5000; guard++) {
    const step = advance(state, index);
    if (step.kind === 'ended') return { weeks, stop: 'ended' };
    if (step.kind === 'interrupt') {
      const i = step.interrupt;
      const routine =
        i.kind === 'keyMoment' &&
        !options.stopAtEveryMoment &&
        ROUTINE_CONTEXTS.has(state.career.cursor.live?.context ?? '');
      if (i.kind === 'keyMoment' && routine) {
        resolve(state, index, i.id, tendencyChoice(state, index, i));
        continue;
      }
      return { weeks, stop: 'interrupt', interrupt: i };
    }
    weeks += 1;
    const fresh = state.career.feed.slice(feedMark);
    feedMark = state.career.feed.length;
    if (fresh.some((f) => NOTABLE.has(f.kind))) return { weeks, stop: 'notable' };
    if (weeks >= maxWeeks) return { weeks, stop: 'limit' };
  }
  return { weeks, stop: 'limit' };
}
