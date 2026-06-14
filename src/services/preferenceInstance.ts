import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getPreferencesApiUrl } from "../config/devApi";

const PREFERENCES_BASE_URL = getPreferencesApiUrl();

if (__DEV__) {
  console.log("[preferences] API base URL:", PREFERENCES_BASE_URL);
}

const preferenceInstance = axios.create({
  baseURL: PREFERENCES_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

preferenceInstance.interceptors.request.use(
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

preferenceInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => Promise.reject(error)
);

export default preferenceInstance;
export { PREFERENCES_BASE_URL };
