import axios, {
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REVIEWS_URL = 'https://reviews-19oo.onrender.com';

const reviewsInstance = axios.create({
  baseURL: REVIEWS_URL,
  timeout: 10000, // Add timeout for mobile networks
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor
reviewsInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
    } catch (error) {
      return Promise.reject(error);
    }
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
reviewsInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      try {
        // Clear invalid token
        await AsyncStorage.removeItem('token');
        // You can add navigation logic here using navigation ref or context
        // For example, if you're using React Navigation:
        // navigationRef.current?.navigate('Login');
      } catch (storageError) {
        console.error('Error clearing token:', storageError);
      }
    }
    
    // Handle network errors specifically for mobile
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout');
    }
    
    if (!error.response) {
      console.error('Network error - check your internet connection');
    }
    
    return Promise.reject(error);
  }
);

export default reviewsInstance;