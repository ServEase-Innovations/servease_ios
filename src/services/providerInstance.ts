// src/services/providerInstance.ts
import axios, { AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URLS } from '../config/apiUrls';

const providerInstance = axios.create({
  baseURL: API_URLS.providers,
  // Add timeout to prevent hanging requests
  timeout: 90000, // nearby-monthly can be slow on cold Render instances
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

/** Absolute URL for logging (baseURL + path + query). */
export function resolveProviderRequestUrl(
  config: Pick<InternalAxiosRequestConfig, 'baseURL' | 'url'>
): string {
  const base = String(
    config.baseURL || providerInstance.defaults.baseURL || API_URLS.providers
  ).replace(/\/$/, '');
  const path = String(config.url || '');
  if (/^https?:\/\//i.test(path)) return path;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

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

    const fullUrl = resolveProviderRequestUrl(config);
    
    console.log('🌐 Provider API Request:', {
      fullUrl,
      baseURL: config.baseURL || providerInstance.defaults.baseURL,
      path: config.url,
      method: config.method?.toUpperCase(),
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
    const fullUrl = resolveProviderRequestUrl(response.config);
    console.log('✅ Provider API Response:', {
      fullUrl,
      status: response.status,
      data: response.data,
    });
    return response;
  },
  async (error: AxiosError) => {
    const fullUrl = error.config ? resolveProviderRequestUrl(error.config) : 'unknown';
    console.error('❌ Provider API Error:', {
      fullUrl,
      baseURL: error.config?.baseURL || providerInstance.defaults.baseURL,
      path: error.config?.url,
      status: error.response?.status,
      message: error.message,
      responseData: error.response?.data,
      requestBody: error.config?.data,
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