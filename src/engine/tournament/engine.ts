/**
 * One tournament system for every competition: conference tournaments, the national
 * tournament, holiday events, international championships and pro playoffs.
 *
 * Games are scheduled lazily: a knockout round is created only when the round before it is
 * complete, and a series game only when the series is still undecided. The week runner plays
 * games slot by slot and calls `onTournamentGame` after each, so several rounds can share a week.
 */

import { addWeeks, type GameDate } from '../core/calendar';
import { asTournamentId, nextId, type TeamId } from '../core/ids';
import type { GameKind, GameRecord } from '../model/game';
import type { League } from '../model/person';
import type {
  Group,
  GroupStanding,
  KnockoutRound,
  Series,
  Tournament,
  TournamentFormat,
  TournamentKind,
} from '../model/tournament';
import type { World } from '../model/world';
import { createGame, loserOf, winnerOf } from '../world/games';

export interface TournamentSpec {
  readonly kind: TournamentKind;
  readonly nameKey: string;
  readonly nameParams?: Readonly<Record<string, string | number>>;
  readonly season: number;
  readonly rules: Tournament['rules'];
  readonly format: TournamentFormat;
  /** Entrants, best seed first. */
  readonly teams: readonly TeamId[];
  readonly start: GameDate;
  /** Higher seed hosts when the format is not neutral. */
}

const LEAGUE_OF: Record<Tournament['rules'], League> = {
  college: 'college',
  pro: 'pro',
  international: 'national',
};
const KIND_OF: Record<TournamentKind, GameKind> = {
  conference: 'tournament',
  national: 'tournament',
  holiday: 'tournament',
  proPlayoffs: 'playoff',
  international: 'international',
  showcase: 'showcase',
};

/** Standard bracket order for a power-of-two size: 1 v 16, 8 v 9, … */
export function bracketOrder(size: number): number[] {
  let order = [1];
  while (order.length < size) {
    const n = order.length * 2;
    order = order.flatMap((s) => [s, n + 1 - s]);
  }
  return order;
}

function knockoutRoundCount(size: number): number {
  let rounds = 0;
  for (let n = size; n > 1; n /= 2) rounds++;
  return rounds;
}

/** Week offset of each knockout round from the start of the knockout stage. */
function roundWeeks(format: TournamentFormat, groupWeeks: number): number[] {
  const rounds = knockoutRoundCount(format.knockout.size);
  const out: number[] = [];
  const perWeek = format.knockout.roundsPerWeek;
  const seriesWeeks = format.knockout.bestOf >= 5 ? 2 : 1;
  let week = groupWeeks;
  let used = 0;
  let w = 0;
  for (let r = 0; r < rounds; r++) {
    out.push(week);
    used += 1;
    const cap = perWeek[w] ?? perWeek[perWeek.length - 1] ?? 1;
    if (used >= cap) {
      week += seriesWeeks;
      used = 0;
      w += 1;
    }
  }
  return out;
}

export function createTournament(world: World, spec: TournamentSpec): Tournament {
  const id = asTournamentId(nextId(world.counters, 'tournament', 't'));
  const groupWeeks = spec.format.groups ? spec.format.groups.matchdaysPerWeek.length : 0;
  const t: Tournament = {
    id,
    kind: spec.kind,
    nameKey: spec.nameKey,
    nameParams: spec.nameParams ?? {},
    season: spec.season,
    rules: spec.rules,
    format: spec.format,
    teams: [...spec.teams],
    startWeek: spec.start.week,
    startYear: spec.start.year,
    stage: spec.format.groups ? 'groups' : 'knockout',
    groups: [],
    rounds: [],
    roundWeek: roundWeeks(spec.format, groupWeeks),
    thirdPlace: null,
    champion: null,
    placings: [],
  };
  world.tournaments[id] = t;
  if (spec.format.groups) startGroups(world, t);
  else startKnockout(world, t, seedForBracket(t, t.teams));
  return t;
}

function startDate(t: Tournament): GameDate {
  return { year: t.startYear, week: t.startWeek };
}

function makeGame(
  world: World,
  t: Tournament,
  home: TeamId,
  away: TeamId,
  weekOffset: number,
  slot: number,
  round: string,
): GameRecord {
  return createGame(world, {
    date: addWeeks(startDate(t), weekOffset),
    slot,
    league: LEAGUE_OF[t.rules],
    kind: KIND_OF[t.kind],
    home,
    away,
    neutral: t.format.neutral,
    tournamentId: t.id,
    round,
  });
}

// ---------------------------------------------------------------- groups

