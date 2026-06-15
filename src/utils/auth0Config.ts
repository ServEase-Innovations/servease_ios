import { Platform } from "react-native";
import config from "../../auth0-configuration";

export const AUTH0_DOMAIN = config.domain;
export const AUTH0_CLIENT_ID = config.clientId;
export const AUTH0_SCOPE = "openid profile email offline_access";

/** Primary iOS bundle id (Xcode / App Store). */
export const IOS_BUNDLE_ID = config.iosBundleId ?? "in.serveaseinnovation.serveaso";

/** Legacy ad-hoc bundle id — register this callback in Auth0 if older builds are still installed. */
export const IOS_LEGACY_BUNDLE_ID = "com.serveaso.app.ios";

/** Must match Android applicationId and Auth0 Allowed Callback URLs. */
export const ANDROID_PACKAGE = config.androidPackage ?? "com.serveaso";

/** Build the Auth0 native callback URL for a given bundle / package id. */
export function buildAuth0CallbackUrl(bundleOrPackageId: string): string {
  const id = bundleOrPackageId.toLowerCase();
  const scheme = `${id}.auth0`;
  if (Platform.OS === "android") {
    return `${scheme}://${AUTH0_DOMAIN}/android/${id}/callback`;
  }
  return `${scheme}://${AUTH0_DOMAIN}/ios/${id}/callback`;
}

/** Register all of these in Auth0 → Application → Allowed Callback / Logout URLs. */
export const AUTH0_ALLOWED_CALLBACK_URLS = [
  `${ANDROID_PACKAGE.toLowerCase()}.auth0://${AUTH0_DOMAIN}/android/${ANDROID_PACKAGE.toLowerCase()}/callback`,
  `${IOS_BUNDLE_ID.toLowerCase()}.auth0://${AUTH0_DOMAIN}/ios/${IOS_BUNDLE_ID.toLowerCase()}/callback`,
  `${IOS_LEGACY_BUNDLE_ID.toLowerCase()}.auth0://${AUTH0_DOMAIN}/ios/${IOS_LEGACY_BUNDLE_ID.toLowerCase()}/callback`,
];

/**
 * Parameters for authorize(). Omit redirectUrl so react-native-auth0 derives it from the
 * native bundle id at runtime (must match Info.plist URL scheme + Auth0 Allowed Callback URLs).
 */
export function getAuth0AuthorizeOptions() {
  return {
    scope: AUTH0_SCOPE,
  };
}

/** iOS ASWebAuthenticationSession options (avoids SSO consent modal; recommended for mobile). */
export function getAuth0WebAuthOptions() {
  return {
    ephemeralSession: true,
  };
}

export function isAuth0TransactionActiveError(error: unknown): boolean {
  const err = error as { code?: string; type?: string; message?: string };
  const message = err?.message ?? "";
  return (
    err?.code === "TRANSACTION_ACTIVE_ALREADY" ||
    err?.type === "TRANSACTION_ACTIVE_ALREADY" ||
    message.includes("active transaction")
  );
}

export function logAuth0Error(context: string, error: unknown): void {
  const err = error as {
    name?: string;
    message?: string;
    code?: string;
    type?: string;
  };
  console.warn(`[auth0] ${context}:`, {
    name: err?.name,
    message: err?.message,
    code: err?.code,
    type: err?.type,
  });
}

type AuthorizeFn = (
  parameters?: ReturnType<typeof getAuth0AuthorizeOptions>,
  options?: ReturnType<typeof getAuth0WebAuthOptions>
) => Promise<unknown>;

type CancelWebAuthFn = () => Promise<boolean | void>;

/** Shared authorize wrapper with iOS stale-transaction recovery. */
export async function runAuth0Authorize(
  authorize: AuthorizeFn,
  cancelWebAuth?: CancelWebAuthFn
): Promise<unknown> {
  const authParams = getAuth0AuthorizeOptions();
  const webAuthOptions = getAuth0WebAuthOptions();

  try {
    return await authorize(authParams, webAuthOptions);
  } catch (error) {
    if (Platform.OS === "ios" && cancelWebAuth && isAuth0TransactionActiveError(error)) {
      try {
        await cancelWebAuth();
      } catch {
        // ignore cancel failures
      }
      return await authorize(authParams, webAuthOptions);
    }
    throw error;
  }
}
