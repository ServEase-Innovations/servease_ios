# Provider Journey Tracking - iOS App Integration

## Overview

Service providers can now start their journey tracking, allowing customers to see their real-time location while en route.

## Components Added

### 1. `JourneyTrackingButton.tsx`
Smart button component that shows different states:
- **Not Started**: Blue "Start Journey" button
- **En Route**: Green "Customer Tracking Active" indicator + "Mark Arrived" button  
- **Arrived/Service Started**: Green check with status text
- **Completed**: Hidden

### 2. `providerTrackingService.ts`
Service layer for tracking API calls:
- `startJourney()` - Enable customer tracking
- `markArrived()` - Disable tracking, mark arrival
- `markServiceStarted()` - Update status
- `markServiceCompleted()` - Final status
- `getTrackingStatus()` - Get current status

### 3. Integration in `TodayVisitsCard.tsx`
Journey tracking button appears:
- Above action buttons
- Only for bookings that haven't started
- Hidden once service is in progress or completed

## User Flow

```
1. Provider sees "Start Journey" button on today's visit card
   ↓
2. Taps button → Confirmation dialog appears
   ↓
3. Confirms → App gets current location
   ↓
4. Sends to API → Customer tracking enabled
   ↓
5. Button changes to "Customer Tracking Active" + "Mark Arrived"
   ↓
6. Provider travels to customer location
   ↓
7. Provider taps "Mark Arrived" → Tracking stops
   ↓
8. Status changes to "Arrived at location"
```

## Setup

### 1. Install Dependencies

```bash
cd apps/servease-ios
npm install @react-native-community/geolocation
npm install @react-native-async-storage/async-storage
```

### 2. Configure Environment

Create `.env` file:
```env
TRACKING_API_URL=http://localhost:5007

# For production:
# TRACKING_API_URL=https://notifications-mjdp.onrender.com
```

### 3. iOS Permissions

Add to `Info.plist`:
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>We need your location to enable customer tracking during service visits</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>We need your location to enable customer tracking during service visits</string>
```

### 4. Android Permissions

Add to `AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

## API Integration

### Endpoints Used

1. **POST /api/tracking/provider/start-journey**
   ```json
   {
     "engagement_id": 374,
     "latitude": 12.9716,
     "longitude": 77.5946
   }
   ```

2. **POST /api/tracking/provider/arrived**
   ```json
   {
     "engagement_id": 374,
     "latitude": 12.9716,
     "longitude": 77.5946
   }
   ```

3. **GET /api/tracking/provider/status/:engagementId**
   - Returns current tracking status

## Features

### ✅ Automatic Location Capture
- Gets provider's current GPS location
- Sends with journey start/arrival
- Gracefully handles location permission denials

### ✅ Status Persistence
- Fetches status on component mount
- Persists across app restarts
- Syncs with backend

### ✅ User Confirmations
- Alert before starting journey
- Confirmation before marking arrival
- Clear success/error messages

### ✅ Loading States
- Shows spinner during API calls
- Disables buttons to prevent double-taps
- Smooth transitions between states

## Testing

### Local Testing

1. Start tracking service:
```bash
cd services/notifications/tracking
npm start
```

2. Update `.env` in iOS app:
```env
TRACKING_API_URL=http://localhost:5007
```

3. Run iOS app:
```bash
cd apps/servease-ios
npm run ios
```

4. Navigate to Today's Visits
5. Tap "Start Journey" on a booking
6. Check console logs for API calls

### Production Testing

1. Update `.env` for production:
```env
TRACKING_API_URL=https://notifications-mjdp.onrender.com
```

2. Test with real engagements
3. Verify customer can see tracking on their end

## Troubleshooting

### Button doesn't appear
- Check engagement status (must be NOT_STARTED)
- Verify tracking service is running
- Check console for API errors

### "Failed to start journey" error
- Verify TRACKING_API_URL is correct
- Check auth token is valid
- Ensure engagement_tracking_status table exists

### Location not being sent
- Check location permissions
- Look for geolocation errors in console
- Location is optional - journey will start without it

## Future Enhancements

- [ ] Background location updates while en route
- [ ] Auto-arrival detection based on proximity
- [ ] Route optimization suggestions
- [ ] Journey time analytics
- [ ] Push notifications to customer when journey starts

## Related Files

- Backend: `services/notifications/tracking/`
- Database: `database/sql/109_engagement_tracking_status.sql`
- Documentation: `services/notifications/tracking/PROVIDER_TRACKING_STATUS.md`
