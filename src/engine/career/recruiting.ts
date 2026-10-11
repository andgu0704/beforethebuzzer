import { WEEK } from '../core/calendar';
import { asInterruptId, asTeamId, nextId, type PersonId, type TeamId } from '../core/ids';
import { clamp, dpow } from '../core/math';
import { createRng } from '../core/rng';
import type { ContentIndex } from '../content/registry';
import { prospectScore } from '../college/recruiting';
import { overallOf } from '../game/ratings';
import type { Offer } from '../model/career';
import { isPlayer, type Player } from '../model/person';
import type { CollegeTeam, SelectTeam } from '../model/team';
import type { World } from '../model/world';
import { createGame } from '../world/games';
import { socialReactions } from './social';
import { cause, msg, pushFeed, pushTimeline, teamRef, userOf, type GameState } from './state';

export const SHOWCASE_TEAMS = [asTeamId('showcase-east'), asTeamId('showcase-west')] as const;

/** The spring showcase: twenty seniors ranked around the user, split into two sides. */
export function createShowcase(world: World, user: Player): void {
  const classIds = world.recruitingClass;
  const rank = classIds.indexOf(user.id);
  const start = clamp(rank - 12, 0, Math.max(0, classIds.length - 20));
  const invited = classIds.slice(start, start + 20);
  if (!invited.includes(user.id)) invited[invited.length - 1] = user.id;
  const sides: PersonId[][] = [[], []];
  invited.forEach((id, i) => sides[i % 2 === 0 ? 0 : 1]?.push(id));
  SHOWCASE_TEAMS.forEach((id, i) => {
    const team: SelectTeam = {
      id,
      kind: 'select',
      name: i === 0 ? 'showcaseEast' : 'showcaseWest',
      nickname: '',
      abbr: i === 0 ? 'EAST' : 'WEST',
      city: '',
      colours:
        i === 0
          ? { primary: '#1F3A5F', secondary: '#E8E2D0' }
          : { primary: '#8A2B1F', secondary: '#E8E2D0' },
      coachId: null,
      roster: sides[i] ?? [],
    };
    world.teams[id] = team;
  });
  createGame(world, {
    date: { year: world.date.year, week: WEEK.recruitingStart },
    slot: 0,
    league: 'highSchool',
    kind: 'showcase',
    home: SHOWCASE_TEAMS[0],
    away: SHOWCASE_TEAMS[1],
    neutral: true,
  });
}

/** Removes the showcase sides once the game is played. */
export function clearShowcase(world: World): void {
  for (const id of SHOWCASE_TEAMS) delete world.teams[id];
}

/** The highest recruit rank (1 = best) a programme of this prestige will offer. */
export function offerReach(prestige: number): number {
  return 600 * dpow(clamp(1 - prestige / 100, 0.01, 1), 1.6);
}

function projectedRole(
  world: World,
  team: CollegeTeam,
  user: Player,
): { role: Offer['role']; minutes: number } {
  const mine = overallOf(user.skills, user.position, user.heightCm) + 2;
  const returning = team.roster
    .map((id) => world.people[id])
    .filter(isPlayer)
    .filter((p) => !(p.affiliation.kind === 'college' && p.affiliation.classYear === 4))
    .map((p) => overallOf(p.skills, p.position, p.heightCm) + 2.5);
  const above = returning.filter((o) => o > mine).length;
  if (above === 0) return { role: 'star', minutes: 32 };
  if (above < 4) return { role: 'starter', minutes: 27 };
  if (above < 7) return { role: 'rotation', minutes: 17 };
  return { role: 'bench', minutes: 6 };
}

/** Three or four offers: a reach, a balanced fit, a place to star, and sometimes an academic pick. */
export function computeOffers(state: GameState): Offer[] {
  const world = state.world;
  const user = userOf(state);
  const rng = createRng(world.seed, 'offers', user.id);
  const classPlayers = world.recruitingClass.map((id) => world.people[id]).filter(isPlayer);
  const userScore = prospectScore(user) + state.career.stock;
  const rank =
    classPlayers.filter((p) => p.id !== user.id && prospectScore(p) > userScore).length + 1;
  user.recruitRank = rank;
  const colleges = Object.values(world.teams).filter((t): t is CollegeTeam => t.kind === 'college');
  const interested = colleges.filter(
    (c) => offerReach(c.prestige) * (0.75 + rng.next() * 0.6) >= rank,
  );
  const pool =
    interested.length >= 3
      ? interested
      : [...colleges].sort((a, b) => a.prestige - b.prestige).slice(0, 12);
  const byPrestige = [...pool].sort((a, b) => b.prestige - a.prestige);
  const picks: { team: CollegeTeam; pitch: string }[] = [];
  const add = (team: CollegeTeam | undefined, pitch: string) => {
    if (team && !picks.some((p) => p.team.id === team.id)) picks.push({ team, pitch });
  };
  add(byPrestige[Math.floor(rng.next() * Math.min(3, byPrestige.length))], 'reach');
  const withRoles = pool.map((team) => ({ team, ...projectedRole(world, team, user) }));
  add(
    rng
      .shuffle(withRoles.filter((x) => x.role === 'starter'))
      .sort((a, b) => b.team.prestige - a.team.prestige)[0]?.team,
    'balanced',
  );
  add(
    rng.shuffle(withRoles.filter((x) => x.role === 'star'))[0]?.team ??
      byPrestige[byPrestige.length - 1],
    'star',
  );
  if (rng.chance(0.6))
    add(rng.shuffle(pool).sort((a, b) => b.academics - a.academics)[0], 'academic');
  for (const team of rng.shuffle(pool)) {
    if (picks.length >= 3) break;
    add(team, 'balanced');
  }
  return picks.map(({ team, pitch }) => ({
    teamId: team.id,
    pitch,
    ...projectedRole(world, team, user),
  }));
}

export function raiseOffers(state: GameState): void {
  const offers = computeOffers(state);
  state.career.offers = offers;
  state.career.pending.push({
    id: asInterruptId(nextId(state.world.counters, 'interrupt', 'i')),
    kind: 'offers',
    offers,
  });
}

export function commitTo(state: GameState, index: ContentIndex, teamId: TeamId): void {
  const career = state.career;
  if (!career.offers.some((o) => o.teamId === teamId)) throw new Error('no offer from that school');
  career.committedTo = teamId;
  const why = cause(state, 'event', 'commitment', teamId);
  state.world.transactions.push({
    kind: 'committed',
    date: state.world.date,
    playerId: career.playerId,
    teamId,
  });
  pushTimeline(state, msg('timeline.committed', { team: teamRef(teamId) }), why, true);
  pushFeed(state, 'milestone', msg('feed.committed', { team: teamRef(teamId) }));
  socialReactions(state, index, ['commit'], `commit-${teamId}`, 2);
}
