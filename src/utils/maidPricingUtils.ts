export function formatInr(n: number): string {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

export function getBookingTypeFromPreference(bookingPreference?: string): string {
  if (!bookingPreference) return "MONTHLY";
  const pref = bookingPreference.toLowerCase().trim().replace(/_/g, " ");
  if (pref === "date" || pref === "on demand" || pref === "on-demand") return "ON_DEMAND";
  if (pref === "short term" || pref === "shortterm") return "SHORT_TERM";
  return "MONTHLY";
}

export function formatDateOnly(value?: string | null): string {
  if (!value) return "";
  const s = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const datePart = s.split("T")[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return datePart;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Parse API calendar dates (YYYY-MM-DD) in local time — avoids UTC midnight shifting the day. */
export function parseCalendarDateToDate(value?: string | null): Date | null {
  const ymd = formatDateOnly(value);
  if (!ymd) return null;
  const d = new Date(`${ymd}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function computeDurationDays(startDate?: string, endDate?: string): number {
  const start = formatDateOnly(startDate);
  if (!start) return 1;
  const end = formatDateOnly(endDate) || start;
  const s = new Date(`${start}T12:00:00`);
  const e = new Date(`${end}T12:00:00`);
  const diff = Math.round((e.getTime() - s.getTime()) / 86400000);
  return Math.max(1, diff + 1);
}

/** Normalize legacy snake_case booking fields from older iOS screens. */
export function normalizeBookingTypeFields(
  bt: Record<string, unknown> | null | undefined
): Record<string, unknown> | null {
  if (!bt) return null;
  return {
    ...bt,
    startDate: bt.startDate ?? bt.start_date,
    endDate: bt.endDate ?? bt.end_date,
    startTime: bt.startTime ?? bt.start_time,
    endTime: bt.endTime ?? bt.end_time,
    bookingPreference: bt.bookingPreference ?? bt.booking_preference,
  };
}
