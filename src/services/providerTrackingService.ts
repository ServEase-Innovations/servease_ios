import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URLS } from '../config/apiUrls';

// Use the tracking API URL from config
const TRACKING_API_URL = API_URLS.tracking;

/**
 * Get auth token from storage
 */
async function getAuthToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem('authToken');
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

/**
 * Provider Tracking Service
 */

export interface TrackingStatus {
  engagement_id: number;
  provider_id: number;
  tracking_status: 'not_started' | 'en_route' | 'arrived' | 'service_started' | 'service_completed';
  latitude?: number;
  longitude?: number;
  last_location_update?: string;
  journey_started_at?: string;
  arrived_at?: string;
  service_started_at?: string;
  service_completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface StartJourneyResponse {
  message: string;
  engagement_id: number;
  tracking_status: string;
  journey_started_at: string;
}

/**
 * Start journey for an engagement (enables customer tracking)
 */
export async function startJourney(
  engagementId: number,
  location?: { latitude: number; longitude: number }
): Promise<StartJourneyResponse> {
  const token = await getAuthToken();
  
  const response = await axios.post(
    `${TRACKING_API_URL}/api/tracking/provider/start-journey`,
    {
      engagement_id: engagementId,
      latitude: location?.latitude,
      longitude: location?.longitude,
    },
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  
  return response.data;
}

/**
 * Mark provider as arrived at customer location
 */
export async function markArrived(
  engagementId: number,
  location?: { latitude: number; longitude: number }
): Promise<{ message: string; engagement_id: number; tracking_status: string }> {
  const token = await getAuthToken();
  
  const response = await axios.post(
    `${TRACKING_API_URL}/api/tracking/provider/arrived`,
    {
      engagement_id: engagementId,
      latitude: location?.latitude,
      longitude: location?.longitude,
    },
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  
  return response.data;
}

/**
 * Mark service as started
 */
export async function markServiceStarted(
  engagementId: number
): Promise<{ message: string; engagement_id: number; tracking_status: string }> {
  const token = await getAuthToken();
  
  const response = await axios.post(
    `${TRACKING_API_URL}/api/tracking/provider/start-service`,
    {
      engagement_id: engagementId,
    },
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  
  return response.data;
}

/**
 * Mark service as completed
 */
export async function markServiceCompleted(
  engagementId: number
): Promise<{ message: string; engagement_id: number; tracking_status: string }> {
  const token = await getAuthToken();
  
  const response = await axios.post(
    `${TRACKING_API_URL}/api/tracking/provider/complete-service`,
    {
      engagement_id: engagementId,
    },
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  
  return response.data;
}

/**
 * Get current tracking status for an engagement
 */
export async function getTrackingStatus(engagementId: number): Promise<TrackingStatus | null> {
  try {
    const token = await getAuthToken();
    
    const response = await axios.get(
      `${TRACKING_API_URL}/api/tracking/provider/status/${engagementId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error getting tracking status:', error);
    return null;
  }
}

/**
 * Update location during journey
 * This should be called periodically while en_route
 */
export async function updateLocation(
  engagementId: number,
  latitude: number,
  longitude: number
): Promise<void> {
  // Location updates would go through WebSocket or a separate endpoint
  // For now, we can use the start-journey endpoint to update location
  console.log(`Update location for engagement ${engagementId}:`, { latitude, longitude });
}

export default {
  startJourney,
  markArrived,
  markServiceStarted,
  markServiceCompleted,
  getTrackingStatus,
  updateLocation,
};
