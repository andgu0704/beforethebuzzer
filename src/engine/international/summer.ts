import { seasonOf, WEEK } from '../core/calendar';
import type { PersonId, TeamId } from '../core/ids';
import type { Continent } from '../content/world-types';
import type { ContentIndex } from '../content/registry';
import type { Tournament, TournamentFormat } from '../model/tournament';
import type { World } from '../model/world';
import { createTournament } from '../tournament/engine';
import { FORMATS } from '../tournament/formats';
import { selectSquad } from './selection';

/** The four-year senior cycle: continental, World Championship, Summer Games, a free summer. */
export type SeniorEvent = 'continental' | 'world' | 'summerGames' | null;

export function seniorEventFor(year: number): SeniorEvent {
  const phase = ((year % 4) + 4) % 4;
  return phase === 0 ? 'continental' : phase === 1 ? 'world' : phase === 2 ? 'summerGames' : null;
}

const CONTINENT_KEYS: Record<Continent, string> = {
  europe: 'tournament.europeanChampionship',
  americas: 'tournament.americasChampionship',
  asiaPacific: 'tournament.asiaPacificChampionship',
  africa: 'tournament.africanChampionship',
};

function rankedNations(world: World, index: ContentIndex, continent?: Continent): string[] {
  return index.content.nations
    .filter((n) => !continent || n.continent === continent)
    .map((n) => n.code)
    .sort(
      (a, b) =>
        (world.nations[b]?.points ?? 0) - (world.nations[a]?.points ?? 0) || (a < b ? -1 : 1),
    );
}

function formatForField(size: number): { format: TournamentFormat; field: number } {
  if (size >= 16) return { format: FORMATS.continental, field: 16 };
  return { format: FORMATS.continental8, field: 8 };
}

function pickSquads(
  world: World,
  codes: readonly string[],
  level: 'senior' | 'u20',
  exclude: ReadonlySet<PersonId>,
): TeamId[] {
  const teams: TeamId[] = [];
  for (const code of codes) {
    const nation = world.nations[code];
    if (!nation) continue;
    const teamId = level === 'senior' ? nation.seniorTeam : nation.u20Team;
    const team = world.teams[teamId];
    if (!team) continue;
    team.roster = selectSquad(world, { nation: code, level, exclude }).map((p) => p.id);
    teams.push(teamId);
  }
  return teams;
}

/** Creates this summer's international competitions at the right week. */
export function startInternational(
  world: World,
  index: ContentIndex,
  exclude: ReadonlySet<PersonId> = new Set(),
): Tournament[] {
  const week = world.date.week;
  const year = world.date.year;
  const season = seasonOf(world.date);
  const created: Tournament[] = [];
  const add = (t: Tournament) => {
    created.push(t);
    world.seasons[String(season)]?.international.push(t.id);
  };
  if (week === WEEK.u20Start) {
    for (const continent of ['europe', 'americas', 'asiaPacific', 'africa'] as const) {
      const nations = rankedNations(world, index, continent);
      const { format, field } = formatForField(nations.length);
      const entrants = pickSquads(world, nations.slice(0, field), 'u20', exclude);
      if (entrants.length < 8) continue;
      add(
        createTournament(world, {
          kind: 'international',
          nameKey: CONTINENT_KEYS[continent],
          nameParams: { level: 'u20' },
          season,
          rules: 'international',
          format,
          teams: entrants,
          start: { year, week },
        }),
      );
    }
  }
  if (week === WEEK.seniorTournamentStart) {
    const event = seniorEventFor(year);
    if (event === 'continental') {
      for (const continent of ['europe', 'americas', 'asiaPacific', 'africa'] as const) {
        const nations = rankedNations(world, index, continent);
        const { format, field } = formatForField(nations.length);
        const entrants = pickSquads(world, nations.slice(0, field), 'senior', exclude);
        if (entrants.length < 8) continue;
        add(
          createTournament(world, {
            kind: 'international',
            nameKey: CONTINENT_KEYS[continent],
            nameParams: { level: 'senior' },
            season,
            rules: 'international',
            format,
            teams: entrants,
            start: { year, week },
          }),
        );
      }
    } else if (event === 'world' || event === 'summerGames') {
      const size = event === 'world' ? 32 : 12;
      const entrants = pickSquads(
        world,
        rankedNations(world, index).slice(0, size),
        'senior',
        exclude,
      );
      add(
        createTournament(world, {
          kind: 'international',
          nameKey: event === 'world' ? 'tournament.worldChampionship' : 'tournament.summerGames',
          nameParams: { level: 'senior' },
          season,
          rules: 'international',
          format: event === 'world' ? FORMATS.world : FORMATS.summerGames,
          teams: entrants,
          start: { year, week },
        }),
      );
    }
  }
  return created;
}

/** Ranking points from a finished tournament's placings. */
export function awardRankingPoints(world: World, t: Tournament): void {
  const weight =
    t.nameParams['level'] === 'u20'
      ? 0.25
      : t.nameKey === 'tournament.worldChampionship' || t.nameKey === 'tournament.summerGames'
        ? 1.4
        : 1;
  t.placings.forEach((teamId, i) => {
    const team = world.teams[teamId];
    if (team?.kind !== 'national') return;
    const nation = world.nations[team.nation];
    if (!nation) return;
    nation.points = Math.round(nation.points * 0.96 + Math.max(0, 40 - i * 3) * weight);
  });
}
