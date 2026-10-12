import React, { useMemo, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  useWindowDimensions,
  Animated,
  TextInput,
  Linking,
  Image,
} from "react-native";
import { useDispatch } from "react-redux";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { add } from "../features/bookingTypeSlice";
import { DETAILS } from "../Constants/pagesConstants";
import LinearGradient from "react-native-linear-gradient";
import { useAuth0 } from "react-native-auth0";
import { useAppUser } from "../context/AppUserContext";
import { useFirstBookingOfferVisible } from "../hooks/useFirstBookingOfferVisible";
import {
  isServiceOfferedByProvider,
  useServiceProviderProfile,
} from "../hooks/useServiceProviderProfile";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useTheme } from "../Settings/ThemeContext";
import { HOME_M3 } from "../theme/brandColors";
import HomeHeroChrome from "./HomeHeroChrome";
import { useTranslation } from "react-i18next";
import FirstBookingOffer from "./FirstBookingOffer";
import ServiceSelectionDialog from "./ServiceSelectionDialog";
import BookingDialog from "../BookingDialog/BookingDialog";
import ServiceDetailsDialog from "./ServiceDetailsDialog";
import MaidServiceDialog from "../ServiceDialogs/MaidServiceDialog";
import CookServiceDialog from "../ServiceDialogs/CookServiceDialog";
import NannyServicesDialog from "../ServiceDialogs/NannyServiceDialog";
import ServiceProviderRegistration from "../Registration/ServiceProviderRegistration";
import AgentRegistrationForm from "../Agent/AgentRegistrationForm";
import Footer from "../Footer/Footer";
import HowItWorksDialog from "./HowItWorksDialog";

const cookImage = require("../../assets/images/iconcook.png");
const maidImage = require("../../assets/images/iconmaid.png");
const nannyImage = require("../../assets/images/iconnanny.png");
const heroImage = require("../../assets/images/iconhome.png");

type ServiceType = "COOK" | "MAID" | "NANNY";

const HERO_BLUE = "#2F96EE";
const SHEET_LIGHT_BG = "#EAF4FE";
const SEARCH_HEIGHT = 58;
// Space under the search bar inside the header (room for its shadow)
const SEARCH_BOTTOM_PAD = 14;
// Gradient ends at the vertical middle of the search bar
const GRADIENT_BOTTOM_INSET = SEARCH_HEIGHT / 2 + SEARCH_BOTTOM_PAD;

const HERO_FEATURE_CHIPS = [
  { key: "trusted", icon: "check-circle-outline", label: "Trusted Pros" },
  { key: "booking", icon: "auto-awesome", label: "Easy Booking" },
  { key: "slots", icon: "event", label: "Flexible Slots" },
] as const;

// Gradient backgrounds for the service cards (active / provider-inactive)
const SERVICE_GRADIENTS: Record<ServiceType, string[]> = {
  COOK: ["#2F96EE", "#6CC1FA"],
  MAID: ["#2F96EE", "#6CC1FA"],
  NANNY: ["#2F96EE", "#6CC1FA"],
};
const SERVICE_GRADIENT_INACTIVE = ["#CBD5E1", "#94A3B8"];

// Trending & Popular quick-book shortcuts
const TRENDING_PROS: {
  key: string;
  name: string;
  role: string;
  service: ServiceType;
  rating: string;
  avatarBg: string;
}[] = [
  { key: "rita", name: "Rita M.", role: "Cook", service: "COOK", rating: "4.9", avatarBg: "#FDE2C4" },
  { key: "john", name: "John D.", role: "Cleaner", service: "MAID", rating: "4.8", avatarBg: "#BFE3FB" },
  { key: "anita", name: "Anita P.", role: "Nanny", service: "NANNY", rating: "4.7", avatarBg: "#E3D4F7" },
];

const HAPPY_HOME_AVATARS = ["#BFE3FB", "#E3D4F7", "#FDE2C4"];

interface ChildComponentProps {
  sendDataToParent: (data: string, options?: { bookingDate?: string; initialTab?: 'today' | 'upcoming' | 'past' | 'cancelled' | 'pending' }) => void;
  bookingType: (data: string) => void;
  onContactClick?: () => void;
  closeDropdowns?: boolean;
  onLogoClick?: () => void;
}