function startGroups(world: World, t: Tournament): void {
  const g = t.format.groups;
  if (!g) return;
  // Snake seeding into groups: pot 1 across, pot 2 back, …
  const groups: TeamId[][] = Array.from({ length: g.count }, () => []);
  t.teams.forEach((team, i) => {
    const pot = Math.floor(i / g.count);
    const pos = i % g.count;
    const index = pot % 2 === 0 ? pos : g.count - 1 - pos;
    groups[index]?.push(team);
  });
  t.groups = groups.map((teams, gi) => {
    const group: Group = {
      name: String.fromCharCode(65 + gi),
      standings: teams.map((teamId): GroupStanding => ({ teamId, w: 0, l: 0, pf: 0, pa: 0 })),
      games: [],
    };
    // Round robin (circle method), matchdays spread over the configured weeks.
    const list: (TeamId | null)[] = teams.length % 2 === 0 ? [...teams] : [...teams, null];
    const n = list.length;
    const days = n - 1;
    let matchday = 0;
    for (let r = 0; r < days; r++) {
      const { week, slot } = matchdaySlot(g.matchdaysPerWeek, matchday);
      for (let i = 0; i < n / 2; i++) {
        const a = list[i];
        const b = list[n - 1 - i];
        if (a && b)
          group.games.push(
            makeGame(
              world,
              t,
              r % 2 === 0 ? a : b,
              r % 2 === 0 ? b : a,
              week,
              slot,
              `group${group.name}`,
            ).id,
          );
      }
      list.splice(1, 0, list.pop() ?? null);
      matchday++;
    }
    return group;
  });
}

function matchdaySlot(
  perWeek: readonly number[],
  matchday: number,
): { week: number; slot: number } {
  let left = matchday;
  for (let w = 0; w < perWeek.length; w++) {
    const cap = perWeek[w] ?? 1;
    if (left < cap) return { week: w, slot: left };
    left -= cap;
  }
  return { week: perWeek.length - 1, slot: left };
}

function sortStandings(standings: readonly GroupStanding[]): GroupStanding[] {
  return [...standings].sort((a, b) => b.w - a.w || b.pf - b.pa - (a.pf - a.pa) || b.pf - a.pf);
}

function groupsComplete(world: World, t: Tournament): boolean {
  return t.groups.every((g) => g.games.every((id) => world.games[id]?.result));
}

function qualifiersFromGroups(t: Tournament): TeamId[] {
  const g = t.format.groups;
  if (!g) return [];
  const sorted = t.groups.map((group) => sortStandings(group.standings));
  const byPlace: GroupStanding[][] = [];
  for (let place = 0; place < g.advance; place++)
    byPlace.push(sorted.map((s) => s[place]).filter((x): x is GroupStanding => !!x));
  const thirds = sortStandings(
    sorted.map((s) => s[g.advance]).filter((x): x is GroupStanding => !!x),
  ).slice(0, g.bestThirds);
  // Seed: group winners first (by record), then runners-up, then best thirds.
  const seeded = [...byPlace.flatMap((place) => sortStandings(place)), ...thirds].map(
    (s) => s.teamId,
  );
  // Teams that did not qualify take the bottom placings, in group order.
  const out = t.teams.filter((team) => !seeded.includes(team));
  t.placings = sortOut(t, out);
  return seeded;
}

function sortOut(t: Tournament, teams: TeamId[]): TeamId[] {
  const stand = new Map(t.groups.flatMap((g) => g.standings.map((s) => [s.teamId, s] as const)));
  return [...teams].sort((a, b) => {
    const sa = stand.get(a);
    const sb = stand.get(b);
    if (!sa || !sb) return 0;
    return sb.w - sa.w || sb.pf - sb.pa - (sa.pf - sa.pa);
  });
}

// ---------------------------------------------------------------- knockout

/** Seeds teams into first-round positions. Regions use an S-curve across seed lines. */
function seedForBracket(t: Tournament, seeded: readonly TeamId[]): (TeamId | null)[] {
  const size = t.format.knockout.size;
  const regions = t.format.knockout.regions ?? 1;
  const regionSize = size / regions;
  const slots: (TeamId | null)[] = new Array<TeamId | null>(size).fill(null);
  const regionOrder = regions === 4 ? [0, 3, 1, 2] : Array.from({ length: regions }, (_, i) => i);
  const order = bracketOrder(regionSize);
  seeded.forEach((team, i) => {
    const line = Math.floor(i / regions);
    const within = i % regions;
    const snake = (t.format.knockout.regionSeeding ?? 'snake') === 'snake';
    const region = !snake || line % 2 === 0 ? within : regions - 1 - within;
    const seed = line + 1;
    const pos = order.indexOf(seed);
    const regionIndex = regionOrder.indexOf(region);
    if (pos >= 0 && regionIndex >= 0) slots[regionIndex * regionSize + pos] = team;
  });
  return slots;
}

