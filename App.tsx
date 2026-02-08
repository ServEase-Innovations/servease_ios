// App.tsx - Updated with proper NavigationFooter handlers
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  StatusBar,
  Image,
  Animated,
  AppState,
  TouchableOpacity,
  Alert,
  Text,
  Modal,
  AppStateStatus,
  Platform,
  Dimensions,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Auth0Provider } from "react-native-auth0";
import config from "./auth0-configuration";
import Head from "./src/Header/Header";
import NavigationFooter from "./src/NavigationFooter/NavigationFooter";
import HomePage from "./src/HomePage/HomePage";
import DetailsView from "./src/DetailsView/DetailsView";
import Footer from "./src/Footer/Footer";
import Chatbot from "./src/Chatbot/Chatbot";
import Booking from "./src/UserProfile/Bookings";
import Dashboard from "./src/ServiceProvider/Dashboard";
import ProfileScreen from "./src/UserProfile/ProfileScreen";
import { BOOKINGS, DASHBOARD, PROFILE } from "./src/Constants/pagesConstants";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import NotificationButton from "./src/Notifications/NotificationButton";
import NotificationClient from "./src/NotificationClient/NotificationClient";
import BookingRequestToast from "./src/Notifications/BookingRequestToast";
import io, { Socket } from "socket.io-client";
import { AppUserProvider, useAppUser } from "./src/context/AppUserContext";
import axios from "axios";
import { useDispatch } from "react-redux";
import { add } from "./src/features/pricingSlice";
import MobileNumberDialog from "./src/UserProfile/MobileNumberDialog";
import axiosInstance from "./src/services/axiosInstance";
import WalletDialog from "./src/UserProfile/WalletDialog";
import NotificationsDialog from "./src/Notifications/NotificationsPage";
import { PaperProvider } from "react-native-paper";
import SignupDrawer from "./src/SignupDrawer/SignupDrawer";
import ServiceProviderRegistration from "./src/ServiceProviderRegistration";
import AgentRegistrationForm from "./src/AgentRegistration/AgentRegistrationForm";
import { useAuth0 } from "react-native-auth0";
import ProfileMenuSheet from "./src/ProfileMenuSheet/ProfileMenuSheet";
// const {  getCredentials } = useAuth0();



interface Engagement {
  engagement_id: number;
  service_type: string;
  booking_type: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  base_amount: number;
  customer_name?: string;
  customer_email?: string;
  status?: string;
}

