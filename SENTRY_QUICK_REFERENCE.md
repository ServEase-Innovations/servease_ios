# Sentry Quick Reference - ServEase iOS

## 🎯 Quick Start

Sentry is already configured and running! It will automatically capture:
- ✅ Unhandled JavaScript errors
- ✅ Native crashes (iOS/Android)
- ✅ Promise rejections
- ✅ Performance metrics
- ✅ User sessions

## 📍 Manual Error Tracking

### Capture an Exception
```typescript
import * as Sentry from '@sentry/react-native';

try {
  // risky code
} catch (error) {
  Sentry.captureException(error);
}
```

### Capture with Context
```typescript
Sentry.captureException(error, {
  tags: { section: 'booking' },
  extra: { bookingId: '123' },
  level: 'error',
});
```

### Capture a Message
```typescript
Sentry.captureMessage('Payment completed', 'info');
```

## 👤 User Context

### Set User (on login)
```typescript
Sentry.setUser({
  id: user.id,
  email: user.email,
  role: user.role,
});
```

### Clear User (on logout)
```typescript
Sentry.setUser(null);
```

## 🍞 Breadcrumbs

```typescript
Sentry.addBreadcrumb({
  category: 'navigation',
  message: 'User navigated to Bookings',
  level: 'info',
  data: { screen: 'Bookings' },
});
```

## ⚡ Performance Tracking

```typescript
const transaction = Sentry.startTransaction({
  name: 'Load Dashboard',
  op: 'navigation',
});

// ... do work ...

transaction.finish();
```

## 🧪 Testing Sentry

```typescript
import { testSentryError, runAllSentryTests } from './src/utils/sentryTest';

// Test single error
testSentryError();

// Run all tests
runAllSentryTests();
```

## 🔧 Common Use Cases

### Track Booking Errors
```typescript
import { trackBookingError } from './src/utils/sentryTest';

trackBookingError(error, {
  id: booking.id,
  serviceType: 'maid',
  customerId: customer.id,
});
```

### Track Payment Errors
```typescript
import { trackPaymentError } from './src/utils/sentryTest';

trackPaymentError(error, {
  amount: 1000,
  currency: 'INR',
  method: 'razorpay',
});
```

### Track API Errors
```typescript
import { trackAPIError } from './src/utils/sentryTest';

trackAPIError(error, '/api/bookings', 'POST');
```

## 🎚️ Error Levels

```typescript
'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug'
```

## 📊 View Events

Dashboard: https://servease-innovation.sentry.io/

- **Issues** → Errors and crashes
- **Performance** → Transaction traces
- **Releases** → Track deployments
- **Alerts** → Set up notifications

## ⚙️ Configuration

Located in: `apps/servease-ios/index.js`

**DSN:** Already configured  
**Environment:** Auto-detected (dev/prod)  
**Sample Rate:** 100% dev, 20% prod  

## 🚫 Filtered Errors

These errors are automatically ignored:
- `Non-Error promise rejection captured`
- `Network request failed`

## 💡 Tips

1. **Development:** Events logged to console but NOT sent to Sentry
2. **Production:** All events sent automatically
3. **Enable in Dev:** Set `SENTRY_ENABLED_IN_DEV` environment variable
4. **User Privacy:** Don't log sensitive data (passwords, tokens, PII)
5. **Performance:** Adjust `tracesSampleRate` for high-traffic apps

## 📚 Documentation

Full setup guide: `SENTRY_SETUP.md`  
Test utilities: `src/utils/sentryTest.ts`  
Official docs: https://docs.sentry.io/platforms/react-native/
