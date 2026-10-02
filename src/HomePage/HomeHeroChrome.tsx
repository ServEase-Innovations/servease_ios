import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import LinearGradient from "react-native-linear-gradient";
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

  // Micro-animations
  const logoScale = useRef(new Animated.Value(1)).current;
  const notifScale = useRef(new Animated.Value(1)).current;

  const handleLogoPressIn = () => {
    Animated.spring(logoScale, { toValue: 0.96, useNativeDriver: true, tension: 300 }).start();
  };
  const handleLogoPressOut = () => {
    Animated.spring(logoScale, { toValue: 1, useNativeDriver: true, tension: 300 }).start();
  };

  const handleNotifPressIn = () => {
    Animated.spring(notifScale, { toValue: 0.9, useNativeDriver: true, tension: 300 }).start();
  };
  const handleNotifPressOut = () => {
    Animated.spring(notifScale, { toValue: 1, useNativeDriver: true, tension: 300 }).start();
  };

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
        <LinearGradient 
          colors={["#00BFFF", "#0b5bd3"]} 
          start={{ x: 0, y: 0 }} 
          end={{ x: 1, y: 1 }} 
          style={[StyleSheet.absoluteFillObject, styles.gradientBackground]}
        />
        <View
          style={[
            styles.topRow,
            compact && styles.topRowCompact,
            { paddingTop: Math.max(insets.top, compact ? 6 : 10) },
          ]}
        >
          <TouchableOpacity
            onPress={onLogoPress}
            onPressIn={handleLogoPressIn}
            onPressOut={handleLogoPressOut}
            activeOpacity={1}
            accessibilityRole="button"
            accessibilityLabel="ServEaso home"
          >
            <Animated.View style={{ transform: [{ scale: logoScale }] }}>
              <Text style={[styles.wordmark, compact && styles.wordmarkCompact]}>
                ServEaso
              </Text>
            </Animated.View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowNotifications(true)}
            onPressIn={handleNotifPressIn}
            onPressOut={handleNotifPressOut}
            activeOpacity={1}
            accessibilityLabel="Notifications"
          >
            <Animated.View style={[styles.notifBtn, { transform: [{ scale: notifScale }] }]}>
              <MaterialIcon name="notifications-none" size={26} color="#FFFFFF" />
              {inAppUnread > 0 ? (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>
                    {inAppUnread > 99 ? "99+" : inAppUnread}
                  </Text>
                </View>
              ) : null}
            </Animated.View>
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
    paddingBottom: 20,
    zIndex: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#00bfff",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
    }),
  },
  gradientBackground: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingBottom: 16,
    zIndex: 10,
  },
  topRowCompact: {
    paddingBottom: 10,
  },
  wordmark: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -1,
  },
  wordmarkCompact: {
    fontSize: 26,
    lineHeight: 30,
  },
  locationRow: {
    paddingHorizontal: 20,
    paddingBottom: 6,
    zIndex: 10000,
    overflow: 'visible',
  },
  notifBtn: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    flexShrink: 0,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  unreadBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: "#0b5bd3",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  unreadBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
});

export default HomeHeroChrome;
