/* eslint-disable */
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  ScrollView,
  Platform,
  PermissionsAndroid,
  Alert,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import Icon from "react-native-vector-icons/MaterialIcons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Geolocation from "@react-native-community/geolocation";
import Geocoder from "react-native-geocoding";
import MapView, { Marker } from "react-native-maps";
import { useTranslation } from "react-i18next";
import { keys } from "../env";
import { useAppUser } from "../context/AppUserContext";
import { addLocation } from "../features/geoLocationSlice";
import preferenceInstance from "../services/preferenceInstance";
import { resolveCustomerId } from "../services/couponService";
import {
  extractSavedLocations,
  formatCustomerDisplayName,
  formatCustomerPhone,
  formatSavedLocationAddress,
  formatSavedLocationLabel,
  formatServiceAddressFromGeoLocation,
  hasValidBookingLocation,
  locationsMatch,
  normalizeGeoLocationPayload,
  resolveLocationCoords,
  type SavedLocationEntry,
} from "../utils/bookingLocation";
import { BrandButton } from "../design-system/BrandButton";

Geocoder.init(keys.api_key);

type BookingLocationSectionProps = {
  allowChange?: boolean;
};

function createLocationPayload(lat: number, lng: number, addr: string) {
  return {
    formatted_address: addr,
    geometry: { location: { lat, lng } },
    address: [{ formatted_address: addr, geometry: { location: { lat, lng } } }],
    lat,
    lng,
  };
}

