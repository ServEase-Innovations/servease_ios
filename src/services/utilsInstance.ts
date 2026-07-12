import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getUtilsApiUrl } from "../config/devApi";

let devLanOverride: string | null = null;
try {
  // Optional: apps/servease-ios/src/config/devApi.local.ts (gitignored)
  // eslint-disable-next-line @typescript-eslint/no-require-imports, global-require
  const local = require("../config/devApi.local") as { DEV_LAN_HOST?: string | null };
  if (local?.DEV_LAN_HOST) devLanOverride = local.DEV_LAN_HOST;
} catch {
  /* no local override */
}

const UTILS_BASE_URL =
  process.env.UTILS_API_URL?.replace(/\/$/, "") ||
  (devLanOverride ? `http://${devLanOverride}:3030` : getUtilsApiUrl());

if (__DEV__) {
  console.log("[utils] API base URL:", UTILS_BASE_URL);
}

const utilsInstance = axios.create({
  baseURL: UTILS_BASE_URL,
  timeout: 30000,
});

utilsInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      /* ignore */
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

utilsInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => Promise.reject(error)
);

export default utilsInstance;
export { UTILS_BASE_URL };