function seedOf(t: Tournament, team: TeamId | null): number {
  if (!team) return 999;
  return t.teams.indexOf(team) + 1;
}

function startKnockout(world: World, t: Tournament, slots: readonly (TeamId | null)[]): void {
  t.stage = 'knockout';
  const series: Series[] = [];
  for (let i = 0; i < slots.length; i += 2) {
    series.push(newSeries(t, slots[i] ?? null, slots[i + 1] ?? null));
  }
  t.rounds = [{ index: 0, series }];
  scheduleRound(world, t, 0);
}

function newSeries(t: Tournament, x: TeamId | null, y: TeamId | null): Series {
  const [a, b] = seedOf(t, x) <= seedOf(t, y) ? [x, y] : [y, x];
  return {
    a,
    b,
    seedA: seedOf(t, a),
    seedB: seedOf(t, b),
    winsA: 0,
    winsB: 0,
    games: [],
    winner: null,
  };
}

function roundLabel(t: Tournament, round: number): string {
  const remaining = t.format.knockout.size / 2 ** round;
  return remaining === 2
    ? 'final'
    : remaining === 4
      ? 'semi'
      : remaining === 8
        ? 'quarter'
        : `r${remaining}`;
}

function slotForRound(t: Tournament, round: number): number {
  // Rounds sharing a week take consecutive slots after the group matchdays.
  const week = t.roundWeek[round] ?? 0;
  let slot = 0;
  for (let r = 0; r < round; r++) if (t.roundWeek[r] === week) slot++;
  return slot;
}

function scheduleRound(world: World, t: Tournament, round: number): void {
  const r = t.rounds[round];
  if (!r) return;
  for (const s of r.series) scheduleSeriesGame(world, t, round, s);
  maybeFinishRound(world, t, round);
}

function scheduleSeriesGame(world: World, t: Tournament, round: number, s: Series): void {
  if (s.winner) return;
  if (!s.a || !s.b) {
    s.winner = s.a ?? s.b;
    return;
  }
  const k = s.games.length;
  const bestOf = t.format.knockout.bestOf;
  const week = (t.roundWeek[round] ?? 0) + (bestOf >= 5 ? Math.floor(k / 4) : 0);
  const slot = bestOf >= 5 ? k % 4 : slotForRound(t, round);
  // 2-2-1-1-1 home pattern for series; higher seed at home in single games.
  const higherHome = bestOf === 1 || [0, 1, 4, 6].includes(k);
  const home = higherHome ? s.a : s.b;
  const away = higherHome ? s.b : s.a;
  s.games.push(makeGame(world, t, home, away, week, slot, roundLabel(t, round)).id);
}

function maybeFinishRound(world: World, t: Tournament, round: number): void {
  const r = t.rounds[round];
  if (!r || !r.series.every((s) => s.winner)) return;
  const winners = r.series.map((s) => s.winner);
  const losers = r.series
    .map((s) => (s.winner === s.a ? s.b : s.a))
    .filter((x): x is TeamId => !!x);
  if (winners.length === 1) {
    const champion = winners[0] ?? null;
    t.champion = champion;
    const runnerUp = losers[0];
    if (t.thirdPlace?.winner || !t.format.knockout.thirdPlace) {
      finish(t, champion, runnerUp);
    }
    return;
  }
  // Semi-final losers play for third.
  if (winners.length === 2 && t.format.knockout.thirdPlace && losers.length === 2) {
    const [x, y] = losers;
    t.thirdPlace = newSeries(t, x ?? null, y ?? null);
    scheduleSeriesGame(world, t, round + 1, t.thirdPlace);
  } else {
    t.placings = [...sortBySeed(t, losers), ...t.placings];
  }
  const next: Series[] = [];
  for (let i = 0; i < winners.length; i += 2)
    next.push(newSeries(t, winners[i] ?? null, winners[i + 1] ?? null));
  t.rounds.push({ index: round + 1, series: next } satisfies KnockoutRound);
  scheduleRound(world, t, round + 1);
}

function sortBySeed(t: Tournament, teams: TeamId[]): TeamId[] {
  return [...teams].sort((a, b) => seedOf(t, a) - seedOf(t, b));
}

