/**
 * API base URLs for mobile (override here or wire react-native-config later).
 * Coupon list is proxied through payments when coupons matches payments host.
 */
export const API_URLS = {
  payments: "https://payments-vyqp.onrender.com",
  providers: "https://providers-k8w7.onrender.com",
  utils: "https://utils-jo6c.onrender.com",
  preferences: "https://preferences.onrender.com",
  reviews: "https://reviews-7aal.onrender.com",
  tickets: "https://tickets-3gc8.onrender.com",
  coupons: "https://coupons-o26r.onrender.com",
  chat: "https://chat-b3wl.onrender.com",
  imageUploader: "https://imageuploader-5njj.onrender.com",
} as const;
