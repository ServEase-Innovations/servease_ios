// NavigationFooter.tsx - Updated with proper authentication handling
import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import FeatherIcon from "react-native-vector-icons/Feather";
import NotificationsDialog from "../Notifications/NotificationsPage";
import { useAuth0 } from "react-native-auth0";
import { useDispatch } from "react-redux";
import { remove } from "../features/userSlice";
import Snackbar from "react-native-snackbar";
import { PROFILE, BOOKINGS, DASHBOARD, HOME, AGENT_DASHBOARD, WALLET } from "../Constants/pagesConstants";
import ProfileMenuSheet from "../ProfileMenuSheet/ProfileMenuSheet";
import { useTranslation } from 'react-i18next';
import Settings from "../Settings/Settings";
import Login from "../Login/Login";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from "../Settings/ThemeContext";

type MobileTab = {
  key: string;
  label: string;
  onPress: () => void;
  iconName?: string;
  isAccount?: boolean;
  variant?: "default" | "destructive";
  disabled?: boolean;
};

import {
  MOBILE_TAB_BAR_CONTENT_HEIGHT,
  MOBILE_TAB_BAR_EDGE_PAD,
  getMobileTabBarHeight,
} from "../Constants/mobileLayout";

export {
  MOBILE_TAB_BAR_CONTENT_HEIGHT,
  MOBILE_TAB_BAR_EDGE_PAD,
  getMobileTabBarHeight,
};

interface NavigationFooterProps {
  onHomeClick: () => void;
  onBookingsClick: () => void;
  onDashboardClick: () => void;
  onAboutClick: () => void;
  onContactClick: () => void;
  onOpenSignup: () => void;
  auth0User: any;
  appUser: any;
  bookingType?: string;
  onProfileClick?: () => void;
  onNavigateToPage: (page: string) => void;
  activePage: string;
  onSignOutComplete?: () => Promise<void>;
  bookingsRef?: React.MutableRefObject<any>;
}

const { width } = Dimensions.get("window");
const isMobile = width < 768;

