import { seasonOf } from '../core/calendar';
import { asContractId, nextId, type PersonId, type TeamId } from '../core/ids';
import { clamp } from '../core/math';
import { createRng, type Rng } from '../core/rng';
import type { ContentIndex } from '../content/registry';
import { assignRecruits, ROSTER_SIZE } from '../college/recruiting';
import { endStint, leaveTeam } from '../draft/draft';
import { overallOf } from '../game/ratings';
import { isPlayer, type Player } from '../model/person';
import type { CollegeTeam, ProTeam } from '../model/team';
import type { World } from '../model/world';
import { generatePlayer, type GenContext } from '../player/generate';
import {
  collegeTeamsOf,
  createHighSchoolClass,
  emptySeason,
  PRO_ROSTER,
  proTeamsOf,
  salaryFor,
} from '../world/create';
import { scheduleCollegeSeason } from './college-schedule';
import { scheduleProSeason } from './pro-schedule';
import { winPct } from './standings';

export interface RolloverOptions {
  /** The user's player, who the career layer moves itself. */
  readonly userId: PersonId | null;
  /** Where the user committed, so his roster spot is held before NPC recruiting. */
  readonly userCollege: TeamId | null;
}

const overall = (p: Player) => overallOf(p.skills, p.position, p.heightCm);

/** Week 27: the old season closes and a new one opens. */
export function rollover(world: World, index: ContentIndex, o: RolloverOptions): void {
  const oldSeason = seasonOf({ year: world.date.year, week: 26 });
  const season = oldSeason + 1;
  const rng = createRng(world.seed, 'rollover', season);
  const ctx: GenContext = { rng, index, world, taken: new Set() };

  archiveSeason(world, oldSeason);
  world.seasons[String(season)] = emptySeason(season);

  collegeDepartures(world, rng, oldSeason, o.userId);
  const user = o.userId ? world.people[o.userId] : undefined;
  if (isPlayer(user) && o.userCollege && user.affiliation.kind === 'highSchool') {
    user.affiliation = { kind: 'college', teamId: o.userCollege, classYear: 1 };
    user.stints.push({
      team: o.userCollege,
      league: 'college',
      fromSeason: season,
      toSeason: null,
    });
    world.teams[o.userCollege]?.roster.push(user.id);
  }
  driftPrestige(world, oldSeason);
  proOffseason(world, rng, season, o.userId);
  overseasTurnover(ctx, season);

  // Last spring's high-school class arrives on campus.
  const recruits = world.recruitingClass
    .map((id) => world.people[id])
    .filter(isPlayer)
    .filter((p) => p.id !== o.userId && p.affiliation.kind === 'highSchool');
  const colleges = collegeTeamsOf(world);
  const unsigned = assignRecruits(ctx, recruits, colleges, ROSTER_SIZE, season);
  for (const p of unsigned) {
    if (p.nation !== 'USA' && rng.chance(0.7)) sendOverseas(world, rng, p, index, season);
    else delete world.people[p.id];
  }
  walkOns(ctx, colleges, season);
  createHighSchoolClass(ctx, world.date.year + 1);

  scheduleCollegeSeason(world, season, createRng(world.seed, 'schedule', 'college', season));
  scheduleProSeason(world, season, createRng(world.seed, 'schedule', 'pro', season));
  pruneGames(world, season);
  world.draft = null;
}

function archiveSeason(world: World, season: number): void {
  const s = world.seasons[String(season)];
  if (!s) return;
  const national = s.college.national ? world.tournaments[s.college.national] : undefined;
  const playoffs = s.pro.playoffs ? world.tournaments[s.pro.playoffs] : undefined;
  world.history.push({
    year: season,
    collegeChampion: national?.champion ?? null,
    proChampion: playoffs?.champion ?? null,
    awards: s.awards,
    draft: (world.draft?.picks ?? [])
      .filter((p) => p.playerId)
      .map((p) => ({ pick: p.pick, teamId: p.teamId, playerId: p.playerId as PersonId })),
  });
  // Keep the last two seasons live; older ones live on in history.
  for (const key of Object.keys(world.seasons))
    if (Number(key) < season - 1) delete world.seasons[key];
}

