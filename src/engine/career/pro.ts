/**
 * The pro career: from draft night (or a camp tryout) to retirement. The league already runs
 * pro seasons, playoffs, contracts and awards for everyone else; this layer gives the user his
 * own deals, his summer decisions and the news when he wins something.
 */

import { ageAt, seasonOf, WEEK } from '../core/calendar';
import { asContractId, asInterruptId, nextId, type TeamId } from '../core/ids';
import { clamp } from '../core/math';
import { createRng } from '../core/rng';
import type { ContentIndex } from '../content/registry';
import { endStint, leaveTeam } from '../draft/draft';
import type { Role } from '../game/prepare';
import { overallOf } from '../game/ratings';
import type { ContractOffer, Interrupt } from '../model/career';
import { isPlayer, type Player } from '../model/person';
import type { ProTeam } from '../model/team';
import type { Contract } from '../model/world';
import { PRO_ROSTER, proTeamsOf, salaryFor } from '../world/create';
import { changeStatus } from './effects';
import { computeRole } from './progress';
import { socialReactions } from './social';
import {
  cause,
  msg,
  pushFeed,
  pushTimeline,
  teamRef,
  userOf,
  userTeamId,
  type GameState,
} from './state';

/** The age from which each summer asks whether he wants another season. */
export const RETIREMENT_QUESTION_AGE = 33;
/** Nobody plays past this. */
export const LAST_AGE = 40;
const MIN_SALARY = 1_300_000;

function newInterruptId(state: GameState) {
  return asInterruptId(nextId(state.world.counters, 'interrupt', 'i'));
}

function overall(p: Player): number {
  return overallOf(p.skills, p.position, p.heightCm);
}

export function ageOf(state: GameState): number {
  return ageAt(userOf(state).birthYear, state.world.date);
}

/** His deal covering `season`, if he has one. */
export function contractFor(state: GameState, season: number): Contract | null {
  const id = state.career.playerId;
  return (
    Object.values(state.world.contracts).find(
      (c) => c.playerId === id && c.firstSeason <= season && c.lastSeason >= season,
    ) ?? null
  );
}

/** The deal he is on now: the one covering this season, or the rookie deal that starts next. */
export function currentContract(state: GameState): Contract | null {
  const season = seasonOf(state.world.date);
  return contractFor(state, season) ?? contractFor(state, season + 1);
}

/** He is a pro now: on a roster with a deal, a role to earn and a coach to win over. */
export function joinPros(
  state: GameState,
  index: ContentIndex,
  teamId: TeamId,
  how: 'drafted' | 'tryout',
): void {
  const career = state.career;
  career.stage = 'pro';
  career.coachTrust = 45;
  career.chemistry = 50;
  career.role = computeRole(state);
  career.form = null;
  pushFeed(state, 'milestone', msg(`feed.pro.joined.${how}`, { team: teamRef(teamId) }));
  if (how === 'tryout')
    pushTimeline(
      state,
      msg('timeline.pro.madeCamp', { team: teamRef(teamId) }),
      cause(state, 'event', 'tryout'),
      true,
    );
  socialReactions(state, index, ['drafted'], `pro-${teamId}`, 1);
}

/** Undrafted: a camp invitation from the team with the most room at the end of its bench. */
export function tryout(state: GameState, index: ContentIndex): void {
  const user = userOf(state);
  const season = seasonOf(state.world.date) + 1;
  const rng = createRng(state.world.seed, 'tryout', user.id);
  const teams = proTeamsOf(state.world)
    .map((t) => ({ t, depth: rosterStrength(state, t) + rng.next() * 2 }))
    .sort((a, b) => a.depth - b.depth);
  const team = teams[0]?.t;
  if (!team) return;
  sign(state, team.id, { years: 2, salary: MIN_SALARY, firstSeason: season, kind: 'minimum' });
  joinPros(state, index, team.id, 'tryout');
}

/** Average overall of a team's top ten: low means a bench spot is there to be won. */
function rosterStrength(state: GameState, team: ProTeam): number {
  const top = team.roster
    .map((id) => state.world.people[id])
    .filter(isPlayer)
    .filter((p) => p.id !== state.career.playerId)
    .map(overall)
    .sort((a, b) => b - a)
    .slice(0, 10);
  return top.reduce((s, v) => s + v, 0) / Math.max(1, top.length);
}

/** Where he would sit on a team's depth chart, as a role. */
function roleOn(state: GameState, team: ProTeam): Role {
  const mine = overall(userOf(state));
  const above = team.roster
    .map((id) => state.world.people[id])
    .filter(isPlayer)
    .filter((p) => p.id !== state.career.playerId && overall(p) > mine).length;
  return above === 0 ? 'star' : above < 5 ? 'starter' : above < 8 ? 'rotation' : 'bench';
}

