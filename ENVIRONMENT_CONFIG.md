# Environment Configuration Guide - iOS App

## Overview

The ServEase iOS/React Native app uses centralized environment configuration to manage API endpoints for different environments.

## Files Structure

```
apps/servease-ios/
├── .env.development          # Development config (localhost)
├── .env.production           # Production config (Render endpoints)
├── src/config/
│   ├── apiUrls.ts           # Main configuration file
│   ├── devApi.ts            # Helper for LAN IP override
│   └── devApi.local.ts      # (Optional) Your LAN IP for physical devices
```

## How It Works

1. **apiUrls.ts**: Exports `API_URLS` object with all endpoint URLs
2. **Auto-detects environment**: Uses `__DEV__` flag (development vs production)
3. **Development**: Uses `localhost` for simulators/emulators
4. **Production**: Uses Render.com endpoints

## Usage

### Development (Simulator/Emulator)

```bash
# Run on iOS simulator (uses localhost automatically)
npm run ios

# Run on Android emulator (uses localhost automatically)
npm run android
```

### Development (Physical Device)

For testing on physical devices, you need to use your computer's LAN IP:

1. Create `src/config/devApi.local.ts`:
```typescript
// Replace with your computer's LAN IP
export const DEV_LAN_HOST = "192.168.1.100";
```

2. Run the app:
```bash
npm run ios
# or
npm run android
```

The app will automatically use:
- `http://192.168.1.100:4000` for providers
- `http://192.168.1.100:4100` for payments
- etc.

### Production Build

```bash
# iOS
cd ios && pod install && cd ..
npm run ios --configuration Release

# Android
npm run android --variant=release
```

## Available Endpoints

**Note:** Environment variable names match the web app for consistency (all use `REACT_APP_*` prefix).

| Service | Environment Variable | Dev Default | Prod Default |
|---------|---------------------|-------------|--------------|
| Payments | `REACT_APP_PAYMENTS_URL` | `localhost:4100` | `payments-vyqp.onrender.com` |
| Providers | `REACT_APP_PROVIDER_URL` | `localhost:4000` | `providers-*.onrender.com` |
| Utils | `REACT_APP_UTILS_URL` | `localhost:3030` | `utils-qhvi.onrender.com` |
| Preferences | `REACT_APP_PREFERENCES_URL` | `localhost:3001` | `preferences-6leu.onrender.com` |
| Reviews | `REACT_APP_REVIEWS_URL` | `localhost:5005` | `reviews-4mls.onrender.com` |
| Tickets | `REACT_APP_TICKETS_URL` | `localhost:5006` | `tickets-1cfe.onrender.com` |
| Coupons | `REACT_APP_COUPONS_URL` | `localhost:3002` | `coupons-s9zq.onrender.com` |
| Chat | `REACT_APP_CHAT_URL` | `localhost:5001` | `chat-b3wl.onrender.com` |
| Image Uploader | `REACT_APP_IMAGE_UPLOADER_URL` | `localhost:5003` | `imageuploader-5njj.onrender.com` |
| Tracking | `REACT_APP_TRACKING_API_URL` | `localhost:5007` | `tracking-api.onrender.com` |

## Updating Endpoints

### Option 1: Edit apiUrls.ts (Recommended)

Edit `src/config/apiUrls.ts`:

```typescript
const PRODUCTION_URLS = {
  payments: 'https://your-new-payments-url.com',
  // ... other endpoints
};
```

### Option 2: Edit .env Files

Edit `.env.production`:

```bash
REACT_APP_PAYMENTS_URL=https://your-new-payments-url.com
```

## Testing Configuration

The app logs which environment is active:

```
🔧 API Configuration: DEVELOPMENT
📡 Endpoints using localhost (simulator/emulator)
💡 For physical devices, create devApi.local.ts with your LAN IP
```

## Network Debugging

If you see connection errors:

### Simulator/Emulator
- ✅ Should work with `localhost` automatically
- Make sure backend services are running (`npm run dev` in monorepo)

### Physical Device
- ❌ `localhost` won't work
- ✅ Create `devApi.local.ts` with your LAN IP
- Make sure your device and computer are on the same Wi-Fi network
- Check your computer's firewall isn't blocking ports

### Production Build
- Uses Render endpoints automatically
- No configuration needed
- Make sure all Render services are deployed and running

## Migration Notes

The new system:
- ✅ Centralizes all endpoints in one place
- ✅ Automatically switches dev/prod based on build type
- ✅ Makes physical device testing easier
- ✅ Better documentation and type safety

All existing code using `API_URLS.payments`, `API_URLS.providers`, etc. continues to work without changes.
