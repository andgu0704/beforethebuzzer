/**
 * The session store and the game controller. The engine mutates one GameState in place; the
 * store holds a reference to it and a revision number that changes after every engine call, so
 * components re-read what they need. Every engine call goes through here, and every decision
 * boundary is saved.
 */

import { create } from 'zustand';

import { content } from '@/content';
import { isRoutineMoment, NOTABLE, tendencyChoice } from '@/engine/career/ahead';
import { createCareer, type CreationInput } from '@/engine/career/create';
import { userOf, userTeamId, type GameState } from '@/engine/career/state';
import { advanceSlice, resolve, type Choice } from '@/engine/career/turn';
import { upgradeSkill } from '@/engine/career/upgrade';
import type { Skill } from '@/engine/model/skills';
import { indexContent, type ContentIndex } from '@/engine/content/registry';
import type { Interrupt } from '@/engine/model/career';
import { deserialise, SaveError, serialise, type SaveSummary } from '@/engine/save/store';
import { haptic } from '@/platform/haptics';
import { saveStore } from '@/platform/storage';

import { timed, usePerf } from './perf';
import { useSettings } from './settings';

let indexCache: ContentIndex | null = null;
export function contentIndex(): ContentIndex {
  indexCache ??= indexContent(content);
  return indexCache;
}

export type Busy =
  | { readonly kind: 'week' }
  | { readonly kind: 'ahead'; readonly weeks: number; readonly of: number }
  | { readonly kind: 'create' }
  | { readonly kind: 'load' };

export interface GameStore {
  booted: boolean;
  saves: SaveSummary[];
  state: GameState | null;
  /** Changes after every engine call; select it to re-render on game changes. */
  rev: number;
  busy: Busy | null;
  /** Outcomes of resolved interrupts, by interrupt id, for the sheets to show. */
  outcomes: Record<string, unknown>;
  error: { readonly kind: 'save' | 'load' | 'engine'; readonly message: string } | null;
  /** Feed length when the current week started, so new entries can animate in. */
  feedMark: number;
}

export const useGame = create<GameStore>()(() => ({
  booted: false,
  saves: [],
  state: null,
  rev: 0,
  busy: null,
  outcomes: {},
  error: null,
  feedMark: 0,
}));

const set = useGame.setState;
const get = useGame.getState;

function bump(extra: Partial<GameStore> = {}): void {
  set({ ...extra, rev: get().rev + 1 });
}

/** Game slots played between frames; a slot is one round of league games. */
const SLOTS_PER_FRAME = 2;

/**
 * Plays until something needs the user, the week ends or the career ends, painting between
 * slices so a heavy week never freezes the screen. Routine key moments can be answered on the
 * way (simulate ahead).
 */
async function runWeek(
  state: GameState,
  auto: { readonly stopAtEveryMoment: boolean } | null,
): Promise<'interrupt' | 'weekDone' | 'ended'> {
  for (let guard = 0; guard < 5000; guard++) {
    const step = timed('lastEngineMs', () => advanceSlice(state, contentIndex(), SLOTS_PER_FRAME));
    if (step.kind === 'yield') {
      await frame();
      continue;
    }
    if (step.kind === 'gameStart' || step.kind === 'gameEnd') continue;
    if (
      step.kind === 'interrupt' &&
      auto &&
      isRoutineMoment(state, step.interrupt, auto.stopAtEveryMoment)
    ) {
      resolve(
        state,
        contentIndex(),
        step.interrupt.id,
        tendencyChoice(state, contentIndex(), step.interrupt),
      );
      continue;
    }
    return step.kind;
  }
  return 'weekDone';
}

/** Lets the UI paint (the "Simulating" state) before a long synchronous engine call. */
function frame(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 16));
}

export function requireState(): GameState {
  const s = get().state;
  if (!s) throw new Error('no career is open');
  return s;
}

// ------------------------------------------------------------------ saves

export function summaryOf(state: GameState): SaveSummary {
  const user = userOf(state);
  const teamId = userTeamId(state) ?? state.career.committedTo;
  const team = teamId ? state.world.teams[teamId] : undefined;
  return {
    id: state.meta.saveId,
    name: `${user.given} ${user.family}`,
    updatedWeek: state.world.date.year * 52 + state.world.date.week,
    godMode: state.meta.integrity.godMode,
    detail: {
      year: state.world.date.year,
      week: state.world.date.week,
      stage: state.career.stage,
      teamId: teamId ?? '',
      teamName: team ? team.name : '',
      colour: team?.colours.primary ?? '',
      jersey: user.jersey,
      portrait: user.portrait,
      ended: state.career.ending !== null,
      pick: state.career.ending?.pick ?? 0,
    },
  };
}

