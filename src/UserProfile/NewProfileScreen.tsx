/* eslint-disable */
import React, { useEffect, useState, useCallback } from "react";
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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth0 } from "react-native-auth0";
import { useDispatch } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import Snackbar from "react-native-snackbar";
import { useAppUser } from "../context/AppUserContext";
import { useTranslation } from "react-i18next";
import providerInstance from "../services/providerInstance";
import { useTheme } from "../Settings/ThemeContext";
import { remove } from "../features/userSlice";
import CustomerProfileSection from "./CustomerProfileSection";
import ServiceProviderProfileSection from "./ServiceProviderProfileSection";
import VendorProfileSection from "./VendorProfileSection";
import MobileNumberDialog from "./MobileNumberDialog";
import Settings from "../Settings/Settings";
import { ProfileHubSkeleton } from "../common/ProfileHubSkeleton";
import {
  extractContactFromPayload,
  formatContactDisplay,
  isValidContact,
} from "../utils/profileContact";

type ProfileSubView = "hub" | "edit";

export interface ProfileScreenProps {
  onBack: () => void;
  onNavigateToBookings?: () => void;
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

const ProfileTopBar = ({
  title,
  onBack,
  textColor,
  borderColor,
  backgroundColor,
}: {
  title: string;
  onBack: () => void;
  textColor: string;
  borderColor: string;
  backgroundColor: string;
}) => {
  const insets = useSafeAreaInsets();
  const { isDarkMode } = useTheme();
  return (
    <View
      style={[
        styles.topBar,
        {
          paddingTop: insets.top > 0 ? insets.top : 8,
          backgroundColor,
          borderBottomColor: borderColor,
        },
      ]}
    >
      <TouchableOpacity
        onPress={onBack}
        style={[
          styles.backButton,
          { backgroundColor: isDarkMode ? "#1e293b" : "#f3f4f6" },
        ]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityLabel="Go back"
      >
        <MaterialIcon name="arrow-back" size={22} color={textColor} />
      </TouchableOpacity>
      <Text style={[styles.topBarTitle, { color: textColor }]}>{title}</Text>
      <View style={styles.topBarSide} />
    </View>
  );
};

const ProfileMenuRow = ({
  item,
  textColor,
  mutedColor,
  borderColor,
}: {
  item: MenuItem;
  textColor: string;
  mutedColor: string;
  borderColor: string;
}) => (
  <TouchableOpacity
    style={[styles.menuRow, { borderBottomColor: borderColor }]}
    onPress={item.onPress}
    activeOpacity={0.65}
  >
    <MaterialIcon
      name={item.icon}
      size={22}
      color={item.destructive ? "#dc2626" : mutedColor}
    />
    <Text
      style={[
        styles.menuLabel,
        { color: item.destructive ? "#dc2626" : textColor },
      ]}
    >
      {item.label}
    </Text>
    {item.showChevron !== false && (
      <MaterialIcon name="chevron-right" size={22} color={mutedColor} />
    )}
  </TouchableOpacity>
);

const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onBack,
  onNavigateToBookings,
  onContact,
  onSignOutComplete,
}) => {
  const { t } = useTranslation();
  const { user: auth0User, isLoading: auth0Loading, clearSession } = useAuth0();
  const { appUser } = useAppUser();
  const { colors, isDarkMode } = useTheme();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();

  const [subView, setSubView] = useState<ProfileSubView>("hub");
  const [settingsVisible, setSettingsVisible] = useState(false);
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

  const textPrimary = isDarkMode ? "#f8fafc" : "#0f172a";
  const textMuted = isDarkMode ? "#94a3b8" : "#64748b";
  const surfaceBg = isDarkMode ? colors.background : "#ffffff";
  const divider = isDarkMode ? "#334155" : "#e5e7eb";
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
      await AsyncStorage.multiRemove(["token", "userRole", "@app_user_data"]);
      try {
        await clearSession({ returnToUrl: "com.serveaso://logout" });
      } catch (e) {
        console.log("No Auth0 session to clear:", e);
      }
      dispatch(remove());
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
        label: t("navigation.settings") || "Settings",
        icon: "settings",
        onPress: () => setSettingsVisible(true),
      },
    ];

    if (userRole === "CUSTOMER") {
      primary.push(
        {
          key: "orders",
          label: t("navigation.bookings") || "My Orders",
          icon: "receipt-long",
          onPress: () => onNavigateToBookings?.(),
        },
        {
          key: "address",
          label: "Address",
          icon: "place",
          onPress: () => setSubView("edit"),
        },
        {
          key: "password",
          label: "Change Password",
          icon: "lock-outline",
          onPress: handleChangePassword,
        }
      );
    }

    const secondary: MenuItem[] = [
      {
        key: "help",
        label: "Help & Support",
        icon: "help-outline",
        onPress: () => onContact?.(),
      },
      {
        key: "logout",
        label: t("navigation.signOut") || "Log out",
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
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
        <ProfileTopBar
          title="Edit Profile"
          onBack={() => setSubView("hub")}
          textColor={textPrimary}
          borderColor={divider}
          backgroundColor={surfaceBg}
        />
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
    <View style={[styles.container, { backgroundColor: surfaceBg }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      <ProfileTopBar
        title="Profile"
        onBack={onBack}
        textColor={textPrimary}
        borderColor={divider}
        backgroundColor={surfaceBg}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        <View style={styles.identitySection}>
          <View style={[styles.avatarRing, { borderColor: textPrimary }]}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatarFallback, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarInitial}>{getInitial()}</Text>
              </View>
            )}
          </View>

          <Text style={[styles.displayName, { color: textPrimary }]}>{getDisplayName()}</Text>
          <Text style={[styles.handle, { color: textMuted }]}>{getHandle()}</Text>

          {contactNumber ? (
            <View style={styles.contactRow}>
              <MaterialIcon name="phone" size={15} color={textMuted} />
              <Text style={[styles.contactText, { color: textMuted }]}>
                {formatContactDisplay(contactNumber)}
              </Text>
            </View>
          ) : null}

          {userRole === "CUSTOMER" && hasMobileNumber === false && (
            <TouchableOpacity
              style={styles.mobileHint}
              onPress={() => setMobileDialogOpen(true)}
            >
              <MaterialIcon name="phone-android" size={16} color="#b45309" />
              <Text style={styles.mobileHintText}>Add mobile number</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.editProfileBtn, { backgroundColor: textPrimary }]}
            onPress={() => setSubView("edit")}
            activeOpacity={0.85}
          >
            <Text style={[styles.editProfileBtnText, { color: surfaceBg }]}>
              Edit Profile
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.menuGroup, { borderTopColor: divider }]}>
          {primary.map((item) => (
            <ProfileMenuRow
              key={item.key}
              item={item}
              textColor={textPrimary}
              mutedColor={textMuted}
              borderColor={divider}
            />
          ))}
        </View>

        <View style={[styles.menuGroup, { borderTopColor: divider }]}>
          {secondary.map((item) => (
            <ProfileMenuRow
              key={item.key}
              item={item}
              textColor={textPrimary}
              mutedColor={textMuted}
              borderColor={divider}
            />
          ))}
        </View>
      </ScrollView>

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

      {settingsVisible && (
        <Settings
          visible
          onClose={() => setSettingsVisible(false)}
        />
      )}
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
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  topBarSide: {
    width: 36,
  },
  identitySection: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
  },
  avatarRing: {
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 2,
    padding: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: 98,
    height: 98,
    borderRadius: 49,
  },
  avatarFallback: {
    width: 98,
    height: 98,
    borderRadius: 49,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontSize: 36,
    fontWeight: "700",
    color: "#ffffff",
  },
  displayName: {
    marginTop: 12,
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.3,
    textAlign: "center",
  },
  handle: {
    marginTop: 6,
    fontSize: 14,
    textAlign: "center",
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  contactText: {
    fontSize: 14,
    fontWeight: "500",
  },
  mobileHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#fef3c7",
  },
  mobileHintText: {
    fontSize: 13,
    color: "#b45309",
    fontWeight: "500",
  },
  editProfileBtn: {
    marginTop: 14,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 200,
    alignItems: "center",
  },
  editProfileBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
  menuGroup: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 0,
    paddingHorizontal: 20,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 14,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },
  editBody: {
    flex: 1,
  },
});

export default ProfileScreen;
