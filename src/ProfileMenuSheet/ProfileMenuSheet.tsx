import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Dimensions,
  Image,
  Modal,
  Animated,
  PanResponder,
} from "react-native";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppUser } from "../context/AppUserContext";
import { useTheme } from "../Settings/ThemeContext";
import AgentRegistrationForm from "../Agent/AgentRegistrationForm";
import LinearGradient from "react-native-linear-gradient";
import { getMobileTabBarHeight } from "../Constants/mobileLayout";
import ContactUs from "../ContactUs/ContactUs"; // Import the ContactUs component

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const DISMISS_DRAG = 72;

interface Props {
  visible: boolean;
  onClose: () => void;
  onProfile: () => void;
  onBookings?: () => void;
  onDashboard: () => void;
  onWallet?: () => void;
  onContact: () => void;
  onOpenSettings?: () => void;
  onLogout?: () => void;
  auth0User?: any;
  dockAboveTabBar?: boolean;
}

const formatDisplayName = (raw: string) => {
  if (!raw) return "User";
  return raw
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
};

const roleLabel = (role?: string) => {
  switch (role) {
    case "CUSTOMER":
      return "Customer";
    case "SERVICE_PROVIDER":
      return "Service provider";
    case "ADMIN":
      return "Admin";
    case "VENDOR":
      return "Agent";
    default:
      return "Member";
  }
};