function collegeDepartures(world: World, rng: Rng, season: number, userId: PersonId | null): void {
  const declared = new Set(world.draft?.pool ?? []);
  for (const person of Object.values(world.people)) {
    if (!isPlayer(person) || person.id === userId || person.affiliation.kind !== 'college')
      continue;
    const a = person.affiliation;
    if (a.classYear === 4 || declared.has(person.id)) {
      endStint(person, season);
      leaveTeam(world, person);
      if (overall(person) >= 47 || rng.chance(0.25)) {
        person.affiliation = { kind: 'freeAgent' };
      } else {
        person.affiliation = { kind: 'retired', year: world.date.year };
      }
    } else {
      person.affiliation = {
        kind: 'college',
        teamId: a.teamId,
        classYear: (a.classYear + 1) as 2 | 3 | 4,
      };
    }
  }
}

function driftPrestige(world: World, season: number): void {
  const s = world.seasons[String(season)];
  if (!s) return;
  const national = s.college.national ? world.tournaments[s.college.national] : undefined;
  for (const team of collegeTeamsOf(world)) {
    const pct = winPct(s.college.records[team.id]);
    const deep = national ? Math.max(0, 8 - national.placings.indexOf(team.id)) : 0;
    const placing = national && national.placings.includes(team.id) ? deep * 0.4 : 0;
    team.prestige = clamp(
      Math.round(team.prestige + (pct - 0.5) * 6 + placing - (team.prestige - 50) * 0.02),
      5,
      99,
    );
  }
}

function proOffseason(world: World, rng: Rng, season: number, userId: PersonId | null): void {
  // Retirements and expiring deals.
  for (const team of proTeamsOf(world)) {
    for (const id of [...team.roster]) {
      const p = world.people[id];
      if (!isPlayer(p) || p.id === userId) continue;
      const age = world.date.year - p.birthYear;
      const ovr = overall(p);
      const retire =
        age >= 38 || (age >= 34 && rng.chance(0.35)) || (age >= 31 && ovr < 54 && rng.chance(0.4));
      const contract = Object.values(world.contracts).find(
        (c) => c.playerId === p.id && c.lastSeason >= season - 1,
      );
      const expired = !contract || contract.lastSeason < season;
      if (retire) {
        endStint(p, season - 1);
        leaveTeam(world, p);
        p.affiliation = { kind: 'retired', year: world.date.year };
        world.transactions.push({ kind: 'retired', date: world.date, playerId: p.id });
      } else if (expired && rng.chance(ovr >= 64 ? 0.6 : 0.35)) {
        signContract(world, rng, p, team, season);
      } else if (expired) {
        endStint(p, season - 1);
        leaveTeam(world, p);
        p.affiliation = { kind: 'freeAgent' };
      }
    }
  }
  // Free agency: best available fill the open spots; the weakest are cut from full rosters.
  const pool = Object.values(world.people)
    .filter(isPlayer)
    .filter(
      (p) =>
        p.id !== userId &&
        (p.affiliation.kind === 'freeAgent' ||
          (p.affiliation.kind === 'overseas' && rng.chance(0.15))),
    )
    .filter((p) => world.date.year - p.birthYear <= 34)
    .sort((a, b) => overall(b) - overall(a));
  const teams = rng.shuffle(proTeamsOf(world));
  let changed = true;
  while (changed) {
    changed = false;
    for (const team of teams) {
      if (team.roster.length >= PRO_ROSTER) continue;
      const p = pool.shift();
      if (!p) break;
      if (p.affiliation.kind === 'overseas') endStint(p, season - 1);
      signContract(world, rng, p, team, season);
      changed = true;
    }
  }
  for (const team of proTeamsOf(world)) {
    while (team.roster.length > PRO_ROSTER) {
      const worst = team.roster
        .map((id) => world.people[id])
        .filter(isPlayer)
        .filter(
          (p) => p.id !== userId && !(p.draft?.season === season - 1 && (p.draft.pick ?? 99) <= 30),
        )
        .sort((a, b) => overall(a) - overall(b))[0];
      if (!worst) break;
      endStint(worst, season - 1);
      leaveTeam(world, worst);
      worst.affiliation = { kind: 'freeAgent' };
      world.transactions.push({
        kind: 'released',
        date: world.date,
        playerId: worst.id,
        teamId: team.id,
      });
    }
  }
}

