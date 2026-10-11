import { WEEK } from '../core/calendar';
import type { TeamId } from '../core/ids';
import type { ContentIndex } from '../content/registry';
import { emptyRecord } from '../model/game';
import type { CollegeTeam } from '../model/team';
import type { World } from '../model/world';
import { createTournament } from '../tournament/engine';
import { FORMATS } from '../tournament/formats';
import { conferenceStandings, winPct } from './standings';
import { teamRating } from './strength';

function colleges(world: World): CollegeTeam[] {
  return Object.values(world.teams).filter((t): t is CollegeTeam => t.kind === 'college');
}

/** A selection committee's view: record, margin and strength of roster. */
export function selectionScore(world: World, season: number, team: CollegeTeam): number {
  const r = world.seasons[String(season)]?.college.records[team.id] ?? emptyRecord();
  const games = Math.max(1, r.w + r.l);
  const margin = (r.pf - r.pa) / games;
  const confBoost = team.prestige >= 58 ? 2.5 : team.prestige >= 30 ? 0 : -2.5;
  return (
    (winPct(r) - 0.5) * 30 + margin * 0.45 + (teamRating(world, team.id) - 45) * 0.9 + confBoost
  );
}

export function updatePoll(world: World, season: number): void {
  const s = world.seasons[String(season)];
  if (!s) return;
  const ranking = colleges(world)
    .map((t) => ({ id: t.id, score: selectionScore(world, season, t) }))
    .sort((a, b) => b.score - a.score || (a.id < b.id ? -1 : 1))
    .slice(0, 25)
    .map((x) => x.id);
  s.college.polls.push({ week: world.date.week, ranking });
  if (s.college.polls.length > 30) s.college.polls.shift();
}

export function createConferenceTournaments(
  world: World,
  index: ContentIndex,
  season: number,
): void {
  const s = world.seasons[String(season)];
  if (!s) return;
  for (const conf of index.content.conferences) {
    const seeded = conferenceStandings(world, season, conf.id);
    const t = createTournament(world, {
      kind: 'conference',
      nameKey: 'tournament.conference',
      nameParams: { conference: conf.id },
      season,
      rules: 'college',
      format: FORMATS.conference(seeded.length),
      teams: seeded,
      start: { year: world.date.year, week: WEEK.conferenceTournament },
    });
    s.college.conferenceTournaments[conf.id] = t.id;
  }
}

/** Automatic bids for conference tournament winners, the rest at large, seeded 1–64. */
export function createNationalTournament(world: World, season: number): TeamId[] {
  const s = world.seasons[String(season)];
  if (!s) return [];
  const auto = Object.values(s.college.conferenceTournaments)
    .map((id) => world.tournaments[id]?.champion)
    .filter((x): x is TeamId => !!x);
  const scored = colleges(world)
    .map((t) => ({ id: t.id, score: selectionScore(world, season, t) }))
    .sort((a, b) => b.score - a.score || (a.id < b.id ? -1 : 1));
  const field = new Set<TeamId>(auto);
  for (const t of scored) {
    if (field.size >= 64) break;
    field.add(t.id);
  }
  const seeded = scored.filter((t) => field.has(t.id)).map((t) => t.id);
  const t = createTournament(world, {
    kind: 'national',
    nameKey: 'tournament.national',
    season,
    rules: 'college',
    format: FORMATS.national,
    teams: seeded,
    start: { year: world.date.year, week: WEEK.nationalTournamentStart },
  });
  s.college.national = t.id;
  return seeded;
}
