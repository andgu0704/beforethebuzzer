/**
 * The weekly turn as a resumable state machine. `advance` runs until something needs the
 * user (a key moment, an event card, a decision) or the week is over; `resolve` answers it.
 * The state can be saved and reloaded at any point between calls.
 */

import { seasonOf, WEEK, weekIndex } from '../core/calendar';
import type { GameId, PersonId, TeamId, TournamentId } from '../core/ids';
import type { ContentIndex } from '../content/registry';
import type { Interrupt } from '../model/career';
import { isPlayer } from '../model/person';
import { beginLeagueWeek, endLeagueWeek, playNextSlot, type LeagueContext } from '../season/league';
import { gamesInWeek } from '../world/game-index';
import {
  enterDraftPool,
  raiseDraftDecision,
  raiseDraftNight,
  raiseWithdraw,
  raiseWorkouts,
  resolveAfterDraft,
  resolveAgent,
  resolveDraftDecision,
  resolveWithdraw,
  resolveWorkouts,
  runDraftNight,
} from './draft-path';
import { maybeRaiseEvent, resolveEvent, runConsequences } from './events';
import { continueUserGame, isUserGame, resolveKeyMoment, startUserGame } from './game';
import { raiseCallUps, resolveCallUp } from './national';
import {
  applyPlan,
  checkTraitUnlocks,
  fadeStock,
  gradeCheck,
  quietWeekReaction,
  updateProjection,
  updateRole,
} from './progress';
import { announceAwards, proSummer, proWeek, resolveContract, resolveRetire } from './pro';
import { clearShowcase, commitTo, raiseOffers } from './recruiting';
import { socialReactions } from './social';
import { msg, pushFeed, userTeamId, type GameState } from './state';

export type StepResult =
  | { readonly kind: 'interrupt'; readonly interrupt: Interrupt }
  | { readonly kind: 'weekDone' }
  | { readonly kind: 'ended' };

/** Where a sliced advance may also hand back control: at his tip-off, and at his final buzzer. */
export interface Stops {
  readonly gameStart?: boolean;
  readonly gameEnd?: boolean;
}

export type SliceResult =
  | StepResult
  | { readonly kind: 'yield' }
  | { readonly kind: 'gameStart'; readonly gameId: GameId }
  | { readonly kind: 'gameEnd'; readonly gameId: GameId };

function leagueContext(state: GameState, index: ContentIndex): LeagueContext {
  const career = state.career;
  return {
    index,
    userId: career.playerId,
    userCollege: career.committedTo,
    stock: { [career.playerId]: career.stock },
    nationalExclude: new Set<PersonId>(),
    userDraftNight: career.draft.declared,
  };
}

/** Teams whose box scores the career keeps: his own and his rival's. */
function watchedTeams(state: GameState): Set<TeamId> {
  const out = new Set<TeamId>();
  const own = userTeamId(state);
  if (own) out.add(own);
  const rival = state.career.rivalId ? state.world.people[state.career.rivalId] : undefined;
  if (isPlayer(rival) && (rival.affiliation.kind === 'college' || rival.affiliation.kind === 'pro'))
    out.add(rival.affiliation.teamId);
  return out;
}

export function advance(state: GameState, index: ContentIndex): StepResult {
  const step = advanceSlice(state, index, Infinity);
  if (step.kind === 'yield' || step.kind === 'gameStart' || step.kind === 'gameEnd')
    throw new Error('an unbounded advance cannot yield');
  return step;
}

/**
 * Like `advance`, but hands control back after `slots` game slots (and after the week's
 * opening), so an app can paint between slices of a heavy week. Call it again to carry on; the
 * result is the same as one `advance`.
 */
export function advanceSlice(
  state: GameState,
  index: ContentIndex,
  slots: number,
  stops: Stops = {},
): SliceResult {
  const career = state.career;
  let budget = slots;
  for (let guard = 0; guard < 500; guard++) {
    if (career.ending) return { kind: 'ended' };
    const pending = career.pending[0];
    if (pending) return { kind: 'interrupt', interrupt: pending };
    const cursor = career.cursor;
    switch (cursor.stage) {
      case 'idle':
        beginWeek(state, index);
        cursor.stage = 'games';
        if (Number.isFinite(budget)) return { kind: 'yield' };
        break;
      case 'games': {
        if (cursor.live) {
          const gameId = cursor.live.gameId;
          const moment = continueUserGame(state, index);
          if (moment) return { kind: 'interrupt', interrupt: moment };
          if (stops.gameEnd) return { kind: 'gameEnd', gameId };
          break;
        }
        const step = playNextSlot(state.world, (g) => isUserGame(state, g), watchedTeams(state));
        if (!step) {
          cursor.stage = 'events';
          break;
        }
        const mine = step.held[0];
        if (mine) {
          startUserGame(state, index, mine);
          if (stops.gameStart) return { kind: 'gameStart', gameId: mine.id };
        }
        budget -= 1;
        if (budget <= 0) return { kind: 'yield' };
        break;
      }
      case 'events':
        runConsequences(state, index);
        maybeRaiseEvent(state, index);
        cursor.stage = 'wrap';
        break;
      case 'wrap':
        endWeek(state, index);
        cursor.stage = 'idle';
        return { kind: 'weekDone' };
    }
  }
  throw new Error('the turn did not settle');
}

