// Head.tsx
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
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import FeatherIcon from "react-native-vector-icons/Feather";
import { useSelector, useDispatch } from "react-redux";
import { add, remove } from "../features/userSlice";
import {
  ADMIN,
  BOOKINGS,
  DASHBOARD,
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

const Head: React.FC<ChildComponentProps> = ({ sendDataToParent }) => {
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
  
  // State to store current location data
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);

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
    setShowContactUs(true);
  };

  const handleAboutUsClick = () => {
    Alert.alert("about us clicked ....")
    setMenuVisible(false);
    setShowAboutUs(true);
  };

  const handleTnCClick = () => {
    setMenuVisible(false);
    setShowTnC(true);
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

  const handleClick = (e: any) => {
    setCurrentPage(e);
    if (e === "sign_out") {
      dispatch(remove());
      sendDataToParent("");
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
      setCurrentLocation(null); // Clear location on sign out
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
    // handleLoginClick()
    console.log("MENU PRESSED");
    setMenuVisible(prev => !prev);
  };

  const handleOverlayPress = () => {
    setMenuVisible(false);
  };

  // Export function to get location data (can be used by other components)
  const getLocationData = () => currentLocation;

  // Conditional rendering based on user role
  const shouldShowBookingsIcon = auth0User && appUser?.role === "CUSTOMER";
  const shouldShowNotificationsIcon = auth0User && appUser?.role === "SERVICE_PROVIDER";

  // Render menu items based on user authentication and role
  const renderMenuItems = () => {
    // Not logged in
    if (!auth0User) {
      return (
        <>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleLoginClick}
          >
            <Icon
              name="sign-in"
              size={18}
              color="#fff"
              style={styles.menuIcon}
            />
            <Text style={styles.menuItemText}>Login / Signup</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleTnCClick}
          >
            <Icon
              name="file-text"
              size={18}
              color="#fff"
              style={styles.menuIcon}
            />
            <Text style={styles.menuItemText}>Terms & Conditions</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleContactUsClick}
          >
            <Icon
              name="phone"
              size={18}
              color="#fff"
              style={styles.menuIcon}
            />
            <Text style={styles.menuItemText}>Contact Us</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleAboutUsClick}
          >
            <Icon
              name="info-circle"
              size={18}
              color="#fff"
              style={styles.menuIcon}
            />
            <Text style={styles.menuItemText}>About Us</Text>
          </TouchableOpacity>
        </>
      );
    }

    // Logged in as CUSTOMER
    if (appUser?.role === "CUSTOMER") {
      return (
        <>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleProfileClick}
          >
            <Icon
              name="user"
              size={18}
              color="#fff"
              style={styles.menuIcon}
            />
            <Text style={styles.menuItemText}>Profile</Text>
          </TouchableOpacity>
         
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleBookingHistoryClick}
          >
            <Icon
              name="history"
              size={18}
              color="#fff"
              style={styles.menuIcon}
            />
            <Text style={styles.menuItemText}>My Bookings</Text>
          </TouchableOpacity>
           <TouchableOpacity
            style={styles.menuItem}
            onPress={handleWalletClick}
          >
            <MaterialIcon
              name="account-balance-wallet"
              size={18}
              color="#fff"
              style={styles.menuIcon}
            />
            <Text style={styles.menuItemText}>Wallet</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleSignOut}
          >
            <Icon
              name="sign-out"
              size={18}
              color="#fff"
              style={styles.menuIcon}
            />
            <Text style={styles.menuItemText}>Sign Out</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleContactUsClick}
          >
            <Icon
              name="phone"
              size={18}
              color="#fff"
              style={styles.menuIcon}
            />
            <Text style={styles.menuItemText}>Contact Us</Text>
          </TouchableOpacity>
        </>
      );
    }

    // Logged in as SERVICE_PROVIDER
    if (appUser?.role === "SERVICE_PROVIDER") {
      return (
        <>
        <TouchableOpacity
            style={styles.menuItem}
            onPress={handleProfileClick}
          >
            <Icon
              name="user"
              size={18}
              color="#fff"
              style={styles.menuIcon}
            />
            <Text style={styles.menuItemText}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleDashboardClick}
          >
            <Icon
              name="dashboard"
              size={18}
              color="#fff"
              style={styles.menuIcon}
            />
            <Text style={styles.menuItemText}>Dashboard</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleContactUsClick}
          >
            <Icon
              name="phone"
              size={18}
              color="#fff"
              style={styles.menuIcon}
            />
            <Text style={styles.menuItemText}>Contact Us</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleSignOut}
          >
            <Icon
              name="sign-out"
              size={18}
              color="#fff"
              style={styles.menuIcon}
            />
            <Text style={styles.menuItemText}>Sign Out</Text>
          </TouchableOpacity>
        </>
      );
    }

    // Fallback for other roles or unexpected states
    return (
      <TouchableOpacity
        style={styles.menuItem}
        onPress={handleSignOut}
      >
        <Icon
          name="sign-out"
          size={18}
          color="#fff"
          style={styles.menuIcon}
        />
        <Text style={styles.menuItemText}>Sign Out</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ position: "relative" }}>
      {menuVisible && (
        <TouchableWithoutFeedback onPress={handleOverlayPress}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
      )}

      <LinearGradient
        colors={["#0a2a66ff", "#004aadff"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerContainer}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <TouchableOpacity
            onPress={() => handleClick("")}
          >
            <Image
              source={require("../../assets/images/serveasologo.png")}
              style={styles.logo}
            />
          </TouchableOpacity>
        </View>

        {/* Location Selector - Updated to handle location data */}
        <View style={styles.locationContainer}>
          <LocationSelector
            userPreference={userPreference}
            setUserPreference={setUserPreference}
            onLocationChange={handleLocationChange}
          />
        </View>

        {/* Right Actions - Conditional rendering based on user role */}
        <View style={styles.rightActionsContainer}>
          {/* Notification Icon - Only for SERVICE_PROVIDER */}
          {shouldShowNotificationsIcon && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleNotificationClick}
            >
              <FeatherIcon name="bell" size={22} color="#fff" />
            </TouchableOpacity>
          )}

          {/* Bookings Icon - Only for CUSTOMER */}
          {shouldShowBookingsIcon && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleBookingsClick}
            >
              <MaterialIcon name="event-note" size={24} color="#fff" />
            </TouchableOpacity>
          )}

          {/* Menu Icon - Always visible when logged in, otherwise show user icon */}
          <TouchableOpacity style={styles.iconButton} onPress={handleMenuPress}>
            {auth0User ? (
              <Image
                source={{ uri: auth0User.picture }}
                style={styles.userAvatar}
              />
            ) : (
              <FeatherIcon name="user" size={22} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

        
      </LinearGradient>

      {/* Menu Dropdown */}aa
        {menuVisible && (
          <View style={styles.menuDropdown}>
            {renderMenuItems()}
          </View>
        )}

      {/* Bookings Dialog */}
      <Modal
        visible={showBookings}
        animationType="slide"
        onRequestClose={handleCloseBookings}
      >
        <View style={styles.fullScreenModal}>
          {/* <View style={styles.modalHeader}> */}
           <LinearGradient
                    colors={["#0a2a66ff", "#004aadff"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.modalHeader}
                  >
            <Text style={styles.modalTitle}>My Bookings</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={handleCloseBookings}
            >
              <Icon name="close" size={24} color="#ffffffff" />
            </TouchableOpacity>
            </LinearGradient>
          {/* </View> */}
          <View style={styles.modalContent}>
            <Booking />
          </View>
        </View>
      </Modal>
      
      {/* Notifications Dialog */}
      <NotificationsDialog 
        visible={showNotifications} 
        onClose={handleCloseNotifications} 
      />

      <WalletDialog
        open={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
      />

      <Modal
        visible={showTnC}
        animationType="slide"
        onRequestClose={() => setShowTnC(false)}
      >
        <View style={styles.tncModalContainer}>
          <View style={styles.tncModalHeader}>
            <Text style={styles.tncModalTitle}>Terms and Conditions</Text>
            <TouchableOpacity onPress={() => setShowTnC(false)}>
              <Icon name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          <TnC />
        </View>
      </Modal>
      <AboutPage visible={showAboutUs} onBack={() => setShowAboutUs(false)} />

      <Modal
        visible={showContactUs}
        animationType="slide"
        onRequestClose={() => setShowContactUs(false)}
      >
        <View style={styles.contactModalContainer}>
          <View style={styles.contactModalHeader}>
            <Text style={styles.contactModalTitle}>Contact Us</Text>
            <TouchableOpacity onPress={() => setShowContactUs(false)}>
              <Icon name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
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
  height: 70,
  flexDirection: "row",
  alignItems: "center",
  // paddingHorizontal: 12,
  
},
  logoContainer: {
  width: 90,                // 👈 fixed
  justifyContent: "center",
  alignItems: "flex-start",
},

  logo: {
    height: 110,
    width: 110,
    resizeMode: "contain",
  },
  locationContainer: {
    paddingTop: 17,
    flex: 2,
    marginHorizontal: 12,
    maxWidth: width * 0.5,
  },
  rightActionsContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 12,
    maxWidth: 150,
  },
  iconButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  overlay: {
  position: "absolute",
  top: 70,              // 👈 start BELOW header
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "transparent",
  zIndex: 10,
},
  menuDropdown: {
  position: "absolute",
  top: 70,
  right: 16,
  backgroundColor: "black",
  borderRadius: 8,
  paddingVertical: 4,
  zIndex: 1000,
  elevation: 10,
},
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  menuIcon: {
    marginRight: 12,
    width: 20,
  },
  menuItemText: {
    color: "white",
    fontSize: 16,
  },
  tncModalContainer: {
    flex: 1,
    backgroundColor: "white",
  },
  tncModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tncModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  contactModalContainer: {
    flex: 1,
    backgroundColor: "white",
  },
  contactModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  contactModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  fullScreenModal: {
    flex: 1,
    backgroundColor: "white",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  modalTitle: {
       fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    flex: 1,
    // fontSize: 20,
    // fontWeight: "bold",
    // color: "#1f2937",
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
  },
});

// Export the Head component with additional location functionality
export default Head;
export type { LocationData };