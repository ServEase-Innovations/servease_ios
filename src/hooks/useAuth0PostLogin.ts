import { useEffect, useRef } from "react";
import { useAuth0 } from "react-native-auth0";
import Snackbar from "react-native-snackbar";
import { useAppUser } from "../context/AppUserContext";
import { completeAuth0PostLogin } from "../services/auth0PostLogin";
import { HOME } from "../Constants/pagesConstants";

type Options = {
  onNavigate?: (view: string) => void;
};

/**
 * Global Auth0 post-login handler (same role as web Header effect after loginWithPopup).
 */
export function useAuth0PostLogin({ onNavigate }: Options = {}) {
  const { user: auth0User, isLoading: auth0Loading, getCredentials } = useAuth0();
  const { setAppUser } = useAppUser();
  const handledForRef = useRef<string | null>(null);

  useEffect(() => {
    if (!auth0User?.email || auth0Loading) {
      if (!auth0User) {
        handledForRef.current = null;
      }
      return;
    }

    const userKey = auth0User.sub ?? auth0User.email;
    if (handledForRef.current === userKey) {
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const credentials = await getCredentials();
        if (cancelled) return;

        const result = await completeAuth0PostLogin(auth0User, credentials?.accessToken);
        if (cancelled) return;

        setAppUser(result.appUser);
        handledForRef.current = userKey;

        Snackbar.show({
          text: "Signed in successfully",
          duration: Snackbar.LENGTH_SHORT,
          backgroundColor: "#10b981",
          textColor: "#ffffff",
        });

        if (result.navigateTo) {
          onNavigate?.(result.navigateTo);
        } else {
          onNavigate?.(HOME);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Account setup failed.";
        console.error("[auth0] post-login failed:", error);
        handledForRef.current = null;
        Snackbar.show({
          text: message.includes("utils API")
            ? message
            : "Login succeeded but account setup failed. Please try again.",
          duration: Snackbar.LENGTH_LONG,
          backgroundColor: "#ef4444",
          textColor: "#ffffff",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [auth0User?.sub, auth0User?.email, auth0Loading, getCredentials, setAppUser, onNavigate]);
}
