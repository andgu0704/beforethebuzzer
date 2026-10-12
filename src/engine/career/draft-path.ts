import { ageAt, weekIndex } from '../core/calendar';
import { asInterruptId, nextId, type PersonId, type TeamId } from '../core/ids';
import { clamp } from '../core/math';
import { createRng } from '../core/rng';
import type { ContentIndex } from '../content/registry';
import { makePick, signDraftee, updateBoard } from '../draft/draft';
import { isPlayer, type Agent } from '../model/person';
import { generateAgent } from '../world/staff';
import { applyEffects } from './effects';
import { socialReactions } from './social';
import { cause, msg, pushFeed, pushTimeline, teamRef, userOf, type GameState } from './state';
import { foldName } from '../content/registry';

function newInterruptId(state: GameState) {
  return asInterruptId(nextId(state.world.counters, 'interrupt', 'i'));
}

/** After the season: eligible underclassmen choose; seniors are in automatically. */
export function raiseDraftDecision(state: GameState): void {
  const user = userOf(state);
  const career = state.career;
  if (career.stage !== 'college' || user.affiliation.kind !== 'college') return;
  if (ageAt(user.birthYear, state.world.date) < 19) return;
  if (user.affiliation.classYear === 4) {
    career.draft.declared = true;
    career.stage = 'prospect';
    pushFeed(state, 'draft', msg('feed.seniorEntersDraft'));
    pushTimeline(state, msg('timeline.declared'), cause(state, 'event', 'draft', 'senior'), true);
    return;
  }
  state.career.pending.push({
    id: newInterruptId(state),
    kind: 'draftDecision',
    options: ['declare', 'testWaters', 'stay'],
  });
}

export function resolveDraftDecision(
  state: GameState,
  index: ContentIndex,
  choice: 'declare' | 'testWaters' | 'stay',
): void {
  const career = state.career;
  const why = cause(state, 'event', 'draftDecision', choice);
  if (choice === 'stay') {
    pushTimeline(state, msg('timeline.stayedInSchool'), why, true);
    pushFeed(state, 'draft', msg('feed.stayedInSchool'));
    return;
  }
  career.draft.declared = true;
  career.draft.testingWaters = choice === 'testWaters';
  if (choice === 'declare') career.stage = 'prospect';
  pushTimeline(
    state,
    msg(choice === 'declare' ? 'timeline.declared' : 'timeline.testingWaters'),
    why,
    true,
  );
  pushFeed(state, 'draft', msg(choice === 'declare' ? 'feed.declared' : 'feed.testingWaters'));
  socialReactions(state, index, ['declare'], `declare-${weekIndex(state.world.date)}`, 2);
}

/** Puts a declared user into the pool once the draft opens, and lines up agents if he has gone all in. */
export function enterDraftPool(state: GameState, index: ContentIndex): void {
  const career = state.career;
  const draft = state.world.draft;
  if (!draft || !career.draft.declared) return;
  if (!draft.pool.includes(career.playerId)) draft.pool.push(career.playerId);
  updateBoard(state.world, { [career.playerId]: career.stock });
  if (!career.draft.testingWaters && !career.agentId) raiseAgentChoice(state, index);
}

export function raiseAgentChoice(state: GameState, index: ContentIndex): void {
  const career = state.career;
  const [best] = career.draft.projected;
  const rng = createRng(state.world.seed, 'agents', career.playerId);
  const agents = Object.values(state.world.people).filter((p): p is Agent => p.kind === 'agent');
  // Better prospects attract better agents.
  const ceiling = clamp(100 - best * 1.1, 35, 98);
  let offers = rng.shuffle(agents.filter((a) => a.quality <= ceiling + 5)).slice(0, 3);
  if (offers.length < 2) {
    const usa = index.nation.get('USA');
    if (usa) {
      const taken = new Set(
        Object.values(state.world.people).map((p) => foldName(`${p.given} ${p.family}`)),
      );
      for (let i = offers.length; i < 3; i++) {
        const a = generateAgent(
          { rng, index, world: state.world, taken },
          usa,
          clamp(Math.round(ceiling - 10 * i), 15, 95),
        );
        state.world.people[a.id] = a;
        offers = [...offers, a];
      }
    }
  }
  career.agentOffers = offers.map((a) => a.id);
  career.pending.push({ id: newInterruptId(state), kind: 'agent', agents: career.agentOffers });
}

