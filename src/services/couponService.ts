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

export function mapCouponsFromApiPayload(data: unknown): CustomerCoupon[] {
  const root = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const nested =
    root.data && typeof root.data === "object"
      ? (root.data as Record<string, unknown>)
      : null;

  const source = Array.isArray(root.coupons)
    ? root.coupons
    : Array.isArray(nested?.coupons)
      ? nested.coupons
      : [];

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

/**
 * Load coupons for a customer. Uses payments proxy by default (same host as quote API).
 */
export async function fetchCustomerCoupons(
  customerId: string | number,
  serviceType: "COOK" | "MAID",
  options?: { userCity?: string | null }
): Promise<CustomerCoupon[]> {
  const id = encodeURIComponent(String(customerId));
  const st = serviceType.toUpperCase() as "COOK" | "MAID";
  const params = { serviceType: st };
  const path = `/api/coupons/customer/${id}`;

  const couponsBase = API_URLS.coupons.replace(/\/$/, "");
  const paymentsBase = API_URLS.payments.replace(/\/$/, "");
  let mapped: CustomerCoupon[] = [];

  if (couponsBase !== paymentsBase) {
    try {
      const { data } = await axios.get(`${couponsBase}${path}`, { params, timeout: 30000 });
      mapped = mapCouponsFromApiPayload(data);
    } catch (err) {
      if (__DEV__) {
        console.warn("[coupons] direct service failed, using payments proxy:", err);
      }
    }
  }

  if (mapped.length === 0) {
    const { data } = await PaymentInstance.get(path, { params });
    mapped = mapCouponsFromApiPayload(data);
  }

  const userCity = options?.userCity;
  return mapped
    .filter((c) => couponMatchesServiceType(st, c.serviceType))
    .filter((c) => couponMeetsCity(c.city, userCity));
}
