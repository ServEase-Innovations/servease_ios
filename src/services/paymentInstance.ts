// src/PaymentInstance.ts
import axios, {
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PaymentInstance = axios.create({
  baseURL: "https://payments-j5id.onrender.com",
  timeout: 30000, // Longer timeout for payment processing
});

// Request Interceptor
PaymentInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await AsyncStorage.getItem("token");

      if (token) {
        config.headers.set("Authorization", `Bearer ${token}`);
      }

      // Ensure JSON content type
      config.headers.set("Content-Type", "application/json");
    } catch (err) {
      console.error("Error retrieving token from AsyncStorage:", err);
    }

    return config;
  },
  (error: AxiosError) => {
    console.error("Payment request error:", error);
    return Promise.reject(error);
  }
);

// Response Interceptor
PaymentInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      console.error("Payment authorization failed");
    } else if (error.response?.status === 402) {
      console.error("Payment required or failed");
    } else if (error.code === "ECONNABORTED") {
      console.error("Payment request timeout");
    }

    return Promise.reject(error);
  }
);

export default PaymentInstance;
