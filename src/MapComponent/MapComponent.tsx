/* eslint-disable */
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import MapView, { Marker, type Region } from "react-native-maps";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import Geolocation from "@react-native-community/geolocation";
import Geocoder from "react-native-geocoding";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useTranslation } from "react-i18next";
import { keys } from "../env";
import { useTheme } from "../Settings/ThemeContext";
import {
  resolveLocationCoords,
} from "../utils/bookingLocation";

export interface SelectedLocation {
  address: any;
  lat: number;
  lng: number;
}

interface MapComponentProps {
  style?: StyleProp<ViewStyle>;
  onLocationSelect: (data: SelectedLocation) => void;
  initialCenter?: { lat: number; lng: number } | null;
  savedLocation?: unknown;
}

const DEFAULT_CENTER = {
  latitude: 12.9716,
  longitude: 77.5946,
};

const MapComponent: React.FC<MapComponentProps> = ({
  style,
  onLocationSelect,
  initialCenter,
  savedLocation,
}) => {
  const { t } = useTranslation();
  const { colors, fontSize } = useTheme();
  const fontSizes = fontSize ?? {
    small: 12,
    text: 14,
    label: 13,
    input: 15,
  };

  const mapRef = useRef<MapView | null>(null);
  const onLocationSelectRef = useRef(onLocationSelect);
  onLocationSelectRef.current = onLocationSelect;

  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(
    null
  );
  const [clickedLocation, setClickedLocation] = useState<{ latitude: number; longitude: number } | null>(
    null
  );
  const [address, setAddress] = useState("");
  const [isGeocoding, setIsGeocoding] = useState(false);

  const resolveSeedCenter = useCallback(() => {
    if (initialCenter) {
      return { latitude: initialCenter.lat, longitude: initialCenter.lng };
    }
    const stored = resolveLocationCoords(savedLocation);
    if (stored) {
      return { latitude: stored.lat, longitude: stored.lng };
    }
    return DEFAULT_CENTER;
  }, [initialCenter, savedLocation]);

  const [mapRegion, setMapRegion] = useState<Region>(() => {
    const seed = resolveSeedCenter();
    return {
      ...seed,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
  });

  useEffect(() => {
    Geocoder.init(keys.api_key);
  }, []);

  useEffect(() => {
    const seed = resolveSeedCenter();
    setMapRegion((prev) => ({
      ...prev,
      latitude: seed.latitude,
      longitude: seed.longitude,
    }));

    const stored = resolveLocationCoords(savedLocation);
    if (stored) {
      setUserLocation({ latitude: stored.lat, longitude: stored.lng });
      return;
    }

    Geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setUserLocation(coords);
      },
      () => {
        setUserLocation(resolveSeedCenter());
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 }
    );
  }, [resolveSeedCenter, savedLocation]);

  const focusMapOn = useCallback((latitude: number, longitude: number) => {
    const nextRegion: Region = {
      latitude,
      longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
    setMapRegion(nextRegion);
    mapRef.current?.animateToRegion(nextRegion, 350);
  }, []);

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setIsGeocoding(true);
    try {
      const res = await Geocoder.from(lat, lng);
      const results = res.results || [];
      if (results.length > 0) {
        const formatted = results[0].formatted_address || "";
        setAddress(formatted);
        onLocationSelectRef.current({
          address: results,
          lat,
          lng,
        });
      } else {
        setAddress(t("locationSelector.addressNotAvailable", { defaultValue: "Address not found" }));
      }
    } catch (error) {
      console.error("Geocode error:", error);
      setAddress(t("locationSelector.addressNotAvailable", { defaultValue: "Address not available" }));
    } finally {
      setIsGeocoding(false);
    }
  }, [t]);

  const selectCoordinates = useCallback(
    (latitude: number, longitude: number) => {
      setClickedLocation({ latitude, longitude });
      focusMapOn(latitude, longitude);
      void reverseGeocode(latitude, longitude);
    },
    [focusMapOn, reverseGeocode]
  );

  const handleMapPress = (event: {
    nativeEvent: { coordinate: { latitude: number; longitude: number } };
  }) => {
    const { coordinate } = event.nativeEvent;
    selectCoordinates(coordinate.latitude, coordinate.longitude);
  };

  const handleGotoUserLocation = () => {
    const storedCoords = resolveLocationCoords(savedLocation);
    if (storedCoords) {
      selectCoordinates(storedCoords.lat, storedCoords.lng);
      return;
    }

    const loc = userLocation ?? resolveSeedCenter();
    selectCoordinates(loc.latitude, loc.longitude);
  };

  const handlePlaceSelect = (
    _data: { description: string },
    details: { geometry?: { location: { lat: number; lng: number } } } | null
  ) => {
    if (!details?.geometry?.location) {
      return;
    }
    const { lat, lng } = details.geometry.location;
    selectCoordinates(lat, lng);
  };

  return (
    <View style={[styles.root, style]}>
      <View style={[styles.toolbar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.searchRow}>
          <View style={styles.autocompleteWrap}>
            <GooglePlacesAutocomplete
              placeholder={t("locationSelector.enterAddressOrPlace", {
                defaultValue: "Search for a place or address",
              })}
              onPress={handlePlaceSelect}
              fetchDetails
              enablePoweredByContainer={false}
              debounce={300}
              minLength={2}
              query={{
                key: keys.api_key,
                language: "en",
              }}
              styles={{
                container: styles.placesContainer,
                textInputContainer: styles.placesInputContainer,
                textInput: [
                  styles.placesTextInput,
                  {
                    color: colors.text,
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    fontSize: fontSizes.input,
                  },
                ],
                listView: [
                  styles.placesList,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ],
                row: { backgroundColor: colors.card },
                description: { color: colors.text, fontSize: fontSizes.text },
              }}
              textInputProps={{
                placeholderTextColor: colors.placeholder,
              }}
            />
          </View>
          <TouchableOpacity
            style={[styles.currentLocationBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
            onPress={handleGotoUserLocation}
          >
            <Icon name="my-location" size={18} color={colors.primary} />
            <Text style={[styles.currentLocationText, { color: colors.text, fontSize: fontSizes.small }]}>
              {t("locationSelector.useCurrentLocation", { defaultValue: "Use my location" })}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.hint, { color: colors.textSecondary, fontSize: fontSizes.small }]}>
          {t("locationSelector.tapOnMapToSelect", {
            defaultValue: "Tap on the map to choose the exact service address",
          })}
        </Text>
      </View>

      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          style={styles.map}
          region={mapRegion}
          onPress={handleMapPress}
          onRegionChangeComplete={setMapRegion}
        >
          {clickedLocation ? <Marker coordinate={clickedLocation} /> : null}
        </MapView>
      </View>

      <View style={[styles.addressPanel, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
        <Text style={[styles.addressLabel, { color: colors.textSecondary, fontSize: fontSizes.small }]}>
          {t("locationSelector.selectedAddress", { defaultValue: "Selected address" })}
        </Text>
        {isGeocoding ? (
          <ActivityIndicator size="small" color={colors.primary} style={styles.addressLoader} />
        ) : (
          <Text style={[styles.addressValue, { color: colors.text, fontSize: fontSizes.text }]}>
            {address || "—"}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    minHeight: 360,
    overflow: "hidden",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  toolbar: {
    borderBottomWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    zIndex: 10,
  },
  searchRow: {
    gap: 8,
  },
  autocompleteWrap: {
    zIndex: 20,
  },
  placesContainer: {
    flex: 0,
  },
  placesInputContainer: {
    backgroundColor: "transparent",
    borderTopWidth: 0,
    borderBottomWidth: 0,
    paddingHorizontal: 0,
  },
  placesTextInput: {
    borderWidth: 1,
    borderRadius: 12,
    height: 44,
    marginTop: 0,
    marginBottom: 0,
    paddingHorizontal: 12,
  },
  placesList: {
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 4,
    elevation: 4,
    zIndex: 30,
  },
  currentLocationBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  currentLocationText: {
    fontWeight: "600",
  },
  hint: {
    lineHeight: 18,
  },
  mapWrap: {
    flex: 1,
    minHeight: 180,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  addressPanel: {
    borderTopWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  addressLabel: {
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  addressLoader: {
    marginTop: 8,
    alignSelf: "flex-start",
  },
  addressValue: {
    marginTop: 6,
    minHeight: 40,
    lineHeight: 20,
  },
});

export default MapComponent;
