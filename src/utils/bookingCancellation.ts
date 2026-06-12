export type BookingCancellationInfo = {
  event_type?: string;
  reason?: string;
  payment_timeout_minutes?: number;
  auto_cancelled?: boolean;
};

export type PaymentTimeoutCancellationBooking = {
  taskStatus?: string;
  cancellation?: BookingCancellationInfo | null;
  payment?: { status?: string } | null;
};

export const PAYMENT_TIMEOUT_EVENT_TYPE = "PAYMENT_TIMEOUT";

export function isPaymentTimeoutCancellation(
  booking: PaymentTimeoutCancellationBooking | null | undefined
): boolean {
  if (!booking) return false;
  const eventType = String(booking.cancellation?.event_type || "").toUpperCase();
  if (eventType === PAYMENT_TIMEOUT_EVENT_TYPE) return true;
  return (
    String(booking.taskStatus || "").toUpperCase() === "CANCELLED" &&
    String(booking.payment?.status || "").toUpperCase() === "FAILED"
  );
}

export function getPaymentTimeoutCancellationMessage(
  booking: PaymentTimeoutCancellationBooking | null | undefined
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
