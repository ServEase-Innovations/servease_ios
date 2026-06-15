// App.tsx - UPDATED with proper authentication handling for both email and mobile login
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  StatusBar,
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
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Auth0Provider, useAuth0 } from "react-native-auth0";
import config from "./auth0-configuration";
import { useAuth0PostLogin } from "./src/hooks/useAuth0PostLogin";
import {
  getAuth0WebAuthOptions,
  logAuth0Error,
  runAuth0Authorize,
} from "./src/utils/auth0Config";
import { I18nextProvider } from 'react-i18next';
import i18n, { initI18n } from "./i18n";

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

import Head, { HEADER_BAR_HEIGHT } from "./src/Header/Header";
import NavigationFooter from "./src/NavigationFooter/NavigationFooter";
import {
  getMobileTabBarHeight,
} from "./src/Constants/mobileLayout";
import HomePage from "./src/HomePage/HomePage";
import DetailsView from "./src/DetailsView/DetailsView";
import Chatbot from "./src/Chatbot/Chatbot";
import ChatbotButton from "./src/Chatbot/ChatbotButton";
import Booking, { BookingRef } from "./src/UserProfile/Bookings";
import Dashboard from "./src/ServiceProvider/Dashboard";
import ProfileScreen from "./src/UserProfile/NewProfileScreen";
import AgentDashboard from "./src/Agent/AgentDashboard";
import WalletPage from "./src/UserProfile/WalletDialog";
import Settings from "./src/Settings/Settings";
import { BOOKINGS, DASHBOARD, PROFILE, SETTINGS, HOME, AGENT_DASHBOARD, WALLET, DETAILS } from "./src/Constants/pagesConstants";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import NotificationClient from "./src/NotificationClient/NotificationClient";
import BookingRequestToast from "./src/Notifications/BookingRequestToast";
import { BookingRequestPayload } from "./src/Notifications/inAppNotificationUtils";
import {
  acceptEngagement,
  dismissProviderNewBookingNotifications,
  isTerminalAcceptFailure,
  parseAcceptEngagementError,
  parseEngagementId,
  resolveServiceProviderId,
} from "./src/services/engagementService";
import {
  clearProviderBookingEngagement,
  disconnectProviderBookingSocket,
  useProviderBookingSocket,
} from "./src/hooks/useProviderBookingSocket";
import type { PushUserContext } from "./src/types/push";
import {
  setupPushNotifications,
  unregisterPushNotifications,
} from "./src/services/pushApi";
import { AppUserProvider, useAppUser } from "./src/context/AppUserContext";
import { useCustomerMobileCheck } from "./src/hooks/useCustomerMobileCheck";
import {
  clearCustomer,
  fetchCustomerDetails,
  setHasMobileNumber,
} from "./src/features/customerSlice";
import { clearMobileAuthStorage } from "./src/utils/signOutSession";
import axios from "axios";
import { useDispatch } from "react-redux";
import { add } from "./src/features/pricingSlice";
import MobileNumberDialog from "./src/UserProfile/MobileNumberDialog";
import NotificationsDialog from "./src/Notifications/NotificationsPage";
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from "react-native-paper";
import SignupDrawer from "./src/SignupDrawer/SignupDrawer";
import ServiceProviderRegistration from "./src/Registration/ServiceProviderRegistration";
import AgentRegistrationForm from "./src/Agent/AgentRegistrationForm";
import Snackbar from "react-native-snackbar";
import BrandLoadingScreen from "./src/common/BrandLoadingScreen";

interface DeepLinkData {
  openBookings: string;
  customerId: string | null;
  bookingId: string | null;
  action: string | null;
}

