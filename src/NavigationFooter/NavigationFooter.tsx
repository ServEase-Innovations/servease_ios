// NavigationFooter.tsx - Fully Responsive with iOS/Android Support
import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import FeatherIcon from "react-native-vector-icons/Feather";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import NotificationsDialog from "../Notifications/NotificationsPage";
import { useAuth0 } from "react-native-auth0";
import { useDispatch } from "react-redux";
import { remove } from "../features/userSlice";
import { clearCustomer } from "../features/customerSlice";
import { clearMobileAuthStorage, tryClearAuth0Session } from "../utils/signOutSession";
import { logAuth0Error, runAuth0Authorize } from "../utils/auth0Config";
import Snackbar from "react-native-snackbar";
import { PROFILE, BOOKINGS, DASHBOARD, HOME, AGENT_DASHBOARD, WALLET, SETTINGS } from "../Constants/pagesConstants";
import ProfileMenuSheet from "../ProfileMenuSheet/ProfileMenuSheet";
import { useTranslation } from 'react-i18next';
import { useTheme } from "../Settings/ThemeContext";
import { useAppUser } from "../context/AppUserContext";
import LoginDrawer from "../LoginDrawer/LoginDrawer";
import { HOME_M3 } from "../theme/brandColors";

type MobileTab = {
  key: string;
  label: string;
  onPress: () => void;
  iconName?: string;
  isAccount?: boolean;
  hideIcon?: boolean;
  variant?: "default" | "destructive";
  disabled?: boolean;
};

import {
  MOBILE_TAB_BAR_CONTENT_HEIGHT,
  MOBILE_TAB_BAR_EDGE_PAD,
  MOBILE_TAB_BAR_TOP_PAD,
  getMobileTabBarBottomPad,
  getMobileTabBarHeight,
} from "../Constants/mobileLayout";

