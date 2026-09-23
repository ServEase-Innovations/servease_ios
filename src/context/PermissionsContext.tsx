import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform, Linking, Alert } from 'react-native';
import { check, request, PERMISSIONS, RESULTS, Permission } from 'react-native-permissions';

interface PermissionsContextType {
  locationPermission: string;
  notificationPermission: string;
  requestLocationPermission: () => Promise<boolean>;
  requestNotificationPermission: () => Promise<boolean>;
  checkLocationPermission: () => Promise<boolean>;
  checkNotificationPermission: () => Promise<boolean>;
  openSettings: () => void;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export const PermissionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locationPermission, setLocationPermission] = useState<string>('not_requested');
  const [notificationPermission, setNotificationPermission] = useState<string>('not_requested');

  const getLocationPermission = (): Permission | null => {
    return Platform.select({
      ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
      android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
      default: null,
    });
  };

  const getNotificationPermission = (): Permission | null => {
    return Platform.select({
      ios: PERMISSIONS.IOS.NOTIFICATIONS,
      android: PERMISSIONS.ANDROID.POST_NOTIFICATIONS,
      default: null,
    });
  };

  const checkLocationPermission = async (): Promise<boolean> => {
    try {
      const permission = getLocationPermission();
      if (!permission) {
        console.log('📍 Location permission not available on this platform');
        setLocationPermission('unavailable');
        return false;
      }

      const result = await check(permission);
      console.log('📍 Location permission check result:', result);

      const isGranted = result === RESULTS.GRANTED;
      setLocationPermission(result);
      return isGranted;
    } catch (error) {
      console.error('❌ Error checking location permission:', error);
      setLocationPermission('error');
      return false;
    }
  };

  const checkNotificationPermission = async (): Promise<boolean> => {
    try {
      const permission = getNotificationPermission();
      if (!permission) {
        console.log('🔔 Notification permission not available on this platform');
        setNotificationPermission('unavailable');
        return false;
      }

      const result = await check(permission);
      console.log('🔔 Notification permission check result:', result);

      const isGranted = result === RESULTS.GRANTED;
      setNotificationPermission(result);
      return isGranted;
    } catch (error) {
      console.error('❌ Error checking notification permission:', error);
      setNotificationPermission('error');
      return false;
    }
  };

  const requestLocationPermission = async (): Promise<boolean> => {
    try {
      const permission = getLocationPermission();
      if (!permission) {
        console.log('📍 Location permission not available on this platform');
        setLocationPermission('unavailable');
        return false;
      }

      // First check if already granted
      const currentStatus = await check(permission);
      console.log('📍 Current location permission status:', currentStatus);

      if (currentStatus === RESULTS.GRANTED) {
        setLocationPermission('granted');
        return true;
      }

      if (currentStatus === RESULTS.BLOCKED) {
        setLocationPermission('blocked');
        Alert.alert(
          'Permission Required',
          'Location permission is blocked. Please enable it in Settings to find nearby service providers.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
        return false;
      }

      // Request permission
      const result = await request(permission);
      console.log('📍 Location permission request result:', result);

      setLocationPermission(result);

      if (result === RESULTS.BLOCKED) {
        Alert.alert(
          'Permission Required',
          'Location permission is blocked. Please enable it in Settings to find nearby service providers.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
      }

      return result === RESULTS.GRANTED;
    } catch (error) {
      console.error('❌ Error requesting location permission:', error);
      setLocationPermission('error');
      return false;
    }
  };

  const requestNotificationPermission = async (): Promise<boolean> => {
    try {
      const permission = getNotificationPermission();
      if (!permission) {
        console.log('🔔 Notification permission not available on this platform');
        setNotificationPermission('unavailable');
        return false;
      }

      // First check if already granted
      const currentStatus = await check(permission);
      console.log('🔔 Current notification permission status:', currentStatus);

      if (currentStatus === RESULTS.GRANTED) {
        setNotificationPermission('granted');
        return true;
      }

      if (currentStatus === RESULTS.BLOCKED) {
        setNotificationPermission('blocked');
        Alert.alert(
          'Permission Required',
          'Notification permission is blocked. Please enable it in Settings to receive booking updates.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
        return false;
      }

      // Request permission
      const result = await request(permission);
      console.log('🔔 Notification permission request result:', result);

      setNotificationPermission(result);

      if (result === RESULTS.BLOCKED) {
        Alert.alert(
          'Permission Required',
          'Notification permission is blocked. Please enable it in Settings to receive booking updates.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
      }

      return result === RESULTS.GRANTED;
    } catch (error) {
      console.error('❌ Error requesting notification permission:', error);
      setNotificationPermission('error');
      return false;
    }
  };

  const openSettings = () => {
    Linking.openSettings();
  };

  // Check permissions on mount
  useEffect(() => {
    checkLocationPermission();
    checkNotificationPermission();
  }, []);

  const value: PermissionsContextType = {
    locationPermission,
    notificationPermission,
    requestLocationPermission,
    requestNotificationPermission,
    checkLocationPermission,
    checkNotificationPermission,
    openSettings,
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = (): PermissionsContextType => {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
};
