/**
 * API base URLs for mobile (override here or wire react-native-config later).
 * Coupon list is proxied through payments when coupons matches payments host.
 */
export const API_URLS = {
  payments: "https://payments-j5id.onrender.com",
  reviews: "https://reviews-19oo.onrender.com",
  /** Direct coupons service (falls back to payments proxy in couponService). */
  coupons: "https://coupons-o26r.onrender.com",
} as const;
