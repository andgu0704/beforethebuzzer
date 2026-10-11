import { seasonOf, type GameDate } from '../core/calendar';
import { asContractId, asTeamId, emptyCounters, nextId, type TeamId } from '../core/ids';
import { clamp } from '../core/math';
import { createRng, type Rng } from '../core/rng';
import type { ContentIndex } from '../content/registry';
import type { NationDef } from '../content/world-types';
import { overallOf } from '../game/ratings';
import { assignRecruits, CLASS_SIZE, generateClass, ROSTER_SIZE } from '../college/recruiting';
import type { Player } from '../model/person';
import type { CollegeTeam, GmTemperament, NationalTeam, ProTeam } from '../model/team';
import type { Season, World } from '../model/world';
import { generatePlayer, type GenContext } from '../player/generate';
import { scheduleProSeason } from '../season/pro-schedule';
import { generateAgent, generateCoach } from './staff';
import { quickPlayWeeks } from './quick';

export const PRO_ROSTER = 15;
export const AGENTS = 14;

export function emptySeason(year: number): Season {
  return {
    year,
    college: { records: {}, polls: [], conferenceTournaments: {}, national: null, holiday: null },
    pro: { records: {}, playoffs: null, draftOrder: null, lottery: null },
    international: [],
    awards: [],
    processed: [],
  };
}

export function nationById(index: ContentIndex, code: string): NationDef {
  const n = index.nation.get(code);
  if (!n) throw new Error(`unknown nation ${code}`);
  return n;
}

function usa(index: ContentIndex): NationDef {
  return index.nation.get('USA') ?? index.content.nations[0] ?? nationById(index, 'USA');
}

/** Builds a complete, living world at `date` (normally week 14 of the start year). */
export function createWorld(index: ContentIndex, seed: string, date: GameDate): World {
  const world: World = {
    seed,
    date,
    counters: emptyCounters(),
    people: {},
    teams: {},
    games: {},
    tournaments: {},
    seasons: {},
    draft: null,
    contracts: {},
    transactions: [],
    nations: {},
    history: [],
    overrides: { teams: {}, people: {} },
    recruitingClass: [],
  };
  const ctx: GenContext = { rng: createRng(seed, 'world'), index, world, taken: new Set() };
  const season = seasonOf(date);
  world.seasons[String(season)] = emptySeason(season);

  createNations(world, index);
  const colleges = createColleges(ctx);
  createProTeams(ctx);
  fillCollegeRosters(ctx, colleges, season);
  fillProRosters(ctx, season);
  createOverseasPools(ctx);
  createHighSchoolClass(ctx, date.year);
  for (let i = 0; i < AGENTS; i++) {
    const agent = generateAgent(
      ctx,
      usa(index),
      clamp(Math.round(20 + (i / AGENTS) * 75 + ctx.rng.normal(0, 4)), 10, 98),
    );
    world.people[agent.id] = agent;
  }

  // The pro season is already under way: play the weeks before today quickly.
  scheduleProSeason(world, season, createRng(seed, 'schedule', 'pro', season));
  quickPlayWeeks(world, createRng(seed, 'prehistory'), date);
  return world;
}

function createNations(world: World, index: ContentIndex): void {
  for (const n of index.content.nations) {
    const senior = asTeamId(`nat-${n.code}`);
    const u20 = asTeamId(`u20-${n.code}`);
    for (const [id, level] of [
      [senior, 'senior'],
      [u20, 'u20'],
    ] as const) {
      const team: NationalTeam = {
        id,
        kind: 'national',
        nation: n.code,
        level,
        name: n.code,
        nickname: '',
        abbr: n.code,
        city: n.cities[0] ?? n.code,
        colours: n.colours,
        coachId: null,
        roster: [],
      };
      world.teams[id] = team;
    }
    world.nations[n.code] = {
      code: n.code,
      points: n.strength * 10,
      seniorTeam: senior,
      u20Team: u20,
    };
  }
}

function createColleges(ctx: GenContext): CollegeTeam[] {
  const { world, index } = ctx;
  return index.content.colleges.map((c) => {
    const team: CollegeTeam = {
      id: asTeamId(c.id),
      kind: 'college',
      name: c.name,
      nickname: c.nickname,
      abbr: c.abbr,
      city: c.city,
      region: c.region,
      conferenceId: c.conferenceId,
      prestige: c.prestige,
      academics: c.academics,
      colours: c.colours,
      coachId: null,
      roster: [],
    };
    const coach = generateCoach(ctx, usa(index), team.id, c.prestige);
    world.people[coach.id] = coach;
    team.coachId = coach.id;
    world.teams[team.id] = team;
    return team;
  });
}

const TEMPERAMENTS: GmTemperament[] = ['bestAvailable', 'need', 'upside', 'safe'];

function createProTeams(ctx: GenContext): void {
  const { world, index, rng } = ctx;
  for (const t of index.content.proTeams) {
    const team: ProTeam = {
      id: asTeamId(t.id),
      kind: 'pro',
      name: t.city,
      nickname: t.nickname,
      abbr: t.abbr,
      city: t.city,
      conference: t.conference,
      division: t.division,
      market: t.market,
      emblem: t.emblem,
      colours: t.colours,
      coachId: null,
      roster: [],
      gm: {
        temperament: rng.pick(TEMPERAMENTS),
        internationalBias: clamp(rng.normal(0, 0.3), -0.6, 0.6),
      },
    };
    const coach = generateCoach(ctx, usa(index), team.id, 70);
    world.people[coach.id] = coach;
    team.coachId = coach.id;
    world.teams[team.id] = team;
  }
}

