// NavigationFooter.tsx - FINAL CORRECTED VERSION
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import FeatherIcon from "react-native-vector-icons/Feather";
import WalletDialog from "../UserProfile/WalletDialog";
import NotificationsDialog from "../Notifications/NotificationsPage";

interface NavigationFooterProps {
  onHomeClick: () => void;
  onBookingsClick: () => void;
  onDashboardClick: () => void;
  onAboutClick: () => void;
  onContactClick: () => void;
  auth0User: any;
  appUser: any;
  bookingType?: string;
}

const { width } = Dimensions.get("window");
const isMobile = width < 768;

const NavigationFooter: React.FC<NavigationFooterProps> = ({
  onHomeClick,
  onBookingsClick,
  onDashboardClick,
  onAboutClick,
  onContactClick,
  auth0User,
  appUser,
  bookingType = "",
}) => {
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Determine which icons to show based on user role
  const isCustomer = auth0User && appUser?.role === "CUSTOMER";
  const isServiceProvider = auth0User && appUser?.role === "SERVICE_PROVIDER";
  const isAuthenticated = auth0User;

  // For mobile - render bottom navigation bar
  if (isMobile) {
    return (
      <View style={styles.mobileNavContainer}>
        {/* Home - Always visible */}
       <TouchableOpacity
  onPress={onHomeClick}
  style={styles.mobileNavItem}
>
  <MaterialIcon name="home" size={22} color="#fff" />
  <Text style={styles.mobileNavText}>Home</Text>
</TouchableOpacity>

        {/* Bookings - Only for CUSTOMER */}
        {isCustomer && (
          <TouchableOpacity
            onPress={onBookingsClick}
            style={styles.mobileNavItem}
          >
            <MaterialIcon name="event-note" size={22} color="#fff" />
            <Text style={styles.mobileNavText}>Bookings</Text>
          </TouchableOpacity>
        )}

        {/* Dashboard - Only for SERVICE_PROVIDER */}
        {isServiceProvider && (
          <TouchableOpacity
            onPress={onDashboardClick}
            style={styles.mobileNavItem}
          >
            <MaterialIcon name="dashboard" size={22} color="#fff" />
            <Text style={styles.mobileNavText}>Dashboard</Text>
          </TouchableOpacity>
        )}

        {/* Wallet - Only for CUSTOMER */}
        {isCustomer && (
          <TouchableOpacity
            onPress={() => setIsWalletOpen(true)}
            style={styles.mobileNavItem}
          >
            <MaterialIcon name="account-balance-wallet" size={22} color="#fff" />
            <Text style={styles.mobileNavText}>Wallet</Text>
          </TouchableOpacity>
        )}

        {/* Not logged in - Show About & Contact */}
        {!isAuthenticated && (
          <>
            <TouchableOpacity
              onPress={onAboutClick}
              style={styles.mobileNavItem}
            >
              <Icon name="info-circle" size={20} color="#fff" />
              <Text style={styles.mobileNavText}>About</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onContactClick}
              style={styles.mobileNavItem}
            >
              <Icon name="phone" size={20} color="#fff" />
              <Text style={styles.mobileNavText}>Contact</Text>
            </TouchableOpacity>
          </>
        )}

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
              onPress={onBookingsClick}
              style={styles.desktopNavItem}
            >
              <Text style={styles.desktopNavText}>My Bookings</Text>
            </TouchableOpacity>
          )}

          {/* Dashboard - Only for SERVICE_PROVIDER */}
          {isServiceProvider && (
            <TouchableOpacity
              onPress={onDashboardClick}
              style={styles.desktopNavItem}
            >
              <Text style={styles.desktopNavText}>Dashboard</Text>
            </TouchableOpacity>
          )}

          {/* Not logged in - Show About & Contact */}
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
  mobileNavText: {
    color: "white",
    fontSize: 11,
    marginTop: 4,
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
  },
});

export default NavigationFooter;