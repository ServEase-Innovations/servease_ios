// Head.tsx - UPDATED: With closeDropdowns prop
import React, { useState, useEffect, useRef } from "react";
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
import {
  ADMIN,
  BOOKINGS,
  DASHBOARD,
  DETAILS,
  LOGIN,
  PROFILE,
} from "../Constants/pagesConstants";
import { useAuth0 } from "react-native-auth0";
import LinearGradient from "react-native-linear-gradient";
import WalletDialog from "../UserProfile/WalletDialog";
import TnC from "../TermsAndConditions/TnC";
import AboutPage from "../AboutUs/AboutPage";
import ContactUs from "../ContactUs/ContactUs";
import LocationSelector from "../Header/LocationSelector";
import axios from "axios";
import Snackbar from "react-native-snackbar";
import { useAppUser } from "../context/AppUserContext";
import NotificationsDialog from "../Notifications/NotificationsPage";
import { addLocation } from "../features/geoLocationSlice";
import Booking from "../UserProfile/Bookings";

interface ChildComponentProps {
  sendDataToParent: (data: string) => void;
  bookingType: string;
  onAboutClick: () => void;
  onContactClick: () => void;
  onLogoClick: () => void;
  closeDropdowns?: boolean; // CHANGED: Prop to trigger dropdown closing (boolean instead of number)
}

// Location data interface
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

