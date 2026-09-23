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
  /** Tighter header for SP tab screens (hides location row). */
  compact?: boolean;
};

const HomeHeroChrome: React.FC<HomeHeroChromeProps> = ({
  closeDropdowns = false,
  onLogoPress,
  compact = false,
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
      <View style={styles.headerContainer}>
        <View
          style={[
            styles.topRow,
            compact && styles.topRowCompact,
            { paddingTop: Math.max(insets.top, compact ? 4 : 8) },
          ]}
        >
          <TouchableOpacity
            onPress={onLogoPress}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="ServEaso home"
          >
            <Text style={[styles.wordmark, compact && styles.wordmarkCompact]}>ServEaso</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowNotifications(true)}
            style={styles.notifBtn}
            accessibilityLabel="Notifications"
          >
            <MaterialIcon name="notifications-none" size={26} color="#FFFFFF" />
            {inAppUnread > 0 ? (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>
                  {inAppUnread > 99 ? "99+" : inAppUnread}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>

        {!compact ? (
          <View style={styles.locationRow}>
            <LocationSelector
              key={String(resolveCustomerId(appUser) ?? "guest")}
              userPreference={userPreference}
              setUserPreference={setUserPreference}
              onLocationChange={handleLocationChange}
              closeDropdown={closeDropdowns}
              locationPreferencesReady={locationPreferencesReady}
              isUserLoading={isUserLoading}
              variant="chrome"
            />
          </View>
        ) : null}
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
  headerContainer: {
    backgroundColor: 'rgba(0, 191, 255, 0.85)', // Semi-transparent cyan
    paddingBottom: 12,
    backdropFilter: 'blur(10px)', // Glass blur effect
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)', // Subtle border
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'visible', // Allow dropdown to extend beyond header
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
    zIndex: 10,
  },
  topRowCompact: {
    paddingBottom: 4,
  },
  wordmark: {
    color: "#FFFFFF", // White text
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height 1 },
    textShadowRadius: 3,
  },
  wordmarkCompact: {
    fontSize: 22,
    lineHeight: 26,
  },
  locationRow: {
    paddingHorizontal: 16,
    paddingBottom: 0,
    zIndex: 10000, // Higher z-index for dropdown
    overflow: 'visible', // Allow dropdown to overflow
  },
  notifBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    flexShrink: 0,
  },
  unreadBadge: {
    position: "absolute",
    top: 2,
    right: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: "#00BFFF", // Match cyan header background
  },
  unreadBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
  },
});

export default HomeHeroChrome;
