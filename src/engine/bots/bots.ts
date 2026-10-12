/**
 * Automated players for balance testing. Each plays the user's role with a different level of
 * skill, so the simulation script can measure what a first-time player and a strong player
 * achieve.
 */

import { WEEK, weekIndex } from '../core/calendar';
import type { TeamId } from '../core/ids';
import { createRng, type Rng } from '../core/rng';
import type { ContentIndex } from '../content/registry';
import { estimateOdds } from '../game/moments';
import type { Interrupt, Offer, WeekPlan } from '../model/career';
import { POSITION_WEIGHTS, SKILLS, type Skill } from '../model/skills';
import type { GameState } from '../career/state';
import { userOf } from '../career/state';
import { mergeTraits } from '../career/traits';
import type { Choice } from '../career/turn';
import { trainingEffect } from '../player/growth';
import { valueOf } from './evaluate';

export interface Bot {
  readonly name: 'naive' | 'casual' | 'expert';
  plan(state: GameState, index: ContentIndex): WeekPlan;
  choose(state: GameState, index: ContentIndex, interrupt: Interrupt): Choice;
}

function rngFor(state: GameState, label: string): Rng {
  return createRng(
    state.world.seed,
    'bot',
    label,
    state.world.date.year,
    state.world.date.week,
    state.career.pending.length,
  );
}

function inClasses(week: number): boolean {
  return (week >= WEEK.classesStart && week <= WEEK.fallGrades) || week <= WEEK.springGrades;
}

function prestigeOf(state: GameState, teamId: TeamId): number {
  const t = state.world.teams[teamId];
  return t?.kind === 'college' ? t.prestige : 0;
}

const ROLE_VALUE: Record<Offer['role'], number> = { bench: 0, rotation: 1.5, starter: 3, star: 4 };

// ---------------------------------------------------------------- naive

export const naive: Bot = {
  name: 'naive',
  plan(state) {
    const rng = rngFor(state, 'plan');
    const buckets = [
      'shooting',
      'playmaking',
      'handling',
      'defence',
      'rebounding',
      'athleticism',
      'gameSense',
      'rest',
      'film',
      'bonding',
      'study',
      'media',
    ] as const;
    const counts: Record<string, number> = {};
    for (let i = 0; i < 10; i++) {
      const b = rng.pick(buckets);
      counts[b] = (counts[b] ?? 0) + 1;
    }
    const train: Partial<Record<Skill, number>> = {};
    for (const s of SKILLS) if (counts[s]) train[s] = counts[s];
    return {
      train,
      rest: counts['rest'] ?? 0,
      film: counts['film'] ?? 0,
      bonding: counts['bonding'] ?? 0,
      study: counts['study'] ?? 0,
      media: counts['media'] ?? 0,
    };
  },
  choose(state, _index, i) {
    const rng = rngFor(state, `choose-${i.id}`);
    switch (i.kind) {
      case 'keyMoment':
        return rng.pick(i.options);
      case 'event':
        return rng.pick(i.choices);
      case 'offers':
        return i.offers[0]?.teamId ?? '';
      case 'callUp':
        return rng.chance(0.8) ? 'accept' : 'decline';
      case 'draftDecision':
        return 'declare';
      case 'withdraw':
        return 'stay';
      case 'workouts':
        return i.teams.slice(0, i.max);
      case 'agent':
        return rng.pick(i.agents);
      case 'draftNight':
        return 'go';
    }
  },
};

// ---------------------------------------------------------------- casual

