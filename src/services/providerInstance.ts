// src/services/providerInstance.ts
import axios, { AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const providerInstance = axios.create({
  baseURL: 'https://providers-08ug.onrender.com',
  // Add timeout to prevent hanging requests
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request Interceptor
providerInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      // Use AsyncStorage instead of localStorage
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('Failed to get token from AsyncStorage:', error);
    }
    
    // Add timestamp for debugging
    config.headers['X-Request-Timestamp'] = new Date().toISOString();
    
    console.log('🌐 API Request:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      data: config.data,
    });
    
    return config;
  },
  (error: AxiosError) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response Interceptor
providerInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('✅ API Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data,
    });
    return response;
  },
  async (error: AxiosError) => {
    console.error('❌ API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      responseData: error.response?.data,
    });

    if (error.response?.status === 401) {
      // Handle unauthorized access
      console.log('🔐 Unauthorized access detected');
      
      try {
        // Clear token if unauthorized
        await AsyncStorage.removeItem('token');
        
        // You might want to trigger a re-login or show a notification here
        // For example, you could use a Redux action or context
        // dispatch(logoutAction());
      } catch (storageError) {
        console.warn('Failed to clear token:', storageError);
      }
    }
    
    // Handle network errors specifically
    if (!error.response) {
      console.error('🌐 Network Error - No response received');
      // You might want to show a network error message to the user
    }

    return Promise.reject(error);
  }
);

export default providerInstance;