import dayjs, { Dayjs } from "dayjs";

/** Normalize any date input to start-of-day for consistent inclusive day math. */
export function toCalendarDay(
  value: Dayjs | Date | string | null | undefined
): Dayjs | null {
  if (value == null) return null;
  const d = dayjs(value);
  return d.isValid() ? d.startOf("day") : null;
}

/** Inclusive calendar-day count between two dates (e.g. Jun 16–Jun 25 = 10 days). */
export function countInclusiveDays(
  start: Dayjs | Date | string,
  end: Dayjs | Date | string
): number {
  const s = toCalendarDay(start);
  const e = toCalendarDay(end);
  if (!s || !e) return 0;
  return e.diff(s, "day") + 1;
}
