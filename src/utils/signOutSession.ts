import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { 
  AUTH0_DOMAIN, 
  ANDROID_PACKAGE, 
  IOS_BUNDLE_ID 
} from "./auth0Config";

export const MOBILE_AUTH_STORAGE_KEYS = ["token", "userRole", "@app_user_data"] as const;

/** Clears OTP / mobile login tokens and persisted app user blob. */
export async function clearMobileAuthStorage(): Promise<void> {
  await AsyncStorage.multiRemove([...MOBILE_AUTH_STORAGE_KEYS]);
}

type ClearSessionFn = (
  options: { returnToUrl?: string; federated?: boolean },
  webAuthOptions?: { ephemeralSession?: boolean }
) => Promise<void>;

/**
 * Build platform-specific logout return URL
 * Must match Auth0 Allowed Logout URLs configuration
 */
function getLogoutReturnUrl(): string {
  if (Platform.OS === "android") {
    // Android: Use custom scheme that matches the package
    return `${ANDROID_PACKAGE.toLowerCase()}.auth0://${AUTH0_DOMAIN}/android/${ANDROID_PACKAGE.toLowerCase()}/callback`;
  }
  // iOS: Use custom scheme that matches the bundle ID
  return `${IOS_BUNDLE_ID.toLowerCase()}.auth0://${AUTH0_DOMAIN}/ios/${IOS_BUNDLE_ID.toLowerCase()}/callback`;
}

/** Auth0 clear is optional — phone OTP users have no Auth0 session. */
export async function tryClearAuth0Session(clearSession: ClearSessionFn): Promise<void> {
  try {
    const returnUrl = getLogoutReturnUrl();
    console.log(`🔓 Clearing Auth0 session with returnUrl: ${returnUrl}`);
    
    await clearSession(
      { 
        returnToUrl: returnUrl,
        federated: true  // Clear federated session to ensure complete logout
      },
      {
        ephemeralSession: true  // Prevents SSO dialog on iOS
      }
    );
    
    console.log("✅ Auth0 session cleared successfully");
  } catch (e: any) {
    // Gracefully handle common logout scenarios
    const errorMessage = e?.message?.toLowerCase() || "";
    
    if (errorMessage.includes("no session") || 
        errorMessage.includes("not authenticated") ||
        errorMessage.includes("no active session")) {
      console.log("ℹ️ No active Auth0 session to clear");
    } else {
      console.warn("⚠️ Auth0 session clear error (non-critical):", e);
    }
  }
}