let writing: Promise<void> = Promise.resolve();

/** Saves off the interaction path; writes are queued so they never overlap. */
export function save(): Promise<void> {
  const state = get().state;
  if (!state) return writing;
  writing = writing.then(async () => {
    try {
      await frame();
      const summary = summaryOf(state);
      const start = performance.now();
      const text = serialise(state);
      await saveStore.write(summary, text);
      usePerf.setState({ lastSaveMs: performance.now() - start });
      const saves = get().saves.filter((s) => s.id !== summary.id);
      set({ saves: [summary, ...saves] });
    } catch (e) {
      set({ error: { kind: 'save', message: e instanceof Error ? e.message : String(e) } });
    }
  });
  return writing;
}

export async function boot(): Promise<void> {
  if (get().booted) return;
  try {
    const saves = await saveStore.list();
    saves.sort((a, b) => b.updatedWeek - a.updatedWeek);
    set({ saves, booted: true });
  } catch (e) {
    set({
      booted: true,
      error: { kind: 'load', message: e instanceof Error ? e.message : String(e) },
    });
  }
}

export async function openCareer(id: string, fromBackup = false): Promise<boolean> {
  set({ busy: { kind: 'load' }, error: null });
  await frame();
  try {
    const text = fromBackup ? await saveStore.readBackup(id) : await saveStore.read(id);
    if (!text) throw new SaveError('corrupt', 'the save is missing');
    const state = deserialise(text);
    contentIndex();
    useSettings.getState().update({ lastCareer: id });
    bump({ state, busy: null, outcomes: {}, feedMark: state.career.feed.length });
    return true;
  } catch (e) {
    set({
      busy: null,
      error: { kind: 'load', message: e instanceof Error ? e.message : String(e) },
    });
    return false;
  }
}

export function closeCareer(): void {
  bump({ state: null, outcomes: {} });
}

export async function deleteCareer(id: string): Promise<void> {
  await saveStore.remove(id);
  set({ saves: get().saves.filter((s) => s.id !== id) });
  if (useSettings.getState().lastCareer === id) useSettings.getState().update({ lastCareer: null });
}

export async function newCareer(input: CreationInput): Promise<void> {
  set({ busy: { kind: 'create' }, error: null });
  await frame();
  try {
    const state = createCareer(contentIndex(), input);
    useSettings.getState().update({ lastCareer: state.meta.saveId });
    bump({ state, busy: null, outcomes: {}, feedMark: 0 });
    await save();
  } catch (e) {
    set({
      busy: null,
      error: { kind: 'engine', message: e instanceof Error ? e.message : String(e) },
    });
  }
}

// ------------------------------------------------------------------ the turn

/** Warning for injuries and eligibility, success for milestones and draft news (§10.4). */
function feelNews(state: GameState, from: number): void {
  const fresh = state.career.feed.slice(from);
  if (fresh.some((f) => f.kind === 'injury' || f.message.key === 'feed.ineligible'))
    haptic('warning');
  else if (fresh.some((f) => f.kind === 'milestone' || f.kind === 'draft')) haptic('success');
}

export function pendingInterrupt(state: GameState | null): Interrupt | null {
  return state?.career.pending[0] ?? null;
}

/**
 * Plays on until something needs the user or the week ends. Used by "Next week" and to carry
 * on after a decision in the middle of a week.
 */
export async function playOn(): Promise<void> {
  const state = get().state;
  if (!state || get().busy || state.career.ending) return;
  if (state.career.pending.length > 0) return;
  const startingWeek = state.career.cursor.stage === 'idle';
  set({
    busy: { kind: 'week' },
    error: null,
    ...(startingWeek ? { feedMark: state.career.feed.length } : {}),
  });
  await frame();
  try {
    const mark = state.career.feed.length;
    await runWeek(state, null);
    feelNews(state, mark);
    bump({ busy: null });
    await save();
  } catch (e) {
    bump({
      busy: null,
      error: { kind: 'engine', message: e instanceof Error ? e.message : String(e) },
    });
  }
}