const NavigationFooter: React.FC<NavigationFooterProps> = ({
  onHomeClick,
  onBookingsClick,
  onDashboardClick,
  onAboutClick,
  onContactClick,
  onOpenSignup,
  auth0User,
  appUser,
  bookingType = "",
  onProfileClick,
  onNavigateToPage,
  activePage,
  onSignOutComplete,
  bookingsRef
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isProfileMenuVisible, setIsProfileMenuVisible] = useState(false);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [lastTap, setLastTap] = useState<number>(0);
  const [showAuthChoiceModal, setShowAuthChoiceModal] = useState(false);
  const [showPhoneLoginModal, setShowPhoneLoginModal] = useState(false);
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const safeBottom = Number.isFinite(insets.bottom) ? insets.bottom : 0;
  const { colors, isDarkMode } = useTheme();

  const { authorize, clearSession, getCredentials } = useAuth0();
  const dispatch = useDispatch();

  // FIXED: Check if user is authenticated - either via Auth0 OR via appUser with token
  const isAuthenticated = !!(auth0User || (appUser && appUser.token));
  
  // FIXED: Role checks - use appUser.role as the source of truth
  const getUserRole = () => {
    if (appUser && appUser.role) {
      return appUser.role;
    }
    return null;
  };
  
  const userRole = getUserRole();
  const isCustomer = userRole === "CUSTOMER";
  const isServiceProvider = userRole === "SERVICE_PROVIDER";
  const isVendor = userRole === "VENDOR";

  // Log for debugging
  useEffect(() => {
    console.log("NavigationFooter - State updated:", {
      isAuthenticated,
      hasAuth0: !!auth0User,
      hasAppUser: !!appUser,
      hasToken: !!(appUser && appUser.token),
      userRole,
      isCustomer,
      isServiceProvider,
      isVendor
    });
  }, [auth0User, appUser, isAuthenticated, userRole, isCustomer, isServiceProvider, isVendor]);

  const handleDoubleTapRefresh = useCallback(() => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (lastTap && (now - lastTap) < DOUBLE_TAP_DELAY) {
      console.log("🔁 Double tap detected on Bookings button - Forcing refresh...");
      
      Snackbar.show({
        text: "Refreshing bookings...",
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: "#3b82f6",
        textColor: "#ffffff",
      });
      
      if (bookingsRef?.current && bookingsRef.current.forceRefresh) {
        bookingsRef.current.forceRefresh();
      } else if (bookingsRef?.current && bookingsRef.current.refreshBookings) {
        bookingsRef.current.refreshBookings();
      } else {
        console.log("⚠️ Bookings ref not available, just navigating");
        if (isAuthenticated && isCustomer) {
          onNavigateToPage(BOOKINGS);
        } else if (!isAuthenticated) {
          handleShowAuthChoice();
        } else {
          onBookingsClick();
        }
      }
      
      setLastTap(0);
    } else {
      setLastTap(now);
      console.log("📍 Single tap on Bookings button - Navigating...");
      if (isAuthenticated && isCustomer) {
        onNavigateToPage(BOOKINGS);
      } else if (!isAuthenticated) {
        handleShowAuthChoice();
      } else {
        onBookingsClick();
      }
      setIsProfileMenuVisible(false);
    }
  }, [lastTap, isAuthenticated, isCustomer, onNavigateToPage, onBookingsClick]);

  const handleShowAuthChoice = () => {
    setShowAuthChoiceModal(true);
  };

  const handlePhoneLogin = () => {
    setShowAuthChoiceModal(false);
    setShowPhoneLoginModal(true);
  };

  const handleEmailLogin = async () => {
    setShowAuthChoiceModal(false);
    try {
      await authorize({
        scope: "openid profile email",
        redirectUrl: "com.serveaso://dev-plavkbiy7v55pbg4.us.auth0.com/android/com.serveaso/callback",
      });

      const credentials = await getCredentials();
      console.log("Login successful");
      
      Snackbar.show({
        text: t('navigation.loggedInSuccess'),
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: "#10b981",
        textColor: "#ffffff",
      });
    } catch (e) {
      console.log("Login error:", e);
      Snackbar.show({
        text: t('navigation.loginFailed'),
        duration: Snackbar.LENGTH_LONG,
        backgroundColor: "#ef4444",
        textColor: "#ffffff",
      });
    }
  };

  const handleProfileButtonClick = () => {
    if (isAuthenticated) {
      setIsProfileMenuVisible(true);
    } else {
      handleShowAuthChoice();
    }
  };

  const handleHomeButtonClick = () => {
    onHomeClick();
    setIsProfileMenuVisible(false);
  };

  const handleBookingsButtonClick = () => {
    if (isAuthenticated && isCustomer) {
      onNavigateToPage(BOOKINGS);
    } else if (!isAuthenticated) {
      handleShowAuthChoice();
    } else {
      onBookingsClick();
    }
    setIsProfileMenuVisible(false);
  };

  const handleDashboardButtonClick = () => {
    if (isAuthenticated && isServiceProvider) {
      onNavigateToPage(DASHBOARD);
    } else if (!isAuthenticated) {
      handleShowAuthChoice();
    } else {
      onDashboardClick();
    }
    setIsProfileMenuVisible(false);
  };

  const handleAgentDashboardButtonClick = () => {
    if (isAuthenticated && isVendor) {
      onNavigateToPage(AGENT_DASHBOARD);
    } else if (!isAuthenticated) {
      handleShowAuthChoice();
    }
    setIsProfileMenuVisible(false);
  };

  const handleWalletClick = () => {
    if (isAuthenticated && isCustomer) {
      onNavigateToPage(WALLET);
    } else if (!isAuthenticated) {
      handleShowAuthChoice();
    }
    setIsProfileMenuVisible(false);
  };

  const handleSignOut = async () => {
    if (isSigningOut) {
      console.log("⏳ Sign out already in progress...");
      return;
    }

    setIsSigningOut(true);
    setIsProfileMenuVisible(false);
    
    try {
      console.log("🚪 Sign out initiated...");
      
      Snackbar.show({
        text: t('navigation.signingOutMsg'),
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: "#3b82f6",
        textColor: "#ffffff",
      });

      // Clear token from AsyncStorage for mobile login users
      await AsyncStorage.multiRemove(['token', 'userRole', '@app_user_data']);

      // Clear Auth0 session if it exists
      try {
        await clearSession({
          returnToUrl: "com.serveaso://logout",
        });
      } catch (e) {
        console.log("No Auth0 session to clear or error clearing:", e);
      }

      dispatch(remove());
      
      if (onSignOutComplete) {
        await onSignOutComplete();
      }
      
      console.log("✅ Sign out completed, app relaunched");
      
    } catch (e) {
      console.log("❌ Log out error:", e);
      Snackbar.show({
        text: t('navigation.signOut'),
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: "#ef4444",
        textColor: "#ffffff",
      });
      setIsSigningOut(false);
    }
  };

  const handleProfileMenuNavigation = (page: string) => {
    setIsProfileMenuVisible(false);
    onNavigateToPage(page);
  };

  const handleSettingsOpen = () => {
    setIsSettingsVisible(true);
  };

  const handlePhoneLoginSuccess = (data: string) => {
    console.log("Phone login success callback received:", data);
    setShowPhoneLoginModal(false);
    
    Snackbar.show({
      text: "Login successful!",
      duration: Snackbar.LENGTH_SHORT,
      backgroundColor: "#10b981",
      textColor: "#ffffff",
    });
    
    // Force a small delay to ensure context updates are processed
    setTimeout(() => {
      console.log("Phone login completed, navigation should update now");
    }, 500);
  };

  const renderCompactAccountAvatar = () => {
    const avatarSize = 24;

    if (!auth0User && appUser?.name) {
      return (
        <View style={[styles.compactAvatarInner, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}>
          <Text style={styles.compactAvatarInitial}>
            {appUser.name.charAt(0).toUpperCase()}
          </Text>
        </View>
      );
    }

    if (!auth0User) {
      return <FeatherIcon name="user" size={20} color={isDarkMode ? "#94a3b8" : "#64748b"} />;
    }

    if (auth0User.picture) {
      return (
        <Image
          source={{ uri: auth0User.picture }}
          style={{ width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }}
        />
      );
    }

    return (
      <View style={[styles.compactAvatarInner, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}>
        <Text style={styles.compactAvatarInitial}>
          {auth0User.name ? auth0User.name.charAt(0).toUpperCase() : "U"}
        </Text>
      </View>
    );
  };

  const renderMobileTabIcon = (tab: MobileTab, isActive: boolean) => {
    const iconMuted = isDarkMode ? "#94a3b8" : "#64748b";
    const iconActiveColor = colors.primary;

    if (tab.isAccount) {
      return (
        <View
          style={[
            styles.compactAvatarRing,
            isDarkMode && styles.compactAvatarRingDark,
            isActive && styles.compactAvatarRingActive,
            isActive && isDarkMode && styles.compactAvatarRingActiveDark,
          ]}
        >
          {renderCompactAccountAvatar()}
        </View>
      );
    }

    const iconColor =
      tab.variant === "destructive"
        ? isActive
          ? "#b91c1c"
          : "#ef4444"
        : isActive
          ? iconActiveColor
          : iconMuted;

    return (
      <View style={styles.navIconSlot}>
        <MaterialIcon name={tab.iconName ?? "circle"} size={24} color={iconColor} />
      </View>
    );
  };

  const renderUserAvatar = (isMobileView: boolean = false) => {
    // For mobile login users, show a default avatar
    if (!auth0User && appUser && appUser.name) {
      return (
        <View style={isMobileView ? styles.userAvatarContainerMobile : styles.userAvatarContainer}>
          <View style={isMobileView ? styles.userAvatarPlaceholderMobile : styles.userAvatarPlaceholder}>
            <Text style={isMobileView ? styles.userAvatarPlaceholderTextMobile : styles.userAvatarPlaceholderText}>
              {appUser.name ? appUser.name.charAt(0).toUpperCase() : "U"}
            </Text>
          </View>
          {!isMobileView && (
            <View style={styles.userInfo}>
              <Text style={styles.userName} numberOfLines={1}>
                {appUser.name?.split(' ')[0] || "User"}
              </Text>
              <FeatherIcon name="chevron-down" size={14} color="#fff" />
            </View>
          )}
        </View>
      );
    }
    
    if (!auth0User) {
      return (
        <View style={isMobileView ? styles.userIconContainerMobile : styles.userIconContainer}>
          <FeatherIcon name="user" size={isMobileView ? 22 : 20} color="#fff" />
        </View>
      );
    }
    
    return (
      <View style={isMobileView ? styles.userAvatarContainerMobile : styles.userAvatarContainer}>
        {auth0User.picture ? (
          <Image
            source={{ uri: auth0User.picture }}
            style={isMobileView ? styles.userAvatarMobile : styles.userAvatar}
          />
        ) : (
          <View style={isMobileView ? styles.userAvatarPlaceholderMobile : styles.userAvatarPlaceholder}>
            <Text style={isMobileView ? styles.userAvatarPlaceholderTextMobile : styles.userAvatarPlaceholderText}>
              {auth0User.name ? auth0User.name.charAt(0).toUpperCase() : "U"}
            </Text>
          </View>
        )}
        {!isMobileView && (
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>
              {t('navigation.account')}
            </Text>
            <FeatherIcon name="chevron-down" size={14} color="#fff" />
          </View>
        )}
      </View>
    );
  };

  const AuthChoiceModal = () => (
    <Modal
      visible={showAuthChoiceModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowAuthChoiceModal(false)}
    >
      <Pressable 
        style={styles.modalOverlay} 
        onPress={() => setShowAuthChoiceModal(false)}
      >
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Choose Login Method</Text>
            <TouchableOpacity 
              onPress={() => setShowAuthChoiceModal(false)}
              style={styles.modalCloseButton}
            >
              <FeatherIcon name="x" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalBody}>
            <Text style={styles.modalDescription}>
              Continue with your preferred sign-in option.
            </Text>
          </View>
          
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonPrimary]}
              onPress={handlePhoneLogin}
            >
              <Text style={styles.modalButtonPrimaryText}>Login with phone</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonSecondary]}
              onPress={handleEmailLogin}
            >
              <Text style={styles.modalButtonSecondaryText}>Login with email</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );

  if (isMobile) {
    const tabs: MobileTab[] = [];

    tabs.push({
      key: HOME,
      label: t("navigation.home"),
      iconName: "home",
      onPress: handleHomeButtonClick,
    });

    if (isAuthenticated) {
      tabs.push({
        key: "ACCOUNT",
        label: t("navigation.account"),
        isAccount: true,
        onPress: handleProfileButtonClick,
      });

      if (isCustomer) {
        tabs.push({
          key: BOOKINGS,
          label: t("navigation.bookings"),
          iconName: "event-note",
          onPress: handleDoubleTapRefresh,
        });
        tabs.push({
          key: WALLET,
          label: t("navigation.wallet"),
          iconName: "account-balance-wallet",
          onPress: handleWalletClick,
        });
      }

      if (isServiceProvider) {
        tabs.push({
          key: DASHBOARD,
          label: t("navigation.dashboard"),
          iconName: "dashboard",
          onPress: handleDashboardButtonClick,
        });
        // REMOVED: Notifications/Alerts button for service providers
      }

      if (isVendor) {
        tabs.push({
          key: AGENT_DASHBOARD,
          label: "Agent",
          iconName: "business-center",
          onPress: handleAgentDashboardButtonClick,
        });
      }

      tabs.push({
        key: "SIGN_OUT",
        label: t("navigation.signOut"),
        iconName: "logout",
        variant: "destructive",
        disabled: isSigningOut,
        onPress: handleSignOut,
      });
    } else {
      tabs.push({
        key: "ACCOUNT",
        label: t("navigation.signIn"),
        isAccount: true,
        onPress: handleProfileButtonClick,
      });
      tabs.push({
        key: "SIGN_UP",
        label: t("navigation.signUp"),
        iconName: "person-add-alt-1",
        onPress: onOpenSignup,
      });
      tabs.push({
        key: "SETTINGS",
        label: t("navigation.settings") || "Settings",
        iconName: "settings",
        onPress: handleSettingsOpen,
      });
    }

    const navSurface = isDarkMode ? colors.card : "#ffffff";
    const navBorder = isDarkMode ? colors.border : "#e2e8f0";
    const textMuted = isDarkMode ? "#94a3b8" : "#64748b";
    const textActiveColor = colors.primary;
    const bottomPad = Math.max(safeBottom, MOBILE_TAB_BAR_EDGE_PAD);

    return (
      <>
        <View
          style={[
            styles.mobileNavShell,
            { backgroundColor: navSurface, borderTopColor: navBorder },
          ]}
        >
          <View
            style={[
              styles.mobileNavContainer,
              {
                paddingTop: MOBILE_TAB_BAR_EDGE_PAD,
                paddingBottom: bottomPad,
              },
            ]}
          >
            {tabs.map((tab) => {
              const isActive =
                tab.variant !== "destructive" &&
                (activePage === tab.key || (tab.key === "ACCOUNT" && activePage === PROFILE));
              const isDisabled = !!tab.disabled;

              return (
                <TouchableOpacity
                  key={tab.key}
                  onPress={tab.onPress}
                  disabled={isDisabled}
                  style={[styles.mobileNavItem, isDisabled && styles.disabledTab]}
                  activeOpacity={0.72}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive, disabled: isDisabled }}
                >
                  {renderMobileTabIcon(tab, isActive)}
                  <Text
                    style={[
                      styles.mobileNavText,
                      { color: textMuted },
                      isActive && { color: textActiveColor, fontWeight: "600" },
                      tab.variant === "destructive" && styles.mobileNavTextDestructive,
                      isDisabled && styles.disabledTabText,
                    ]}
                    numberOfLines={1}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <NotificationsDialog
          visible={showNotifications}
          onClose={() => setShowNotifications(false)}
        />

        <ProfileMenuSheet
          visible={isProfileMenuVisible}
          onClose={() => setIsProfileMenuVisible(false)}
          onProfile={() => handleProfileMenuNavigation(PROFILE)}
          onBookings={() => handleBookingsButtonClick()}
          onDashboard={() => handleDashboardButtonClick()}
          onWallet={handleWalletClick}
          onContact={onContactClick}
          dockAboveTabBar
        />

        <Settings
          visible={isSettingsVisible}
          onClose={() => setIsSettingsVisible(false)}
        />

        <AuthChoiceModal />

        <Modal
          visible={showPhoneLoginModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowPhoneLoginModal(false)}
        >
          <View style={styles.fullScreenModal}>
            <View style={styles.fullScreenModalHeader}>
              <TouchableOpacity 
                onPress={() => setShowPhoneLoginModal(false)}
                style={styles.backButton}
              >
                <FeatherIcon name="arrow-left" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.fullScreenModalTitle}>Login with Phone</Text>
              <View style={styles.backButtonPlaceholder} />
            </View>
            <Login 
              embedded={true}
              onBack={() => setShowPhoneLoginModal(false)}
              sendDataToParent={(data: string) => {
                console.log("Login callback received with data:", data);
                handlePhoneLoginSuccess(data);
                if (data === "") {
                  if (onSignOutComplete) {
                    onSignOutComplete();
                  }
                }
              }}
            />
          </View>
        </Modal>
      </>
    );
  }

  // For desktop - render desktop navigation with gradient
  return (
    <>
      <LinearGradient
        colors={[...colors.chromeGradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.desktopNavContainer}
      >
        <View style={styles.desktopNavInner}>
          <View style={styles.desktopNavLinks}>
            <TouchableOpacity
              onPress={handleHomeButtonClick}
              style={styles.desktopNavItem}
            >
              <MaterialIcon 
                name="home" 
                size={20} 
                color="#fff" 
                style={styles.navIcon}
              />
              <Text style={styles.desktopNavText}>{t('navigation.home')}</Text>
            </TouchableOpacity>

            {isCustomer && (
              <>
                <TouchableOpacity
                  onPress={handleDoubleTapRefresh}
                  style={styles.desktopNavItem}
                >
                  <MaterialIcon name="event-note" size={20} color="#fff" style={styles.navIcon} />
                  <Text style={styles.desktopNavText}>{t('navigation.myBookings')}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={handleWalletClick}
                  style={styles.desktopNavItem}
                >
                  <MaterialIcon name="account-balance-wallet" size={20} color="#fff" style={styles.navIcon} />
                  <Text style={styles.desktopNavText}>Wallet</Text>
                </TouchableOpacity>
              </>
            )}

            {isServiceProvider && (
              <TouchableOpacity
                onPress={handleDashboardButtonClick}
                style={styles.desktopNavItem}
              >
                <MaterialIcon name="dashboard" size={20} color="#fff" style={styles.navIcon} />
                <Text style={styles.desktopNavText}>{t('navigation.dashboard')}</Text>
              </TouchableOpacity>
            )}

            {isVendor && (
              <TouchableOpacity
                onPress={handleAgentDashboardButtonClick}
                style={styles.desktopNavItem}
              >
                <MaterialIcon name="business" size={20} color="#fff" style={styles.navIcon} />
                <Text style={styles.desktopNavText}>Agent Dashboard</Text>
              </TouchableOpacity>
            )}

            {!isAuthenticated && (
              <>
                <TouchableOpacity
                  onPress={onAboutClick}
                  style={styles.desktopNavItem}
                >
                  <MaterialIcon name="info" size={20} color="#fff" style={styles.navIcon} />
                  <Text style={styles.desktopNavText}>{t('navigation.aboutUs')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={onContactClick}
                  style={styles.desktopNavItem}
                >
                  <MaterialIcon name="contact-support" size={20} color="#fff" style={styles.navIcon} />
                  <Text style={styles.desktopNavText}>{t('navigation.contactUs')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSettingsOpen}
                  style={styles.desktopNavItem}
                >
                  <MaterialIcon name="settings" size={20} color="#fff" style={styles.navIcon} />
                  <Text style={styles.desktopNavText}>{t('navigation.settings') || "Settings"}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <View style={styles.desktopActionIcons}>
            {/* REMOVED: Notifications bell icon for service providers */}
            
            <TouchableOpacity 
              onPress={handleProfileButtonClick}
              style={[styles.desktopActionIcon, styles.userMenuButton]}
            >
              {renderUserAvatar()}
              {!isAuthenticated && (
                <Text style={styles.signInText}>{t('navigation.signIn')}</Text>
              )}
            </TouchableOpacity>
            
            {isAuthenticated && (
              <TouchableOpacity 
                onPress={handleSignOut}
                disabled={isSigningOut}
                style={[
                  styles.desktopActionIcon, 
                  styles.signOutButton,
                  isSigningOut && styles.disabledDesktopButton
                ]}
              >
                <MaterialIcon 
                  name="logout" 
                  size={22} 
                  color={isSigningOut ? "#94a3b8" : "#fff"} 
                />
                <Text style={[
                  styles.signOutText,
                  isSigningOut && styles.disabledTabText
                ]}>
                  {isSigningOut ? t('navigation.signingOut') : t('navigation.signOut')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>

      <NotificationsDialog
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      <ProfileMenuSheet
        visible={isProfileMenuVisible}
        onClose={() => setIsProfileMenuVisible(false)}
        onProfile={() => handleProfileMenuNavigation(PROFILE)}
        onBookings={() => handleBookingsButtonClick()}
        onDashboard={() => handleDashboardButtonClick()}
        onWallet={handleWalletClick}
        onContact={onContactClick}
      />

      <Settings
        visible={isSettingsVisible}
        onClose={() => setIsSettingsVisible(false)}
      />

      <AuthChoiceModal />

      <Modal
        visible={showPhoneLoginModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPhoneLoginModal(false)}
      >
        <View style={styles.fullScreenModal}>
          <View style={styles.fullScreenModalHeader}>
            <TouchableOpacity 
              onPress={() => setShowPhoneLoginModal(false)}
              style={styles.backButton}
            >
              <FeatherIcon name="arrow-left" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.fullScreenModalTitle}>Login with Phone</Text>
            <View style={styles.backButtonPlaceholder} />
          </View>
          <Login 
            embedded={true}
            onBack={() => setShowPhoneLoginModal(false)}
            sendDataToParent={(data: string) => {
              console.log("Login callback received with data:", data);
              handlePhoneLoginSuccess(data);
              if (data === "") {
                if (onSignOutComplete) {
                  onSignOutComplete();
                }
              }
            }}
          />
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  mobileNavShell: {
    width: "100%",
    alignSelf: "stretch",
    borderTopWidth: 1,
  },
  mobileNavContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  mobileNavItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingHorizontal: 2,
    minHeight: MOBILE_TAB_BAR_CONTENT_HEIGHT,
    gap: 3,
  },
  navIconSlot: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  compactAvatarRing: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
  },
  compactAvatarRingDark: {
    borderColor: "#334155",
    backgroundColor: "#1e293b",
  },
  compactAvatarRingActive: {
    borderColor: "#0b5bd3",
    backgroundColor: "#eff6ff",
  },
  compactAvatarRingActiveDark: {
    borderColor: "#60a5fa",
    backgroundColor: "#1e3a5f",
  },
  compactAvatarInner: {
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
  },
  compactAvatarInitial: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  mobileNavText: {
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
    letterSpacing: 0.1,
    maxWidth: "100%",
  },
  mobileNavTextDestructive: {
    color: "#ef4444",
    fontSize: 10,
    fontWeight: "600",
  },
  disabledTab: {
    opacity: 0.5,
  },
  disabledTabText: {
    color: "#94a3b8",
  },
  desktopNavContainer: {
    flex: 2,
    justifyContent: "center",
  },
  desktopNavInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  desktopNavLinks: {
    flexDirection: "row",
    alignItems: "center",
    gap: 28,
  },
  desktopNavItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
    gap: 6,
    borderRadius: 8,
  },
  navIcon: {
    marginRight: 4,
  },
  desktopNavText: {
    color: "white",
    fontSize: 15,
    fontWeight: "500",
  },
  desktopActionIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  desktopActionIcon: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  userMenuButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  userIconContainer: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  userIconContainerMobile: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  userAvatarContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  userAvatarContainerMobile: {
    alignItems: "center",
    gap: 4,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  userAvatarMobile: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  userAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  userAvatarPlaceholderMobile: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  userAvatarPlaceholderText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  userAvatarPlaceholderTextMobile: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  userName: {
    color: "white",
    fontSize: 13,
    fontWeight: "500",
    maxWidth: 60,
  },
  signOutButton: {
    backgroundColor: "rgba(239, 68, 68, 0.8)",
  },
  signInText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  signOutText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  disabledDesktopButton: {
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    width: "90%",
    maxWidth: 400,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0f172a",
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
  },
  modalDescription: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonPrimary: {
    backgroundColor: "#0284c7",
  },
  modalButtonPrimaryText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  modalButtonSecondary: {
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  modalButtonSecondaryText: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "600",
  },
  fullScreenModal: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  fullScreenModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: "#020617",
  },
  backButton: {
    padding: 8,
  },
  backButtonPlaceholder: {
    width: 40,
  },
  fullScreenModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
  },
});

export default NavigationFooter;