const ProfileMenuSheet: React.FC<Props> = ({
  visible,
  onClose,
  onProfile,
  onDashboard,
  onContact,
  onOpenSettings,
  auth0User,
  dockAboveTabBar = false,
}) => {
  const { appUser } = useAppUser();
  const { colors, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const safeBottom = Number.isFinite(insets.bottom) ? insets.bottom : 0;
  const tabBarOffset = dockAboveTabBar ? getMobileTabBarHeight(safeBottom) : 0;

  const [showAgentRegistration, setShowAgentRegistration] = useState(false);
  const [showContactUs, setShowContactUs] = useState(false); // State for ContactUs modal
  const [mounted, setMounted] = useState(visible);

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const isServiceProvider = appUser?.role === "SERVICE_PROVIDER";
  const isAdmin = appUser?.role === "ADMIN";

  useEffect(() => {
    if (visible) {
      setMounted(true);
      dragY.setValue(0);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          friction: 9,
          tension: 70,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 240,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setMounted(false);
        dragY.setValue(0);
      });
    }
  }, [visible, mounted, slideAnim, dragY, fadeAnim]);

  const dismissSheet = () => {
    dragY.setValue(0);
    onClose();
  };

  const handleContactPress = () => {
    dismissSheet();
    setShowContactUs(true); // Show ContactUs component instead of calling onContact directly
  };

  const handleCloseContactUs = () => {
    setShowContactUs(false);
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          gesture.dy > 6 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onPanResponderMove: (_, gesture) => {
          if (gesture.dy > 0) {
            dragY.setValue(gesture.dy);
          }
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy > DISMISS_DRAG || gesture.vy > 0.45) {
            dismissSheet();
          } else {
            Animated.spring(dragY, {
              toValue: 0,
              useNativeDriver: true,
              friction: 8,
            }).start();
          }
        },
        onPanResponderTerminate: () => {
          Animated.spring(dragY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        },
      }),
    [dragY]
  );

  const getUserName = () => {
    if (appUser?.name) return formatDisplayName(appUser.name);
    if (auth0User?.name) return formatDisplayName(auth0User.name);
    if (appUser?.given_name && appUser?.family_name) {
      return formatDisplayName(`${appUser.given_name} ${appUser.family_name}`);
    }
    if (auth0User?.given_name && auth0User?.family_name) {
      return formatDisplayName(`${auth0User.given_name} ${auth0User.family_name}`);
    }
    const email = appUser?.email || auth0User?.email;
    if (email) return email.split("@")[0];
    return "User";
  };

  const getUserEmail = () => appUser?.email || auth0User?.email || "";
  const getUserAvatar = () => auth0User?.picture || appUser?.picture || null;

  const getUserInitials = () => {
    const name = getUserName();
    if (name === "User") return "U";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const sheetSurface = isDarkMode ? "#0f172a" : "#f8fafc";
  const cardBg = isDarkMode ? "#1e293b" : "#ffffff";
  const cardBorder = isDarkMode ? "#334155" : "#e2e8f0";
  const mutedText = isDarkMode ? "#94a3b8" : "#64748b";
  const primaryText = isDarkMode ? "#f1f5f9" : "#0f172a";

  const menuItems: Array<{
    key: string;
    label: string;
    subtitle?: string;
    icon: string;
    onPress: () => void;
  }> = [
    {
      key: "profile",
      label: "View profile",
      subtitle: "Personal details & preferences",
      icon: "person-outline",
      onPress: () => {
        dismissSheet();
        onProfile();
      },
    },
  ];

  if (isAdmin) {
    menuItems.push({
      key: "agent",
      label: "Agent registration",
      subtitle: "Onboard new agents",
      icon: "person-add-alt",
      onPress: () => {
        dismissSheet();
        setShowAgentRegistration(true);
      },
    });
  }

  menuItems.push(
    {
      key: "contact",
      label: "Help & contact",
      subtitle: "Reach our support team",
      icon: "support-agent",
      onPress: handleContactPress, // Updated to use the new handler
    },
  );

  if (!mounted) {
    return (
      <>
        {showAgentRegistration && (
          <AgentRegistrationForm
            onBackToLogin={() => setShowAgentRegistration(false)}
            onClose={() => setShowAgentRegistration(false)}
          />
        )}
        {/* ContactUs Modal */}
        <Modal
          visible={showContactUs}
          animationType="slide"
          onRequestClose={handleCloseContactUs}
        >
          <ContactUs onBack={handleCloseContactUs} />
        </Modal>
      </>
    );
  }

  const sheetTranslateY = Animated.add(slideAnim, dragY);

  return (
    <>
      <Modal visible={mounted} transparent animationType="none" onRequestClose={dismissSheet}>
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <TouchableWithoutFeedback onPress={dismissSheet}>
            <View style={styles.overlayTap} />
          </TouchableWithoutFeedback>
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              bottom: tabBarOffset,
              width: SCREEN_WIDTH,
              backgroundColor: sheetSurface,
              transform: [{ translateY: sheetTranslateY }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.headerShell}>
            <LinearGradient
              colors={["#020617", "#0f2744", "#1d4ed8"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.headerGradient}
            >
              <View style={styles.headerToolbar}>
                <View style={styles.handle} />
                {/* <TouchableOpacity
                  onPress={dismissSheet}
                  style={styles.closeBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityLabel="Close menu"
                >
                  <MaterialIcon name="close" size={22} color="#0f172a" />
                </TouchableOpacity> */}
              </View>

              <View style={styles.profileRow}>
                <View style={styles.avatarWrap}>
                  {getUserAvatar() ? (
                    <Image source={{ uri: getUserAvatar() }} style={styles.avatarImage} />
                  ) : (
                    <View style={styles.avatarFallback}>
                      <Text style={styles.avatarText}>{getUserInitials()}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.userTextCol}>
                  <View style={styles.rolePill}>
                    <MaterialIcon name="verified-user" size={11} color="#bfdbfe" />
                    <Text style={styles.rolePillText}>{roleLabel(appUser?.role)}</Text>
                  </View>
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
          </View>

          <View style={[styles.bodySection, { backgroundColor: sheetSurface }]}>
            <View
              style={[
                styles.menuCard,
                { backgroundColor: cardBg, borderColor: cardBorder },
              ]}
            >
              {menuItems.map((item, index) => (
                <React.Fragment key={item.key}>
                  {index > 0 && (
                    <View style={[styles.rowDivider, { backgroundColor: cardBorder }]} />
                  )}
                  <MenuRow
                    label={item.label}
                    subtitle={item.subtitle}
                    icon={item.icon}
                    onPress={item.onPress}
                    primaryText={primaryText}
                    mutedText={mutedText}
                    accent={colors.primary}
                    isDarkMode={isDarkMode}
                  />
                </React.Fragment>
              ))}
            </View>
          </View>
        </Animated.View>
      </Modal>

      {showAgentRegistration && (
        <AgentRegistrationForm
          onBackToLogin={() => setShowAgentRegistration(false)}
          onClose={() => setShowAgentRegistration(false)}
        />
      )}

      {/* ContactUs Modal - Displayed when Help & Contact is clicked */}
      <Modal
        visible={showContactUs}
        animationType="slide"
        onRequestClose={handleCloseContactUs}
      >
        <ContactUs onBack={handleCloseContactUs} />
      </Modal>
    </>
  );
};

const MenuRow = ({
  label,
  subtitle,
  icon,
  onPress,
  primaryText,
  mutedText,
  accent,
  isDarkMode,
}: {
  label: string;
  subtitle?: string;
  icon: string;
  onPress: () => void;
  primaryText: string;
  mutedText: string;
  accent: string;
  isDarkMode: boolean;
}) => (
  <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.65}>
    <View
      style={[
        styles.iconWrap,
        { backgroundColor: isDarkMode ? "#0f172a" : "#eff6ff" },
      ]}
    >
      <MaterialIcon name={icon} size={22} color={accent} />
    </View>
    <View style={styles.menuRowText}>
      <Text style={[styles.menuLabel, { color: primaryText }]}>{label}</Text>
      {subtitle ? (
        <Text style={[styles.menuSubtitle, { color: mutedText }]} numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}
    </View>
    <MaterialIcon name="chevron-right" size={22} color={mutedText} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
  },
  overlayTap: {
    flex: 1,
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    overflow: "hidden",
    flexGrow: 0,
    flexShrink: 0,
  },
  headerShell: {
    width: SCREEN_WIDTH,
    flexGrow: 0,
    flexShrink: 0,
  },
  headerGradient: {
    width: SCREEN_WIDTH,
    paddingBottom: 0,
    flexGrow: 0,
    flexShrink: 0,
  },
  headerToolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 10,
    paddingBottom: 6,
    paddingHorizontal: 16,
    position: "relative",
    minHeight: 40,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.45)",
  },
  closeBtn: {
    position: "absolute",
    right: 14,
    top: 6,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 18,
  },
  avatarWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.35)",
    overflow: "hidden",
    backgroundColor: "#38bdf8",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0284c7",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
  },
  userTextCol: {
    flex: 1,
    minWidth: 0,
    paddingRight: 36,
    justifyContent: "center",
    paddingBottom: 2,
  },
  rolePill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    marginBottom: 6,
  },
  rolePillText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#e0f2fe",
  },
  userName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: -0.2,
  },
  userEmail: {
    fontSize: 12,
    color: "rgba(226, 232, 240, 0.88)",
    marginTop: 2,
    paddingBottom: 2,
  },
  bodySection: {
    width: SCREEN_WIDTH,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
    flexGrow: 0,
    flexShrink: 0,
    zIndex: 1,
  },
  menuCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    zIndex: 2,
    elevation: 2,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 12,
    gap: 12,
  },
  rowDivider: {
    height: 1,
    marginLeft: 52,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  menuRowText: {
    flex: 1,
    minWidth: 0,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  menuSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
});

export default ProfileMenuSheet;