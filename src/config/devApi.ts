import { Platform } from "react-native";

/**
 * Physical iPhone cannot reach your Mac via "localhost".
 * Set to your Mac's Wi‑Fi IP when testing on a real device, e.g. "192.168.1.42".
 * Simulator: leave null (uses localhost).
 * Find IP: run `ipconfig getifaddr en0` in Terminal.
 */
export const DEV_LAN_HOST: string | null = null;

import { API_URLS } from "./apiUrls";

const PROD_UTILS_URL = API_URLS.utils;

export function getUtilsApiUrl(): string {
  if (!__DEV__) {
    return PROD_UTILS_URL;
  }

  if (DEV_LAN_HOST) {
    return `http://${DEV_LAN_HOST}:3030`;
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:3030";
  }

  return "http://localhost:3030";
}