/** Offers when his deal is up: his team's, and the best of the rest that want him. */
export function contractOffers(state: GameState): ContractOffer[] {
  const user = userOf(state);
  const ovr = overall(user);
  const age = ageOf(state);
  const own = userTeamId(state);
  const rng = createRng(state.world.seed, 'offers', user.id, state.world.date.year);
  const years = (lo: number, hi: number) => rng.int(lo, hi);
  const span = age < 27 ? [2, 4] : age < 31 ? [1, 3] : [1, 2];
  const base = Math.max(MIN_SALARY, salaryFor(ovr));
  const offer = (team: ProTeam, current: boolean): ContractOffer => {
    const role = roleOn(state, team);
    const need =
      role === 'star' ? 1.15 : role === 'starter' ? 1.05 : role === 'rotation' ? 0.95 : 0.85;
    const salary = Math.max(
      MIN_SALARY,
      Math.round((base * need * (0.92 + rng.next() * 0.16)) / 100_000) * 100_000,
    );
    return {
      teamId: team.id,
      years: years(span[0] ?? 1, span[1] ?? 2),
      salary,
      role,
      current,
    };
  };
  const teams = proTeamsOf(state.world);
  const out: ContractOffer[] = [];
  const ownTeam = teams.find((t) => t.id === own);
  // His own team keeps him if he would still be in their top twelve.
  if (ownTeam && roleRank(state, ownTeam) < 12) out.push(offer(ownTeam, true));
  const interested = teams
    .filter((t) => t.id !== own)
    .map((t) => ({ t, rank: roleRank(state, t), noise: rng.next() }))
    .filter((x) => x.rank < 11)
    .sort((a, b) => a.rank + a.noise * 3 - (b.rank + b.noise * 3))
    .slice(0, out.length ? 3 : 4);
  for (const x of interested) out.push(offer(x.t, false));
  // A player still in his prime always finds somewhere to play, if only at the minimum.
  if (out.length === 0 && age < 34) {
    const weakest = [...teams].sort(
      (a, b) => rosterStrength(state, a) - rosterStrength(state, b),
    )[0];
    if (weakest)
      out.push({ teamId: weakest.id, years: 1, salary: MIN_SALARY, role: 'bench', current: false });
  }
  return out;
}

/** How many players on a team are better than him. */
function roleRank(state: GameState, team: ProTeam): number {
  const mine = overall(userOf(state));
  return team.roster
    .map((id) => state.world.people[id])
    .filter(isPlayer)
    .filter((p) => p.id !== state.career.playerId && overall(p) > mine).length;
}

/** Puts him on a team's roster with a new deal, making room if the roster is full. */
function sign(
  state: GameState,
  teamId: TeamId,
  deal: {
    years: number;
    salary: number;
    firstSeason: number;
    kind: Contract['kind'];
  },
): void {
  const world = state.world;
  const user = userOf(state);
  const team = world.teams[teamId];
  if (team?.kind !== 'pro') return;
  if (user.affiliation.kind !== 'pro' || user.affiliation.teamId !== teamId) {
    endStint(user, deal.firstSeason - 1);
    leaveTeam(world, user);
    user.affiliation = { kind: 'pro', teamId };
    user.stints.push({ team: teamId, league: 'pro', fromSeason: deal.firstSeason, toSeason: null });
    team.roster.push(user.id);
    world.transactions.push({ kind: 'signed', date: world.date, playerId: user.id, teamId });
    while (team.roster.length > PRO_ROSTER) {
      const worst = team.roster
        .map((id) => world.people[id])
        .filter(isPlayer)
        .filter((p) => p.id !== user.id)
        .sort((a, b) => overall(a) - overall(b))[0];
      if (!worst) break;
      endStint(worst, deal.firstSeason - 1);
      leaveTeam(world, worst);
      worst.affiliation = { kind: 'freeAgent' };
      world.transactions.push({ kind: 'released', date: world.date, playerId: worst.id, teamId });
    }
  }
  const id = asContractId(nextId(world.counters, 'contract', 'c'));
  world.contracts[id] = {
    id,
    playerId: user.id,
    teamId,
    salary: deal.salary,
    firstSeason: deal.firstSeason,
    lastSeason: deal.firstSeason + deal.years - 1,
    kind: deal.kind,
    playerOption: false,
    noTrade: false,
  };
}

/** The summer: a new deal if his is up, and from his thirties the question of one more year. */
export function proSummer(state: GameState): void {
  const career = state.career;
  if (career.stage !== 'pro' || state.world.date.week !== WEEK.summerStart) return;
  const age = ageOf(state);
  if (age >= LAST_AGE) {
    retire(state, 'age');
    return;
  }
  const season = seasonOf(state.world.date);
  if (!contractFor(state, season)) {
    const offers = contractOffers(state);
    if (offers.length === 0) {
      retire(state, 'noOffers');
      return;
    }
    career.pending.push({ id: newInterruptId(state), kind: 'contract', offers, canRetire: true });
    return;
  }
  if (age >= RETIREMENT_QUESTION_AGE)
    career.pending.push({ id: newInterruptId(state), kind: 'retire', age });
}

