// Head.tsx - UPDATED: Pass closeDropdowns to LocationSelector
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  Dimensions,
  Platform,
  Pressable,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import FeatherIcon from "react-native-vector-icons/Feather";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import { useSelector, useDispatch } from "react-redux";
import { add, remove } from "../features/userSlice";
import { clearCustomer } from "../features/customerSlice";
import { clearMobileAuthStorage, tryClearAuth0Session } from "../utils/signOutSession";
import {
  ADMIN,
  BOOKINGS,
  DASHBOARD,
  DETAILS,
  LOGIN,
  PROFILE,
  AGENT_DASHBOARD,
} from "../Constants/pagesConstants";
import { useAuth0 } from "react-native-auth0";
import LinearGradient from "react-native-linear-gradient";
import TnC from "../TermsAndConditions/TnC";
import AboutPage from "../AboutUs/AboutPage";
import ContactUs from "../ContactUs/ContactUs";
import LocationSelector from "../Header/LocationSelector";
import axios from "axios";
import preferenceInstance from "../services/preferenceInstance";
import { logAuth0Error, runAuth0Authorize } from "../utils/auth0Config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Snackbar from "react-native-snackbar";
import { useAppUser } from "../context/AppUserContext";
import { resolveCustomerId } from "../services/couponService";
import NotificationsDialog from "../Notifications/NotificationsPage";
import PaymentInstance from "../services/paymentInstance";
import { recipientParams } from "../Notifications/inAppNotificationUtils";
import { addLocation, remove as clearGeoLocation } from "../features/geoLocationSlice";
import Booking from "../UserProfile/Bookings";
import { useTheme } from "../../src/Settings/ThemeContext";

interface ChildComponentProps {
  sendDataToParent: (data: string) => void;
  bookingType: string;
  onAboutClick: () => void;
  onContactClick: () => void;
  onLogoClick: () => void;
  closeDropdowns?: boolean; // Add this prop
  onSignOutComplete?: () => Promise<void>;
}