// Main App component with theme
const MainApp = () => {
  const { colors, isDarkMode, fontSize, compactMode } = useTheme();
  const insets = useSafeAreaInsets();
  const safeBottom = Number.isFinite(insets.bottom) ? insets.bottom : 0;

  const paperTheme = useMemo(
    () =>
      isDarkMode
        ? {
            ...MD3DarkTheme,
            colors: {
              ...MD3DarkTheme.colors,
              primary: colors.primary,
              secondary: colors.secondary,
              background: colors.background,
              surface: colors.surface,
              error: colors.error,
            },
          }
        : {
            ...MD3LightTheme,
            colors: {
              ...MD3LightTheme.colors,
              primary: colors.primary,
              secondary: colors.secondary,
              background: colors.background,
              surface: colors.surface,
              error: colors.error,
            },
          },
    [isDarkMode, colors.primary, colors.secondary, colors.background, colors.surface, colors.error]
  );

  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [currentView, setCurrentView] = useState<string>(HOME);
  const [settingsReturnView, setSettingsReturnView] = useState<string>(HOME);
  const [selectedBookingType, setSelectedBookingType] = useState("");
  const [showProfileFromDashboard, setShowProfileFromDashboard] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [isFirstLaunch, setIsFirstLaunch] = useState(true);
  const [activeToast, setActiveToast] = useState<BookingRequestPayload | null>(null);
  const [acceptingEngagementId, setAcceptingEngagementId] = useState<number | null>(null);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [showNotificationClient, setShowNotificationClient] = useState(false);
  const [mobileDialogOpen, setMobileDialogOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const [showSignupDrawer, setShowSignupDrawer] = useState(false);
  const [showProviderRegistration, setShowProviderRegistration] = useState(false);
  const [showAgentRegistration, setShowAgentRegistration] = useState(false);
  const [appResetKey, setAppResetKey] = useState(Date.now());
  const [isResetting, setIsResetting] = useState(false);
  
  // State to trigger dropdown closing in Header and LocationSelector
  const [closeAllDropdowns, setCloseAllDropdowns] = useState(false);
  
  // Ref for Booking component to enable double-tap refresh
  const bookingsRef = useRef<BookingRef>(null);
  
  // ============= DEEP LINKING STATES =============
  const [deepLinkProcessed, setDeepLinkProcessed] = useState(false);
  const [processingDeepLink, setProcessingDeepLink] = useState(false);
  const [pendingDeepLink, setPendingDeepLink] = useState<DeepLinkData | null>(null);
  const [showDeepLinkLoading, setShowDeepLinkLoading] = useState(false);

  const dispatch = useDispatch();
  const { appUser, setAppUser, clearAppUser, isLoading: isUserLoading } = useAppUser();
  const { showMobileDialog } = useCustomerMobileCheck();
  const { authorize, getCredentials, clearSession, cancelWebAuth, user } = useAuth0();

  useAuth0PostLogin({
    onNavigate: (view) => {
      if (view) {
        setCurrentView(view);
      }
    },
  });

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
  const shouldRenderWithoutParentScroll =
    currentView === HOME ||
    currentView === DETAILS ||
    currentView === BOOKINGS ||
    currentView === WALLET ||
    currentView === SETTINGS ||
    currentView === DASHBOARD ||
    currentView === AGENT_DASHBOARD ||
    currentView === PROFILE;

  // Function to handle outside touch and close dropdowns
  const handleOutsideTouch = useCallback(() => {
    setCloseAllDropdowns(true);
    setTimeout(() => {
      setCloseAllDropdowns(false);
    }, 100);
  }, []);

  // ============= DEEP LINKING IMPLEMENTATION =============

  const processDeepLink = (openBookings: string, customerId: string | null, bookingId: string | null, action: string | null = 'open') => {
    setProcessingDeepLink(true);
    setShowDeepLinkLoading(true);
    
    if (customerId) {
      global.deepLinkCustomerId = customerId;
      console.log(`📦 Will show ALL bookings for customer #${customerId}`);
    }
    
    if (bookingId) {
      global.deepLinkBookingId = bookingId;
      console.log(`📦 Will open specific booking #${bookingId}`);
    }
    
    global.deepLinkTimestamp = Date.now().toString();
    global.deepLinkAction = 'drawer';
    console.log(`📦 Default action set to 'drawer' for automatic drawer opening`);
    
    setCurrentView(BOOKINGS);
    setDeepLinkProcessed(true);
    setPendingDeepLink(null);
    setProcessingDeepLink(false);
    
    setTimeout(() => {
      setShowDeepLinkLoading(false);
    }, 1000);
    
    global.pendingDeepLinkCustomerId = null;
    global.pendingDeepLinkBookingId = null;
    global.pendingDeepLinkTimestamp = null;
    global.pendingDeepLinkAction = null;
    
    console.log('✅ Deep link processed successfully with automatic drawer opening');
  };

  const checkDeepLink = async (url: string | null) => {
    if (!url || deepLinkProcessed) return;

    console.log('=== DEEP LINK CHECK ===');
    console.log('Current URL:', url);
    
    try {
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

      if (openBookings === 'true') {
        if (appUser) {
          console.log('✅ User authenticated, processing deep link now');
          processDeepLink(openBookings, customerId, bookingId, action);
        } else {
          console.log('🔐 User not authenticated, storing deep link for after login');
          
          setPendingDeepLink({
            openBookings,
            customerId,
            bookingId,
            action
          });
          
          if (customerId) {
            global.pendingDeepLinkCustomerId = customerId;
          }
          if (bookingId) {
            global.pendingDeepLinkBookingId = bookingId;
          }
          global.pendingDeepLinkTimestamp = Date.now().toString();
          
          const actionToStore = action || 'drawer';
          global.pendingDeepLinkAction = actionToStore;
          console.log(`📦 Stored pending action: ${actionToStore}`);
          
          setShowSignupDrawer(true);
        }
      }
    } catch (error) {
      console.error('Error parsing deep link URL:', error);
    }
  };

  useEffect(() => {
    const getInitialURL = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        await checkDeepLink(initialUrl);
      }
    };

    getInitialURL();

    const subscription = Linking.addEventListener('url', ({ url }) => {
      checkDeepLink(url);
    });

    return () => {
      subscription.remove();
    };
  }, [appUser, deepLinkProcessed]);

  useEffect(() => {
    if (appUser && !deepLinkProcessed) {
      if (pendingDeepLink) {
        console.log('🔄 User just logged in, processing pending deep link from state');
        processDeepLink(
          pendingDeepLink.openBookings, 
          pendingDeepLink.customerId, 
          pendingDeepLink.bookingId, 
          pendingDeepLink.action
        );
      } else {
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
    if (isResetting) {
      console.log("⚠️ App reset already in progress...");
      return;
    }

    setIsResetting(true);
    
    try {
      console.log("🔄 ===== STARTING COMPLETE APP RELAUNCH =====");
      
      await clearMobileAuthStorage();

      try {
        await clearSession({ federated: true }, getAuth0WebAuthOptions());
        console.log("✅ Auth0 session cleared");
      } catch (authError) {
        console.log("⚠️ Auth0 session clear may have already been called:", authError);
      }
      
      console.log("🔄 Resetting all app states...");
      setCurrentView(HOME);
      setChatbotOpen(false);
      setSelectedBookingType("");
      setShowProfileFromDashboard(false);
      setShowNotificationClient(false);
      setMobileDialogOpen(false);
      setShowNotifications(false);
      dispatch(clearCustomer());
      setShowSignupDrawer(false);
      setShowProviderRegistration(false);
      setShowAgentRegistration(false);
      setActiveToast(null);
      
      setDeepLinkProcessed(false);
      setProcessingDeepLink(false);
      setPendingDeepLink(null);
      setShowDeepLinkLoading(false);
      
      global.deepLinkCustomerId = null;
      global.deepLinkBookingId = null;
      global.deepLinkTimestamp = null;
      global.deepLinkAction = null;
      global.pendingDeepLinkCustomerId = null;
      global.pendingDeepLinkBookingId = null;
      global.pendingDeepLinkTimestamp = null;
      global.pendingDeepLinkAction = null;
      
      if (clearAppUser) {
        await clearAppUser();
        console.log("✅ AppUser context cleared");
      }
      
      disconnectProviderBookingSocket();
      await unregisterPushNotifications();
      console.log("✅ Provider booking socket disconnected");
      
      const newKey = Date.now();
      setAppResetKey(newKey);
      console.log(`✅ App reset key updated: ${newKey}`);
      
      setShowSplash(true);
      fadeAnim.setValue(1);
      
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
      setAppResetKey(Date.now());
      setCurrentView(HOME);
      setShowSplash(false);
      setIsResetting(false);
    }
  };

  const handleAuth0Login = async () => {
    try {
      await runAuth0Authorize(authorize, cancelWebAuth);

      const credentials = await getCredentials();
      console.log("Login successful", credentials);
    } catch (e) {
      logAuth0Error("login failed", e);
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
  const mobileTabBarClearance = isMobile ? getMobileTabBarHeight(safeBottom) : 0;
  const needsMobileTabBarScrollInset =
    isMobile && currentView !== BOOKINGS && currentView !== WALLET && currentView !== SETTINGS;

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

  // Monitor appUser changes
  useEffect(() => {
    console.log("🔄 AppUser changed in App.tsx:", appUser ? `Logged in as ${appUser.role} - ${appUser.name}` : "Logged out");

    if (!appUser) {
      console.log("👤 No user detected, resetting to HOME view");
      dispatch(clearCustomer());
      setCurrentView(HOME);
      setShowProfileFromDashboard(false);
      setShowNotificationClient(false);
      setShowNotifications(false);
    } else {
      console.log("✅ User is logged in, role:", appUser.role);
      // If user is logged in and has a role, we might want to navigate to appropriate dashboard
      if (appUser.role === "SERVICE_PROVIDER" && currentView === HOME) {
        // Optional: Auto-navigate to dashboard for service providers
        // setCurrentView(DASHBOARD);
      } else if (appUser.role === "VENDOR" && currentView === HOME) {
        // Optional: Auto-navigate to agent dashboard for vendors
        // setCurrentView(AGENT_DASHBOARD);
      }
    }
  }, [appUser]);

  useEffect(() => {
    if (isUserLoading) return;
    const ctx: PushUserContext | null = appUser
      ? {
          email: appUser.email || user?.email,
          role: appUser.role,
          userId: appUser.id || appUser.userId,
          serviceProviderId: appUser.serviceProviderId,
          customerId: appUser.customerid || appUser.customerId,
        }
      : null;
    void setupPushNotifications(ctx);
  }, [
    appUser?.id,
    appUser?.userId,
    appUser?.email,
    appUser?.role,
    appUser?.customerid,
    appUser?.customerId,
    appUser?.serviceProviderId,
    isUserLoading,
    user?.email,
  ]);

  useEffect(() => {
    setMobileDialogOpen(showMobileDialog);
  }, [showMobileDialog]);

  const handleMobileDialogSuccess = () => {
    const customerId = appUser?.customerid ?? appUser?.customerId;
    if (customerId != null && customerId !== "") {
      dispatch(fetchCustomerDetails(String(customerId)) as never);
    }
    dispatch(setHasMobileNumber(true));
    setMobileDialogOpen(false);
  };

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
    if (isUserLoading || !appUser) return;
    if (String(appUser.role || "").toUpperCase() !== "SERVICE_PROVIDER") return;
    if (resolveServiceProviderId(appUser)) return;

    const email = appUser.email;
    if (!email) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get(
          `https://utils-ndt3.onrender.com/customer/check-email?email=${encodeURIComponent(email)}`
        );
        if (cancelled) return;
        if (res.data?.user_role === "SERVICE_PROVIDER" && res.data?.id != null) {
          setAppUser({
            ...appUser,
            role: "SERVICE_PROVIDER",
            serviceProviderId: res.data.id,
          });
          console.log("[sp-socket] backfilled serviceProviderId:", res.data.id);
        }
      } catch (e) {
        console.warn("[sp-socket] could not backfill serviceProviderId", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [appUser, isUserLoading, setAppUser]);

  const onProviderBookingRequest = useCallback((payload: BookingRequestPayload) => {
    setAcceptError(null);
    setActiveToast(payload);
  }, []);

  const onProviderBookingClosed = useCallback((engagementId: number) => {
    setActiveToast((cur) => {
      if (!cur) return null;
      const curId = parseEngagementId(cur.engagement_id);
      return curId === engagementId ? null : cur;
    });
  }, []);

  const activeToastEngagementId = activeToast
    ? parseEngagementId(activeToast.engagement_id)
    : null;

  useProviderBookingSocket({
    appUser,
    isUserLoading,
    onBookingRequest: onProviderBookingRequest,
    onBookingClosed: onProviderBookingClosed,
    activeEngagementId: activeToastEngagementId,
  });

  useEffect(() => {
    if (activeToast) {
      setAcceptError(null);
    }
  }, [activeToast?.engagement_id]);

  const handleAccept = async (engagementId: number) => {
    const eid = parseEngagementId(engagementId);
    if (eid == null) {
      const msg = "Invalid booking id.";
      setAcceptError(msg);
      Snackbar.show({
        text: msg,
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: "#f44336",
      });
      return;
    }
    setAcceptError(null);
    setAcceptingEngagementId(eid);
    const providerId = resolveServiceProviderId(appUser);
    try {
      const result = await acceptEngagement(eid, appUser);
      if (providerId != null) {
        await dismissProviderNewBookingNotifications(eid, providerId);
      }
      clearProviderBookingEngagement(eid);
      setActiveToast(null);
      setAcceptError(null);
      Snackbar.show({
        text: result.message,
        duration: Snackbar.LENGTH_LONG,
        backgroundColor: "#4caf50",
      });
    } catch (err) {
      const msg = parseAcceptEngagementError(err);
      if (isTerminalAcceptFailure(msg)) {
        if (providerId != null) {
          await dismissProviderNewBookingNotifications(eid, providerId);
        }
        clearProviderBookingEngagement(eid);
        setActiveToast(null);
        setAcceptError(null);
      } else {
        setAcceptError(msg);
      }
      Snackbar.show({
        text: msg,
        duration: Snackbar.LENGTH_LONG,
        backgroundColor: "#f44336",
      });
      console.error("Failed to accept engagement", err);
    } finally {
      setAcceptingEngagementId(null);
    }
  };

  const handleReject = async (engagementId: number) => {
    const eid = parseEngagementId(engagementId);
    const providerId = resolveServiceProviderId(appUser);
    if (eid != null && providerId != null) {
      await dismissProviderNewBookingNotifications(eid, providerId);
      clearProviderBookingEngagement(eid);
    }
    setActiveToast(null);
    setAcceptError(null);
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
    console.log(`Service selected from menu: ${service}`);
    setCurrentView(HOME);
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

  // renderContent function with ref forwarding for Booking
  const renderContent = () => {
    switch (currentView) {
      case HOME:
        return (
          <View style={styles.homeContainer}>
            <HomePage sendDataToParent={handleViewChange} bookingType={() => {}} />
          </View>
        );
        
      case BOOKINGS:
        return (
          <Booking
            ref={bookingsRef}
            onBackToHome={() => setCurrentView(HOME)}
            onNavigateToDetails={() => setCurrentView(DETAILS)}
          />
        );
        
      case WALLET:
        return <WalletPage onBack={() => setCurrentView(HOME)} />;
        
      case DASHBOARD:
        return showProfileFromDashboard ? (
          <ProfileScreen
            onBack={() => setShowProfileFromDashboard(false)}
            onNavigateToBookings={() => setCurrentView(BOOKINGS)}
            onOpenSettings={() => {
              setSettingsReturnView(DASHBOARD);
              setCurrentView(SETTINGS);
            }}
            onContact={handleContactClick}
            onSignOutComplete={handleAppRelaunchAfterSignOut}
          />
        ) : (
          <Dashboard 
            onProfilePress={handleDashboardProfilePress} 
            onBackToHome={() => setCurrentView(HOME)}
          />
        );
        
      case AGENT_DASHBOARD:
        return <AgentDashboard />;
        
      case PROFILE:
        return (
          <ProfileScreen
            onBack={() => setCurrentView(HOME)}
            onNavigateToBookings={() => setCurrentView(BOOKINGS)}
            onOpenSettings={() => {
              setSettingsReturnView(PROFILE);
              setCurrentView(SETTINGS);
            }}
            onContact={handleContactClick}
            onSignOutComplete={handleAppRelaunchAfterSignOut}
          />
        );

      case SETTINGS:
        return <Settings onBack={() => setCurrentView(settingsReturnView)} />;
        
      default:
        return <DetailsView sendDataToParent={handleViewChange} selected={selectedBookingType} />;
    }
  };

  // Loading Screen - Check for user loading state
  if (isUserLoading || showSplash) {
    return (
      <Animated.View key={`splash-${appResetKey}`} style={[styles.splashContainer, { opacity: fadeAnim }]}>
        <BrandLoadingScreen />
      </Animated.View>
    );
  }

  return (
    <PaperProvider theme={paperTheme}>
        <StatusBar 
          translucent 
          backgroundColor="transparent" 
          barStyle={isDarkMode ? "light-content" : "dark-content"} 
        />
        <SafeAreaView
          style={[
            styles.safeArea,
            {
              backgroundColor:
                currentView === BOOKINGS || currentView === WALLET || currentView === PROFILE || currentView === SETTINGS
                  ? colors.background
                  : colors.chromeEnd,
            },
          ]}
          edges={["top"]}
          key={`app-${appResetKey}`}
        >
          <View style={{ flex: 1 }}>
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

              {/* Bookings uses its own in-screen header — avoid double header / layout shift */}
              {currentView !== BOOKINGS && currentView !== WALLET && currentView !== PROFILE && currentView !== SETTINGS && (
                <View style={[styles.headerWrapper, { backgroundColor: colors.chromeEnd }]}>
                  <Head
                    sendDataToParent={handleViewChange}
                    bookingType={selectedBookingType}
                    onAboutClick={handleAboutClick}
                    onContactClick={handleContactClick}
                    onLogoClick={handleHomeClick}
                    closeDropdowns={closeAllDropdowns}
                    onSignOutComplete={handleAppRelaunchAfterSignOut}
                  />
                </View>
              )}

              {/* Scrollable Content Area */}
              <View
                style={[
                  styles.contentContainer,
                  {
                    backgroundColor:
                      currentView === HOME ? colors.chromeEnd : colors.background,
                  },
                  (currentView === BOOKINGS ||
                    currentView === WALLET ||
                    currentView === PROFILE ||
                    currentView === SETTINGS ||
                    (currentView === DASHBOARD && showProfileFromDashboard)) &&
                    styles.contentContainerFullScreen,
                ]}
              >
                {shouldRenderWithoutParentScroll ? (
                  <View
                    style={[
                      styles.mainScrollView,
                      needsMobileTabBarScrollInset && {
                        paddingBottom: mobileTabBarClearance,
                      },
                    ]}
                  >
                    {renderContent()}
                  </View>
                ) : (
                  <ScrollView
                    style={styles.mainScrollView}
                    contentContainerStyle={[
                      styles.scrollContent,
                      isMobile && styles.scrollContentMobile,
                      needsMobileTabBarScrollInset && {
                        paddingBottom: mobileTabBarClearance,
                      },
                      (currentView === BOOKINGS || currentView === DASHBOARD || currentView === AGENT_DASHBOARD) &&
                        styles.fullScreenScrollContent,
                    ]}
                    contentInsetAdjustmentBehavior="automatic"
                    keyboardShouldPersistTaps="handled"
                    nestedScrollEnabled
                  >
                    {renderContent()}
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
                    auth0User={user}
                    appUser={appUser}
                    bookingType={selectedBookingType}
                    onOpenSignup={() => setShowSignupDrawer(true)}
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
                      } else if (page === WALLET) {
                        setCurrentView(WALLET);
                        setShowProfileFromDashboard(false);
                      } else if (page === HOME) {
                        setCurrentView(HOME);
                        setShowProfileFromDashboard(false);
                      } else if (page === SETTINGS) {
                        setSettingsReturnView(currentView);
                        setCurrentView(SETTINGS);
                      }
                    }}
                    onSignOutComplete={handleAppRelaunchAfterSignOut}
                    bookingsRef={bookingsRef}
                  />

                </View>
              )}
            </View>

          {!chatbotOpen && isMobile && (
            <ChatbotButton
              bottomInset={mobileTabBarClearance + 20}
              onPress={() => setChatbotOpen(true)}
            />
          )}

          {/* Modals and Dialogs */}
          {mobileDialogOpen && (appUser?.customerid ?? appUser?.customerId) && (
            <MobileNumberDialog
              visible={mobileDialogOpen}
              onClose={() => setMobileDialogOpen(false)}
              customerId={appUser?.customerid ?? appUser?.customerId}
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

          {/* Notifications Dialog */}
          <NotificationsDialog 
            visible={showNotifications} 
            onClose={() => setShowNotifications(false)} 
          />

          {/* Chatbot */}
          <Chatbot open={chatbotOpen} onClose={() => setChatbotOpen(false)} />

          {/* SP on-demand booking: Accept / Decline popup (not the header bell) */}
          {activeToast && (
            <BookingRequestToast
              engagement={activeToast}
              onAccept={handleAccept}
              onReject={handleReject}
              onClose={() => {
                const eid = parseEngagementId(activeToast.engagement_id);
                const providerId = resolveServiceProviderId(appUser);
                if (eid != null && providerId != null) {
                  void dismissProviderNewBookingNotifications(eid, providerId).finally(() => {
                    clearProviderBookingEngagement(eid);
                  });
                }
                setActiveToast(null);
                setAcceptError(null);
              }}
              visible={!!activeToast}
              actionBusy={
                parseEngagementId(activeToast.engagement_id) === acceptingEngagementId
              }
              acceptError={acceptError}
            />
          )}
        </SafeAreaView>
    </PaperProvider>
  );
};

// Wrap the entire app with providers
const App = () => {
  const [i18nInitialized, setI18nInitialized] = useState(false);

  useEffect(() => {
    initI18n().then(() => {
      setI18nInitialized(true);
    }).catch((error) => {
      console.error('Failed to initialize i18n:', error);
      setI18nInitialized(true);
    });
  }, []);

  if (!i18nInitialized) {
    return <BrandLoadingScreen subtitle="Preparing language and app setup for you" />;
  }

  return (
    <Auth0Provider domain={config.domain} clientId={config.clientId} useDPoP={false}>
      <AppUserProvider>
        <ThemeProvider>
          <I18nextProvider i18n={i18n}>
            <SafeAreaProvider>
              <MainApp />
            </SafeAreaProvider>
          </I18nextProvider>
        </ThemeProvider>
      </AppUserProvider>
    </Auth0Provider>
  );
};

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  headerWrapper: {
    width: "100%",
    height: HEADER_BAR_HEIGHT,
    zIndex: 50,
    overflow: "visible",
  },
  homeContainer: { 
    flex: 1 
  },
  contentContainer: {
    flex: 1,
    marginTop: 0,
  },
  contentContainerFullScreen: {
    marginTop: 0,
    paddingBottom: 0,
  },
  mainScrollView: { 
    flex: 1 
  },
  scrollContent: { 
    flexGrow: 1, 
    justifyContent: "space-between", 
    minHeight: "100%",
  },
  scrollContentMobile: {
    flexGrow: 0,
    justifyContent: "flex-start",
    minHeight: undefined,
  },
  fullScreenScrollContent: { 
    paddingBottom: 0 
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
    width: "100%",
    zIndex: 100,
    backgroundColor: "transparent",
  },
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