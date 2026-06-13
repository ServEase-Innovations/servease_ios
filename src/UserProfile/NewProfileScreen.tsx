/* eslint-disable */
import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
  Animated,
  Dimensions,
  Modal,
  BackHandler,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth0 } from "react-native-auth0";
import { useDispatch } from "react-redux";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import LinearGradient from "react-native-linear-gradient";
import Snackbar from "react-native-snackbar";
import { useAppUser } from "../context/AppUserContext";
import { useTranslation } from "react-i18next";
import providerInstance from "../services/providerInstance";
import { useTheme } from "../Settings/ThemeContext";
import { remove } from "../features/userSlice";
import { clearCustomer } from "../features/customerSlice";
import { clearMobileAuthStorage, tryClearAuth0Session } from "../utils/signOutSession";
import CustomerProfileSection from "./CustomerProfileSection";
import ServiceProviderProfileSection from "./ServiceProviderProfileSection";
import VendorProfileSection from "./VendorProfileSection";
import MobileNumberDialog from "./MobileNumberDialog";
import { ProfileHubSkeleton } from "../common/ProfileHubSkeleton";
import ContactUs from "../ContactUs/ContactUs";
import {
  extractContactFromPayload,
  formatContactDisplay,
  isValidContact,
} from "../utils/profileContact";

const { width, height } = Dimensions.get("window");

type ProfileSubView = "hub" | "edit";

export interface ProfileScreenProps {
  onBack: () => void;
  onNavigateToBookings?: () => void;
  onOpenSettings?: () => void;
  onContact?: () => void;
  onSignOutComplete?: () => Promise<void>;
}

type MenuItem = {
  key: string;
  label: string;
  icon: string;
  showChevron?: boolean;
  destructive?: boolean;
  onPress: () => void;
};

