# Sentry Configuration Guide

## Current Status

Sentry is **currently DISABLED in CI/CD** to prevent source map upload failures from blocking builds. However, it is **configured and ready to use** for local development.

## Configuration Files

### 1. Android Configuration
- **File**: `android/sentry.properties`
- **Org**: servease-innovation
- **Project**: react-native
- **Auth Token**: Configured (sntrys_...)

### 2. iOS Configuration  
- **File**: `ios/sentry.properties`
- **Org**: servease-innovation
- **Project**: react-native
- **Auth Token**: Configured (sntrys_...)

## How Sentry Works

### Local Development
✅ **Sentry is ENABLED** for local builds
- Source maps are uploaded automatically
- Crash reports include full stack traces
- Helps with debugging production issues

### CI/CD (GitHub Actions)
❌ **Sentry is DISABLED** via environment variables
- Prevents build failures from Sentry upload issues
- Builds complete successfully even if Sentry is unavailable
- Can be re-enabled when Sentry is stable

## Re-enabling Sentry in CI/CD

### Step 1: Test Sentry Configuration

First, verify that Sentry uploads work from your local machine:

```bash
# Build a release APK locally
cd android
./gradlew assembleRelease

# Check if Sentry upload succeeded
# Look for "Sentry upload" in the build logs
```

### Step 2: Update GitHub Actions Workflow

Edit `.github/workflows/firebase-distribute.yml` and remove these lines:

```yaml
# Remove or comment out these lines:
env:
  SENTRY_DISABLE_AUTO_UPLOAD: "true"
  SENTRY_ALLOW_FAILURE: "true"
```

From both the `android` and `ios-testflight` jobs.

### Step 3: Update Android Build Configuration

Edit `android/app/build.gradle` and remove the task configuration:

```gradle
// Remove this entire block:
tasks.whenTaskAdded { task ->
    if (task.name.contains("SentryUpload")) {
        // ... configuration ...
    }
}
```

### Step 4: Verify CI/CD Build

Trigger a GitHub Actions workflow and verify:
- ✅ Build completes successfully
- ✅ Sentry source maps are uploaded
- ✅ No error logs about Sentry

## Troubleshooting

### Issue: Sentry Upload Fails in CI

**Symptom**: Build fails with "Process 'command sentry-cli' finished with non-zero exit value 1"

**Solutions**:
1. **Check Auth Token**: Verify the token in `sentry.properties` is still valid
2. **Check Network**: Sentry servers might be down or blocked
3. **Update Sentry CLI**: Upgrade `@sentry/react-native` package
4. **Re-disable in CI**: Add back the environment variables temporarily

### Issue: Missing Source Maps in Sentry

**Symptom**: Stack traces in Sentry show minified code

**Check**:
1. Source maps are generated: Look in `android/app/build/generated/sourcemaps/`
2. Upload succeeded: Check build logs for "Sentry upload successful"
3. Correct release version: Release name must match between app and Sentry

### Issue: Local Build is Slow

**Symptom**: Local builds take longer due to Sentry upload

**Solution**: Disable Sentry for debug builds:
```bash
export SENTRY_DISABLE_AUTO_UPLOAD=true
npm run android  # or npm run ios
```

## Current Protective Measures

Even with Sentry disabled in CI, we have multiple layers of protection:

1. **Environment Variables**: `SENTRY_DISABLE_AUTO_UPLOAD=true` in CI
2. **Gradle Configuration**: Task checking in `build.gradle`
3. **Error Handling**: `ignoreExitValue = true` for Sentry tasks
4. **Fallback**: `SENTRY_ALLOW_FAILURE=true`

These ensure builds never fail due to Sentry issues.

## Sentry Best Practices

### Release Identification
- Android: Uses `versionName` (e.g., "1.0.280")
- iOS: Uses `CFBundleShortVersionString` + `CFBundleVersion`
- CI: Automatically set via `VERSION_CODE` and `VERSION_NAME`

### Source Map Management
- Generated automatically during release builds
- Uploaded with release name and dist (build number)
- Retained for 90 days in Sentry (default)

### Error Tracking
```typescript
import * as Sentry from '@sentry/react-native';

// Initialize Sentry (already in App.tsx)
Sentry.init({
  dsn: 'your-dsn',
  environment: __DEV__ ? 'development' : 'production',
});

// Manual error capture
try {
  // risky code
} catch (error) {
  Sentry.captureException(error);
}
```

## Contact

For Sentry account access or configuration issues:
- **Sentry Org**: servease-innovation
- **Project**: react-native
- **URL**: https://sentry.io/organizations/servease-innovation/

---

**Last Updated**: Auto-generated during Sentry configuration
**Status**: Disabled in CI/CD, Ready for Local Development
