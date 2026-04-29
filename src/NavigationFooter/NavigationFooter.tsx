// NavigationFooter.tsx - Updated with Wallet page navigation and Gradient Background
import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
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
  onProfileClick: () => void;
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
  const { t } = useTranslation();
  
  const { authorize, clearSession, getCredentials } = useAuth0();
  const dispatch = useDispatch();

  const isCustomer = auth0User && appUser?.role === "CUSTOMER";
  const isServiceProvider = auth0User && appUser?.role === "SERVICE_PROVIDER";
  const isVendor = auth0User && appUser?.role === "VENDOR";
  const isAuthenticated = auth0User;

  // Double tap detection for bookings refresh
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
          handleLoginClick();
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
        handleLoginClick();
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
      handleLoginClick();
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
      handleLoginClick();
    } else {
      onBookingsClick();
    }
    setIsProfileMenuVisible(false);
  };

  const handleDashboardButtonClick = () => {
    if (isAuthenticated && isServiceProvider) {
      onNavigateToPage(DASHBOARD);
    } else if (!isAuthenticated) {
      handleLoginClick();
    } else {
      onDashboardClick();
    }
    setIsProfileMenuVisible(false);
  };

  const handleAgentDashboardButtonClick = () => {
    if (isAuthenticated && isVendor) {
      onNavigateToPage(AGENT_DASHBOARD);
    } else if (!isAuthenticated) {
      handleLoginClick();
    }
    setIsProfileMenuVisible(false);
  };

  const handleWalletClick = () => {
    if (isAuthenticated && isCustomer) {
      onNavigateToPage(WALLET);
    } else if (!isAuthenticated) {
      handleLoginClick();
    }
    setIsProfileMenuVisible(false);
  };

  const handleLoginClick = async () => {
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

      await clearSession({
        returnToUrl: "com.serveaso://logout",
      });

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
    onNavigateToPage(page);
    setIsProfileMenuVisible(false);
  };

  const handleSettingsOpen = () => {
    setIsSettingsVisible(true);
  };

  const renderUserAvatar = (isMobileView: boolean = false) => {
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

  // For mobile - render bottom navigation bar with gradient
  if (isMobile) {
    let tabs = [];
    
    tabs.push({
      key: HOME,
      label: t('navigation.home'),
      icon: <MaterialIcon name="home" size={22} />,
      onPress: handleHomeButtonClick,
    });
    
    if (isAuthenticated) {
      tabs.push({
        key: "ACCOUNT",
        label: t('navigation.account'),
        icon: renderUserAvatar(true),
        onPress: handleProfileButtonClick,
      });
      
      if (isCustomer) {
        tabs.push({
          key: BOOKINGS,
          label: t('navigation.bookings'),
          icon: <MaterialIcon name="event-note" size={22} />,
          onPress: handleDoubleTapRefresh,
        });
        
        tabs.push({
          key: WALLET,
          label: t('navigation.wallet'),
          icon: <MaterialIcon name="account-balance-wallet" size={22} />,
          onPress: handleWalletClick,
        });
      }
      
      if (isServiceProvider) {
        tabs.push({
          key: DASHBOARD,
          label: t('navigation.dashboard'),
          icon: <MaterialIcon name="dashboard" size={22} />,
          onPress: handleDashboardButtonClick,
        });
        
        tabs.push({
          key: "NOTIFICATIONS",
          label: t('navigation.alerts'),
          icon: <MaterialIcon name="notifications" size={22} />,
          onPress: () => setShowNotifications(true),
        });
      }

      if (isVendor) {
        tabs.push({
          key: AGENT_DASHBOARD,
          label: "Agent Dashboard",
          icon: <MaterialIcon name="business" size={22} />,
          onPress: handleAgentDashboardButtonClick,
        });
      }
      
      tabs.push({
        key: "SIGN_OUT",
        label: t('navigation.signOut'),
        icon: (
          <MaterialIcon
            name="logout"
            size={22}
            color={isSigningOut ? "#94a3b8" : "#fff"}
          />
        ),
        onPress: handleSignOut,
      });
    } else {
      tabs.push({
        key: "ACCOUNT",
        label: t('navigation.signIn'),
        icon: renderUserAvatar(true),
        onPress: handleProfileButtonClick,
      });
      
      tabs.push({
        key: "SIGN_UP",
        label: t('navigation.signUp'),
        icon: <MaterialIcon name="person-add" size={22} color="#fff" />,
        onPress: onOpenSignup,
      });

      tabs.push({
        key: "SETTINGS",
        label: t('navigation.settings') || "Settings",
        icon: <MaterialIcon name="settings" size={22} color="#fff" />,
        onPress: handleSettingsOpen,
      });
    }

    return (
      <>
        <LinearGradient
          colors={['#0d1935', '#1c4485', '#255697']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.mobileNavContainer}
        >
          {tabs.map((tab, index) => {
            const isActive = activePage === tab.key || (tab.key === "ACCOUNT" && activePage === PROFILE);
            const isLast = index === tabs.length - 1;
            const isDisabled = isAuthenticated && tab.key === "SIGN_OUT" && isSigningOut;

            return (
              <TouchableOpacity
                key={tab.key}
                onPress={tab.onPress}
                disabled={isDisabled}
                style={[
                  styles.mobileNavItem,
                  isActive && styles.activeTab,
                  isDisabled && styles.disabledTab,
                ]}
                activeOpacity={0.85}
              >
                <View style={[styles.mobileNavIconWrap, isActive && styles.mobileNavIconWrapActive]}>
                  {React.cloneElement(tab.icon as any, {
                    color: isActive ? "#bfdbfe" : isDisabled ? "#94a3b8" : "#fff",
                  })}
                </View>
                <Text
                  style={[
                    styles.mobileNavText,
                    isActive && styles.activeTabText,
                    isDisabled && styles.disabledTabText,
                  ]}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
                {isActive && <View style={styles.activeIndicator} />}
              </TouchableOpacity>
            );
          })}
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
      </>
    );
  }

  // For desktop - render desktop navigation with gradient
  return (
    <>
      <LinearGradient
        colors={['#0d1935', '#1c4485', '#255697']}
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
            {isServiceProvider && isAuthenticated && (
              <TouchableOpacity
                onPress={() => setShowNotifications(true)}
                style={styles.desktopActionIcon}
              >
                <MaterialIcon name="notifications" size={22} color="#fff" />
              </TouchableOpacity>
            )}
            
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
    </>
  );
};

const styles = StyleSheet.create({
  mobileNavContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
    paddingBottom: 10,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.16)",
    minHeight: 68,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 12,
  },
  mobileNavItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    flex: 1,
    position: "relative",
    paddingVertical: 6,
    minHeight: 52,
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 12,
  },
  mobileNavIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  mobileNavIconWrapActive: {
    backgroundColor: "rgba(191, 219, 254, 0.18)",
  },
  activeTabText: {
    color: "#bfdbfe",
    fontWeight: "700",
  },
  activeIndicator: {
    position: "absolute",
    bottom: -2,
    width: 20,
    height: 3,
    backgroundColor: "#bfdbfe",
    borderRadius: 999,
  },
  mobileNavText: {
    color: "white",
    fontSize: 10,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 3,
    maxWidth: "95%",
  },
  disabledTab: {
    opacity: 0.6,
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
});

export default NavigationFooter;