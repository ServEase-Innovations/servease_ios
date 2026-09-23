// index.js — gesture-handler, Firebase, and Sentry must load before any other imports.
import 'react-native-gesture-handler';
import '@react-native-firebase/app';

// Initialize Sentry as early as possible
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://d75adcf8ccdbbd12e1b8c933df1677ae@o4509086584274944.ingest.us.sentry.io/4509086589681664',
  
  // Set environment
  environment: __DEV__ ? 'development' : 'production',
  
  // Enable debug mode in development
  debug: __DEV__,
  
  // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring
  // Adjust this value in production (0.2 = 20% of transactions)
  tracesSampleRate: __DEV__ ? 1.0 : 0.2,
  
  // Enable auto session tracking
  enableAutoSessionTracking: true,
  
  // Session timeout in milliseconds (30 minutes)
  sessionTrackingIntervalMillis: 1800000,
  
  // Attach stack trace to messages
  attachStacktrace: true,
  
  // Enable native crash handling
  enableNative: true,
  
  // Enable auto breadcrumbs and performance tracing
  enableAutoPerformanceTracing: true,
  
  // Before sending events, you can modify them
  beforeSend(event, hint) {
    // Don't send events in development (set SENTRY_ENABLED_IN_DEV to enable)
    if (__DEV__) {
      console.log('[Sentry] Event captured (dev mode):', event);
      return null; // Don't send to Sentry in dev
    }
    return event;
  },
  
  // Ignore specific errors
  ignoreErrors: [
    'Non-Error promise rejection captured',
    'Network request failed',
  ],
});

import { AppRegistry } from 'react-native';
import React from 'react';
import messaging from '@react-native-firebase/messaging';
import App from './App';
import { name as appName } from './app.json';
import { Provider } from 'react-redux';
import store from './src/store/userStore';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Required for background FCM on Android; must run after @react-native-firebase/app.
try {
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('[push] background message', remoteMessage?.messageId);
  });
} catch (err) {
  console.warn('[push] background handler registration failed', err);
}

// Wrap App component with Sentry for error boundary and profiling
const SentryWrappedApp = Sentry.wrap(App);

const Root = () => (
  <Provider store={store}>
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SentryWrappedApp />
    </GestureHandlerRootView>
  </Provider>
);

AppRegistry.registerComponent(appName, () => Root);
