/**
 * API base URLs for mobile app.
 * 
 * Environment-specific configuration:
 * - Development: Uses localhost (for simulator/emulator) or LAN IP (for physical devices)
 * - Production: Uses Render.com endpoints
 * 
 * Override with .env file or devApi.local.ts for physical device testing.
 * 
 * Note: Uses REACT_APP_* naming convention to match web app for consistency.
 */

const __DEV__ = process.env.NODE_ENV !== 'production';

/**
 * Development endpoints (localhost for simulators)
 */
const DEVELOPMENT_URLS = {
  payments: process.env.REACT_APP_PAYMENTS_URL || 'http://localhost:4100',
  providers: process.env.REACT_APP_PROVIDER_URL || 'http://localhost:4000',
  utils: process.env.REACT_APP_UTILS_URL || 'http://localhost:3030',
  preferences: process.env.REACT_APP_PREFERENCES_URL || 'http://localhost:3001',
  reviews: process.env.REACT_APP_REVIEWS_URL || 'http://localhost:5005',
  tickets: process.env.REACT_APP_TICKETS_URL || 'http://localhost:5006',
  coupons: process.env.REACT_APP_COUPONS_URL || 'http://localhost:3002',
  chat: process.env.REACT_APP_CHAT_URL || 'http://localhost:5001',
  imageUploader: process.env.REACT_APP_IMAGE_UPLOADER_URL || 'http://localhost:5003',
  tracking: process.env.REACT_APP_TRACKING_API_URL || 'http://localhost:5007',
} as const;

/**
 * Production endpoints (Render.com)
 * TODO: Update these with your actual Render service URLs
 */
const PRODUCTION_URLS = {
  payments: process.env.REACT_APP_PAYMENTS_URL || 'https://payments-vyqp.onrender.com',
  providers: process.env.REACT_APP_PROVIDER_URL || 'https://providers-da9c6dp42hec73fergtg.onrender.com',
  utils: process.env.REACT_APP_UTILS_URL || 'https://utils-qhvi.onrender.com',
  preferences: process.env.REACT_APP_PREFERENCES_URL || 'https://preferences-6leu.onrender.com',
  reviews: process.env.REACT_APP_REVIEWS_URL || 'https://reviews-4mls.onrender.com',
  tickets: process.env.REACT_APP_TICKETS_URL || 'https://tickets-1cfe.onrender.com',
  coupons: process.env.REACT_APP_COUPONS_URL || 'https://coupons-s9zq.onrender.com',
  chat: process.env.REACT_APP_CHAT_URL || 'https://chat-b3wl.onrender.com',
  imageUploader: process.env.REACT_APP_IMAGE_UPLOADER_URL || 'https://imageuploader-5njj.onrender.com',
  tracking: process.env.REACT_APP_TRACKING_API_URL || 'https://tracking-api.onrender.com',
} as const;

/**
 * Select configuration based on environment
 * Environment variables can override these defaults
 */
export const API_URLS = __DEV__ ? DEVELOPMENT_URLS : PRODUCTION_URLS;

/**
 * For debugging: log which environment is active
 */
if (__DEV__) {
  console.log('🔧 API Configuration: DEVELOPMENT');
  console.log('📡 Endpoints using localhost (simulator/emulator)');
  console.log('💡 For physical devices, create devApi.local.ts with your LAN IP');
}

/**
 * Type for API endpoints
 */
export type ApiEndpoint = keyof typeof API_URLS;