function signContract(world: World, rng: Rng, p: Player, team: ProTeam, season: number): void {
  if (p.affiliation.kind !== 'pro' || p.affiliation.teamId !== team.id) {
    leaveTeam(world, p);
    p.affiliation = { kind: 'pro', teamId: team.id };
    p.stints.push({ team: team.id, league: 'pro', fromSeason: season, toSeason: null });
    team.roster.push(p.id);
    world.transactions.push({ kind: 'signed', date: world.date, playerId: p.id, teamId: team.id });
  }
  const id = asContractId(nextId(world.counters, 'contract', 'c'));
  const years = rng.int(1, 4);
  world.contracts[id] = {
    id,
    playerId: p.id,
    teamId: team.id,
    salary: salaryFor(overall(p)),
    firstSeason: season,
    lastSeason: season + years - 1,
    kind: 'standard',
    playerOption: rng.chance(0.15),
    noTrade: rng.chance(0.05),
  };
}

function sendOverseas(
  world: World,
  rng: Rng,
  p: Player,
  index: ContentIndex,
  season: number,
): void {
  const home = index.nation.get(p.nation);
  const nation =
    home && home.clubs.length > 0 && home.code !== 'USA'
      ? home
      : rng.pick(index.content.nations.filter((n) => n.clubs.length > 0 && n.strength > 60));
  const club = rng.pick(nation.clubs);
  leaveTeam(world, p);
  p.affiliation = { kind: 'overseas', club, clubNation: nation.code };
  p.stints.push({ team: club, league: 'overseas', fromSeason: season, toSeason: null });
  world.transactions.push({ kind: 'wentOverseas', date: world.date, playerId: p.id, club });
}

function overseasTurnover(ctx: GenContext, season: number): void {
  const { world, rng, index } = ctx;
  for (const person of Object.values(world.people)) {
    if (!isPlayer(person) || person.isUser) continue;
    const age = world.date.year - person.birthYear;
    if (person.affiliation.kind === 'freeAgent') {
      if (age >= 33 || overall(person) < 44) {
        person.affiliation = { kind: 'retired', year: world.date.year };
      } else {
        sendOverseas(world, rng, person, index, season);
      }
    } else if (
      person.affiliation.kind === 'overseas' &&
      (age >= 36 || (age >= 31 && rng.chance(0.18)))
    ) {
      endStint(person, season - 1);
      person.affiliation = { kind: 'retired', year: world.date.year };
    }
  }
  // Retired players who never reached college or the pros leave the world entirely.
  for (const person of Object.values(world.people)) {
    if (!isPlayer(person) || person.affiliation.kind !== 'retired') continue;
    if (
      !person.lines.some(
        (l) => l.league === 'college' || l.league === 'pro' || l.league === 'national',
      )
    )
      delete world.people[person.id];
  }
  // A new generation of club youngsters in every nation.
  for (const nation of index.content.nations) {
    const count = Math.max(1, Math.round((8 + nation.strength * 0.24) / 10));
    for (let i = 0; i < count; i++) {
      const p = generatePlayer(ctx, {
        nation,
        birthYear: world.date.year - 17,
        level: 30 + nation.strength * 0.29 - 12 + rng.normal(0, 5.5),
        gapBonus: 1.5,
        affiliation: {
          kind: 'overseas',
          club: rng.pick(nation.clubs.length > 0 ? nation.clubs : [nation.code]),
          clubNation: nation.code,
        },
      });
      world.people[p.id] = p;
    }
  }
}

/** Fills any college roster still short with walk-ons, so every team can play. */
function walkOns(ctx: GenContext, colleges: CollegeTeam[], season: number): void {
  const usa = ctx.index.nation.get('USA') ?? ctx.index.content.nations[0];
  if (!usa) return;
  for (const team of colleges) {
    while (team.roster.length < ROSTER_SIZE) {
      const p = generatePlayer(ctx, {
        nation: usa,
        birthYear: ctx.world.date.year - 18,
        level: 30 + ctx.rng.normal(0, 3),
        affiliation: { kind: 'college', teamId: team.id, classYear: 1 },
      });
      p.stints.push({ team: team.id, league: 'college', fromSeason: season, toSeason: null });
      ctx.world.people[p.id] = p;
      team.roster.push(p.id);
    }
  }
}

/**
 * Drops finished games from past seasons, keeping the save small. Standings, awards and
 * player lines already hold what matters; games with a kept box score (the career's own)
 * stay one extra season for the profile screens.
 */
function pruneGames(world: World, season: number): void {
  for (const [id, g] of Object.entries(world.games)) {
    if (!g.result) continue;
    const age = season - seasonOf(g.date);
    if (age >= 2 || (age >= 1 && !g.result.box)) delete world.games[id];
  }
  for (const [id, t] of Object.entries(world.tournaments)) {
    if (t.season < season - 1) delete world.tournaments[id];
  }
}
