import {
  diffInDays,
  getUpcomingSaturdayFrom,
  getWeekEndDate,
  getWeekStartDate,
  type ISODateOnlyString,
} from '@wirdi/shared';
import { planWeekShift } from './group-week-shift.util';

const day = (date: string) => date as ISODateOnlyString;
const toWeeks = (starts: Record<string, string>) =>
  Object.entries(starts).map(([id, start]) => ({ id, startDate: day(start) }));

// 2026-01-03 is a Saturday. Weeks run Saturday → Thursday.
const weeks = toWeeks({ w1: '2026-01-03', w2: '2026-01-10', w3: '2026-01-17', w4: '2026-01-24' });
const PAUSED_ON = day('2026-01-13'); // Tuesday of week 2

describe('date helpers', () => {
  it.each([
    ['2026-01-03', '2026-01-03'], // Saturday → itself
    ['2026-01-04', '2026-01-10'], // Sunday
    ['2026-01-07', '2026-01-10'], // Wednesday
    ['2026-01-09', '2026-01-10'], // Friday
  ])('getUpcomingSaturdayFrom(%s) = %s', (date, saturday) => {
    expect(getUpcomingSaturdayFrom(day(date))).toBe(saturday);
  });

  it.each([
    ['2026-01-03', '2026-01-03'], // Saturday → itself
    ['2026-01-08', '2026-01-03'], // Thursday
    ['2026-01-09', '2026-01-03'], // Friday
  ])('getWeekStartDate(%s) = %s', (date, saturday) => {
    expect(getWeekStartDate(day(date))).toBe(saturday);
  });

  it('getWeekEndDate ends the week on Thursday', () => {
    expect(getWeekEndDate(day('2026-01-03'))).toBe('2026-01-08');
  });

  it('diffInDays counts whole days in both directions', () => {
    expect(diffInDays(day('2026-01-03'), day('2026-01-24'))).toBe(21);
    expect(diffInDays(day('2026-01-24'), day('2026-01-03'))).toBe(-21);
  });
});

describe('planWeekShift', () => {
  it('keeps the paused week and moves later weeks to the upcoming Saturday', () => {
    expect(planWeekShift(weeks, PAUSED_ON, day('2026-02-04'))).toEqual([
      { id: 'w4', startDate: '2026-02-14', endDate: '2026-02-19' },
      { id: 'w3', startDate: '2026-02-07', endDate: '2026-02-12' },
    ]);
  });

  it('starts on the resume day itself when it is a Saturday', () => {
    expect(planWeekShift(weeks, PAUSED_ON, day('2026-02-07')).at(-1)?.startDate).toBe('2026-02-07');
  });

  it('preserves gaps between weeks', () => {
    const withGap = toWeeks({ w3: '2026-01-17', w5: '2026-01-31' });
    const [later, earlier] = planWeekShift(withGap, PAUSED_ON, day('2026-02-04'));
    expect(diffInDays(earlier.startDate, later.startDate)).toBe(14);
  });

  it('moves nothing when resumed before the next week starts', () => {
    expect(planWeekShift(weeks, PAUSED_ON, day('2026-01-15'))).toEqual([]);
  });

  it('moves nothing when no week comes after the pause', () => {
    expect(planWeekShift(weeks, day('2026-01-27'), day('2026-03-04'))).toEqual([]);
  });

  it('returns weeks latest-first so updates never collide on startDate', () => {
    const ids = planWeekShift(weeks, day('2026-01-05'), day('2026-03-04')).map((w) => w.id);
    expect(ids).toEqual(['w4', 'w3', 'w2']);
  });
});
