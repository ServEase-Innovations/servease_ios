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
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
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