const MainApp = () => {
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [currentView, setCurrentView] = useState("HOME");
  const [selectedBookingType, setSelectedBookingType] = useState("");
  const [showProfileFromDashboard, setShowProfileFromDashboard] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [isFirstLaunch, setIsFirstLaunch] = useState(true);
  const [activeToast, setActiveToast] = useState<Engagement | null>(null);
  const [showNotificationClient, setShowNotificationClient] = useState(false);
  const [shouldShowMobileDialog, setShouldShowMobileDialog] = useState(false);
  const [hasCheckedMobileNumber, setHasCheckedMobileNumber] = useState(false);
  const [customerData, setCustomerData] = useState<any>(null);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const socketRef = useRef<Socket | null>(null);
  const SOCKET_URL = "https://payments-j5id.onrender.com";
  const [showSignupDrawer, setShowSignupDrawer] = useState(false);
  const [showProviderRegistration, setShowProviderRegistration] = useState(false);
  const [showAgentRegistration, setShowAgentRegistration] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);




  const dispatch = useDispatch();
  const { appUser } = useAppUser();

  const { authorize } = useAuth0();
  const { getCredentials } = useAuth0();

  const handleAuth0Login = async () => {
  try {
      await authorize({
        scope: "openid profile email",
        redirectUrl:
          "com.serveaso://dev-plavkbiy7v55pbg4.us.auth0.com/android/com.serveaso/callback",
      });

      const credentials = await getCredentials();
    } catch (e) {
      console.log("Login error:", e);
      // showErrorSnackbar("Login failed. Please try again.");
    }
    
};


  // Get screen dimensions
  const { height, width } = Dimensions.get('window');
  const isMobile = width < 768;

  const handleRegisterAs = (type: "USER" | "PROVIDER" | "AGENT") => {
  setShowSignupDrawer(false);

  switch (type) {
    case "USER":
      handleAuth0Login();   
      setCurrentView("SIGNUP");
      // Ideally trigger Auth0 login here later
      break;

    case "PROVIDER":
      setCurrentView("SIGNUP");
      setTimeout(() => setShowProviderRegistration(true), 150);
      break;

    case "AGENT":
      setCurrentView("SIGNUP");
      setTimeout(() => setShowAgentRegistration(true), 150);
      break;
  }
};



  useEffect(() => {
    console.log("🔄 AppUser changed:", appUser ? `Logged in as ${appUser.role}` : "Logged out");

    if (!appUser) {
      console.log("👤 No user detected, resetting to HOME view");
      setCurrentView("HOME");
      setShowProfileFromDashboard(false);
      setShowNotificationClient(false);
      setShouldShowMobileDialog(false);
      setHasCheckedMobileNumber(false);
      setCustomerData(null);
      setIsWalletOpen(false);
      setShowNotifications(false);
    }
  }, [appUser]);

  useEffect(() => {
    if (!appUser || appUser?.role?.toUpperCase() !== "CUSTOMER" || hasCheckedMobileNumber) {
      return;
    }

    const fetchCustomerDetails = async () => {
      try {
        console.log("📱 Fetching customer details for ID:", appUser.customerid);
        const response = await axiosInstance.get
          (`/api/customer/get-customer-by-id/${appUser.customerid}`
        );

        const customer = response.data;
        setCustomerData(customer);

        if (!customer?.mobileNo) {
          console.warn("⚠️ Customer mobile number is missing (null). Showing dialog...");
          setShouldShowMobileDialog(true);
        } else {
          console.log("✅ Customer has mobile number:", customer.mobileNo);
          setShouldShowMobileDialog(false);
        }

        setHasCheckedMobileNumber(true);
      } catch (error: any) {
        console.error("❌ Error fetching customer details:", error);
        if (error.response?.status === 404) {
          setCustomerData(null);
          setShouldShowMobileDialog(true);
        } else {
          setShouldShowMobileDialog(false);
        }
        setHasCheckedMobileNumber(true);
      }
    };

    const timer = setTimeout(() => {
      fetchCustomerDetails();
    }, 1500);

    return () => clearTimeout(timer);
  }, [appUser, hasCheckedMobileNumber]);

  const handleMobileDialogSuccess = () => {
    console.log("✅ Mobile dialog completed successfully");
    setShouldShowMobileDialog(false);
    setHasCheckedMobileNumber(true);
    if (appUser?.customerid) {
      setTimeout(() => {
        setHasCheckedMobileNumber(false);
      }, 1000);
    }
  };

  const handleMobileDialogClose = () => {
    console.log("📱 Mobile dialog closed");
    setShouldShowMobileDialog(false);
    setHasCheckedMobileNumber(true);
  };

  useEffect(() => {
    setHasCheckedMobileNumber(false);
    setShouldShowMobileDialog(false);
    setCustomerData(null);
  }, [appUser?.customerid]);

  useEffect(() => {
    getPricingData();

    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        if (isFirstLaunch) {
          setShowSplash(true);
          fadeAnim.setValue(1);

          setTimeout(() => {
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }).start(() => {
              setShowSplash(false);
              setIsFirstLaunch(false);
            });
          }, 1000);
        }
      }

      appState.current = nextAppState;
    });

    if (isFirstLaunch) {
      const timer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          setShowSplash(false);
          setIsFirstLaunch(false);
        });
      }, 2000);

      return () => {
        subscription.remove();
        clearTimeout(timer);
      };
    }

    return () => subscription.remove();
  }, [isFirstLaunch, fadeAnim]);

  const getPricingData = async () => {
    try {
      const response = await axios.get(`https://utils-ndt3.onrender.com/records`);
      dispatch(add(response.data));
      console.log("Pricing Data:", response.data);
    } catch (error) {
      console.error("Error fetching pricing data:", error);
    }
  };

  useEffect(() => {
    if (!appUser) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    if (appUser.role?.toUpperCase() !== "SERVICE_PROVIDER") return;
    if (socketRef.current) return;

    let mounted = true;

    (async () => {
      const token = appUser?.accessToken ?? null;

      const socket = io(SOCKET_URL, {
        transports: ["polling", "websocket"],
        auth: token ? { token } : undefined,
        timeout: 20000,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        withCredentials: true,
      });

      socketRef.current = socket;

      socket.on("connect", () => {
        console.log("[socket] connected", socket.id);
        socket.emit("join", { providerId: appUser.serviceProviderId });
      });

      socket.on("new-engagement", (payload: any) => {
        console.log("[socket] new-engagement", payload);
        const engagement = payload?.engagement ?? payload;
        Alert.alert(
          "New Booking Request",
          `Booking for ${engagement?.service_type ?? "a service"}`
        );
      });

      socket.on("connect_error", (err) => {
        console.error("[socket] connect_error", err);
      });

      socket.io.on("reconnect_attempt", (attempt) => {
        console.log("[socket] reconnect attempt", attempt);
      });

      if (!mounted) {
        socket.disconnect();
        socketRef.current = null;
      }
    })().catch((e) => console.warn("[socket] init failed", e));

    return () => {
      mounted = false;
      const s = socketRef.current;
      if (s) {
        s.off("connect");
        s.off("new-engagement");
        s.off("connect_error");
        s.disconnect();
        socketRef.current = null;
      }
    };
  }, [appUser]);

  const handleAccept = (id: number) => {
    Alert.alert("Success", "Booking request accepted successfully");
    setActiveToast(null);
  };

  const handleReject = (id: number) => {
    Alert.alert("Rejected", "Booking request has been rejected");
    setActiveToast(null);
  };


  const handleViewChange = (view: string) => {
    if (view === "" || view === "FORCE_HOME") {
      setCurrentView("HOME");
      setShowProfileFromDashboard(false);
    } else {
      setCurrentView(view);
    }
  };

  const handleDashboardProfilePress = () => setShowProfileFromDashboard(true);
  const handleBackToDashboard = () => setShowProfileFromDashboard(false);
  const handleNotificationButtonPress = () => setShowNotificationClient(true);

  const handleHomeClick = () => {
    setCurrentView("HOME");
    setShowProfileFromDashboard(false);
  };

  const handleServicesClick = (service: string) => {
    console.log(`Service selected: ${service}`);
    if (service === "Home Cook" || service === "Cleaning Help" || service === "Caregiver") {
      setSelectedBookingType(service);
      // Navigate to details view with selected service
      setCurrentView("DETAILS");
    }
  };

  const handleBookingsClick = () => {
    handleViewChange(BOOKINGS);
  };

  const handleDashboardClick = () => {
    handleViewChange(DASHBOARD);
  };

  const handleAboutClick = () => {
    Alert.alert("About Us", "ServEaso - Your trusted service provider");
  };

  const handleContactClick = () => {
    Alert.alert("Contact Us", "Contact ServEaso support");
  };

  // const handleNotificationClick = () => {
  //   setShowNotifications(true);
  // };

  // const handleWalletClick = () => {
  //   setIsWalletOpen(true);
  // };

  // const handleCloseNotifications = () => {
  //   setShowNotifications(false);
  // };

  const renderContent = () => {
    if (appUser && appUser.role?.toUpperCase() === "SERVICE_PROVIDER" && currentView === "HOME") {
      return showProfileFromDashboard ? (
        <ProfileScreen />
      ) : (
        <Dashboard onProfilePress={handleDashboardProfilePress} />
      );
    }

    switch (currentView) {
      case "HOME":
        return (
          <View style={styles.homeContainer}>
            <HomePage sendDataToParent={handleViewChange} bookingType={() => {}} />
          </View>
        );
      case BOOKINGS:
        return <Booking />;
      case DASHBOARD:
        return showProfileFromDashboard ? (
          <ProfileScreen />
        ) : (
          <Dashboard onProfilePress={handleDashboardProfilePress} />
        );
      case PROFILE:
        return <ProfileScreen />;
      default:
        return <DetailsView sendDataToParent={handleViewChange} selected={selectedBookingType} />;
    }
  };

  if (showSplash) {
    return (
      <Animated.View style={[styles.splashContainer, { opacity: fadeAnim }]}>
        <Image
          source={require("./assets/images/serveasologo.png")}
          style={styles.splashImage}
          resizeMode="contain"
        />
      </Animated.View>
    );
  }

  return (
    <PaperProvider>
    <SafeAreaProvider>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        {/* Fixed Header */}
        <View style={styles.headerWrapper}>
          <Head 
            sendDataToParent={handleViewChange} 
            bookingType={selectedBookingType}
            onAboutClick={handleAboutClick}
            onContactClick={handleContactClick}
            onLogoClick={handleHomeClick}
          />
        </View>

        {/* Notification Button for Service Providers */}
        {appUser && appUser.role?.toUpperCase() === "SERVICE_PROVIDER" && (
          <View style={styles.notificationButtonContainer}>
            <NotificationButton onPress={handleNotificationButtonPress} />
          </View>
        )}

        {/* Scrollable Content Area */}
        <View style={styles.contentContainer}>
          {currentView === PROFILE || (currentView === DASHBOARD && showProfileFromDashboard) ? (
            <ScrollView style={styles.profileScrollView} contentContainerStyle={styles.profileScrollContent}>
              {renderContent()}
            </ScrollView>
          ) : (
            <ScrollView
              style={styles.mainScrollView}
              contentContainerStyle={[
                styles.scrollContent,
                (currentView === BOOKINGS || currentView === DASHBOARD) &&
                  styles.fullScreenScrollContent,
              ]}
              contentInsetAdjustmentBehavior="automatic"
            >
              {renderContent()}
              {currentView === "HOME" &&
                (!appUser || appUser?.role?.toUpperCase() === "CUSTOMER") && <Footer />}
            </ScrollView>
          )}
        </View>

        {/* Fixed Navigation Footer for Mobile */}
        {isMobile && (
          <View style={styles.navigationFooterContainer}>
           <NavigationFooter
           activePage={currentView}
  onHomeClick={handleHomeClick}
  onBookingsClick={handleBookingsClick}
  onDashboardClick={handleDashboardClick}
  onAboutClick={handleAboutClick}
  onContactClick={handleContactClick}
  auth0User={appUser}
  appUser={appUser}
  bookingType={selectedBookingType}
  onOpenSignup={() => setShowSignupDrawer(true)}
  onProfileClick={() => setShowProfileMenu(true)}
  onNavigateToPage={(page: string) => {
    // Handle navigation to different pages
    if (page === PROFILE) {
      setCurrentView(PROFILE);
      setShowProfileFromDashboard(false);
    } else if (page === BOOKINGS) {
      setCurrentView(BOOKINGS);
    } else if (page === DASHBOARD) {
      setCurrentView(DASHBOARD);
      setShowProfileFromDashboard(false);
    }
  }}
/>

<ProfileMenuSheet
  visible={showProfileMenu}
  onClose={() => setShowProfileMenu(false)}
  onProfile={() => {
    setShowProfileMenu(false);
    setCurrentView(PROFILE);
  }}
  onBookings={() => {
    setShowProfileMenu(false);
    setCurrentView(BOOKINGS);
  }}
  onDashboard={() => {
    setShowProfileMenu(false);
    setCurrentView(DASHBOARD);
  }}
  onWallet={() => setIsWalletOpen(true)}
  onContact={handleContactClick}
/>


          </View>
        )}

        {/* Chat Button - Positioned above Navigation Footer */}
        {!chatbotOpen && isMobile && (
          <TouchableOpacity style={styles.chatButton} onPress={() => setChatbotOpen(true)}>
            <Icon name="chat" size={28} color="#fff" />
          </TouchableOpacity>
        )}

        {/* Modals and Dialogs */}
        {shouldShowMobileDialog && (
          <MobileNumberDialog 
            open={shouldShowMobileDialog}
            onClose={handleMobileDialogClose}
            onSuccess={handleMobileDialogSuccess}
          />
        )}

        {/* Wallet Dialog */}
        {/* <WalletDialog
          open={isWalletOpen}
          onClose={() => setIsWalletOpen(false)}
        /> */}

        {/* Notifications Dialog */}
        {/* <NotificationsDialog 
          visible={showNotifications} 
          onClose={handleCloseNotifications} 
        /> */}

        <SignupDrawer
  visible={showSignupDrawer}
  onClose={() => setShowSignupDrawer(false)}
  onUser={() => {
    setShowSignupDrawer(false);
    handleRegisterAs("USER");
  }}
  onProvider={() => {
    setShowSignupDrawer(false);
    handleRegisterAs("PROVIDER");
  }}
  onAgent={() => {
    setShowSignupDrawer(false);
    handleRegisterAs("AGENT");
  }}
/>

{/* Provider Registration */}
{showProviderRegistration && (
  <Modal animationType="slide" visible>
    <ServiceProviderRegistration
                onBackToLogin={() => setShowProviderRegistration(false)} onRegistrationSuccess={function (): void {
                  throw new Error("Function not implemented.");
                } }    />
  </Modal>
)}

{/* Agent Registration */}
<Modal
  visible={showAgentRegistration}
  animationType="slide"
  onRequestClose={() => setShowAgentRegistration(false)}
>
  <AgentRegistrationForm
    onBackToLogin={() => setShowAgentRegistration(false)}
    onRegistrationSuccess={() => setShowAgentRegistration(false)}
  />
</Modal>



        <Modal
          visible={showNotificationClient}
          animationType="slide"
          onRequestClose={() => setShowNotificationClient(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowNotificationClient(false)}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Notifications</Text>
            </View>
            <NotificationClient />
          </View>
        </Modal>

        <Chatbot open={chatbotOpen} onClose={() => setChatbotOpen(false)} />

        {activeToast && (
          <BookingRequestToast
            engagement={activeToast}
            onAccept={handleAccept}
            onReject={handleReject}
            onClose={() => setActiveToast(null)}
            visible={!!activeToast}
          />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
    </PaperProvider>
  );
};

const App = () => (
  <Auth0Provider domain={config.domain} clientId={config.clientId}>
    <AppUserProvider>
      <MainApp />
    </AppUserProvider>
  </Auth0Provider>
);

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: "#0d2b61ff",
    justifyContent: "center",
    alignItems: "center",
  },
  splashImage: { 
    width: "80%", 
    height: "80%" 
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#0a2a66",
  },
  headerWrapper: {
    width: "100%",
    backgroundColor: "#0a2a66ff",
    zIndex: 50,
  },
  homeContainer: { 
    flex: 1 
  },
  notificationButtonContainer: {
    position: "absolute",
    top: 80,
    right: 20,
    zIndex: 45,
    backgroundColor: "#3b82f6",
    borderRadius: 30,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  contentContainer: { 
    flex: 1, 
    marginTop: 50, // Header height + some padding
    backgroundColor: "#fff",
    paddingBottom: 50, // Space for navigation footer
  },
  mainScrollView: { 
    flex: 1 
  },
  scrollContent: { 
    flexGrow: 1, 
    justifyContent: "space-between", 
    minHeight: "100%",
  },
  fullScreenScrollContent: { 
    paddingBottom: 0 
  },
  profileScrollView: { 
    flex: 1 
  },
  profileScrollContent: { 
    flexGrow: 1 
  },
  modalContainer: { 
    flex: 1, 
    backgroundColor: "#fff" 
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
  },
  closeButton: { 
    padding: 4 
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: "bold", 
    marginLeft: 16, 
    color: "#333" 
  },
  navigationFooterContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#0a2a66",
    zIndex: 100,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    minHeight: 60,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 10,
  },
  chatButton: {
    position: "absolute",
    bottom: 80, // Above the navigation footer
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 2000,
  },
});

export default App;