import AsyncStorage from "@react-native-async-storage/async-storage";

export const MOBILE_AUTH_STORAGE_KEYS = ["token", "userRole", "@app_user_data"] as const;

/** Clears OTP / mobile login tokens and persisted app user blob. */
export async function clearMobileAuthStorage(): Promise<void> {
  await AsyncStorage.multiRemove([...MOBILE_AUTH_STORAGE_KEYS]);
}

type ClearSessionFn = (options: { returnToUrl: string }) => Promise<void>;

/** Auth0 clear is optional — phone OTP users have no Auth0 session. */
export async function tryClearAuth0Session(clearSession: ClearSessionFn): Promise<void> {
  try {
    await clearSession({ returnToUrl: "com.serveaso://logout" });
  } catch (e) {
    console.log("No Auth0 session to clear:", e);
  }
}
