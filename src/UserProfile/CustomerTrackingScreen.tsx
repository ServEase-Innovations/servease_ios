import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StatusBar,
  Platform,
  Image,
  InteractionManager,
} from 'react-native';
import MapView, { Marker, Polyline, Region, PROVIDER_GOOGLE } from 'react-native-maps';
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
  route_polyline?: string;
}

/** Decode a Google Maps encoded polyline string into lat/lng coordinates. */
function decodePolyline(encoded: string): Array<{ latitude: number; longitude: number }> {
  const coords: Array<{ latitude: number; longitude: number }> = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  while (index < encoded.length) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : result >> 1;
    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : result >> 1;
    coords.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return coords;
}

export const CustomerTrackingScreen: React.FC<TrackingScreenProps> = React.memo(({
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
  const [mapLayoutComplete, setMapLayoutComplete] = useState(false);
  const [autoCenter, setAutoCenter] = useState(true);
  const mapReadyRef = useRef(false);
  const mapLayoutCompleteRef = useRef(false);

  // Debug: Log received props
  console.log('🎬 CustomerTrackingScreen props:', {
    engagementId,
    customerLatitude,
    customerLongitude,
    hasCustomerLocation: !!(customerLatitude && customerLongitude),
  });

  // Store initial region - use customer location if available, otherwise use default Bangalore coordinates
  // IMPORTANT: Check for valid coordinates (not 0, 0 which would show Africa)
  const hasValidCustomerLocation = customerLatitude && customerLongitude && 
    customerLatitude !== 0 && customerLongitude !== 0;
  
  // Memoize initial region to prevent MapView from remounting
  const initialRegion = useMemo(() => ({
    latitude: hasValidCustomerLocation ? customerLatitude : 12.9716,
    longitude: hasValidCustomerLocation ? customerLongitude : 77.5946,
    latitudeDelta: 0.025,
    longitudeDelta: 0.025,
  }), [customerLatitude, customerLongitude, hasValidCustomerLocation]);

  console.log('🗺️ Initial region:', initialRegion);
  console.log('🗺️ Has valid customer location:', hasValidCustomerLocation);

  // Customer location for destination marker
  // IMPORTANT: Only use if valid (not 0, 0)
  const customerLocation = useMemo(() => 
    hasValidCustomerLocation
      ? { latitude: customerLatitude!, longitude: customerLongitude! }
      : null,
    [hasValidCustomerLocation, customerLatitude, customerLongitude]
  );

  console.log('📍 Customer location:', customerLocation);

  // Decode the encoded polyline from the ETA response into map coordinates
  const routeCoordinates = useMemo(() => {
    if (!eta?.route_polyline) return [];
    try {
      return decodePolyline(eta.route_polyline);
    } catch (e) {
      console.warn('⚠️ Failed to decode route polyline:', e);
      return [];
    }
  }, [eta?.route_polyline]);

  // Always-valid coordinates for the Android Polyline (which must be mounted
  // on first render — dynamic add doesn't work with PROVIDER_GOOGLE).
  // Priority: decoded route > straight line fallback > off-screen dummy.
  const effectiveRouteCoords = useMemo(() => {
    if (routeCoordinates.length > 1) return routeCoordinates;
    if (providerLocation && customerLocation) {
      return [
        { latitude: providerLocation.latitude, longitude: providerLocation.longitude },
        { latitude: customerLocation.latitude, longitude: customerLocation.longitude },
      ];
    }
    // Off-screen dummy — Polyline stays mounted but invisible
    return [
      { latitude: 0.001, longitude: 0.001 },
      { latitude: 0.002, longitude: 0.002 },
    ];
  }, [routeCoordinates, providerLocation, customerLocation]);

  const handleMapReady = useCallback(() => {
    console.log('✅✅✅ Map is READY!!! Platform:', Platform.OS);
    mapReadyRef.current = true;
    setMapReady(true);
    // NOTE: On iOS, onMapReady alone is sufficient to trigger fitMapToLocations.
    // Do NOT set mapLayoutComplete here — the extra setState causes a second
    // rapid re-render that can corrupt Google Maps' native initialization on iOS.
    // mapLayoutComplete is only needed on Android (set via onLayout).
  }, []);

  const handleMapLayout = useCallback(() => {
    console.log('📐 Map layout complete');
    mapLayoutCompleteRef.current = true;
    setMapLayoutComplete(true);
    // On Android, onLayout is more reliable than onMapReady as the signal
    // that the map surface is ready to receive camera commands.
    if (Platform.OS === 'android') {
      console.log('🤖 Android: onLayout fired, marking map ready');
      mapReadyRef.current = true;
      setMapReady(true);
    }
  }, []);

  const handleRegionChange = useCallback((newRegion: Region) => {
    console.log('🗺️ Region changed to:', {
      lat: newRegion.latitude.toFixed(4),
      lng: newRegion.longitude.toFixed(4),
    });
  }, []);

  const handlePanDrag = useCallback(() => {
    if (autoCenter) {
      console.log('🖐️ User panned map, disabling auto-center');
      setAutoCenter(false);
    }
  }, [autoCenter]);

  // Fit map to show both customer and provider locations
  const fitMapToLocations = useCallback(() => {
    console.log('📍 fitMapToLocations called');
    
    if (!mapRef.current) {
      console.error('❌ mapRef.current is null!');
      return;
    }
    
    // On Android we need BOTH onMapReady AND onLayout to have fired before
    // issuing camera commands — otherwise the calls are silently ignored.
    const isMapFullyReady = Platform.OS === 'android'
      ? mapReady && mapLayoutComplete
      : mapReady;

    if (!isMapFullyReady) {
      console.warn('⏸️ Map not fully ready yet (mapReady:', mapReady, 'mapLayoutComplete:', mapLayoutComplete, ')');
      return;
    }
    
    console.log('✅ mapRef and map fully ready');
    
    const coordinates: Array<{ latitude: number; longitude: number }> = [];
    
    // Add customer location if available
    if (customerLocation) {
      console.log('➕ Adding customer location:', customerLocation);
      coordinates.push(customerLocation);
    } else {
      console.log('⚠️ No customer location');
    }
    
    // Add provider location if available
    if (providerLocation) {
      const provCoords = {
        latitude: providerLocation.latitude,
        longitude: providerLocation.longitude,
      };
      console.log('➕ Adding provider location:', provCoords);
      coordinates.push(provCoords);
    } else {
      console.log('⚠️ No provider location');
    }
    
    console.log('📊 Total coordinates:', coordinates.length, coordinates);
    
    // Fit to both markers if available
    if (coordinates.length === 2) {
      console.log('🎯 Calling fitToCoordinates with 2 points');
      try {
        mapRef.current.fitToCoordinates(coordinates, {
          edgePadding: {
            top: 120,
            bottom: 180,
            left: 60,
            right: 60,
          },
          animated: true,
        });
        console.log('✅ fitToCoordinates called successfully');
      } catch (error) {
        console.error('❌ fitToCoordinates error:', error);
      }
    } else if (coordinates.length === 1) {
      // Center on single marker
      console.log('📍 Calling animateCamera with 1 point:', coordinates[0]);
      try {
        mapRef.current.animateCamera({
          center: coordinates[0],
          zoom: 17,
        }, { duration: 800 });
        console.log('✅ animateCamera called successfully');
      } catch (error) {
        console.error('❌ animateCamera error:', error);
      }
    } else {
      console.warn('⚠️ No coordinates to fit to');
    }
  }, [mapReady, mapLayoutComplete, customerLocation, providerLocation]);

  // Fit map when any relevant state changes:
  // - mapReady or mapLayoutComplete (map surface becomes usable)
  // - providerLocation or customerLocation (new coordinates to show)
  // - autoCenter toggled back on
  useEffect(() => {
    // On Android we need both flags; on iOS mapReady is sufficient
    const isMapFullyReady = Platform.OS === 'android'
      ? mapReady && mapLayoutComplete
      : mapReady;

    if (!isMapFullyReady) {
      console.log('⏸️ Map not fully ready yet, skipping fitMapToLocations');
      return;
    }
    
    if (autoCenter) {
      console.log('🎯 Map ready and autoCenter enabled, scheduling fit...');
      console.log('🎯 Current state:', { 
        hasProviderLocation: !!providerLocation, 
        hasCustomerLocation: !!customerLocation,
        providerCoords: providerLocation ? `${providerLocation.latitude},${providerLocation.longitude}` : 'none',
        customerCoords: customerLocation ? `${customerLocation.latitude},${customerLocation.longitude}` : 'none'
      });
      
      // Small delay to let the map rendering settle before issuing camera commands
      const delay = Platform.OS === 'android' ? 500 : 300;
      console.log(`⏱️ Scheduling fitMapToLocations in ${delay}ms`);
      
      const timer = setTimeout(() => {
        console.log('🚀 Executing fitMapToLocations now...');
        fitMapToLocations();
      }, delay);
      
      return () => clearTimeout(timer);
    } else {
      console.log('🔒 autoCenter disabled, not fitting map');
    }
  }, [mapReady, mapLayoutComplete, providerLocation, customerLocation, autoCenter, fitMapToLocations]);

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
      console.log('📍 Location object details:', JSON.stringify(data.location, null, 2));
      
      if (data?.location) {
        // Validate location data before setting
        const lat = data.location.latitude;
        const lng = data.location.longitude;
        
        console.log('🔍 Checking coordinates:', { lat, lng, isZeroLat: lat === 0, isZeroLng: lng === 0 });
        
        if (!lat || !lng || lat === 0 || lng === 0) {
          console.error('❌ Invalid location data received (0, 0):', data.location);
          setError('Invalid provider location received');
          return;
        }
        
        console.log('✅ Valid location data:', { lat, lng });
        setProviderLocation(data.location);
        
        // Clear error if location is successfully fetched
        setError(null);
      } else {
        console.warn('⚠️ No location object in response');
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
      console.log('📊 ETA data received:', JSON.stringify(etaData));
      console.log('🗺️ route_polyline present:', !!etaData?.route_polyline, 'length:', etaData?.route_polyline?.length ?? 0);
      
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

  // ---------------------------------------------------------------------------
  // Render helpers — shared MapView + markers (used by both platform branches)
  // ---------------------------------------------------------------------------
  const renderMapContent = () => (
    <>
      {providerLocation &&
       providerLocation.latitude !== 0 &&
       providerLocation.longitude !== 0 && (
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
              <View style={styles.bikeContainer}>
                <View style={styles.riderBody}>
                  <View style={styles.riderHead} />
                </View>
                <View style={styles.bikeBody}>
                  <View style={styles.handlebars}>
                    <View style={styles.leftMirror} />
                    <View style={styles.rightMirror} />
                  </View>
                  <View style={styles.bikeTank}>
                    <Text style={styles.bikeBrandText}>Serveaso</Text>
                  </View>
                  <View style={styles.bikeSeat}>
                    <View style={styles.seatBranding}>
                      <Text style={styles.seatBrandText}>S</Text>
                    </View>
                  </View>
                </View>
              </View>
              <View style={styles.markerShadow} />
            </View>
          ) : (
            // Android: pure Views only — vector icon fonts don't render in
            // native marker snapshots. The motorcycle is drawn with circles
            // (wheel rings) and rectangles (body + handlebar) only.
            <View
              style={styles.androidMarkerWrapper}
              onLayout={() => {}}
            >
              {/* Rider head dot */}
              <View style={styles.riderSimple} />

              {/* Blue badge circle containing the moto silhouette */}
              <View style={styles.bikeBodySimple}>
                {/* Handlebars — horizontal bar with two raised ends */}
                <View style={styles.motoHandlebarRow}>
                  <View style={styles.motoHandlebarEnd} />
                  <View style={styles.motoHandlebarBar} />
                  <View style={styles.motoHandlebarEnd} />
                </View>

                {/* Two wheel rings + body block between them */}
                <View style={styles.motoWheelRow}>
                  <View style={styles.motoWheel} />
                  <View style={styles.motoBody} />
                  <View style={styles.motoWheel} />
                </View>
              </View>

              {/* Drop-shadow pill */}
              <View style={styles.markerShadowSimple} />
            </View>
          )}

        </Marker>
      )}

      {customerLocation && (
        <Marker
          coordinate={customerLocation}
          title="Your Location"
          description="Service destination"
          tracksViewChanges={false}
        >
          {Platform.OS === 'ios' ? (
            // iOS: Icon renders fine
            <View style={styles.destinationMarker}>
              <View style={styles.destinationMarkerCircle}>
                <Icon name="home" size={24} color="#fff" />
              </View>
            </View>
          ) : (
            // Android: pure Views — no Icon font, explicit outer size
            <View
              style={styles.androidDestWrapper}
              onLayout={() => {}}
            >
              <View style={styles.destinationMarkerCircle}>
                {/* House shape: roof triangle (rotated square) + wall block */}
                <View style={styles.houseRoof} />
                <View style={styles.houseWall} />
              </View>
              <View style={styles.markerShadowSimple} />
            </View>
          )}
        </Marker>
      )}

      {/* Route polyline — decoded from the encoded polyline in the ETA response */}
      {routeCoordinates.length > 1 && (
        <>
          {/* White casing underneath for road-outline effect */}
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="rgba(255,255,255,0.9)"
            strokeWidth={7}
            lineCap="round"
            lineJoin="round"
          />
          {/* Blue route line on top */}
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#3B82F6"
            strokeWidth={4}
            lineCap="round"
            lineJoin="round"
          />
        </>
      )}
    </>
  );

  const renderOverlays = () => (
    <>
      {/* ETA Display — show whenever eta data is available, including the arrived state */}
      {!loading && !error && eta && (
        <View style={[styles.etaContainer, { top: insets.top + 16 }]}>
          <View style={styles.etaContent}>
            <View style={styles.etaRow}>
              <Icon
                name={currentETA === 0 ? 'check-circle' : 'clock-outline'}
                size={24}
                color={currentETA === 0 ? '#10B981' : getETAColor()}
              />
              <View style={styles.etaInfo}>
                <Text style={[styles.etaTime, { color: currentETA === 0 ? '#10B981' : getETAColor() }]}>
                  {currentETA === 0 ? 'Arrived!' : formatTime(currentETA)}
                </Text>
                <Text style={styles.etaLabel}>
                  {currentETA === 0 ? 'Provider is here' : 'Estimated Arrival'}
                </Text>
              </View>
            </View>
            {currentETA > 0 && eta.distance_meters > 0 && (
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

      {/* Recenter Button */}
      {!autoCenter && (
        <TouchableOpacity
          style={[styles.recenterButton, { top: insets.top + 80 }]}
          onPress={() => {
            console.log('🎯 Recentering map...');
            setAutoCenter(true);
            requestAnimationFrame(() => { fitMapToLocations(); });
          }}
        >
          <Icon name="crosshairs-gps" size={24} color="#1F2937" />
        </TouchableOpacity>
      )}

      {/* Connection Status */}
      {!loading && !error && (
        <View style={[styles.statusBadge, { bottom: insets.bottom + 16 }]}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Live tracking</Text>
        </View>
      )}
    </>
  );

  // ---------------------------------------------------------------------------
  // iOS: React Native views CANNOT overlay a native MapView using zIndex.
  // Keep the original conditional-mount pattern — MapView only mounts after
  // loading so the loading/error screens work correctly.
  // ---------------------------------------------------------------------------
  if (Platform.OS === 'ios') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />

        {loading && (
          <View style={styles.loadingOverlayFull}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Loading tracking...</Text>
          </View>
        )}

        {!loading && error && (
          <View style={styles.errorContainerFull}>
            <Icon name="alert-circle" size={48} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchLocationAndETA}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && (
          <>
            {/*
             * iOS uses the DEFAULT provider (Apple Maps).
             * PROVIDER_GOOGLE on iOS requires native GoogleMaps SDK setup in
             * AppDelegate — if that is not configured tiles show as blank/gray.
             * Apple Maps works out of the box with no API key.
             */}
            <MapView
              key="tracking-map"
              ref={mapRef}
              style={styles.map}
              initialRegion={initialRegion}
              showsUserLocation={false}
              showsMyLocationButton={false}
              loadingEnabled={true}
              loadingIndicatorColor="#3B82F6"
              loadingBackgroundColor="#F3F4F6"
              maxZoomLevel={20}
              rotateEnabled={false}
              pitchEnabled={false}
              scrollEnabled={true}
              zoomEnabled={true}
              mapType="standard"
              showsTraffic={false}
              showsBuildings={true}
              showsIndoors={false}
              onMapReady={handleMapReady}
              onRegionChangeComplete={handleRegionChange}
              onPanDrag={handlePanDrag}
            >
              {renderMapContent()}
            </MapView>
            {renderOverlays()}
          </>
        )}
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // Android: MapView is ALWAYS mounted so onLayout fires before the map is
  // visible. React Native overlays (loading / error) sit on top via zIndex —
  // this works on Android because native views respect the RN z-order there.
  // ---------------------------------------------------------------------------
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Always-mounted map — onLayout fires immediately on mount */}
      <MapView
        key="tracking-map-android"
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={false}
        showsMyLocationButton={false}
        loadingEnabled={true}
        loadingIndicatorColor="#3B82F6"
        loadingBackgroundColor="#F3F4F6"
        minZoomLevel={5}
        maxZoomLevel={20}
        rotateEnabled={false}
        pitchEnabled={false}
        scrollEnabled={true}
        zoomEnabled={true}
        mapType="standard"
        showsTraffic={false}
        showsBuildings={true}
        showsIndoors={false}
        toolbarEnabled={false}
        onMapReady={handleMapReady}
        onLayout={handleMapLayout}
        onRegionChangeComplete={handleRegionChange}
        onPanDrag={handlePanDrag}
      >
        {/* Provider marker — default red pin (no pinColor = most compatible) */}
        <Marker
          coordinate={
            providerLocation && Math.abs(providerLocation.latitude) > 0.001
              ? { latitude: providerLocation.latitude, longitude: providerLocation.longitude }
              : { latitude: 0.001, longitude: 0.001 }
          }
          visible={!!providerLocation && Math.abs(providerLocation.latitude) > 0.001}
          title="Service Provider"
          description="Provider is on the way"
        />


        {/* Destination marker — default red pin */}
        <Marker
          coordinate={customerLocation || { latitude: 0.001, longitude: 0.001 }}
          visible={!!customerLocation}
          title="Your Location"
          description="Service destination"
        />

        {/* Route polylines — ALWAYS MOUNTED, coordinates update as data arrives.
            White casing + blue line give the iOS-style route appearance. */}
        <Polyline
          coordinates={effectiveRouteCoords}
          strokeColor="#FFFFFF"
          strokeWidth={7}
        />
        <Polyline
          coordinates={effectiveRouteCoords}
          strokeColor="#3B82F6"
          strokeWidth={4}
        />
      </MapView>

      {/* Loading overlay on top of map */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading tracking...</Text>
        </View>
      )}

      {/* Error overlay on top of map */}
      {!loading && error && (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchLocationAndETA}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {renderOverlays()}
    </View>
  );

},
// Custom comparator: ignore onClose reference changes (parent re-creates it
// on every render). Only re-render when tracking data actually changes.
(prevProps, nextProps) =>
  prevProps.engagementId === nextProps.engagementId &&
  prevProps.customerLatitude === nextProps.customerLatitude &&
  prevProps.customerLongitude === nextProps.customerLongitude
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F3F4F6',
    zIndex: 10,
  },
  // iOS uses flex-based full-screen views (no MapView underneath during loading)
  loadingOverlayFull: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  errorContainerFull: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F3F4F6',
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
    width: 56,
  },
  destinationMarkerCircle: {
    backgroundColor: '#10B981',
    borderRadius: 27,
    width: 54,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    overflow: 'hidden',
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
  // House shape for Android destination marker (pure Views)
  houseRoof: {
    width: 22,
    height: 22,
    backgroundColor: '#fff',
    borderRadius: 3,
    transform: [{ rotate: '45deg' }],
    marginBottom: -12,
  },
  houseWall: {
    width: 18,
    height: 14,
    backgroundColor: '#fff',
    borderRadius: 2,
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
  // Android marker wrapper: explicit width + height so the snapshot canvas is sized
  androidMarkerWrapper: {
    width: 56,
    height: 72,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  // Ultra-simple single-View Android markers — one solid circle, no nesting,
  // no fonts, no icons. Renders reliably in the native bitmap snapshot.
  androidProviderDot: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563EB',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  androidDestDot: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#059669',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  // Capture container: positioned at top-left, rendered BEFORE the MapView
  // so the map (absoluteFillObject) naturally covers it. No zIndex tricks needed.
  androidCaptureContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 110,
    height: 56,
    flexDirection: 'row',
    gap: 6,
  },


  // Android destination marker wrapper
  androidDestWrapper: {
    width: 56,
    height: 62,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  bikeContainerSimple: {
    width: 60,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  riderSimple: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#1E293B',
    borderWidth: 2,
    borderColor: '#3B82F6',
    marginBottom: -4,
    zIndex: 2,
  },
  bikeBodySimple: {
    width: 52,
    height: 52,
    borderRadius: 26,
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
    width: 40,
    height: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    marginTop: 2,
  },
  // ── Android motorcycle silhouette (pure Views, no fonts/icons) ──────────────
  motoHandlebarRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 5,
  },
  motoHandlebarEnd: {
    width: 5,
    height: 8,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  motoHandlebarBar: {
    width: 18,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.85)',
    marginHorizontal: 1,
  },
  motoWheelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  motoWheel: {
    width: 13,
    height: 13,
    borderRadius: 6.5,
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.95)',
    // transparent causes snapshot artifacts on Android — use parent bg colour
    backgroundColor: '#3B82F6',
  },
  motoBody: {
    width: 8,
    height: 7,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.85)',
    marginHorizontal: 1,
  },
});

export default CustomerTrackingScreen;
