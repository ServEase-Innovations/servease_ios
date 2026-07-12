import { Platform } from "react-native";
import DeviceInfo from "react-native-device-info";
import { API_URLS } from "./apiUrls";

/**
 * Physical iPhone cannot reach your Mac via "localhost".
 * Set to your Mac's Wi‑Fi IP when testing utils locally on a real device, e.g. "192.168.1.42".
 * Simulator: leave null (uses localhost when utils runs on the Mac).
 * Find IP: run `ipconfig getifaddr en0` in Terminal.
 */
export const DEV_LAN_HOST: string | null = null;

const PROD_UTILS_URL = API_URLS.utils;
const PROD_PREFERENCES_URL = API_URLS.preferences;

function isRunningOnEmulator(): boolean {
  try {
    return DeviceInfo.isEmulatorSync();
  } catch {
    return false;
  }
}

export function getUtilsApiUrl(): string {
  if (!__DEV__) {
    return PROD_UTILS_URL;
  }

  if (DEV_LAN_HOST) {
    return `http://${DEV_LAN_HOST}:3030`;
  }

  if (Platform.OS === "android" && isRunningOnEmulator()) {
    return "http://10.0.2.2:3030";
  }

  if (Platform.OS === "ios" && isRunningOnEmulator()) {
    return "http://localhost:3030";
  }

  // Physical device (or unknown): use deployed utils — same pattern as providerInstance.
  return PROD_UTILS_URL;
}

export function getPreferencesApiUrl(): string {
  if (!__DEV__) {
    return PROD_PREFERENCES_URL;
  }

  if (DEV_LAN_HOST) {
    return `http://${DEV_LAN_HOST}:3001`;
  }

  if (Platform.OS === "android" && isRunningOnEmulator()) {
    return "http://10.0.2.2:3001";
  }

  if (Platform.OS === "ios" && isRunningOnEmulator()) {
    return "http://localhost:3001";
  }

  return PROD_PREFERENCES_URL;
}
