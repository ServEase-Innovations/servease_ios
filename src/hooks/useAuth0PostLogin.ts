import { useEffect, useRef } from "react";
import { useAuth0 } from "react-native-auth0";
import Snackbar from "react-native-snackbar";
import { useAppUser } from "../context/AppUserContext";
import { completeAuth0PostLogin } from "../services/auth0PostLogin";

type Options = {
  onNavigate?: (view: string) => void;
};

function isSameAuth0Session(
  appUser: Record<string, unknown> | null | undefined,
  auth0User: { sub?: string | null; email?: string | null }
): boolean {
  if (!appUser?.token) return false;
  if (auth0User.sub && appUser.sub === auth0User.sub) return true;
  if (auth0User.email && appUser.email === auth0User.email) return true;
  return false;
}

/**
 * Global Auth0 post-login handler (same role as web Header effect after loginWithPopup).
 * Skips when a persisted session is already loaded so reopening the app does not re-toast.
 */
export function useAuth0PostLogin({ onNavigate }: Options = {}) {
  const { user: auth0User, isLoading: auth0Loading, getCredentials } = useAuth0();
  const { appUser, setAppUser, isLoading: isUserLoading } = useAppUser();
  const handledForRef = useRef<string | null>(null);
  const onNavigateRef = useRef(onNavigate);

  useEffect(() => {
    onNavigateRef.current = onNavigate;
  }, [onNavigate]);

  useEffect(() => {
    if (!auth0User?.email || auth0Loading || isUserLoading) {
      if (!auth0User) {
        handledForRef.current = null;
      }
      return;
    }

    const userKey = auth0User.sub ?? auth0User.email;
    if (!userKey) return;

    if (handledForRef.current === userKey) {
      return;
    }

    if (isSameAuth0Session(appUser, auth0User)) {
      handledForRef.current = userKey;
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
          onNavigateRef.current?.(result.navigateTo);
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
  }, [
    appUser?.email,
    appUser?.sub,
    appUser?.token,
    auth0User?.sub,
    auth0User?.email,
    auth0Loading,
    getCredentials,
    isUserLoading,
    setAppUser,
  ]);
}
