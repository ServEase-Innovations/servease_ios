import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform, Linking } from "react-native";
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
    console.log(`🔓 Platform: ${Platform.OS}`);
    
    // Create a promise that resolves when the deep link callback is triggered
    const logoutPromise = new Promise<void>((resolve, reject) => {
      let linkingSubscription: any;
      let timeoutId: NodeJS.Timeout;
      
      // Set up deep link listener to detect when logout redirect completes
      const handleUrl = ({ url }: { url: string }) => {
        console.log(`🔗 Received deep link during logout: ${url}`);
        
        // Check if this is the logout callback
        if (url.includes('/callback') || url.includes('auth0')) {
          console.log('✅ Logout redirect completed');
          cleanup();
          resolve();
        }
      };
      
      const cleanup = () => {
        if (linkingSubscription) {
          linkingSubscription.remove();
        }
        clearTimeout(timeoutId);
      };
      
      // Listen for the deep link callback
      linkingSubscription = Linking.addEventListener('url', handleUrl);
      
      // Set a timeout to prevent hanging (5 seconds)
      timeoutId = setTimeout(() => {
        console.log('⏱️ Logout callback timeout - assuming success');
        cleanup();
        resolve();
      }, 5000);
      
      // Initiate the actual Auth0 logout
      clearSession(
        { 
          returnToUrl: returnUrl,
          federated: true  // Clear federated session to ensure complete logout
        },
        {
          ephemeralSession: true  // Prevents SSO dialog on iOS
        }
      ).then(() => {
        console.log('📤 Auth0 clearSession call completed');
        // Don't resolve immediately - wait for the callback or timeout
      }).catch((error) => {
        console.error('❌ Auth0 clearSession error:', error);
        cleanup();
        reject(error);
      });
    });
    
    // Wait for the logout to complete
    await logoutPromise;
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
