import { describe, expect, it } from 'vitest';

import {
  addWeeks,
  collegePhase,
  PRO_REGULAR_SEASON_WEEKS,
  seasonOf,
  weekStartDay,
  weeksBetween,
  WEEK,
} from './calendar';

describe('calendar', () => {
  it('names seasons by the year they end', () => {
    expect(seasonOf({ year: 2027, week: 27 })).toBe(2028);
    expect(seasonOf({ year: 2028, week: 26 })).toBe(2028);
  });

  it('adds weeks across year boundaries', () => {
    expect(addWeeks({ year: 2027, week: 50 }, 5)).toEqual({ year: 2028, week: 3 });
    expect(addWeeks({ year: 2028, week: 3 }, -5)).toEqual({ year: 2027, week: 50 });
    expect(weeksBetween({ year: 2027, week: 50 }, { year: 2028, week: 3 })).toBe(5);
  });

  it('assigns every week a college phase', () => {
    expect(collegePhase(30)).toBe('summer');
    expect(collegePhase(40)).toBe('preseason');
    expect(collegePhase(50)).toBe('nonConference');
    expect(collegePhase(5)).toBe('conference');
    expect(collegePhase(WEEK.conferenceTournament)).toBe('conferenceTournament');
    expect(collegePhase(12)).toBe('nationalTournament');
    expect(collegePhase(15)).toBe('spring');
    expect(collegePhase(WEEK.draft)).toBe('draftProcess');
  });

  it('has a pro regular season long enough for 82 games at three a week', () => {
    expect(PRO_REGULAR_SEASON_WEEKS).toBe(25);
    expect(PRO_REGULAR_SEASON_WEEKS * 3.4).toBeGreaterThanOrEqual(82);
  });

  it('maps weeks to calendar days', () => {
    expect(weekStartDay(1)).toEqual({ month: 1, day: 1 });
    expect(weekStartDay(14)).toEqual({ month: 4, day: 2 });
  });
});
