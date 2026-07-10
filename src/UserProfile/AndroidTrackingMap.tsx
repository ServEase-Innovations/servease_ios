/**
 * AndroidTrackingMap
 *
 * Uses a WebView + Google Maps JavaScript API with custom SVG markers.
 * - Provider: blue teardrop badge with motorcycle + rider silhouette
 * - Customer: green teardrop badge with home silhouette
 * - Route: white-cased blue polyline
 *
 * The JS API renders everything reliably on all Android configurations.
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
// SVG marker definitions — embedded inline so they work offline too
// ---------------------------------------------------------------------------

// Blue teardrop pin with a motorcycle + rider silhouette
const PROVIDER_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="54" height="70" viewBox="0 0 54 70">' +
  // soft drop shadow
  '<ellipse cx="27" cy="68" rx="11" ry="3.5" fill="rgba(0,0,0,0.22)"/>' +
  // teardrop body
  '<path d="M27 66 C27 66 4 46 4 27 C4 14.3 14.3 4 27 4 C39.7 4 50 14.3 50 27 C50 46 27 66 27 66Z" fill="%232563EB"/>' +
  // inner ring / sheen
  '<circle cx="27" cy="25" r="18" fill="%231D4ED8" opacity="0.6"/>' +
  // rear wheel
  '<circle cx="16" cy="31" r="7" fill="none" stroke="white" stroke-width="2.5"/>' +
  // front wheel
  '<circle cx="37" cy="31" r="7" fill="none" stroke="white" stroke-width="2.5"/>' +
  // bike frame
  '<path d="M16 31 L20 19 L33 19 L37 31" fill="none" stroke="white" stroke-width="2.2" stroke-linejoin="round"/>' +
  // seat
  '<path d="M20 22 L33 22" stroke="white" stroke-width="3.5" stroke-linecap="round"/>' +
  // handlebars
  '<path d="M33 19 L39 16" stroke="white" stroke-width="2.2" stroke-linecap="round"/>' +
  // rider head
  '<circle cx="21" cy="13" r="4.5" fill="white"/>' +
  // rider body (leaning forward)
  '<path d="M21 17 L23 22" stroke="white" stroke-width="2.5" stroke-linecap="round"/>' +
  '</svg>';

// Green teardrop pin with a house silhouette
const CUSTOMER_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="54" height="70" viewBox="0 0 54 70">' +
  '<ellipse cx="27" cy="68" rx="11" ry="3.5" fill="rgba(0,0,0,0.22)"/>' +
  '<path d="M27 66 C27 66 4 46 4 27 C4 14.3 14.3 4 27 4 C39.7 4 50 14.3 50 27 C50 46 27 66 27 66Z" fill="%2310B981"/>' +
  '<circle cx="27" cy="25" r="18" fill="%23059669" opacity="0.6"/>' +
  // roof
  '<path d="M13 29 L27 16 L41 29" stroke="white" stroke-width="2.5" fill="none" stroke-linejoin="round" stroke-linecap="round"/>' +
  // walls
  '<path d="M17 29 L17 39 L37 39 L37 29" stroke="white" stroke-width="2.5" fill="none" stroke-linejoin="round"/>' +
  // door (filled white)
  '<rect x="22" y="31" width="10" height="8" rx="1" fill="white"/>' +
  // door knob
  '<circle cx="30" cy="35" r="1" fill="%2310B981"/>' +
  '</svg>';

// ---------------------------------------------------------------------------
// Build the full page HTML — SVG icons are defined once in the page JS
// so that live injectJavaScript calls can reference them without repeating
// the large string on every position update.
// ---------------------------------------------------------------------------
const buildMapHTML = (
  providerLocation: Coordinate | null,
  customerLocation: Coordinate | null,
  routeCoordinates: Coordinate[],
): string => {
  const centerLat = customerLocation?.latitude ?? providerLocation?.latitude ?? 12.9716;
  const centerLng = customerLocation?.longitude ?? providerLocation?.longitude ?? 77.5946;

  const routePoints = routeCoordinates
    .map(c => `{lat:${c.latitude},lng:${c.longitude}}`)
    .join(',');

  const routeJS =
    routeCoordinates.length > 1
      ? `
      new google.maps.Polyline({path:[${routePoints}],geodesic:true,strokeColor:'%23FFFFFF',strokeOpacity:1,strokeWeight:8,map:map,zIndex:0});
      window.routePolyline = new google.maps.Polyline({path:[${routePoints}],geodesic:true,strokeColor:'%233B82F6',strokeOpacity:1,strokeWeight:5,map:map,zIndex:1});
      `
      : providerLocation && customerLocation
      ? `
      var fallbackPath=[{lat:${providerLocation.latitude},lng:${providerLocation.longitude}},{lat:${customerLocation.latitude},lng:${customerLocation.longitude}}];
      new google.maps.Polyline({path:fallbackPath,geodesic:true,strokeColor:'%23FFFFFF',strokeOpacity:1,strokeWeight:8,map:map,zIndex:0});
      new google.maps.Polyline({path:fallbackPath,geodesic:true,strokeColor:'%233B82F6',strokeOpacity:1,strokeWeight:5,map:map,zIndex:1});
      `
      : '';

  const hasBoth = !!providerLocation && !!customerLocation;
  const fitBoundsJS = hasBoth
    ? `
      var b=new google.maps.LatLngBounds();
      b.extend({lat:${providerLocation!.latitude},lng:${providerLocation!.longitude}});
      b.extend({lat:${customerLocation!.latitude},lng:${customerLocation!.longitude}});
      map.fitBounds(b,{top:100,bottom:150,left:50,right:50});
      `
    : `map.setCenter({lat:${centerLat},lng:${centerLng}});map.setZoom(16);`;

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
    // ---- SVG icon definitions (available for live injection too) ----
    window.PROVIDER_SVG = ${JSON.stringify(PROVIDER_SVG)};
    window.CUSTOMER_SVG = ${JSON.stringify(CUSTOMER_SVG)};

    window.makeIcon = function(svg, w, h) {
      return {
        url: 'data:image/svg+xml,' + encodeURIComponent(svg),
        scaledSize: new google.maps.Size(w, h),
        anchor: new google.maps.Point(w / 2, h - 4),
      };
    };

    // ---- Live-update helpers called by injectJavaScript ----
    window.updateProviderLocation = function(lat, lng) {
      if (!window.map) return;
      var pos = {lat: lat, lng: lng};
      if (window.providerMarker) {
        window.providerMarker.setPosition(pos);
      } else {
        window.providerMarker = new google.maps.Marker({
          position: pos,
          map: window.map,
          icon: window.makeIcon(window.PROVIDER_SVG, 54, 70),
          title: 'Service Provider',
          zIndex: 10,
        });
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

      // ---- Provider marker ----
      ${
        providerLocation
          ? `
      window.providerMarker = new google.maps.Marker({
        position:{lat:${providerLocation.latitude},lng:${providerLocation.longitude}},
        map:map,
        icon:window.makeIcon(window.PROVIDER_SVG,54,70),
        title:'Service Provider',
        zIndex:10,
      });`
          : ''
      }

      // ---- Customer / destination marker ----
      ${
        customerLocation
          ? `
      window.customerMarker = new google.maps.Marker({
        position:{lat:${customerLocation.latitude},lng:${customerLocation.longitude}},
        map:map,
        icon:window.makeIcon(window.CUSTOMER_SVG,54,70),
        title:'Your Location',
        zIndex:10,
      });`
          : ''
      }

      // ---- Route polyline ----
      ${routeJS}

      // ---- Camera ----
      ${fitBoundsJS}

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

  // Live-update provider pin position without reloading the whole page
  useEffect(() => {
    if (!webViewRef.current || !providerLocation) return;
    webViewRef.current.injectJavaScript(`
      (function(){
        window.updateProviderLocation(${providerLocation.latitude},${providerLocation.longitude});
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

  // Rebuild HTML only when route or customer location changes (rare).
  // Provider position is updated live via injectJavaScript.
  const html = useMemo(
    () => buildMapHTML(providerLocation, customerLocation, routeCoordinates),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      customerLocation?.latitude,
      customerLocation?.longitude,
      routeCoordinates.length,
      // Include provider on first build so the initial pin renders:
      providerLocation?.latitude,
      providerLocation?.longitude,
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
