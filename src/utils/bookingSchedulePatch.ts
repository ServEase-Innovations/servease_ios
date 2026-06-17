import type { Dayjs } from "dayjs";
import { formatDateOnly } from "./maidPricingUtils";

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

export function buildReduxBookingPatch(
  preference: string,
  startDate: Dayjs | null,
  endDate: Dayjs | null,
  startTime: Dayjs | null,
  endTime: Dayjs | null,
  existing: Record<string, unknown> | null
) {
  const startYmd =
    (startDate && formatDateOnly(startDate.format("YYYY-MM-DD"))) ||
    (startTime && formatDateOnly(startTime.format("YYYY-MM-DD"))) ||
    "";
  const endYmd =
    (endDate && formatDateOnly(endDate.format("YYYY-MM-DD"))) ||
    (preference === "Monthly" && startDate
      ? formatDateOnly(startDate.add(1, "month").format("YYYY-MM-DD"))
      : startYmd);

  let timeRange = "";
  let timeSlot = "";
  if (preference === "Date") {
    timeRange = `${startTime?.format("HH:mm") || ""}-${endTime?.format("HH:mm") || ""}`;
    timeSlot = timeRange;
  } else if (preference === "Short term") {
    timeRange = startTime?.format("HH:mm") || "";
    timeSlot = `${startTime?.format("HH:mm") || ""}-${endTime?.format("HH:mm") || ""}`;
  } else {
    timeRange = startTime?.format("HH:mm") || "";
    timeSlot = `${startTime?.format("HH:mm") || ""}-${endTime?.format("HH:mm") || ""}`;
  }

  const patch: Record<string, unknown> = {
    ...(existing ?? {}),
    startDate: startYmd,
    endDate: endYmd,
    timeRange,
    bookingPreference: preference,
    startTime: startTime?.format("HH:mm") || "",
    endTime: endTime?.format("HH:mm") || "",
    timeSlot,
  };

  if (!startTime && !endTime) {
    patch.timeRange = "";
    patch.timeSlot = "";
    patch.startTime = "";
    patch.endTime = "";
  }

  return patch;
}