// Modern Profile Top Bar with Glass Effect - No Title
const ProfileTopBar = ({
  onBack,
  scrollY,
}: {
  onBack: () => void;
  scrollY: Animated.Value;
}) => {
  const insets = useSafeAreaInsets();

  return (
    <Animated.View
      style={[
        styles.topBar,
        {
          paddingTop: insets.top > 0 ? insets.top : 8,
        },
      ]}
    >
      <TouchableOpacity
        onPress={onBack}
        style={[
          styles.backButton,
          {
            backgroundColor: 'rgba(255,255,255,0.2)',
          },
        ]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <MaterialIcon name="arrow-back" size={22} color="#ffffff" />
      </TouchableOpacity>
      <View style={styles.topBarSide} />
    </Animated.View>
  );
};

// Modern Menu Row
const ProfileMenuRow = ({
  item,
  isDarkMode,
  index,
}: {
  item: MenuItem;
  isDarkMode: boolean;
  index: number;
}) => {
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        delay: index * 60,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        delay: index * 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }],
        opacity: opacityAnim,
        marginHorizontal: 4,
      }}
    >
      <TouchableOpacity
        style={[
          styles.menuRow,
          {
            backgroundColor: isDarkMode 
              ? 'rgba(30, 41, 59, 0.8)' 
              : 'rgba(255, 255, 255, 0.9)',
          },
        ]}
        onPress={item.onPress}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={item.destructive 
            ? ['#ef4444', '#dc2626'] 
            : isDarkMode 
              ? ['#38bdf8', '#818cf8'] 
              : ['#3b82f6', '#1e3a8a']
          }
          style={styles.menuIconBg}
        >
          <MaterialIcon name={item.icon} size={22} color="#ffffff" />
        </LinearGradient>
        <Text
          style={[
            styles.menuLabel,
            {
              color: item.destructive ? "#ef4444" : isDarkMode ? "#f8fafc" : "#1e293b",
            },
          ]}
        >
          {item.label}
        </Text>
        {item.showChevron !== false && (
          <MaterialIcon
            name="chevron-right"
            size={20}
            color={isDarkMode ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.3)"}
          />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onBack,
  onNavigateToBookings,
  onOpenSettings,
  onContact,
  onSignOutComplete,
}) => {
  const { t } = useTranslation();
  const { user: auth0User, isLoading: auth0Loading, clearSession } = useAuth0();
  const { appUser, clearAppUser } = useAppUser();
  const { isDarkMode } = useTheme();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();

  const [subView, setSubView] = useState<ProfileSubView>("hub");
  const [contactUsVisible, setContactUsVisible] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [mobileDialogOpen, setMobileDialogOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [userRole, setUserRole] = useState<"CUSTOMER" | "SERVICE_PROVIDER" | "VENDOR">(
    "CUSTOMER"
  );
  const [isLoading, setIsLoading] = useState(true);
  const [dialogShownInSession, setDialogShownInSession] = useState(false);
  const [contactNumber, setContactNumber] = useState<string | null>(null);
  const [hasMobileNumber, setHasMobileNumber] = useState<boolean | null>(null);

  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerScale = useRef(new Animated.Value(0.9)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const avatarGlow = useRef(new Animated.Value(0)).current;
  const statsOpacity = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  // Handle device back button
  useEffect(() => {
    const backAction = () => {
      if (contactUsVisible) {
        setContactUsVisible(false);
        return true;
      }
      if (mobileDialogOpen) {
        setMobileDialogOpen(false);
        return true;
      }
      if (subView === "edit") {
        setSubView("hub");
        return true;
      }
      onBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [contactUsVisible, mobileDialogOpen, subView, onBack]);

  useEffect(() => {
    const avatarGlowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(avatarGlow, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(avatarGlow, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: false,
        }),
      ])
    );

    Animated.parallel([
      Animated.spring(headerScale, {
        toValue: 1,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(statsOpacity, {
        toValue: 1,
        duration: 800,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();

    avatarGlowLoop.start();
  }, []);

  const glowIntensity = avatarGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const loadProfileContact = useCallback(
    async (
      role: "CUSTOMER" | "SERVICE_PROVIDER" | "VENDOR",
      id: number
    ) => {
      try {
        let contact = "";
        if (role === "CUSTOMER") {
          const response = await providerInstance.get(`/api/customer/${id}`);
          contact = extractContactFromPayload(response.data?.data);
        } else if (role === "SERVICE_PROVIDER") {
          const response = await providerInstance.get(
            `/api/service-providers/serviceprovider/${id}`
          );
          contact = extractContactFromPayload(response.data?.data);
        } else if (role === "VENDOR") {
          const response = await providerInstance.get(`/api/vendor/${id}`);
          contact = extractContactFromPayload(response.data?.data);
        }

        const valid = isValidContact(contact);
        setContactNumber(valid ? contact : null);
        setHasMobileNumber(valid);

        if (role === "CUSTOMER" && !valid && !dialogShownInSession) {
          setTimeout(() => {
            setMobileDialogOpen(true);
            setDialogShownInSession(true);
          }, 800);
        }
      } catch (error) {
        console.error("Failed to fetch profile contact:", error);
        setContactNumber(null);
        setHasMobileNumber(null);
      }
    },
    [dialogShownInSession]
  );

  useEffect(() => {
    const initializeProfile = async () => {
      setIsLoading(true);
      if (appUser) {
        const name = appUser.name || null;
        const email = appUser.email || null;
        const role = appUser.role || "CUSTOMER";
        setUserRole(role);
        setUserName(name);
        setUserEmail(email);

        let id: number | null = null;
        if (role === "SERVICE_PROVIDER") {
          id = appUser.serviceProviderId ? Number(appUser.serviceProviderId) : null;
        } else if (role === "CUSTOMER") {
          id = appUser.customerid ? Number(appUser.customerid) : null;
        } else if (role === "VENDOR") {
          id = appUser.vendorId ? Number(appUser.vendorId) : null;
        }
        setUserId(id);

        if (id) {
          await loadProfileContact(role, id);
        } else {
          setContactNumber(null);
          setHasMobileNumber(null);
        }
      }
      setIsLoading(false);
    };
    initializeProfile();
  }, [appUser, loadProfileContact]);

  const getHandle = () => {
    const email = userEmail || appUser?.email || auth0User?.email;
    if (!email) return "@user";
    const local = email.split("@")[0] || "user";
    return `@${local.toLowerCase().replace(/[^a-z0-9._]/g, "")}`;
  };

  const getDisplayName = () => userName || appUser?.name || t("profile.page.user");

  const getAvatarUri = () => appUser?.picture || auth0User?.picture || null;

  const getInitial = () => getDisplayName().charAt(0).toUpperCase();

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      Snackbar.show({
        text: t("navigation.signingOutMsg") || "Signing out…",
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
      console.log("Sign out error:", e);
      Snackbar.show({
        text: t("navigation.signOut") || "Sign out failed",
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: "#ef4444",
        textColor: "#ffffff",
      });
    } finally {
      setIsSigningOut(false);
    }
  };

  const confirmSignOut = () => {
    Alert.alert(
      t("navigation.signOut") || "Log out",
      "Are you sure you want to log out?",
      [
        { text: t("common.cancel") || "Cancel", style: "cancel" },
        {
          text: t("navigation.signOut") || "Log out",
          style: "destructive",
          onPress: handleSignOut,
        },
      ]
    );
  };

  const handleChangePassword = () => {
    Alert.alert(
      "Change Password",
      "Use the Forgot Password option on the login screen to reset your password.",
      [{ text: "OK" }]
    );
  };

  const buildMenuItems = (): { primary: MenuItem[]; secondary: MenuItem[] } => {
    const primary: MenuItem[] = [
      {
        key: "settings",
        label: "Settings",
        icon: "settings",
        onPress: () => onOpenSettings?.(),
      },
    ];

    if (userRole === "CUSTOMER") {
      primary.push(
        {
          key: "orders",
          label: "My Orders",
          icon: "receipt-long",
          onPress: () => onNavigateToBookings?.(),
        },
        {
          key: "address",
          label: "Address Book",
          icon: "place",
          onPress: () => setSubView("edit"),
        },
        {
          key: "password",
          label: "Security",
          icon: "lock-outline",
          onPress: handleChangePassword,
        }
      );
    }

    const secondary: MenuItem[] = [
      {
        key: "help",
        label: "Help Center",
        icon: "help-outline",
        onPress: () => setContactUsVisible(true),
      },
      {
        key: "logout",
        label: "Sign Out",
        icon: "logout",
        showChevron: false,
        destructive: true,
        onPress: confirmSignOut,
      },
    ];

    return { primary, secondary };
  };

  const showProfileSkeleton = isLoading || (auth0Loading && !appUser);

  if (showProfileSkeleton) {
    return <ProfileHubSkeleton />;
  }

  if (subView === "edit") {
    return (
      <View style={[styles.container, { backgroundColor: isDarkMode ? "#0f172a" : "#f1f5f9" }]}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
        <View style={[styles.editHeader, { paddingTop: insets.top > 0 ? insets.top : 8 }]}>
          <TouchableOpacity
            onPress={() => setSubView("hub")}
            style={styles.editBackButton}
          >
            <MaterialIcon name="arrow-back" size={22} color={isDarkMode ? "#f8fafc" : "#1e293b"} />
          </TouchableOpacity>
          <Text style={[styles.editHeaderTitle, { color: isDarkMode ? "#f8fafc" : "#1e293b" }]}>
            Edit Profile
          </Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.editBody}>
          {userRole === "CUSTOMER" ? (
            <CustomerProfileSection
              userId={userId}
              userEmail={userEmail}
              onBack={() => setSubView("hub")}
              embedMode
            />
          ) : userRole === "SERVICE_PROVIDER" ? (
            <ServiceProviderProfileSection userId={userId} userEmail={userEmail} />
          ) : (
            <VendorProfileSection userId={userId} userEmail={userEmail} onBack={() => setSubView("hub")} />
          )}
        </View>
      </View>
    );
  }

  const { primary, secondary } = buildMenuItems();
  const avatarUri = getAvatarUri();

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? "#0f172a" : "#f1f5f9" }]}>
      <StatusBar barStyle="light-content" />

      <ProfileTopBar
        onBack={onBack}
        scrollY={scrollY}
      />

      <Animated.ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ 
          paddingBottom: insets.bottom + 30,
          paddingTop: 0,
        }}
        contentInset={{ top: 0 }}
        contentOffset={{ x: 0, y: 0 }}
        automaticallyAdjustContentInsets={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Hero Header Section - No extra spacing */}
        <View style={styles.heroContainer}>
          <LinearGradient
            colors={
              isDarkMode
                ? ["#1e1b4b", "#0f172a", "#0f172a"]
                : ["#1e3a5f", "#1e40af", "#1e3a5f"]
            }
            style={styles.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Decorative Circles */}
            <View style={styles.decorCircle1} />
            <View style={styles.decorCircle2} />
            <View style={styles.decorCircle3} />
            <View style={styles.decorCircle4} />
            
            <Animated.View
              style={[
                styles.identitySection,
                {
                  transform: [{ scale: headerScale }],
                  opacity: headerOpacity,
                },
              ]}
            >
              {/* Animated Avatar with Pulsing Glow */}
              <View style={styles.avatarWrapper}>
                <Animated.View
                  style={[
                    styles.avatarGlowRing,
                    {
                      opacity: glowIntensity,
                    },
                  ]}
                />
                <LinearGradient
                  colors={isDarkMode ? ["#38bdf8", "#818cf8"] : ["#3b82f6", "#1e3a8a"]}
                  style={styles.avatarGradientRing}
                >
                  <View style={[styles.avatarRingInner, { backgroundColor: isDarkMode ? "#0f172a" : "#ffffff" }]}>
                    {avatarUri ? (
                      <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                    ) : (
                      <LinearGradient
                        colors={isDarkMode ? ["#38bdf8", "#818cf8"] : ["#3b82f6", "#1e3a8a"]}
                        style={styles.avatarFallback}
                      >
                        <Text style={styles.avatarInitial}>{getInitial()}</Text>
                      </LinearGradient>
                    )}
                  </View>
                </LinearGradient>
              </View>

              <Text style={[styles.displayName, { color: "#ffffff" }]}>
                {getDisplayName()}
              </Text>
              <Text style={[styles.handle, { color: "rgba(255,255,255,0.8)" }]}>
                {getHandle()}
              </Text>

              {/* Stats Row */}
              <Animated.View style={[styles.statsRow, { opacity: statsOpacity }]}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>28</Text>
                  <Text style={styles.statLabel}>Orders</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>12</Text>
                  <Text style={styles.statLabel}>Reviews</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>Feb 2024</Text>
                  <Text style={styles.statLabel}>Joined</Text>
                </View>
              </Animated.View>

              {contactNumber ? (
                <View style={styles.contactRow}>
                  <View style={styles.contactChip}>
                    <MaterialIcon name="phone" size={14} color="#ffffff" />
                    <Text style={[styles.contactText, { color: "#ffffff" }]}>
                      {formatContactDisplay(contactNumber)}
                    </Text>
                  </View>
                </View>
              ) : null}

              {userRole === "CUSTOMER" && hasMobileNumber === false && (
                <TouchableOpacity style={styles.mobileHint} onPress={() => setMobileDialogOpen(true)}>
                  <MaterialIcon name="phone-android" size={16} color="#fbbf24" />
                  <Text style={styles.mobileHintText}>Add mobile number</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.editProfileBtn}
                onPress={() => setSubView("edit")}
                activeOpacity={0.85}
              >
                <Text style={styles.editProfileBtnText}>
                  Edit Profile
                </Text>
                <View style={styles.editIconChip}>
                  <MaterialIcon name="edit" size={14} color="#ffffff" />
                </View>
              </TouchableOpacity>
            </Animated.View>
          </LinearGradient>
        </View>

        {/* Menu Sections */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
          {/* Primary Menu Section */}
          <View style={styles.menuSection}>
            {primary.map((item, idx) => (
              <ProfileMenuRow
                key={item.key}
                item={item}
                isDarkMode={isDarkMode}
                index={idx}
              />
            ))}
          </View>

          {/* Secondary Menu Section */}
          <View style={styles.menuSection}>
            {secondary.map((item, idx) => (
              <ProfileMenuRow
                key={item.key}
                item={item}
                isDarkMode={isDarkMode}
                index={primary.length + idx}
              />
            ))}
          </View>
        </View>
      </Animated.ScrollView>

      {mobileDialogOpen && userId && userRole === "CUSTOMER" && (
        <MobileNumberDialog
          visible={mobileDialogOpen}
          onClose={() => setMobileDialogOpen(false)}
          customerId={userId}
          onSuccess={() => {
            setHasMobileNumber(true);
            setMobileDialogOpen(false);
            if (userId) {
              loadProfileContact("CUSTOMER", userId);
            }
          }}
        />
      )}

      {/* Contact Us Modal */}
      <Modal
        visible={contactUsVisible}
        animationType="slide"
        onRequestClose={() => setContactUsVisible(false)}
      >
        <ContactUs onBack={() => setContactUsVisible(false)} />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  topBarSide: {
    width: 40,
  },
  heroContainer: {
    overflow: "hidden",
    width: "100%",
  },
  heroGradient: {
    width: "100%",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: "hidden",
    paddingBottom: 34,
  },
  decorCircle1: {
    position: "absolute",
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  decorCircle2: {
    position: "absolute",
    bottom: -80,
    left: -80,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  decorCircle3: {
    position: "absolute",
    top: 150,
    left: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(56,189,248,0.1)",
  },
  decorCircle4: {
    position: "absolute",
    bottom: 50,
    right: -40,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(129,140,248,0.08)",
  },
  identitySection: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 16,
  },
  avatarWrapper: {
    marginBottom: 14,
    position: "relative",
  },
  avatarGlowRing: {
    position: "absolute",
    width: 118,
    height: 118,
    borderRadius: 59,
    backgroundColor: "#38bdf8",
    top: -9,
    left: -9,
  },
  avatarGradientRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    padding: 3,
    shadowColor: "#38bdf8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarRingInner: {
    width: 94,
    height: 94,
    borderRadius: 47,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  avatarFallback: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontSize: 34,
    fontWeight: "700",
    color: "#ffffff",
  },
  displayName: {
    marginTop: 4,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  handle: {
    marginTop: 2,
    fontSize: 13,
    textAlign: "center",
    opacity: 0.8,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 14,
    gap: 16,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 16,
    fontWeight: "800",
    color: "#ffffff",
  },
  statLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 26,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  contactChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  contactText: {
    fontSize: 13,
    fontWeight: "600",
  },
  mobileHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 30,
    backgroundColor: "rgba(251, 191, 36, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(251, 191, 36, 0.3)",
  },
  mobileHintText: {
    fontSize: 13,
    color: "#fbbf24",
    fontWeight: "600",
  },
  editProfileBtn: {
    marginTop: 14,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 20,
    minHeight: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 4,
  },
  editProfileBtnText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 0.2,
  },
  editIconChip: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  menuSection: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: "hidden",
    gap: 8,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 14,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
  },
  editBody: {
    flex: 1,
  },
  editHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: "transparent",
  },
  editBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  editHeaderTitle: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
});

export default ProfileScreen;