export {
  MOBILE_TAB_BAR_CONTENT_HEIGHT,
  MOBILE_TAB_BAR_EDGE_PAD,
  MOBILE_TAB_BAR_TOP_PAD,
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const isMobile = SCREEN_WIDTH < 768;

// Responsive sizing functions
const scale = (size: number) => {
  const baseWidth = 375;
  return (SCREEN_WIDTH / baseWidth) * size;
};

const verticalScale = (size: number) => {
  const baseHeight = 667;
  return (SCREEN_HEIGHT / baseHeight) * size;
};

const moderateScale = (size: number, factor = 0.5) => {
  return size + (scale(size) - size) * factor;
};

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
  bookingsRef,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isProfileMenuVisible, setIsProfileMenuVisible] = useState(false);
  const [lastTap, setLastTap] = useState<number>(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const safeBottom = Number.isFinite(insets.bottom) ? insets.bottom : 0;
  const { colors, isDarkMode } = useTheme();
  const { setAppUser, clearAppUser } = useAppUser();

  const { clearSession, authorize, cancelWebAuth } = useAuth0();
  const dispatch = useDispatch();

  const isAuthenticated = !!(auth0User || (appUser && appUser.token));

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

  const handleDoubleTapRefresh = useCallback(() => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (lastTap && now - lastTap < DOUBLE_TAP_DELAY) {
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
        if (isAuthenticated && isCustomer) {
          onNavigateToPage(BOOKINGS);
        } else if (!isAuthenticated) {
          setShowAuthModal(true);
        } else {
          onBookingsClick();
        }
      }

      setLastTap(0);
    } else {
      setLastTap(now);
      if (isAuthenticated && isCustomer) {
        onNavigateToPage(BOOKINGS);
      } else if (!isAuthenticated) {
        setShowAuthModal(true);
      } else {
        onBookingsClick();
      }
      setIsProfileMenuVisible(false);
    }
  }, [lastTap, isAuthenticated, isCustomer, onNavigateToPage, onBookingsClick]);

  const handleProfileButtonClick = () => {
    if (isAuthenticated) {
      setIsProfileMenuVisible(true);
    } else {
      setShowAuthModal(true);
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
      setShowAuthModal(true);
    } else {
      onBookingsClick();
    }
    setIsProfileMenuVisible(false);
  };

  const handleDashboardButtonClick = () => {
    if (isAuthenticated && isServiceProvider) {
      onNavigateToPage(DASHBOARD);
    } else if (!isAuthenticated) {
      setShowAuthModal(true);
    } else {
      onDashboardClick();
    }
    setIsProfileMenuVisible(false);
  };

  const handleAgentDashboardButtonClick = () => {
    if (isAuthenticated && isVendor) {
      onNavigateToPage(AGENT_DASHBOARD);
    } else if (!isAuthenticated) {
      setShowAuthModal(true);
    }
    setIsProfileMenuVisible(false);
  };

  const handleWalletClick = () => {
    if (isAuthenticated && isCustomer) {
      onNavigateToPage(WALLET);
    } else if (!isAuthenticated) {
      setShowAuthModal(true);
    }
    setIsProfileMenuVisible(false);
  };

  const handleEmailLogin = async () => {
    try {
      await runAuth0Authorize(authorize, cancelWebAuth);
    } catch (error) {
      logAuth0Error("email login failed", error);
      Snackbar.show({
        text: "Email sign-in was cancelled or failed. Please try again.",
        duration: Snackbar.LENGTH_LONG,
        backgroundColor: "#ef4444",
        textColor: "#ffffff",
      });
    }
  };

  const handleSignOut = async () => {
    if (isSigningOut) return;

    setIsSigningOut(true);
    setIsProfileMenuVisible(false);

    try {
      Snackbar.show({
        text: t("navigation.signingOutMsg"),
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: "#3b82f6",
        textColor: "#ffffff",
      });

      await clearMobileAuthStorage();
      await clearAppUser();
      await tryClearAuth0Session(clearSession);

      dispatch(remove());
      dispatch(clearCustomer());

      if (onSignOutComplete) {
        await onSignOutComplete();
      }
    } catch (e) {
      Snackbar.show({
        text: t("navigation.signOut"),
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: "#ef4444",
        textColor: "#ffffff",
      });
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleProfileMenuNavigation = (page: string) => {
    setIsProfileMenuVisible(false);
    onNavigateToPage(page);
  };

  const handleSettingsOpen = () => {
    setIsProfileMenuVisible(false);
    onNavigateToPage(SETTINGS);
  };

  const renderCompactAccountAvatar = () => {
    const avatarSize = moderateScale(24);

    if (!isAuthenticated) {
      return null;
    }

    if (appUser?.name && !auth0User) {
      return (
        <View
          style={[
            styles.compactAvatarInner,
            { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 },
          ]}
        >
          <Text style={[styles.compactAvatarInitial, { fontSize: moderateScale(11) }]}>
            {appUser.name.charAt(0).toUpperCase()}
          </Text>
        </View>
      );
    }

    if (!auth0User) {
      return <FeatherIcon name="user" size={moderateScale(20)} color={isDarkMode ? "#94a3b8" : "#64748b"} />;
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
      <View
        style={[
          styles.compactAvatarInner,
          { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 },
        ]}
      >
        <Text style={[styles.compactAvatarInitial, { fontSize: moderateScale(11) }]}>
          {auth0User.name ? auth0User.name.charAt(0).toUpperCase() : "U"}
        </Text>
      </View>
    );
  };

  const renderMobileTabIcon = (tab: MobileTab, isActive: boolean) => {
    const iconMuted = isDarkMode ? "#94a3b8" : "#64748b";
    const iconActiveColor = activePage === HOME ? HOME_M3.onSecondaryContainer : colors.primary;

    if (tab.hideIcon) {
      return <View style={styles.navIconSlot} />;
    }

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

    const tabIconSize = moderateScale(22);

    return (
      <View style={styles.navIconSlot}>
        <MaterialIcon
          name={tab.iconName ?? "circle"}
          size={tabIconSize}
          color={iconColor}
          style={[styles.tabBarIconGlyph, { lineHeight: tabIconSize }]}
        />
      </View>
    );
  };

  const renderUserAvatar = (isMobileView: boolean = false) => {
    if (!isAuthenticated) {
      return null;
    }

    if (!auth0User && appUser?.name) {
      return (
        <View style={isMobileView ? styles.userAvatarContainerMobile : styles.userAvatarContainer}>
          <View style={isMobileView ? styles.userAvatarPlaceholderMobile : styles.userAvatarPlaceholder}>
            <Text style={isMobileView ? styles.userAvatarPlaceholderTextMobile : styles.userAvatarPlaceholderText}>
              {appUser.name ? appUser.name.charAt(0).toUpperCase() : "U"}
            </Text>
          </View>
          {!isMobileView && (
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { fontSize: moderateScale(13) }]} numberOfLines={1}>
                {appUser.name?.split(" ")[0] || "User"}
              </Text>
              <FeatherIcon name="chevron-down" size={moderateScale(14)} color="#fff" />
            </View>
          )}
        </View>
      );
    }

    if (!auth0User) {
      return (
        <View style={isMobileView ? styles.userIconContainerMobile : styles.userIconContainer}>
          <FeatherIcon name="user" size={isMobileView ? moderateScale(22) : moderateScale(20)} color="#fff" />
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
            <Text style={[styles.userName, { fontSize: moderateScale(13) }]} numberOfLines={1}>
              {t("navigation.account")}
            </Text>
            <FeatherIcon name="chevron-down" size={moderateScale(14)} color="#fff" />
          </View>
        )}
      </View>
    );
  };

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
        iconName: "login",
        onPress: handleProfileButtonClick,
      });
      tabs.push({
        key: "SIGN_UP",
        label: t("navigation.signUp"),
        iconName: "person-add-alt-1",
        onPress: onOpenSignup,
      });
      tabs.push({
        key: SETTINGS,
        label: t("navigation.settings") || "Settings",
        iconName: "settings",
        onPress: handleSettingsOpen,
      });
    }

    const navSurface = isDarkMode ? colors.card : "#ffffff";
    const navBorder = isDarkMode ? colors.border : "#e2e8f0";
    const textMuted = isDarkMode ? "#94a3b8" : "#64748b";
    const textActiveColor = activePage === HOME ? HOME_M3.onSecondaryContainer : colors.primary;
    const bottomPad = getMobileTabBarBottomPad(safeBottom);

    return (
      <>
        <View
          style={[
            styles.mobileNavShell,
            {
              backgroundColor: navSurface,
              borderTopColor: navBorder,
              paddingTop: MOBILE_TAB_BAR_TOP_PAD,
              paddingBottom: bottomPad,
            },
          ]}
        >
          <View style={styles.mobileNavContainer}>
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
                  style={[
                    styles.mobileNavItem,
                    isActive &&
                      tab.key === HOME &&
                      activePage === HOME &&
                      styles.mobileNavItemActiveHome,
                    isActive &&
                      !(tab.key === HOME && activePage === HOME) && {
                        backgroundColor: `${colors.primary}1A`,
                      },
                    isDisabled && styles.disabledTab,
                  ]}
                  activeOpacity={0.72}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive, disabled: isDisabled }}
                >
                  <View style={styles.mobileNavItemContent}>
                    {renderMobileTabIcon(tab, isActive)}
                    <Text
                      style={[
                        styles.mobileNavText,
                        {
                          color: textMuted,
                          fontSize: moderateScale(10),
                          lineHeight: moderateScale(12),
                        },
                        isActive && { color: textActiveColor, fontWeight: "600" },
                        tab.variant === "destructive" && styles.mobileNavTextDestructive,
                        isDisabled && styles.disabledTabText,
                      ]}
                      numberOfLines={1}
                      allowFontScaling={false}
                    >
                      {tab.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <NotificationsDialog visible={showNotifications} onClose={() => setShowNotifications(false)} />
        <ProfileMenuSheet
          visible={isProfileMenuVisible}
          onClose={() => setIsProfileMenuVisible(false)}
          onProfile={() => handleProfileMenuNavigation(PROFILE)}
          onBookings={() => handleBookingsButtonClick()}
          onDashboard={() => handleDashboardButtonClick()}
          onWallet={handleWalletClick}
          onContact={onContactClick}
          onOpenSettings={handleSettingsOpen}
          dockAboveTabBar
        />
        <LoginDrawer
          visible={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          setAppUser={setAppUser}
          onEmailLogin={handleEmailLogin}
          sendDataToParent={(data) => {
            if (data === DASHBOARD) {
              onNavigateToPage(DASHBOARD);
            } else if (data === AGENT_DASHBOARD) {
              onNavigateToPage(AGENT_DASHBOARD);
            }
          }}
        />
      </>
    );
  }

  return (
    <>
      <LinearGradient
        colors={[...colors.chromeGradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.desktopNavContainer}
      >
        <View style={[styles.desktopNavInner, { paddingHorizontal: moderateScale(20), paddingVertical: verticalScale(12) }]}>
          <View style={[styles.desktopNavLinks, { gap: moderateScale(28) }]}>
            <TouchableOpacity onPress={handleHomeButtonClick} style={[styles.desktopNavItem, { paddingVertical: verticalScale(8), paddingHorizontal: moderateScale(8), gap: moderateScale(6) }]}>
              <MaterialIcon name="home" size={moderateScale(20)} color="#fff" style={styles.navIcon} />
              <Text style={[styles.desktopNavText, { fontSize: moderateScale(15) }]}>{t("navigation.home")}</Text>
            </TouchableOpacity>

            {isCustomer && (
              <>
                <TouchableOpacity onPress={handleDoubleTapRefresh} style={[styles.desktopNavItem, { paddingVertical: verticalScale(8), paddingHorizontal: moderateScale(8), gap: moderateScale(6) }]}>
                  <MaterialIcon name="event-note" size={moderateScale(20)} color="#fff" style={styles.navIcon} />
                  <Text style={[styles.desktopNavText, { fontSize: moderateScale(15) }]}>{t("navigation.myBookings")}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleWalletClick} style={[styles.desktopNavItem, { paddingVertical: verticalScale(8), paddingHorizontal: moderateScale(8), gap: moderateScale(6) }]}>
                  <MaterialIcon name="account-balance-wallet" size={moderateScale(20)} color="#fff" style={styles.navIcon} />
                  <Text style={[styles.desktopNavText, { fontSize: moderateScale(15) }]}>Wallet</Text>
                </TouchableOpacity>
              </>
            )}

            {isServiceProvider && (
              <TouchableOpacity onPress={handleDashboardButtonClick} style={[styles.desktopNavItem, { paddingVertical: verticalScale(8), paddingHorizontal: moderateScale(8), gap: moderateScale(6) }]}>
                <MaterialIcon name="dashboard" size={moderateScale(20)} color="#fff" style={styles.navIcon} />
                <Text style={[styles.desktopNavText, { fontSize: moderateScale(15) }]}>{t("navigation.dashboard")}</Text>
              </TouchableOpacity>
            )}

            {isVendor && (
              <TouchableOpacity onPress={handleAgentDashboardButtonClick} style={[styles.desktopNavItem, { paddingVertical: verticalScale(8), paddingHorizontal: moderateScale(8), gap: moderateScale(6) }]}>
                <MaterialIcon name="business" size={moderateScale(20)} color="#fff" style={styles.navIcon} />
                <Text style={[styles.desktopNavText, { fontSize: moderateScale(15) }]}>Agent Dashboard</Text>
              </TouchableOpacity>
            )}

            {!isAuthenticated && (
              <>
                <TouchableOpacity onPress={onAboutClick} style={[styles.desktopNavItem, { paddingVertical: verticalScale(8), paddingHorizontal: moderateScale(8), gap: moderateScale(6) }]}>
                  <MaterialIcon name="info" size={moderateScale(20)} color="#fff" style={styles.navIcon} />
                  <Text style={[styles.desktopNavText, { fontSize: moderateScale(15) }]}>{t("navigation.aboutUs")}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onContactClick} style={[styles.desktopNavItem, { paddingVertical: verticalScale(8), paddingHorizontal: moderateScale(8), gap: moderateScale(6) }]}>
                  <MaterialIcon name="contact-support" size={moderateScale(20)} color="#fff" style={styles.navIcon} />
                  <Text style={[styles.desktopNavText, { fontSize: moderateScale(15) }]}>{t("navigation.contactUs")}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSettingsOpen} style={[styles.desktopNavItem, { paddingVertical: verticalScale(8), paddingHorizontal: moderateScale(8), gap: moderateScale(6) }]}>
                  <MaterialIcon name="settings" size={moderateScale(20)} color="#fff" style={styles.navIcon} />
                  <Text style={[styles.desktopNavText, { fontSize: moderateScale(15) }]}>{t("navigation.settings") || "Settings"}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <View style={[styles.desktopActionIcons, { gap: moderateScale(16) }]}>
            <TouchableOpacity onPress={handleProfileButtonClick} style={[styles.desktopActionIcon, styles.userMenuButton, { padding: moderateScale(8), borderRadius: moderateScale(20), paddingHorizontal: moderateScale(12), paddingVertical: verticalScale(6) }]}>
              {isAuthenticated ? (
                renderUserAvatar()
              ) : (
                <>
                  <MaterialIcon name="login" size={moderateScale(22)} color="#fff" style={styles.navIcon} />
                  <Text style={[styles.signInText, { fontSize: moderateScale(14) }]}>{t("navigation.signIn")}</Text>
                </>
              )}
            </TouchableOpacity>

            {isAuthenticated && (
              <TouchableOpacity
                onPress={handleSignOut}
                disabled={isSigningOut}
                style={[styles.desktopActionIcon, styles.signOutButton, isSigningOut && styles.disabledDesktopButton, { padding: moderateScale(8), borderRadius: moderateScale(20), gap: moderateScale(6) }]}
              >
                <MaterialIcon name="logout" size={moderateScale(22)} color={isSigningOut ? "#94a3b8" : "#fff"} />
                <Text style={[styles.signOutText, isSigningOut && styles.disabledTabText, { fontSize: moderateScale(14) }]}>
                  {isSigningOut ? t("navigation.signingOut") : t("navigation.signOut")}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>

      <NotificationsDialog visible={showNotifications} onClose={() => setShowNotifications(false)} />
      <ProfileMenuSheet
        visible={isProfileMenuVisible}
        onClose={() => setIsProfileMenuVisible(false)}
        onProfile={() => handleProfileMenuNavigation(PROFILE)}
        onBookings={() => handleBookingsButtonClick()}
        onDashboard={() => handleDashboardButtonClick()}
        onWallet={handleWalletClick}
        onContact={onContactClick}
        onOpenSettings={handleSettingsOpen}
      />
      <LoginDrawer
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        setAppUser={setAppUser}
        onEmailLogin={handleEmailLogin}
        sendDataToParent={(data) => {
          if (data === DASHBOARD) {
            onNavigateToPage(DASHBOARD);
          } else if (data === AGENT_DASHBOARD) {
            onNavigateToPage(AGENT_DASHBOARD);
          }
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  // Mobile Navigation Styles
  mobileNavShell: {
    width: "100%",
    alignSelf: "stretch",
    borderTopWidth: 1,
    alignItems: "center",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  mobileNavItemActiveHome: {
    backgroundColor: HOME_M3.secondaryContainer,
    transform: [{ scale: 0.92 }],
  },
  mobileNavContainer: {
    width: "100%",
    height: MOBILE_TAB_BAR_CONTENT_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  mobileNavItem: {
    flex: 1,
    minWidth: 0,
    height: MOBILE_TAB_BAR_CONTENT_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderRadius: 12,
  },
  mobileNavItemContent: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  navIconSlot: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  tabBarIconGlyph: {
    width: 28,
    height: 28,
    textAlign: "center",
    textAlignVertical: "center",
    ...Platform.select({
      android: { includeFontPadding: false },
      default: {},
    }),
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
    fontWeight: "700",
  },
  mobileNavText: {
    fontWeight: "500",
    textAlign: "center",
    alignSelf: "center",
    width: "100%",
    letterSpacing: 0.1,
    maxWidth: "100%",
    flexShrink: 1,
    marginTop: 0,
    paddingTop: 0,
    ...Platform.select({
      android: { includeFontPadding: false, textAlignVertical: "center" },
      default: {},
    }),
  },
  mobileNavTextDestructive: {
    color: "#ef4444",
    fontWeight: "600",
  },
  disabledTab: {
    opacity: 0.5,
  },
  disabledTabText: {
    color: "#94a3b8",
  },

  // Desktop Navigation Styles
  desktopNavContainer: {
    flex: 2,
    justifyContent: "center",
  },
  desktopNavInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  desktopNavLinks: {
    flexDirection: "row",
    alignItems: "center",
  },
  desktopNavItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
  },
  navIcon: {
    marginRight: 4,
  },
  desktopNavText: {
    color: "white",
    fontWeight: "500",
  },
  desktopActionIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  desktopActionIcon: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    flexDirection: "row",
    alignItems: "center",
  },
  userMenuButton: {},
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
    fontWeight: "600",
  },
  userAvatarPlaceholderTextMobile: {
    color: "white",
    fontWeight: "600",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  userName: {
    color: "white",
    fontWeight: "500",
    maxWidth: 60,
  },
  signOutButton: {
    backgroundColor: "rgba(239, 68, 68, 0.8)",
  },
  signInText: {
    color: "white",
    fontWeight: "500",
  },
  signOutText: {
    color: "white",
    fontWeight: "500",
  },
  disabledDesktopButton: {
    opacity: 0.6,
  },

  // Modal Styles
  modalKeyboardView: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    maxWidth: 420,
    backgroundColor: "transparent",
  },
  modalContent: {
    backgroundColor: "transparent",
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 32,
    elevation: 16,
    width: "100%",
  },
  modalContentCompact: {
    backgroundColor: "#ffffff",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalHeaderLeft: {
    alignItems: "flex-start",
  },
  modalHeaderRight: {
    alignItems: "flex-end",
  },
  backButton: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalHeaderTitle: {
    fontWeight: "700",
    color: "#ffffff",
  },
  modalScrollContentForm: {
    flexGrow: 0,
    paddingBottom: 8,
  },
  loginMethodSheet: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 22,
  },
  loginMethodTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  loginMethodTopSpacer: {
    flex: 1,
  },
  loginMethodCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f1f5f9",
  },
  loginMethodCards: {
    marginTop: 4,
  },
  optionsTitle: {
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 6,
  },
  optionsSubtitle: {
    textAlign: "center",
    opacity: 0.75,
    marginBottom: 20,
    lineHeight: 20,
  },
  proMethodCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    minHeight: 76,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.08)",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  proMethodCardLast: {
    marginBottom: 0,
  },
  proMethodIconContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  proMethodContent: {
    flex: 1,
  },
  proMethodTitle: {
    fontWeight: "700",
    marginBottom: 4,
  },
  proMethodDescription: {
    opacity: 0.7,
  },
  proMethodArrow: {
    width: 32,
    alignItems: "flex-end",
  },
  signupPrompt: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  signupPromptText: {},
  signupLink: {
    fontWeight: "600",
  },
  mobileFormContainer: {
    backgroundColor: "#ffffff",
  },
  mobileIconWrapper: {
    alignItems: "center",
  },
  mobileIconCircle: {
    alignItems: "center",
    justifyContent: "center",
  },
  mobileFormTitle: {
    fontWeight: "700",
    textAlign: "center",
  },
  mobileFormSubtitle: {
    textAlign: "center",
    opacity: 0.7,
  },
  inputGroup: {},
  inputLabel: {
    fontWeight: "600",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
  },
  countryCode: {
    fontWeight: "600",
    color: "#64748b",
  },
  input: {
    flex: 1,
  },
  otpInput: {
    textAlign: "center",
  },
  submitButton: {
    overflow: "hidden",
  },
  submitGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  resendButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  resendText: {
    fontWeight: "600",
  },
  resendDisabledText: {
    opacity: 0.5,
  },

  // Snackbar Styles
  snackbarContainer: {
    position: "absolute",
    overflow: "hidden",
    borderRadius: 14,
    zIndex: 9999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  snackbarGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  snackbarContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  snackbarIcon: {
    color: "#fff",
    fontWeight: "bold",
  },
  snackbarMessage: {
    color: "#fff",
    flex: 1,
    fontWeight: "500",
  },
  snackbarCloseButton: {
    padding: 4,
  },
});

export default NavigationFooter;