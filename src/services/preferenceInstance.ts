import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const preferenceInstance = axios.create({
  baseURL: 'https://preferences.onrender.com', // your specified base URL
});

// Request Interceptor
preferenceInstance.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error retrieving token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
preferenceInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // handle unauthorized if needed
      console.log('Unauthorized access - 401');
    }
    return Promise.reject(error);
  }
);

export default preferenceInstance;