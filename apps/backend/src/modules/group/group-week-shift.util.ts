import {
  addDaysToDateStr,
  diffInDays,
  getUpcomingSaturdayFrom,
  getWeekEndDate,
  isSaturday,
  type ISODateOnlyString,
} from '@wirdi/shared';

type WeekDates = { id: string; startDate: ISODateOnlyString };
export type ShiftedWeek = WeekDates & { endDate: ISODateOnlyString };

/**
 * Plans how to move a paused group's upcoming weeks when it becomes active again.
 *
 * - The week the pause happened in (start <= pausedOn) is considered done and never moves.
 * - Every later week moves by the same number of days, so the first one starts on the
 *   upcoming Saturday from `today`; spacing, order and Saturday starts are preserved.
 * - Returned latest-first: applying updates in this order never lands a week on a start
 *   date another week still holds (@@unique([groupId, startDate])).
 */
export function planWeekShift(
  weeks: WeekDates[],
  pausedOn: ISODateOnlyString,
  today: ISODateOnlyString
): ShiftedWeek[] {
  const upcoming = weeks
    .filter((w) => w.startDate > pausedOn)
    .sort((a, b) => b.startDate.localeCompare(a.startDate));
  if (!upcoming.length) return [];

  const earliestStart = upcoming[upcoming.length - 1].startDate;
  const shiftDays = diffInDays(earliestStart, getUpcomingSaturdayFrom(today));
  if (shiftDays <= 0) return [];

  return upcoming.map((week) => {
    const startDate = addDaysToDateStr(week.startDate, shiftDays);
    if (!isSaturday(startDate))
      throw new Error(`Shifted week ${week.id} does not start on Saturday`);
    return { id: week.id, startDate, endDate: getWeekEndDate(startDate) };
  });
}
