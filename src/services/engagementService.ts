import PaymentInstance from "./paymentInstance";

export type AcceptEngagementResult = {
  message: string;
  engagement?: Record<string, unknown>;
};

export function parseEngagementId(raw: unknown): number | null {
  if (raw == null || raw === "") return null;
  const n = typeof raw === "number" ? raw : Number(String(raw).trim());
  if (!Number.isFinite(n) || n < 1) return null;
  return Math.trunc(n);
}

export function resolveServiceProviderId(
  appUser: Record<string, unknown> | null | undefined
): number | null {
  if (!appUser) return null;
  const raw =
    appUser.serviceProviderId ??
    appUser.serviceproviderId ??
    appUser.serviceproviderid;
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function resolveProviderId(
  appUser: Record<string, unknown> | null | undefined
): number | null {
  return resolveServiceProviderId(appUser);
}

export function parseAcceptEngagementError(err: unknown): string {
  const ax = err as {
    response?: { status?: number; data?: { error?: string; detail?: string } };
    message?: string;
  };
  const apiMsg = ax.response?.data?.error;
  if (apiMsg) {
    if (/no longer available/i.test(apiMsg)) {
      return "This booking is no longer available. It may have been accepted by another provider or expired.";
    }
    if (/already accepted/i.test(apiMsg)) {
      return "This booking was already accepted.";
    }
    if (/already in queue/i.test(apiMsg)) {
      return "You are already on the provider list for this booking.";
    }
    if (/payment not completed/i.test(apiMsg)) {
      return "Customer payment is not complete yet. Try again after payment succeeds.";
    }
    if (/time conflict|not available at this time|provider has time conflict/i.test(apiMsg)) {
      const detail = ax.response?.data?.detail;
      return detail
        ? `You already have another booking at this time (${detail}).`
        : "You already have another booking at this time.";
    }
    if (/provider id required/i.test(apiMsg)) {
      return "Provider account not found. Sign in again as a service provider.";
    }
    return apiMsg;
  }
  if (ax.response?.status === 404) {
    return "Booking not found. It may have been removed.";
  }
  if (ax.response?.status === 409) {
    return "This booking cannot be accepted right now.";
  }
  return ax.message || "Could not accept this booking. Please try again.";
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

/** Mark provider "new booking" notifications read so the Accept/Decline popup does not return. */
export async function dismissProviderNewBookingNotifications(
  engagementId: number,
  providerId: number
): Promise<void> {
  const eid = parseEngagementId(engagementId);
  if (eid == null || !Number.isFinite(providerId) || providerId < 1) return;

  try {
    const { data } = await PaymentInstance.get("/api/in-app-notifications", {
      params: {
        recipientType: "provider",
        recipientId: String(providerId),
        limit: 50,
      },
    });
    const list = (data?.notifications || []) as Array<{
      id: string;
      type?: string;
      engagementId?: string | null;
      readAt?: string | null;
    }>;

    const targets = list.filter((n) => {
      if (n.readAt) return false;
      if (String(n.engagementId) !== String(eid)) return false;
      return isNewBookingNotificationType(n.type || "");
    });

    await Promise.all(
      targets.map((n) =>
        PaymentInstance.patch(
          `/api/in-app-notifications/${n.id}/read`,
          { recipientType: "provider", recipientId: providerId },
          { params: { recipientType: "provider", recipientId: providerId } }
        )
      )
    );
  } catch (e) {
    console.warn("[sp-booking] dismiss notification failed", e);
  }
}

export function isTerminalAcceptFailure(message: string): boolean {
  const m = (message || "").toLowerCase();
  return (
    m.includes("no longer available") ||
    m.includes("already accepted") ||
    m.includes("time conflict") ||
    m.includes("another booking") ||
    m.includes("not found") ||
    m.includes("cannot be accepted") ||
    m.includes("payment is not complete") ||
    m.includes("acceptance queue is full") ||
    m.includes("already declined")
  );
}

export async function withdrawFromOnDemandEngagement(
  engagementId: number | string,
  providerOrUser: number | Record<string, unknown> | null | undefined
): Promise<{ message: string }> {
  const providerId =
    typeof providerOrUser === "number"
      ? providerOrUser
      : resolveProviderId(providerOrUser);
  if (!providerId) {
    throw new Error("Sign in as a service provider to withdraw from bookings.");
  }
  const eid = parseEngagementId(engagementId);
  if (eid == null) {
    throw new Error("Invalid booking id.");
  }

  const { data } = await PaymentInstance.post(
    `/api/v2/engagements/${eid}/provider-withdraw`,
    { serviceproviderid: providerId, providerId }
  );

  return { message: data?.message || "Withdrawn from booking." };
}

export async function acceptEngagement(
  engagementId: number | string,
  appUser: Record<string, unknown> | null | undefined
): Promise<AcceptEngagementResult> {
  const providerId = resolveProviderId(appUser);
  if (!providerId) {
    throw new Error("Sign in as a service provider to accept bookings.");
  }
  const eid = parseEngagementId(engagementId);
  if (eid == null) {
    throw new Error("Invalid booking id.");
  }

  const { data } = await PaymentInstance.post(`/api/v2/engagements/${eid}/accept`, {
    serviceproviderid: providerId,
    providerId,
  });

  const role = data?.role as string | undefined;
  const defaultMessage =
    role === "backup"
      ? `You are backup #${data?.queuePosition ?? "?"} for this booking.`
      : "Booking accepted successfully";

  return {
    message: data?.message || defaultMessage,
    engagement: data?.engagement,
  };
}
