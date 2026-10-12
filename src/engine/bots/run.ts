import type { ContentIndex } from '../content/registry';
import { createCareer, type CreationInput } from '../career/create';
import { userOf, userTeamId, type GameState } from '../career/state';
import { advance, resolve } from '../career/turn';
import type { Ending, Interrupt } from '../model/career';
import { autoSpend } from '../career/upgrade';
import { spendWeights, type Bot } from './bots';

export interface CareerRun {
  readonly state: GameState;
  readonly ending: Ending | null;
  readonly weeks: number;
  readonly interrupts: Readonly<Record<string, number>>;
  readonly moments: { readonly taken: number; readonly succeeded: number };
}

export interface RunOptions {
  readonly maxWeeks?: number;
  /**
   * Where the run stops: at the draft outcome (the default, which the balance studies measure),
   * or at the real end of the career, retirement included.
   */
  readonly stopAt?: 'draft' | 'end';
  /** Called at every interrupt boundary, e.g. to save and reload mid-turn. */
  readonly onInterrupt?: (state: GameState, interrupt: Interrupt) => GameState;
}

/** Plays a whole career with a bot making every decision. */
export function playCareer(
  index: ContentIndex,
  input: CreationInput,
  bot: Bot,
  options: RunOptions = {},
): CareerRun {
  let state = createCareer(index, input);
  const interrupts: Record<string, number> = {};
  let weeks = 0;
  let taken = 0;
  let succeeded = 0;
  const maxWeeks = options.maxWeeks ?? (options.stopAt === 'end' ? 1400 : 400);
  const atDraftOutcome = () => options.stopAt !== 'end' && state.career.stage === 'pro';
  while (weeks < maxWeeks && !atDraftOutcome()) {
    if (state.career.cursor.stage === 'idle') state.career.plan = bot.plan(state, index);
    const step = advance(state, index);
    if (step.kind === 'ended') break;
    if (step.kind === 'weekDone') {
      weeks++;
      autoSpend(state, spendWeights(bot, state));
      continue;
    }
    const interrupt = step.interrupt;
    if (options.onInterrupt) {
      state = options.onInterrupt(state, interrupt);
    }
    interrupts[interrupt.kind] = (interrupts[interrupt.kind] ?? 0) + 1;
    const result = resolve(state, index, interrupt.id, bot.choose(state, index, interrupt));
    if (
      interrupt.kind === 'keyMoment' &&
      result &&
      typeof result === 'object' &&
      'success' in result
    ) {
      taken++;
      if ((result as { success: boolean }).success) succeeded++;
    }
  }
  const ending = state.career.ending ?? (atDraftOutcome() ? draftOutcome(state) : null);
  return { state, ending, weeks, interrupts, moments: { taken, succeeded } };
}

/** How the draft went for a player who is now a pro: picked, or signed after a camp tryout. */
function draftOutcome(state: GameState): Ending {
  const user = userOf(state);
  const pick = user.draft?.pick ?? null;
  return {
    reason: pick ? 'draft' : 'undrafted',
    date: state.world.date,
    pick,
    teamId: pick ? (user.draft?.teamId ?? null) : userTeamId(state),
  };
}
