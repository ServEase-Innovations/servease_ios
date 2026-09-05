/**
 * API base URLs for mobile app.
 * 
 * Environment-specific configuration:
 * - Development: Uses localhost (for simulator/emulator) or LAN IP (for physical devices)
 * - Production: Uses Render.com endpoints
 * 
 * Override with .env file or devApi.local.ts for physical device testing.
 */

const __DEV__ = process.env.NODE_ENV !== 'production';

/**
 * Development endpoints (localhost for simulators)
 */
const DEVELOPMENT_URLS = {
  payments: 'http://localhost:4100',
  providers: 'http://localhost:4000',
  utils: 'http://localhost:3030',
  preferences: 'http://localhost:3001',
  reviews: 'http://localhost:5005',
  tickets: 'http://localhost:5006',
  coupons: 'http://localhost:3002',
  chat: 'http://localhost:5001',
  imageUploader: 'http://localhost:5003',
  tracking: 'http://localhost:5007',
} as const;

/**
 * Production endpoints (Render.com)
 * TODO: Update these with your actual Render service URLs
 */
const PRODUCTION_URLS = {
  payments: 'https://payments-vyqp.onrender.com',
  providers: 'https://providers-da9c6dp42hec73fergtg.onrender.com',
  utils: 'https://utils-qhvi.onrender.com',
  preferences: 'https://preferences-6leu.onrender.com',
  reviews: 'https://reviews-4mls.onrender.com',
  tickets: 'https://tickets-1cfe.onrender.com',
  coupons: 'https://coupons-s9zq.onrender.com',
  chat: 'https://chat-b3wl.onrender.com',
  imageUploader: 'https://imageuploader-5njj.onrender.com',
  tracking: 'https://tracking-api.onrender.com',
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
