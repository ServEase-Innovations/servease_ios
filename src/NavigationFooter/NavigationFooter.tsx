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
  activePage: string; // NEW: Added active page tracking
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
  activePage // NEW: Navigation handler
}) => {
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // ADD AUTH0 HOOKS HERE
  const { authorize, clearSession, getCredentials } = useAuth0();
  const dispatch = useDispatch();

  // Determine which icons to show based on user role
  const isCustomer = auth0User && appUser?.role === "CUSTOMER";
  const isServiceProvider = auth0User && appUser?.role === "SERVICE_PROVIDER";
  const isAuthenticated = auth0User;

  // NEW: Handle profile button click
  const handleProfileButtonClick = () => {
    if (isAuthenticated) {
      onNavigateToPage(PROFILE); // Navigate to profile page
    } else {
      handleLoginClick(); // If not authenticated, show login
    }
  };

  // NEW: Handle bookings button click
  const handleBookingsButtonClick = () => {
    if (isAuthenticated && isCustomer) {
      onNavigateToPage(BOOKINGS); // Navigate to bookings page
    } else if (!isAuthenticated) {
      handleLoginClick(); // If not authenticated, show login
    } else {
      onBookingsClick(); // Fallback to original handler
    }
  };

  // NEW: Handle dashboard button click
  const handleDashboardButtonClick = () => {
    if (isAuthenticated && isServiceProvider) {
      onNavigateToPage(DASHBOARD); // Navigate to dashboard page
    } else if (!isAuthenticated) {
      handleLoginClick(); // If not authenticated, show login
    } else {
      onDashboardClick(); // Fallback to original handler
    }
  };

  // ADD: Login handler
  const handleLoginClick = async () => {
    try {
      await authorize({
        scope: "openid profile email",
        redirectUrl: "com.serveaso://dev-plavkbiy7v55pbg4.us.auth0.com/android/com.serveaso/callback",
      });

      const credentials = await getCredentials();
      console.log("Login successful");
      
      // Show success message
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

  // ADD: Sign out handler
  const handleSignOut = async () => {
    try {
      await clearSession({
        returnToUrl: "com.serveaso://logout",
      });

      // Clear user data from Redux/store if needed
      dispatch(remove()); // Assuming you have this action
      
      // Show success message
      Snackbar.show({
        text: "Signed out successfully",
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: "#3b82f6",
        textColor: "#ffffff",
      });
      
      console.log("Signed out successfully");
    } catch (e) {
      console.log("Log out error:", e);
      Snackbar.show({
        text: "Failed to sign out",
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: "#ef4444",
        textColor: "#ffffff",
      });
    }
  };

  // Function to get user's first name
  const getUserFirstName = () => {
    if (!auth0User || !auth0User.name) return "User";
    return auth0User.name.split(' ')[0];
  };

  // Function to get user's avatar/display component
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
              {getUserFirstName()}
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
      label: "Home",
      icon: <MaterialIcon name="home" size={22} />,
      onPress: onHomeClick,
    },
    {
      key: PROFILE,
      label: auth0User ? getUserFirstName() : "Sign In",
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
    ...(isServiceProvider
      ? [
          {
            key: DASHBOARD,
            label: "Dashboard",
            icon: <MaterialIcon name="dashboard" size={22} />,
            onPress: handleDashboardButtonClick,
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

          return (
            <TouchableOpacity
              key={tab.key}
              onPress={tab.onPress}
              style={[
                styles.mobileNavItem,
                !isLast && styles.withBorder,
                isActive && styles.activeTab,
              ]}
            >
              {React.cloneElement(tab.icon as any, {
                color: isActive ? "#93c5fd" : "#fff",
              })}
              <Text
                style={[
                  styles.mobileNavText,
                  isActive && styles.activeTabText,
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
        {/* Left side - Navigation links */}
        <View style={styles.desktopNavLinks}>
          {/* Home - Always visible */}
          <TouchableOpacity
            onPress={onHomeClick}
            style={styles.desktopNavItem}
          >
            <Text style={styles.desktopNavText}>Home</Text>
          </TouchableOpacity>

          {/* Bookings - Only for CUSTOMER */}
          {isCustomer && (
            <TouchableOpacity
              onPress={handleBookingsButtonClick}
              style={styles.desktopNavItem}
            >
              <Text style={styles.desktopNavText}>My Bookings</Text>
            </TouchableOpacity>
          )}

          {/* Dashboard - Only for SERVICE_PROVIDER */}
          {isServiceProvider && (
            <TouchableOpacity
              onPress={handleDashboardButtonClick}
              style={styles.desktopNavItem}
            >
              <Text style={styles.desktopNavText}>Dashboard</Text>
            </TouchableOpacity>
          )}

          {/* Show About & Contact only when not authenticated */}
          {!isAuthenticated && (
            <>
              <TouchableOpacity
                onPress={onAboutClick}
                style={styles.desktopNavItem}
              >
                <Text style={styles.desktopNavText}>About Us</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onContactClick}
                style={styles.desktopNavItem}
              >
                <Text style={styles.desktopNavText}>Contact Us</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Right side - Action icons */}
        <View style={styles.desktopActionIcons}>
          {/* Wallet Icon - Only for CUSTOMER */}
          {isCustomer && (
            <TouchableOpacity
              onPress={() => setIsWalletOpen(true)}
              style={styles.desktopActionIcon}
            >
              <MaterialIcon name="account-balance-wallet" size={22} color="#fff" />
            </TouchableOpacity>
          )}
          
          {/* User Avatar/Profile - Show Sign In when not authenticated */}
          <TouchableOpacity 
            onPress={handleProfileButtonClick}
            style={[styles.desktopActionIcon, styles.userMenuButton]}
          >
            {renderUserAvatar()}
            {!isAuthenticated && ( // FIXED: Show "Sign In" text when not authenticated
              <Text style={styles.signInText}>Sign In</Text>
            )}
          </TouchableOpacity>
          
          {/* Sign Out button - Only show when authenticated */}
          {isAuthenticated && (
            <TouchableOpacity 
              onPress={handleSignOut}
              style={[styles.desktopActionIcon, styles.signOutButton]}
            >
              <MaterialIcon name="logout" size={22} color="#fff" />
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Dialogs */}
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
  // backgroundColor: "rgba(255,255,255,0.12)",
  // borderTopWidth: 3,
  borderTopColor: "#3b82f6",
},

activeTabText: {
  color: "#93c5fd",
  fontWeight: "600",
  textDecorationLine: "underline",
   
  // backgroundColor: "#3b82f6",
},
  mobileNavText: {
    color: "white",
    fontSize: 11,
    // marginTop: 4,
    fontWeight: "400",
    textAlign: "center",
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
});

export default NavigationFooter;