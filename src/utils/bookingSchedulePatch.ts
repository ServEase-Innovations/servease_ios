const TIME_HM = /^\d{1,2}:\d{2}$/;

/** Parse "HH:mm" or "HH:mm-HH:mm" into start/end tokens. */
export function parseTimeRangeParts(timeRange: string): { start: string; end: string } {
  const trimmed = timeRange.trim();
  if (!trimmed) return { start: "", end: "" };
  if (trimmed.includes("-")) {
    const [start, end] = trimmed.split("-").map((s) => s.trim());
    return { start: start || "", end: end || "" };
  }
  return { start: trimmed, end: "" };
}

/**
 * Normalize Redux booking fields into start/end times.
 * Short-term bookings often store only daily start in `timeRange` while duration lives in `timeSlot`.
 */
export function resolveScheduleTimeFields(
  booking: Record<string, unknown> | null | undefined
): { startTime: string; endTime: string } {
  if (!booking) return { startTime: "", endTime: "" };

  let startTime = String(booking.startTime ?? "").trim();
  let endTime = String(booking.endTime ?? "").trim();

  const rangeParts = parseTimeRangeParts(String(booking.timeRange ?? ""));
  if (!startTime && rangeParts.start) startTime = rangeParts.start;
  if (!endTime && rangeParts.end) endTime = rangeParts.end;

  const timeSlot = String(booking.timeSlot ?? "").trim();
  if (timeSlot.includes("-")) {
    const [slotStart, slotEnd] = timeSlot.split("-").map((s) => s.trim());
    if (!startTime && slotStart) startTime = slotStart;
    if (!endTime && slotEnd) endTime = slotEnd;
  } else if (!startTime && timeSlot) {
    startTime = timeSlot;
  }

  const valid = (t: string) => TIME_HM.test(t);
  return {
    startTime: valid(startTime) ? startTime : "",
    endTime: valid(endTime) ? endTime : "",
  };
}