interface LocationData {
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

const { width } = Dimensions.get("window");
const isMobile = width < 768;
export const HEADER_BAR_HEIGHT = 66;
/** Trimmed wordmark asset (383×121) — no transparent canvas padding. */
const LOGO_ASPECT = 383 / 121;
const HEADER_CONTROL_HEIGHT = 36;
const HEADER_CONTROL_TOP_INSET = 6;
const LOGO_HEIGHT = HEADER_CONTROL_HEIGHT;
const LOGO_WIDTH = Math.round(LOGO_HEIGHT * LOGO_ASPECT);

const Head: React.FC<ChildComponentProps> = ({ 
  sendDataToParent, 
  bookingType,
  onAboutClick,
  onContactClick,
  onLogoClick,
  closeDropdowns = false,
  onSignOutComplete,
}) => {
  const { colors, fontSize, isDarkMode } = useTheme();
  const chromeGradient = [colors.chromeStart, colors.chromeMid, colors.chromeEnd];
  const {
    authorize,
    clearSession,
    cancelWebAuth,
    user: auth0User,
    getCredentials,
    isLoading: auth0Loading,
  } = useAuth0();

  const dispatch = useDispatch();
  const { setAppUser, clearAppUser, appUser, isLoading: isUserLoading } = useAppUser();
  const dropdownRef = useRef<View>(null);
  const loadedPreferencesForRef = useRef<number | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState("");
  const [userPreference, setUserPreference] = useState<any>([]);
  const [showTnC, setShowTnC] = useState(false);
  const [showAboutUs, setShowAboutUs] = useState(false);
  const [showContactUs, setShowContactUs] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [inAppUnread, setInAppUnread] = useState(0);
  const [showBookings, setShowBookings] = useState(false);
  const [selectedService, setSelectedService] = useState("");
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [locationPreferencesReady, setLocationPreferencesReady] = useState(false);

  const getFontSizes = () => {
    switch (fontSize) {
      case 'small':
        return {
          alertsButtonText: 9,
          modalTitle: 16,
        };
      case 'large':
        return {
          alertsButtonText: 12,
          modalTitle: 20,
        };
      default:
        return {
          alertsButtonText: 10,
          modalTitle: 18,
        };
    }
  };

  const fontSizes = getFontSizes();

  // Close any internal dropdowns when closeDropdowns prop changes
  useEffect(() => {
    if (closeDropdowns) {
      setMenuVisible(false);
    }
  }, [closeDropdowns]);

  const showErrorSnackbar = (message: string) => {
    Snackbar.show({
      text: message,
      duration: Snackbar.LENGTH_LONG,
      backgroundColor: colors.error,
      textColor: "#ffffff",
    });
  };

  const showInfoSnackbar = (message: string) => {
    Snackbar.show({
      text: message,
      duration: Snackbar.LENGTH_SHORT,
      backgroundColor: colors.info,
      textColor: "#ffffff",
    });
  };

  const getCurrentLocationData = (): { latitude: number; longitude: number } | null => {
    if (!currentLocation) return null;
    
    return {
      latitude: currentLocation.geometry.location.lat,
      longitude: currentLocation.geometry.location.lng
    };
  };

  const handleLocationChange = (location: string, locationData?: LocationData) => {
    console.log("Location changed to:", location);
    console.log("Location data:", locationData);
    dispatch(addLocation(locationData))
    
    if (locationData) {
      setCurrentLocation(locationData);
      
      dispatch(add({ 
        type: 'LOCATION_UPDATE', 
        payload: locationData 
      }));
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

  const handleNotificationClick = () => {
    setMenuVisible(false);
    setShowNotifications(true);
  };

  const handleCloseNotifications = () => {
    setShowNotifications(false);
    void refreshInAppUnread();
  };

  const handleCloseBookings = () => {
    setShowBookings(false);
  };

  const handleBookingsClick = () => {
    setMenuVisible(false);
    setShowBookings(true);
  };

  const handleContactUsClick = () => {
    setMenuVisible(false);
    onContactClick();
  };

  const handleAboutUsClick = () => {
    setMenuVisible(false);
    onAboutClick();
  };

  const handleTnCClick = () => {
    setMenuVisible(false);
    setShowTnC(true);
  };

  const handleServiceClick = (service: string) => {
    let serviceType = "";
    if (service === "Home Cook") serviceType = "COOK";
    if (service === "Cleaning Help") serviceType = "MAID";
    if (service === "Caregiver") serviceType = "NANNY";

    console.log(`Service selected: ${service}, Type: ${serviceType}`);
  };

  const getCustomerPreferences = async (customerId: number) => {
    if (loadedPreferencesForRef.current === customerId) {
      setLocationPreferencesReady(true);
      return;
    }
    setLocationPreferencesReady(false);
    try {
      const response = await preferenceInstance.get(
        `/api/user-settings/${customerId}`
      );
      console.log("Response from user settings API:", response.data);

      if (response.status === 200) {
        console.log("Customer preferences fetched successfully:", response.data);
        loadedPreferencesForRef.current = customerId;
        setUserPreference(response.data);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        await createUserPreferences(customerId);
        loadedPreferencesForRef.current = customerId;
      } else {
        console.error("Unexpected error fetching user settings:", error);
        showErrorSnackbar("Failed to load user preferences");
      }
    } finally {
      setLocationPreferencesReady(true);
    }
  };

  const createUserPreferences = async (customerId: number) => {
    try {
      const payload: any = {
        customerId,
        savedLocations: [],
      };

      console.log("Creating user preferences with payload:", payload);

      const response = await preferenceInstance.post(
        "/api/user-settings",
        payload
      );

      if (response.status === 200 || response.status === 201) {
        setUserPreference([{ customerId, savedLocations: [] }]);
      } else {
        console.warn("Unexpected response:", response);
        showErrorSnackbar("Failed to create user preferences");
      }
    } catch (error) {
      console.error("Error saving user settings:", error);
      showErrorSnackbar("Failed to save user settings");
    }
  };

  useEffect(() => {
    if (auth0Loading) {
      return;
    }

    const customerId = resolveCustomerId(appUser);
    const role = String(appUser?.role || "").toUpperCase();
    if (role !== "CUSTOMER" || !customerId || !appUser?.token) {
      setLocationPreferencesReady(true);
      return;
    }

    const idNum = Number(customerId);
    if (loadedPreferencesForRef.current === idNum) {
      setLocationPreferencesReady(true);
      return;
    }

    void getCustomerPreferences(idNum);
  }, [appUser, auth0Loading]);

  const handleClick = (e: string) => {
    setCurrentPage(e);
    if (e === "sign_out") {
      dispatch(remove());
      sendDataToParent("");
    } else if (e === "ABOUT") {
      onAboutClick();
    } else if (e === "CONTACT") {
      onContactClick();
    } else if (e === "") {
      onLogoClick();
    } else {
      sendDataToParent(e);
    }
  };

  const resetHeaderLocationSession = useCallback(() => {
    setUserPreference([]);
    loadedPreferencesForRef.current = null;
    setLocationPreferencesReady(false);
    setCurrentLocation(null);
    dispatch(clearGeoLocation());
  }, [dispatch]);

  const handleSignOut = async () => {
    try {
      resetHeaderLocationSession();
      await clearMobileAuthStorage();
      await clearAppUser();
      await tryClearAuth0Session(clearSession);

      dispatch(remove());
      dispatch(clearCustomer());

      setMenuVisible(false);

      if (onSignOutComplete) {
        await onSignOutComplete();
      } else {
        handleClick("sign_out");
      }

      showInfoSnackbar("Signed out successfully");
    } catch (e) {
      console.log("Log out error:", e);
      showErrorSnackbar("Failed to sign out");
    }
  };

  const handleLoginClick = async () => {
    setMenuVisible(false);
    try {
      await runAuth0Authorize(authorize, cancelWebAuth);
      await getCredentials();
    } catch (e) {
      logAuth0Error("login failed", e);
      showErrorSnackbar("Login failed. Please try again.");
    }
  };

  const handleBookingHistoryClick = () => {
    setMenuVisible(false);
    handleClick(BOOKINGS);
  };

  const handleProfileClick = () => {
    setMenuVisible(false);
    handleClick(PROFILE);
  };

  const handleDashboardClick = () => {
    setMenuVisible(false);
    handleClick(DASHBOARD);
  };

  const handleAgentDashboardClick = () => {
    setMenuVisible(false);
    handleClick(AGENT_DASHBOARD);
  };

  const handleMenuPress = () => {
    setMenuVisible(!menuVisible);
  };

  const handleOverlayPress = () => {
    setMenuVisible(false);
  };

  const getLocationData = () => currentLocation;

  const dynamicStyles = StyleSheet.create({
    headerShell: {
      width: "100%",
      height: HEADER_BAR_HEIGHT,
      zIndex: 50,
      overflow: "visible",
    },
    headerGradient: {
      ...StyleSheet.absoluteFillObject,
    },
    headerRow: {
      height: HEADER_BAR_HEIGHT,
      flexDirection: "row",
      alignItems: "center",
      paddingLeft: 5,
      paddingRight: 10,
      overflow: "visible",
    },
    alertsButton: {
      flexShrink: 0,
      justifyContent: "center",
      alignItems: "center",
      alignSelf: "center",
      width: HEADER_CONTROL_HEIGHT,
      height: HEADER_CONTROL_HEIGHT,
      marginLeft: 4,
      marginTop: HEADER_CONTROL_TOP_INSET,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
      paddingTop: Platform.OS === 'ios' ? 40 : 16,
    },
    modalTitle: {
      fontSize: fontSizes.modalTitle,
      fontWeight: '700',
      color: '#fff',
      textAlign: 'center',
      flex: 1,
    },
  });

  return (
    <>
      <View style={dynamicStyles.headerShell}>
        <LinearGradient
          colors={chromeGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={dynamicStyles.headerGradient}
        />
        <View style={dynamicStyles.headerRow}>
          <View style={styles.logoContainer}>
            <TouchableOpacity onPress={onLogoClick} activeOpacity={0.85}>
              <Image
                source={require("../../assets/images/ServEaso_Logo_header.png")}
                style={styles.logo}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.locationContainer}>
            <LocationSelector
              key={String(resolveCustomerId(appUser) ?? "guest")}
              userPreference={userPreference}
              setUserPreference={setUserPreference}
              onLocationChange={handleLocationChange}
              closeDropdown={closeDropdowns}
              locationPreferencesReady={locationPreferencesReady}
              isUserLoading={isUserLoading}
            />
          </View>

          <TouchableOpacity
            onPress={handleNotificationClick}
            style={dynamicStyles.alertsButton}
            accessibilityLabel="Notifications"
          >
            <View style={styles.alertsButtonInner}>
              <MaterialIcon name="notifications-none" size={24} color="#fff" />
              {inAppUnread > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>
                    {inAppUnread > 99 ? "99+" : inAppUnread}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Notifications Dialog */}
      <NotificationsDialog
        visible={showNotifications}
        onClose={handleCloseNotifications}
        onUnreadCountChange={setInAppUnread}
      />

      {/* Bookings Dialog */}
      <Modal
        visible={showBookings}
        animationType="slide"
        onRequestClose={handleCloseBookings}
      >
        <View style={dynamicStyles.modalContainer}>
          <LinearGradient
            colors={chromeGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={dynamicStyles.modalHeader}
          >
            <Text style={dynamicStyles.modalTitle}>My Bookings</Text>
            <TouchableOpacity onPress={handleCloseBookings}>
              <Icon name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>
          <Booking />
        </View>
      </Modal>

      {/* Terms and Conditions Modal */}
      <Modal
        visible={showTnC}
        animationType="slide"
        onRequestClose={() => setShowTnC(false)}
      >
        <View style={dynamicStyles.modalContainer}>
          <LinearGradient
            colors={chromeGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={dynamicStyles.modalHeader}
          >
            <Text style={dynamicStyles.modalTitle}>Terms and Conditions</Text>
            <TouchableOpacity onPress={() => setShowTnC(false)}>
              <Icon name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>
          <TnC />
        </View>
      </Modal>

      {/* About Page */}
      {showAboutUs ? (
        <AboutPage visible={showAboutUs} onBack={() => setShowAboutUs(false)} />
      ) : null}

      {/* Contact Us Modal */}
      <Modal
        visible={showContactUs}
        animationType="slide"
        onRequestClose={() => setShowContactUs(false)}
      >
        <View style={dynamicStyles.modalContainer}>
          <LinearGradient
            colors={chromeGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={dynamicStyles.modalHeader}
          >
            <Text style={dynamicStyles.modalTitle}>Contact Us</Text>
            <TouchableOpacity onPress={() => setShowContactUs(false)}>
              <Icon name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>
          <ContactUs />
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  logoContainer: {
    flexShrink: 0,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "flex-start",
    marginRight: 8,
  },
  logo: {
    width: LOGO_WIDTH,
    height: LOGO_HEIGHT,
    resizeMode: "contain",
  },
  locationContainer: {
    flex: 1,
    minWidth: 0,
    alignSelf: "center",
    justifyContent: "center",
    marginTop: HEADER_CONTROL_TOP_INSET,
    zIndex: 200,
    overflow: "visible",
  },
  alertsButtonInner: {
    alignItems: "center",
    justifyContent: "center",
    width: HEADER_CONTROL_HEIGHT,
    height: HEADER_CONTROL_HEIGHT,
    position: "relative",
  },
  unreadBadge: {
    position: "absolute",
    top: 0,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  unreadBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
  },
});

export default Head;
export type { LocationData };