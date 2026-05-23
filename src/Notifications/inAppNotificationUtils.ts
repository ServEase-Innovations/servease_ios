export type InAppNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  engagementId: string | null;
  readAt: string | null;
  createdAt: string;
  metadata?: unknown;
};

import { parseEngagementId } from "../services/engagementService";

export type BookingRequestPayload = {
  engagement_id: number;
  service_type: string;
  booking_type?: string;
  start_date: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  duration_minutes?: number;
  base_amount: number;
  start_epoch?: number;
  end_epoch?: number;
  address?: string | null;
  distance_meters?: number;
  payment_pending?: boolean;
  payment_completed?: boolean;
  payment_ready?: boolean;
};

/** IST = UTC+5:30 — avoid `timeZone` in Intl (Hermes can throw "Incorrect timeZone information"). */
const IST_OFFSET_MINUTES = 330;

function asMeta(m: unknown): Record<string, unknown> | null {
  if (m && typeof m === "object" && !Array.isArray(m)) {
    return m as Record<string, unknown>;
  }
  return null;
}

function dateFromEpochIST(epochSec: number): Date {
  return new Date(epochSec * 1000 + IST_OFFSET_MINUTES * 60 * 1000);
}

function formatYmdInTz(epochSec: number): string {
  const d = dateFromEpochIST(epochSec);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatTimeInTz(epochSec: number): string {
  const d = dateFromEpochIST(epochSec);
  let h = d.getUTCHours();
  const min = d.getUTCMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${String(min).padStart(2, "0")} ${ampm}`;
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const sec = (Date.now() - d.getTime()) / 1000;
  if (sec < 10) return "Just now";
  if (sec < 60) return "Moments ago";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  if (sec < 604800) return `${Math.floor(sec / 86400)}d ago`;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}

export function recipientParams(
  appUser: any
): { recipientType: "customer" | "provider"; recipientId: string } | null {
  if (!appUser) return null;
  const role = String(appUser.role || "").toUpperCase();
  if (role === "SERVICE_PROVIDER" && appUser.serviceProviderId != null) {
    return { recipientType: "provider", recipientId: String(appUser.serviceProviderId) };
  }
  if (appUser.customerid != null) {
    return { recipientType: "customer", recipientId: String(appUser.customerid) };
  }
  return null;
}

export function typeMeta(type: string): { label: string; icon: string; color: string } {
  const s = (type || "").toUpperCase();
  if (s === "BOOKING_ACCEPTED" || s.includes("ACCEPT")) {
    return { label: "Accepted", icon: "check-circle", color: "#059669" };
  }
  if (s.includes("ASSIGNED_BOOKING")) {
    return { label: "Booking", icon: "campaign", color: "#0ea5e9" };
  }
  if (s.includes("OPPORTUNITY") || s.includes("NEW_BOOKING") || s.includes("REQUEST")) {
    return { label: "New booking", icon: "campaign", color: "#0ea5e9" };
  }
  if (s === "SERVICE_DAY_STARTED" || s.includes("STARTED")) {
    return { label: "Service started", icon: "play-circle-outline", color: "#d97706" };
  }
  if (s === "SERVICE_DAY_COMPLETED" || s.includes("COMPLETED")) {
    return { label: "Service done", icon: "celebration", color: "#7c3aed" };
  }
  return { label: "Update", icon: "notifications", color: "#64748b" };
}

export function inAppToBookingRequestPayload(n: {
  type?: string;
  engagementId: string | null;
  title: string;
  body?: string;
  metadata?: unknown;
}): BookingRequestPayload | null {
  const eid = n.engagementId != null && n.engagementId !== "" ? Number(n.engagementId) : NaN;
  if (!Number.isFinite(eid) || eid < 1) return null;

  const m = asMeta(n.metadata) ?? {};
  const serviceType = String(m.service_type ?? n.title ?? "Service");
  const bookingType = String(m.booking_type ?? "ON_DEMAND");
  const base = m.base_amount != null ? Number(m.base_amount) : 0;
  const duration = m.duration_minutes != null ? Number(m.duration_minutes) : undefined;
  const address =
    m.address != null && String(m.address).trim() !== "" ? String(m.address) : undefined;

  const startEpoch = m.start_epoch != null ? Number(m.start_epoch) : NaN;

  let ymd: string;
  if (m.start_date != null && String(m.start_date).trim() !== "") {
    ymd = String(m.start_date).slice(0, 10);
  } else if (Number.isFinite(startEpoch)) {
    ymd = formatYmdInTz(startEpoch);
  } else {
    ymd = formatYmdInTz(Math.floor(Date.now() / 1000));
  }

  let startTime: string;
  if (m.start_time_label && typeof m.start_time_label === "string" && m.start_time_label.length > 0) {
    const s = m.start_time_label;
    const comma = s.indexOf(",");
    startTime = comma >= 0 ? s.slice(comma + 1).trim() : s.trim();
  } else if (Number.isFinite(startEpoch)) {
    startTime = formatTimeInTz(startEpoch);
  } else {
    startTime = "—";
  }

  let endTime: string | undefined;
  let endEpoch = NaN;
  if (m.end_epoch != null) {
    endEpoch = Number(m.end_epoch);
  } else if (Number.isFinite(startEpoch) && duration && duration > 0) {
    endEpoch = startEpoch + Math.round(duration * 60);
  }
  if (Number.isFinite(endEpoch)) {
    endTime = formatTimeInTz(endEpoch);
  }

  let distM: number | undefined;
  if (m.distance_m != null && Number.isFinite(Number(m.distance_m))) {
    distM = Number(m.distance_m);
  } else if (m.distance_km != null && Number.isFinite(Number(m.distance_km))) {
    distM = Number(m.distance_km) * 1000;
  }

  const typeUpper = String(n.type || "").toUpperCase();
  const isAssignedConfirmed = typeUpper === "ASSIGNED_BOOKING_CONFIRMED";

  let endDateYmd: string | undefined;
  if (m.end_date != null && String(m.end_date).trim() !== "") {
    endDateYmd = String(m.end_date).slice(0, 10);
  }

  return {
    engagement_id: eid,
    service_type: serviceType,
    booking_type: bookingType,
    start_date: ymd,
    end_date: endDateYmd,
    start_time: startTime,
    end_time: endTime,
    duration_minutes: duration,
    base_amount: Number.isFinite(base) ? base : 0,
    address: address ?? null,
    distance_meters: distM,
    ...(Number.isFinite(startEpoch) ? { start_epoch: startEpoch } : {}),
    ...(Number.isFinite(endEpoch) ? { end_epoch: endEpoch } : {}),
    ...(m.payment_ready === true ? { payment_ready: true as const } : {}),
    ...(m.payment_pending === true ? { payment_pending: true as const } : {}),
    ...(isAssignedConfirmed ? { payment_completed: true as const } : {}),
  };
}

/** Matches web: on-demand after payment shows Accept; pending payment and assigned confirmations are info-only. */
export function isBookingToastInfoOnly(engagement: BookingRequestPayload): boolean {
  const isOnDemand = String(engagement.booking_type || "").toUpperCase() === "ON_DEMAND";
  if (engagement.payment_pending === true) return true;
  if (!isOnDemand && engagement.payment_completed === true) return true;
  return false;
}

function formatClock12h(value?: string | null): string {
  if (!value || value === "—") return "—";
  const s = String(value).trim();
  if (/\b(AM|PM|am|pm)\b/.test(s)) {
    return s.replace(/\b(am|pm)\b/g, (m) => m.toUpperCase());
  }
  return s;
}

/**
 * Normalize Socket.IO `new-engagement` / `new-engagement-request` payloads for the SP toast.
 */
export function normalizeSocketBookingForToast(
  raw: Record<string, unknown>
): BookingRequestPayload {
  const nested =
    raw.engagement && typeof raw.engagement === "object"
      ? (raw.engagement as Record<string, unknown>)
      : raw;

  const out = { ...nested } as unknown as BookingRequestPayload;
  const eid =
    parseEngagementId(nested.engagement_id) ??
    parseEngagementId(nested.engagementId) ??
    parseEngagementId(nested.id);
  out.engagement_id = eid ?? (NaN as number);

  const startEpoch =
    out.start_epoch != null && Number.isFinite(Number(out.start_epoch))
      ? Number(out.start_epoch)
      : null;

  if (startEpoch != null) {
    out.start_date = formatYmdInTz(startEpoch);
    if (!out.start_time || String(out.start_time).trim() === "") {
      out.start_time = formatTimeInTz(startEpoch);
      if (out.duration_minutes != null && Number.isFinite(Number(out.duration_minutes))) {
        const endSec = startEpoch + Math.round(Number(out.duration_minutes) * 60);
        out.end_time = formatTimeInTz(endSec);
        out.end_epoch = endSec;
      }
    }
  } else if (out.start_date) {
    out.start_date = String(out.start_date).slice(0, 10);
  }

  if (out.end_date) {
    out.end_date = String(out.end_date).slice(0, 10);
  }

  if (out.start_time != null && String(out.start_time).trim() !== "" && out.start_time !== "—") {
    out.start_time = formatClock12h(out.start_time);
  }
  if (out.end_time) {
    out.end_time = formatClock12h(out.end_time);
  }
  if (out.start_time == null || String(out.start_time).trim() === "") {
    out.start_time = "—";
  }
  if (out.base_amount == null || (out.base_amount as unknown) === "") {
    out.base_amount = 0;
  }
  if (nested.payment_pending === true) out.payment_pending = true;
  if (nested.payment_completed === true) out.payment_completed = true;
  if (nested.payment_ready === true) out.payment_ready = true;

  return out;
}
