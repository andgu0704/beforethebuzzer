/**
 * The league's own calendar: everything that happens in a week regardless of the user.
 * The career layer calls these around the user's own games; the headless simulation calls
 * `simulateLeagueWeek` directly.
 */

import { addWeeks, seasonOf, WEEK, weekIndex } from '../core/calendar';
import type { PersonId, TeamId } from '../core/ids';
import { createRng } from '../core/rng';
import type { ContentIndex } from '../content/registry';
import {
  makePick,
  npcWithdrawals,
  openDraft,
  runCombine,
  setDraftOrder,
  signDraftee,
  updateBoard,
} from '../draft/draft';
import type { StockAdjustments } from '../draft/scouting';
import { awardRankingPoints, startInternational } from '../international/summer';
import type { GameRecord } from '../model/game';
import type { ProTeam } from '../model/team';
import type { World } from '../model/world';
import { createTournament } from '../tournament/engine';
import { FORMATS } from '../tournament/formats';
import { collegeAwards, proAwards, tournamentStar } from './awards';
import { createConferenceTournaments, createNationalTournament, updatePoll } from './college-post';
import { developNpcs, healInjuries } from './development';
import { playLeagueGame } from './play';
import { rollover } from './rollover';
import { winPct } from './standings';

export interface LeagueContext {
  readonly index: ContentIndex;
  readonly userId: PersonId | null;
  readonly userCollege: TeamId | null;
  /** Extra draft-stock points (tournament form, events) by player id. */
  readonly stock: StockAdjustments;
  /** Players kept off national teams (the user, until he answers a call-up). */
  readonly nationalExclude: ReadonlySet<PersonId>;
  /** True if the career runs draft night itself. */
  readonly userDraftNight: boolean;
}

/** Start-of-week milestones: new competitions, the draft calendar, the season rollover. */
export function beginLeagueWeek(world: World, ctx: LeagueContext): void {
  const week = world.date.week;
  const season = seasonOf(world.date);
  if (week === WEEK.summerStart)
    rollover(world, ctx.index, { userId: ctx.userId, userCollege: ctx.userCollege });
  if (week === WEEK.u20Start || week === WEEK.seniorTournamentStart)
    startInternational(world, ctx.index, ctx.nationalExclude);
  if (week === WEEK.conferenceTournament) createConferenceTournaments(world, ctx.index, season);
  if (week === WEEK.nationalTournamentStart) createNationalTournament(world, season);
  if (week === WEEK.proPlayoffsStart) {
    createProPlayoffs(world, season);
    openDraft(world, ctx.userId, ctx.stock);
  }
  if (week === WEEK.lottery) {
    const playoffs = world.seasons[String(season)]?.pro.playoffs;
    setDraftOrder(world, playoffs ? (world.tournaments[playoffs]?.teams ?? []) : []);
    runCombine(world);
  }
  if (week === WEEK.withdrawDeadline) npcWithdrawals(world, ctx.userId);
  if (week > WEEK.proPlayoffsStart && week <= WEEK.draft) updateBoard(world, ctx.stock);
  if (week === WEEK.draft && !ctx.userDraftNight) runWholeDraft(world, ctx.stock);
}

export function createProPlayoffs(world: World, season: number): void {
  const s = world.seasons[String(season)];
  if (!s || s.pro.playoffs) return;
  const teams = Object.values(world.teams).filter((t): t is ProTeam => t.kind === 'pro');
  const seeded = (conf: 'east' | 'west') =>
    teams
      .filter((t) => t.conference === conf)
      .sort(
        (a, b) =>
          winPct(s.pro.records[b.id]) - winPct(s.pro.records[a.id]) || (a.id < b.id ? -1 : 1),
      )
      .slice(0, 8)
      .map((t) => t.id);
  const east = seeded('east');
  const west = seeded('west');
  // Interleaved so that 'straight' region seeding keeps each conference in its own half.
  const entrants = east.flatMap((e, i) => [e, west[i]]).filter((x): x is TeamId => !!x);
  const t = createTournament(world, {
    kind: 'proPlayoffs',
    nameKey: 'tournament.proPlayoffs',
    season,
    rules: 'pro',
    format: FORMATS.proPlayoffs,
    teams: entrants,
    start: world.date,
  });
  s.pro.playoffs = t.id;
}