export function resolveAgent(state: GameState, agentId: PersonId | 'none'): void {
  const career = state.career;
  if (agentId === 'none') return;
  if (!career.agentOffers.includes(agentId)) throw new Error('no such agent offer');
  career.agentId = agentId;
  career.relations.agent = 60;
  const agent = state.world.people[agentId];
  if (agent?.kind === 'agent') career.stock += (agent.quality - 50) / 40;
  pushTimeline(
    state,
    msg('timeline.signedAgent', { agent: { person: agentId } }),
    cause(state, 'event', 'agent', agentId),
    true,
  );
  pushFeed(state, 'draft', msg('feed.signedAgent', { agent: { person: agentId } }));
}

export function raiseWithdraw(state: GameState): void {
  if (state.career.draft.testingWaters)
    state.career.pending.push({ id: newInterruptId(state), kind: 'withdraw' });
}

export function resolveWithdraw(
  state: GameState,
  index: ContentIndex,
  choice: 'stay' | 'return',
): void {
  const career = state.career;
  const why = cause(state, 'event', 'withdraw', choice);
  career.draft.testingWaters = false;
  if (choice === 'return') {
    career.draft.declared = false;
    career.stage = 'college';
    const draft = state.world.draft;
    if (draft) draft.pool = draft.pool.filter((id) => id !== career.playerId);
    pushTimeline(state, msg('timeline.withdrew'), why, true);
    pushFeed(state, 'draft', msg('feed.withdrew'));
  } else {
    career.stage = 'prospect';
    pushTimeline(state, msg('timeline.stayedInDraft'), why, true);
    pushFeed(state, 'draft', msg('feed.stayedInDraft'));
    if (!career.agentId) raiseAgentChoice(state, index);
  }
}

/** Teams picking around his projected range invite him to work out. */
export function raiseWorkouts(state: GameState): void {
  const draft = state.world.draft;
  const career = state.career;
  if (!draft || !career.draft.declared || draft.picks.length === 0) return;
  const [best, worst] = career.draft.projected;
  const lo = clamp(best - 4, 1, 60);
  const hi = clamp(worst + 6, 1, 60);
  const teams = [
    ...new Set(draft.picks.filter((p) => p.pick >= lo && p.pick <= hi).map((p) => p.teamId)),
  ].slice(0, 9);
  if (teams.length === 0) return;
  career.pending.push({
    id: newInterruptId(state),
    kind: 'workouts',
    teams,
    max: Math.min(6, teams.length),
  });
}

export function resolveWorkouts(
  state: GameState,
  index: ContentIndex,
  teams: readonly TeamId[],
): void {
  const career = state.career;
  const user = userOf(state);
  const rng = createRng(state.world.seed, 'workouts', career.playerId);
  for (const teamId of teams) {
    // A workout is a test: skills and form decide whether it raises or lowers interest.
    const shine =
      (user.skills.shooting + user.skills.athleticism + user.skills.gameSense) / 3 +
      user.confidence / 5 +
      rng.normal(0, 8);
    const delta = Math.round(clamp((shine - 55) / 2, -10, 18));
    career.draft.interest[teamId] = clamp((career.draft.interest[teamId] ?? 50) + delta, 0, 100);
    career.draft.workouts.push(teamId);
    pushFeed(
      state,
      'draft',
      msg(delta >= 0 ? 'feed.workoutGood' : 'feed.workoutBad', { team: teamRef(teamId) }),
    );
  }
  applyEffects(
    state,
    index,
    [{ kind: 'status', key: 'energy', delta: -4 * teams.length }],
    cause(state, 'event', 'workouts'),
    rng,
  );
}

export function raiseDraftNight(state: GameState): void {
  const draft = state.world.draft;
  if (draft?.pool.includes(state.career.playerId))
    state.career.pending.push({ id: newInterruptId(state), kind: 'draftNight' });
}

/** College seasons he could still play: none for a senior or anyone no longer on a college roster. */
export function seasonsLeft(state: GameState): number {
  const a = userOf(state).affiliation;
  return a.kind === 'college' ? 4 - a.classYear : 0;
}

function endUndrafted(state: GameState): void {
  state.career.stage = 'undrafted';
  state.career.ending = {
    reason: 'undrafted',
    date: state.world.date,
    pick: null,
    teamId: null,
  };
}

