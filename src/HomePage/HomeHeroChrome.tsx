import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import { useDispatch } from "react-redux";
import { add } from "../features/userSlice";
import { addLocation } from "../features/geoLocationSlice";
import LocationSelector from "../Header/LocationSelector";
import NotificationsDialog from "../Notifications/NotificationsPage";
import PaymentInstance from "../services/paymentInstance";
import { recipientParams } from "../Notifications/inAppNotificationUtils";
import preferenceInstance from "../services/preferenceInstance";
import { resolveCustomerId } from "../services/couponService";
import { useAppUser } from "../context/AppUserContext";
import { HOME_M3 } from "../theme/brandColors";

interface LocationData {
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

type HomeHeroChromeProps = {
  closeDropdowns?: boolean;
  onLogoPress?: () => void;
};

const HomeHeroChrome: React.FC<HomeHeroChromeProps> = ({
  closeDropdowns = false,
  onLogoPress,
}) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const { appUser, isLoading: isUserLoading } = useAppUser();
  const [userPreference, setUserPreference] = useState<any>([]);
  const [locationPreferencesReady, setLocationPreferencesReady] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [inAppUnread, setInAppUnread] = useState(0);
  const loadedPreferencesForRef = useRef<number | null>(null);

  const handleLocationChange = (_location: string, locationData?: LocationData) => {
    if (locationData) {
      dispatch(addLocation(locationData));
      dispatch(
        add({
          type: "LOCATION_UPDATE",
          payload: locationData,
        })
      );
    }
  };

  const refreshInAppUnread = useCallback(async () => {
    const r = recipientParams(appUser);
    if (!r) {
      setInAppUnread(0);
      return;
    }
    try {
      const { data } = await PaymentInstance.get("/api/in-app-notifications/unread-count", {
        params: {
          recipientType: r.recipientType,
          recipientId: r.recipientId,
        },
      });
      if (data?.count != null) setInAppUnread(Number(data.count));
    } catch {
      /* non-blocking */
    }
  }, [appUser]);

  useEffect(() => {
    void refreshInAppUnread();
    const interval = setInterval(() => void refreshInAppUnread(), 30000);
    return () => clearInterval(interval);
  }, [refreshInAppUnread]);

  useEffect(() => {
    const customerId = resolveCustomerId(appUser);
    if (!customerId) {
      setLocationPreferencesReady(true);
      return;
    }
    const id = Number(customerId);
    if (!Number.isFinite(id)) {
      setLocationPreferencesReady(true);
      return;
    }
    if (loadedPreferencesForRef.current === id) {
      setLocationPreferencesReady(true);
      return;
    }
    setLocationPreferencesReady(false);
    (async () => {
      try {
        const response = await preferenceInstance.get(`/api/user-settings/${id}`);
        if (response.status === 200) {
          loadedPreferencesForRef.current = id;
          setUserPreference(response.data);
        }
      } catch (error: any) {
        if (error.response?.status === 404) {
          try {
            await preferenceInstance.post("/api/user-settings", {
              customerId: id,
              savedLocations: [],
            });
            loadedPreferencesForRef.current = id;
          } catch {
            /* ignore */
          }
        }
      } finally {
        setLocationPreferencesReady(true);
      }
    })();
  }, [appUser]);

  return (
    <>
      <View style={[styles.topRow, { paddingTop: Math.max(insets.top, 8) }]}>
        <TouchableOpacity
          onPress={onLogoPress}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Serveaso home"
        >
          <Text style={styles.wordmark}>SERVEASO</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setShowNotifications(true)}
          style={styles.notifBtn}
          accessibilityLabel="Notifications"
        >
          <MaterialIcon name="notifications-none" size={24} color={HOME_M3.onPrimary} />
          {inAppUnread > 0 ? (
            <View style={styles.unreadDot} />
          ) : null}
        </TouchableOpacity>
      </View>

      <View style={styles.locationRow}>
        <LocationSelector
          key={String(resolveCustomerId(appUser) ?? "guest")}
          userPreference={userPreference}
          setUserPreference={setUserPreference}
          onLocationChange={handleLocationChange}
          closeDropdown={closeDropdowns}
          locationPreferencesReady={locationPreferencesReady}
          isUserLoading={isUserLoading}
          variant="hero"
        />
      </View>

      <NotificationsDialog
        visible={showNotifications}
        onClose={() => {
          setShowNotifications(false);
          void refreshInAppUnread();
        }}
        onUnreadCountChange={setInAppUnread}
      />
    </>
  );
};

const styles = StyleSheet.create({
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  wordmark: {
    color: HOME_M3.onPrimary,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  notifBtn: {
    padding: 8,
    position: "relative",
  },
  unreadDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: HOME_M3.error,
    borderWidth: 2,
    borderColor: HOME_M3.primary,
  },
  locationRow: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    zIndex: 20,
  },
});

export default HomeHeroChrome;
