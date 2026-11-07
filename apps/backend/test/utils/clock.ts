import type { ISODateOnlyString } from '@wirdi/shared';

/**
 * Moves "now" for both the test and the in-process app.
 * Only `Date` is faked so timers used by the DB driver and supertest keep working.
 */
export function setToday(date: string, time = '10:00:00') {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(`${date}T${time}Z`));
}

/** Brands a literal like '2026-01-03' as a date-only string for the shared date helpers. */
export const day = (date: string) => date as ISODateOnlyString;

export function restoreClock() {
  vi.useRealTimers();
}
