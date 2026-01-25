// src/utilsInstance.ts
import axios, {
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const utilsInstance = axios.create({
  baseURL: "https://utils-ndt3.onrender.com",
  // You can also switch to your local/dev URLs
  // baseURL: "http://localhost:8080",
});

// Request Interceptor
utilsInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        config.headers.set("Authorization", `Bearer ${token}`);
      }
    } catch (err) {
      console.error("Error reading token from AsyncStorage:", err);
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
utilsInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      console.error("Unauthorized access - clearing token");
      await AsyncStorage.removeItem("token");
      // Optionally, you can navigate to Login screen here using your navigation system
      // Example (if using React Navigation): NavigationService.navigate("Login");
    }
    return Promise.reject(error);
  }
);

export default utilsInstance;
