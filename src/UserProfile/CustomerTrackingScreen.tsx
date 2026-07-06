import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StatusBar,
  Platform,
  Image,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { getLocationUpdate, calculateETA } from '../services/trackingService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TrackingScreenProps {
  engagementId: number;
  customerLatitude?: number;
  customerLongitude?: number;
  onClose: () => void;
}

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}

interface ETAData {
  duration_seconds: number;
  distance_meters: number;
  traffic_aware: boolean;
  confidence: string;
  calculated_at: number;
}

export const CustomerTrackingScreen: React.FC<TrackingScreenProps> = ({
  engagementId,
  customerLatitude,
  customerLongitude,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  
  const [providerLocation, setProviderLocation] = useState<LocationData | null>(null);
  const [eta, setEta] = useState<ETAData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentETA, setCurrentETA] = useState<number>(0);
  const [mapReady, setMapReady] = useState(false);
  const [autoCenter, setAutoCenter] = useState(true);

  // Store initial region - use customer location if available, otherwise use default Bangalore coordinates
  const initialRegion = {
    latitude: customerLatitude || 12.9716,
    longitude: customerLongitude || 77.5946,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  // Customer location for destination marker
  const customerLocation = customerLatitude && customerLongitude 
    ? { latitude: customerLatitude, longitude: customerLongitude }
    : null;

  // Fit map to show both customer and provider locations
  const fitMapToLocations = useCallback(() => {
    if (!mapRef.current || !mapReady) return;
    
    const coordinates: Array<{ latitude: number; longitude: number }> = [];
    
    // Add customer location if available
    if (customerLocation) {
      coordinates.push(customerLocation);
    }
    
    // Add provider location if available
    if (providerLocation) {
      coordinates.push({
        latitude: providerLocation.latitude,
        longitude: providerLocation.longitude,
      });
    }
    
    // Need at least 2 points to fit bounds
    if (coordinates.length >= 2) {
      console.log('🎯 Fitting map to coordinates:', coordinates);
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: {
          top: 150,
          right: 50,
          bottom: 250,
          left: 50,
        },
        animated: true,
      });
    } else if (coordinates.length === 1) {
      // If only one location, center on it
      console.log('📍 Centering map on single location:', coordinates[0]);
      mapRef.current.animateToRegion({
        ...coordinates[0],
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 1000);
    }
  }, [mapReady, customerLocation, providerLocation]);

  // Force initial region on Android when map becomes ready
  useEffect(() => {
    if (mapReady && Platform.OS === 'android') {
      // Android needs explicit region setting after map is ready
      setTimeout(() => {
        if (mapRef.current && customerLocation) {
          console.log('🤖 Android: Setting initial region to customer location');
          mapRef.current.animateToRegion({
            ...customerLocation,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }, 500);
        } else if (mapRef.current) {
          console.log('🤖 Android: Setting initial region to default');
          mapRef.current.animateToRegion(initialRegion, 500);
        }
      }, 100);
    }
  }, [mapReady, customerLocation, initialRegion]);

  // Fit map when provider location updates or when map becomes ready
  useEffect(() => {
    if (providerLocation && mapReady && autoCenter) {
      // Wait a bit for the marker to render
      setTimeout(() => {
        fitMapToLocations();
      }, 500);
    } else if (mapReady && customerLocation && !providerLocation && Platform.OS === 'ios') {
      // iOS: If map is ready and we have customer location but no provider yet, center on customer
      setTimeout(() => {
        if (mapRef.current) {
          console.log('📍 iOS: Centering on customer location initially');
          mapRef.current.animateToRegion({
            ...customerLocation,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }, 1000);
        }
      }, 300);
    }
  }, [providerLocation, mapReady, autoCenter, fitMapToLocations, customerLocation, initialRegion]);

  // Fetch location and ETA
  useEffect(() => {
    fetchLocationAndETA();
    
    // Poll location every 10 seconds
    const locationInterval = setInterval(() => {
      fetchLocation();
    }, 10000);
    
    // Poll ETA every 30 seconds
    const etaInterval = setInterval(() => {
      fetchETA();
    }, 30000);
    
    return () => {
      clearInterval(locationInterval);
      clearInterval(etaInterval);
    };
  }, [engagementId]);

  // ETA countdown
  useEffect(() => {
    if (!eta) return;

    const startTime = eta.calculated_at;
    const initialDuration = eta.duration_seconds;
    
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      const newETA = Math.max(0, initialDuration - elapsed);
      setCurrentETA(newETA);
    }, 1000);

    return () => clearInterval(interval);
  }, [eta]);

  const fetchLocationAndETA = async () => {
    setLoading(true);
    await Promise.all([fetchLocation(), fetchETA()]);
    setLoading(false);
  };

  const fetchLocation = async () => {
    try {
      console.log(`🗺️ Fetching location for engagement ${engagementId}...`);
      const data = await getLocationUpdate(engagementId);
      console.log('📍 Location data received:', data);
      
      if (data?.location) {
        setProviderLocation(data.location);
        
        // Clear error if location is successfully fetched
        setError(null);
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch location:', error);
      if (error?.response?.status === 404) {
        setError('Provider has not started sharing location yet');
      } else {
        console.error('Error details:', error.message);
      }
    }
  };

  const fetchETA = async () => {
    try {
      console.log(`⏱️ Fetching ETA for engagement ${engagementId}...`);
      const etaData = await calculateETA(engagementId);
      console.log('📊 ETA data received:', etaData);
      
      if (etaData) {
        setEta(etaData);
        setCurrentETA(etaData.duration_seconds);
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch ETA:', error);
      // Silent failure for ETA - provider might not have started journey yet
    }
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${Math.ceil(seconds / 60)} min`;
    } else if (seconds < 3600) {
      return `${Math.round(seconds / 60)} min`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.round((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    } else {
      return `${(meters / 1000).toFixed(1)} km`;
    }
  };

  const getETAColor = () => {
    if (currentETA < 180) return '#10B981'; // Green
    if (currentETA < 600) return '#3B82F6'; // Blue
    return '#F59E0B'; // Amber
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading tracking...</Text>
        </View>
      )}

      {!loading && error && (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchLocationAndETA}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && (
        <>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={initialRegion}
            showsUserLocation
            showsMyLocationButton={false}
            loadingEnabled
            loadingIndicatorColor="#3B82F6"
            loadingBackgroundColor="#F3F4F6"
            onMapReady={() => {
              console.log('✅ Map is ready');
              setMapReady(true);
            }}
            onRegionChangeComplete={(newRegion) => {
              console.log('🗺️ Region changed:', newRegion);
            }}
            onPanDrag={() => {
              // User manually panned, disable auto-center
              if (autoCenter) {
                console.log('🖐️ User panned map, disabling auto-center');
                setAutoCenter(false);
              }
            }}
          >
            {providerLocation && (
              <Marker
                coordinate={{
                  latitude: providerLocation.latitude,
                  longitude: providerLocation.longitude,
                }}
                title="Service Provider"
                description="Provider is on the way"
                anchor={{ x: 0.5, y: 0.5 }}
                tracksViewChanges={false}
              >
                {Platform.OS === 'ios' ? (
                  <View style={styles.providerMarker}>
                    {/* Blue motorcycle with rider - matching your brand image */}
                    <View style={styles.bikeContainer}>
                      {/* Rider body */}
                      <View style={styles.riderBody}>
                        <View style={styles.riderHead} />
                      </View>
                      
                      {/* Motorcycle body */}
                      <View style={styles.bikeBody}>
                        {/* Handlebars */}
                        <View style={styles.handlebars}>
                          <View style={styles.leftMirror} />
                          <View style={styles.rightMirror} />
                        </View>
                        
                        {/* Tank with Serveaso branding */}
                        <View style={styles.bikeTank}>
                          <Text style={styles.bikeBrandText}>Serveaso</Text>
                        </View>
                        
                        {/* Seat/Rear */}
                        <View style={styles.bikeSeat}>
                          <View style={styles.seatBranding}>
                            <Text style={styles.seatBrandText}>S</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                    
                    {/* Shadow/base */}
                    <View style={styles.markerShadow} />
                  </View>
                ) : (
                  /* Simplified marker for Android - better performance */
                  <View style={styles.providerMarkerSimple}>
                    <View style={styles.bikeContainerSimple}>
                      {/* Rider */}
                      <View style={styles.riderSimple} />
                      
                      {/* Bike with branding */}
                      <View style={styles.bikeBodySimple}>
                        <Text style={styles.bikeBrandTextSimple}>S</Text>
                      </View>
                    </View>
                    <View style={styles.markerShadowSimple} />
                  </View>
                )}
              </Marker>
            )}
            
            {/* Customer Destination Marker */}
            {customerLocation && (
              <Marker
                coordinate={customerLocation}
                title="Your Location"
                description="Service destination"
              >
                <View style={styles.destinationMarker}>
                  <View style={styles.destinationMarkerCircle}>
                    <Icon name="home" size={24} color="#fff" />
                  </View>
                </View>
              </Marker>
            )}
          </MapView>

          {/* ETA Display */}
          {eta && currentETA > 0 && (
            <View style={[styles.etaContainer, { top: insets.top + 16 }]}>
              <View style={styles.etaContent}>
                <View style={styles.etaRow}>
                  <Icon name="clock-outline" size={24} color={getETAColor()} />
                  <View style={styles.etaInfo}>
                    <Text style={[styles.etaTime, { color: getETAColor() }]}>
                      {formatTime(currentETA)}
                    </Text>
                    <Text style={styles.etaLabel}>Estimated Arrival</Text>
                  </View>
                </View>
                
                {eta.distance_meters > 0 && (
                  <View style={styles.etaDetails}>
                    <Icon name="map-marker-distance" size={16} color="#64748B" />
                    <Text style={styles.etaDistance}>
                      {formatDistance(eta.distance_meters)}
                    </Text>
                    {eta.traffic_aware && (
                      <>
                        <Icon name="car" size={16} color="#3B82F6" />
                        <Text style={styles.trafficText}>Live traffic</Text>
                      </>
                    )}
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Close Button */}
          <TouchableOpacity
            style={[styles.closeButton, { top: insets.top + 16 }]}
            onPress={onClose}
          >
            <Icon name="close" size={24} color="#1F2937" />
          </TouchableOpacity>

          {/* Recenter Button - shows when auto-center is off */}
          {!autoCenter && (
            <TouchableOpacity
              style={[styles.recenterButton, { top: insets.top + 80 }]}
              onPress={() => {
                console.log('🎯 Recentering map...');
                setAutoCenter(true);
                fitMapToLocations();
              }}
            >
              <Icon name="crosshairs-gps" size={24} color="#1F2937" />
            </TouchableOpacity>
          )}

          {/* Connection Status */}
          <View style={[styles.statusBadge, { bottom: insets.bottom + 16 }]}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Live tracking</Text>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  recenterButton: {
    position: 'absolute',
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  providerMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bikeContainer: {
    width: 80,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  riderBody: {
    position: 'absolute',
    top: 5,
    alignItems: 'center',
    zIndex: 2,
  },
  riderHead: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#1E293B',
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  bikeBody: {
    width: 70,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  handlebars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 65,
    height: 12,
    marginBottom: 2,
  },
  leftMirror: {
    width: 22,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3B82F6',
    borderWidth: 2,
    borderColor: '#1E293B',
  },
  rightMirror: {
    width: 22,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3B82F6',
    borderWidth: 2,
    borderColor: '#1E293B',
  },
  bikeTank: {
    width: 50,
    height: 35,
    borderRadius: 25,
    backgroundColor: '#3B82F6',
    borderWidth: 3,
    borderColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  bikeBrandText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  bikeSeat: {
    width: 55,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    borderWidth: 2,
    borderColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  seatBranding: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatBrandText: {
    color: '#1E293B',
    fontSize: 16,
    fontWeight: 'bold',
  },
  markerShadow: {
    width: 60,
    height: 8,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    marginTop: -5,
  },
  providerMarkerCircle: {
    backgroundColor: '#EF4444',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  destinationMarker: {
    alignItems: 'center',
  },
  destinationMarkerCircle: {
    backgroundColor: '#3B82F6',
    borderRadius: 30,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  brandLabel: {
    marginTop: 4,
    backgroundColor: '#1F2937',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  brandText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  etaContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  etaContent: {
    gap: 12,
  },
  etaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  etaInfo: {
    flex: 1,
  },
  etaTime: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  etaLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  etaDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  etaDistance: {
    fontSize: 14,
    color: '#64748B',
  },
  trafficText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
  },
  statusBadge: {
    position: 'absolute',
    left: 16,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  statusText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  // Simplified Android marker styles
  providerMarkerSimple: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bikeContainerSimple: {
    width: 60,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  riderSimple: {
    position: 'absolute',
    top: 5,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    borderWidth: 2,
    borderColor: '#3B82F6',
    zIndex: 2,
  },
  bikeBodySimple: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3B82F6',
    borderWidth: 3,
    borderColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
  bikeBrandTextSimple: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  markerShadowSimple: {
    width: 50,
    height: 6,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    marginTop: -3,
  },
});

export default CustomerTrackingScreen;