export const casual: Bot = {
  name: 'casual',
  plan(state) {
    const studying = state.career.stage === 'college' || state.career.stage === 'highSchool';
    return {
      train: { shooting: 2, handling: 1, defence: 1, athleticism: 1 },
      rest: 2,
      film: 1,
      bonding: studying ? 0 : 1,
      study: studying ? 2 : 0,
      media: studying ? 0 : 1,
    };
  },
  choose(state, index, i) {
    const rng = rngFor(state, `choose-${i.id}`);
    switch (i.kind) {
      case 'keyMoment':
        return i.options[0] ?? '';
      case 'event': {
        const e = index.event.get(i.eventId);
        if (!e) return i.choices[0] ?? '';
        // Picks what looks good right now, with a bit of whim; does not see delayed consequences.
        const scored = i.choices.map((id) => ({
          id,
          v:
            valueOf(state, index, e.choices.find((c) => c.id === id)?.effects ?? [], false) +
            rng.normal(0, 3),
        }));
        return scored.sort((a, b) => b.v - a.v)[0]?.id ?? '';
      }
      case 'offers':
        return (
          [...i.offers].sort((a, b) => prestigeOf(state, b.teamId) - prestigeOf(state, a.teamId))[0]
            ?.teamId ?? ''
        );
      case 'callUp':
        return 'accept';
      case 'draftDecision': {
        // First-time players leave early once the projections look decent.
        const user = userOf(state);
        const year = user.affiliation.kind === 'college' ? user.affiliation.classYear : 4;
        return state.career.draft.projected[0] <= 30 || year >= 2 ? 'declare' : 'stay';
      }
      case 'withdraw':
        return 'stay';
      case 'workouts':
        return i.teams.slice(0, i.max);
      case 'agent':
        return i.agents[0] ?? 'none';
      case 'draftNight':
        return 'go';
    }
  },
};

// ---------------------------------------------------------------- expert

/** Weeks without a visible skill-up after which a trained skill looks like it has stalled. */
const STALL_WEEKS = 16;

/**
 * Skills that are not moving any more: no skill-up in the feed for a while. This is what a
 * player can see of his hidden ceilings, so the expert uses it instead of the ceilings.
 */
function stalledSkills(state: GameState): Set<Skill> {
  const now = weekIndex(state.world.date);
  const feed = state.career.feed;
  const first = feed[0];
  const out = new Set<Skill>();
  if (!first || now - weekIndex(first.date) < STALL_WEEKS) return out;
  const lastUp: Partial<Record<Skill, number>> = {};
  for (const f of feed) {
    const skill = f.message.key === 'feed.skillUp' ? f.message.params?.['skill'] : undefined;
    if (typeof skill === 'string') lastUp[skill as Skill] = weekIndex(f.date);
  }
  for (const s of SKILLS) if ((lastUp[s] ?? -Infinity) < now - STALL_WEEKS) out.add(s);
  return out;
}

/**
 * Training blocks go where they add the most to his overall rating, with diminishing returns
 * inside a week. Skills he has been working on that stopped improving give way to others.
 */
function expertTraining(
  state: GameState,
  index: ContentIndex,
  blocks: number,
): Partial<Record<Skill, number>> {
  const user = userOf(state);
  const traits = mergeTraits(index, user);
  const weights = POSITION_WEIGHTS[user.position];
  const allocate = (damp: (s: Skill) => number) => {
    const plan: Partial<Record<Skill, number>> = {};
    for (let b = 0; b < blocks; b++) {
      let best: Skill = 'shooting';
      let bestGain = -1;
      for (const s of SKILLS) {
        if (Math.floor(user.skills[s]) >= 99) continue;
        const current = plan[s] ?? 0;
        const marginal = trainingEffect(current + 1) - trainingEffect(current);
        const gain = weights[s] * marginal * (traits.growthSkill[s] ?? 1) * damp(s);
        if (gain > bestGain) {
          bestGain = gain;
          best = s;
        }
      }
      plan[best] = (plan[best] ?? 0) + 1;
    }
    return plan;
  };
  const usual = allocate(() => 1);
  const stalled = stalledSkills(state);
  return allocate((s) => (stalled.has(s) && (usual[s] ?? 0) > 0 ? 0.2 : 1));
}

/**
 * The projected pick worth leaving school for. Early on another year of growth and a fresh
 * season of form usually beat a mid-first-round slot, so only a top-ten projection is worth
 * going for; by his third year a first-round projection is, since a senior season adds age
 * and little room to grow.
 */
function leaveThreshold(state: GameState): number {
  const user = userOf(state);
  const year = user.affiliation.kind === 'college' ? user.affiliation.classYear : 4;
  return year <= 1 ? 6 : year === 2 ? 10 : 30;
}

function expectedPick(state: GameState): number {
  const [best, worst] = state.career.draft.projected;
  return (best + worst) / 2;
}

