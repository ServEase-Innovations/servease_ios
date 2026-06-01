import ticketsInstance from "./ticketsInstance";

export type TicketCategory =
  | "GENERAL"
  | "BOOKING"
  | "PAYMENT"
  | "SERVICE_QUALITY"
  | "PROVIDER_CONDUCT"
  | "REFUND"
  | "APP_TECHNICAL";

export interface SupportTicket {
  ticket_id: number;
  ticket_number: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  sla_due_at: string;
  is_overdue: boolean;
  resolution_notes?: string | null;
  engagement_id?: number | null;
}

export function getEngagementIdFromBooking(booking: { id?: number; engagement_id?: number }) {
  if (booking?.engagement_id != null) return Number(booking.engagement_id);
  if (booking?.id != null) return Number(booking.id);
  return null;
}

export async function createSupportTicket(payload: {
  customerId: number;
  subject: string;
  description: string;
  category?: TicketCategory;
  engagementId?: number | null;
}) {
  const { data } = await ticketsInstance.post<{
    success: boolean;
    message?: string;
    ticket?: SupportTicket;
    error?: string;
  }>("/api/tickets", payload, {
    headers: { "x-customer-id": String(payload.customerId) },
  });
  return data;
}

export async function fetchMyTickets(customerId: number) {
  const { data } = await ticketsInstance.get<{
    success: boolean;
    tickets: SupportTicket[];
  }>("/api/tickets/mine", { params: { customerId } });
  return data.tickets ?? [];
}

const TICKET_ERROR_MESSAGES: Record<string, string> = {
  CUSTOMER_ID_REQUIRED: "Please sign in again.",
  ENGAGEMENT_NOT_FOUND: "Booking not found.",
  CUSTOMER_MISMATCH: "This booking is not linked to your account.",
  MISSING_REQUIRED_FIELDS: "Enter a subject and description.",
};

export function ticketErrorMessage(code?: string, fallback = "Something went wrong.") {
  if (!code) return fallback;
  return TICKET_ERROR_MESSAGES[code] || fallback;
}