function finish(t: Tournament, champion: TeamId | null, runnerUp: TeamId | undefined): void {
  const podium: TeamId[] = [];
  if (champion) podium.push(champion);
  if (runnerUp) podium.push(runnerUp);
  if (t.thirdPlace?.winner) {
    podium.push(t.thirdPlace.winner);
    const fourth = t.thirdPlace.winner === t.thirdPlace.a ? t.thirdPlace.b : t.thirdPlace.a;
    if (fourth) podium.push(fourth);
  }
  t.placings = [...podium, ...t.placings.filter((x) => !podium.includes(x))];
  t.stage = 'done';
}

// ---------------------------------------------------------------- results

/** Updates the tournament after one of its games is played and schedules what follows. */
export function onTournamentGame(world: World, game: GameRecord): void {
  if (!game.tournamentId || !game.result) return;
  const t = world.tournaments[game.tournamentId];
  if (!t || t.stage === 'done') return;
  const winner = winnerOf(game);
  const loser = loserOf(game);
  if (!winner || !loser) return;

  if (t.stage === 'groups') {
    for (const group of t.groups) {
      if (!group.games.includes(game.id)) continue;
      for (const s of group.standings) {
        if (s.teamId === game.home) {
          s.pf += game.result.home;
          s.pa += game.result.away;
        } else if (s.teamId === game.away) {
          s.pf += game.result.away;
          s.pa += game.result.home;
        } else continue;
        if (s.teamId === winner) s.w += 1;
        else s.l += 1;
      }
    }
    if (groupsComplete(world, t)) {
      const qualifiers = qualifiersFromGroups(t);
      startKnockout(world, t, crossGroupBracket(t, qualifiers));
    }
    return;
  }

  if (t.thirdPlace?.games.includes(game.id)) {
    t.thirdPlace.winner = winner;
    if (t.champion) {
      const final = t.rounds[t.rounds.length - 1]?.series[0];
      const runnerUp = final ? (final.winner === final.a ? final.b : final.a) : null;
      finish(t, t.champion, runnerUp ?? undefined);
    }
    return;
  }

  t.rounds.forEach((round, ri) => {
    for (const s of round.series) {
      if (!s.games.includes(game.id) || s.winner) continue;
      if (winner === s.a) s.winsA += 1;
      else s.winsB += 1;
      const need = Math.ceil(t.format.knockout.bestOf / 2);
      if (s.winsA >= need) s.winner = s.a;
      else if (s.winsB >= need) s.winner = s.b;
      else scheduleSeriesGame(world, t, ri, s);
      if (s.winner) maybeFinishRound(world, t, ri);
    }
  });
}

/** Group qualifiers into a bracket where teams from the same group meet as late as possible. */
function crossGroupBracket(t: Tournament, qualifiers: readonly TeamId[]): (TeamId | null)[] {
  const size = t.format.knockout.size;
  const groups = t.format.groups;
  if (!groups || groups.advance !== 2 || groups.bestThirds > 0 || qualifiers.length !== size) {
    // Fall back to a seeded bracket over the qualifiers in order.
    const order = bracketOrder(size);
    return order.map((seed) => qualifiers[seed - 1] ?? null);
  }
  const winners = t.groups.map((g) => sortStandings(g.standings)[0]?.teamId ?? null);
  const runners = t.groups.map((g) => sortStandings(g.standings)[1]?.teamId ?? null);
  const n = t.groups.length;
  const top: (TeamId | null)[] = [];
  const bottom: (TeamId | null)[] = [];
  for (let i = 0; i < n; i += 2) {
    top.push(winners[i] ?? null, runners[i + 1] ?? null);
    bottom.push(winners[i + 1] ?? null, runners[i] ?? null);
  }
  return [...top, ...bottom];
}

/** All games scheduled for this tournament so far. */
export function tournamentGames(world: World, t: Tournament): GameRecord[] {
  const ids = [
    ...t.groups.flatMap((g) => g.games),
    ...t.rounds.flatMap((r) => r.series.flatMap((s) => s.games)),
    ...(t.thirdPlace?.games ?? []),
  ];
  return ids.map((id) => world.games[id]).filter((g): g is GameRecord => !!g);
}

export function isTeamAlive(t: Tournament, team: TeamId): boolean {
  if (t.stage === 'done') return false;
  if (t.stage === 'groups') return t.teams.includes(team);
  const last = t.rounds[t.rounds.length - 1];
  return !!last?.series.some(
    (s) => (s.a === team || s.b === team) && (s.winner === null || s.winner === team),
  );
}
