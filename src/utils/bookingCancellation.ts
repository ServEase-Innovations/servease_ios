export type BookingCancellationInfo = {
  event_type?: string;
  reason?: string;
  payment_timeout_minutes?: number;
  auto_cancelled?: boolean;
  refund_amount_inr?: number;
  wallet_refund_amount_inr?: number;
  razorpay_refund_amount_inr?: number;
};

export type AutoCancelCancellationBooking = {
  taskStatus?: string;
  cancellation?: BookingCancellationInfo | null;
  payment?: { status?: string; total_amount?: string | number } | null;
};

export const PAYMENT_TIMEOUT_EVENT_TYPE = "PAYMENT_TIMEOUT";
export const ON_DEMAND_NO_PROVIDER_EVENT_TYPE = "ON_DEMAND_AUTO_CANCELLED_NO_PROVIDER";

export function isPaymentTimeoutCancellation(
  booking: AutoCancelCancellationBooking | null | undefined
): boolean {
  if (!booking) return false;
  const eventType = String(booking.cancellation?.event_type || "").toUpperCase();
  if (eventType === PAYMENT_TIMEOUT_EVENT_TYPE) return true;
  return (
    String(booking.taskStatus || "").toUpperCase() === "CANCELLED" &&
    String(booking.payment?.status || "").toUpperCase() === "FAILED"
  );
}

export function isNoProviderAutoCancelCancellation(
  booking: AutoCancelCancellationBooking | null | undefined
): boolean {
  if (!booking) return false;
  const eventType = String(booking.cancellation?.event_type || "").toUpperCase();
  if (eventType === ON_DEMAND_NO_PROVIDER_EVENT_TYPE) return true;
  const reason = String(booking.cancellation?.reason || "");
  return (
    booking.cancellation?.auto_cancelled === true &&
    /no provider/i.test(reason)
  );
}

export function getPaymentTimeoutCancellationMessage(
  booking: AutoCancelCancellationBooking | null | undefined
): string {
  const rawMinutes = booking?.cancellation?.payment_timeout_minutes;
  const minutes =
    rawMinutes != null && Number.isFinite(Number(rawMinutes)) && Number(rawMinutes) > 0
      ? Number(rawMinutes)
      : 20;
  const windowLabel = `${minutes}-minute`;

  return (
    `This booking was cancelled because payment was not completed within the required ${windowLabel} payment window. ` +
    "Please create a new booking if you would like to continue with this service."
  );
}

function formatInr(amount: number): string {
  return `₹${amount.toFixed(2)}`;
}

export function getNoProviderAutoCancelRefundLine(
  booking: AutoCancelCancellationBooking | null | undefined
): string {
  const cancellation = booking?.cancellation;
  const walletRefund = Number(cancellation?.wallet_refund_amount_inr ?? 0);
  const razorpayRefund = Number(cancellation?.razorpay_refund_amount_inr ?? 0);
  const parts: string[] = [];

  if (walletRefund > 0) {
    parts.push(`${formatInr(walletRefund)} has been credited to your wallet`);
  }
  if (razorpayRefund > 0) {
    parts.push(
      `${formatInr(razorpayRefund)} will be refunded to your original payment method ` +
        "(typically within 5–7 business days)"
    );
  }
  if (parts.length > 0) {
    return parts.join(". ") + ".";
  }

  const payStatus = String(booking?.payment?.status || "").toUpperCase();
  const refundTotal = Number(
    cancellation?.refund_amount_inr ?? booking?.payment?.total_amount ?? 0
  );

  if (payStatus === "REFUNDED" && refundTotal > 0) {
    return `A full refund of ${formatInr(refundTotal)} has been processed.`;
  }

  if (payStatus === "SUCCESS" && refundTotal > 0) {
    return `A full refund of ${formatInr(refundTotal)} is being processed.`;
  }

  return "You have not been charged for this booking.";
}

export function getNoProviderAutoCancelMessage(
  booking: AutoCancelCancellationBooking | null | undefined
): string {
  return (
    "We could not assign a service professional before your scheduled start time, " +
    "so this booking was cancelled automatically. " +
    getNoProviderAutoCancelRefundLine(booking)
  );
}
