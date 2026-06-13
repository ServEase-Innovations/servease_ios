import {
  fetchCookQuote,
  fetchCookRateCard,
  fetchMaidQuote,
  fetchMaidRateCard,
  parseQuoteTotal,
  type PricingQuoteResponse,
} from "../services/pricingService";
import { resolveScheduleTimeFields } from "../utils/bookingSchedulePatch";
import { formatDateOnly } from "../utils/maidPricingUtils";

export { BOOKING_HEADER_GRADIENT } from "../theme/brandColors";

export type ServiceBookingKind = "maid" | "cook";

export const SERVICE_BOOKING_CONFIG = {
  maid: {
    title: "Maid service",
    successServiceLabel: "Cleaning help",
    serviceType: "MAID" as const,
    cartType: "maid" as const,
    priceMetaReady: "Includes pricing for your selected schedule",
    fetchRateCard: fetchMaidRateCard,
    fetchQuote: fetchMaidQuote,
    fetchQuoteFallback: fetchMaidQuote,
  },
  cook: {
    title: "Home cook",
    successServiceLabel: "Home cook",
    serviceType: "COOK" as const,
    cartType: "meal" as const,
    priceMetaReady: "Cook pricing for your selected schedule",
    fetchRateCard: fetchCookRateCard,
    fetchQuote: fetchCookQuote,
    fetchQuoteFallback: fetchMaidQuote,
  },
} as const;

function diffHoursFromTimes(startTime?: string, endTime?: string): number | undefined {
  if (!startTime || !endTime) return undefined;
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const mins = eh * 60 + em - (sh * 60 + sm);
  if (mins > 0) return Math.max(1, Math.round((mins / 60) * 10) / 10);
  return undefined;
}

function hoursFromTimeRange(timeRange?: string): number | undefined {
  if (!timeRange) return undefined;
  const parts = timeRange.split("-").map((s) => s.trim());
  if (parts.length !== 2) return undefined;
  return diffHoursFromTimes(parts[0], parts[1]);
}

const TIME_HM = /^\d{1,2}:\d{2}$/;

export function hasValidTimeSlot(time?: string): boolean {
  if (!time || typeof time !== "string") return false;
  return TIME_HM.test(time.trim());
}

/** True when Redux booking has a date and time appropriate for the booking mode. */
export function isBookingScheduleComplete(
  bookingType: Record<string, unknown> | null | undefined,
  bookingTypeCode: string
): boolean {
  if (!bookingType) return false;

  const startDate = formatDateOnly(String(bookingType.startDate ?? ""));
  if (!startDate) return false;

  const { startTime, endTime } = resolveScheduleTimeFields(bookingType);
  const endDate = formatDateOnly(String(bookingType.endDate ?? "")) || startDate;

  if (bookingTypeCode === "ON_DEMAND") {
    return hasValidTimeSlot(startTime) && hasValidTimeSlot(endTime);
  }
  if (bookingTypeCode === "SHORT_TERM") {
    return Boolean(endDate) && hasValidTimeSlot(startTime) && hasValidTimeSlot(endTime);
  }
  if (bookingTypeCode === "MONTHLY") {
    return hasValidTimeSlot(startTime);
  }
  return hasValidTimeSlot(startTime);
}

export function computeDurationHours(
  bookingTypeCode: string,
  startTime?: string,
  endTime?: string,
  _startDate?: string,
  _endDate?: string,
  timeRange?: string,
  timeSlot?: string
): number | undefined {
  if (bookingTypeCode === "ON_DEMAND") {
    const hours = diffHoursFromTimes(startTime, endTime);
    if (hours != null && hours > 0) return hours;
    const fromRange = hoursFromTimeRange(timeRange);
    if (fromRange != null && fromRange > 0) return fromRange;
    return 1;
  }
  if (bookingTypeCode === "SHORT_TERM") {
    const hours = diffHoursFromTimes(startTime, endTime);
    if (hours != null && hours > 0) return hours;
    const fromSlot = hoursFromTimeRange(timeSlot);
    if (fromSlot != null && fromSlot > 0) return fromSlot;
    return 2;
  }
  if (bookingTypeCode === "MONTHLY") {
    const hours = diffHoursFromTimes(startTime, endTime);
    if (hours != null && hours > 0) return hours;
    const fromRange = hoursFromTimeRange(timeRange);
    if (fromRange != null && fromRange > 0) return fromRange;
    return 1;
  }
  return undefined;
}

export async function loadServiceQuote(
  kind: ServiceBookingKind,
  params: Parameters<typeof fetchMaidQuote>[0]
): Promise<PricingQuoteResponse & { quoteError?: string }> {
  const cfg = SERVICE_BOOKING_CONFIG[kind];
  let lastError: string | undefined;

  for (const fetchQuote of [cfg.fetchQuote, cfg.fetchQuoteFallback]) {
    try {
      const res = await fetchQuote(params);
      const total = parseQuoteTotal(res);
      if (res.success !== false && total > 0) {
        return { ...res, total };
      }
      lastError = res.error || (total <= 0 ? "Price unavailable for this schedule" : undefined);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } }; message?: string };
      lastError = ax.response?.data?.error || ax.message || "Could not fetch price";
    }
  }

  return {
    success: false,
    total: 0,
    plan_code: "",
    quote: { total: 0, line_items: [], discounts: [], applied_rules: [] },
    quoteError: lastError,
  };
}
