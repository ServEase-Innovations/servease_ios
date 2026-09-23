/**
 * Sentry Test Utilities
 * Use these functions to verify Sentry is capturing events correctly
 */

import * as Sentry from '@sentry/react-native';

/**
 * Test capturing a handled JavaScript error
 * Should appear in Sentry dashboard under Issues
 */
export const testSentryError = () => {
  try {
    throw new Error('🧪 Test Sentry Error - This is a test error from ServEase iOS');
  } catch (e) {
    Sentry.captureException(e, {
      tags: {
        test: true,
        type: 'handled-error',
      },
      extra: {
        timestamp: new Date().toISOString(),
        testInfo: 'Testing Sentry error capture',
      },
    });
    console.log('✅ Test error captured by Sentry');
  }
};

/**
 * Test capturing an unhandled error
 * WARNING: This will crash the app if error boundaries are not set up
 */
export const testSentryUnhandledError = () => {
  console.warn('⚠️ About to throw unhandled error - app may crash');
  setTimeout(() => {
    throw new Error('🧪 Test Unhandled Error - This should crash the app');
  }, 100);
};

/**
 * Test capturing a message/log
 * Should appear in Sentry dashboard
 */
export const testSentryMessage = () => {
  Sentry.captureMessage('🧪 Test Sentry Message - Hello from ServEase iOS!', {
    level: 'info',
    tags: {
      test: true,
      type: 'message',
    },
  });
  console.log('✅ Test message sent to Sentry');
};

/**
 * Test adding breadcrumbs
 * Breadcrumbs help trace what happened before an error
 */
export const testSentryBreadcrumb = () => {
  Sentry.addBreadcrumb({
    category: 'test',
    message: 'User performed test action',
    level: 'info',
    data: {
      screen: 'HomePage',
      action: 'test_sentry',
      timestamp: Date.now(),
    },
  });
  console.log('✅ Test breadcrumb added');
  
  // Throw an error to see the breadcrumb in context
  testSentryError();
};

/**
 * Test performance tracking
 * Should appear in Sentry Performance dashboard
 */
export const testSentryPerformance = () => {
  const transaction = Sentry.startTransaction({
    name: 'Test Transaction',
    op: 'test',
    tags: {
      test: true,
    },
  });

  // Simulate some work
  const span = transaction.startChild({
    op: 'test-operation',
    description: 'Simulated work',
  });

  setTimeout(() => {
    span.finish();
    transaction.finish();
    console.log('✅ Test performance transaction completed');
  }, 1000);
};

/**
 * Test setting user context
 * User info will be attached to all future events
 */
export const testSentryUserContext = () => {
  Sentry.setUser({
    id: 'test-user-123',
    email: 'test@serveaso.com',
    username: 'Test User',
  });
  
  Sentry.setContext('test', {
    environment: 'testing',
    platform: 'react-native',
  });
  
  console.log('✅ Test user context set');
  
  // Throw an error to see the user context
  testSentryError();
};

/**
 * Clear user context (use on logout)
 */
export const clearSentryUser = () => {
  Sentry.setUser(null);
  console.log('✅ Sentry user context cleared');
};

/**
 * Run all Sentry tests
 * Use this to verify Sentry integration is working
 */
export const runAllSentryTests = () => {
  console.log('🧪 Starting Sentry integration tests...');
  
  testSentryBreadcrumb();
  
  setTimeout(() => {
    testSentryMessage();
  }, 500);
  
  setTimeout(() => {
    testSentryPerformance();
  }, 1000);
  
  setTimeout(() => {
    testSentryUserContext();
  }, 1500);
  
  console.log('✅ All Sentry tests scheduled. Check Sentry dashboard in a few moments.');
};

/**
 * Example: Track booking errors
 */
export const trackBookingError = (error: Error, bookingData: any) => {
  Sentry.captureException(error, {
    tags: {
      section: 'booking',
      severity: 'high',
    },
    extra: {
      bookingId: bookingData?.id,
      serviceType: bookingData?.serviceType,
      customerId: bookingData?.customerId,
    },
    contexts: {
      booking: bookingData,
    },
  });
};

/**
 * Example: Track payment errors
 */
export const trackPaymentError = (error: Error, paymentData: any) => {
  Sentry.captureException(error, {
    tags: {
      section: 'payment',
      severity: 'critical',
    },
    extra: {
      amount: paymentData?.amount,
      currency: paymentData?.currency,
      paymentMethod: paymentData?.method,
    },
    level: 'error',
  });
};

/**
 * Example: Track API errors
 */
export const trackAPIError = (error: Error, endpoint: string, method: string) => {
  Sentry.captureException(error, {
    tags: {
      section: 'api',
      endpoint,
      method,
    },
    extra: {
      url: endpoint,
      httpMethod: method,
      timestamp: new Date().toISOString(),
    },
  });
};

export default {
  testSentryError,
  testSentryUnhandledError,
  testSentryMessage,
  testSentryBreadcrumb,
  testSentryPerformance,
  testSentryUserContext,
  clearSentryUser,
  runAllSentryTests,
  trackBookingError,
  trackPaymentError,
  trackAPIError,
};
