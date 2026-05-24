import { useEffect, useRef, useCallback } from "react";
import { AppState, AppStateStatus } from "react-native";
import PaymentInstance from "../services/paymentInstance";
import {
  BookingRequestPayload,
  InAppNotification,
  inAppToBookingRequestPayload,
  isBookingToastInfoOnly,
  normalizeSocketBookingForToast,
} from "../Notifications/inAppNotificationUtils";
import { parseEngagementId, resolveServiceProviderId } from "../services/engagementService";

/** Poll interval for new paid on-demand bookings (Accept/Decline popup). */
const POLL_MS = 5000;

/** Engagements we already surfaced in the popup (module-level so App can clear after accept). */
const shownEngagementIds = new Set<number>();

export function clearProviderBookingEngagement(engagementId: number) {
  const eid = parseEngagementId(engagementId);
  if (eid != null) shownEngagementIds.delete(eid);
}

export function resetProviderBookingPopupState() {
  shownEngagementIds.clear();
}

function toActionableBookingPayload(
  raw: Record<string, unknown> | BookingRequestPayload
): BookingRequestPayload | null {
  const normalized =
    "engagement_id" in raw &&
    typeof (raw as BookingRequestPayload).engagement_id === "number" &&
    Number.isFinite((raw as BookingRequestPayload).engagement_id)
      ? (raw as BookingRequestPayload)
      : normalizeSocketBookingForToast(raw as Record<string, unknown>);

  const eid = parseEngagementId(normalized.engagement_id);
  if (eid == null) return null;

  const bookingType = String(normalized.booking_type || "ON_DEMAND").toUpperCase();
  const withFlags: BookingRequestPayload = {
    ...normalized,
    engagement_id: eid,
    service_type: normalized.service_type || "Service",
    start_date: normalized.start_date || new Date().toISOString().slice(0, 10),
    payment_ready:
      normalized.payment_ready === true ||
      (bookingType === "ON_DEMAND" &&
        normalized.payment_pending !== true &&
        normalized.payment_completed !== true),
  };

  if (isBookingToastInfoOnly(withFlags)) return null;
  return withFlags;
}

function isNewBookingNotificationType(type: string): boolean {
  const t = (type || "").toUpperCase();
  return (
    t === "NEW_BOOKING_OPPORTUNITY" ||
    t === "NEW_BOOKING_REQUEST" ||
    t.includes("NEW_BOOKING") ||
    t.includes("OPPORTUNITY")
  );
}

type Options = {
  appUser: any | null;
  isUserLoading: boolean;
  onBookingRequest: (payload: BookingRequestPayload) => void;
  onBookingClosed: (engagementId: number) => void;
  /** Engagement id currently shown in the Accept/Decline modal (if any). */
  activeEngagementId?: number | null;
};

/**
 * Polls payments in-app notifications for nearby on-demand booking requests.
 * Uses HTTP polling instead of Socket.IO so we do not open extra WebSocket
 * connections (avoids Metro / RN dev-middleware "readyState CLOSING" crashes).
 */
export function useProviderBookingSocket({
  appUser,
  isUserLoading,
  onBookingRequest,
  onBookingClosed,
  activeEngagementId = null,
}: Options) {
  const onRequestRef = useRef(onBookingRequest);
  const onClosedRef = useRef(onBookingClosed);
  const activeIdRef = useRef(activeEngagementId);
  const pollInFlightRef = useRef(false);

  onRequestRef.current = onBookingRequest;
  onClosedRef.current = onBookingClosed;
  activeIdRef.current = activeEngagementId;

  const presentBookingRequest = useCallback(
    (payload: BookingRequestPayload, source: string) => {
      const eid = payload.engagement_id;
      if (shownEngagementIds.has(eid)) return;
      shownEngagementIds.add(eid);
      console.log(`[sp-booking] ${source} → accept/decline popup #${eid}`);
      onRequestRef.current(payload);
    },
    []
  );

  const handleInAppNotification = useCallback(
    (n: InAppNotification, source: string) => {
      if (!isNewBookingNotificationType(n.type || "")) return;
      if (n.readAt) return;
      const payload = inAppToBookingRequestPayload(n);
      if (!payload) return;
      const actionable = toActionableBookingPayload({
        ...payload,
        payment_ready: true,
      });
      if (!actionable) return;
      presentBookingRequest(actionable, source);
    },
    [presentBookingRequest]
  );

  const providerId = resolveServiceProviderId(appUser);
  const role = String(appUser?.role || "").toUpperCase();
  const isProvider = !isUserLoading && !!appUser && role === "SERVICE_PROVIDER" && providerId != null;

  useEffect(() => {
    if (!isProvider || providerId == null) {
      resetProviderBookingPopupState();
      return;
    }

    const poll = async () => {
      if (pollInFlightRef.current) return;
      pollInFlightRef.current = true;
      try {
        const { data } = await PaymentInstance.get("/api/in-app-notifications", {
          params: {
            recipientType: "provider",
            recipientId: String(providerId),
            limit: 30,
          },
        });
        const list = (data?.notifications || []) as InAppNotification[];

        for (const n of list) {
          const eid = parseEngagementId(n.engagementId);
          if (eid == null) continue;

          if (isNewBookingNotificationType(n.type || "") && n.readAt) {
            shownEngagementIds.delete(eid);
            const activeId = parseEngagementId(activeIdRef.current);
            if (activeId === eid) {
              onClosedRef.current(eid);
            }
          }
        }

        const bookingAlerts = list.filter(
          (n) => !n.readAt && isNewBookingNotificationType(n.type || "")
        );

        if (bookingAlerts.length > 0) {
          const activeId = parseEngagementId(activeIdRef.current);
          const pick =
            activeId != null
              ? bookingAlerts.find((n) => parseEngagementId(n.engagementId) === activeId)
              : undefined;
          handleInAppNotification(pick ?? bookingAlerts[0], "poll");
        }
      } catch (e) {
        console.warn("[sp-booking] poll failed", e);
      } finally {
        pollInFlightRef.current = false;
      }
    };

    void poll();
    const interval = setInterval(() => void poll(), POLL_MS);

    const appStateSub = AppState.addEventListener("change", (next: AppStateStatus) => {
      if (next === "active") void poll();
    });

    return () => {
      clearInterval(interval);
      appStateSub.remove();
    };
  }, [isProvider, providerId, handleInAppNotification]);
}

/** No socket connection; kept for sign-out call sites. */
export function disconnectProviderBookingSocket() {
  resetProviderBookingPopupState();
}
