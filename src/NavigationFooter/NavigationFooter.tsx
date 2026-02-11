// NavigationFooter.tsx - UPDATED VERSION WITH PROFILE SCREEN NAVIGATION
import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import FeatherIcon from "react-native-vector-icons/Feather";
import WalletDialog from "../UserProfile/WalletDialog";
import NotificationsDialog from "../Notifications/NotificationsPage";
import { useAuth0 } from "react-native-auth0";
import { useDispatch } from "react-redux";
import { remove } from "../features/userSlice";
import Snackbar from "react-native-snackbar";
import { PROFILE, BOOKINGS, DASHBOARD } from "../Constants/pagesConstants";

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
  onSignOutComplete
}) => {
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  
  const { authorize, clearSession, getCredentials } = useAuth0();
  const dispatch = useDispatch();

  const isCustomer = auth0User && appUser?.role === "CUSTOMER";
  const isServiceProvider = auth0User && appUser?.role === "SERVICE_PROVIDER";
  const isAuthenticated = auth0User;

  const handleProfileButtonClick = () => {
    if (isAuthenticated) {
      onNavigateToPage(PROFILE);
    } else {
      handleLoginClick();
    }
  };

  const handleBookingsButtonClick = () => {
    if (isAuthenticated && isCustomer) {
      onNavigateToPage(BOOKINGS);
    } else if (!isAuthenticated) {
      handleLoginClick();
    } else {
      onBookingsClick();
    }
  };

  const handleDashboardButtonClick = () => {
    if (isAuthenticated && isServiceProvider) {
      onNavigateToPage(DASHBOARD);
    } else if (!isAuthenticated) {
      handleLoginClick();
    } else {
      onDashboardClick();
    }
  };

  const handleHomeClick = () => {
    if (isServiceProvider && isAuthenticated) {
      onNavigateToPage(DASHBOARD);
    } else {
      onHomeClick();
    }
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
        text: "Logged in successfully!",
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: "#10b981",
        textColor: "#ffffff",
      });
    } catch (e) {
      console.log("Login error:", e);
      Snackbar.show({
        text: "Login failed. Please try again.",
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
    
    try {
      console.log("🚪 Sign out initiated...");
      
      Snackbar.show({
        text: "Signing out...",
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
        text: "Failed to sign out",
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: "#ef4444",
        textColor: "#ffffff",
      });
      setIsSigningOut(false);
    }
  };

  // FIXED: Get user's first name only
  const getUserFirstName = () => {
    if (!auth0User || !auth0User.name) return "User";
    // Extract first name only
    const nameParts = auth0User.name.split(' ');
    return nameParts[0] || "User";
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
              {getUserFirstName().charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        {!isMobileView && (
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>
              {getUserFirstName()} {/* Now shows only first name */}
            </Text>
            <FeatherIcon name="chevron-down" size={14} color="#fff" />
          </View>
        )}
      </View>
    );
  };

  // For mobile - render bottom navigation bar
  if (isMobile) {
    const tabs = [
      {
        key: "HOME",
        label: isServiceProvider && isAuthenticated ? "Dashboard" : "Home",
        icon: <MaterialIcon name={isServiceProvider && isAuthenticated ? "dashboard" : "home"} size={22} />,
        onPress: handleHomeClick,
      },
      {
        key: PROFILE,
        label: auth0User ? getUserFirstName() : "Sign In", // Shows first name only
        icon: renderUserAvatar(true),
        onPress: handleProfileButtonClick,
      },
      ...(isCustomer
        ? [
            {
              key: BOOKINGS,
              label: "Bookings",
              icon: <MaterialIcon name="event-note" size={22} />,
              onPress: handleBookingsButtonClick,
            },
          ]
        : []),
      // FIXED: Only show notifications for Service Providers
      ...(isServiceProvider && isAuthenticated
        ? [
            {
              key: "NOTIFICATIONS",
              label: "Alerts",
              icon: <MaterialIcon name="notifications" size={22} />,
              onPress: () => setShowNotifications(true),
            },
          ]
        : []),
      ...(isCustomer
        ? [
            {
              key: "WALLET",
              label: "Wallet",
              icon: <MaterialIcon name="account-balance-wallet" size={22} />,
              onPress: () => setIsWalletOpen(true),
            },
          ]
        : []),
      {
        key: isAuthenticated ? "SIGN_OUT" : "SIGN_UP",
        label: isAuthenticated ? "Sign Out" : "Sign Up",
        icon: (
          <MaterialIcon
            name={isAuthenticated ? "logout" : "person-add"}
            size={22}
            color={isSigningOut ? "#94a3b8" : "#fff"}
          />
        ),
        onPress: isAuthenticated ? handleSignOut : onOpenSignup,
      },
    ];

    return (
      <>
        <View style={styles.mobileNavContainer}>
          {tabs.map((tab, index) => {
            const isActive = activePage === tab.key;
            const isLast = index === tabs.length - 1;
            const isDisabled = isAuthenticated && tab.key === "SIGN_OUT" && isSigningOut;

            return (
              <TouchableOpacity
                key={tab.key}
                onPress={tab.onPress}
                disabled={isDisabled}
                style={[
                  styles.mobileNavItem,
                  !isLast && styles.withBorder,
                  isActive && styles.activeTab,
                  isDisabled && styles.disabledTab,
                ]}
              >
                {React.cloneElement(tab.icon as any, {
                  color: isActive ? "#93c5fd" : isDisabled ? "#94a3b8" : "#fff",
                })}
                <Text
                  style={[
                    styles.mobileNavText,
                    isActive && styles.activeTabText,
                    isDisabled && styles.disabledTabText,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <NotificationsDialog
          visible={showNotifications}
          onClose={() => setShowNotifications(false)}
        />

        <WalletDialog
          open={isWalletOpen}
          onClose={() => setIsWalletOpen(false)}
        />
      </>
    );
  }

  // For desktop - render desktop navigation
  return (
    <View style={styles.desktopNavContainer}>
      <View style={styles.desktopNavInner}>
        <View style={styles.desktopNavLinks}>
          <TouchableOpacity
            onPress={handleHomeClick}
            style={styles.desktopNavItem}
          >
            <MaterialIcon 
              name={isServiceProvider && isAuthenticated ? "dashboard" : "home"} 
              size={20} 
              color="#fff" 
              style={styles.navIcon}
            />
            <Text style={styles.desktopNavText}>
              {isServiceProvider && isAuthenticated ? "Dashboard" : "Home"}
            </Text>
          </TouchableOpacity>

          {isCustomer && (
            <TouchableOpacity
              onPress={handleBookingsButtonClick}
              style={styles.desktopNavItem}
            >
              <MaterialIcon name="event-note" size={20} color="#fff" style={styles.navIcon} />
              <Text style={styles.desktopNavText}>My Bookings</Text>
            </TouchableOpacity>
          )}

          {!isAuthenticated && (
            <>
              <TouchableOpacity
                onPress={onAboutClick}
                style={styles.desktopNavItem}
              >
                <MaterialIcon name="info" size={20} color="#fff" style={styles.navIcon} />
                <Text style={styles.desktopNavText}>About Us</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onContactClick}
                style={styles.desktopNavItem}
              >
                <MaterialIcon name="contact-support" size={20} color="#fff" style={styles.navIcon} />
                <Text style={styles.desktopNavText}>Contact Us</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.desktopActionIcons}>
          {/* FIXED: Only show notifications for Service Providers */}
          {isServiceProvider && isAuthenticated && (
            <TouchableOpacity
              onPress={() => setShowNotifications(true)}
              style={styles.desktopActionIcon}
            >
              <MaterialIcon name="notifications" size={22} color="#fff" />
            </TouchableOpacity>
          )}
          
          {isCustomer && (
            <TouchableOpacity
              onPress={() => setIsWalletOpen(true)}
              style={styles.desktopActionIcon}
            >
              <MaterialIcon name="account-balance-wallet" size={22} color="#fff" />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            onPress={handleProfileButtonClick}
            style={[styles.desktopActionIcon, styles.userMenuButton]}
          >
            {renderUserAvatar()}
            {!isAuthenticated && (
              <Text style={styles.signInText}>Sign In</Text>
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
                {isSigningOut ? "Signing Out..." : "Sign Out"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <NotificationsDialog
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      <WalletDialog
        open={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  // Mobile Styles
  mobileNavContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#0a2a66",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    minHeight: 60,
  },
  mobileNavItem: {
    alignItems: "center",
    paddingHorizontal: 8,
    flex: 1,
  },
  withBorder: {
    borderRightWidth: 1,
    borderRightColor: "rgba(255,255,255,0.15)",
  },
  activeTab: {
    borderTopColor: "#3b82f6",
  },
  activeTabText: {
    color: "#93c5fd",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  mobileNavText: {
    color: "white",
    fontSize: 11,
    fontWeight: "400",
    textAlign: "center",
  },
  disabledTab: {
    opacity: 0.6,
  },
  disabledTabText: {
    color: "#94a3b8",
  },

  // Desktop Styles
  desktopNavContainer: {
    flex: 2,
    justifyContent: "center",
  },
  desktopNavInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
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
    gap: 6,
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
  
  // User Avatar Styles
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
  // Button Styles
  signInButton: {
    backgroundColor: "rgba(59, 130, 246, 0.8)",
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