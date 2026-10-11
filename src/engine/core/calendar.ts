/**
 * The game calendar. One turn is one week; a year has 52 weeks. A *season* is named by the
 * year it ends in: season 2028 runs from week 27 of 2027 to week 26 of 2028, which covers a
 * college year, a pro season and the draft that closes it.
 */

export const WEEKS_PER_YEAR = 52;

export interface GameDate {
  readonly year: number;
  /** 1–52 */
  readonly week: number;
}

export type CollegePhase =
  | 'summer'
  | 'preseason'
  | 'nonConference'
  | 'conference'
  | 'conferenceTournament'
  | 'nationalTournament'
  | 'spring'
  | 'draftProcess';

/** Fixed weeks for each milestone of the year. */
export const WEEK = {
  summerStart: 27,
  u20Start: 28,
  seniorTournamentStart: 31,
  classesStart: 35,
  preseasonStart: 35,
  exhibition: 44,
  proSeasonStart: 43,
  nonConferenceStart: 45,
  holidayTournament: 48,
  fallGrades: 51,
  conferenceStart: 1,
  conferenceTournament: 10,
  nationalTournamentStart: 11,
  nationalTournamentEnd: 13,
  proSeasonEnd: 15,
  declareDeadline: 16,
  proPlayoffsStart: 16,
  springGrades: 19,
  combine: 20,
  lottery: 20,
  withdrawDeadline: 21,
  workoutsStart: 21,
  workoutsEnd: 24,
  draft: 26,
  recruitingStart: 14,
} as const;

export function seasonOf(date: GameDate): number {
  return date.week >= WEEK.summerStart ? date.year + 1 : date.year;
}

export function addWeeks(date: GameDate, weeks: number): GameDate {
  const index = date.year * WEEKS_PER_YEAR + (date.week - 1) + weeks;
  return { year: Math.floor(index / WEEKS_PER_YEAR), week: (index % WEEKS_PER_YEAR) + 1 };
}

/** Absolute week number, useful for differences and ordering. */
export function weekIndex(date: GameDate): number {
  return date.year * WEEKS_PER_YEAR + (date.week - 1);
}

export function weeksBetween(from: GameDate, to: GameDate): number {
  return weekIndex(to) - weekIndex(from);
}

export function collegePhase(week: number): CollegePhase {
  if (week >= WEEK.summerStart && week < WEEK.preseasonStart) return 'summer';
  if (week >= WEEK.preseasonStart && week < WEEK.nonConferenceStart) return 'preseason';
  if (week >= WEEK.nonConferenceStart) return 'nonConference';
  if (week < WEEK.conferenceTournament) return 'conference';
  if (week === WEEK.conferenceTournament) return 'conferenceTournament';
  if (week <= WEEK.nationalTournamentEnd) return 'nationalTournament';
  if (week < WEEK.combine) return 'spring';
  return 'draftProcess';
}

export function isProRegularSeason(week: number): boolean {
  return week >= WEEK.proSeasonStart || week <= WEEK.proSeasonEnd;
}

/** Week of the pro regular season, 1-based, or 0 outside it. */
export function proSeasonWeek(week: number): number {
  if (week >= WEEK.proSeasonStart) return week - WEEK.proSeasonStart + 1;
  if (week <= WEEK.proSeasonEnd) return WEEKS_PER_YEAR - WEEK.proSeasonStart + 1 + week;
  return 0;
}

export const PRO_REGULAR_SEASON_WEEKS = proSeasonWeek(WEEK.proSeasonEnd);

/** Age in whole years for someone born in `birthYear` (birthdays fall on week 1). */
export function ageAt(birthYear: number, date: GameDate): number {
  return date.year - birthYear;
}

/** Monday of the week as [month 1–12, day], for display. Uses a 364-day year starting Jan 1. */
export function weekStartDay(week: number): { month: number; day: number } {
  const monthLengths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let day = (week - 1) * 7 + 1;
  let month = 0;
  while (month < 11 && day > (monthLengths[month] ?? 31)) {
    day -= monthLengths[month] ?? 31;
    month++;
  }
  return { month: month + 1, day };
}
