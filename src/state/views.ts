/**
 * Read-only views of the game state for screens. Nothing here changes the state; every
 * function is cheap enough to call during render.
 */

import { content } from '@/content';
import { userOf, userTeamId, type GameState } from '@/engine/career/state';
import { collegePhase, seasonOf, weekIndex, type GameDate } from '@/engine/core/calendar';
import type { TeamId } from '@/engine/core/ids';
import type { FeedEntry } from '@/engine/model/career';
import type { GameRecord, TeamRecord } from '@/engine/model/game';
import type { Team } from '@/engine/model/team';
import type { Tournament } from '@/engine/model/tournament';
import { conferenceStandings } from '@/engine/season/standings';

export const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** Month (1–12) and day for a day of the year counted from 1 (the game's 364-day year wraps). */
function fromDayOfYear(dayOfYear: number): { month: number; day: number } {
  let d = ((dayOfYear - 1) % 365) + 1;
  let month = 0;
  while (month < 11 && d > (MONTH_DAYS[month] ?? 31)) {
    d -= MONTH_DAYS[month] ?? 31;
    month++;
  }
  return { month: month + 1, day: d };
}

function label(dayOfYear: number): string {
  const { month, day } = fromDayOfYear(dayOfYear);
  return `${MONTHS[month - 1] ?? ''} ${day}`;
}

export function dayLabel(week: number, offset = 0): string {
  return label((week - 1) * 7 + 1 + offset);
}

/** "Jan 12–18", or "Jun 25–Jul 1" across a month end. */
export function weekRange(week: number): string {
  const first = (week - 1) * 7 + 1;
  const a = fromDayOfYear(first);
  const b = fromDayOfYear(first + 6);
  return a.month === b.month ? `${label(first)}–${b.day}` : `${label(first)}–${label(first + 6)}`;
}

export type PhaseKey =
  | 'highSchool'
  | 'summer'
  | 'preseason'
  | 'nonConference'
  | 'conference'
  | 'conferenceTournament'
  | 'nationalTournament'
  | 'spring'
  | 'draftProcess'
  | 'done';

export function phaseOf(state: GameState, date: GameDate = state.world.date): PhaseKey {
  if (state.career.ending) return 'done';
  if (state.career.stage === 'highSchool') return 'highSchool';
  return collegePhase(date.week);
}

export function currentTeam(state: GameState): Team | null {
  const id = userTeamId(state) ?? state.career.committedTo;
  return id ? (state.world.teams[id] ?? null) : null;
}

export function recordOf(
  state: GameState,
  teamId: TeamId,
  season = seasonOf(state.world.date),
): TeamRecord | null {
  const s = state.world.seasons[String(season)];
  if (!s) return null;
  return s.college.records[teamId] ?? s.pro.records[teamId] ?? null;
}

export function recordText(r: TeamRecord | null): string {
  return r ? `${r.w}–${r.l}` : '0–0';
}

/** Place in the conference table, 1-based, and the conference's short name. */
export function conferencePlace(
  state: GameState,
  teamId: TeamId,
): { place: number; conference: string } | null {
  const team = state.world.teams[teamId];
  if (team?.kind !== 'college') return null;
  const season = seasonOf(state.world.date);
  if (!state.world.seasons[String(season)]) return null;
  const table = conferenceStandings(state.world, season, team.conferenceId);
  const conf = content.conferences.find((c) => c.id === team.conferenceId);
  return { place: table.indexOf(teamId) + 1, conference: conf?.shortName ?? '' };
}

export function pollRank(state: GameState, teamId: TeamId): number | null {
  const s = state.world.seasons[String(seasonOf(state.world.date))];
  const latest = s?.college.polls[s.college.polls.length - 1];
  if (!latest) return null;
  const i = latest.ranking.indexOf(teamId);
  return i >= 0 ? i + 1 : null;
}

export interface WeekGroup {
  readonly key: string;
  readonly date: GameDate;
  readonly entries: readonly FeedEntry[];
}

const KIND_ORDER: Record<string, number> = {
  game: 0,
  moment: 0,
  draft: 1,
  milestone: 1,
  injury: 1,
  event: 2,
  news: 3,
  social: 4,
  development: 5,
  week: 6,
};

/**
 * A week's entries in reading order: each game followed by its key moments, then milestones,
 * decisions, news, social posts and training, each group in the order it happened.
 */
export function orderWeek(entries: readonly FeedEntry[]): FeedEntry[] {
  const games = entries.filter((e) => e.kind === 'game');
  const out: FeedEntry[] = [];
  for (const g of games) {
    out.push(g);
    for (const m of entries) if (m.kind === 'moment' && m.gameId === g.gameId) out.push(m);
  }
  const rest = entries.filter((e) => !out.includes(e));
  rest.sort((a, b) => (KIND_ORDER[a.kind] ?? 9) - (KIND_ORDER[b.kind] ?? 9));
  return [...out, ...rest];
}

/** Feed entries grouped by week, newest week first. */
export function feedByWeek(feed: readonly FeedEntry[]): WeekGroup[] {
  const groups = new Map<number, FeedEntry[]>();
  for (const f of feed) {
    const k = weekIndex(f.date);
    const list = groups.get(k);
    if (list) list.push(f);
    else groups.set(k, [f]);
  }
  return [...groups.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([k, entries]) => ({
      key: String(k),
      date: entries[0]?.date ?? { year: 0, week: 0 },
      entries: orderWeek(entries),
    }));
}

/** The user's team's games this season, in date order. */
export function teamSchedule(state: GameState, teamId: TeamId): GameRecord[] {
  const season = seasonOf(state.world.date);
  const out: GameRecord[] = [];
  for (const g of Object.values(state.world.games)) {
    if (g.home !== teamId && g.away !== teamId) continue;
    if (seasonOf(g.date) !== season) continue;
    out.push(g);
  }
  return out.sort((a, b) => weekIndex(a.date) - weekIndex(b.date) || a.slot - b.slot);
}

export function userGameLine(state: GameState, g: GameRecord) {
  const box = g.result?.box;
  if (!box) return null;
  return (
    [...box.home.players, ...box.away.players].find((l) => l.id === state.career.playerId) ?? null
  );
}

export function ageOf(state: GameState): number {
  const u = userOf(state);
  return state.world.date.year - u.birthYear;
}

/** Grades become a header meter when they are close to the eligibility line. */
export const GPA_LINE = 2.0;
export function gradesAtRisk(state: GameState): boolean {
  return state.career.stage === 'college' && state.career.gpa < GPA_LINE + 0.35;
}

/** This season's tournaments that include any of these teams, earliest first. */
export function tournamentsFor(state: GameState, teamIds: readonly string[]): Tournament[] {
  const season = seasonOf(state.world.date);
  return Object.values(state.world.tournaments)
    .filter((t) => t.season === season && t.teams.some((id) => teamIds.includes(id)))
    .sort((a, b) => a.startYear * 52 + a.startWeek - (b.startYear * 52 + b.startWeek));
}

/** A tournament's display name, with a conference id in its parameters turned into the conference's name. */
export function tournamentName(
  tour: Tournament,
  t: (key: string, params?: Readonly<Record<string, string | number>>) => string,
): string {
  const params: Record<string, string | number> = { ...tour.nameParams };
  const conf = params['conference'];
  if (typeof conf === 'string') {
    const def = content.conferences.find((c) => c.id === conf);
    if (def) params['conference'] = def.shortName;
  }
  return t(tour.nameKey, params);
}
