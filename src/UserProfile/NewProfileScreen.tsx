/* eslint-disable */
import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  Animated,
  BackHandler,
} from "react-native";
import { Text } from "../theme/BrandTypography";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth0 } from "react-native-auth0";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import LinearGradient from "react-native-linear-gradient";
import { useAppUser } from "../context/AppUserContext";
import { useTranslation } from "react-i18next";
import providerInstance from "../services/providerInstance";
import { useTheme } from "../Settings/ThemeContext";
import CustomerProfileSection from "./CustomerProfileSection";
import ServiceProviderProfileSection from "./ServiceProviderProfileSection";
import VendorProfileSection from "./VendorProfileSection";
import MobileNumberDialog from "./MobileNumberDialog";
import { ProfileHubSkeleton } from "../common/ProfileHubSkeleton";
import {
  extractContactFromPayload,
  formatContactDisplay,
  isValidContact,
  parseAlternateContact,
} from "../utils/profileContact";
import preferenceInstance from "../services/preferenceInstance";
import PaymentInstance from "../services/paymentInstance";
import { HOME_M3 } from "../theme/brandColors";
import { getMobileTabBarHeight } from "../Constants/mobileLayout";

type ProfileSubView = "hub" | "edit";
type ProfileEditIntent = "profile" | "addAddress";

type HubAddress = {
  id: string;
  type: string;
  street: string;
};

type HubProfileDetails = {
  firstName: string;
  lastName: string;
  altContact: string;
  joinedAt: string | null;
};

const formatJoinedLabel = (raw: string | null | undefined): string => {
  if (!raw) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
};

