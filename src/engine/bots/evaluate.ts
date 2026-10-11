import type { ContentIndex } from '../content/registry';
import type { Effect, StatusKey } from '../content/story-types';
import type { GameState } from '../career/state';

const STATUS_VALUE: Record<StatusKey, number> = {
  energy: 0.15,
  health: 0.3,
  confidence: 0.4,
  coachTrust: 0.6,
  chemistry: 0.3,
  reputation: 0.3,
  money: 0.0005,
  gpa: 8,
};

/**
 * A rough value for a list of effects, used by the bots to choose between event responses.
 * `foresight` decides whether delayed consequences count (casual players do not see them).
 */
export function valueOf(
  state: GameState,
  index: ContentIndex,
  effects: readonly Effect[],
  foresight: boolean,
  depth = 0,
): number {
  let total = 0;
  for (const e of effects) {
    switch (e.kind) {
      case 'status':
        total +=
          e.delta * STATUS_VALUE[e.key] * (e.key === 'gpa' && state.career.gpa < 2.3 ? 2 : 1);
        break;
      case 'skill':
        total += e.delta * 3;
        break;
      case 'ceiling':
        total += e.delta * 4;
        break;
      case 'relation':
        total += e.delta * (e.who === 'coach' ? 0.3 : 0.12);
        break;
      case 'later': {
        if (!foresight || depth > 2) break;
        const c = index.consequence.get(e.consequence);
        if (c) total += e.chance * valueOf(state, index, c.effects, foresight, depth + 1);
        break;
      }
      case 'trait': {
        const t = index.trait.get(e.id);
        const sign = t?.kind === 'flaw' ? -8 : 5;
        total += e.add ? sign : -sign;
        break;
      }
      case 'injury':
        total -= ((e.weeks[0] + e.weeks[1]) / 2) * 4;
        break;
      case 'suspension':
        total -= e.games * 3;
        break;
      case 'draftStock':
        total += e.delta * 12;
        break;
      case 'chance':
        total +=
          e.p * valueOf(state, index, e.then, foresight, depth) +
          (1 - e.p) * valueOf(state, index, e.otherwise ?? [], foresight, depth);
        break;
      case 'check':
        total +=
          0.5 * valueOf(state, index, e.then, foresight, depth) +
          0.5 * valueOf(state, index, e.otherwise, foresight, depth);
        break;
      case 'flag':
      case 'feat':
      case 'social':
        break;
    }
  }
  return total;
}
