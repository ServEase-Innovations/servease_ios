import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Dimensions,
  Animated,
  Platform,
  Image,
} from "react-native";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import { useAppUser } from "../context/AppUserContext";
import Settings from "../Settings/Settings";
import { useTheme } from "../Settings/ThemeContext";
import AgentRegistrationForm from "../Agent/AgentRegistrationForm";
import LinearGradient from "react-native-linear-gradient";

const { width, height } = Dimensions.get("window");

interface Props {
  visible: boolean;
  onClose: () => void;
  onProfile: () => void;
  onBookings: () => void;
  onDashboard: () => void;
  onWallet: () => void;
  onContact: () => void;
  onLogout?: () => void;
  auth0User?: any;
}

const ProfileMenuSheet: React.FC<Props> = ({
  visible,
  onClose,
  onProfile,
  onBookings,
  onDashboard,
  onWallet,
  onContact,
  onLogout,
  auth0User,
}) => {
  const { appUser } = useAppUser();
  const { colors, isDarkMode } = useTheme();

  // Animation values
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // State for settings modal
  const [showSettings, setShowSettings] = useState(false);
  
  // State for agent registration modal
  const [showAgentRegistration, setShowAgentRegistration] = useState(false);

  const isCustomer = appUser?.role === "CUSTOMER";
  const isServiceProvider = appUser?.role === "SERVICE_PROVIDER";
  const isAdmin = appUser?.role === "ADMIN";

  // Animate modal when visible changes
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
          tension: 40,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: height,
          useNativeDriver: true,
          friction: 8,
          tension: 40,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, fadeAnim]);

  const handleSettingsPress = () => {
    onClose();
    setShowSettings(true);
  };

  const handleCloseSettings = () => {
    setShowSettings(false);
  };

  const handleAgentRegistrationPress = () => {
    onClose();
    setShowAgentRegistration(true);
  };

  const handleCloseAgentRegistration = () => {
    setShowAgentRegistration(false);
  };

  const handleBackToLogin = (data: boolean) => {
    console.log("Back to login:", data);
    setShowAgentRegistration(false);
  };

  const handleLogoutPress = () => {
    onClose();
    if (onLogout) {
      onLogout();
    }
  };

  // Get user display name and email
  const getUserName = () => {
    if (appUser?.name) return appUser.name;
    if (auth0User?.name) return auth0User.name;
    if (appUser?.given_name && appUser?.family_name) {
      return `${appUser.given_name} ${appUser.family_name}`;
    }
    if (auth0User?.given_name && auth0User?.family_name) {
      return `${auth0User.given_name} ${auth0User.family_name}`;
    }
    if (appUser?.email) return appUser.email.split('@')[0];
    if (auth0User?.email) return auth0User.email.split('@')[0];
    return "User";
  };

  const getUserEmail = () => {
    return appUser?.email || auth0User?.email || '';
  };

  // Get user avatar URL
  const getUserAvatar = () => {
    return auth0User?.picture || appUser?.picture || null;
  };

  // Get initials for avatar fallback
  const getUserInitials = () => {
    const name = getUserName();
    if (name === "User") return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="none">
        {/* Overlay with fade animation */}
        <Animated.View 
          style={[
            styles.overlay,
            { opacity: fadeAnim, backgroundColor: 'rgba(0,0,0,0.5)' }
          ]}
        >
          <TouchableWithoutFeedback onPress={onClose}>
            <View style={{ flex: 1 }} />
          </TouchableWithoutFeedback>
        </Animated.View>

        {/* Slide-up sheet */}
        <Animated.View 
          style={[
            styles.sheet,
            { 
              backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          {/* User Profile Header Section with NEW GRADIENT */}
          <LinearGradient
            colors={["#0d1935", "#1c4485", "#255697"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientHeader}
          >
            <Text style={styles.sectionLabel}>
              ACCOUNT
            </Text>
            
            <View style={styles.userInfoContainer}>
              {/* Avatar with gradient background */}
              <LinearGradient
                colors={['#0f766e', '#0d9488']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarContainer}
              >
                {getUserAvatar() ? (
                  <Image
                    source={{ uri: getUserAvatar() }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <Text style={styles.avatarText}>{getUserInitials()}</Text>
                )}
              </LinearGradient>
              
              <View style={styles.userDetails}>
                <Text style={styles.userName} numberOfLines={1}>
                  {getUserName()}
                </Text>
                {getUserEmail() ? (
                  <Text style={styles.userEmail} numberOfLines={1}>
                    {getUserEmail()}
                  </Text>
                ) : null}
              </View>
            </View>
          </LinearGradient>

          {/* Menu Items Container */}
          <View style={styles.menuContainer}>
            {/* Profile Menu Item */}
            <MenuItem 
              label="Profile"
              icon="account-circle"
              iconSet="material"
              onPress={onProfile} 
              colors={colors}
              isDarkMode={isDarkMode}
            />

            {/* Customer specific menu items */}
            {isCustomer && (
              <>
                <MenuItem 
                  label="My Bookings"
                  icon="event-note"
                  iconSet="material"
                  onPress={onBookings} 
                  colors={colors}
                  isDarkMode={isDarkMode}
                />
                <MenuItem 
                  label="Wallet"
                  icon="account-balance-wallet"
                  iconSet="material"
                  onPress={onWallet} 
                  colors={colors}
                  isDarkMode={isDarkMode}
                />
              </>
            )}

            {/* Service Provider specific menu items */}
            {isServiceProvider && (
              <MenuItem 
                label="Dashboard"
                icon="dashboard"
                iconSet="material"
                onPress={onDashboard} 
                colors={colors}
                isDarkMode={isDarkMode}
              />
            )}

            {/* Admin specific menu items - Add Agent Registration for Admin */}
            {isAdmin && (
              <MenuItem 
                label="Agent Registration"
                icon="person-add"
                iconSet="material"
                onPress={handleAgentRegistrationPress} 
                colors={colors}
                isDarkMode={isDarkMode}
              />
            )}

            {/* Divider before settings */}
            <View style={[
              styles.divider,
              { backgroundColor: isDarkMode ? '#334155' : '#e2e8f0' }
            ]} />

            {/* Settings button */}
            <MenuItem 
              label="Settings"
              icon="settings"
              iconSet="material"
              onPress={handleSettingsPress} 
              colors={colors}
              isDarkMode={isDarkMode}
            />
          </View>
        </Animated.View>
      </Modal>

      {/* Settings Modal */}
      <Settings visible={showSettings} onClose={handleCloseSettings} />

      {/* Agent Registration Modal */}
      {showAgentRegistration && (
        <AgentRegistrationForm
          onBackToLogin={handleBackToLogin}
          onClose={handleCloseAgentRegistration}
        />
      )}
    </>
  );
};

// Enhanced MenuItem component with icon container styling
const MenuItem = ({ 
  label, 
  icon, 
  iconSet = "material",
  onPress, 
  danger = false, 
  colors,
  isDarkMode 
}: any) => {
  const renderIcon = () => {
    const iconColor = danger ? (colors?.error || '#ef4444') : (colors?.primary || '#0f766e');
    const iconSize = 22;
    
    if (iconSet === "material") {
      return <MaterialIcon name={icon} size={iconSize} color={iconColor} />;
    } else {
      return <FontAwesome5 name={icon} size={iconSize - 2} color={iconColor} solid={false} />;
    }
  };

  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[
        styles.iconContainer,
        { 
          backgroundColor: isDarkMode ? '#334155' : '#f1f5f9',
        }
      ]}>
        {renderIcon()}
      </View>
      <Text style={[
        styles.menuItemText,
        { 
          color: danger ? (colors?.error || '#ef4444') : (isDarkMode ? '#f1f5f9' : '#1e293b'),
        }
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    maxHeight: height * 0.85,
  },
  gradientHeader: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 12,
    color: "#94a3b8",
  },
  userInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#ffffff",
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
    color: "#ffffff",
  },
  userEmail: {
    fontSize: 12,
    color: "#cbd5e1",
  },
  menuContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: "500",
    flex: 1,
  },
  divider: {
    height: 1,
    marginVertical: 8,
    marginHorizontal: 0,
  },
});

export default ProfileMenuSheet;