/** Pay day and the coach's weekly view of his place in the rotation. */
export function proWeek(state: GameState, index: ContentIndex): void {
  if (state.career.stage !== 'pro') return;
  const contract = contractFor(state, seasonOf(state.world.date));
  if (contract) changeStatus(state, index, 'money', Math.round(contract.salary / 52));
}

export function resolveContract(
  state: GameState,
  index: ContentIndex,
  interrupt: Extract<Interrupt, { kind: 'contract' }>,
  choice: string,
): void {
  if (choice === 'retire' && interrupt.canRetire) {
    retire(state, 'choice');
    return;
  }
  const offer = interrupt.offers.find((o) => o.teamId === choice);
  if (!offer) throw new Error('no such offer');
  const season = seasonOf(state.world.date);
  const moving = !offer.current;
  sign(state, offer.teamId, {
    years: offer.years,
    salary: offer.salary,
    firstSeason: season,
    kind: offer.salary <= MIN_SALARY ? 'minimum' : 'standard',
  });
  const career = state.career;
  if (moving) {
    career.coachTrust = 50;
    career.chemistry = 50;
  } else {
    changeStatus(state, index, 'coachTrust', 4);
    changeStatus(state, index, 'chemistry', 3);
  }
  career.role = computeRole(state);
  const why = cause(state, 'event', 'contract', offer.teamId);
  const params = {
    team: teamRef(offer.teamId),
    years: offer.years,
    salary: Math.round(offer.salary / 100_000) / 10,
  };
  pushFeed(state, 'milestone', msg(moving ? 'feed.pro.signedNew' : 'feed.pro.resigned', params));
  pushTimeline(
    state,
    msg(moving ? 'timeline.pro.signedNew' : 'timeline.pro.resigned', params),
    why,
    true,
  );
  socialReactions(state, index, ['signed'], `contract-${season}`, 2);
}

export function resolveRetire(state: GameState, choice: string): void {
  if (choice === 'retire') retire(state, 'choice');
  else
    pushTimeline(
      state,
      msg('timeline.pro.oneMoreYear', { age: ageOf(state) }),
      cause(state, 'event', 'retire', 'continue'),
      false,
    );
}

/** Hangs them up: off the roster, out of the league, and the career closes. */
export function retire(state: GameState, why: 'choice' | 'age' | 'noOffers'): void {
  const career = state.career;
  const user = userOf(state);
  const teamId = userTeamId(state);
  const season = seasonOf(state.world.date);
  endStint(user, season - 1);
  leaveTeam(state.world, user);
  user.affiliation = { kind: 'retired', year: state.world.date.year };
  state.world.transactions.push({ kind: 'retired', date: state.world.date, playerId: user.id });
  career.stage = 'retired';
  career.pending = [];
  career.ending = {
    reason: 'retired',
    date: state.world.date,
    pick: user.draft?.pick ?? null,
    teamId: teamId ?? null,
  };
  pushTimeline(
    state,
    msg(`timeline.pro.retired.${why}`, { age: ageOf(state) }),
    cause(state, 'event', 'retire', why),
    true,
  );
  pushFeed(state, 'milestone', msg('feed.pro.retired', { age: ageOf(state) }));
}

/**
 * Season awards the league has just handed out: his own, and a title for his team. Each is
 * announced once.
 */
export function announceAwards(state: GameState, index: ContentIndex, season: number): void {
  const s = state.world.seasons[String(season)];
  if (!s) return;
  const key = String(season);
  const seen = state.career.awardsSeen[key] ?? 0;
  const fresh = s.awards.slice(seen);
  state.career.awardsSeen[key] = s.awards.length;
  const user = userOf(state);
  const team = userTeamId(state);
  for (const a of fresh) {
    const mine = a.personId === user.id;
    const ourTitle =
      a.personId === null &&
      team !== null &&
      a.teamId === team &&
      (a.kind === 'proChampion' || a.kind === 'collegeChampion' || a.kind === 'medalGold');
    if (!mine && !ourTitle) continue;
    const why = cause(state, 'event', 'award', a.kind);
    const params = a.teamId ? { team: teamRef(a.teamId) } : {};
    pushFeed(state, 'milestone', msg(`feed.award.${a.kind}`, params));
    pushTimeline(state, msg(`timeline.award.${a.kind}`, params), why, true);
    changeStatus(state, index, 'reputation', clamp(mine ? 6 : 4, 0, 10));
    changeStatus(state, index, 'confidence', 4);
    socialReactions(state, index, ['award'], `award-${season}-${a.kind}`, 2);
  }
}
