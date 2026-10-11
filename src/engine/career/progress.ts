import { ageAt, collegePhase, WEEK, weekIndex } from '../core/calendar';
import { clamp } from '../core/math';
import { createRng } from '../core/rng';
import type { ContentIndex } from '../content/registry';
import type { Role } from '../game/prepare';
import { overallOf } from '../game/ratings';
import { PLAN_BLOCKS, type WeekPlan } from '../model/career';
import { isPlayer } from '../model/person';
import { SKILLS } from '../model/skills';
import { eligibleProspects, rankProspects } from '../draft/scouting';
import { grow } from '../player/growth';
import { changeStatus } from './effects';
import { cause, msg, pushFeed, pushTimeline, userOf, userTeamId, type GameState } from './state';
import { mergeTraits } from './traits';

export const ENERGY_PER_BLOCK = {
  train: -5,
  rest: 9,
  film: -2,
  bonding: -1,
  study: -2,
  media: -2,
} as const;
const BASE_RECOVERY = 20;

export function planBlocks(plan: WeekPlan): number {
  return (
    Object.values(plan.train).reduce((s, v) => s + v, 0) +
    plan.rest +
    plan.film +
    plan.bonding +
    plan.study +
    plan.media
  );
}

export function validPlan(plan: WeekPlan): boolean {
  const all = [
    ...Object.values(plan.train),
    plan.rest,
    plan.film,
    plan.bonding,
    plan.study,
    plan.media,
  ];
  return all.every((v) => Number.isInteger(v) && v >= 0) && planBlocks(plan) <= PLAN_BLOCKS;
}

/** Energy change the plan alone will cause this week (before games). */
export function planEnergy(plan: WeekPlan): number {
  const train = Object.values(plan.train).reduce((s, v) => s + v, 0);
  return (
    BASE_RECOVERY +
    train * ENERGY_PER_BLOCK.train +
    plan.rest * ENERGY_PER_BLOCK.rest +
    plan.film * ENERGY_PER_BLOCK.film +
    plan.bonding * ENERGY_PER_BLOCK.bonding +
    plan.study * ENERGY_PER_BLOCK.study +
    plan.media * ENERGY_PER_BLOCK.media
  );
}

function inClasses(week: number): boolean {
  return (
    (week >= WEEK.classesStart && week <= WEEK.fallGrades) ||
    (week >= 1 && week <= WEEK.springGrades)
  );
}

/** The week's plan takes effect: training, rest, study, team time and media work. */
export function applyPlan(state: GameState, index: ContentIndex): void {
  const career = state.career;
  const user = userOf(state);
  const plan = career.plan;
  const traits = mergeTraits(index, user);
  const teamId = userTeamId(state);
  const team = teamId ? state.world.teams[teamId] : undefined;
  const coach = team?.coachId ? state.world.people[team.coachId] : undefined;
  const fatigue = clamp((40 - user.energy) / 40, 0, 1);
  const minutes =
    career.recent.filter((g) => weekIndex(g.date) === weekIndex(state.world.date)).length * 28;

  const before = { ...user.skills };
  user.skills = grow({
    skills: user.skills,
    ceiling: user.ceiling,
    age: ageAt(user.birthYear, state.world.date),
    train: plan.train,
    film: plan.film,
    gameMinutes: minutes,
    coachDevelopment: coach?.kind === 'coach' ? coach.development : 50,
    growthRate: user.growthRate,
    traitGrowth: traits.growth,
    traitSkill: traits.growthSkill,
    fatigue,
    weeks: 1,
  });
  // Report a skill only when its displayed (whole) value changes.
  for (const skill of SKILLS) {
    if (Math.floor(user.skills[skill]) > Math.floor(before[skill])) {
      pushFeed(
        state,
        'development',
        msg('feed.skillUp', { skill, value: Math.floor(user.skills[skill]) }),
        { data: { from: Math.floor(before[skill]), to: Math.floor(user.skills[skill]) } },
      );
    }
  }

  changeStatus(state, index, 'energy', planEnergy(plan));
  if (!user.injury) changeStatus(state, index, 'health', 4 + plan.rest);
  if (plan.film > 0) {
    changeStatus(state, index, 'coachTrust', plan.film * 0.4);
    if (
      career.form === 'slump' &&
      createRng(state.world.seed, 'film', weekIndex(state.world.date)).chance(0.15 * plan.film)
    ) {
      career.form = null;
      pushTimeline(state, msg('timeline.filmBrokeSlump'), cause(state, 'plan', 'film'), false);
    }
  }
  if (plan.bonding > 0) {
    changeStatus(state, index, 'chemistry', plan.bonding * 1.2);
    career.relations.teammates = clamp(career.relations.teammates + plan.bonding * 1.2, 0, 100);
  }
  const trained = Object.values(plan.train).reduce((s, v) => s + v, 0);
  if (trained >= 6 && (career.role === 'bench' || career.role === 'rotation'))
    changeStatus(state, index, 'coachTrust', 0.5);
  if (plan.media > 0) {
    const pay = Math.round(plan.media * (60 + career.reputation * career.reputation * 0.6));
    changeStatus(state, index, 'money', pay);
    changeStatus(state, index, 'reputation', plan.media * 0.5);
    if (plan.media > 2) changeStatus(state, index, 'coachTrust', -(plan.media - 2) * 0.8);
  }
  for (const deal of career.deals) {
    if (deal.endsWeek >= weekIndex(state.world.date))
      changeStatus(state, index, 'money', deal.weekly);
  }
  career.deals = career.deals.filter((d) => d.endsWeek >= weekIndex(state.world.date));
  career.feats.filmBlocks += plan.film;
  career.feats.studyBlocks += plan.study;
  career.feats.restBlocks += plan.rest;
  career.feats.bondingBlocks += plan.bonding;
  career.feats.mediaBlocks += plan.media;

  if (
    (career.stage === 'college' || career.stage === 'highSchool') &&
    inClasses(state.world.date.week)
  ) {
    const demand = team?.kind === 'college' ? (team.academics - 50) / 200 : 0;
    const roadWeeks =
      collegePhase(state.world.date.week) === 'nonConference' ||
      collegePhase(state.world.date.week) === 'conference'
        ? 0.1
        : 0;
    const target = clamp(1.85 + plan.study * 0.4 * traits.grades - demand - roadWeeks, 0, 4);
    career.gpa = Math.round(clamp(career.gpa + (target - career.gpa) * 0.2, 0, 4) * 100) / 100;
  }
  for (const key of ['coach', 'teammates', 'journalist', 'fans'] as const) {
    career.relations[key] = clamp(
      career.relations[key] + (50 - career.relations[key]) * 0.01,
      0,
      100,
    );
  }
}