const formatCleanName = (raw: string | null | undefined): string => {
  if (!raw) return "";
  const trimmed = raw.trim();
  if (!trimmed) return "";
  return trimmed
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

const formatRoleBadge = (role: "CUSTOMER" | "SERVICE_PROVIDER" | "VENDOR"): string => {
  switch (role) {
    case "SERVICE_PROVIDER":
      return "Service Provider";
    case "VENDOR":
      return "Agent";
    default:
      return "Customer";
  }
};

const getAddressIconName = (type: string): string => {
  const normalized = (type || "").toLowerCase();
  if (normalized.includes("home")) return "home";
  if (normalized.includes("work") || normalized.includes("office")) return "work";
  return "location-on";
};

const SectionTitle = ({ children, isDarkMode }: { children: string; isDarkMode?: boolean }) => (
  <Text style={[hubStyles.sectionTitle, isDarkMode && { color: "#94a3b8" }]}>{children}</Text>
);

const InfoRow = ({
  icon,
  label,
  value,
  isDarkMode,
  primaryText,
  secondaryText,
  rightBadge,
  isLast,
  dividerColor,
}: {
  icon: string;
  label: string;
  value: string;
  isDarkMode?: boolean;
  primaryText: string;
  secondaryText: string;
  rightBadge?: React.ReactNode;
  isLast?: boolean;
  dividerColor: string;
}) => (
  <View>
    <View style={hubStyles.infoRow}>
      <View
        style={[
          hubStyles.infoIconWrap,
          { backgroundColor: isDarkMode ? "rgba(56, 189, 248, 0.12)" : "#E0F2FE" },
        ]}
      >
        <MaterialIcon
          name={icon}
          size={19}
          color={isDarkMode ? "#38bdf8" : "#0284c7"}
        />
      </View>
      <View style={hubStyles.infoTextCol}>
        <Text style={[hubStyles.infoLabel, { color: secondaryText }]}>{label}</Text>
        <Text style={[hubStyles.infoValue, { color: primaryText }]} numberOfLines={2}>
          {value || "Not set"}
        </Text>
      </View>
      {rightBadge}
    </View>
    {!isLast && <View style={[hubStyles.infoDivider, { backgroundColor: dividerColor }]} />}
  </View>
);

export interface ProfileScreenProps {
  onBack: () => void;
  onNavigateToBookings?: () => void;
  onOpenSettings?: () => void;
  onContact?: () => void;
  onSignOutComplete?: () => Promise<void>;
}

const PROFILE_NAV_ROW_HEIGHT = 44;

const ProfileNavBar = ({
  onBack,
  onEdit,
  topInset,
}: {
  onBack: () => void;
  onEdit: () => void;
  topInset: number;
}) => (
  <View style={[hubStyles.navBar, { paddingTop: topInset }]}>
    <TouchableOpacity
      onPress={onBack}
      style={hubStyles.navBackBtn}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      accessibilityLabel="Go back"
    >
      <MaterialIcon name="arrow-back" size={20} color={HOME_M3.onPrimary} />
    </TouchableOpacity>
    <Text style={hubStyles.navTitle}>My Account</Text>
    <TouchableOpacity
      onPress={onEdit}
      style={hubStyles.navActionBtn}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      accessibilityLabel="Edit profile"
    >
      <MaterialIcon name="edit" size={18} color={HOME_M3.onPrimary} />
    </TouchableOpacity>
  </View>
);

const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onBack,
  onNavigateToBookings,
  onOpenSettings,
  onContact,
  onSignOutComplete,
}) => {
  const { t } = useTranslation();
  const { user: auth0User, isLoading: auth0Loading } = useAuth0();
  const { appUser } = useAppUser();
  const { isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();

  const [subView, setSubView] = useState<ProfileSubView>("hub");
  const [editIntent, setEditIntent] = useState<ProfileEditIntent>("profile");
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
  const [profileDetails, setProfileDetails] = useState<HubProfileDetails>({
    firstName: "",
    lastName: "",
    altContact: "",
    joinedAt: null,
  });
  const [addresses, setAddresses] = useState<HubAddress[]>([]);
  const [orderCount, setOrderCount] = useState<number | null>(null);

  // Animation values
  const headerScale = useRef(new Animated.Value(0.9)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const statsOpacity = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const prevSubViewRef = useRef<ProfileSubView>("hub");

  // Handle device back button
  useEffect(() => {
    const backAction = () => {
      if (mobileDialogOpen) {
        setMobileDialogOpen(false);
        return true;
      }
      if (subView === "edit") {
        setEditIntent("profile");
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
  }, [mobileDialogOpen, subView, onBack]);

  useEffect(() => {
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
  }, []);

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

  const parseAddressesFromPreferences = (data: unknown): HubAddress[] => {
    if (!Array.isArray(data) || data.length === 0) return [];
    const allSavedLocations = data.flatMap((doc: { savedLocations?: unknown[] }) => doc.savedLocations || []);
    const unique = new Map<string, HubAddress>();

    allSavedLocations.forEach((loc: any, idx: number) => {
      const primaryAddress = loc?.location?.address?.[0];
      const formatted = primaryAddress?.formatted_address;
      if (!formatted) return;
      const key =
        loc?.location?.lat && loc?.location?.lng
          ? `${loc.location.lat},${loc.location.lng}`
          : formatted;
      if (!unique.has(key)) {
        unique.set(key, {
          id: String(loc?._id || `addr_${idx}`),
          type: String(loc?.name || "Home"),
          street: formatted,
        });
      }
    });

    return Array.from(unique.values());
  };

  const loadHubProfileData = useCallback(
    async (role: "CUSTOMER" | "SERVICE_PROVIDER" | "VENDOR", id: number) => {
      try {
        if (role === "CUSTOMER") {
          const [custRes, prefRes, engagementsRes] = await Promise.all([
            providerInstance.get(`/api/customer/${id}`),
            preferenceInstance.get(`/api/user-settings/${id}`).catch(() => null),
            PaymentInstance.get(`/api/customers/${id}/engagements`).catch(() => null),
          ]);

          const data = custRes.data?.data || {};
          setProfileDetails({
            firstName: String(data.firstName || data.firstname || ""),
            lastName: String(data.lastName || data.lastname || ""),
            altContact: parseAlternateContact(data),
            joinedAt: data.created_at || data.createdAt || null,
          });
          setAddresses(parseAddressesFromPreferences(prefRes?.data));

          const bucket = engagementsRes?.data || {};
          const total =
            (bucket.current?.length || 0) +
            (bucket.upcoming?.length || 0) +
            (bucket.past?.length || 0);
          setOrderCount(total);
        } else if (role === "SERVICE_PROVIDER") {
          const response = await providerInstance.get(`/api/service-providers/serviceprovider/${id}`);
          const data = response.data?.data || {};
          setProfileDetails({
            firstName: String(data.firstName || data.firstname || ""),
            lastName: String(data.lastName || data.lastname || ""),
            altContact: parseAlternateContact(data),
            joinedAt: data.created_at || data.createdAt || null,
          });
          setAddresses([]);
          setOrderCount(null);
        } else {
          const response = await providerInstance.get(`/api/vendor/${id}`);
          const data = response.data?.data || response.data || {};
          setProfileDetails({
            firstName: String(data.firstName || data.firstname || ""),
            lastName: String(data.lastName || data.lastname || ""),
            altContact: parseAlternateContact(data),
            joinedAt: data.created_at || data.createdAt || null,
          });
          setAddresses([]);
          setOrderCount(null);
        }
      } catch (error) {
        console.error("Failed to load profile hub data:", error);
      }
    },
    []
  );

  useEffect(() => {
    if (prevSubViewRef.current === "edit" && subView === "hub" && userId) {
      void loadHubProfileData(userRole, userId);
      void loadProfileContact(userRole, userId);
    }
    prevSubViewRef.current = subView;
  }, [subView, userId, userRole, loadHubProfileData, loadProfileContact]);

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
          await Promise.all([loadProfileContact(role, id), loadHubProfileData(role, id)]);
        } else {
          setContactNumber(null);
          setHasMobileNumber(null);
        }
      }
      setIsLoading(false);
    };
    initializeProfile();
  }, [appUser, loadProfileContact, loadHubProfileData]);

  const getHandle = () => {
    const email = userEmail || appUser?.email || auth0User?.email;
    if (!email) return "@user";
    const local = email.split("@")[0] || "user";
    return `@${local.toLowerCase().replace(/[^a-z0-9._]/g, "")}`;
  };

  const getDisplayName = () => {
    const full = `${profileDetails.firstName} ${profileDetails.lastName}`.trim();
    if (full) return formatCleanName(full);
    const fallback = userName || appUser?.name || t("profile.page.user");
    return formatCleanName(fallback) || fallback;
  };

  const getAvatarUri = () => appUser?.picture || auth0User?.picture || null;

  const getInitials = () => {
    const first = profileDetails.firstName?.trim();
    const last = profileDetails.lastName?.trim();
    if (first && last) return `${first[0]}${last[0]}`.toUpperCase();
    if (first) return first.slice(0, 2).toUpperCase();
    const name = getDisplayName();
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase() || "U";
  };

  const showProfileSkeleton = isLoading || (auth0Loading && !appUser);

  if (showProfileSkeleton) {
    return <ProfileHubSkeleton />;
  }

  const footerClearance = getMobileTabBarHeight(insets.bottom);

  if (subView === "edit") {
    const editTitle = editIntent === "addAddress" ? "Add New Address" : "Edit Profile";

    return (
      <View style={[styles.container, { backgroundColor: isDarkMode ? "#0f172a" : "#f1f5f9" }]}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
        <View style={[styles.editHeader, { paddingTop: insets.top > 0 ? insets.top : 4 }]}>
          <TouchableOpacity
            onPress={() => {
              setEditIntent("profile");
              setSubView("hub");
            }}
            style={styles.editBackButton}
          >
            <MaterialIcon name="arrow-back" size={22} color={isDarkMode ? "#f8fafc" : "#1e293b"} />
          </TouchableOpacity>
          <Text style={[styles.editHeaderTitle, { color: isDarkMode ? "#f8fafc" : "#1e293b" }]}>
            {editTitle}
          </Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={[styles.editBody, { paddingBottom: footerClearance }]}>
          {userRole === "CUSTOMER" ? (
            <CustomerProfileSection
              userId={userId}
              userEmail={userEmail}
              onBack={() => {
                setEditIntent("profile");
                setSubView("hub");
              }}
              embedMode
              initialOpenAddAddress={editIntent === "addAddress"}
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

  const avatarUri = getAvatarUri();
  const navTop = insets.top > 0 ? insets.top : 0;
  const navHeight = navTop + PROFILE_NAV_ROW_HEIGHT;
  const primaryContact = contactNumber ? formatContactDisplay(contactNumber) : null;
  const altContact = profileDetails.altContact
    ? formatContactDisplay(profileDetails.altContact)
    : null;
  const joinedLabel = formatJoinedLabel(
    profileDetails.joinedAt || (auth0User as any)?.created_at || null
  );
  const ordersLabel = orderCount != null ? String(orderCount) : "0";
  const secondStatValue =
    userRole === "CUSTOMER" ? String(addresses.length) : "Active";
  const secondStatLabel =
    userRole === "CUSTOMER" ? "Addresses" : "Status";
  const thirdStatValue = joinedLabel !== "—" ? joinedLabel : "Verified";
  const thirdStatLabel = joinedLabel !== "—" ? "Joined" : "Status";
  const sheetBg = isDarkMode ? "#0f172a" : "#F8FAFC";
  const cardBg = isDarkMode ? "#1e293b" : "#FFFFFF";
  const cardBorder = isDarkMode ? "#334155" : "#E2E8F0";
  const primaryText = isDarkMode ? "#f8fafc" : "#0F172A";
  const secondaryText = isDarkMode ? "#94a3b8" : "#64748B";
  const cleanFirstName = formatCleanName(profileDetails.firstName);
  const cleanLastName = formatCleanName(profileDetails.lastName);
  const fullNameValue =
    `${cleanFirstName} ${cleanLastName}`.trim() || getDisplayName();

  return (
    <View style={[styles.container, { backgroundColor: sheetBg }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0284c7" />

      <ProfileNavBar
        onBack={onBack}
        onEdit={() => {
          setEditIntent("profile");
          setSubView("edit");
        }}
        topInset={navTop}
      />

      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        style={hubStyles.scroll}
        contentContainerStyle={[
          hubStyles.scrollContent,
          { paddingTop: navHeight, paddingBottom: footerClearance + 40 },
        ]}
      >
        <View style={hubStyles.hero}>
          <LinearGradient
            colors={["#0284c7", "#0891b2", "#06b6d4"]}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            pointerEvents="none"
          />
          <View style={hubStyles.heroDecorA} />
          <View style={hubStyles.heroDecorB} />

          <Animated.View
            style={[
              hubStyles.heroInner,
              { transform: [{ scale: headerScale }], opacity: headerOpacity },
            ]}
          >
            <TouchableOpacity
              style={hubStyles.avatarOuter}
              activeOpacity={0.85}
              onPress={() => {
                setEditIntent("profile");
                setSubView("edit");
              }}
            >
              <View style={hubStyles.avatarBorder}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={hubStyles.avatarImage} />
                ) : (
                  <View style={hubStyles.avatarFallback}>
                    <Text style={hubStyles.avatarInitials}>{getInitials()}</Text>
                  </View>
                )}
              </View>
              <View style={hubStyles.avatarEditBadge}>
                <MaterialIcon name="edit" size={14} color="#0284c7" />
              </View>
            </TouchableOpacity>

            <View style={hubStyles.roleBadgePill}>
              <MaterialIcon name="verified-user" size={12} color="#E0F2FE" />
              <Text style={hubStyles.roleBadgeText}>{formatRoleBadge(userRole)}</Text>
            </View>

            <Text style={hubStyles.displayName}>{getDisplayName()}</Text>
            <Text style={hubStyles.handle}>{getHandle()}</Text>

            <Animated.View style={[hubStyles.statsBar, { opacity: statsOpacity }]}>
              <View style={hubStyles.statItem}>
                <Text style={hubStyles.statValue}>{ordersLabel}</Text>
                <Text style={hubStyles.statLabel}>Bookings</Text>
              </View>
              <View style={hubStyles.statDivider} />
              <View style={hubStyles.statItem}>
                <Text style={hubStyles.statValue}>{secondStatValue}</Text>
                <Text style={hubStyles.statLabel}>{secondStatLabel}</Text>
              </View>
              <View style={hubStyles.statDivider} />
              <View style={hubStyles.statItem}>
                <Text style={hubStyles.statValue}>{thirdStatValue}</Text>
                <Text style={hubStyles.statLabel}>{thirdStatLabel}</Text>
              </View>
            </Animated.View>

            {userRole === "CUSTOMER" && hasMobileNumber === false ? (
              <TouchableOpacity
                style={hubStyles.mobileHint}
                onPress={() => setMobileDialogOpen(true)}
                activeOpacity={0.85}
              >
                <MaterialIcon name="phone-android" size={16} color="#FEF3C7" />
                <Text style={hubStyles.mobileHintText}>Add mobile number for booking updates</Text>
                <MaterialIcon name="arrow-forward-ios" size={12} color="#FEF3C7" />
              </TouchableOpacity>
            ) : null}

            <View style={hubStyles.editBtnWrap}>
              <TouchableOpacity
                style={hubStyles.editBtn}
                onPress={() => {
                  setEditIntent("profile");
                  setSubView("edit");
                }}
                activeOpacity={0.9}
              >
                <MaterialIcon name="edit" size={16} color="#0284C7" />
                <Text style={hubStyles.editBtnText}>Edit Account Details</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>

        <View style={[hubStyles.contentSheet, { backgroundColor: sheetBg }]}>
          <View style={hubStyles.contentInner}>
            <View style={hubStyles.section}>
              <View style={hubStyles.sectionHeaderRow}>
                <SectionTitle isDarkMode={isDarkMode}>Personal & Contact Info</SectionTitle>
                <TouchableOpacity
                  style={hubStyles.addNewBtn}
                  onPress={() => {
                    setEditIntent("profile");
                    setSubView("edit");
                  }}
                >
                  <Text style={[hubStyles.addNewText, isDarkMode && { color: "#38bdf8" }]}>
                    Manage
                  </Text>
                  <MaterialIcon
                    name="chevron-right"
                    size={18}
                    color={isDarkMode ? "#38bdf8" : "#0284c7"}
                  />
                </TouchableOpacity>
              </View>

              <View
                style={[
                  hubStyles.infoCard,
                  { backgroundColor: cardBg, borderColor: cardBorder },
                ]}
              >
                <InfoRow
                  icon="person-outline"
                  label="Full Name"
                  value={fullNameValue}
                  isDarkMode={isDarkMode}
                  primaryText={primaryText}
                  secondaryText={secondaryText}
                  dividerColor={cardBorder}
                />
                <InfoRow
                  icon="mail-outline"
                  label="Email Address"
                  value={userEmail || "Not added"}
                  isDarkMode={isDarkMode}
                  primaryText={primaryText}
                  secondaryText={secondaryText}
                  dividerColor={cardBorder}
                />
                <InfoRow
                  icon="call"
                  label="Primary Phone"
                  value={primaryContact || "Not added"}
                  isDarkMode={isDarkMode}
                  primaryText={primaryText}
                  secondaryText={secondaryText}
                  dividerColor={cardBorder}
                  rightBadge={
                    primaryContact && isValidContact(contactNumber || "") ? (
                      <View style={hubStyles.verifiedBadge}>
                        <MaterialIcon name="check-circle" size={12} color="#0369A1" />
                        <Text style={hubStyles.verifiedText}>VERIFIED</Text>
                      </View>
                    ) : userRole === "CUSTOMER" ? (
                      <TouchableOpacity
                        style={hubStyles.addPhoneBadge}
                        onPress={() => setMobileDialogOpen(true)}
                      >
                        <Text style={hubStyles.addPhoneBadgeText}>+ Add</Text>
                      </TouchableOpacity>
                    ) : null
                  }
                />
                {altContact ? (
                  <InfoRow
                    icon="contact-phone"
                    label="Alternate Phone"
                    value={altContact}
                    isDarkMode={isDarkMode}
                    primaryText={primaryText}
                    secondaryText={secondaryText}
                    dividerColor={cardBorder}
                  />
                ) : null}
                <InfoRow
                  icon="badge"
                  label="Account ID"
                  value={userId != null ? `#${userId}` : "—"}
                  isDarkMode={isDarkMode}
                  primaryText={primaryText}
                  secondaryText={secondaryText}
                  dividerColor={cardBorder}
                  isLast
                />
              </View>
            </View>

            {userRole === "CUSTOMER" ? (
              <View style={hubStyles.section}>
                <View style={hubStyles.sectionHeaderRow}>
                  <SectionTitle isDarkMode={isDarkMode}>Saved Addresses</SectionTitle>
                  <TouchableOpacity
                    style={hubStyles.addNewBtn}
                    onPress={() => {
                      setEditIntent("addAddress");
                      setSubView("edit");
                    }}
                  >
                    <MaterialIcon
                      name="add-circle-outline"
                      size={17}
                      color={isDarkMode ? "#38bdf8" : "#0284c7"}
                    />
                    <Text style={[hubStyles.addNewText, isDarkMode && { color: "#38bdf8" }]}>
                      Add New
                    </Text>
                  </TouchableOpacity>
                </View>

                {addresses.length === 0 ? (
                  <View
                    style={[
                      hubStyles.emptyAddressCard,
                      { backgroundColor: cardBg, borderColor: cardBorder },
                    ]}
                  >
                    <View
                      style={[
                        hubStyles.emptyAddressIconWrap,
                        { backgroundColor: isDarkMode ? "rgba(56, 189, 248, 0.12)" : "#E0F2FE" },
                      ]}
                    >
                      <MaterialIcon
                        name="add-location-alt"
                        size={24}
                        color={isDarkMode ? "#38bdf8" : "#0284c7"}
                      />
                    </View>
                    <Text style={[hubStyles.emptyAddressTitle, { color: primaryText }]}>
                      No saved addresses yet
                    </Text>
                    <Text style={[hubStyles.emptyAddressText, { color: secondaryText }]}>
                      Save your home or office address for faster checkout.
                    </Text>
                    <TouchableOpacity
                      style={hubStyles.emptyAddressCta}
                      onPress={() => {
                        setEditIntent("addAddress");
                        setSubView("edit");
                      }}
                      activeOpacity={0.85}
                    >
                      <MaterialIcon name="add" size={16} color="#FFFFFF" />
                      <Text style={hubStyles.emptyAddressCtaText}>Add Address</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={hubStyles.addressList}>
                    {addresses.map((addr) => (
                      <TouchableOpacity
                        key={addr.id}
                        activeOpacity={0.85}
                        onPress={() => {
                          setEditIntent("profile");
                          setSubView("edit");
                        }}
                        style={[
                          hubStyles.addressCard,
                          { backgroundColor: cardBg, borderColor: cardBorder },
                        ]}
                      >
                        <View style={hubStyles.addressRow}>
                          <View
                            style={[
                              hubStyles.addressIconWrap,
                              {
                                backgroundColor: isDarkMode
                                  ? "rgba(56, 189, 248, 0.12)"
                                  : "#E0F2FE",
                              },
                            ]}
                          >
                            <MaterialIcon
                              name={getAddressIconName(addr.type)}
                              size={22}
                              color={isDarkMode ? "#38bdf8" : "#0284c7"}
                            />
                          </View>
                          <View style={hubStyles.addressBody}>
                            <View style={hubStyles.addressTitleRow}>
                              <Text style={[hubStyles.addressTitle, { color: primaryText }]}>
                                {addr.type}
                              </Text>
                              <View
                                style={[
                                  hubStyles.addressEditPill,
                                  {
                                    backgroundColor: isDarkMode ? "#0f172a" : "#F1F5F9",
                                  },
                                ]}
                              >
                                <MaterialIcon
                                  name="edit"
                                  size={13}
                                  color={isDarkMode ? "#94a3b8" : "#475569"}
                                />
                                <Text
                                  style={[
                                    hubStyles.addressEditPillText,
                                    { color: isDarkMode ? "#cbd5e1" : "#475569" },
                                  ]}
                                >
                                  Edit
                                </Text>
                              </View>
                            </View>
                            <Text
                              style={[hubStyles.addressText, { color: secondaryText }]}
                              numberOfLines={2}
                            >
                              {addr.street}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            ) : null}

            {(onNavigateToBookings || onOpenSettings || onContact) ? (
              <View style={hubStyles.section}>
                <SectionTitle isDarkMode={isDarkMode}>Quick Actions</SectionTitle>
                <View
                  style={[
                    hubStyles.infoCard,
                    { backgroundColor: cardBg, borderColor: cardBorder },
                  ]}
                >
                  {onNavigateToBookings ? (
                    <TouchableOpacity
                      style={hubStyles.quickActionRow}
                      onPress={onNavigateToBookings}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          hubStyles.infoIconWrap,
                          {
                            backgroundColor: isDarkMode
                              ? "rgba(56, 189, 248, 0.12)"
                              : "#E0F2FE",
                          },
                        ]}
                      >
                        <MaterialIcon
                          name="event-note"
                          size={19}
                          color={isDarkMode ? "#38bdf8" : "#0284c7"}
                        />
                      </View>
                      <View style={hubStyles.infoTextCol}>
                        <Text style={[hubStyles.quickActionTitle, { color: primaryText }]}>
                          My Bookings
                        </Text>
                        <Text style={[hubStyles.infoLabel, { color: secondaryText }]}>
                          View active, upcoming & past services
                        </Text>
                      </View>
                      <MaterialIcon name="chevron-right" size={20} color={secondaryText} />
                    </TouchableOpacity>
                  ) : null}

                  {onNavigateToBookings && (onOpenSettings || onContact) ? (
                    <View style={[hubStyles.infoDivider, { backgroundColor: cardBorder }]} />
                  ) : null}

                  {onOpenSettings ? (
                    <TouchableOpacity
                      style={hubStyles.quickActionRow}
                      onPress={onOpenSettings}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          hubStyles.infoIconWrap,
                          {
                            backgroundColor: isDarkMode
                              ? "rgba(56, 189, 248, 0.12)"
                              : "#E0F2FE",
                          },
                        ]}
                      >
                        <MaterialIcon
                          name="settings"
                          size={19}
                          color={isDarkMode ? "#38bdf8" : "#0284c7"}
                        />
                      </View>
                      <View style={hubStyles.infoTextCol}>
                        <Text style={[hubStyles.quickActionTitle, { color: primaryText }]}>
                          App Settings
                        </Text>
                        <Text style={[hubStyles.infoLabel, { color: secondaryText }]}>
                          Theme, language & notifications
                        </Text>
                      </View>
                      <MaterialIcon name="chevron-right" size={20} color={secondaryText} />
                    </TouchableOpacity>
                  ) : null}

                  {onOpenSettings && onContact ? (
                    <View style={[hubStyles.infoDivider, { backgroundColor: cardBorder }]} />
                  ) : null}

                  {onContact ? (
                    <TouchableOpacity
                      style={hubStyles.quickActionRow}
                      onPress={onContact}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          hubStyles.infoIconWrap,
                          {
                            backgroundColor: isDarkMode
                              ? "rgba(56, 189, 248, 0.12)"
                              : "#E0F2FE",
                          },
                        ]}
                      >
                        <MaterialIcon
                          name="support-agent"
                          size={19}
                          color={isDarkMode ? "#38bdf8" : "#0284c7"}
                        />
                      </View>
                      <View style={hubStyles.infoTextCol}>
                        <Text style={[hubStyles.quickActionTitle, { color: primaryText }]}>
                          Help & Support
                        </Text>
                        <Text style={[hubStyles.infoLabel, { color: secondaryText }]}>
                          Get assistance with your account or bookings
                        </Text>
                      </View>
                      <MaterialIcon name="chevron-right" size={20} color={secondaryText} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            ) : null}
          </View>
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
              loadHubProfileData("CUSTOMER", userId);
            }
          }}
        />
      )}

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
  editBody: {
    flex: 1,
  },
  editHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 8,
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

const hubStyles = StyleSheet.create({
  navBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: "#0284c7",
  },
  navBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  navTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: HOME_M3.onPrimary,
    letterSpacing: -0.2,
  },
  navActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
    width: "100%",
  },
  scrollContent: {
    width: "100%",
    alignItems: "stretch",
  },
  hero: {
    width: "100%",
    alignSelf: "stretch",
    paddingTop: 10,
    paddingBottom: 30,
    overflow: "hidden",
    position: "relative",
    zIndex: 2,
  },
  heroDecorA: {
    position: "absolute",
    top: -48,
    right: -48,
    width: 192,
    height: 192,
    borderRadius: 96,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  heroDecorB: {
    position: "absolute",
    bottom: -96,
    left: -48,
    width: 256,
    height: 256,
    borderRadius: 128,
    backgroundColor: "rgba(13, 43, 77, 0.1)",
  },
  heroInner: {
    alignItems: "center",
    zIndex: 2,
    width: "100%",
    paddingHorizontal: 20,
  },
  avatarOuter: {
    marginBottom: 12,
    position: "relative",
  },
  avatarBorder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.45)",
    padding: 3,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 44,
  },
  avatarFallback: {
    width: "100%",
    height: "100%",
    borderRadius: 44,
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0284C7",
    letterSpacing: -0.5,
  },
  avatarEditBadge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: HOME_M3.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 4,
  },
  roleBadgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    marginBottom: 8,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  displayName: {
    fontSize: 23,
    fontWeight: "800",
    color: HOME_M3.onPrimary,
    textAlign: "center",
    letterSpacing: -0.4,
    marginBottom: 3,
    paddingHorizontal: 12,
  },
  handle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.82)",
    marginBottom: 18,
  },
  statsBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    maxWidth: 350,
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.24)",
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "800",
    color: HOME_M3.onPrimary,
    textAlign: "center",
  },
  statLabel: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 2,
    fontWeight: "600",
    textAlign: "center",
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(255, 255, 255, 0.22)",
  },
  mobileHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(245, 158, 11, 0.24)",
    borderWidth: 1,
    borderColor: "rgba(254, 243, 199, 0.45)",
  },
  mobileHintText: {
    fontSize: 12,
    color: "#FEF3C7",
    fontWeight: "600",
  },
  editBtnWrap: {
    width: "100%",
    alignItems: "center",
    marginTop: 2,
    marginBottom: 2,
    zIndex: 10,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 22,
    paddingVertical: 10,
    minHeight: 40,
    borderRadius: 999,
    shadowColor: "#0284C7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 5,
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0284C7",
    letterSpacing: 0.2,
  },
  contentSheet: {
    marginTop: -16,
    backgroundColor: "#F8FAFC",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 22,
    paddingHorizontal: 16,
    paddingBottom: 16,
    width: "100%",
    alignSelf: "stretch",
    zIndex: 3,
  },
  contentInner: {
    width: "100%",
    gap: 24,
  },
  section: {
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  infoCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
  },
  infoIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  infoTextCol: {
    flex: 1,
    minWidth: 0,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: "500",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  infoDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 64,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#0369A1",
    letterSpacing: 0.3,
  },
  addPhoneBadge: {
    backgroundColor: "#0284C7",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  addPhoneBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  addNewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  addNewText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0284C7",
  },
  addressList: {
    gap: 10,
  },
  addressCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    overflow: "hidden",
    position: "relative",
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    zIndex: 2,
  },
  addressIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  addressBody: {
    flex: 1,
    minWidth: 0,
  },
  addressTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  addressTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  addressEditPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  addressEditPillText: {
    fontSize: 11,
    fontWeight: "600",
  },
  addressText: {
    fontSize: 13,
    lineHeight: 19,
  },
  emptyAddressCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 22,
    alignItems: "center",
    gap: 6,
  },
  emptyAddressIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyAddressTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  emptyAddressText: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 8,
  },
  emptyAddressCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#0284C7",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
  },
  emptyAddressCtaText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  quickActionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
});

export default ProfileScreen;