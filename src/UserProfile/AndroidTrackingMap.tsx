/**
 * AndroidTrackingMap
 *
 * WebView + Google Maps JS API with custom markers:
 *   Provider  — real Serveaso motorcycle PNG (top-down illustration)
 *   Customer  — green circle (white border) with white home icon (SVG)
 */
import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import WebView from 'react-native-webview';

import { keys } from '../env';
const GOOGLE_MAPS_API_KEY = keys.api_key;

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

const BIKE_MARKER_URI = "data:image/png;base64,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";

// ---------------------------------------------------------------------------
// SVG marker — Customer / destination (matches iOS destinationMarkerCircle
// 54 × 54 green circle, white border 3 px, home icon centred)
// Anchor: centre of circle (30, 30) in a 60 × 64 canvas
// ---------------------------------------------------------------------------
const CUSTOMER_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="60" height="64" viewBox="0 0 60 64">' +
  '<style>' +
  '@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }' +
  '.bounce-icon { animation: bounce 1.5s infinite ease-in-out; }' +
  '</style>' +
  // ground shadow
  '<ellipse cx="30" cy="62" rx="20" ry="4" fill="rgba(0,0,0,0.2)"/>' +
  // green circle, white border (matches destinationMarkerCircle exactly)
  '<circle cx="30" cy="30" r="27" fill="%2310B981" stroke="white" stroke-width="3"/>' +
  // home icon (animated)
  '<g class="bounce-icon">' +
  // home icon — roof
  '<path d="M11 32 L30 17 L49 32" stroke="white" stroke-width="3" fill="none" stroke-linejoin="round" stroke-linecap="round"/>' +
  // home icon — walls
  '<rect x="16" y="32" width="28" height="16" fill="none" stroke="white" stroke-width="3" rx="1"/>' +
  // home icon — door (filled white, like the icon in iOS)
  '<rect x="23" y="36" width="14" height="12" fill="white" rx="1"/>' +
  '</g>' +
  '</svg>';

