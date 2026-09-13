/**
 * API base URLs for mobile app.
 * 
 * Environment-specific configuration:
 * - Development: Loads from .env.development (Render.com endpoints by default)
 * - Production: Uses Render.com endpoints
 * 
 * Note: Uses REACT_APP_* naming convention to match web app for consistency.
 */

import {
  REACT_APP_PAYMENTS_URL,
  REACT_APP_PROVIDER_URL,
  REACT_APP_UTILS_URL,
  REACT_APP_PREFERENCES_URL,
  REACT_APP_REVIEWS_URL,
  REACT_APP_TICKETS_URL,
  REACT_APP_COUPONS_URL,
  REACT_APP_CHAT_URL,
  REACT_APP_IMAGE_UPLOADER_URL,
  REACT_APP_TRACKING_API_URL,
} from '@env';

const __DEV__ = process.env.NODE_ENV !== 'production';

/**
 * Development endpoints (from .env.development)
 * Falls back to localhost if env vars not set
 */
const DEVELOPMENT_URLS = {
  payments: REACT_APP_PAYMENTS_URL || 'http://localhost:4100',
  providers: REACT_APP_PROVIDER_URL || 'http://localhost:4000',
  utils: REACT_APP_UTILS_URL || 'http://localhost:3030',
  preferences: REACT_APP_PREFERENCES_URL || 'http://localhost:3001',
  reviews: REACT_APP_REVIEWS_URL || 'http://localhost:5005',
  tickets: REACT_APP_TICKETS_URL || 'http://localhost:5006',
  coupons: REACT_APP_COUPONS_URL || 'http://localhost:3002',
  chat: REACT_APP_CHAT_URL || 'http://localhost:5001',
  imageUploader: REACT_APP_IMAGE_UPLOADER_URL || 'http://localhost:5003',
  tracking: REACT_APP_TRACKING_API_URL || 'http://localhost:5007',
} as const;

/**
 * Production endpoints (from .env.production or fallback to Render.com)
 */
const PRODUCTION_URLS = {
  payments: REACT_APP_PAYMENTS_URL || 'https://payments-vyqp.onrender.com',
  providers: REACT_APP_PROVIDER_URL || 'https://providers-da9c6dp42hec73fergtg.onrender.com',
  utils: REACT_APP_UTILS_URL || 'https://utils-qhvi.onrender.com',
  preferences: REACT_APP_PREFERENCES_URL || 'https://preferences-6leu.onrender.com',
  reviews: REACT_APP_REVIEWS_URL || 'https://reviews-4mls.onrender.com',
  tickets: REACT_APP_TICKETS_URL || 'https://tickets-1cfe.onrender.com',
  coupons: REACT_APP_COUPONS_URL || 'https://coupons-s9zq.onrender.com',
  chat: REACT_APP_CHAT_URL || 'https://chat-b3wl.onrender.com',
  imageUploader: REACT_APP_IMAGE_UPLOADER_URL || 'https://imageuploader-5njj.onrender.com',
  tracking: REACT_APP_TRACKING_API_URL || 'https://tracking-api.onrender.com',
} as const;

/**
 * Select configuration based on environment
 * Environment variables from .env.development can override these defaults
 */
export const API_URLS = __DEV__ ? DEVELOPMENT_URLS : PRODUCTION_URLS;

/**
 * For debugging: log which environment is active and endpoints being used
 */
if (__DEV__) {
  console.log('🔧 API Configuration: DEVELOPMENT');
  console.log('📡 Loaded from .env.development');
  console.log('🌐 Endpoints:', {
    payments: API_URLS.payments,
    providers: API_URLS.providers,
    utils: API_URLS.utils,
    preferences: API_URLS.preferences,
  });
} else {
  console.log('🚀 API Configuration: PRODUCTION');
  console.log('🌐 Using Render.com endpoints');
}

/**
 * Type for API endpoints
 */
export type ApiEndpoint = keyof typeof API_URLS;