/**
 * After going undrafted with eligibility left: back to campus for another season (his agent
 * agreement ends and the draft profile starts again), or the career ends here.
 */
export function resolveAfterDraft(
  state: GameState,
  index: ContentIndex,
  choice: 'returnToSchool' | 'endCareer',
): void {
  const career = state.career;
  const why = cause(state, 'event', 'afterDraft', choice);
  if (choice === 'endCareer') {
    endUndrafted(state);
    pushTimeline(state, msg('timeline.endedAfterDraft'), why, true);
    return;
  }
  career.stage = 'college';
  career.draft.declared = false;
  career.draft.testingWaters = false;
  career.draft.workouts = [];
  career.draft.interest = {};
  const hadAgent = career.agentId !== null;
  career.agentId = null;
  career.agentOffers = [];
  const draft = state.world.draft;
  if (draft) draft.pool = draft.pool.filter((id) => id !== career.playerId);
  applyEffects(
    state,
    index,
    [
      { kind: 'status', key: 'confidence', delta: -3 },
      { kind: 'status', key: 'coachTrust', delta: 3 },
    ],
    why,
    createRng(state.world.seed, 'afterDraft', career.playerId),
  );
  pushTimeline(
    state,
    msg(hadAgent ? 'timeline.returnedLeftAgent' : 'timeline.returnedToSchool'),
    why,
    true,
  );
  pushFeed(state, 'milestone', msg('feed.returnedToSchool'));
}

/** Runs the whole draft with the user's interest and God Mode applied; ends the v1 career if he is picked. */
export function runDraftNight(
  state: GameState,
  index: ContentIndex,
  forcedTeam: TeamId | null,
): void {
  const draft = state.world.draft;
  const career = state.career;
  if (!draft) return;
  const user = userOf(state);
  const agent = career.agentId ? state.world.people[career.agentId] : undefined;
  const agentBoost = agent?.kind === 'agent' ? (agent.quality - 50) / 60 : 0;
  while (draft.next < draft.picks.length) {
    const pick = draft.picks[draft.next];
    if (!pick) break;
    const interest = career.draft.interest[pick.teamId] ?? 50;
    const adjustments = { [user.id]: career.stock + agentBoost + (interest - 50) * 0.06 };
    const userFree = !draft.picks.some((p) => p.playerId === user.id);
    const forced = forcedTeam === pick.teamId && userFree ? user.id : null;
    const made = makePick(state.world, forced, adjustments);
    if (made) signDraftee(state.world, made);
  }
  const mine = draft.picks.find((p) => p.playerId === user.id);
  const why = cause(state, 'event', 'draftNight');
  if (mine) {
    career.stage = 'drafted';
    career.ending = {
      reason: 'draft',
      date: state.world.date,
      pick: mine.pick,
      teamId: mine.teamId,
    };
    pushTimeline(
      state,
      msg('timeline.drafted', { pick: mine.pick, team: teamRef(mine.teamId) }),
      why,
      true,
    );
    pushFeed(state, 'draft', msg('feed.drafted', { pick: mine.pick, team: teamRef(mine.teamId) }));
    socialReactions(state, index, ['drafted'], 'drafted', 3);
  } else {
    pushTimeline(state, msg('timeline.undrafted'), why, true);
    pushFeed(state, 'draft', msg('feed.undrafted'));
    socialReactions(state, index, ['undrafted'], 'undrafted', 2);
    const left = seasonsLeft(state);
    if (left > 0)
      career.pending.push({
        id: newInterruptId(state),
        kind: 'afterDraft',
        options: ['returnToSchool', 'endCareer'],
        seasonsLeft: left,
      });
    else endUndrafted(state);
  }
  const rival = career.rivalId ? state.world.people[career.rivalId] : undefined;
  if (isPlayer(rival)) {
    const theirs = draft.picks.find((p) => p.playerId === rival.id);
    pushFeed(
      state,
      'draft',
      msg(
        theirs ? 'feed.rivalDrafted' : 'feed.rivalUndrafted',
        theirs
          ? { rival: { person: rival.id }, pick: theirs.pick, team: teamRef(theirs.teamId) }
          : { rival: { person: rival.id } },
      ),
    );
  }
}
