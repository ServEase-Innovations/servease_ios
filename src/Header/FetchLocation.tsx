// FetchLocation.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  Button,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Geolocation from '@react-native-community/geolocation';
import Geocoder from 'react-native-geocoding';
import MapView, { Marker } from 'react-native-maps';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { NativeModules } from 'react-native';

Geocoder.init('AIzaSyBWoIIAX-gE7fvfAkiquz70WFgDaL7YXSk');

interface FetchLocationProps {
  visible: boolean;
  onClose: () => void;
  onLocationSelect: (address: string, lat: number, long: number) => void;
}

export const FetchLocation: React.FC<FetchLocationProps> = ({
  visible,
  onClose,
  onLocationSelect,
}) => {
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [showGPSButton, setShowGPSButton] = useState(false);
  const [isCheckingLocation, setIsCheckingLocation] = useState(false);

  const getAddressFromCoords = async (lat: number, lon: number) => {
    try {
      const res = await Geocoder.from(lat, lon);
      const addressComponent = res.results?.[0]?.formatted_address;
      if (addressComponent) {
        setAddress(addressComponent);
      }
    } catch (error) {
      console.warn('Geocoder error:', error);
    }
  };

  const requestLocationPermission = async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'android') {
        const [fineStatus, coarseStatus] = await Promise.all([
          request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION),
          request(PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION),
        ]);

        if (Platform.Version >= 31) {
          await request(PERMISSIONS.ANDROID.BLUETOOTH_SCAN);
        }

        return fineStatus === RESULTS.GRANTED || coarseStatus === RESULTS.GRANTED;
      } else {
        const iosStatus = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
        return iosStatus === RESULTS.GRANTED;
      }
    } catch (err) {
      console.warn('Permission request error:', err);
      return false;
    }
  };

  const checkLocationAccuracy = async (): Promise<void> => {
    if (Platform.OS === 'android') {
      try {
        const locationMode = await NativeModules.LocationSettings.getLocationMode();
        
        if (locationMode !== 'high_accuracy') {
          Alert.alert(
            'High Accuracy Recommended',
            'For best results, please enable high accuracy location mode in your device settings.',
            [
              {
                text: 'Open Settings',
                onPress: () => NativeModules.LocationSettings.openLocationSettings(),
              },
              { text: 'Continue Anyway', onPress: () => {} },
            ]
          );
        }
      } catch (err) {
        console.warn('Error checking location accuracy:', err);
      }
    }
  };

  const checkLocationServices = async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'android') {
        return await NativeModules.LocationSettings.checkLocationServices();
      }
      return true;
    } catch (err) {
      console.warn('Error checking location services:', err);
      return false;
    }
  };

  const fetchLocation = () => {
    setLoading(true);
    setShowGPSButton(false);
    
    Geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        setLatitude(latitude);
        setLongitude(longitude);
        getAddressFromCoords(latitude, longitude);
        setLoading(false);
      },
      error => {
        console.warn('Location fetch error:', error);
        setLoading(false);
        setShowGPSButton(true);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const fetchLocationWithChecks = async () => {
    setIsCheckingLocation(true);
    setLoading(true);
    
    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Location access is required for this feature. Please enable it in settings.',
          [
            {
              text: 'Open Settings',
              onPress: () => NativeModules.LocationSettings.openLocationSettings(),
            },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
        return;
      }

      const servicesEnabled = await checkLocationServices();
      if (!servicesEnabled) {
        Alert.alert(
          'Location Services Disabled',
          'Please enable location services to continue.',
          [
            {
              text: 'Enable',
              onPress: () => NativeModules.LocationSettings.showLocationSettingsDialog(),
            },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
        setShowGPSButton(true);
        return;
      }

      await checkLocationAccuracy();
      fetchLocation();
    } catch (error) {
      console.warn('Location fetch error:', error);
      setShowGPSButton(true);
    } finally {
      setIsCheckingLocation(false);
      setLoading(false);
    }
  };

  const handleLocationRefresh = async () => {
    await fetchLocationWithChecks();
  };

  const handleOpenSettings = async () => {
    await Linking.openSettings();
    handleLocationRefresh();
  };

  const handleLocationSave = () => {
    if (address && latitude && longitude) {
      onLocationSelect(address, latitude, longitude);
    }
    onClose();
  };

  useEffect(() => {
    if (visible) {
      fetchLocationWithChecks();
    }
  }, [visible]);

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.locationTitleText}>{address || 'Set Your Location'}</Text>

          {isCheckingLocation ? (
            <View style={styles.statusContainer}>
              <ActivityIndicator size="large" color="#007BFF" />
              <Text style={styles.statusText}>Checking location services...</Text>
            </View>
          ) : loading ? (
            <View style={styles.statusContainer}>
              <ActivityIndicator size="large" color="#007BFF" />
              <Text style={styles.statusText}>Getting your location...</Text>
            </View>
          ) : showGPSButton ? (
            <View style={styles.statusContainer}>
              <MaterialIcons name="location-off" size={50} color="red" />
              <Text style={styles.statusText}>Location services are disabled</Text>
              <View style={styles.button}>
                <Button
                  title="Enable Location Services"
                  onPress={handleOpenSettings}
                  color="#007BFF"
                />
              </View>
            </View>
          ) : (
            <>
              <MapView
                style={styles.map}
                region={{
                  latitude: latitude || 0,
                  longitude: longitude || 0,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}>
                <Marker
                  coordinate={{ latitude: latitude || 0, longitude: longitude || 0 }}
                  title="You are here"
                />
              </MapView>

              <View style={styles.infoBox}>
                <Text style={styles.text}>Latitude: {latitude}</Text>
                <Text style={styles.text}>Longitude: {longitude}</Text>
                <Text style={styles.text}>Address: {address}</Text>

                <View style={styles.buttonRow}>
                  <View style={styles.button}>
                    <Button
                      title="Refresh Location"
                      onPress={fetchLocationWithChecks}
                      color="#6c757d"
                    />
                  </View>
                  <View style={styles.button}>
                    <Button
                      title="Use This Location"
                      onPress={handleLocationSave}
                      color="#28a745"
                    />
                  </View>
                </View>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxWidth: 350,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  locationTitleText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  map: {
    width: '100%',
    height: 200,
    marginBottom: 10,
    borderRadius: 10,
  },
  infoBox: {
    width: '100%',
    padding: 10,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    marginBottom: 10,
  },
  text: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  statusContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    width: '100%',
  },
  statusText: {
    marginTop: 15,
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
  },
  button: {
    marginTop: 10,
    width: '100%',
  },
  buttonRow: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    width: '100%',
    gap: 10,
  },
});