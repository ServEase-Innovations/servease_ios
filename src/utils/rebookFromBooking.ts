import dayjs from "dayjs";
import {
  computeDurationDays,
  getBookingTypeFromPreference,
} from "./maidPricingUtils";
import { normalizeGeoLocationPayload } from "./bookingLocation";

export type RebookSourceBooking = {
  service_type: string;
  bookingType: string;
  startDate?: string;
  endDate?: string;
  start_time?: string;
  end_time?: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  responsibilities?: { tasks?: unknown[]; add_ons?: unknown[] };
};

export type RebookReduxPayload = {
  startDate: string;
  endDate: string;
  timeRange: string;
  bookingPreference: string;
  housekeepingRole: "COOK" | "MAID" | "NANNY";
  startTime: string;
  endTime: string;
  timeSlot: string;
  responsibilities?: { tasks?: unknown[]; add_ons?: unknown[] };
};

function bookingPreferenceFromType(bookingType: string): string {
  const code = String(bookingType || "").toUpperCase();
  if (code === "ON_DEMAND") return "Date";
  if (code === "SHORT_TERM") return "Short term";
  return "Monthly";
}

function housekeepingRoleFromServiceType(
  serviceType: string
): RebookReduxPayload["housekeepingRole"] | null {
  const normalized = String(serviceType || "").toLowerCase().trim();
  if (normalized === "cook") return "COOK";
  if (normalized === "maid") return "MAID";
  if (normalized === "nanny") return "NANNY";
  return null;
}

function computeRebookDates(
  bookingTypeCode: string,
  originalStart?: string,
  originalEnd?: string
): { startDate: string; endDate: string } {
  const today = dayjs().format("YYYY-MM-DD");

  if (bookingTypeCode === "ON_DEMAND") {
    return { startDate: today, endDate: today };
  }

  const durationDays = computeDurationDays(originalStart, originalEnd);
  const endDate = dayjs(today)
    .add(Math.max(0, durationDays - 1), "day")
    .format("YYYY-MM-DD");

  return { startDate: today, endDate };
}

function normalizeHm(value?: string): string {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const parsed = dayjs(raw, ["HH:mm", "H:mm", "hh:mm A", "h:mm A"], true);
  return parsed.isValid() ? parsed.format("HH:mm") : raw;
}

function inferEndTime(startTime: string, endTime: string, bookingTypeCode: string): string {
  if (endTime) return endTime;
  if (!startTime) return "";
  if (bookingTypeCode !== "ON_DEMAND") return endTime;

  const parsed = dayjs(startTime, "HH:mm", true);
  if (!parsed.isValid()) return "";
  return parsed.add(1, "hour").format("HH:mm");
}

function buildTimeFields(
  bookingPreference: string,
  startTime: string,
  endTime: string
): Pick<RebookReduxPayload, "timeRange" | "timeSlot" | "startTime" | "endTime"> {
  if (bookingPreference === "Date") {
    const range = `${startTime}-${endTime}`;
    return { timeRange: range, timeSlot: range, startTime, endTime };
  }
  if (bookingPreference === "Short term") {
    return {
      timeRange: startTime,
      timeSlot: `${startTime}-${endTime}`,
      startTime,
      endTime,
    };
  }
  const resolvedEnd =
    endTime ||
    (startTime && dayjs(startTime, "HH:mm", true).isValid()
      ? dayjs(startTime, "HH:mm").add(1, "hour").format("HH:mm")
      : "");
  return {
    timeRange: startTime,
    timeSlot: startTime && resolvedEnd ? `${startTime}-${resolvedEnd}` : startTime,
    startTime,
    endTime: resolvedEnd,
  };
}

export function isOnDemandBookingType(bookingType?: string): boolean {
  return String(bookingType || "").toUpperCase() === "ON_DEMAND";
}

export function buildRebookPayload(
  booking: RebookSourceBooking,
  options?: { serviceProviderId?: number | null }
): RebookReduxPayload | null {
  const housekeepingRole = housekeepingRoleFromServiceType(booking.service_type);
  if (!housekeepingRole) return null;

  const bookingPreference = bookingPreferenceFromType(booking.bookingType);
  const bookingTypeCode = getBookingTypeFromPreference(bookingPreference);
  const { startDate, endDate } = computeRebookDates(
    bookingTypeCode,
    booking.startDate,
    booking.endDate
  );

  const startTime = normalizeHm(booking.start_time);
  const endTime = inferEndTime(
    startTime,
    normalizeHm(booking.end_time),
    bookingTypeCode
  );
  const timeFields = buildTimeFields(bookingPreference, startTime, endTime);

  const payload: RebookReduxPayload & {
    serviceproviderId?: number;
    serviceProviderId?: number;
  } = {
    startDate,
    endDate,
    bookingPreference,
    housekeepingRole,
    ...timeFields,
  };

  const spId = Number(options?.serviceProviderId ?? 0);
  if (Number.isFinite(spId) && spId > 0) {
    payload.serviceproviderId = spId;
    payload.serviceProviderId = spId;
  }

  if (booking.responsibilities?.tasks?.length || booking.responsibilities?.add_ons?.length) {
    payload.responsibilities = booking.responsibilities;
  }

  return payload;
}

export function buildRebookGeoLocation(
  booking: RebookSourceBooking
): Record<string, unknown> | null {
  const lat = booking.latitude != null ? Number(booking.latitude) : null;
  const lng = booking.longitude != null ? Number(booking.longitude) : null;
  const address = String(booking.address || "").trim();

  if (lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)) {
    return (
      normalizeGeoLocationPayload({
        formatted_address: address && address !== "No address specified" ? address : undefined,
        latitude: lat,
        longitude: lng,
        geometry: { location: { lat, lng } },
      }) ?? null
    );
  }

  if (address && address !== "No address specified") {
    return normalizeGeoLocationPayload({ formatted_address: address }) ?? null;
  }

  return null;
}