const HomePage: React.FC<ChildComponentProps> = ({
  sendDataToParent,
  onContactClick,
  closeDropdowns = false,
  onLogoClick,
}) => {
  const { colors, isDarkMode, fontSize } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const contentPadding = screenWidth >= 900 ? (screenWidth - 840) / 2 : screenWidth < 360 ? 16 : 20;
  // Only truly tiny phones stack the stats vertically. iOS widths (~375-390) stay in a row like Android.
  const isNarrowLayout = screenWidth < 340;
  const isCompactStats = screenWidth < 400;
  const { user: auth0User } = useAuth0();
  const { appUser } = useAppUser();
  const { showOffer, checking: checkingOffer } = useFirstBookingOfferVisible();
  const dispatch = useDispatch();
  const showSiteFooter =
    !appUser || String(appUser?.role || "").toUpperCase() === "CUSTOMER";

  const userRole = String(appUser?.role || auth0User?.role || "").toUpperCase();

  const heroTitleSize = screenWidth >= 428 ? 24 : screenWidth >= 390 ? 22 : 20;

  const sheetBg = isDarkMode ? colors.surface : SHEET_LIGHT_BG;

  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedtype] = useState("");
  const [selectedRadioButtonValue, setSelectedRadioButtonValue] = useState("");
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<any>(null);
  const [endTime, setEndTime] = useState<any>(null);
  const [showRegistration, setShowRegistration] = useState(false);
  const [serviceDetailsOpen, setServiceDetailsOpen] = useState(false);
  const [selectedServiceType, setSelectedServiceType] = useState<"cook" | "maid" | "babycare" | null>(null);
  const [showMaidServiceDialog, setShowMaidServiceDialog] = useState(false);
  const [showNannyServicesDialog, setShowNannyServicesDialog] = useState(false);
  const [showCookDialog, setShowCookDialog] = useState(false);
  const [showAgentRegistration, setShowAgentRegistration] = useState(false);
  const [showServiceSelection, setShowServiceSelection] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const scrollRef = useRef<ScrollView>(null);
  const [selectedServiceForDetails, setSelectedServiceForDetails] = useState<ServiceType | null>(null);

  const services = useMemo(
    () => [
      {
        key: "COOK" as ServiceType,
        title: t("home.services.homeCook"),
        subtitle: "Daily meals & parties",
        image: cookImage,
      },
      {
        key: "MAID" as ServiceType,
        title: t("home.services.cleaningHelp"),
        subtitle: "Deep home cleaning",
        image: maidImage,
      },
      {
        key: "NANNY" as ServiceType,
        title: t("home.services.caregiver"),
        subtitle: "Eldercare & support",
        image: nannyImage,
      },
    ],
    [t]
  );

  const filteredServices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return services;
    return services.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.subtitle.toLowerCase().includes(q) ||
        s.key.toLowerCase().includes(q)
    );
  }, [searchQuery, services]);

  const isServiceProvider = userRole === "SERVICE_PROVIDER";
  const serviceProviderId = appUser?.serviceProviderId
    ? Number(appUser.serviceProviderId)
    : null;
  const { housekeepingRoles, isAccountActive, loading: loadingProviderProfile } =
    useServiceProviderProfile(serviceProviderId, isServiceProvider);

  // Create dynamic styles that respect theme
  const dynamicStyles = useMemo(() => {
    return {
      mainContainer: { flex: 1, backgroundColor: colors.background },
      container: { flex: 1, backgroundColor: colors.background },
      whiteContentSection: {
        backgroundColor: sheetBg,
        flex: 1,
        paddingHorizontal: contentPadding,
        paddingTop: 8,
      },
    };
  }, [colors, contentPadding, sheetBg]);

  const getServiceTitle = (serviceKey: ServiceType) => {
    if (serviceKey === "COOK") return t("home.services.homeCook");
    if (serviceKey === "MAID") return t("home.services.cleaningHelp");
    return t("home.services.caregiver");
  };

  const isServiceInactiveForProvider = (serviceKey: ServiceType) =>
    isServiceProvider &&
    !loadingProviderProfile &&
    !isServiceOfferedByProvider(serviceKey, housekeepingRoles, isAccountActive);

  const showProviderInactiveVisual = (serviceKey: ServiceType) =>
    isServiceProvider &&
    (loadingProviderProfile ||
      !isServiceOfferedByProvider(serviceKey, housekeepingRoles, isAccountActive));

  const inactiveServiceCount = useMemo(() => {
    if (!isServiceProvider || loadingProviderProfile) return 0;
    return services.filter((service) => isServiceInactiveForProvider(service.key)).length;
  }, [
    isServiceProvider,
    loadingProviderProfile,
    services,
    housekeepingRoles,
    isAccountActive,
  ]);

  const handleClick = (data: ServiceType) => {
    if (isServiceProvider) {
      if (!isAccountActive) {
        Alert.alert(
          t("home.serviceProvider.service.inactiveAlert.title"),
          t("home.serviceProvider.service.inactiveAlert.accountInactive"),
          [{ text: t("common.ok") }]
        );
        return;
      }
      if (!isServiceOfferedByProvider(data, housekeepingRoles, isAccountActive)) {
        Alert.alert(
          t("home.serviceProvider.service.inactiveAlert.title"),
          t("home.serviceProvider.service.inactiveAlert.notOffered", {
            service: getServiceTitle(data),
          }),
          [{ text: t("common.ok") }]
        );
        return;
      }
      Alert.alert(
        t("home.serviceProvider.alert.title"),
        t("home.serviceProvider.alert.message"),
        [{ text: t("common.ok") }]
      );
      return;
    }
    setOpen(true);
    setSelectedtype(data);
  };

  const getSelectedValue = (value: string) => {
    setSelectedRadioButtonValue(value);
    setStartDate(null);
    setEndDate(null);
    setStartTime(null);
    setEndTime(null);
  };

  const handleSave = (bookingDetails: any) => {
    const formatDate = (value: any) => {
      if (!value) return "";
      if (value && typeof value === "object" && value.format) {
        return value.format("YYYY-MM-DD");
      }
      const date = new Date(value);
      if (isNaN(date.getTime())) return String(value).split("T")[0] || "";
      return date.toISOString().split("T")[0];
    };

    const formatTime = (value: any) => {
      if (!value) return "";
      if (value && typeof value === "object" && value.format) return value.format("HH:mm");
      if (value instanceof Date) return value.toTimeString().slice(0, 5);
      if (typeof value === "string") {
        const timeStr = value.trim();
        if (timeStr.includes("AM") || timeStr.includes("PM")) {
          const [timePart, period] = timeStr.split(/\s+/);
          let [hours, minutes] = timePart.split(":").map(Number);
          if (period === "PM" && hours < 12) hours += 12;
          else if (period === "AM" && hours === 12) hours = 0;
          return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
        }
        return timeStr.replace(/\s+/g, "");
      }
      return "";
    };

    const startTimeStr = formatTime(bookingDetails.startTime);
    const endTimeStr = bookingDetails.endTime ? formatTime(bookingDetails.endTime) : "";

    let timeRange = "";
    let timeSlot = "";
    if (selectedRadioButtonValue === "Date") {
      timeRange = `${startTimeStr}-${endTimeStr}`;
      timeSlot = `${startTimeStr}-${endTimeStr}`;
    } else if (selectedRadioButtonValue === "Short term") {
      timeRange = startTimeStr;
      timeSlot = `${startTimeStr}-${endTimeStr}`;
    } else {
      timeRange = startTimeStr;
      timeSlot = startTimeStr;
    }

    const startDateYmd = formatDate(bookingDetails.startDate);
    const endDateYmd = formatDate(bookingDetails.endDate || bookingDetails.startDate) || startDateYmd;

    const booking = {
      startDate: startDateYmd,
      startTime: startTimeStr,
      endDate: endDateYmd,
      endTime: endTimeStr,
      timeRange,
      timeSlot,
      bookingPreference: selectedRadioButtonValue,
      housekeepingRole: selectedType,
      genderPreference: bookingDetails?.genderPreference || "No Preference",
    };

    if (selectedRadioButtonValue === "Date") {
      if (selectedType === "COOK") setShowCookDialog(true);
      else if (selectedType === "MAID") setShowMaidServiceDialog(true);
      else if (selectedType === "NANNY") setShowNannyServicesDialog(true);
      else sendDataToParent(DETAILS);
    } else {
      sendDataToParent(DETAILS);
    }

    setOpen(false);
    dispatch(add(booking));
  };

  const handleLearnMore = (service: ServiceType) => {
    if (service === "COOK") setSelectedServiceType("cook");
    else if (service === "MAID") setSelectedServiceType("maid");
    else setSelectedServiceType("babycare");
    setServiceDetailsOpen(true);
  };

  const handleServiceTap = (serviceKey: ServiceType) => {
    // All services now directly open booking dialog for faster booking
    handleClick(serviceKey);
  };

  const IconServiceCard = ({ service }: { service: typeof services[0] }) => {
    const isInactive = showProviderInactiveVisual(service.key);
    const isInteractionDisabled = isServiceInactiveForProvider(service.key);
    const isSelected = selectedServiceForDetails === service.key;

    return (
      <TouchableOpacity
        onPress={() => handleServiceTap(service.key)}
        onLongPress={() => handleLearnMore(service.key)}
        activeOpacity={isInteractionDisabled ? 1 : 0.8}
        accessibilityState={{ disabled: isInteractionDisabled }}
        accessibilityLabel={service.title}
        style={[
          styles.iconCard,
          { width: Math.min(180, (screenWidth - contentPadding * 2 - 24) / 3) },
          {
            borderColor: isSelected ? "#FFFFFF" : "transparent",
            borderWidth: isSelected ? 2 : 0,
          },
        ]}
      >
        <LinearGradient
          colors={isInactive ? SERVICE_GRADIENT_INACTIVE : SERVICE_GRADIENTS[service.key]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.iconCardImageBox}>
          {isInactive ? (
            <Icon name="block" size={36} color="rgba(255,255,255,0.85)" />
          ) : (
            <Image source={service.image} style={styles.iconCardImage} resizeMode="contain" />
          )}
        </View>
        {/* Single line + auto-shrink so "Caregiver" never gets clipped on iOS */}
        <Text
          style={styles.iconCardTitle}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
        >
          {service.title}
        </Text>
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Icon name="check-circle" size={16} color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const scrollToHowItWorks = () => {
    setShowHowItWorks(true);
  };

  return (
    <View style={dynamicStyles.mainContainer}>
      <ScrollView
        ref={scrollRef}
        style={[dynamicStyles.container, { backgroundColor: sheetBg }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header: straight-edged blue gradient with the search bar straddling its bottom edge */}
        <View style={[styles.headerSection, { backgroundColor: sheetBg }]}>
          <HomeHeroChrome
            closeDropdowns={closeDropdowns}
            onLogoPress={onLogoClick}
            gradientBottomInset={GRADIENT_BOTTOM_INSET}
          >
            {/* Hero Title + Illustration */}
            <View style={styles.heroRow}>
              <Text
                style={[
                  styles.heroTitleWhite,
                  { fontSize: fontSize === "large" ? heroTitleSize + 6 : heroTitleSize + 4 },
                ]}
              >
                {t("home.hero.title")}
              </Text>
              <View style={styles.heroIllustration} pointerEvents="none">
                <Image source={heroImage} style={styles.heroImg} resizeMode="contain" />
              </View>
            </View>

            <View style={styles.chipsRow}>
              {HERO_FEATURE_CHIPS.map((chip) => (
                <View key={chip.key} style={styles.heroChipWhite}>
                  <Icon name={chip.icon} size={16} color="#1D6FD8" />
                  <Text style={styles.heroChipTextWhite}>{chip.label}</Text>
                </View>
              ))}
            </View>

            {/* Search bar */}
            <View style={[styles.searchOuter, { paddingHorizontal: contentPadding }]}>
              <View
                style={[
                  styles.searchWrap,
                  { backgroundColor: isDarkMode ? colors.surface2 : "#FFFFFF" },
                ]}
              >
                <Icon name="search" size={24} color={HOME_M3.outline} style={styles.searchIcon} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="Find a cook, maid, or cleaner..."
                  placeholderTextColor={HOME_M3.outline}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  returnKeyType="search"
                />
                {searchQuery.length > 0 ? (
                  <TouchableOpacity onPress={() => setSearchQuery("")} hitSlop={8}>
                    <Icon name="close" size={20} color={HOME_M3.outline} />
                  </TouchableOpacity>
                ) : (
                  <View style={styles.searchTuneWrap}>
                    <Icon name="tune" size={24} color={HOME_M3.outline} />
                  </View>
                )}
              </View>
            </View>
          </HomeHeroChrome>
        </View>

        {/* Content Section (seamless with the area under the header) */}
        <View style={[dynamicStyles.whiteContentSection, styles.contentSheet]}>
          {/* What Service Section */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderText}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {isServiceProvider ? t("home.hero.exploreServices") : t("home.hero.whatService")}
              </Text>
              {isServiceProvider ? (
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                  {t("home.hero.learnAboutServices")}
                </Text>
              ) : null}
            </View>
            <TouchableOpacity
              style={styles.seeAllBtn}
              onPress={() => {
                setSearchQuery("");
                setSelectedServiceForDetails(null);
              }}
              accessibilityRole="button"
              accessibilityLabel="See all services"
            >
              <Text style={styles.seeAllText}>See All</Text>
              <Icon name="arrow-forward" size={18} color="#1D8CF0" />
            </TouchableOpacity>
          </View>

          {isServiceProvider && !loadingProviderProfile ? (
            <View style={styles.providerBanner}>
              <Icon name="info-outline" size={18} color="#B45309" />
              <Text style={styles.providerBannerText}>
                {!isAccountActive
                  ? t("home.serviceProvider.banner.accountInactive")
                  : inactiveServiceCount > 0
                    ? t("home.serviceProvider.banner.inactiveServices", {
                        defaultValue:
                          "Grayed-out services are inactive on your profile. Tap a card for details.",
                      })
                    : t("home.serviceProvider.banner.viewOnly")}
              </Text>
            </View>
          ) : null}

          {/* Icon Grid */}
          <View style={styles.iconGrid}>
            {filteredServices.map((service) => (
              <IconServiceCard key={service.key} service={service} />
            ))}
          </View>

          {/* Selected Service Details */}
          {selectedServiceForDetails && (
            <View style={[styles.serviceDetailCard, { backgroundColor: colors.surface }]}>
              <View style={styles.serviceDetailHeader}>
                <Text style={[styles.serviceDetailTitle, { color: colors.text }]}>
                  {services.find((s) => s.key === selectedServiceForDetails)?.title}
                </Text>
                <TouchableOpacity onPress={() => setSelectedServiceForDetails(null)}>
                  <Icon name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.serviceDetailSubtitle, { color: colors.textSecondary }]}>
                {services.find((s) => s.key === selectedServiceForDetails)?.subtitle}
              </Text>

              <View style={styles.serviceDetailBadges}>
                <View style={styles.detailBadge}>
                  <Icon name="star" size={16} color="#FF9500" />
                  <Text style={styles.detailBadgeText}>4.8 Rating</Text>
                </View>
                <View style={styles.detailBadge}>
                  <Icon name="verified" size={16} color="#00BFFF" />
                  <Text style={styles.detailBadgeText}>Verified Pros</Text>
                </View>
                <View style={styles.detailBadge}>
                  <Icon name="schedule" size={16} color="#10B981" />
                  <Text style={styles.detailBadgeText}>Flexible Hours</Text>
                </View>
              </View>

              <View style={styles.serviceDetailFeatures}>
                <View style={styles.featureItem}>
                  <Icon name="check-circle" size={20} color="#00BFFF" />
                  <Text style={[styles.featureText, { color: colors.text }]}>
                    Background verified professionals
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <Icon name="check-circle" size={20} color="#00BFFF" />
                  <Text style={[styles.featureText, { color: colors.text }]}>
                    Same-day availability
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <Icon name="check-circle" size={20} color="#00BFFF" />
                  <Text style={[styles.featureText, { color: colors.text }]}>
                    Money-back guarantee
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.serviceDetailBookButton}
                onPress={() => handleClick(selectedServiceForDetails)}
              >
                <Text style={styles.serviceDetailBookButtonText}>Book Now</Text>
                <Icon name="arrow-forward" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}

          {filteredServices.length === 0 ? (
            <Text style={[styles.emptySearch, { color: colors.textSecondary }]}>
              No services match your search.
            </Text>
          ) : null}

          <View style={styles.helperTextContainer}>
            <Text style={[styles.helperText, { color: colors.textSecondary }]}>
              Tap to see details • Long press for info
            </Text>
          </View>

          {!isServiceProvider && !checkingOffer && showOffer ? (
            <View style={styles.promoWrap}>
              <FirstBookingOffer onPress={() => setShowServiceSelection(true)} />
            </View>
          ) : null}

          {!isServiceProvider ? (
            <>
              <View style={styles.trendingHeaderRow}>
                <Text style={[styles.trendingTitle, { color: colors.text }]}>Trending & Popular</Text>
                <View style={styles.availableRow}>
                  <View style={styles.availableDot} />
                  <Text style={[styles.availableText, { color: colors.textSecondary }]}>Available Today</Text>
                </View>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={[styles.trendingScroll, { marginHorizontal: -contentPadding }]}
                contentContainerStyle={[styles.trendingContent, { paddingHorizontal: contentPadding }]}
              >
                {TRENDING_PROS.map((pro) => (
                  <TouchableOpacity
                    key={pro.key}
                    activeOpacity={0.8}
                    onPress={() => handleClick(pro.service)}
                    accessibilityRole="button"
                    accessibilityLabel={`Quick-book ${pro.name} ${pro.role}`}
                    style={[
                      styles.trendingCard,
                      {
                        width: Math.min(300, Math.max(150, Math.round(screenWidth * 0.4))),
                        backgroundColor: isDarkMode ? colors.card : "#FFFFFF",
                      },
                    ]}
                  >
                    <View style={styles.trendingTopRow}>
                      <View style={[styles.trendingAvatar, { backgroundColor: pro.avatarBg }]}>
                        <Icon name="person" size={26} color="#64748B" />
                      </View>
                      <View style={styles.trendingNameWrap}>
                        <Text style={[styles.trendingName, { color: colors.text }]} numberOfLines={1}>
                          {pro.name}
                        </Text>
                        <Text style={[styles.trendingRole, { color: colors.textSecondary }]} numberOfLines={1}>
                          ({pro.role})
                        </Text>
                      </View>
                    </View>
                    <View style={styles.trendingBottomRow}>
                      <Text style={styles.quickBookText}>Quick-book</Text>
                      <View style={styles.ratingRow}>
                        <Icon name="star" size={16} color="#F5A623" />
                        <Text style={[styles.ratingText, { color: colors.text }]}>{pro.rating}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          ) : null}

          {/* Stats: single row on iOS and Android (stacked only on very small screens) */}
          <View style={[styles.statsRow, isNarrowLayout && styles.statsRowNarrow]}>
            <View style={[styles.statCell, styles.statCellStart, isNarrowLayout && styles.statCellNarrow]}>
              <View style={styles.statValueRow}>
                <Text style={[styles.statValue, isCompactStats && styles.statValueCompact, { color: colors.text }]}>
                  50k+
                </Text>
                <View style={styles.avatarStack}>
                  {HAPPY_HOME_AVATARS.map((bg, i) => (
                    <View key={bg} style={[styles.stackAvatar, { backgroundColor: bg, marginLeft: i === 0 ? 0 : -8 }]}>
                      <Icon name="person" size={14} color="#64748B" />
                    </View>
                  ))}
                </View>
              </View>
              <Text style={[styles.statLabel, isCompactStats && styles.statLabelCompact, { color: colors.textSecondary }]}>
                Happy Homes
              </Text>
            </View>
            <View style={[styles.statCell, !isNarrowLayout && styles.statDivider, isNarrowLayout && styles.statCellNarrow]}>
              <Icon name="verified" size={isCompactStats ? 28 : 34} color="#1D8CF0" style={styles.statIcon} />
              <View>
                <Text style={[styles.statValue, isCompactStats && styles.statValueCompact, { color: colors.text }]}>
                  2000+
                </Text>
                <Text style={[styles.statLabel, isCompactStats && styles.statLabelCompact, { color: colors.textSecondary }]}>
                  Verified Pros
                </Text>
              </View>
            </View>
            <View style={[styles.statCell, isNarrowLayout && styles.statCellNarrow]}>
              <Icon name="star" size={isCompactStats ? 28 : 34} color="#F5A623" style={styles.statIcon} />
              <View>
                <Text style={[styles.statValue, isCompactStats && styles.statValueCompact, { color: colors.text }]}>
                  4.8/5
                </Text>
                <Text style={[styles.statLabel, isCompactStats && styles.statLabelCompact, { color: colors.textSecondary }]}>
                  Avg Rating
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.helpSection}>
            <View style={styles.helpLinks}>
              <Text style={[styles.helpTitle, { color: colors.text }]}>Need help choosing?</Text>
              <TouchableOpacity
                style={styles.helpLink}
                onPress={() => {
                  Linking.openURL("tel:+918792827744").catch((err) => {
                    console.error("Couldn't make phone call", err);
                    Alert.alert("Error", "Unable to make the call. Please try again.");
                  });
                }}
              >
                <Icon name="chat-bubble" size={18} color="#1D8CF0" />
                <Text style={styles.helpLinkText}>Talk to Support</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.helpLink} onPress={scrollToHowItWorks}>
                <Icon name="help" size={18} color="#1D8CF0" />
                <Text style={styles.helpLinkText}>How it works</Text>
              </TouchableOpacity>
            </View>
          </View>

          {!isServiceProvider && (
            <BookingDialog
              open={open}
              onClose={() => setOpen(false)}
              onSave={handleSave}
              selectedOption={selectedRadioButtonValue}
              onOptionChange={getSelectedValue}
              startDate={startDate}
              endDate={endDate}
              startTime={startTime}
              endTime={endTime}
              setStartDate={setStartDate}
              setEndDate={setEndDate}
              setStartTime={setStartTime}
              setEndTime={setEndTime}
            />
          )}

          <CookServiceDialog
            open={showCookDialog}
            handleClose={() => setShowCookDialog(false)}
            sendDataToParent={sendDataToParent}
          />

          {showNannyServicesDialog && (
            <View style={[styles.dialogOverlay, { backgroundColor: colors.overlay }]}>
              <View style={[styles.dialogBox, { backgroundColor: colors.surface, width: screenWidth * 0.92, maxHeight: screenHeight * 0.85 }]}>
                <NannyServicesDialog
                  open={showNannyServicesDialog}
                  handleClose={() => setShowNannyServicesDialog(false)}
                  sendDataToParent={sendDataToParent}
                  bookingType={{
                    start_date: startDate ? new Date(startDate).toISOString().split("T")[0] : "",
                    start_time: startTime ? new Date(startTime).toTimeString().slice(0, 5) : "",
                    end_date: endDate ? new Date(endDate).toISOString().split("T")[0] : startDate ? new Date(startDate).toISOString().split("T")[0] : "",
                    end_time: endTime ? new Date(endTime).toTimeString().slice(0, 5) : "",
                    timeRange: startTime ? `${new Date(startTime).toTimeString().slice(0, 5)}` : "",
                    bookingPreference: selectedRadioButtonValue,
                    housekeepingRole: selectedType,
                  }}
                />
              </View>
            </View>
          )}

          <MaidServiceDialog
            open={showMaidServiceDialog}
            handleClose={() => setShowMaidServiceDialog(false)}
            sendDataToParent={sendDataToParent}
          />

          {showSiteFooter ? (
            <View style={styles.siteFooterWrap}>
              <Footer />
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Solid cover behind the iOS status bar so scrolled content never shows through the clock/battery */}
      {insets.top > 0 ? (
        <View
          pointerEvents="none"
          style={[styles.statusBarCover, { height: insets.top }]}
        />
      ) : null}

      <ServiceSelectionDialog
        visible={showServiceSelection}
        onClose={() => setShowServiceSelection(false)}
        onSelectService={(serviceType: string) => {
          setSelectedtype(serviceType);
          setOpen(true);
        }}
      />

      <ServiceDetailsDialog open={serviceDetailsOpen} onClose={() => setServiceDetailsOpen(false)} serviceType={selectedServiceType} />

      <HowItWorksDialog visible={showHowItWorks} onClose={() => setShowHowItWorks(false)} />

      {showAgentRegistration && (
        <AgentRegistrationForm onBackToLogin={() => setShowAgentRegistration(false)} />
      )}

      {showRegistration && <ServiceProviderRegistration onBackToLogin={() => setShowRegistration(false)} />}
    </View>
  );
};

const styles = StyleSheet.create({
  // Extra bottom padding so the footer isn't hidden behind the bottom tab bar
  scrollContent: { paddingBottom: 84 },
  siteFooterWrap: { width: "100%", alignSelf: "stretch", marginTop: 8 },

  statusBarCover: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: HERO_BLUE,
    zIndex: 3000,
  },

  // Header Section
  headerSection: {
    overflow: "visible", // Allow location dropdown to extend beyond
    zIndex: 1000, // Keep header above other content
  },

  contentSheet: {
    marginTop: 0,
    zIndex: 1,
  },

  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 12,
    minHeight: 150,
  },
  heroIllustration: {
    width: "46%",
    height: 160,
    position: "relative",
  },
  heroImg: { position: "absolute", bottom: -14, right: -8, width: "112%", height: "100%" },

  heroTitleWhite: {
    color: "#FFFFFF",
    fontWeight: "800",
    lineHeight: 34,
    maxWidth: "54%",
  },

  // Search bar (straddles the bottom edge of the gradient)
  searchOuter: {
    marginTop: 22,
    paddingBottom: SEARCH_BOTTOM_PAD,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 30,
    height: SEARCH_HEIGHT,
    paddingHorizontal: 18,
    shadowColor: "#1D6FD8",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 5,
  },
  searchIcon: { marginRight: 10 },
  searchTuneWrap: { borderLeftWidth: 1, borderLeftColor: "#E2E8F0", paddingLeft: 14, marginLeft: 8 },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 14,
    paddingHorizontal: 20,
  },
  heroChipWhite: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(224, 240, 255, 0.92)",
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 20,
    shadowColor: "#00BFFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(0, 191, 255, 0.15)",
  },
  heroChipTextWhite: {
    color: "#0F2A4A",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 14,
    paddingBottom: 4,
  },
  sectionHeaderText: { flex: 1 },
  seeAllBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingBottom: 2 },
  seeAllText: { color: "#1D8CF0", fontSize: 16, fontWeight: "600" },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 30,
    letterSpacing: -0.5,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
  },
  providerBanner: { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: "#FFFBEB", borderRadius: 12, borderWidth: 1, borderColor: "#FDE68A", padding: 12, marginBottom: 14 },
  providerBannerText: { flex: 1, fontSize: 13, lineHeight: 18, color: "#92400E", fontWeight: "500" },

  // Icon Grid Styles
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "stretch",
    marginBottom: 24,
    rowGap: 12,
  },
  iconCard: {
    width: "31%",
    aspectRatio: 1,
    borderRadius: 20,
    overflow: "hidden",
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#6D5BF0",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
    position: "relative",
  },
  iconCardImageBox: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  iconCardImage: { width: "100%", height: "100%" },
  iconCardTitle: {
    width: "100%",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 18,
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.15)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  selectedIndicator: {
    position: "absolute",
    top: 6,
    right: 6,
  },

  // Service Detail Card
  serviceDetailCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: HOME_M3.outlineVariant,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  serviceDetailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  serviceDetailTitle: {
    fontSize: 22,
    fontWeight: "800",
    flex: 1,
  },
  serviceDetailSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  serviceDetailBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  detailBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  detailBadgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },
  serviceDetailFeatures: {
    gap: 12,
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  featureText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  serviceDetailBookButton: {
    backgroundColor: "#00BFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: "#00BFFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  serviceDetailBookButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  emptySearch: { textAlign: "center", marginVertical: 12, fontSize: 14 },
  helperTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: -8,
    marginBottom: 20,
  },
  helperText: {
    textAlign: "center",
    fontSize: 12,
  },
  promoWrap: { marginVertical: 12 },
  trendingHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  trendingTitle: { fontSize: 22, fontWeight: "800", letterSpacing: -0.4 },
  availableRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  availableDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#34A853" },
  availableText: { fontSize: 15, fontWeight: "500" },
  trendingScroll: { marginBottom: 16, overflow: "visible" },
  trendingContent: { paddingVertical: 4, gap: 10 },
  trendingCard: {
    borderRadius: 16,
    padding: 10,
    shadowColor: "#1D6FD8",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  trendingTopRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  trendingAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  trendingNameWrap: { flex: 1, minWidth: 0 },
  trendingName: { fontSize: 15, fontWeight: "700" },
  trendingRole: { fontSize: 14, fontWeight: "500" },
  trendingBottomRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10 },
  quickBookText: { color: "#1D6FD8", fontSize: 14, fontWeight: "500" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  ratingText: { fontSize: 15, fontWeight: "700" },

  // Stats
  statsRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, marginVertical: 8 },
  statsRowNarrow: { flexDirection: "column", alignItems: "stretch" },
  statCell: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  statCellNarrow: { flex: 0, justifyContent: "flex-start", paddingVertical: 10, borderTopWidth: 1, borderColor: HOME_M3.outlineVariant },
  statCellStart: { flexDirection: "column", alignItems: "flex-start", justifyContent: "center", gap: 0 },
  statValueRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  avatarStack: { flexDirection: "row", alignItems: "center" },
  stackAvatar: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  statIcon: { marginRight: 2 },
  statDivider: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: HOME_M3.outlineVariant },
  statValue: { fontSize: 22, fontWeight: "800" },
  statValueCompact: { fontSize: 18 },
  statLabel: { fontSize: 14, fontWeight: "500" },
  statLabelCompact: { fontSize: 12 },

  helpSection: { alignItems: "center", marginBottom: 12, paddingBottom: 8 },
  helpTitle: { fontSize: 15, fontWeight: "700" },
  helpLinks: { flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 },
  helpLink: { flexDirection: "row", alignItems: "center", gap: 4 },
  helpLinkText: { color: "#1D8CF0", fontSize: 15, fontWeight: "500" },
  dialogOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "center", alignItems: "center", zIndex: 1000 },
  dialogBox: { borderRadius: 12, padding: 20, shadowColor: "#0f172a", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 12 },
});

export default HomePage;