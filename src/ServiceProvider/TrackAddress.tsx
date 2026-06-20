// TrackAddress.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
  Dimensions,
  StatusBar,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { keys } from '../env';
import { BRAND } from '../theme/brandColors';

const { height } = Dimensions.get('window');
const MAP_MIN_HEIGHT = Math.max(280, Math.round(height * 0.38));
const mapProvider = Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined;

interface Location {
  latitude: number;
  longitude: number;
}

interface TrackAddressProps {
  onClose: () => void;
  googleMapsApiKey?: string;
  destinationAddress?: string;
}

function parseLatLngFromText(value: string): Location | null {
  const trimmed = value.trim();
  const match = trimmed.match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (!match) return null;

  const latitude = parseFloat(match[1]);
  const longitude = parseFloat(match[2]);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;

  return { latitude, longitude };
}

function decodePolyline(encoded: string): Location[] {
  const points: Location[] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
    lng += dlng;

    points.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }

  return points;
}

const TrackAddress: React.FC<TrackAddressProps> = ({
  onClose,
  googleMapsApiKey = keys.api_key,
  destinationAddress,
}) => {
  const insets = useSafeAreaInsets();
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [destinationAddressText, setDestinationAddressText] = useState<string>('');
  const [routeDistance, setRouteDistance] = useState<string>('');
  const [routeDuration, setRouteDuration] = useState<string>('');
  const [isRoutingComplete, setIsRoutingComplete] = useState<boolean>(false);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef<MapView>(null);

  const fitMapToRoute = useCallback(
    (points: Location[]) => {
      if (!mapRef.current || points.length === 0) return;

      const coords = [...points];
      if (currentLocation) coords.push(currentLocation);
      if (destination) coords.push(destination);

      requestAnimationFrame(() => {
        mapRef.current?.fitToCoordinates(coords, {
          edgePadding: { top: 72, right: 48, bottom: 72, left: 48 },
          animated: true,
        });
      });
    },
    [currentLocation, destination]
  );

  // Resolve destination from coordinates or geocoded address.
  useEffect(() => {
    const resolveDestination = async () => {
      if (!destinationAddress?.trim()) {
        Alert.alert('Error', 'No destination address provided');
        onClose();
        return;
      }

      const trimmed = destinationAddress.trim();
      const coordinateDestination = parseLatLngFromText(trimmed);
      if (coordinateDestination) {
        setDestination(coordinateDestination);
        setDestinationAddressText(trimmed);
        return;
      }

      try {
        const encoded = encodeURIComponent(trimmed);
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encoded}&key=${googleMapsApiKey}`
        );
        const json = await res.json();
        const loc = json?.results?.[0]?.geometry?.location;

        if (loc?.lat != null && loc?.lng != null) {
          setDestination({
            latitude: loc.lat,
            longitude: loc.lng,
          });
          setDestinationAddressText(json?.results?.[0]?.formatted_address || trimmed);
        } else {
          Alert.alert('Error', 'Could not find the destination address');
          onClose();
        }
      } catch (error) {
        console.error('Geocoding error:', error);
        Alert.alert('Error', 'Failed to find destination address');
        onClose();
      }
    };

    resolveDestination();
  }, [destinationAddress, googleMapsApiKey, onClose]);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (currentLocation && destination) {
      fetchRealRouteFromGoogleMaps();
    }
  }, [currentLocation, destination]);

  const getCurrentLocation = () => {
    setIsLoading(true);
    setLocationError(null);

    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ latitude, longitude });
        setIsLoading(false);
      },
      (error) => {
        console.log('Error getting location:', error);
        setLocationError('Unable to get your current location');
        setIsLoading(false);
        
        Alert.alert(
          'Location Error',
          'Unable to get your current location. Please enable location services and try again.',
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

  useEffect(() => {
    if (mapReady && routeCoordinates.length > 0) {
      fitMapToRoute(routeCoordinates);
    }
  }, [mapReady, routeCoordinates, fitMapToRoute]);

  const applyFallbackRoute = (origin: Location, dest: Location) => {
    setRouteCoordinates([origin, dest]);
    setRouteDistance('');
    setRouteDuration('');
    setIsRoutingComplete(true);
    setLocationError('Driving directions unavailable. Showing direct path.');
    fitMapToRoute([origin, dest]);
  };

  const fetchRealRouteFromGoogleMaps = async () => {
    if (!currentLocation || !destination) return;

    setIsCalculatingRoute(true);
    setIsRoutingComplete(false);
    setLocationError(null);

    try {
      const origin = `${currentLocation.latitude},${currentLocation.longitude}`;
      const dest = `${destination.latitude},${destination.longitude}`;

      const url =
        `https://maps.googleapis.com/maps/api/directions/json` +
        `?origin=${origin}&destination=${dest}` +
        `&key=${googleMapsApiKey}&mode=driving`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.routes?.length > 0) {
        const route = data.routes[0];
        const leg = route.legs?.[0];
        const points = decodePolyline(route.overview_polyline.points);

        setRouteCoordinates(points);
        setRouteDistance(leg?.distance?.text || '');
        setRouteDuration(leg?.duration?.text || '');
        setIsRoutingComplete(true);
        fitMapToRoute(points);
      } else {
        console.error('Directions API error:', data.status, data.error_message);
        applyFallbackRoute(currentLocation, destination);
      }
    } catch (error) {
      console.error('Error fetching route:', error);
      applyFallbackRoute(currentLocation, destination);
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  const openInMaps = () => {
    if (!currentLocation || !destination) return;
    
    const url = Platform.select({
      ios: `http://maps.apple.com/?saddr=${currentLocation.latitude},${currentLocation.longitude}&daddr=${destination.latitude},${destination.longitude}&dirflg=d`,
      android: `google.navigation:q=${destination.latitude},${destination.longitude}`,
    });
    
    if (url) {
      Linking.openURL(url).catch(() => {
        Alert.alert('Error', 'Unable to open maps application');
      });
    }
  };

  const refreshRoute = () => {
    getCurrentLocation();
  };

  const renderHeader = () => (
    <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
      <View style={styles.headerContent}>
        <View style={styles.headerSideSpacer} />
        <Text style={styles.headerTitle} numberOfLines={1}>
          View Location
        </Text>
        <TouchableOpacity
          onPress={onClose}
          style={styles.headerCloseBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Close"
        >
          <MaterialIcon name="close" size={22} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading || !destination) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        {renderHeader()}
        <View style={styles.loadingBody}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>
            {!destination ? 'Finding destination...' : 'Getting your location...'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      {renderHeader()}

      <View style={styles.locationInfo}>
        <View style={styles.locationRow}>
          <View style={[styles.locationDot, styles.startDot]} />
          <View style={styles.locationContent}>
            <Text style={styles.locationLabel}>From (Your Location)</Text>
            <Text style={styles.locationValue} numberOfLines={1}>
              {currentLocation
                ? `${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}`
                : 'Unknown location'}
            </Text>
          </View>
        </View>

        <View style={styles.locationConnector} />

        <View style={styles.locationRow}>
          <View style={[styles.locationDot, styles.endDot]} />
          <View style={styles.locationContent}>
            <Text style={styles.locationLabel}>To (Destination)</Text>
            <Text style={styles.locationValue} numberOfLines={2}>
              {destinationAddressText}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={mapProvider}
          style={styles.map}
          initialRegion={{
            latitude: currentLocation?.latitude || destination.latitude,
            longitude: currentLocation?.longitude || destination.longitude,
            latitudeDelta: 0.08,
            longitudeDelta: 0.08,
          }}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass
          showsScale
          mapType="standard"
          loadingEnabled
          onMapReady={() => setMapReady(true)}
        >
          {currentLocation ? (
            <Marker
              coordinate={currentLocation}
              title="Your location"
              pinColor="#3b82f6"
              tracksViewChanges={false}
            />
          ) : null}

          {destination ? (
            <Marker
              coordinate={destination}
              title="Destination"
              pinColor="#ef4444"
              tracksViewChanges={false}
            />
          ) : null}

          {routeCoordinates.length > 1 ? (
            <Polyline
              coordinates={routeCoordinates}
              strokeWidth={5}
              strokeColor="#2563eb"
              lineCap="round"
              lineJoin="round"
              geodesic
            />
          ) : null}
        </MapView>

        <View style={styles.mapControls}>
          <TouchableOpacity style={styles.mapControlButton} onPress={refreshRoute}>
            <MaterialIcon name="refresh" size={22} color="#475569" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.mapControlButton}
            onPress={() => {
              if (routeCoordinates.length > 0) {
                fitMapToRoute(routeCoordinates);
              }
            }}
          >
            <MaterialIcon name="zoom-out-map" size={22} color="#475569" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.mapControlButton} onPress={openInMaps}>
            <MaterialIcon name="directions" size={22} color="#ef4444" />
          </TouchableOpacity>
        </View>

        {isCalculatingRoute ? (
          <View style={styles.calculatingOverlay}>
            <ActivityIndicator size="small" color="#3b82f6" />
            <Text style={styles.calculatingText}>Finding best route...</Text>
          </View>
        ) : null}

        {isRoutingComplete && routeCoordinates.length > 1 ? (
          <View style={styles.routeLegend}>
            <View style={styles.routeLegendLine} />
            <Text style={styles.routeLegendText}>Recommended Route</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.bottomPanel}>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <View style={styles.statIconBg}>
              <MaterialIcon name="straighten" size={20} color="#3b82f6" />
            </View>
            <Text style={styles.statValue}>{routeDistance || 'Calculating...'}</Text>
            <Text style={styles.statLabel}>Total Distance</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <View style={styles.statIconBg}>
              <MaterialIcon name="schedule" size={20} color="#3b82f6" />
            </View>
            <Text style={styles.statValue}>{routeDuration || 'Calculating...'}</Text>
            <Text style={styles.statLabel}>Est. Travel Time</Text>
          </View>
        </View>

        {isRoutingComplete ? (
          <View style={styles.infoNote}>
            <MaterialIcon name="info" size={18} color="#3b82f6" />
            <Text style={styles.infoNoteText}>
              Blue line shows the driving route. Tap Start Navigation for turn-by-turn directions.
            </Text>
          </View>
        ) : null}

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.navigateButton} onPress={openInMaps}>
            <MaterialIcon name="navigation" size={18} color="#ffffff" />
            <Text style={styles.navigateButtonText}>Start Navigation</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.refreshButton} onPress={refreshRoute}>
            <MaterialIcon name="gps-fixed" size={18} color="#3b82f6" />
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {locationError ? (
          <View style={styles.errorContainer}>
            <MaterialIcon name="error" size={20} color="#ef4444" />
            <Text style={styles.errorText}>{locationError}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  bottomPanel: {
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  loadingBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  headerContainer: {
    width: '100%',
    backgroundColor: BRAND.bookingNavy,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 10,
    elevation: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 52,
  },
  headerCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.2,
    marginHorizontal: 8,
  },
  headerSideSpacer: {
    width: 36,
    height: 36,
  },
  locationInfo: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  locationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 3,
  },
  startDot: {
    backgroundColor: '#3b82f6',
  },
  endDot: {
    backgroundColor: '#ef4444',
  },
  locationConnector: {
    width: 2,
    height: 24,
    backgroundColor: '#cbd5e1',
    marginLeft: 4,
    marginVertical: 4,
  },
  locationContent: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  locationValue: {
    fontSize: 13,
    color: '#1e293b',
    fontWeight: '500',
  },
  mapContainer: {
    flex: 1,
    minHeight: MAP_MIN_HEIGHT,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapControls: {
    position: 'absolute',
    right: 12,
    top: 12,
    gap: 8,
  },
  mapControlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  calculatingOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  calculatingText: {
    fontSize: 13,
    color: '#1e293b',
    fontWeight: '500',
  },
  routeLegend: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routeLegendLine: {
    width: 30,
    height: 4,
    backgroundColor: '#2563eb',
    borderRadius: 2,
  },
  routeLegendText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 8,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  infoNoteText: {
    flex: 1,
    color: '#3b82f6',
    fontSize: 12,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    gap: 12,
  },
  navigateButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  navigateButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  refreshButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#eff6ff',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  refreshButtonText: {
    color: '#3b82f6',
    fontSize: 12,
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    flex: 1,
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '500',
  },
});

export default TrackAddress;