/* eslint-disable */
import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  Animated,
  BackHandler,
} from "react-native";
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

const SectionTitle = ({ children }: { children: string }) => (
  <Text style={hubStyles.sectionTitle}>{children}</Text>
);

const ReadOnlyField = ({ label, value }: { label: string; value: string }) => (
  <View style={hubStyles.fieldWrap}>
    <Text style={hubStyles.fieldLabel}>{label}</Text>
    <View style={hubStyles.fieldBox}>
      <Text style={hubStyles.fieldValue} numberOfLines={3}>
        {value || "—"}
      </Text>
    </View>
  </View>
);

export interface ProfileScreenProps {
  onBack: () => void;
  onNavigateToBookings?: () => void;
  onOpenSettings?: () => void;
  onContact?: () => void;
  onSignOutComplete?: () => Promise<void>;
}

const PROFILE_NAV_ROW_HEIGHT = 28;

const ProfileNavBar = ({
  onBack,
  topInset,
}: {
  onBack: () => void;
  topInset: number;
}) => (
  <View style={[hubStyles.navBar, { paddingTop: topInset }]}>
    <TouchableOpacity
      onPress={onBack}
      style={hubStyles.navBackBtn}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <MaterialIcon name="arrow-back" size={18} color={HOME_M3.onPrimary} />
    </TouchableOpacity>
    <Text style={hubStyles.navTitle}>Profile</Text>
    <View style={hubStyles.navSpacer} />
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
    if (full) return full;
    return userName || appUser?.name || t("profile.page.user");
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
        <View style={styles.editBody}>
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
  const joinedLabel = formatJoinedLabel(profileDetails.joinedAt);
  const ordersLabel = orderCount != null ? String(orderCount) : "—";

  return (
    <View style={[styles.container, { backgroundColor: HOME_M3.primary }]}>
      <StatusBar barStyle="light-content" backgroundColor={HOME_M3.primary} />

      <ProfileNavBar onBack={onBack} topInset={navTop} />

      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        style={hubStyles.scroll}
        contentContainerStyle={[
          hubStyles.scrollContent,
          { paddingTop: navHeight, paddingBottom: 12 },
        ]}
      >
        <LinearGradient
          colors={[HOME_M3.primaryContainer, HOME_M3.primary]}
          style={hubStyles.hero}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
        >
          <View style={hubStyles.heroDecorA} />
          <View style={hubStyles.heroDecorB} />

          <Animated.View
            style={[
              hubStyles.heroInner,
              { transform: [{ scale: headerScale }], opacity: headerOpacity },
            ]}
          >
            <View style={hubStyles.avatarOuter}>
              <View style={hubStyles.avatarBorder}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={hubStyles.avatarImage} />
                ) : (
                  <View style={hubStyles.avatarFallback}>
                    <Text style={hubStyles.avatarInitials}>{getInitials()}</Text>
                  </View>
                )}
              </View>
            </View>

            <Text style={hubStyles.displayName}>{getDisplayName()}</Text>
            <Text style={hubStyles.handle}>{getHandle()}</Text>

            <Animated.View style={[hubStyles.statsBar, { opacity: statsOpacity }]}>
              <View style={hubStyles.statItem}>
                <Text style={hubStyles.statValue}>{ordersLabel}</Text>
                <Text style={hubStyles.statLabel}>Orders</Text>
              </View>
              <View style={hubStyles.statDivider} />
              <View style={hubStyles.statItem}>
                <Text style={hubStyles.statValue}>—</Text>
                <Text style={hubStyles.statLabel}>Reviews</Text>
              </View>
              <View style={hubStyles.statDivider} />
              <View style={hubStyles.statItem}>
                <Text style={hubStyles.statValue}>{joinedLabel}</Text>
                <Text style={hubStyles.statLabel}>Joined</Text>
              </View>
            </Animated.View>

            {userRole === "CUSTOMER" && hasMobileNumber === false ? (
              <TouchableOpacity style={hubStyles.mobileHint} onPress={() => setMobileDialogOpen(true)}>
                <MaterialIcon name="phone-android" size={16} color="#f59e0b" />
                <Text style={hubStyles.mobileHintText}>Add mobile number</Text>
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
                <Text style={hubStyles.editBtnText}>Edit Profile</Text>
                <MaterialIcon name="edit" size={18} color={HOME_M3.primary} />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </LinearGradient>

        <View style={hubStyles.contentSheet}>
          <View style={hubStyles.contentInner}>
            <View style={hubStyles.section}>
              <SectionTitle>User Information</SectionTitle>
              <View style={hubStyles.fieldGrid}>
                <ReadOnlyField label="Email Address" value={userEmail || ""} />
                <ReadOnlyField label="User ID" value={userId != null ? String(userId) : ""} />
                <ReadOnlyField label="First Name" value={profileDetails.firstName} />
                <ReadOnlyField label="Last Name" value={profileDetails.lastName} />
              </View>
            </View>

            <View style={hubStyles.section}>
              <SectionTitle>Contact Information</SectionTitle>
              <View style={hubStyles.contactCard}>
                <View style={hubStyles.contactRow}>
                  <View style={hubStyles.contactIconPrimary}>
                    <MaterialIcon name="call" size={20} color={HOME_M3.secondary} />
                  </View>
                  <View style={hubStyles.contactTextCol}>
                    <Text style={hubStyles.contactLabel}>Primary Contact</Text>
                    <Text style={hubStyles.contactValue}>
                      {primaryContact || "Not added"}
                    </Text>
                  </View>
                </View>
                {primaryContact && isValidContact(contactNumber || "") ? (
                  <View style={hubStyles.verifiedBadge}>
                    <MaterialIcon name="check-circle" size={12} color="#004A77" />
                    <Text style={hubStyles.verifiedText}>VERIFIED</Text>
                  </View>
                ) : null}
              </View>

              {altContact ? (
                <View style={[hubStyles.contactCard, hubStyles.contactCardAlt]}>
                  <View style={hubStyles.contactRow}>
                    <View style={hubStyles.contactIconAlt}>
                      <MaterialIcon name="contact-phone" size={20} color={HOME_M3.outline} />
                    </View>
                    <View style={hubStyles.contactTextCol}>
                      <Text style={hubStyles.contactLabel}>Alternative Contact</Text>
                      <Text style={hubStyles.contactValue}>{altContact}</Text>
                    </View>
                  </View>
                </View>
              ) : null}
            </View>

            {userRole === "CUSTOMER" ? (
              <View style={hubStyles.section}>
                <View style={hubStyles.sectionHeaderRow}>
                  <SectionTitle>Saved Addresses</SectionTitle>
                  <TouchableOpacity
                    style={hubStyles.addNewBtn}
                    onPress={() => {
                      setEditIntent("addAddress");
                      setSubView("edit");
                    }}
                  >
                    <MaterialIcon name="add" size={18} color={HOME_M3.secondary} />
                    <Text style={hubStyles.addNewText}>Add New</Text>
                  </TouchableOpacity>
                </View>

                {addresses.length === 0 ? (
                  <View style={hubStyles.emptyAddressCard}>
                    <Text style={hubStyles.emptyAddressText}>No saved addresses yet</Text>
                  </View>
                ) : (
                  addresses.map((addr) => (
                    <View key={addr.id} style={hubStyles.addressCard}>
                      <View style={hubStyles.addressRow}>
                        <View style={hubStyles.addressIconWrap}>
                          <MaterialIcon name="home" size={22} color={HOME_M3.secondary} />
                        </View>
                        <View style={hubStyles.addressBody}>
                          <View style={hubStyles.addressTitleRow}>
                            <Text style={hubStyles.addressTitle}>{addr.type}</Text>
                            <TouchableOpacity onPress={() => setSubView("edit")} hitSlop={8}>
                              <MaterialIcon name="more-vert" size={20} color={HOME_M3.outline} />
                            </TouchableOpacity>
                          </View>
                          <Text style={hubStyles.addressText}>{addr.street}</Text>
                        </View>
                      </View>
                      <MaterialIcon
                        name="map"
                        size={110}
                        color={HOME_M3.onSurface}
                        style={hubStyles.addressWatermark}
                      />
                    </View>
                  ))
                )}
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
    paddingHorizontal: 10,
    paddingBottom: 0,
    backgroundColor: HOME_M3.primary,
  },
  navBackBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  navTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: HOME_M3.onPrimary,
    letterSpacing: -0.1,
    lineHeight: 18,
  },
  navSpacer: {
    width: 28,
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
    paddingTop: 4,
    paddingBottom: 28,
    overflow: "visible",
    zIndex: 2,
  },
  heroDecorA: {
    position: "absolute",
    top: -48,
    right: -48,
    width: 192,
    height: 192,
    borderRadius: 96,
    backgroundColor: "rgba(51, 91, 175, 0.12)",
  },
  heroDecorB: {
    position: "absolute",
    bottom: -96,
    left: -48,
    width: 256,
    height: 256,
    borderRadius: 128,
    backgroundColor: "rgba(13, 43, 77, 0.4)",
  },
  heroInner: {
    alignItems: "center",
    zIndex: 2,
    width: "100%",
    paddingHorizontal: 16,
  },
  avatarOuter: {
    marginBottom: 24,
  },
  avatarBorder: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.2)",
    padding: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 60,
  },
  avatarFallback: {
    width: "100%",
    height: "100%",
    borderRadius: 60,
    backgroundColor: "#FFB3C6",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: "800",
    color: "#D42A5C",
    letterSpacing: -0.5,
  },
  displayName: {
    fontSize: 28,
    fontWeight: "800",
    color: HOME_M3.onPrimary,
    textAlign: "center",
    letterSpacing: -0.5,
    marginBottom: 4,
    paddingHorizontal: 12,
  },
  handle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 24,
  },
  statsBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 32,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 32,
    paddingVertical: 16,
    marginBottom: 20,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: HOME_M3.onPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    marginTop: 4,
    fontWeight: "500",
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  mobileHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
  },
  mobileHintText: {
    fontSize: 13,
    color: "#f59e0b",
    fontWeight: "600",
  },
  editBtnWrap: {
    width: "100%",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 4,
    zIndex: 10,
    elevation: 10,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: HOME_M3.onPrimary,
    paddingHorizontal: 28,
    paddingVertical: 12,
    minHeight: 44,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
  },
  editBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: HOME_M3.primary,
    letterSpacing: 0.5,
  },
  contentSheet: {
    marginTop: -12,
    backgroundColor: HOME_M3.surfaceContainerLowest,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 16,
    width: "100%",
    alignSelf: "stretch",
    zIndex: 1,
  },
  contentInner: {
    width: "100%",
    gap: 28,
  },
  section: {
    gap: 16,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: HOME_M3.outline,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  fieldGrid: {
    gap: 16,
  },
  fieldWrap: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: HOME_M3.onSurfaceVariant,
    paddingHorizontal: 4,
  },
  fieldBox: {
    backgroundColor: HOME_M3.surfaceContainerLow,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(196, 198, 207, 0.3)",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  fieldValue: {
    fontSize: 14,
    color: HOME_M3.onSurface,
    lineHeight: 20,
  },
  contactCard: {
    backgroundColor: HOME_M3.surfaceContainerLow,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(196, 198, 207, 0.3)",
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  contactCardAlt: {
    marginTop: 12,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    flex: 1,
  },
  contactIconPrimary: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(130, 166, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  contactIconAlt: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e0e3e5",
    alignItems: "center",
    justifyContent: "center",
  },
  contactTextCol: {
    flex: 1,
    minWidth: 0,
  },
  contactLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: HOME_M3.onSurfaceVariant,
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 14,
    color: HOME_M3.onSurface,
    fontWeight: "400",
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#D1E9FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#004A77",
    letterSpacing: 0.3,
  },
  addNewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  addNewText: {
    fontSize: 14,
    fontWeight: "600",
    color: HOME_M3.secondary,
    letterSpacing: 0.3,
  },
  addressCard: {
    backgroundColor: HOME_M3.surfaceContainerLow,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(196, 198, 207, 0.3)",
    padding: 20,
    overflow: "hidden",
    position: "relative",
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    zIndex: 2,
  },
  addressIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: HOME_M3.surfaceContainerLowest,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
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
    fontSize: 18,
    fontWeight: "700",
    color: HOME_M3.onSurface,
  },
  addressText: {
    fontSize: 14,
    lineHeight: 20,
    color: HOME_M3.onSurfaceVariant,
  },
  addressWatermark: {
    position: "absolute",
    right: -8,
    bottom: -16,
    opacity: 0.03,
  },
  emptyAddressCard: {
    backgroundColor: HOME_M3.surfaceContainerLow,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(196, 198, 207, 0.3)",
    padding: 20,
    alignItems: "center",
  },
  emptyAddressText: {
    fontSize: 14,
    color: HOME_M3.onSurfaceVariant,
  },
});

export default ProfileScreen;