// ---------------------------------------------------------------------------
// Build full page HTML
// ---------------------------------------------------------------------------
const buildMapHTML = (
  providerLocation: Coordinate | null,
  customerLocation: Coordinate | null,
  routeCoordinates: Coordinate[],
): string => {
  const centerLat =
    customerLocation?.latitude ?? providerLocation?.latitude ?? 12.9716;
  const centerLng =
    customerLocation?.longitude ?? providerLocation?.longitude ?? 77.5946;

  const routePoints = routeCoordinates
    .map(c => `{lat:${c.latitude},lng:${c.longitude}}`)
    .join(',');

  const routeJS =
    routeCoordinates.length > 1
      ? `
        new google.maps.Polyline({path:[${routePoints}],geodesic:true,strokeColor:'#FFFFFF',strokeOpacity:1,strokeWeight:5,map:map,zIndex:0});
        window.routePolyline=new google.maps.Polyline({path:[${routePoints}],geodesic:true,strokeColor:'#3B82F6',strokeOpacity:1,strokeWeight:3,map:map,zIndex:1});`
      : providerLocation && customerLocation
      ? `
        var fp=[{lat:${providerLocation.latitude},lng:${providerLocation.longitude}},{lat:${customerLocation.latitude},lng:${customerLocation.longitude}}];
        new google.maps.Polyline({path:fp,geodesic:true,strokeColor:'#FFFFFF',strokeOpacity:1,strokeWeight:5,map:map,zIndex:0});
        new google.maps.Polyline({path:fp,geodesic:true,strokeColor:'#3B82F6',strokeOpacity:1,strokeWeight:3,map:map,zIndex:1});`
      : '';

  // Build the bounds JS: extend over ALL route points so the full route
  // is visible, not just the tiny gap between the two nearby markers.
  const routeBoundsJS =
    routeCoordinates.length > 1
      ? `window.routeBounds=new google.maps.LatLngBounds();
         [${routePoints}].forEach(function(p){window.routeBounds.extend(p);});`
      : providerLocation && customerLocation
      ? `window.routeBounds=new google.maps.LatLngBounds();
         window.routeBounds.extend({lat:${providerLocation.latitude},lng:${providerLocation.longitude}});
         window.routeBounds.extend({lat:${customerLocation.latitude},lng:${customerLocation.longitude}});`
      : '';

  const fitJS =
    providerLocation || customerLocation
      ? `(function(){
           var b = window.routeBounds
             ? new google.maps.LatLngBounds(window.routeBounds.getSouthWest(), window.routeBounds.getNorthEast())
             : new google.maps.LatLngBounds();
           ${providerLocation ? `b.extend({lat:${providerLocation.latitude},lng:${providerLocation.longitude}});` : ''}
           ${customerLocation ? `b.extend({lat:${customerLocation.latitude},lng:${customerLocation.longitude}});` : ''}
           map.fitBounds(b,{top:120,bottom:180,left:60,right:60});
         })();`
      : `map.setCenter({lat:${centerLat},lng:${centerLng}});map.setZoom(14);`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0,user-scalable=no"/>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body{width:100%;height:100%;overflow:hidden}
    #map{width:100%;height:100%}
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    // PNG bike marker — data URI passed directly (no SVG encoding needed)
    window.BIKE_MARKER_URI = ${JSON.stringify(BIKE_MARKER_URI)};
    window.CUSTOMER_SVG = ${JSON.stringify(CUSTOMER_SVG)};

    // makeIcon for SVG strings
    window.makeIcon = function(svg, w, h, ax, ay) {
      return {
        url: 'data:image/svg+xml,' + encodeURIComponent(svg),
        scaledSize: new google.maps.Size(w, h),
        anchor: new google.maps.Point(ax, ay),
      };
    };
    // makePNGIcon for data:image/png;base64 URIs
    window.makePNGIcon = function(uri, w, h, ax, ay) {
      return {
        url: uri,
        scaledSize: new google.maps.Size(w, h),
        anchor: new google.maps.Point(ax, ay),
      };
    };

    // Live position update — called by injectJavaScript on every poll cycle.
    // Also re-fits camera using route bounds so full route stays visible.
    window.updateProviderLocation = function(lat, lng) {
      if (!window.map) return;
      var pos = {lat: lat, lng: lng};
      if (window.providerMarker) {
        window.providerMarker.setPosition(pos);
      } else {
        window.providerMarker = new google.maps.Marker({
          position: pos,
          map: window.map,
          icon: window.makePNGIcon(window.BIKE_MARKER_URI, 30, 65, 15, 32),
          title: 'Service Provider',
          zIndex: 10,
        });
        // First time provider appears — refit to show full route
        var b = window.routeBounds
          ? new google.maps.LatLngBounds(window.routeBounds.getSouthWest(), window.routeBounds.getNorthEast())
          : new google.maps.LatLngBounds();
        b.extend(pos);
        if (window.customerMarker) b.extend(window.customerMarker.getPosition());
        window.map.fitBounds(b, {top:120, bottom:180, left:60, right:60});
      }
    };

    function initMap() {
      var map = new google.maps.Map(document.getElementById('map'), {
        center: {lat:${centerLat},lng:${centerLng}},
        zoom: 15,
        disableDefaultUI: true,
        gestureHandling: 'greedy',
        clickableIcons: false,
      });
      window.map = map;

      ${
        providerLocation
          ? `window.providerMarker = new google.maps.Marker({
               position:{lat:${providerLocation.latitude},lng:${providerLocation.longitude}},
               map:map,
               icon:window.makePNGIcon(window.BIKE_MARKER_URI,30,65,15,32),
               title:'Service Provider',
               zIndex:10
             });`
          : ''
      }

      ${
        customerLocation
          ? `window.customerMarker = new google.maps.Marker({
               position:{lat:${customerLocation.latitude},lng:${customerLocation.longitude}},
               map:map,
               // anchor at centre of the 27-px-radius circle (30,30) in 60×64 canvas
               icon:window.makeIcon(window.CUSTOMER_SVG,26,28,13,13),
               title:'Your Location',
               zIndex:10
             });`
          : ''
      }

      ${routeJS}
      ${routeBoundsJS}
      ${fitJS}

      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({type:'mapReady'}));
      }
    }
  </script>
  <script async defer
    src="https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initMap">
  </script>
</body>
</html>`;
};

// ---------------------------------------------------------------------------

const AndroidTrackingMap: React.FC<Props> = ({
  providerLocation,
  customerLocation,
  routeCoordinates,
  onMapReady,
}) => {
  const webViewRef = useRef<WebView>(null);

  // Live-update provider position without reloading the page
  useEffect(() => {
    if (!webViewRef.current || !providerLocation) return;
    webViewRef.current.injectJavaScript(`
      (function(){
        window.updateProviderLocation(
          ${providerLocation.latitude},
          ${providerLocation.longitude}
        );
      })();
      true;
    `);
  }, [providerLocation?.latitude, providerLocation?.longitude]);

  const handleMessage = useCallback(
    (event: { nativeEvent: { data: string } }) => {
      try {
        const msg = JSON.parse(event.nativeEvent.data);
        if (msg.type === 'mapReady' && onMapReady) onMapReady();
      } catch (_) {}
    },
    [onMapReady],
  );

  const html = useMemo(
    () => buildMapHTML(providerLocation, customerLocation, routeCoordinates),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      providerLocation?.latitude,
      providerLocation?.longitude,
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