/** Four college classes, seniors first, with a season of growth folded into each year. */
function fillCollegeRosters(ctx: GenContext, colleges: CollegeTeam[], season: number): void {
  const { world } = ctx;
  for (let years = 4; years >= 1; years--) {
    const gradYear = world.date.year - years;
    const recruits = generateClass(ctx, {
      gradYear,
      size: CLASS_SIZE,
      experience: 1.5 + (years - 1) * 2.2,
      affiliation: (p) => p.affiliation,
    });
    for (const p of recruits) world.people[p.id] = p;
    const cap = years === 1 ? ROSTER_SIZE : Math.ceil(ROSTER_SIZE / 4);
    const unsigned = assignRecruits(ctx, recruits, colleges, cap, season - years + 1);
    for (const p of recruits) {
      if (p.affiliation.kind === 'college')
        p.affiliation = {
          kind: 'college',
          teamId: p.affiliation.teamId,
          classYear: (5 - years) as 1 | 2 | 3 | 4,
        };
    }
    for (const p of unsigned) delete world.people[p.id];
  }
}

function fillProRosters(ctx: GenContext, season: number): void {
  const { world, rng, index } = ctx;
  const nations = index.content.nations;
  for (const team of Object.values(world.teams)) {
    if (team.kind !== 'pro') continue;
    const teamLevel = rng.normal(62, 1.8);
    for (let i = 0; i < PRO_ROSTER; i++) {
      const age = clamp(Math.round(rng.normal(26.5, 3.8)), 20, 37);
      const nation = rng.chance(0.75)
        ? usa(index)
        : rng.weighted(nations, (n) => n.strength * n.strength);
      const level = teamLevel + 6 - i * 1.1 + rng.normal(0, 2.5) - Math.max(0, 24 - age) * 1.2;
      const p = generatePlayer(ctx, {
        nation,
        birthYear: world.date.year - age,
        level,
        affiliation: { kind: 'pro', teamId: team.id },
      });
      const draftSeason = season - 1 - Math.max(0, age - 20);
      p.draft = {
        season: draftSeason,
        pick: rng.chance(0.82) ? rng.int(1, 60) : null,
        teamId: null,
      };
      p.stints.push({
        team: team.id,
        league: 'pro',
        fromSeason: season - rng.int(0, Math.max(0, age - 21)),
        toSeason: null,
      });
      addContract(world, rng, p, team.id, season);
      world.people[p.id] = p;
      team.roster.push(p.id);
    }
  }
}

export function salaryFor(overall: number): number {
  const t = clamp((overall - 50) / 35, 0, 1);
  return (Math.round((1.3 + 46 * t * t) * 10) / 10) * 1_000_000;
}

function addContract(world: World, rng: Rng, p: Player, teamId: TeamId, season: number): void {
  const id = asContractId(nextId(world.counters, 'contract', 'c'));
  const years = rng.int(1, 4);
  world.contracts[id] = {
    id,
    playerId: p.id,
    teamId,
    salary: salaryFor(overallOf(p.skills, p.position, p.heightCm)),
    firstSeason: season - rng.int(0, 2),
    lastSeason: season + years - 1,
    kind: 'standard',
    playerOption: rng.chance(0.15),
    noTrade: rng.chance(0.05),
  };
}

/** Players at invented clubs in every nation, young and old, who feed national teams and the draft. */
function createOverseasPools(ctx: GenContext): void {
  const { world, rng, index } = ctx;
  for (const nation of index.content.nations) {
    const count = Math.round(8 + nation.strength * 0.24);
    for (let i = 0; i < count; i++) {
      const age = clamp(Math.round(rng.normal(25, 5)), 17, 35);
      const youth = Math.max(0, 23 - age) * 2;
      const level = 30 + nation.strength * 0.29 + rng.normal(0, 5.5) - youth;
      const clubs = nation.clubs.length > 0 ? nation.clubs : [nation.code];
      const club = rng.pick(clubs);
      const p = generatePlayer(ctx, {
        nation,
        birthYear: world.date.year - age,
        level,
        gapBonus: age <= 20 ? 1.5 : 0,
        affiliation: { kind: 'overseas', club, clubNation: nation.code },
      });
      p.stints.push({
        team: club,
        league: 'overseas',
        fromSeason: seasonOf(world.date) - rng.int(0, 3),
        toSeason: null,
      });
      world.people[p.id] = p;
    }
  }
}

/** The high-school seniors who are being recruited this spring. */
export function createHighSchoolClass(ctx: GenContext, gradYear: number): Player[] {
  const recruits = generateClass(ctx, {
    gradYear,
    size: CLASS_SIZE,
    experience: 0,
    affiliation: () => ({ kind: 'highSchool', graduationYear: gradYear }),
  });
  for (const p of recruits) ctx.world.people[p.id] = p;
  ctx.world.recruitingClass = recruits.map((p) => p.id);
  return recruits;
}

export function proTeamsOf(world: World): ProTeam[] {
  return Object.values(world.teams).filter((t): t is ProTeam => t.kind === 'pro');
}

export function collegeTeamsOf(world: World): CollegeTeam[] {
  return Object.values(world.teams).filter((t): t is CollegeTeam => t.kind === 'college');
}

export function playerOverall(p: Player): number {
  return overallOf(p.skills, p.position, p.heightCm);
}