/** Simulate ahead, one week per frame so progress shows, with the stops of §4.4. */
export async function playAhead(maxWeeks = 12): Promise<void> {
  const state = get().state;
  if (!state || get().busy || state.career.ending) return;
  if (state.career.pending.length > 0) return;
  set({
    busy: { kind: 'ahead', weeks: 0, of: maxWeeks },
    error: null,
    feedMark: state.career.feed.length,
  });
  const stopAtEveryMoment = useSettings.getState().stopAtEveryMoment;
  try {
    for (let weeks = 0; weeks < maxWeeks;) {
      await frame();
      const mark = state.career.feed.length;
      const r = await runWeek(state, { stopAtEveryMoment });
      feelNews(state, mark);
      if (r !== 'weekDone') break;
      weeks += 1;
      bump({ busy: { kind: 'ahead', weeks, of: maxWeeks } });
      if (state.career.feed.slice(mark).some((f) => NOTABLE.has(f.kind))) break;
    }
    bump({ busy: null });
    await save();
  } catch (e) {
    bump({
      busy: null,
      error: { kind: 'engine', message: e instanceof Error ? e.message : String(e) },
    });
  }
}

export type LiveStep = 'gameStart' | 'gameEnd' | 'interrupt' | 'ended' | 'busy';

/**
 * Plays on to his next tip-off: league games, the rest of the week, quiet weeks, stopping for
 * any decision on the way. The game itself is then played by `playLive`.
 */
export async function toNextGame(maxWeeks = 30): Promise<LiveStep> {
  const state = get().state;
  if (!state || get().busy) return 'busy';
  if (state.career.ending) return 'ended';
  if (state.career.pending.length > 0) return 'interrupt';
  if (state.career.cursor.live) return 'gameStart';
  set({ busy: { kind: 'week' }, error: null, feedMark: state.career.feed.length });
  await frame();
  try {
    const mark = state.career.feed.length;
    let weeks = 0;
    for (let guard = 0; guard < 20000; guard++) {
      const step = timed('lastEngineMs', () =>
        advanceSlice(state, contentIndex(), SLOTS_PER_FRAME, { gameStart: true }),
      );
      if (step.kind === 'yield') {
        await frame();
        continue;
      }
      if (step.kind === 'gameEnd') continue;
      if (step.kind === 'weekDone') {
        weeks += 1;
        if (weeks >= maxWeeks) break;
        continue;
      }
      feelNews(state, mark);
      bump({ busy: null });
      void save();
      return step.kind;
    }
    bump({ busy: null });
    void save();
    return 'interrupt';
  } catch (e) {
    bump({
      busy: null,
      error: { kind: 'engine', message: e instanceof Error ? e.message : String(e) },
    });
    return 'busy';
  }
}

/** Plays his game on to the next key moment or the final buzzer. */
export function playLive(): LiveStep {
  const state = get().state;
  if (!state) return 'busy';
  if (state.career.pending.length > 0) return 'interrupt';
  if (!state.career.cursor.live) return 'gameEnd';
  const mark = state.career.feed.length;
  try {
    for (let guard = 0; guard < 50; guard++) {
      const step = advanceSlice(state, contentIndex(), Infinity, { gameEnd: true });
      if (step.kind === 'yield' || step.kind === 'gameStart') continue;
      feelNews(state, mark);
      bump();
      void save();
      if (step.kind === 'gameEnd') return 'gameEnd';
      if (step.kind === 'ended') return 'ended';
      if (step.kind === 'interrupt') return 'interrupt';
      return 'gameEnd';
    }
    return 'gameEnd';
  } catch (e) {
    bump({ error: { kind: 'engine', message: e instanceof Error ? e.message : String(e) } });
    return 'busy';
  }
}

/** Sets how he means to play the next game. */
export function setApproach(approach: GameState['career']['approach']): void {
  mutate((s) => {
    s.career.approach = approach;
  });
}

/** Spends points on one skill; returns false if he cannot afford it. */
export function upgrade(skill: Skill): boolean {
  const state = requireState();
  const ok = upgradeSkill(state, skill);
  if (ok) {
    haptic('success');
    bump();
    void save();
  }
  return ok;
}

/** Answers a pending interrupt. Returns the engine's outcome (moment result, event changes). */
export function choose(interruptId: string, choice: Choice): unknown {
  const state = requireState();
  const outcome = resolve(state, contentIndex(), interruptId, choice);
  bump({ outcomes: { ...get().outcomes, [interruptId]: outcome } });
  void save();
  return outcome;
}

/** Runs a God Mode or other direct edit on the state, then saves. */
export function mutate(fn: (state: GameState, index: ContentIndex) => void): void {
  const state = requireState();
  fn(state, contentIndex());
  bump();
  void save();
}

export function setPlan(plan: GameState['career']['plan']): void {
  mutate((s) => {
    s.career.plan = plan;
  });
}

export function dismissError(): void {
  set({ error: null });
}
