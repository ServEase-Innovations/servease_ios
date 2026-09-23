# Sentry React Native Setup - ServEase iOS

## ✅ Setup Complete

Sentry has been successfully integrated into the ServEase iOS React Native app.

## Configuration

**Organization:** servease-innovation  
**Project:** react-native  
**DSN:** `https://d75adcf8ccdbbd12e1b8c933df1677ae@o4509086584274944.ingest.us.sentry.io/4509086589681664`

## Features Enabled

### 1. **Error Monitoring**
- Automatic capture of JavaScript errors
- Native crash reporting (iOS/Android)
- Unhandled promise rejection tracking
- React error boundary integration

### 2. **Performance Monitoring**
- Automatic performance tracing (20% sample rate in production)
- 100% tracing in development mode
- App start tracking
- Screen load tracking

### 3. **Session Tracking**
- Automatic session tracking enabled
- 30-minute session timeout
- Session health monitoring

### 4. **Breadcrumbs**
- Automatic breadcrumb capture for:
  - Navigation events
  - Network requests
  - Console logs
  - User interactions
  - Touch events

## Implementation Details

### index.js
Sentry is initialized **as early as possible** in `index.js` before any other imports:
- Configured with DSN
- Environment detection (dev/production)
- Error filtering for development
- App wrapped with `Sentry.wrap()` for error boundaries

### App.tsx
- Imported Sentry for manual error tracking
- Ready for custom error boundaries and manual captures

## Development vs Production

### Development Mode
- Debug logging enabled
- 100% transaction sampling
- Events logged to console but **NOT sent to Sentry** (to avoid noise)
- To enable sending in dev, set `SENTRY_ENABLED_IN_DEV` environment variable

### Production Mode
- Debug logging disabled
- 20% transaction sampling (configurable)
- All errors and crashes sent to Sentry
- Performance monitoring active

## Testing Sentry

### Test Error Capture
Add this to any component to test error tracking:

```typescript
import * as Sentry from '@sentry/react-native';

// Test JavaScript error
const testError = () => {
  try {
    throw new Error('Test Sentry Error!');
  } catch (e) {
    Sentry.captureException(e);
  }
};

// Test unhandled error (will be caught by error boundary)
const testUnhandled = () => {
  throw new Error('Unhandled Test Error');
};
```

### Test Performance Tracking
```typescript
import * as Sentry from '@sentry/react-native';

// Track custom operation
const transaction = Sentry.startTransaction({
  name: 'Load Dashboard',
  op: 'navigation',
});

// ... do work ...

transaction.finish();
```

### Test Breadcrumbs
```typescript
Sentry.addBreadcrumb({
  category: 'user-action',
  message: 'User clicked service card',
  level: 'info',
  data: {
    serviceType: 'maid',
  },
});
```

## Manual Error Tracking

### Capture Exceptions
```typescript
try {
  // risky operation
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      section: 'booking',
    },
    extra: {
      bookingId: booking.id,
    },
  });
}
```

### Capture Messages
```typescript
Sentry.captureMessage('Payment successful', 'info');
```

### Set User Context
```typescript
Sentry.setUser({
  id: user.id,
  email: user.email,
  role: user.role,
});
```

### Clear User on Logout
```typescript
Sentry.setUser(null);
```

## Ignored Errors

The following errors are automatically filtered:
- `Non-Error promise rejection captured`
- `Network request failed`

Add more patterns in `index.js` under `ignoreErrors` array.

## Configuration Options

Located in `index.js`:

```javascript
Sentry.init({
  dsn: 'YOUR_DSN',
  environment: __DEV__ ? 'development' : 'production',
  debug: __DEV__,
  tracesSampleRate: __DEV__ ? 1.0 : 0.2,
  enableAutoSessionTracking: true,
  sessionTrackingIntervalMillis: 1800000, // 30 minutes
  attachStacktrace: true,
  enableNative: true,
  enableAutoPerformanceTracing: true,
  // ... more options
});
```

## Build Configuration

### iOS
The Sentry wizard should have configured:
- `ios/Serveaso/AppDelegate.mm` - Native initialization
- `ios/Podfile` - Sentry pod dependency
- Build phases for debug symbol upload

Run `cd ios && pod install` if needed.

### Android
The wizard should have configured:
- `android/app/build.gradle` - Sentry plugin
- `android/settings.gradle` - Sentry repository
- ProGuard rules for release builds

## Viewing Events in Sentry

1. Go to https://servease-innovation.sentry.io/
2. Navigate to the `react-native` project
3. View:
   - **Issues** - Errors and crashes
   - **Performance** - Transaction traces and metrics
   - **Releases** - Track deployments
   - **Session Replay** - (if enabled) User session recordings

## Release Tracking

To associate errors with releases, add version info to `Sentry.init()`:

```javascript
Sentry.init({
  // ... other options
  release: 'serveaso-ios@1.0.0',
  dist: '1',
});
```

Or use automatic detection from `package.json`.

## Source Maps (for better stack traces)

The Sentry wizard has configured automatic upload of source maps during build.

For manual upload:
```bash
npx @sentry/cli sourcemaps upload --org servease-innovation --project react-native ./build
```

## Troubleshooting

### Events not appearing in Sentry?
- Check you're in production mode (dev events are filtered)
- Or set `SENTRY_ENABLED_IN_DEV` to test in development
- Verify DSN is correct in `index.js`
- Check network connectivity

### Native crashes not captured?
- Run `cd ios && pod install`
- Rebuild the app completely
- Check iOS/Android native configuration

### Source maps missing?
- Ensure build is generating source maps
- Check Sentry CLI is configured with auth token
- Verify upload step in build process

## Next Steps

1. ✅ Sentry is configured and ready
2. ✅ Test error capture in development
3. 🔜 Deploy to production
4. 🔜 Monitor errors in Sentry dashboard
5. 🔜 Set up alerts for critical errors
6. 🔜 Configure release tracking

## Resources

- [Sentry React Native Docs](https://docs.sentry.io/platforms/react-native/)
- [Sentry Dashboard](https://servease-innovation.sentry.io/)
- [Performance Monitoring](https://docs.sentry.io/platforms/react-native/performance/)
- [Source Maps Guide](https://docs.sentry.io/platforms/react-native/sourcemaps/)