function beginWeek(state: GameState, index: ContentIndex): void {
  const career = state.career;
  const week = state.world.date.week;
  const ctx = leagueContext(state, index);
  const tournamentsBefore = new Set(Object.keys(state.world.tournaments));
  const wasHighSchool = career.stage === 'highSchool';
  beginLeagueWeek(state.world, ctx);

  if (week === WEEK.summerStart) fadeStock(state);
  if (week === WEEK.summerStart && wasHighSchool && career.committedTo) {
    career.stage = 'college';
    career.coachTrust = 45;
    updateRole(state);
    pushFeed(
      state,
      'milestone',
      msg('feed.arrivedOnCampus', { team: { team: career.committedTo } }),
    );
  }
  if (week === WEEK.recruitingStart + 2 && career.stage === 'highSchool' && !career.committedTo)
    raiseOffers(state);
  if (week === WEEK.recruitingStart + 1) clearShowcase(state.world);
  if (week === WEEK.declareDeadline - 2) raiseDraftDecision(state);
  if (week === WEEK.proPlayoffsStart) enterDraftPool(state, index);
  if (week === WEEK.withdrawDeadline) {
    raiseWithdraw(state);
    raiseWorkouts(state);
  }
  if (week === WEEK.draft) raiseDraftNight(state);
  if (week === WEEK.u20Start || week === WEEK.seniorTournamentStart) {
    const created = Object.keys(state.world.tournaments).filter(
      (id) => !tournamentsBefore.has(id),
    ) as TournamentId[];
    raiseCallUps(state, created);
  }
  proSummer(state);
  if (career.stage === 'college' || career.stage === 'pro') updateRole(state);
}

function endWeek(state: GameState, index: ContentIndex): void {
  applyPlan(state, index);
  gradeCheck(state);
  checkTraitUnlocks(state, index);
  if (state.career.stage === 'college' || state.career.stage === 'prospect')
    updateProjection(state, index);
  rivalNews(state, index);
  quietWeekReaction(state, index);
  proWeek(state, index);
  const season = seasonOf(state.world.date);
  endLeagueWeek(state.world, leagueContext(state, index));
  announceAwards(state, index, season);
}

/** Now and then the rival's big night reaches the user's phone. */
function rivalNews(state: GameState, index: ContentIndex): void {
  const rivalId = state.career.rivalId;
  if (!rivalId) return;
  for (const g of gamesInWeek(state.world, weekIndex(state.world.date))) {
    if (!g.result?.box) continue;
    const line = [...g.result.box.home.players, ...g.result.box.away.players].find(
      (l) => l.id === rivalId,
    );
    if (line && line.pts >= 25) {
      pushFeed(
        state,
        'news',
        msg('feed.rivalBigGame', { rival: { person: rivalId }, pts: line.pts }),
      );
      socialReactions(state, index, ['rivalBigGame'], `rival-${g.id}`, 1);
      return;
    }
  }
}

export type Choice = string | readonly string[];

/** Answers the pending interrupt with `choice`. */
export function resolve(
  state: GameState,
  index: ContentIndex,
  interruptId: string,
  choice: Choice,
  extra: { readonly timing?: number } = {},
): unknown {
  const career = state.career;
  const interrupt = career.pending.find((p) => p.id === interruptId);
  if (!interrupt) throw new Error(`no pending interrupt ${interruptId}`);
  const one = typeof choice === 'string' ? choice : (choice[0] ?? '');
  const done = () => (career.pending = career.pending.filter((p) => p.id !== interruptId));
  switch (interrupt.kind) {
    case 'keyMoment':
      return resolveKeyMoment(state, index, interrupt, one, extra.timing);
    case 'event': {
      const outcome = resolveEvent(state, index, interrupt, one);
      done();
      return outcome;
    }
    case 'offers':
      commitTo(state, index, one as TeamId);
      done();
      return null;
    case 'callUp':
      resolveCallUp(state, index, interrupt.tournamentId, interrupt.level, one === 'accept');
      done();
      return null;
    case 'draftDecision':
      if (!interrupt.options.includes(one as 'declare')) throw new Error('invalid draft decision');
      resolveDraftDecision(state, index, one as 'declare' | 'testWaters' | 'stay');
      done();
      return null;
    case 'withdraw':
      resolveWithdraw(state, index, one === 'return' ? 'return' : 'stay');
      done();
      return null;
    case 'workouts': {
      const picked = (typeof choice === 'string' ? [choice] : [...choice])
        .filter((t) => interrupt.teams.includes(t as TeamId))
        .slice(0, interrupt.max) as TeamId[];
      resolveWorkouts(state, index, picked);
      done();
      return null;
    }
    case 'agent':
      resolveAgent(state, one === 'none' ? 'none' : (one as PersonId));
      done();
      return null;
    case 'draftNight':
      done();
      runDraftNight(state, index, career.godMode.draftTeam);
      return null;
    case 'afterDraft': {
      if (!interrupt.options.includes(one as 'tryout'))
        throw new Error('invalid after-draft choice');
      done();
      resolveAfterDraft(state, index, one as 'returnToSchool' | 'tryout' | 'endCareer');
      return null;
    }
    case 'contract':
      done();
      resolveContract(state, index, interrupt, one);
      return null;
    case 'retire':
      done();
      resolveRetire(state, one);
      return null;
  }
}

export function currentSeason(state: GameState): number {
  return seasonOf(state.world.date);
}