export function runWholeDraft(world: World, stock: StockAdjustments): void {
  const draft = world.draft;
  if (!draft) return;
  while (draft.next < draft.picks.length) {
    const pick = makePick(world, null, stock);
    if (pick) signDraftee(world, pick);
  }
}

/** Games this week still to play, in slot order. */
export function gamesThisWeek(world: World): GameRecord[] {
  const now = weekIndex(world.date);
  return Object.values(world.games)
    .filter((g) => !g.result && weekIndex(g.date) === now)
    .sort((a, b) => a.slot - b.slot || (a.id < b.id ? -1 : 1));
}

/** Whether a finished game's box score is kept: only for teams the career follows (his own, his rival's). */
export function keepBoxFor(game: GameRecord, watched: ReadonlySet<TeamId>): boolean {
  return watched.has(game.home) || watched.has(game.away);
}

/** Plays every unplayed game in the lowest remaining slot, except those `skip` holds back. */
export function playNextSlot(
  world: World,
  skip: (g: GameRecord) => boolean,
  watched: ReadonlySet<TeamId>,
): { slot: number; held: GameRecord[] } | null {
  const pending = gamesThisWeek(world);
  const first = pending[0];
  if (!first) return null;
  const slot = first.slot;
  const held: GameRecord[] = [];
  for (const g of pending) {
    if (g.slot !== slot) break;
    if (skip(g)) held.push(g);
    else playLeagueGame(world, g, keepBoxFor(g, watched));
  }
  return { slot, held };
}

/** End-of-week upkeep: healing, development, polls, awards. Then the calendar moves on. */
export function endLeagueWeek(world: World, ctx: LeagueContext): void {
  const week = world.date.week;
  const season = seasonOf(world.date);
  const s = world.seasons[String(season)];
  healInjuries(world);
  if (weekIndex(world.date) % 4 === 0)
    developNpcs(world, createRng(world.seed, 'develop', weekIndex(world.date)), 4);
  if (week >= WEEK.nonConferenceStart || week <= WEEK.nationalTournamentEnd)
    updatePoll(world, season);
  if (s && week === WEEK.nationalTournamentEnd && !s.processed.includes('college')) {
    s.processed.push('college');
    const conferenceOf = (team: TeamId) => {
      const t = world.teams[team];
      return t?.kind === 'college' ? t.conferenceId : null;
    };
    s.awards.push(...collegeAwards(world, season, conferenceOf));
    const national = s.college.national ? world.tournaments[s.college.national] : undefined;
    if (national?.champion) {
      s.awards.push({
        kind: 'collegeChampion',
        personId: null,
        teamId: national.champion,
        scope: national.id,
      });
      s.awards.push({
        kind: 'tournamentMop',
        personId: tournamentStar(world, season, national.champion, 'college'),
        teamId: national.champion,
        scope: national.id,
      });
    }
  }
  if (s) {
    for (const id of [...s.international, ...(s.pro.playoffs ? [s.pro.playoffs] : [])]) {
      const t = world.tournaments[id];
      if (!t || t.stage !== 'done' || s.processed.includes(id)) continue;
      s.processed.push(id);
      if (t.kind === 'international') {
        awardRankingPoints(world, t);
        const medals = ['medalGold', 'medalSilver', 'medalBronze'] as const;
        medals.forEach((kind, i) => {
          const teamId = t.placings[i];
          if (teamId) s.awards.push({ kind, personId: null, teamId, scope: t.id });
        });
        if (t.champion)
          s.awards.push({
            kind: 'tournamentMvp',
            personId: tournamentStar(world, season, t.champion, 'national', t.id),
            teamId: t.champion,
            scope: t.id,
          });
      } else {
        if (t.champion)
          s.awards.push({ kind: 'proChampion', personId: null, teamId: t.champion, scope: t.id });
        s.awards.push(...proAwards(world, season));
      }
    }
  }
  world.date = addWeeks(world.date, 1);
}

/** A whole week with nobody watching: used by the headless simulation and simulate ahead. */
export function simulateLeagueWeek(world: World, ctx: LeagueContext): void {
  beginLeagueWeek(world, ctx);
  for (let guard = 0; guard < 40; guard++) {
    if (!playNextSlot(world, () => false, new Set())) break;
  }
  endLeagueWeek(world, ctx);
}
