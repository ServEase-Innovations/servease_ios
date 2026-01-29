import axios, { AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create an axios instance with the base URL
const axiosInstance = axios.create({
  baseURL: 'https://servease-be-5x7f.onrender.com', // Change this to your API's base URL
});

// Request Interceptor
axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await AsyncStorage.getItem('token'); // Retrieve token from AsyncStorage
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error retrieving token:', error);
    }
    return config;
  },
  (error: AxiosError) => {
    // Handle request errors
    return Promise.reject(error);
  }
);

// Response Interceptor
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      console.warn('Unauthorized access - Token may be invalid or expired.');
      // Handle unauthorized access (e.g., logout user, refresh token, navigate to login, etc.)
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
