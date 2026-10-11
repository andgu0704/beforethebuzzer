import { describe, expect, it } from 'vitest';

import { weekIndex } from '../core/calendar';
import { asTeamId, emptyCounters, type TeamId } from '../core/ids';
import { createRng } from '../core/rng';
import type { TournamentFormat } from '../model/tournament';
import type { World } from '../model/world';
import { createTournament, onTournamentGame, tournamentGames } from './engine';

function emptyWorld(): World {
  return {
    seed: 's',
    date: { year: 2030, week: 11 },
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
}

function teams(n: number): TeamId[] {
  return Array.from({ length: n }, (_, i) => asTeamId(`team${i + 1}`));
}

/** Plays every scheduled game in date order; the better seed wins 70% of the time. */
function playOut(world: World, id: string, seed: string) {
  const rng = createRng(seed);
  const t = world.tournaments[id]!;
  const played = new Set<string>();
  for (let guard = 0; guard < 2000; guard++) {
    const next = tournamentGames(world, t)
      .filter((g) => !played.has(g.id))
      .sort((a, b) => weekIndex(a.date) - weekIndex(b.date) || a.slot - b.slot)[0];
    if (!next) break;
    const homeBetter = t.teams.indexOf(next.home) < t.teams.indexOf(next.away);
    const homeWins = rng.chance(homeBetter ? 0.7 : 0.3);
    next.result = { home: homeWins ? 80 : 70, away: homeWins ? 70 : 80, overtimes: 0, box: null };
    played.add(next.id);
    onTournamentGame(world, next);
  }
  return t;
}

describe('tournament engine', () => {
  it('runs a 64-team, four-region bracket over three weeks', () => {
    const world = emptyWorld();
    const format: TournamentFormat = {
      knockout: { size: 64, bestOf: 1, thirdPlace: false, roundsPerWeek: [2, 2, 2], regions: 4 },
      neutral: true,
      momentsPerGame: [2, 3],
    };
    const t = createTournament(world, {
      kind: 'national',
      nameKey: 'n',
      season: 2030,
      rules: 'college',
      format,
      teams: teams(64),
      start: { year: 2030, week: 11 },
    });
    playOut(world, t.id, 'a');
    const games = tournamentGames(world, t);
    expect(games).toHaveLength(63);
    expect(t.stage).toBe('done');
    expect(t.champion).not.toBeNull();
    expect(new Set(t.placings).size).toBe(64);
    const weeks = new Set(games.map((g) => g.date.week));
    expect([...weeks].sort()).toEqual([11, 12, 13]);
    // 32 first-round series: the top two seeds sit in opposite halves, so they can only meet in the final.
    const first = t.rounds[0]!.series;
    const idx1 = first.findIndex((s) => s.a === 'team1');
    const idx2 = first.findIndex((s) => s.a === 'team2');
    expect(Math.floor(idx1 / 16)).not.toBe(Math.floor(idx2 / 16));
    // Each region (8 series) has exactly one 1-seed line team among the top four overall.
    const topFourRegions = ['team1', 'team2', 'team3', 'team4'].map((id) =>
      Math.floor(first.findIndex((s) => s.a === id) / 8),
    );
    expect(new Set(topFourRegions).size).toBe(4);
  });

  it('gives byes to top seeds in a 14-team conference tournament played in one week', () => {
    const world = emptyWorld();
    const format: TournamentFormat = {
      knockout: { size: 16, bestOf: 1, thirdPlace: false, roundsPerWeek: [4] },
      neutral: true,
      momentsPerGame: [1, 2],
    };
    const t = createTournament(world, {
      kind: 'conference',
      nameKey: 'c',
      season: 2030,
      rules: 'college',
      format,
      teams: teams(14),
      start: { year: 2030, week: 10 },
    });
    playOut(world, t.id, 'b');
    const games = tournamentGames(world, t);
    expect(games).toHaveLength(13);
    expect(games.every((g) => g.date.week === 10)).toBe(true);
    expect(Math.max(...games.map((g) => g.slot))).toBe(3);
    expect(t.champion).not.toBeNull();
  });

  it('runs groups then a knockout with a third-place game', () => {
    const world = emptyWorld();
    const format: TournamentFormat = {
      groups: { count: 4, size: 4, advance: 2, bestThirds: 0, matchdaysPerWeek: [3] },
      knockout: { size: 8, bestOf: 1, thirdPlace: true, roundsPerWeek: [2, 1] },
      neutral: true,
      momentsPerGame: [2, 3],
    };
    const t = createTournament(world, {
      kind: 'international',
      nameKey: 'i',
      season: 2030,
      rules: 'international',
      format,
      teams: teams(16),
      start: { year: 2030, week: 31 },
    });
    playOut(world, t.id, 'c');
    const games = tournamentGames(world, t);
    expect(games).toHaveLength(24 + 4 + 2 + 1 + 1);
    expect(t.placings.slice(0, 4)).toHaveLength(4);
    expect(new Set(t.placings).size).toBe(16);
    expect([...new Set(games.map((g) => g.date.week))].sort()).toEqual([31, 32, 33]);
  });

  it('plays best-of-seven series with only the games needed', () => {
    const world = emptyWorld();
    const format: TournamentFormat = {
      knockout: { size: 16, bestOf: 7, thirdPlace: false, roundsPerWeek: [1] },
      neutral: false,
      momentsPerGame: [1, 2],
    };
    const t = createTournament(world, {
      kind: 'proPlayoffs',
      nameKey: 'p',
      season: 2030,
      rules: 'pro',
      format,
      teams: teams(16),
      start: { year: 2030, week: 16 },
    });
    playOut(world, t.id, 'd');
    const games = tournamentGames(world, t);
    expect(t.champion).not.toBeNull();
    expect(games.length).toBeGreaterThanOrEqual(15 * 4);
    expect(games.length).toBeLessThanOrEqual(15 * 7);
    for (const round of t.rounds)
      for (const s of round.series) expect(Math.max(s.winsA, s.winsB)).toBe(4);
  });
});
