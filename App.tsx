// App.tsx - Complete version with ThemeProvider, Settings, Multi-language support, and Professional Loading Animation
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
  Linking,
  ActivityIndicator,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Auth0Provider, useAuth0 } from "react-native-auth0";
import config from "./auth0-configuration";
import { I18nextProvider } from 'react-i18next';
import i18n, { initI18n } from "./i18n";
// import { LinearGradient } from 'expo-linear-gradient'; // Import LinearGradient

// Import Theme Provider
import { ThemeProvider, useTheme } from "./src/Settings/ThemeContext";

// Global type augmentation for deep linking
declare global {
  var deepLinkCustomerId: string | null;
  var deepLinkBookingId: string | null;
  var deepLinkTimestamp: string | null;
  var deepLinkAction: string | null;
  var pendingDeepLinkCustomerId: string | null;
  var pendingDeepLinkBookingId: string | null;
  var pendingDeepLinkTimestamp: string | null;
  var pendingDeepLinkAction: string | null;
}

import Head from "./src/Header/Header";
import NavigationFooter from "./src/NavigationFooter/NavigationFooter";
import HomePage from "./src/HomePage/HomePage";
import DetailsView from "./src/DetailsView/DetailsView";
import Footer from "./src/Footer/Footer";
import Chatbot from "./src/Chatbot/Chatbot";
import Booking from "./src/UserProfile/Bookings";
import Dashboard from "./src/ServiceProvider/Dashboard";
import ProfileScreen from "./src/UserProfile/NewProfileScreen";
import AgentDashboard from "./src/Agent/AgentDashboard";
import { BOOKINGS, DASHBOARD, PROFILE, HOME, AGENT_DASHBOARD } from "./src/Constants/pagesConstants";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
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
import ServiceProviderRegistration from "./src/Registration/ServiceProviderRegistration";
import AgentRegistrationForm from "./src/Agent/AgentRegistrationForm";
import ProfileMenuSheet from "./src/ProfileMenuSheet/ProfileMenuSheet";
import Snackbar from "react-native-snackbar";
import LinearGradient from "react-native-linear-gradient";

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

interface DeepLinkData {
  openBookings: string;
  customerId: string | null;
  bookingId: string | null;
  action: string | null;
}