const Head: React.FC<ChildComponentProps> = ({ 
  sendDataToParent, 
  bookingType,
  onAboutClick,
  onContactClick,
  onLogoClick,
  closeDropdowns = false // CHANGED: Default value changed to false
}) => {
  const {
    authorize,
    clearSession,
    user: auth0User,
    getCredentials,
    isLoading: auth0Loading,
  } = useAuth0();

  const dispatch = useDispatch();
  const dropdownRef = useRef<View>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState("");
  const [userPreference, setUserPreference] = useState<any>([]);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [showTnC, setShowTnC] = useState(false);
  const [showAboutUs, setShowAboutUs] = useState(false);
  const [showContactUs, setShowContactUs] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showBookings, setShowBookings] = useState(false);
  const [selectedService, setSelectedService] = useState("");
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);

  // NEW: Close dropdowns when parent triggers it
  useEffect(() => {
    if (closeDropdowns) {
      setMenuVisible(false);
      // Note: We can't directly control LocationSelector's dropdown
      // It should handle its own closing on outside clicks
    }
  }, [closeDropdowns]);

  // Snackbar helper functions
  const showSuccessSnackbar = (message: string) => {
    Snackbar.show({
      text: message,
      duration: Snackbar.LENGTH_SHORT,
      backgroundColor: "#10b981",
      textColor: "#ffffff",
    });
  };

  const showErrorSnackbar = (message: string) => {
    Snackbar.show({
      text: message,
      duration: Snackbar.LENGTH_LONG,
      backgroundColor: "#ef4444",
      textColor: "#ffffff",
    });
  };

  const showInfoSnackbar = (message: string) => {
    Snackbar.show({
      text: message,
      duration: Snackbar.LENGTH_SHORT,
      backgroundColor: "#3b82f6",
      textColor: "#ffffff",
    });
  };

  // Function to get current location data for booking service
  const getCurrentLocationData = (): { latitude: number; longitude: number } | null => {
    if (!currentLocation) return null;
    
    return {
      latitude: currentLocation.geometry.location.lat,
      longitude: currentLocation.geometry.location.lng
    };
  };

  // Updated location change handler
  const handleLocationChange = (location: string, locationData?: LocationData) => {
    console.log("Location changed to:", location);
    console.log("Location data:", locationData);
    dispatch(addLocation(locationData))
    
    if (locationData) {
      setCurrentLocation(locationData);
      
      // Store in Redux for backward compatibility
      dispatch(add({ 
        type: 'LOCATION_UPDATE', 
        payload: locationData 
      }));
    }
  };

  const handleNotificationClick = () => {
    setMenuVisible(false);
    setShowNotifications(true);
  };

  const handleCloseNotifications = () => {
    setShowNotifications(false);
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
    // You can trigger navigation or state update based on service selection
  };

  const { setAppUser, appUser } = useAppUser();

  useEffect(() => {
    const run = async () => {
      if (!auth0User || auth0Loading || !auth0User?.email) {
        console.log("Auth0 user not available yet");
        return;
      }

      try {
        const token = await getCredentials();
        console.log("Access Token:", token?.accessToken);
        console.log("User authenticated:", auth0User);

        const email = auth0User.email ?? "";

        const response = await axios.get(
          `https://utils-ndt3.onrender.com/customer/check-email?email=${encodeURIComponent(
            email
          )}`
        );
        console.log("Email check response:", response.data);

        if (!response.data.user_role) {
          await createUser(auth0User);
        } else if (response.data.user_role === "SERVICE_PROVIDER") {
          setAppUser({
            ...auth0User,
            role: "SERVICE_PROVIDER",
            serviceProviderId: response.data.id,
          });
        } else {
          setAppUser({
            ...auth0User,
            role: "CUSTOMER",
            customerid: response.data.id,
          });
          await getCustomerPreferences(Number(response.data.id));
        }

        console.log("Post-login steps complete ✅");
      } catch (error) {
        console.error("Error during post-login API call:", error);
        showErrorSnackbar("Failed to complete login process");
      }
    };

    run().catch((error) => {
      console.error("Error in run function:", error);
      showErrorSnackbar("Login process failed");
    });
  }, [auth0User, auth0Loading, getCredentials]);

  const createUser = async (user: any) => {
    try {
      const userData = {
        firstName: user.given_name || user.name?.split(" ")[0] || "User",
        lastName: user.family_name || user.name?.split(" ")[1] || "",
        emailId: user.email,
        password: "password",
      };

      console.log("Creating user with data:", userData);

      const response = await axios.post(
        "https://servease-be-5x7f.onrender.com/api/customer/add-customer-new",
        userData
      );

      console.log("User creation response:", response.data);

      if (response.data && response.data.id) {
        const customerId = Number(response.data.id);
        setAppUser({
          ...user,
          role: "CUSTOMER",
          customerid: response.data.id,
        });
        await getCustomerPreferences(customerId);
      } else {
        console.warn("Unexpected response format:", response.data);
        showErrorSnackbar("Unexpected response during user creation");
      }
    } catch (error) {
      console.error("Error creating user:", error);
      showErrorSnackbar("Failed to create user account");
    }
  };

  const getCustomerPreferences = async (customerId: number) => {
    try {
      const response = await axios.get(
        `https://utils-ndt3.onrender.com/user-settings/${customerId}`
      );
      console.log("Response from user settings API:", response.data);

      if (response.status === 200) {
        console.log("Customer preferences fetched successfully:", response.data);
        setUserPreference(response.data);
        if (auth0User) {
          setAppUser({
            ...auth0User,
            role: "CUSTOMER",
            customerid: customerId,
          });
        }
        if (auth0User) {
          showSuccessSnackbar(`Welcome back, ${auth0User.name || auth0User.email}!`);
        }
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        createUserPreferences(customerId);
      } else {
        console.error("Unexpected error fetching user settings:", error);
        showErrorSnackbar("Failed to load user preferences");
      }
    }
  };

  const createUserPreferences = async (customerId: number) => {
    try {
      const payload: any = {
        customerId,
        savedLocations: [],
      };

      console.log("Creating user preferences with payload:", payload);

      const response = await axios.post(
        "https://utils-ndt3.onrender.com/user-settings",
        payload
      );

      if (response.status === 200 || response.status === 201) {
        setUserPreference(payload);
        if (auth0User) {
          showSuccessSnackbar(`Welcome to Serveaso, ${auth0User.name || auth0User.email}!`);
        }
      } else {
        console.warn("Unexpected response:", response);
        showErrorSnackbar("Failed to create user preferences");
      }
    } catch (error) {
      console.error("Error saving user settings:", error);
      showErrorSnackbar("Failed to save user settings");
    }
  };

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

  const handleSignOut = async () => {
    try {
      await clearSession({
        returnToUrl: "com.serveaso://logout",
      });

      dispatch(remove());
      setMenuVisible(false);
      setCurrentLocation(null);
      handleClick("sign_out");
      showInfoSnackbar("Signed out successfully");
    } catch (e) {
      console.log("Log out error:", e);
      showErrorSnackbar("Failed to sign out");
    }
  };

  const handleLoginClick = async () => {
    setMenuVisible(false);
    try {
      await authorize({
        scope: "openid profile email",
        redirectUrl:
          "com.serveaso://dev-plavkbiy7v55pbg4.us.auth0.com/android/com.serveaso/callback",
      });

      const credentials = await getCredentials();
    } catch (e) {
      console.log("Login error:", e);
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

  const handleWalletClick = () => {
    setMenuVisible(false);
    setIsWalletOpen(true);
  };

  const handleMenuPress = () => {
    setMenuVisible(!menuVisible);
  };

  const handleOverlayPress = () => {
    setMenuVisible(false);
  };

  // Export function to get location data
  const getLocationData = () => currentLocation;

  // REMOVED: All menu rendering functions since menu is completely removed

  return (
    <View style={{ position: "relative" }}>
      <LinearGradient
        colors={["#0a2a66", "#004aad"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerContainer}
      >
        {/* Logo Section - Centered */}
        <View style={styles.logoContainer}>
          <TouchableOpacity onPress={onLogoClick}>
            <Image
              source={require("../../assets/images/serveasologo.png")}
              style={styles.logo}
            />
          </TouchableOpacity>
        </View>

        {/* Location Selector - Expanded to fill available space */}
        <View style={styles.locationContainer}>
          <LocationSelector
            userPreference={userPreference}
            setUserPreference={setUserPreference}
            onLocationChange={handleLocationChange}
          />
        </View>

        {/* REMOVED: Entire right actions container including user menu */}
      </LinearGradient>

      {/* REMOVED: All menu dropdown and related modals since menu is completely removed */}
      {/* Only keep essential non-menu related modals if needed */}
      
      {/* Wallet Dialog - kept as it might be triggered from other parts */}
      <WalletDialog
        open={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
      />

      {/* Terms and Conditions Modal */}
      <Modal
        visible={showTnC}
        animationType="slide"
        onRequestClose={() => setShowTnC(false)}
      >
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={["#0a2a66", "#004aad"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.modalHeader}
          >
            <Text style={styles.modalTitle}>Terms and Conditions</Text>
            <TouchableOpacity onPress={() => setShowTnC(false)}>
              <Icon name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>
          <TnC />
        </View>
      </Modal>

      {/* About Page - kept as it might be triggered from other parts */}
      <AboutPage visible={showAboutUs} onBack={() => setShowAboutUs(false)} />

      {/* Contact Us Modal */}
      <Modal
        visible={showContactUs}
        animationType="slide"
        onRequestClose={() => setShowContactUs(false)}
      >
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={["#0a2a66", "#004aad"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.modalHeader}
          >
            <Text style={styles.modalTitle}>Contact Us</Text>
            <TouchableOpacity onPress={() => setShowContactUs(false)}>
              <Icon name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>
          <ContactUs />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", // Changed from space-between to evenly distribute
    height: 70,
    elevation: 3,
    paddingHorizontal: 16, // Add padding for better spacing
  },
  logoContainer: {
    flex: 1,
    alignItems: "flex-start", // Align logo to left
    justifyContent: "center",
    paddingTop: 60,
  },
  logo: {
    height: 140,
    width: 120,
    resizeMode: "contain",
  },
  locationContainer: {
   flex: 3, // Increased from 2 to take even more space
  justifyContent: "center",
  alignItems: "stretch", // Changed from "center" to fill width
  height: 50, // Increased from 36 to make it taller
  // marginHorizontal: 10,
paddingBottom: 10,
    
    // maxWidth: width * 0.6, // Increased max width for better visibility
  },
  // REMOVED: All rightActionsContainer and user menu related styles
  
  modalContainer: {
    flex: 1,
    backgroundColor: "white",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 40 : 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    flex: 1,
  },
});

export default Head;
export type { LocationData };