const BookingLocationSection: React.FC<BookingLocationSectionProps> = ({
  allowChange = true,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { appUser } = useAppUser();
  const geoLocation = useSelector(
    (state: { geoLocation?: { value?: unknown } }) => state?.geoLocation?.value
  );

  const [changeOpen, setChangeOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [savedLocations, setSavedLocations] = useState<SavedLocationEntry[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [pinCoords, setPinCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [pinAddress, setPinAddress] = useState("");
  const [resolvingPin, setResolvingPin] = useState(false);

  const customerName = formatCustomerDisplayName(appUser);
  const customerPhone = formatCustomerPhone(appUser);
  const serviceAddress = formatServiceAddressFromGeoLocation(geoLocation);
  const hasLocation = hasValidBookingLocation(geoLocation);
  const existingCoords = resolveLocationCoords(geoLocation);

  const applyLocation = useCallback(
    (raw: Record<string, unknown>) => {
      const normalized = normalizeGeoLocationPayload(raw) ?? raw;
      dispatch(addLocation(normalized));
      setChangeOpen(false);
      setMapOpen(false);
      setPinCoords(null);
      setPinAddress("");
    },
    [dispatch]
  );

  const loadSavedLocations = useCallback(async () => {
    const customerId = resolveCustomerId(appUser);
    if (!customerId) {
      setSavedLocations([]);
      return;
    }
    setLoadingSaved(true);
    try {
      const response = await preferenceInstance.get(`/api/user-settings/${customerId}`);
      setSavedLocations(extractSavedLocations(response.data));
    } catch {
      setSavedLocations([]);
    } finally {
      setLoadingSaved(false);
    }
  }, [appUser]);

  useEffect(() => {
    if (changeOpen) {
      void loadSavedLocations();
    }
  }, [changeOpen, loadSavedLocations]);

  const requestLocationPermission = async (): Promise<boolean> => {
    if (Platform.OS !== "android") return true;
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: t("common.permissionRequired"),
        message: t("locationSelector.locationPermissionMessage"),
        buttonNeutral: t("common.askMeLater"),
        buttonNegative: t("common.cancel"),
        buttonPositive: t("common.ok"),
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  };

  const handleDetectLocation = async () => {
    const permitted = await requestLocationPermission();
    if (!permitted) return;

    setDetecting(true);
    Geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await Geocoder.from(latitude, longitude);
          const addr =
            res.results?.[0]?.formatted_address ||
            `Map location (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`;
          applyLocation(createLocationPayload(latitude, longitude, addr));
        } catch {
          applyLocation(
            createLocationPayload(
              position.coords.latitude,
              position.coords.longitude,
              `Map location (${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)})`
            )
          );
        } finally {
          setDetecting(false);
        }
      },
      () => {
        setDetecting(false);
        Alert.alert(t("common.error"), t("locationSelector.unableToFetchLocation"));
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 }
    );
  };

  const handleSelectSaved = (saved: SavedLocationEntry) => {
    if (saved?.location) {
      applyLocation(saved.location as Record<string, unknown>);
    }
  };

  const handleMapPress = async (event: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) => {
    const { coordinate } = event.nativeEvent;
    setPinCoords(coordinate);
    setResolvingPin(true);
    try {
      const res = await Geocoder.from(coordinate.latitude, coordinate.longitude);
      const addr =
        res.results?.[0]?.formatted_address ||
        `Map location (${coordinate.latitude.toFixed(5)}, ${coordinate.longitude.toFixed(5)})`;
      setPinAddress(addr);
    } catch {
      setPinAddress(t("locationSelector.addressNotAvailable"));
    } finally {
      setResolvingPin(false);
    }
  };

  const handleConfirmMap = () => {
    if (!pinCoords) return;
    const addr =
      pinAddress ||
      `Map location (${pinCoords.latitude.toFixed(5)}, ${pinCoords.longitude.toFixed(5)})`;
    applyLocation(createLocationPayload(pinCoords.latitude, pinCoords.longitude, addr));
  };

  const labelForSaved = (name: string) => formatSavedLocationLabel(name, t);

  const mapRegion = {
    latitude: pinCoords?.latitude ?? existingCoords?.lat ?? 12.9716,
    longitude: pinCoords?.longitude ?? existingCoords?.lng ?? 77.5946,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };

  return (
    <>
      <View
        style={[
          styles.card,
          hasLocation ? styles.cardValid : styles.cardMissing,
        ]}
      >
        <View style={styles.cardRow}>
          <View style={styles.cardMain}>
            <View style={[styles.iconWrap, hasLocation ? styles.iconValid : styles.iconMissing]}>
              <Icon name="place" size={20} color={hasLocation ? "#15803d" : "#b91c1c"} />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.sectionLabel}>
                {t("bookingLocation.title", { defaultValue: "Service location" })}
              </Text>
              {customerName ? (
                <Text style={styles.customerName}>{customerName}</Text>
              ) : null}
              {customerPhone ? (
                <Text style={styles.customerPhone}>
                  {t("mobileDialog.contactNumber", { defaultValue: "Contact Number" })}: {customerPhone}
                </Text>
              ) : null}
              <Text style={[styles.addressText, hasLocation ? styles.addressValid : styles.addressMissing]}>
                {hasLocation
                  ? serviceAddress
                  : t("bookingLocation.missing", {
                      defaultValue: "Select a service location before checkout",
                    })}
              </Text>
            </View>
          </View>
          {allowChange ? (
            <TouchableOpacity
              style={styles.changeBtn}
              onPress={() => setChangeOpen(true)}
            >
              <Text style={styles.changeBtnText}>
                {t("bookingLocation.changeAddress", { defaultValue: "Change" })}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <Modal
        visible={changeOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setChangeOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t("bookingLocation.changeTitle", { defaultValue: "Change service address" })}
              </Text>
              <TouchableOpacity onPress={() => setChangeOpen(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Icon name="close" size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalHint}>
                {t("bookingLocation.changeHint", {
                  defaultValue: "Choose where the service provider should visit.",
                })}
              </Text>

              <View style={styles.actionGrid}>
                <TouchableOpacity
                  style={styles.actionTile}
                  onPress={() => void handleDetectLocation()}
                  disabled={detecting}
                >
                  <View style={[styles.actionIcon, { backgroundColor: "#e0f2fe" }]}>
                    {detecting ? (
                      <ActivityIndicator size="small" color="#0369a1" />
                    ) : (
                      <MaterialCommunityIcons name="crosshairs-gps" size={20} color="#0369a1" />
                    )}
                  </View>
                  <Text style={styles.actionTitle}>{t("locationSelector.detectLocation")}</Text>
                  <Text style={styles.actionSub}>
                    {t("locationSelector.useYourCurrentLocation")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionTile}
                  onPress={() => {
                    setPinCoords(
                      existingCoords
                        ? { latitude: existingCoords.lat, longitude: existingCoords.lng }
                        : null
                    );
                    setPinAddress(serviceAddress);
                    setMapOpen(true);
                  }}
                >
                  <View style={[styles.actionIcon, { backgroundColor: "#ede9fe" }]}>
                    <MaterialCommunityIcons name="map-marker-radius" size={20} color="#6d28d9" />
                  </View>
                  <Text style={styles.actionTitle}>
                    {t("bookingLocation.pickOnMap", { defaultValue: "Pick on map" })}
                  </Text>
                  <Text style={styles.actionSub}>
                    {t("locationSelector.searchOrTapOnMap")}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.savedHeading}>
                {t("bookingLocation.savedAddresses", { defaultValue: "Saved addresses" })}
              </Text>

              {loadingSaved ? (
                <ActivityIndicator size="small" color="#0b5bd3" style={{ marginVertical: 16 }} />
              ) : savedLocations.length === 0 ? (
                <View style={styles.emptySaved}>
                  <Text style={styles.emptySavedText}>
                    {t("bookingLocation.noSaved", {
                      defaultValue: "No saved addresses yet. Detect location or pick on the map.",
                    })}
                  </Text>
                </View>
              ) : (
                savedLocations.map((saved) => {
                  const isSelected = locationsMatch(geoLocation, saved.location);
                  const SavedIcon =
                    saved.name?.toLowerCase() === "home"
                      ? "home"
                      : saved.name?.toLowerCase() === "office"
                        ? "business"
                        : "place";
                  return (
                    <TouchableOpacity
                      key={`${saved.name}-${formatSavedLocationAddress(saved)}`}
                      style={[styles.savedRow, isSelected && styles.savedRowSelected]}
                      onPress={() => handleSelectSaved(saved)}
                    >
                      <View style={[styles.savedIconWrap, isSelected && styles.savedIconSelected]}>
                        <Icon name={SavedIcon} size={18} color={isSelected ? "#15803d" : "#64748b"} />
                      </View>
                      <View style={styles.savedTextCol}>
                        <Text style={styles.savedLabel}>{labelForSaved(saved.name)}</Text>
                        <Text style={styles.savedAddress} numberOfLines={2}>
                          {formatSavedLocationAddress(saved)}
                        </Text>
                      </View>
                      {isSelected ? (
                        <Icon name="check-circle" size={18} color="#15803d" />
                      ) : null}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <BrandButton variant="ghost" onPress={() => setChangeOpen(false)}>
                {t("common.cancel")}
              </BrandButton>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={mapOpen}
        animationType="slide"
        onRequestClose={() => setMapOpen(false)}
      >
        <View style={styles.mapModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {t("bookingLocation.pickOnMap", { defaultValue: "Pick on map" })}
            </Text>
            <TouchableOpacity onPress={() => setMapOpen(false)}>
              <Icon name="close" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
          <MapView
            style={styles.map}
            region={mapRegion}
            onPress={handleMapPress}
          >
            {pinCoords ? <Marker coordinate={pinCoords} /> : null}
          </MapView>
          <View style={styles.mapFooter}>
            {resolvingPin ? (
              <ActivityIndicator size="small" color="#0b5bd3" />
            ) : (
              <Text style={styles.pinAddress} numberOfLines={2}>
                {pinAddress || t("locationSelector.tapOnMapToSelect")}
              </Text>
            )}
            <View style={styles.mapActions}>
              <BrandButton variant="ghost" onPress={() => setMapOpen(false)}>
                {t("common.cancel")}
              </BrandButton>
              <BrandButton onPress={handleConfirmMap} disabled={!pinCoords}>
                {t("bookingLocation.useAddress", { defaultValue: "Use this address" })}
              </BrandButton>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  cardValid: {
    borderColor: "#bbf7d0",
    backgroundColor: "#f0fdf4",
  },
  cardMissing: {
    borderColor: "#fecaca",
    backgroundColor: "#fef2f2",
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  cardMain: {
    flexDirection: "row",
    flex: 1,
    gap: 10,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  iconValid: { backgroundColor: "#dcfce7" },
  iconMissing: { backgroundColor: "#fee2e2" },
  cardText: { flex: 1, minWidth: 0 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "#64748b",
    marginBottom: 6,
  },
  customerName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
  },
  customerPhone: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  addressText: {
    fontSize: 13,
    marginTop: 6,
    lineHeight: 18,
  },
  addressValid: { color: "#14532d" },
  addressMissing: { color: "#991b1b" },
  changeBtn: {
    borderWidth: 1,
    borderColor: "#059669",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  changeBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#047857",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "88%",
  },
  modalHeader: {
    backgroundColor: "#0b5bd3",
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    flex: 1,
    paddingRight: 12,
  },
  modalBody: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  modalHint: {
    fontSize: 13,
    color: "#64748b",
    lineHeight: 18,
    marginBottom: 14,
  },
  actionGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
  },
  actionTile: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#fff",
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0f172a",
  },
  actionSub: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 4,
    lineHeight: 15,
  },
  savedHeading: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "#94a3b8",
    marginBottom: 10,
  },
  emptySaved: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#cbd5e1",
    borderRadius: 10,
    padding: 16,
    backgroundColor: "#f8fafc",
    marginBottom: 12,
  },
  emptySavedText: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 18,
  },
  savedRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    backgroundColor: "#fff",
  },
  savedRowSelected: {
    borderColor: "#6ee7b7",
    backgroundColor: "#ecfdf5",
  },
  savedIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  savedIconSelected: {
    backgroundColor: "#d1fae5",
  },
  savedTextCol: { flex: 1 },
  savedLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0f172a",
  },
  savedAddress: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
    lineHeight: 16,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  mapModal: { flex: 1, backgroundColor: "#fff" },
  map: { flex: 1 },
  mapFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    gap: 12,
  },
  pinAddress: {
    fontSize: 13,
    color: "#14532d",
    lineHeight: 18,
  },
  mapActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
});

export default BookingLocationSection;