// Main App component with theme
const MainApp = () => {
  const { colors, isDarkMode, fontSize, compactMode } = useTheme();
  
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [currentView, setCurrentView] = useState(HOME);
  const [selectedBookingType, setSelectedBookingType] = useState("");
  const [showProfileFromDashboard, setShowProfileFromDashboard] = useState(false);
  const [showSplash, setShowSplash] = useState(true); // This now controls the loading screen
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
  // Key to force re-render of entire app
  const [appResetKey, setAppResetKey] = useState(Date.now());
  // Flag to track if we're performing a full app reset
  const [isResetting, setIsResetting] = useState(false);
  
  // ============= DEEP LINKING STATES =============
  const [deepLinkProcessed, setDeepLinkProcessed] = useState(false);
  const [processingDeepLink, setProcessingDeepLink] = useState(false);
  const [pendingDeepLink, setPendingDeepLink] = useState<DeepLinkData | null>(null);
  const [showDeepLinkLoading, setShowDeepLinkLoading] = useState(false);

  const dispatch = useDispatch();
  const { appUser, clearAppUser } = useAppUser();

  const { authorize, getCredentials, clearSession, user } = useAuth0();

  // Get font size styles based on settings
  const getFontSizeStyles = () => {
    switch (fontSize) {
      case 'small':
        return { textSize: 14, headingSize: 18, smallText: 12 };
      case 'large':
        return { textSize: 18, headingSize: 24, smallText: 16 };
      default:
        return { textSize: 16, headingSize: 20, smallText: 14 };
    }
  };

  const fontStyles = getFontSizeStyles();

  // ============= DEEP LINKING IMPLEMENTATION =============

  /**
   * Process deep link after authentication
   */
  const processDeepLink = (openBookings: string, customerId: string | null, bookingId: string | null, action: string | null = 'open') => {
    setProcessingDeepLink(true);
    setShowDeepLinkLoading(true);
    
    // Store data in AsyncStorage for the Booking component
    if (customerId) {
      // Using session-like storage (you might want to use AsyncStorage)
      // For now, we'll use a global variable or context
      global.deepLinkCustomerId = customerId;
      console.log(`📦 Will show ALL bookings for customer #${customerId}`);
    }
    
    if (bookingId) {
      global.deepLinkBookingId = bookingId;
      console.log(`📦 Will open specific booking #${bookingId}`);
    }
    
    global.deepLinkTimestamp = Date.now().toString();
    
    // MODIFIED: Always set action to 'drawer' by default
    // This ensures that even without action=drawer parameter, the drawer will open
    global.deepLinkAction = 'drawer';
    console.log(`📦 Default action set to 'drawer' for automatic drawer opening`);
    
    // Set the view to BOOKINGS
    setCurrentView(BOOKINGS);
    
    // Mark as processed
    setDeepLinkProcessed(true);
    setPendingDeepLink(null);
    setProcessingDeepLink(false);
    
    // Hide loading after a short delay
    setTimeout(() => {
      setShowDeepLinkLoading(false);
    }, 1000);
    
    // Clean up pending data
    global.pendingDeepLinkCustomerId = null;
    global.pendingDeepLinkBookingId = null;
    global.pendingDeepLinkTimestamp = null;
    global.pendingDeepLinkAction = null;
    
    console.log('✅ Deep link processed successfully with automatic drawer opening');
  };

  /**
   * Check for deep link parameters on initial load
   */
  const checkDeepLink = async (url: string | null) => {
    if (!url || deepLinkProcessed) return;

    console.log('=== DEEP LINK CHECK ===');
    console.log('Current URL:', url);
    
    // Parse the URL
    const parsedUrl = new URL(url);
    const params = parsedUrl.searchParams;
    
    const openBookings = params.get('openBookings');
    const customerId = params.get('customerId');
    const bookingId = params.get('bookingId');
    const action = params.get('action');
    
    console.log('openBookings param:', openBookings);
    console.log('customerId param:', customerId);
    console.log('bookingId param:', bookingId);
    console.log('action param:', action);
    console.log('Is authenticated:', !!appUser);
    console.log('Auth loading:', false);

    if (openBookings === 'true') {
      if (appUser) {
        // User is already logged in, process deep link immediately
        console.log('✅ User authenticated, processing deep link now');
        processDeepLink(openBookings, customerId, bookingId, action);
      } else {
        // User not logged in, store deep link for after login
        console.log('🔐 User not authenticated, storing deep link for after login');
        
        // Store in state
        setPendingDeepLink({
          openBookings,
          customerId,
          bookingId,
          action
        });
        
        // Also store in global as backup
        if (customerId) {
          global.pendingDeepLinkCustomerId = customerId;
        }
        if (bookingId) {
          global.pendingDeepLinkBookingId = bookingId;
        }
        global.pendingDeepLinkTimestamp = Date.now().toString();
        
        // MODIFIED: Store action as 'drawer' by default
        const actionToStore = action || 'drawer';
        global.pendingDeepLinkAction = actionToStore;
        console.log(`📦 Stored pending action: ${actionToStore}`);
        
        console.log(`📦 Stored pending deep link data:`, {
          customerId: customerId || 'none',
          bookingId: bookingId || 'none',
          action: actionToStore
        });
        
        // Show signup drawer to prompt login
        setShowSignupDrawer(true);
      }
    }
  };

  /**
   * Handle incoming deep links
   */
  useEffect(() => {
    // Handle initial URL
    const getInitialURL = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        await checkDeepLink(initialUrl);
      }
    };

    getInitialURL();

    // Handle URL events while app is running
    const subscription = Linking.addEventListener('url', ({ url }) => {
      checkDeepLink(url);
    });

    return () => {
      subscription.remove();
    };
  }, [appUser, deepLinkProcessed]);

  /**
   * Handle post-login deep link processing
   */
  useEffect(() => {
    if (appUser && !deepLinkProcessed) {
      // Check if we have a pending deep link in state
      if (pendingDeepLink) {
        console.log('🔄 User just logged in, processing pending deep link from state');
        processDeepLink(
          pendingDeepLink.openBookings, 
          pendingDeepLink.customerId, 
          pendingDeepLink.bookingId, 
          pendingDeepLink.action
        );
      } 
      // Also check global as backup
      else {
        const pendingCustomerId = global.pendingDeepLinkCustomerId;
        const pendingBookingId = global.pendingDeepLinkBookingId;
        const pendingTimestamp = global.pendingDeepLinkTimestamp;
        const pendingAction = global.pendingDeepLinkAction;
        
        if ((pendingCustomerId || pendingBookingId) && pendingTimestamp) {
          const now = Date.now();
          const linkTime = parseInt(pendingTimestamp);
          const tenMinutes = 10 * 60 * 1000;
          
          if (now - linkTime < tenMinutes) {
            console.log('🔄 Found pending deep link in global storage, processing...');
            processDeepLink('true', pendingCustomerId, pendingBookingId, pendingAction);
          } else {
            // Clear expired deep link
            global.pendingDeepLinkCustomerId = null;
            global.pendingDeepLinkBookingId = null;
            global.pendingDeepLinkTimestamp = null;
            global.pendingDeepLinkAction = null;
          }
        }
      }
    }
  }, [appUser, deepLinkProcessed, pendingDeepLink]);

  // COMPLETE APP RELAUNCH METHOD
  const handleAppRelaunchAfterSignOut = async () => {
    // Prevent multiple reset attempts
    if (isResetting) {
      console.log("⚠️ App reset already in progress...");
      return;
    }

    setIsResetting(true);
    
    try {
      console.log("🔄 ===== STARTING COMPLETE APP RELAUNCH =====");
      
      // 1. Clear Auth0 session (already done in NavigationFooter, but do it again to be safe)
      try {
        await clearSession({
          returnToUrl: "com.serveaso://logout",
        });
        console.log("✅ Auth0 session cleared");
      } catch (authError) {
        console.log("⚠️ Auth0 session clear may have already been called:", authError);
      }
      
      // 2. Clear all app states to initial values
      console.log("🔄 Resetting all app states...");
      setCurrentView(HOME);
      setChatbotOpen(false);
      setSelectedBookingType("");
      setShowProfileFromDashboard(false);
      setShowNotificationClient(false);
      setShouldShowMobileDialog(false);
      setHasCheckedMobileNumber(false);
      setCustomerData(null);
      setIsWalletOpen(false);
      setShowNotifications(false);
      setShowSignupDrawer(false);
      setShowProviderRegistration(false);
      setShowAgentRegistration(false);
      setShowProfileMenu(false);
      setActiveToast(null);
      
      // Reset deep link states
      setDeepLinkProcessed(false);
      setProcessingDeepLink(false);
      setPendingDeepLink(null);
      setShowDeepLinkLoading(false);
      
      // Clear global deep link data
      global.deepLinkCustomerId = null;
      global.deepLinkBookingId = null;
      global.deepLinkTimestamp = null;
      global.deepLinkAction = null;
      global.pendingDeepLinkCustomerId = null;
      global.pendingDeepLinkBookingId = null;
      global.pendingDeepLinkTimestamp = null;
      global.pendingDeepLinkAction = null;
      
      // 3. Clear app user context
      if (clearAppUser) {
        clearAppUser();
        console.log("✅ AppUser context cleared");
      }
      
      // 4. Disconnect and clear socket connection
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        console.log("✅ Socket disconnected");
      }
      
      // 5. Generate new key to force complete re-render
      const newKey = Date.now();
      setAppResetKey(newKey);
      console.log(`✅ App reset key updated: ${newKey}`);
      
      // 6. Show splash screen to indicate restart
      setShowSplash(true);
      fadeAnim.setValue(1);
      
      // 7. Hide splash after delay
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          setShowSplash(false);
          setIsResetting(false);
          console.log("✅ ===== APP RELAUNCH COMPLETED =====");
        });
      }, 1000);
      
    } catch (error) {
      console.error("❌ Error during app relaunch:", error);
      // Force reset even if errors occur
      setAppResetKey(Date.now());
      setCurrentView(HOME);
      setShowSplash(false);
      setIsResetting(false);
    }
  };

  const handleAuth0Login = async () => {
    try {
      await authorize({
        scope: "openid profile email",
        redirectUrl:
          "com.serveaso://dev-plavkbiy7v55pbg4.us.auth0.com/android/com.serveaso/callback",
      });

      const credentials = await getCredentials();
      console.log("Login successful", credentials);
      
      Snackbar.show({
        text: i18n.t('common.success'),
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: colors.success,
        textColor: "#ffffff",
      });
    } catch (e) {
      console.log("Login error:", e);
      Snackbar.show({
        text: i18n.t('common.error'),
        duration: Snackbar.LENGTH_LONG,
        backgroundColor: colors.error,
        textColor: "#ffffff",
      });
    }
  };

  const { height, width } = Dimensions.get('window');
  const isMobile = width < 768;

  const handleRegisterAs = (type: "USER" | "PROVIDER" | "AGENT") => {
    setShowSignupDrawer(false);

    switch (type) {
      case "USER":
        handleAuth0Login();   
        setCurrentView(HOME);
        break;

      case "PROVIDER":
        setShowProviderRegistration(true);
        break;

      case "AGENT":
        setShowAgentRegistration(true);
        break;
    }
  };

  const handleProviderRegistrationSuccess = () => {
    console.log("✅ Provider registration successful");
    setShowProviderRegistration(false);
    
    Snackbar.show({
      text: i18n.t('common.success'),
      duration: Snackbar.LENGTH_LONG,
      backgroundColor: colors.success,
      textColor: "#ffffff",
    });
  };

  const handleProviderBackToLogin = () => {
    setShowProviderRegistration(false);
  };

  useEffect(() => {
    console.log("🔄 AppUser changed:", appUser ? `Logged in as ${appUser.role}` : "Logged out");

    if (!appUser) {
      console.log("👤 No user detected, resetting to HOME view");
      setCurrentView(HOME);
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
          i18n.t('common.notification'),
          `${i18n.t('common.bookingRequest')} ${engagement?.service_type ?? i18n.t('common.service')}`
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
    Alert.alert(i18n.t('common.success'), i18n.t('booking.accepted'));
    setActiveToast(null);
  };

  const handleReject = (id: number) => {
    Alert.alert(i18n.t('common.rejected'), i18n.t('booking.rejected'));
    setActiveToast(null);
  };

  const handleViewChange = (view: string) => {
    if (view === "" || view === "FORCE_HOME") {
      setCurrentView(HOME);
      setShowProfileFromDashboard(false);
    } else {
      setCurrentView(view);
    }
  };

  const handleDashboardProfilePress = () => setShowProfileFromDashboard(true);
  const handleBackToDashboard = () => setShowProfileFromDashboard(false);
  const handleNotificationButtonPress = () => setShowNotificationClient(true);

  const handleHomeClick = () => {
    setCurrentView(HOME);
    setShowProfileFromDashboard(false);
  };

  const handleServicesClick = (service: string) => {
    console.log(`Service selected: ${service}`);
    if (service === "Home Cook" || service === "Cleaning Help" || service === "Caregiver") {
      setSelectedBookingType(service);
      setCurrentView("DETAILS");
    }
  };

  const handleBookingsClick = () => {
    handleViewChange(BOOKINGS);
  };

  const handleDashboardClick = () => {
    setCurrentView(DASHBOARD);
    setShowProfileFromDashboard(false);
  };

  const handleAgentDashboardClick = () => {
    setCurrentView(AGENT_DASHBOARD);
    setShowProfileFromDashboard(false);
  };

  const handleAboutClick = () => {
    Alert.alert(i18n.t('about.title'), i18n.t('about.description'));
  };

  const handleContactClick = () => {
    Alert.alert(i18n.t('contact.title'), i18n.t('contact.description'));
  };

  // FIXED: renderContent function - Now properly separates HOME and DASHBOARD
  const renderContent = () => {
    // For service providers:
    // - If currentView is HOME → Show HomePage
    // - If currentView is DASHBOARD → Show Dashboard
    // - If currentView is PROFILE → Show ProfileScreen
    // - If currentView is BOOKINGS → Show Bookings
    // - If currentView is AGENT_DASHBOARD → Show AgentDashboard
    
    switch (currentView) {
      case HOME:
        // Always show HomePage when currentView is HOME, regardless of user role
        return (
          <View style={styles.homeContainer}>
            <HomePage sendDataToParent={handleViewChange} bookingType={() => {}} />
          </View>
        );
        
      case BOOKINGS:
        return <Booking onBackToHome={() => setCurrentView(HOME)} />;
        
      case DASHBOARD:
        // Show Dashboard for service providers, but if profile view is requested from dashboard
        return showProfileFromDashboard ? (
          // <ProfileScreen onBackToHome={() => setCurrentView(HOME)} />
          <ProfileScreen/>
        ) : (
          <Dashboard 
            onProfilePress={handleDashboardProfilePress} 
            onBackToHome={() => setCurrentView(HOME)}
          />
        );
        
      case AGENT_DASHBOARD: // ADD AGENT DASHBOARD CASE
        // Show AgentDashboard for vendor/agent users
        return <AgentDashboard />;
        
      case PROFILE:
        // return <ProfileScreen onBackToHome={() => setCurrentView(HOME)} />;
        return <ProfileScreen/>;

        
      default:
        // This handles "DETAILS" and any other views
        return <DetailsView sendDataToParent={handleViewChange} selected={selectedBookingType} />;
    }
  };

  // ============= UPDATED LOADING SCREEN =============
  // This now implements the professional loading animation with LinearGradient,
  // Logo, "Loading Server" text, and a 2-second delay.
  if (showSplash) {
    return (
      <Animated.View key={`splash-${appResetKey}`} style={[styles.splashContainer, { opacity: fadeAnim }]}>
        <LinearGradient
          colors={["#0a2a66ff", "#004aadff"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientBackground}
        >
          <View style={styles.loadingContent}>
            <Image
              source={require("./assets/images/serveasologo.png")}
              style={styles.splashImage}
              resizeMode="contain"
            />
            {/* <Text style={styles.loadingServerText}>Loading Server</Text>
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#ffffff" />
            </View> */}
          </View>
        </LinearGradient>
      </Animated.View>
    );
  }

  return (
    <PaperProvider>
      <SafeAreaProvider>
        <StatusBar 
          translucent 
          backgroundColor="transparent" 
          barStyle={isDarkMode ? "light-content" : "dark-content"} 
        />
        <SafeAreaView 
          style={[
            styles.safeArea, 
            { 
              backgroundColor: colors.headerBackground,
            }
          ]} 
          edges={["top"]} 
          key={`app-${appResetKey}`}
        >
          {/* Deep linking loading overlay */}
          {showDeepLinkLoading && (
            <View style={[styles.deepLinkLoadingOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
              <View style={[styles.deepLinkLoadingContainer, { backgroundColor: colors.surface }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.deepLinkLoadingText, { color: colors.text, fontSize: fontStyles.textSize }]}>
                  {i18n.t('common.openingBooking')}
                </Text>
              </View>
            </View>
          )}

          {/* Fixed Header */}
          <View style={[styles.headerWrapper, { backgroundColor: colors.headerBackground }]}>
            <Head 
              sendDataToParent={handleViewChange} 
              bookingType={selectedBookingType}
              onAboutClick={handleAboutClick}
              onContactClick={handleContactClick}
              onLogoClick={handleHomeClick}
            />
          </View>

          {/* Scrollable Content Area */}
          <View style={[styles.contentContainer, { backgroundColor: colors.background }]}>
            {currentView === PROFILE || (currentView === DASHBOARD && showProfileFromDashboard) ? (
              <ScrollView style={styles.profileScrollView} contentContainerStyle={styles.profileScrollContent}>
                {renderContent()}
              </ScrollView>
            ) : (
              <ScrollView
                style={styles.mainScrollView}
                contentContainerStyle={[
                  styles.scrollContent,
                  (currentView === BOOKINGS || currentView === DASHBOARD || currentView === AGENT_DASHBOARD) &&
                    styles.fullScreenScrollContent,
                ]}
                contentInsetAdjustmentBehavior="automatic"
              >
                {renderContent()}
                {currentView === HOME &&
                  (!appUser || appUser?.role?.toUpperCase() === "CUSTOMER") && <Footer />}
              </ScrollView>
            )}
          </View>

          {/* Fixed Navigation Footer for Mobile */}
          {isMobile && (
            <View style={[styles.navigationFooterContainer, { backgroundColor: colors.footerBackground }]}>
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
                  if (page === PROFILE) {
                    setCurrentView(PROFILE);
                    setShowProfileFromDashboard(false);
                  } else if (page === BOOKINGS) {
                    setCurrentView(BOOKINGS);
                  } else if (page === DASHBOARD) {
                    setCurrentView(DASHBOARD);
                    setShowProfileFromDashboard(false);
                  } else if (page === AGENT_DASHBOARD) {
                    setCurrentView(AGENT_DASHBOARD);
                    setShowProfileFromDashboard(false);
                  } else if (page === HOME) {
                    setCurrentView(HOME);
                    setShowProfileFromDashboard(false);
                  }
                }}
                onSignOutComplete={handleAppRelaunchAfterSignOut}
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
            <TouchableOpacity 
              style={[styles.chatButton, { backgroundColor: colors.secondary }]} 
              onPress={() => setChatbotOpen(true)}
            >
              <Icon name="chat" size={28} color="#fff" />
            </TouchableOpacity>
          )}

          {/* Modals and Dialogs */}
          {shouldShowMobileDialog && (
            <MobileNumberDialog 
              visible={shouldShowMobileDialog}
              onClose={handleMobileDialogClose}
              customerId={appUser?.customerid}
              onSuccess={handleMobileDialogSuccess}
            />
          )}

          {/* Signup Drawer */}
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

          {/* Provider Registration - Direct component rendering */}
          {showProviderRegistration && (
            <ServiceProviderRegistration
              onBackToLogin={handleProviderBackToLogin}
              onRegistrationSuccess={handleProviderRegistrationSuccess}
            />
          )}

          {/* Agent Registration - Direct rendering, no extra Modal */}
          {showAgentRegistration && (
            <AgentRegistrationForm
              onBackToLogin={() => setShowAgentRegistration(false)}
              onClose={() => setShowAgentRegistration(false)}
            />
          )}

          {/* Notification Client Modal */}
          <Modal
            visible={showNotificationClient}
            animationType="slide"
            onRequestClose={() => setShowNotificationClient(false)}
          >
            <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
              <View style={[styles.modalHeader, { backgroundColor: colors.headerBackground, borderBottomColor: colors.border }]}>
                <TouchableOpacity style={styles.closeButton} onPress={() => setShowNotificationClient(false)}>
                  <Icon name="close" size={24} color={colors.headerText} />
                </TouchableOpacity>
                <Text style={[styles.modalTitle, { color: colors.headerText, fontSize: fontStyles.headingSize }]}>
                  {i18n.t('common.notifications')}
                </Text>
              </View>
              <NotificationClient />
            </View>
          </Modal>

          {/* Wallet Dialog */}
          <WalletDialog
            open={isWalletOpen}
            onClose={() => setIsWalletOpen(false)}
          />

          {/* Notifications Dialog */}
          <NotificationsDialog 
            visible={showNotifications} 
            onClose={() => setShowNotifications(false)} 
          />

          {/* Chatbot */}
          <Chatbot open={chatbotOpen} onClose={() => setChatbotOpen(false)} />

          {/* Booking Request Toast */}
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

// Wrap the entire app with providers
const App = () => {
  const [i18nInitialized, setI18nInitialized] = useState(false);

  useEffect(() => {
    // Initialize i18n when app starts
    initI18n().then(() => {
      setI18nInitialized(true);
    }).catch((error) => {
      console.error('Failed to initialize i18n:', error);
      // Still set initialized to true to show the app even if i18n fails
      setI18nInitialized(true);
    });
  }, []);

  if (!i18nInitialized) {
    // Show a minimal loading screen while i18n initializes
    return (
      <LinearGradient
        colors={["#0a2a66ff", "#004aadff"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradientBackground}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Image
            source={require("./assets/images/serveasologo.png")}
            style={{ width: 200, height: 200 }}
            resizeMode="contain"
          />
        </View>
      </LinearGradient>
    );
  }

  return (
    <Auth0Provider domain={config.domain} clientId={config.clientId}>
      <AppUserProvider>
        <ThemeProvider>
          <I18nextProvider i18n={i18n}>
            <MainApp />
          </I18nextProvider>
        </ThemeProvider>
      </AppUserProvider>
    </Auth0Provider>
  );
};

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
  },
  splashContainer: {
    flex: 1,
  },
  loadingContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  splashImage: { 
    width: "80%", 
    height: "30%", 
    marginBottom: 30,
  },
  loadingServerText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 40,
    letterSpacing: 0.5,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  loaderContainer: {
    marginTop: 20,
  },
  safeArea: {
    flex: 1,
  },
  headerWrapper: {
    width: "100%",
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
    marginTop: 50,
    paddingBottom: 50,
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
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
  },
  closeButton: { 
    padding: 4 
  },
  modalTitle: { 
    fontWeight: "bold", 
    marginLeft: 16, 
  },
  navigationFooterContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
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
    bottom: 80,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 2000,
  },
  // Deep linking styles
  deepLinkLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  deepLinkLoadingContainer: {
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  deepLinkLoadingText: {
    marginTop: 16,
    fontWeight: '500',
  },
});

export default App;