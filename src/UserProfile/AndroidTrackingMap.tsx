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

const BIKE_MARKER_URI = "data:image/png;base64,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";

// ---------------------------------------------------------------------------
// SVG marker — Customer / destination (matches iOS destinationMarkerCircle
// 54 × 54 green circle, white border 3 px, home icon centred)
// Anchor: centre of circle (30, 30) in a 60 × 64 canvas
// ---------------------------------------------------------------------------
const CUSTOMER_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="60" height="64" viewBox="0 0 60 64">' +
  // ground shadow
  '<ellipse cx="30" cy="62" rx="20" ry="4" fill="rgba(0,0,0,0.2)"/>' +
  // green circle, white border (matches destinationMarkerCircle exactly)
  '<circle cx="30" cy="30" r="27" fill="%2310B981" stroke="white" stroke-width="3"/>' +
  // home icon — roof
  '<path d="M11 32 L30 17 L49 32" stroke="white" stroke-width="3" fill="none" stroke-linejoin="round" stroke-linecap="round"/>' +
  // home icon — walls
  '<rect x="16" y="32" width="28" height="16" fill="none" stroke="white" stroke-width="3" rx="1"/>' +
  // home icon — door (filled white, like the icon in iOS)
  '<rect x="23" y="36" width="14" height="12" fill="white" rx="1"/>' +
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
        new google.maps.Polyline({path:[${routePoints}],geodesic:true,strokeColor:'%23FFFFFF',strokeOpacity:1,strokeWeight:8,map:map,zIndex:0});
        window.routePolyline=new google.maps.Polyline({path:[${routePoints}],geodesic:true,strokeColor:'%233B82F6',strokeOpacity:1,strokeWeight:5,map:map,zIndex:1});`
      : providerLocation && customerLocation
      ? `
        var fp=[{lat:${providerLocation.latitude},lng:${providerLocation.longitude}},{lat:${customerLocation.latitude},lng:${customerLocation.longitude}}];
        new google.maps.Polyline({path:fp,geodesic:true,strokeColor:'%23FFFFFF',strokeOpacity:1,strokeWeight:8,map:map,zIndex:0});
        new google.maps.Polyline({path:fp,geodesic:true,strokeColor:'%233B82F6',strokeOpacity:1,strokeWeight:5,map:map,zIndex:1});`
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
