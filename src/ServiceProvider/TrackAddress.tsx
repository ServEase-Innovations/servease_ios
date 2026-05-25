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
  Dimensions,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';

const { width, height } = Dimensions.get('window');

interface Location {
  latitude: number;
  longitude: number;
}

interface TrackAddressProps {
  onClose: () => void;
  googleMapsApiKey: string;
  destinationAddress?: string;
}

const TrackAddress: React.FC<TrackAddressProps> = ({
  onClose,
  googleMapsApiKey,
  destinationAddress,
}) => {
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
  const mapRef = useRef<MapView>(null);

  // Geocode destination address
  useEffect(() => {
    const geocodeDestination = async () => {
      if (!destinationAddress?.trim()) {
        Alert.alert('Error', 'No destination address provided');
        onClose();
        return;
      }
      
      try {
        const encoded = encodeURIComponent(destinationAddress.trim());
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
          setDestinationAddressText(destinationAddress.trim());
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
    
    geocodeDestination();
  }, [destinationAddress, googleMapsApiKey]);

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

  const fetchRealRouteFromGoogleMaps = async () => {
    if (!currentLocation || !destination) return;
    
    setIsCalculatingRoute(true);
    setIsRoutingComplete(false);
    
    try {
      const origin = `${currentLocation.latitude},${currentLocation.longitude}`;
      const dest = `${destination.latitude},${destination.longitude}`;
      
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${dest}&key=${googleMapsApiKey}&mode=driving&alternatives=true`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK' && data.routes && data.routes.length > 0) {
        // Use the first route (recommended)
        const route = data.routes[0];
        const leg = route.legs[0];
        
        // Extract route points for polyline
        const points = decodePolyline(route.overview_polyline.points);
        setRouteCoordinates(points);
        
        // Set distance and duration
        setRouteDistance(leg.distance.text);
        setRouteDuration(leg.duration.text);
        
        setIsRoutingComplete(true);
        
        // Fit map to show the entire route
        setTimeout(() => {
          if (mapRef.current && points.length > 0) {
            mapRef.current.fitToCoordinates(points, {
              edgePadding: { top: 80, right: 50, bottom: 80, left: 50 },
              animated: true,
            });
          }
        }, 500);
      } else {
        console.error('Directions API error:', data.status);
        setLocationError('Could not find a route to destination');
      }
    } catch (error) {
      console.error('Error fetching route:', error);
      setLocationError('Failed to calculate route');
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  // Helper function to decode Google Maps polyline
  const decodePolyline = (encoded: string): Location[] => {
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
      const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;
      
      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;
      
      points.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }
    
    return points;
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

  if (isLoading || !destination) {
    return (
      <LinearGradient
        colors={["#1e3a5f", "#1e40af"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.loadingContainer}
      >
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>
          {!destination ? 'Finding destination...' : 'Getting your location...'}
        </Text>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#1e3a5f", "#1e40af"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}>
            <MaterialIcon name="navigation" size={22} color="#ffffff" />
          </View>
          <Text style={styles.headerTitle}>Track Route</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <MaterialIcon name="close" size={24} color="#ffffff" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Location Info */}
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

        {/* Map View */}
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={{
              latitude: currentLocation?.latitude || destination.latitude,
              longitude: currentLocation?.longitude || destination.longitude,
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
              <Marker coordinate={currentLocation}>
                <View style={styles.currentLocationMarker}>
                  <View style={styles.markerPulse} />
                  <MaterialIcon name="my-location" size={40} color="#3b82f6" />
                  <View style={styles.markerLabel}>
                    <Text style={styles.markerLabelText}>📍 You are here</Text>
                  </View>
                </View>
              </Marker>
            )}

            {/* Destination Marker */}
            {destination && (
              <Marker coordinate={destination}>
                <View style={styles.destinationMarker}>
                  <MaterialIcon name="location-on" size={40} color="#ef4444" />
                  <View style={styles.markerLabelDestination}>
                    <Text style={styles.markerLabelText}>🎯 Destination</Text>
                  </View>
                </View>
              </Marker>
            )}

            {/* Route Polyline - This is the key part */}
            {!isCalculatingRoute && routeCoordinates.length > 0 && isRoutingComplete && (
              <>
                {/* Main route line */}
                <Polyline
                  coordinates={routeCoordinates}
                  strokeWidth={6}
                  strokeColor="#2563eb"
                  lineCap="round"
                  lineJoin="round"
                  zIndex={10}
                />
                {/* Shadow/Glow effect for route */}
                <Polyline
                  coordinates={routeCoordinates}
                  strokeWidth={10}
                  strokeColor="rgba(37, 99, 235, 0.2)"
                  lineCap="round"
                  lineJoin="round"
                  zIndex={5}
                />
              </>
            )}
          </MapView>

          {/* Map Controls */}
          <View style={styles.mapControls}>
            <TouchableOpacity style={styles.mapControlButton} onPress={refreshRoute}>
              <MaterialIcon name="refresh" size={22} color="#475569" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.mapControlButton} onPress={() => {
              if (routeCoordinates.length > 0) {
                mapRef.current?.fitToCoordinates(routeCoordinates, {
                  edgePadding: { top: 80, right: 50, bottom: 80, left: 50 },
                  animated: true,
                });
              }
            }}>
              <MaterialIcon name="zoom-out-map" size={22} color="#475569" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.mapControlButton} onPress={openInMaps}>
              <MaterialIcon name="directions" size={22} color="#ef4444" />
            </TouchableOpacity>
          </View>

          {isCalculatingRoute && (
            <View style={styles.calculatingOverlay}>
              <ActivityIndicator size="small" color="#3b82f6" />
              <Text style={styles.calculatingText}>Finding best route...</Text>
            </View>
          )}

          {/* Route Legend */}
          {isRoutingComplete && routeCoordinates.length > 0 && (
            <View style={styles.routeLegend}>
              <View style={styles.routeLegendLine} />
              <Text style={styles.routeLegendText}>Recommended Route</Text>
            </View>
          )}
        </View>

        {/* Route Statistics */}
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

        {/* Info Note */}
        {isRoutingComplete && (
          <View style={styles.infoNote}>
            <MaterialIcon name="info" size={18} color="#3b82f6" />
            <Text style={styles.infoNoteText}>
              Blue line shows the recommended driving route. Tap the map or use "Start Navigation" for turn-by-turn directions.
            </Text>
          </View>
        )}

        {/* Action Buttons */}
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

        {locationError && (
          <View style={styles.errorContainer}>
            <MaterialIcon name="error" size={20} color="#ef4444" />
            <Text style={styles.errorText}>{locationError}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 55 : 20,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationInfo: {
    backgroundColor: '#ffffff',
    margin: 16,
    marginTop: -8,
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
    height: height * 0.45,
    marginHorizontal: 16,
    marginTop: 16,
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
    flex: 1,
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
  currentLocationMarker: {
    alignItems: 'center',
  },
  destinationMarker: {
    alignItems: 'center',
  },
  markerPulse: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    top: -10,
    left: -10,
  },
  markerLabel: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  markerLabelDestination: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  markerLabelText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    margin: 16,
    marginTop: 16,
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
    gap: 12,
    marginBottom: 16,
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