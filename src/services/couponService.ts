import axios from "axios";
import PaymentInstance from "./paymentInstance";
import { API_URLS } from "../config/apiUrls";

export type CustomerCoupon = {
  code: string;
  serviceType: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  minimumOrderValue?: number | null;
  description?: string;
  city?: string | null;
};

function normalizeDiscountType(raw: unknown): "PERCENTAGE" | "FIXED_AMOUNT" {
  const u = String(raw || "").toUpperCase();
  if (u === "PERCENTAGE" || u === "PCT" || u.includes("PERCENT")) {
    return "PERCENTAGE";
  }
  return "FIXED_AMOUNT";
}

export function resolveCustomerId(appUser: unknown): string | number | null {
  if (!appUser || typeof appUser !== "object") return null;
  const u = appUser as Record<string, unknown>;
  const id = u.customerid ?? u.customerId ?? u.customer_id;
  if (id == null || String(id).trim() === "") return null;
  return id as string | number;
}

/** Null/empty coupon city = valid everywhere (e.g. COOK10ALL). */
export function couponMeetsCity(
  couponCity: unknown,
  userCity?: string | null
): boolean {
  const c = String(couponCity ?? "").trim();
  if (!c) return true;
  const u = String(userCity ?? "").trim();
  if (!u) return true;
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, "");
  const cn = norm(c);
  const un = norm(u);
  if (cn === un) return true;
  if ((cn === "bengaluru" || cn === "bangalore") && (un === "bengaluru" || un === "bangalore")) {
    return true;
  }
  return false;
}

/** Cook bookings may use maid coupons; not the reverse. */
export function couponMatchesServiceType(requestedServiceType: string, couponServiceType: string): boolean {
  const req = String(requestedServiceType || "").trim().toUpperCase();
  const couponSt = String(couponServiceType || "").trim().toUpperCase();
  if (!req || !couponSt || couponSt === "ALL") return true;
  if (req === couponSt) return true;
  return req === "COOK" && couponSt === "MAID";
}

export function displayCouponSavings(coupon: CustomerCoupon, orderTotal: number): number {
  if (orderTotal > 0) {
    if (coupon.discountType === "PERCENTAGE") {
      return Math.min((orderTotal * coupon.discountValue) / 100, orderTotal);
    }
    return Math.min(coupon.discountValue, orderTotal);
  }
  if (coupon.discountType === "PERCENTAGE") return 0;
  return coupon.discountValue;
}

function unwrapCouponPayload(data: unknown): Record<string, unknown> {
  const root = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const nested =
    root.data && typeof root.data === "object"
      ? (root.data as Record<string, unknown>)
      : null;
  return nested ?? root;
}

export function mapCouponsFromApiPayload(data: unknown): CustomerCoupon[] {
  const payload = unwrapCouponPayload(data);
  const source = Array.isArray(payload.coupons) ? payload.coupons : [];

  return source
    .map((row) => {
      const c = row && typeof row === "object" ? (row as Record<string, unknown>) : {};
      const discountValue = Number(c.discount_value);
      return {
        code: String(c.coupon_code || "").trim().toUpperCase(),
        serviceType: String(c.service_type || "").trim().toUpperCase(),
        discountType: normalizeDiscountType(c.discount_type),
        discountValue: Number.isFinite(discountValue) ? discountValue : 0,
        minimumOrderValue:
          c.minimum_order_value != null ? Number(c.minimum_order_value) : null,
        description: c.description != null ? String(c.description) : undefined,
        city: c.city != null ? String(c.city) : null,
      };
    })
    .filter((c) => Boolean(c.code) && c.discountValue > 0);
}

export type CustomerCouponEligibility = {
  priorBookingCount: number;
  coupons: CustomerCoupon[];
};

/** First-booking promo codes (see database/sql/097_maid_cook_promo99_coupons.sql). */
export const FIRST_BOOKING_COUPON_CODES = {
  MAID: "MAID99-1ST",
  COOK: "COOK99-1ST",
} as const;

export const FIRST_BOOKING_COUPON_LABEL = `${FIRST_BOOKING_COUPON_CODES.MAID} / ${FIRST_BOOKING_COUPON_CODES.COOK}`;

const FIRST_BOOKING_CODE_SET = new Set(
  Object.values(FIRST_BOOKING_COUPON_CODES).map((c) => c.toUpperCase())
);

export function isFirstBookingCouponCode(code: string): boolean {
  return FIRST_BOOKING_CODE_SET.has(String(code || "").trim().toUpperCase());
}

export function getFirstBookingCouponCode(serviceType: "COOK" | "MAID" | string): string {
  const st = String(serviceType || "").trim().toUpperCase();
  return st === "COOK" ? FIRST_BOOKING_COUPON_CODES.COOK : FIRST_BOOKING_COUPON_CODES.MAID;
}

async function fetchCustomerCouponPayload(
  customerId: string | number,
  params?: Record<string, string>
): Promise<unknown> {
  const id = encodeURIComponent(String(customerId));
  const path = `/api/coupons/customer/${id}`;
  const couponsBase = API_URLS.coupons.replace(/\/$/, "");
  const paymentsBase = API_URLS.payments.replace(/\/$/, "");

  if (couponsBase !== paymentsBase) {
    try {
      const { data } = await axios.get(`${couponsBase}${path}`, { params, timeout: 30000 });
      return data;
    } catch (err) {
      if (__DEV__) {
        console.warn("[coupons] direct service failed, using payments proxy:", err);
      }
    }
  }

  const { data } = await PaymentInstance.get(path, { params });
  return data;
}

/** Booking count + eligible coupons from coupons service. */
export async function fetchCustomerCouponEligibility(
  customerId: string | number
): Promise<CustomerCouponEligibility> {
  const data = await fetchCustomerCouponPayload(customerId);
  const payload = unwrapCouponPayload(data);
  const priorRaw = payload.prior_booking_count;
  const priorBookingCount =
    priorRaw != null && Number.isFinite(Number(priorRaw)) ? Number(priorRaw) : 0;

  return {
    priorBookingCount,
    coupons: mapCouponsFromApiPayload(data),
  };
}

/** True when customer has no prior bookings and a first-booking promo applies. */
export async function isEligibleForFirstBookingOffer(
  customerId: string | number
): Promise<boolean> {
  const { priorBookingCount, coupons } = await fetchCustomerCouponEligibility(customerId);
  if (priorBookingCount > 0) return false;
  return coupons.some((c) => isFirstBookingCouponCode(c.code));
}

/**
 * Load coupons for a customer. Uses payments proxy by default (same host as quote API).
 */
export async function fetchCustomerCoupons(
  customerId: string | number,
  serviceType: "COOK" | "MAID",
  options?: { userCity?: string | null }
): Promise<CustomerCoupon[]> {
  const st = serviceType.toUpperCase() as "COOK" | "MAID";
  const data = await fetchCustomerCouponPayload(customerId, { serviceType: st });
  const mapped = mapCouponsFromApiPayload(data);
  const userCity = options?.userCity;
  return mapped
    .filter((c) => couponMatchesServiceType(st, c.serviceType))
    .filter((c) => couponMeetsCity(c.city, userCity));
}

