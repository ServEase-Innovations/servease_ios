/**
 * AndroidTrackingMap
 *
 * Uses a WebView + Google Maps JavaScript API instead of react-native-maps
 * PROVIDER_GOOGLE. This bypasses the native bridge issue where Marker and
 * Polyline children are silently ignored on certain Android configurations.
 *
 * The Google Maps JS API always renders markers and polylines reliably.
 */
import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import WebView from 'react-native-webview';

// Same key that is already declared in AndroidManifest.xml
const GOOGLE_MAPS_API_KEY = 'AIzaSyBWoIIAX-gE7fvfAkiquz70WFgDaL7YXSk';

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface Props {
  providerLocation: Coordinate | null;
  customerLocation: Coordinate | null;
  routeCoordinates: Coordinate[];
  onMapReady?: () => void;
}

const buildMapHTML = (
  providerLocation: Coordinate | null,
  customerLocation: Coordinate | null,
  routeCoordinates: Coordinate[],
): string => {
  const centerLat = customerLocation?.latitude ?? providerLocation?.latitude ?? 12.9716;
  const centerLng = customerLocation?.longitude ?? providerLocation?.longitude ?? 77.5946;

  const providerJS = providerLocation
    ? `
      window.providerMarker = new google.maps.Marker({
        position: { lat: ${providerLocation.latitude}, lng: ${providerLocation.longitude} },
        map: map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: '#2563EB',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 3,
        },
        title: 'Service Provider',
        zIndex: 2,
      });
      bounds.extend({ lat: ${providerLocation.latitude}, lng: ${providerLocation.longitude} });
    `
    : '';

  const customerJS = customerLocation
    ? `
      window.customerMarker = new google.maps.Marker({
        position: { lat: ${customerLocation.latitude}, lng: ${customerLocation.longitude} },
        map: map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: '#10B981',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 3,
        },
        title: 'Your Location',
        zIndex: 2,
      });
      bounds.extend({ lat: ${customerLocation.latitude}, lng: ${customerLocation.longitude} });
    `
    : '';

  const routePoints = routeCoordinates
    .map(c => `{lat:${c.latitude},lng:${c.longitude}}`)
    .join(',');

  const routeJS =
    routeCoordinates.length > 1
      ? `
      // White casing
      new google.maps.Polyline({
        path: [${routePoints}],
        geodesic: true,
        strokeColor: '#FFFFFF',
        strokeOpacity: 1.0,
        strokeWeight: 8,
        map: map,
        zIndex: 0,
      });
      // Blue route on top
      window.routePolyline = new google.maps.Polyline({
        path: [${routePoints}],
        geodesic: true,
        strokeColor: '#3B82F6',
        strokeOpacity: 1.0,
        strokeWeight: 5,
        map: map,
        zIndex: 1,
      });
    `
      : providerLocation && customerLocation
      ? `
      new google.maps.Polyline({
        path: [
          {lat:${providerLocation.latitude},lng:${providerLocation.longitude}},
          {lat:${customerLocation.latitude},lng:${customerLocation.longitude}}
        ],
        geodesic: true,
        strokeColor: '#FFFFFF',
        strokeOpacity: 1.0,
        strokeWeight: 8,
        map: map,
        zIndex: 0,
      });
      new google.maps.Polyline({
        path: [
          {lat:${providerLocation.latitude},lng:${providerLocation.longitude}},
          {lat:${customerLocation.latitude},lng:${customerLocation.longitude}}
        ],
        geodesic: true,
        strokeColor: '#3B82F6',
        strokeOpacity: 1.0,
        strokeWeight: 5,
        map: map,
        zIndex: 1,
      });
    `
      : '';

  const fitBoundsJS =
    providerLocation && customerLocation
      ? `
      map.fitBounds(bounds, { top: 100, bottom: 150, left: 50, right: 50 });
    `
      : `
      map.setCenter({ lat: ${centerLat}, lng: ${centerLng} });
      map.setZoom(16);
    `;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; }
    #map { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    function initMap() {
      var map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: ${centerLat}, lng: ${centerLng} },
        zoom: 15,
        disableDefaultUI: true,
        gestureHandling: 'greedy',
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: false,
      });
      window.map = map;

      var bounds = new google.maps.LatLngBounds();

      ${providerJS}
      ${customerJS}
      ${routeJS}
      ${fitBoundsJS}

      // Notify React Native the map is ready
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapReady' }));
      }
    }
  </script>
  <script
    async
    defer
    src="https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initMap">
  </script>
</body>
</html>
`;
};

const AndroidTrackingMap: React.FC<Props> = ({
  providerLocation,
  customerLocation,
  routeCoordinates,
  onMapReady,
}) => {
  const webViewRef = useRef<WebView>(null);

  // Inject updated provider position without reloading the whole page
  useEffect(() => {
    if (!webViewRef.current || !providerLocation) return;
    webViewRef.current.injectJavaScript(`
      (function() {
        if (window.providerMarker) {
          window.providerMarker.setPosition({
            lat: ${providerLocation.latitude},
            lng: ${providerLocation.longitude}
          });
        }
      })();
      true;
    `);
  }, [providerLocation?.latitude, providerLocation?.longitude]);

  const handleMessage = useCallback(
    (event: { nativeEvent: { data: string } }) => {
      try {
        const msg = JSON.parse(event.nativeEvent.data);
        if (msg.type === 'mapReady' && onMapReady) {
          onMapReady();
        }
      } catch (_) {}
    },
    [onMapReady],
  );

  // Build the full HTML once — initial data is baked in.
  // routeCoordinates and customerLocation rarely change, so this is fine.
  // Provider position is updated live via injectJavaScript above.
  const html = useMemo(
    () => buildMapHTML(providerLocation, customerLocation, routeCoordinates),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      customerLocation?.latitude,
      customerLocation?.longitude,
      routeCoordinates.length,
    ],
  );

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html }}
        style={styles.webView}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        mixedContentMode="always"
        originWhitelist={['*']}
        onMessage={handleMessage}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        androidLayerType="hardware"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});

export default AndroidTrackingMap;
