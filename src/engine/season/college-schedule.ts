import { WEEK } from '../core/calendar';
import type { TeamId } from '../core/ids';
import type { Rng } from '../core/rng';
import type { CollegeTeam } from '../model/team';
import type { World } from '../model/world';
import { createTournament } from '../tournament/engine';
import { FORMATS } from '../tournament/formats';
import { createGame } from '../world/games';

export const HOLIDAY_EVENTS = 4;

/** Non-conference games per week for teams outside a holiday event (13 total). */
const NONCONF_PATTERN = [2, 2, 1, 2, 2, 2, 1, 1];
/** The same for teams in a holiday event: week 48 is the event itself. */
const NONCONF_PATTERN_HOLIDAY = [2, 2, 1, 0, 2, 1, 1, 1];

function collegeTeams(world: World): CollegeTeam[] {
  return Object.values(world.teams).filter((t): t is CollegeTeam => t.kind === 'college');
}

/**
 * Creates every regular-season college game for `season`, plus the holiday events.
 * Conference and national tournaments are created later from the standings.
 */
export function scheduleCollegeSeason(world: World, season: number, rng: Rng): void {
  const teams = collegeTeams(world);
  const startYear = season - 1;

  // Holiday events: eight teams each, a mix of prestige.
  const pool = rng
    .shuffle(teams)
    .sort((a, b) => b.prestige + rng.next() * 40 - (a.prestige + rng.next() * 40));
  const holidayTeams = new Set<TeamId>();
  for (let e = 0; e < HOLIDAY_EVENTS; e++) {
    const entrants: CollegeTeam[] = [];
    for (const t of pool) {
      if (entrants.length >= 8) break;
      if (holidayTeams.has(t.id) || entrants.some((x) => x.conferenceId === t.conferenceId))
        continue;
      // Spread big names across events.
      if (entrants.length < 2 || rng.chance(0.35)) {
        entrants.push(t);
        holidayTeams.add(t.id);
      }
    }
    const seeded = entrants.sort((a, b) => b.prestige - a.prestige).map((t) => t.id);
    const tournament = createTournament(world, {
      kind: 'holiday',
      nameKey: 'tournament.holiday',
      nameParams: { index: e },
      season,
      rules: 'college',
      format: FORMATS.holiday,
      teams: seeded,
      start: { year: startYear, week: WEEK.holidayTournament },
    });
    const s = world.seasons[String(season)];
    if (s && e === 0) s.college.holiday = tournament.id;
  }

  scheduleNonConference(world, teams, holidayTeams, startYear, rng);
  for (const conf of new Set(teams.map((t) => t.conferenceId))) {
    scheduleConference(
      world,
      teams.filter((t) => t.conferenceId === conf),
      season,
      rng,
    );
  }
}

function scheduleNonConference(
  world: World,
  teams: CollegeTeam[],
  holiday: Set<TeamId>,
  year: number,
  rng: Rng,
): void {
  const met = new Set<string>();
  const key = (a: TeamId, b: TeamId) => (a < b ? `${a}|${b}` : `${b}|${a}`);
  NONCONF_PATTERN.forEach((_, w) => {
    const week = WEEK.nonConferenceStart + w;
    for (let slot = 0; slot < 2; slot++) {
      const needing = rng.shuffle(
        teams.filter(
          (t) => ((holiday.has(t.id) ? NONCONF_PATTERN_HOLIDAY : NONCONF_PATTERN)[w] ?? 0) > slot,
        ),
      );
      const free = new Set(needing.map((t) => t.id));
      for (const t of needing) {
        if (!free.has(t.id)) continue;
        free.delete(t.id);
        const options = needing.filter(
          (o) => free.has(o.id) && o.conferenceId !== t.conferenceId && !met.has(key(t.id, o.id)),
        );
        if (options.length === 0) continue;
        const o = rng.pick(options);
        free.delete(o.id);
        met.add(key(t.id, o.id));
        // Bigger programmes host more often ("buy games").
        const tHome = rng.chance(0.5 + (t.prestige - o.prestige) / 160);
        createGame(world, {
          date: { year, week },
          slot,
          league: 'college',
          kind: 'nonConference',
          home: tHome ? t.id : o.id,
          away: tHome ? o.id : t.id,
        });
      }
    }
  });
}

/** Round robin by the circle method, then the start of a second cycle, up to 18 rounds. */
function scheduleConference(world: World, teams: CollegeTeam[], season: number, rng: Rng): void {
  const ids: (TeamId | null)[] = rng.shuffle(teams.map((t) => t.id));
  if (ids.length % 2 === 1) ids.push(null);
  const n = ids.length;
  const roundsPerCycle = n - 1;
  const rounds = 18;
  const list = [...ids];
  for (let r = 0; r < rounds; r++) {
    const cycle = Math.floor(r / roundsPerCycle);
    const week = WEEK.conferenceStart + Math.floor(r / 2);
    for (let i = 0; i < n / 2; i++) {
      const a = list[i];
      const b = list[n - 1 - i];
      if (!a || !b) continue;
      const flip = (r + i + cycle) % 2 === 1;
      createGame(world, {
        date: { year: season, week },
        slot: r % 2,
        league: 'college',
        kind: 'conference',
        home: flip ? b : a,
        away: flip ? a : b,
      });
    }
    // Rotate all but the first.
    const last = list.pop() ?? null;
    list.splice(1, 0, last);
  }
}
