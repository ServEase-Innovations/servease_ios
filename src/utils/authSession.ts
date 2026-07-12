import { resolveCustomerId } from "../services/couponService";

/** True when appUser carries a bearer token (phone OTP) or accessToken (Auth0). */
export function hasStoredAuthToken(appUser: unknown): boolean {
  if (!appUser || typeof appUser !== "object") return false;
  const u = appUser as Record<string, unknown>;
  const token = u.token ?? u.accessToken;
  return Boolean(token && String(token).trim());
}

/**
 * Active session when Auth0 reports authenticated OR phone OTP stored appUser + token.
 * Mirrors web Header / checkout rules.
 */
export function isAppSessionAuthenticated(
  appUser: unknown,
  auth0IsAuthenticated: boolean
): boolean {
  return auth0IsAuthenticated || hasStoredAuthToken(appUser);
}

/** Customer can checkout when we have a customer id and an active session token. */
export function isCustomerCheckoutReady(
  appUser: unknown,
  auth0IsAuthenticated: boolean
): boolean {
  const customerId = resolveCustomerId(appUser);
  if (!customerId) return false;
  return isAppSessionAuthenticated(appUser, auth0IsAuthenticated);
}
