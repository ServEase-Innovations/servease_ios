import axios from 'axios';
import { API_URLS } from '../config/apiUrls';

const trackingAPI = axios.create({
  baseURL: `${API_URLS.tracking}/api/tracking`,
  timeout: 10000,
});

/**
 * Check if tracking is available for an engagement
 */
export const checkTrackingAvailability = async (engagementId: number) => {
  const response = await trackingAPI.get(`/availability/${engagementId}`);
  return response.data;
};

/**
 * Start a tracking session
 */
export const startTrackingSession = async (engagementId: number, customerId: number) => {
  const response = await trackingAPI.post('/session/start', {
    engagement_id: engagementId,
    customer_id: customerId,
  });
  return response.data;
};

/**
 * Stop a tracking session
 */
export const stopTrackingSession = async (sessionId: string) => {
  const response = await trackingAPI.post('/session/stop', {
    session_id: sessionId,
  });
  return response.data;
};

/**
 * Get latest location update (polling fallback)
 */
export const getLocationUpdate = async (engagementId: number) => {
  const response = await trackingAPI.get(`/location/${engagementId}`);
  return response.data;
};

/**
 * Calculate ETA with traffic
 */
export const calculateETA = async (engagementId: number) => {
  const response = await trackingAPI.post('/calculate-eta', {
    engagement_id: engagementId,
  });
  return response.data;
};

/**
 * Get cached ETA
 */
export const getETA = async (engagementId: number) => {
  const response = await trackingAPI.get(`/eta/${engagementId}`);
  return response.data;
};

export default {
  checkTrackingAvailability,
  startTrackingSession,
  stopTrackingSession,
  getLocationUpdate,
  calculateETA,
  getETA,
};
