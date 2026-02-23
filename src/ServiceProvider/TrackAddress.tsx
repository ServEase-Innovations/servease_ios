// TrackAddress.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Barasat, West Bengal coordinates (fixed destination)
const BARASAT_LOCATION = {
  latitude: 22.7249,
  longitude: 88.4786,
  address: 'Barasat, West Bengal, India',
};

interface Location {
  latitude: number;
  longitude: number;
}

interface TrackAddressProps {
  onClose: () => void;
  googleMapsApiKey: string;
}

const TrackAddress: React.FC<TrackAddressProps> = ({ onClose, googleMapsApiKey }) => {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const mapRef = useRef<MapView>(null);

  // Get current location on component mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Get current location using React Native Geolocation API
  const getCurrentLocation = () => {
    setIsLoading(true);
    setLocationError(null);

    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ latitude, longitude });
        setIsLoading(false);
        // Calculate route after getting location
        calculateRouteToBarasat({ latitude, longitude });
      },
      (error) => {
        console.log('Error getting location:', error);
        setLocationError('Could not get your location. Please enable location services.');
        setIsLoading(false);
        
        Alert.alert(
          'Location Error',
          'Could not get your location. Please enable location services.',
          [
            {
              text: 'Open Settings',
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              },
            },
            { text: 'Close', onPress: onClose },
          ]
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    );
  };

  // Calculate route to Barasat
  const calculateRouteToBarasat = (start: Location) => {
    setIsCalculatingRoute(true);
    
    // Generate route points with some intermediate points for realistic path
    const route = generateRoutePoints(start, BARASAT_LOCATION);
    setRouteCoordinates(route);
    
    // Fit map to show the entire route
    setTimeout(() => {
      if (mapRef.current && route.length > 0) {
        mapRef.current.fitToCoordinates(route, {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      }
      setIsCalculatingRoute(false);
    }, 500);
  };

  // Generate route points with intermediate points for curved route
  const generateRoutePoints = (start: Location, end: Location): Location[] => {
    const points: Location[] = [start];
    
    // Calculate distance
    const latDiff = end.latitude - start.latitude;
    const lngDiff = end.longitude - start.longitude;
    
    // Add intermediate points for curved effect (more realistic route)
    const numPoints = 5;
    for (let i = 1; i <= numPoints; i++) {
      const factor = i / (numPoints + 1);
      
      // Add slight randomness for natural curve
      const randomLat = (Math.random() * 0.02 - 0.01);
      const randomLng = (Math.random() * 0.02 - 0.01);
      
      const intermediatePoint: Location = {
        latitude: start.latitude + latDiff * factor + randomLat,
        longitude: start.longitude + lngDiff * factor + randomLng,
      };
      points.push(intermediatePoint);
    }
    
    points.push(end);
    return points;
  };

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Get distance to Barasat
  const getDistanceToBarasat = (): number => {
    if (!currentLocation) return 0;
    return calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      BARASAT_LOCATION.latitude,
      BARASAT_LOCATION.longitude
    );
  };

  // Get estimated travel time
  const getTravelTime = (distance: number): string => {
    const avgSpeed = 40; // km/h
    const timeInHours = distance / avgSpeed;
    const minutes = Math.round(timeInHours * 60);
    
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
    }
  };

  // Format distance
  const formatDistance = (distance: number): string => {
    return `${distance.toFixed(1)} km`;
  };

  // Open in external maps app for navigation
  const openInMaps = () => {
    if (!currentLocation) return;
    
    const url = Platform.select({
      ios: `http://maps.apple.com/?saddr=${currentLocation.latitude},${currentLocation.longitude}&daddr=${BARASAT_LOCATION.latitude},${BARASAT_LOCATION.longitude}&dirflg=d`,
      android: `google.navigation:q=${BARASAT_LOCATION.latitude},${BARASAT_LOCATION.longitude}`,
    });
    
    if (url) {
      Linking.openURL(url).catch(() => {
        Alert.alert('Error', 'Could not open maps application');
      });
    }
  };

  // Refresh location and route
  const refreshRoute = () => {
    getCurrentLocation();
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  const distance = getDistanceToBarasat();
  const travelTime = getTravelTime(distance);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Icon name="location-on" size={24} color="#2196F3" />
          <Text style={styles.headerTitle}>Track to Barasat</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Icon name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Location Info */}
      <View style={styles.locationInfo}>
        <View style={styles.locationRow}>
          <Icon name="my-location" size={16} color="#4CAF50" />
          <Text style={styles.locationText} numberOfLines={1}>
            From: {currentLocation ? `${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}` : 'Unknown'}
          </Text>
        </View>
        <View style={styles.locationRow}>
          <Icon name="flag" size={16} color="#FF5252" />
          <Text style={styles.locationText} numberOfLines={1}>
            To: Barasat, West Bengal
          </Text>
        </View>
      </View>

      {/* Map View */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: currentLocation?.latitude || BARASAT_LOCATION.latitude,
            longitude: currentLocation?.longitude || BARASAT_LOCATION.longitude,
            latitudeDelta: 0.5,
            longitudeDelta: 0.5,
          }}
          showsUserLocation={true}
          showsMyLocationButton={false}
          showsCompass={true}
          showsScale={true}
          mapType="standard"
        >
          {/* Current Location Marker */}
          {currentLocation && (
            <Marker
              coordinate={currentLocation}
              title="Your Location"
              description="Current position"
            >
              <View style={styles.currentLocationMarker}>
                <Icon name="person-pin-circle" size={40} color="#2196F3" />
              </View>
            </Marker>
          )}

          {/* Barasat Destination Marker */}
          <Marker
            coordinate={BARASAT_LOCATION}
            title="Barasat, West Bengal"
            description="Destination"
          >
            <View style={styles.destinationMarker}>
              <Icon name="location-on" size={30} color="#FF5252" />
            </View>
          </Marker>

          {/* Route Line */}
          {!isCalculatingRoute && routeCoordinates.length > 0 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeWidth={4}
              strokeColor="#2196F3"
              lineDashPattern={[10, 10]}
            />
          )}
        </MapView>

        {/* Map Controls */}
        <View style={styles.mapControls}>
          <TouchableOpacity 
            style={styles.mapControlButton}
            onPress={refreshRoute}
          >
            <Icon name="refresh" size={24} color="#333" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.mapControlButton}
            onPress={openInMaps}
          >
            <Icon name="navigation" size={24} color="#FF5252" />
          </TouchableOpacity>
        </View>

        {/* Loading overlay for route calculation */}
        {isCalculatingRoute && (
          <View style={styles.calculatingOverlay}>
            <ActivityIndicator size="small" color="#2196F3" />
            <Text style={styles.calculatingText}>Calculating route...</Text>
          </View>
        )}
      </View>

      {/* Route Statistics */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Icon name="straighten" size={20} color="#666" />
          <Text style={styles.statValue}>{formatDistance(distance)}</Text>
          <Text style={styles.statLabel}>Distance</Text>
        </View>
        
        <View style={styles.statItem}>
          <Icon name="schedule" size={20} color="#666" />
          <Text style={styles.statValue}>{travelTime}</Text>
          <Text style={styles.statLabel}>Est. Time</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.navigateButton}
          onPress={openInMaps}
        >
          <Icon name="directions" size={20} color="#fff" />
          <Text style={styles.navigateButtonText}>Start Navigation</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={refreshRoute}
        >
          <Icon name="gps-fixed" size={20} color="#2196F3" />
          <Text style={styles.refreshButtonText}>Refresh Location</Text>
        </TouchableOpacity>
      </View>

      {/* Error Message */}
      {locationError && (
        <View style={styles.errorContainer}>
          <Icon name="error" size={20} color="#F44336" />
          <Text style={styles.errorText}>{locationError}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    zIndex: 1000,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  closeButton: {
    padding: 5,
  },
  locationInfo: {
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  mapContainer: {
    height: '50%',
    width: '100%',
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapControls: {
    position: 'absolute',
    right: 15,
    top: 15,
    gap: 10,
  },
  mapControlButton: {
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  calculatingOverlay: {
    position: 'absolute',
    top: 15,
    left: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  calculatingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  currentLocationMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  destinationMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 10,
  },
  navigateButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 10,
  },
  navigateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  refreshButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 10,
  },
  refreshButtonText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 15,
    marginHorizontal: 20,
    borderRadius: 10,
    gap: 10,
  },
  errorText: {
    flex: 1,
    color: '#F44336',
    fontSize: 14,
  },
});

export default TrackAddress;