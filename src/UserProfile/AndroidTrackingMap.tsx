/**
 * AndroidTrackingMap
 *
 * WebView + Google Maps JS API with SVG markers that match the iOS design:
 *   Provider  — dark bike body / blue handlebar mirrors / blue "Serveaso"
 *               tank / dark seat with white "S" circle — anchored at center
 *   Customer  — green circle (white border) with white home icon
 *
 * Colours match CustomerTrackingScreen StyleSheet exactly:
 *   #1E293B  dark body / seat
 *   #3B82F6  blue tank / mirrors
 *   #10B981  green destination circle
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

// ---------------------------------------------------------------------------
// SVG marker — Provider (matches iOS bikeContainer 80 × 105)
// Rider head (dark + blue ring) → handlebar mirrors (blue) →
// tank (blue, "Serveaso") → seat (dark, white "S" circle) → shadow
// Anchor: visual centre of the bike body ≈ (40, 60)
// ---------------------------------------------------------------------------
const PROVIDER_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="110" viewBox="0 0 80 110">' +
  // ground shadow
  '<ellipse cx="40" cy="108" rx="28" ry="5" fill="rgba(0,0,0,0.2)"/>' +
  // rider head — dark circle, blue ring
  '<circle cx="40" cy="14" r="9" fill="%231E293B" stroke="%233B82F6" stroke-width="2.5"/>' +
  // left handlebar mirror
  '<rect x="4" y="27" width="23" height="11" rx="5" fill="%233B82F6" stroke="%231E293B" stroke-width="2"/>' +
  // right handlebar mirror
  '<rect x="53" y="27" width="23" height="11" rx="5" fill="%233B82F6" stroke="%231E293B" stroke-width="2"/>' +
  // bike tank (blue pill)
  '<rect x="15" y="41" width="50" height="34" rx="17" fill="%233B82F6" stroke="%231E293B" stroke-width="3"/>' +
  // "Serveaso" text on tank
  '<text x="40" y="62" text-anchor="middle" fill="white" font-size="8" font-weight="bold" font-family="Arial,sans-serif" letter-spacing="0.5">Serveaso</text>' +
  // seat (dark rounded rect)
  '<rect x="12" y="77" width="56" height="27" rx="8" fill="%231E293B"/>' +
  // white branding circle on seat
  '<circle cx="40" cy="91" r="12" fill="white"/>' +
  // "S" branding text
  '<text x="40" y="97" text-anchor="middle" fill="%231E293B" font-size="15" font-weight="bold" font-family="Arial,sans-serif">S</text>' +
  '</svg>';

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
    // Stored once — reused by live injectJavaScript calls
    window.PROVIDER_SVG = ${JSON.stringify(PROVIDER_SVG)};
    window.CUSTOMER_SVG = ${JSON.stringify(CUSTOMER_SVG)};

    // makeIcon(svg, w, h, anchorX, anchorY)
    window.makeIcon = function(svg, w, h, ax, ay) {
      return {
        url: 'data:image/svg+xml,' + encodeURIComponent(svg),
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
          icon: window.makeIcon(window.PROVIDER_SVG, 32, 44, 16, 24),
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
               icon:window.makeIcon(window.PROVIDER_SVG,32,44,16,24),
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
