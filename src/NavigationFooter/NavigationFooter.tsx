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
  const [activeTab, setActiveTab] = useState<
  "home" | "bookings" | "dashboard" | "wallet" | "about" | "contact"
>("home");


const renderTab = (
  key: string,
  label: string,
  icon: React.ReactNode,
  onPress: () => void
) => {
  const isActive = activeTab === key;

  return (
    <TouchableOpacity
      onPress={() => {
        setActiveTab(key as any);
        onPress();
      }}
      activeOpacity={0.8}
      style={[
        styles.mobileNavItem,
        isActive ? styles.mobileNavItemActive : styles.mobileNavItemInactive,
      ]}
    >
      {icon}
      <Text
        style={[
          styles.mobileNavText,
          isActive
            ? styles.mobileNavTextActive
            : styles.mobileNavTextInactive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};



  // Determine which icons to show based on user role
  const isCustomer = auth0User && appUser?.role === "CUSTOMER";
  const isServiceProvider = auth0User && appUser?.role === "SERVICE_PROVIDER";
  const isAuthenticated = auth0User;

  // For mobile - render bottom navigation bar
  if (isMobile) {
    return (
      <View style={styles.mobileNavContainer}>

  {renderTab(
    "home",
    "Home",
    <MaterialIcon name="home" size={22} color="#fff" />,
    onHomeClick
  )}

  {isCustomer &&
    renderTab(
      "bookings",
      "Bookings",
      <MaterialIcon name="event-note" size={22} color="#fff" />,
      onBookingsClick
    )}

  {isServiceProvider &&
    renderTab(
      "dashboard",
      "Dashboard",
      <MaterialIcon name="dashboard" size={22} color="#fff" />,
      onDashboardClick
    )}

  {isCustomer &&
    renderTab(
      "wallet",
      "Wallet",
      <MaterialIcon
        name="account-balance-wallet"
        size={22}
        color="#fff"
      />,
      () => setIsWalletOpen(true)
    )}

  {!isAuthenticated && (
    <>
      {renderTab(
        "about",
        "About",
        <Icon name="info-circle" size={20} color="#fff" />,
        onAboutClick
      )}

      {renderTab(
        "contact",
        "Contact",
        <Icon name="phone" size={20} color="#fff" />,
        onContactClick
      )}
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
    // <View style={styles.desktopNavContainer}>
    //   <View style={styles.desktopNavInner}>
    //     {/* Left side - Navigation links */}
    //     <View style={styles.desktopNavLinks}>
    //       {/* Home - Always visible */}
    //       <TouchableOpacity
    //         onPress={onHomeClick}
    //         style={styles.desktopNavItem}
    //       >
    //         <Text style={styles.desktopNavText}>Home</Text>
    //       </TouchableOpacity>

    //       {/* Bookings - Only for CUSTOMER */}
    //       {isCustomer && (
    //         <TouchableOpacity
    //           onPress={onBookingsClick}
    //           style={styles.desktopNavItem}
    //         >
    //           <Text style={styles.desktopNavText}>My Bookings</Text>
    //         </TouchableOpacity>
    //       )}

    //       {/* Dashboard - Only for SERVICE_PROVIDER */}
    //       {isServiceProvider && (
    //         <TouchableOpacity
    //           onPress={onDashboardClick}
    //           style={styles.desktopNavItem}
    //         >
    //           <Text style={styles.desktopNavText}>Dashboard</Text>
    //         </TouchableOpacity>
    //       )}

    //       {/* Not logged in - Show About & Contact */}
    //       {!isAuthenticated && (
    //         <>
    //           <TouchableOpacity
    //             onPress={onAboutClick}
    //             style={styles.desktopNavItem}
    //           >
    //             <Text style={styles.desktopNavText}>About Us</Text>
    //           </TouchableOpacity>

    //           <TouchableOpacity
    //             onPress={onContactClick}
    //             style={styles.desktopNavItem}
    //           >
    //             <Text style={styles.desktopNavText}>Contact Us</Text>
    //           </TouchableOpacity>
    //         </>
    //       )}
    //     </View>

    //     {/* Right side - Action icons */}
    //     <View style={styles.desktopActionIcons}>
    //       {/* Wallet Icon - Only for CUSTOMER */}
    //       {isCustomer && (
    //         <TouchableOpacity
    //           onPress={() => setIsWalletOpen(true)}
    //           style={styles.desktopActionIcon}
    //         >
    //           <MaterialIcon name="account-balance-wallet" size={22} color="#fff" />
    //         </TouchableOpacity>
    //       )}
    //     </View>
    //   </View>

    //   {/* Dialogs */}
    //   <NotificationsDialog 
    //     visible={showNotifications} 
    //     onClose={() => setShowNotifications(false)} 
    //   />
      
    //   <WalletDialog
    //     open={isWalletOpen}
    //     onClose={() => setIsWalletOpen(false)}
    //   />
    // </View>
    <></>
  );
};

const styles = StyleSheet.create({
  // Mobile Styles
  mobileNavContainer: {
     flexDirection: "row",
  backgroundColor: "#0a2a66",
  borderTopWidth: 1,
  borderTopColor: "rgba(255,255,255,0.15)",
  height: 64,
  },
  mobileNavItem: {
    flex: 1,
  alignItems: "center",
  justifyContent: "center",
  height: "100%",
  borderRightWidth: 1,
  borderRightColor: "rgba(255,255,255,0.15)",

  // Reserve space so layout never changes
  borderTopWidth: 3,
  borderTopColor: "transparent",
  },
  mobileNavText: {
    color: "white",
    fontSize: 11,
    marginTop: 4,
    fontWeight: "400",
    textAlign: "center",
    opacity: 0.7,
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
  mobileNavItemActive: {
    flex: 1,                 // FULL width per tab
  // alignItems: "center",
  // justifyContent: "center",
  height: "100%",          // FULL height
  borderRightWidth: 1,     // separator
  borderTopColor: "#ffffff", // active top border 
  borderRightColor: "rgba(255,255,255,0.15)",
},

mobileNavTextActive: {
 color: "#ffffff",
  fontWeight: "700",
  opacity: 1,
},
mobileNavItemInactive: {
  opacity: 0.6,
},

mobileNavTextInactive: {
  color: "#ffffff",
  fontWeight: "400",
  opacity: 0.7,
},



});

export default NavigationFooter;