export const expert: Bot = {
  name: 'expert',
  plan(state, index) {
    const career = state.career;
    const user = userOf(state);
    const studying =
      (career.stage === 'college' || career.stage === 'highSchool') &&
      inClasses(state.world.date.week);
    const study = !studying ? 0 : career.gpa < 2.25 ? 3 : 2;
    const rest = user.energy < 50 ? 3 : user.energy < 72 ? 2 : 1;
    const film = career.form === 'slump' ? 2 : 1;
    const bonding = career.chemistry < 45 ? 1 : 0;
    const used = study + rest + film + bonding;
    return {
      train: expertTraining(state, index, Math.max(0, 10 - used)),
      rest,
      film,
      bonding,
      study,
      media: 0,
    };
  },
  choose(state, index, i) {
    switch (i.kind) {
      case 'keyMoment': {
        const live = state.career.cursor.live;
        const def = index.moment.get(i.momentId);
        if (!live || !def) return i.options[0] ?? '';
        const user = userOf(state);
        const t = mergeTraits(index, user);
        let best = i.options[0] ?? '';
        let bestValue = -Infinity;
        for (const id of i.options) {
          const option = def.options.find((o) => o.id === id);
          if (!option) continue;
          if (option.action.kind === 'pain') {
            if (!option.action.playThrough) return id;
            continue;
          }
          const odds = estimateOdds({
            live: live.live,
            def,
            option,
            offense: i.situation.offense,
            userSide: i.situation.userSide,
            edge: t.momentEdge[option.action.kind] ?? 0,
          });
          const margin =
            i.situation.score[i.situation.userSide] -
            i.situation.score[i.situation.userSide === 0 ? 1 : 0];
          const needThree = margin === -3;
          const points =
            option.action.kind === 'defend'
              ? 1
              : 'shotType' in option.action && option.action.shotType === 'three'
                ? 3
                : 2;
          const value = needThree
            ? points === 3
              ? odds
              : odds * 0.2
            : odds * (points === 3 ? 1.15 : 1);
          if (value > bestValue) {
            bestValue = value;
            best = id;
          }
        }
        return best;
      }
      case 'event': {
        const e = index.event.get(i.eventId);
        if (!e) return i.choices[0] ?? '';
        const scored = i.choices.map((id) => ({
          id,
          v: valueOf(state, index, e.choices.find((c) => c.id === id)?.effects ?? [], true),
        }));
        return scored.sort((a, b) => b.v - a.v)[0]?.id ?? '';
      }
      case 'offers': {
        const score = (o: Offer) => {
          const team = state.world.teams[o.teamId];
          const coach = team?.coachId ? state.world.people[team.coachId] : undefined;
          const dev = coach?.kind === 'coach' ? coach.development : 50;
          return ROLE_VALUE[o.role] * 10 + prestigeOf(state, o.teamId) * 0.15 + dev * 0.15;
        };
        return [...i.offers].sort((a, b) => score(b) - score(a))[0]?.teamId ?? '';
      }
      case 'callUp':
        return 'accept';
      case 'draftDecision': {
        const pick = expectedPick(state);
        const threshold = leaveThreshold(state);
        if (pick <= threshold) return 'declare';
        if (pick <= threshold * 1.6) return 'testWaters';
        return 'stay';
      }
      case 'withdraw':
        return expectedPick(state) <= leaveThreshold(state) ? 'stay' : 'return';
      case 'workouts':
        return i.teams.slice(0, i.max);
      case 'agent': {
        const best = [...i.agents].sort((a, b) => {
          const pa = state.world.people[a];
          const pb = state.world.people[b];
          return (pb?.kind === 'agent' ? pb.quality : 0) - (pa?.kind === 'agent' ? pa.quality : 0);
        })[0];
        return best ?? 'none';
      }
      case 'draftNight':
        return 'go';
    }
  },
};

export const BOTS = { naive, casual, expert } as const;

/** Blocks a plan uses; never more than the weekly ten. */
export function planSize(plan: WeekPlan): number {
  return (
    Object.values(plan.train).reduce((s, v) => s + v, 0) +
    plan.rest +
    plan.film +
    plan.bonding +
    plan.study +
    plan.media
  );
}