/** Semester grade checks; below 2.0 means sitting out until the next check. */
export function gradeCheck(state: GameState): void {
  const week = state.world.date.week;
  const career = state.career;
  if (career.stage !== 'college' || (week !== WEEK.fallGrades && week !== WEEK.springGrades))
    return;
  const was = career.ineligible;
  career.ineligible = career.gpa < 2;
  const why = cause(state, 'plan', 'study');
  if (career.ineligible && !was) {
    pushTimeline(state, msg('timeline.ineligible', { gpa: career.gpa }), why, true);
    pushFeed(state, 'news', msg('feed.ineligible', { gpa: career.gpa }));
  } else if (!career.ineligible && was) {
    pushTimeline(state, msg('timeline.eligibleAgain', { gpa: career.gpa }), why, true);
    pushFeed(state, 'news', msg('feed.eligibleAgain', { gpa: career.gpa }));
  } else {
    pushFeed(state, 'news', msg('feed.grades', { gpa: career.gpa }));
  }
}

const ROLE_ORDER: Role[] = ['bench', 'rotation', 'starter', 'star'];

/** The coach's view: where his ability ranks on the roster, bent by how much he trusts him. */
export function computeRole(state: GameState): Role {
  const user = userOf(state);
  const teamId = userTeamId(state);
  const team = teamId ? state.world.teams[teamId] : undefined;
  if (!team) return state.career.role;
  const mine = overallOf(user.skills, user.position, user.heightCm);
  const others = team.roster
    .filter((id) => id !== user.id)
    .map((id) => state.world.people[id])
    .filter(isPlayer)
    .map((p) => overallOf(p.skills, p.position, p.heightCm))
    .sort((a, b) => b - a);
  const rank = others.filter((o) => o > mine).length;
  const gapToBest = mine - (others[0] ?? 0);
  let level = rank === 0 && gapToBest >= 1.5 ? 3 : rank < 5 ? 2 : rank < 8 ? 1 : 0;
  const trust = state.career.coachTrust;
  if (trust >= 72) level += 1;
  if (trust <= 32) level -= 1;
  if (level === 3 && rank > 1) level = 2;
  return ROLE_ORDER[clamp(level, 0, 3)] ?? 'bench';
}

export function updateRole(state: GameState): void {
  const before = state.career.role;
  const after = computeRole(state);
  if (after === before) return;
  state.career.role = after;
  const up = ROLE_ORDER.indexOf(after) > ROLE_ORDER.indexOf(before);
  pushFeed(state, 'news', msg(up ? 'feed.rolePromoted' : 'feed.roleDemoted', { role: after }));
  pushTimeline(
    state,
    msg(up ? 'timeline.rolePromoted' : 'timeline.roleDemoted', { role: after }),
    cause(state, 'game', 'role'),
    true,
  );
}

/** Earned traits unlock when their feat counters reach the threshold. */
export function checkTraitUnlocks(state: GameState, index: ContentIndex): void {
  const user = userOf(state);
  for (const t of index.content.traits) {
    if (!t.unlock || user.traits.includes(t.id)) continue;
    if (t.excludes?.some((x) => user.traits.includes(x))) continue;
    if (state.career.feats[t.unlock.feat] >= t.unlock.count) {
      user.traits.push(t.id);
      pushTimeline(
        state,
        msg('timeline.traitEarned', { trait: t.id }),
        cause(state, 'game', t.unlock.feat),
        true,
      );
      pushFeed(state, 'milestone', msg('feed.traitEarned', { trait: t.id }));
    }
  }
}

/** Where scouts have him: rank among all draft-eligible players and a projected pick range. */
export function updateProjection(state: GameState): void {
  const user = userOf(state);
  const career = state.career;
  if (career.stage !== 'college' && career.stage !== 'prospect') return;
  const adjustments = { [user.id]: career.stock };
  const candidates = eligibleProspects(state.world);
  if (!candidates.some((p) => p.id === user.id)) candidates.push(user);
  const ranked = rankProspects(state.world, candidates, adjustments);
  // Only about 55% of the top prospects actually enter a given draft.
  const position = ranked.findIndex((v) => v.playerId === user.id);
  const view = ranked[position];
  if (position < 0 || !view) return;
  const draftRank = Math.round(position * 0.55) + 1;
  const spread = Math.round(2 + view.uncertainty * 1.2 + draftRank * 0.18);
  career.draft.projected = [clamp(draftRank - spread, 1, 61), clamp(draftRank + spread, 1, 61)];
  career.draft.history.push({ date: state.world.date, rank: draftRank });
  if (career.draft.history.length > 160) career.draft.history.shift();
}
