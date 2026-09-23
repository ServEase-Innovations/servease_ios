/**
 * Sentry Configuration for React Native
 * Organization: servease-innovation
 * Project: react-native
 */

import * as Sentry from '@sentry/react-native';

export const initSentry = () => {
  Sentry.init({
    dsn: process.env.SENTRY_DSN || 'YOUR_SENTRY_DSN_HERE',
    
    // Set environment
    environment: __DEV__ ? 'development' : 'production',
    
    // Enable debug mode in development
    debug: __DEV__,
    
    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring
    // We recommend adjusting this value in production
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
    
    // Capture 100% of errors
    sampleRate: 1.0,
    
    // Enable auto session tracking
    enableAutoSessionTracking: true,
    
    // Session timeout in seconds (30 minutes)
    sessionTrackingIntervalMillis: 30000,
    
    // Attach stack trace to messages
    attachStacktrace: true,
    
    // Enable native crash handling
    enableNative: true,
    
    // Enable auto breadcrumbs
    enableAutoPerformanceTracing: true,
    
    // Integrations
    integrations: [
      new Sentry.ReactNativeTracing({
        // Pass instrumentation to be used as `routingInstrumentation`
        routingInstrumentation: new Sentry.ReactNavigationInstrumentation(),
        
        // Set `tracingOrigins` to control what origins are traced
        tracingOrigins: ['localhost', 'serveaso.com', /^\//],
        
        // Recommended: Enable automatic breadcrumbs for navigation
        enableStallTracking: false,
      }),
    ],
    
    // Before sending events, you can modify them
    beforeSend(event, hint) {
      // Don't send events in development unless explicitly enabled
      if (__DEV__ && !process.env.SENTRY_ENABLED_IN_DEV) {
        return null;
      }
      return event;
    },
    
    // Ignore specific errors
    ignoreErrors: [
      // React Native internal errors
      'Non-Error promise rejection captured',
      'Network request failed',
      // Add more patterns to ignore
    ],
  });
};

export default Sentry;
