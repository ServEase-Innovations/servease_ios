import { useEffect, useMemo, useState, useCallback } from "react";
import { AppState } from "react-native";
import { useAuth0 } from "react-native-auth0";
import { useAppUser } from "../context/AppUserContext";
import {
  isEligibleForFirstBookingOffer,
  resolveCustomerId,
} from "../services/couponService";

/**
 * Hot Deal (₹99 / MAID99-1ST & COOK99-1ST) visibility:
 * - Guest (not signed in): show
 * - Signed-in customer with zero prior bookings + first-booking promo eligible: show
 * - Everyone else: hide
 */
export function useFirstBookingOfferVisible() {
  const { appUser, isLoading: isUserLoading } = useAppUser();
  const { user: auth0User } = useAuth0();

  const [showOffer, setShowOffer] = useState(false);
  const [checking, setChecking] = useState(true);

  const isAuthenticated = useMemo(
    () => !!(auth0User || (appUser && appUser.token)),
    [auth0User, appUser]
  );

  const role = useMemo(() => {
    const fromApp = String(appUser?.role || "").toUpperCase();
    if (fromApp) return fromApp;
    return String(auth0User?.role || "CUSTOMER").toUpperCase();
  }, [appUser?.role, auth0User?.role]);

  const customerId = useMemo(() => resolveCustomerId(appUser), [appUser]);

  const evaluate = useCallback(async () => {
    if (isUserLoading) {
      setChecking(true);
      return;
    }

    if (!isAuthenticated) {
      setShowOffer(true);
      setChecking(false);
      return;
    }

    if (role !== "CUSTOMER") {
      setShowOffer(false);
      setChecking(false);
      return;
    }

    if (!customerId) {
      setShowOffer(false);
      setChecking(false);
      return;
    }

    setChecking(true);
    try {
      const eligible = await isEligibleForFirstBookingOffer(customerId);
      setShowOffer(eligible);
    } catch {
      setShowOffer(false);
    } finally {
      setChecking(false);
    }
  }, [isUserLoading, isAuthenticated, role, customerId]);

  useEffect(() => {
    let cancelled = false;
    void evaluate().finally(() => {
      if (cancelled) return;
    });
    return () => {
      cancelled = true;
    };
  }, [evaluate]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active" && isAuthenticated && role === "CUSTOMER" && customerId) {
        void evaluate();
      }
    });
    return () => sub.remove();
  }, [evaluate, isAuthenticated, role, customerId]);

  return { showOffer, checking };
}
