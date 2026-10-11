import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  useWindowDimensions,
  Animated,
  TextInput,
  Linking,
  Image,
} from "react-native";
import { useDispatch } from "react-redux";
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
import { HOME_M3, HOME_HERO_GRADIENT } from "../theme/brandColors";
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

const HERO_FEATURE_CHIPS = [
  { key: "trusted", icon: "check-circle-outline", label: "Trusted Pros" },
  { key: "booking", icon: "auto-awesome", label: "Easy Booking" },
  { key: "slots", icon: "event", label: "Flexible Slots" },
] as const;

const SERVICE_ICONS: Record<ServiceType, string> = {
  COOK: "restaurant",
  MAID: "cleaning-services",
  NANNY: "volunteer-activism",
};

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
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const contentPadding = screenWidth >= 900 ? (screenWidth - 840) / 2 : screenWidth < 360 ? 16 : 20;
  const isNarrowLayout = screenWidth < 400;
  const { user: auth0User } = useAuth0();
  const { appUser } = useAppUser();
  const { showOffer, checking: checkingOffer } = useFirstBookingOfferVisible();
  const dispatch = useDispatch();
  const showSiteFooter =
    !appUser || String(appUser?.role || "").toUpperCase() === "CUSTOMER";

  const userRole = String(appUser?.role || auth0User?.role || "").toUpperCase();

  const heroTitleSize = screenWidth >= 428 ? 24 : screenWidth >= 390 ? 22 : 20;
  const heroSubtitleSize = screenWidth >= 428 ? 12 : 11;

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

  // Animation values for each service card
  const scaleAnimations = useRef({
    COOK: new Animated.Value(1),
    MAID: new Animated.Value(1),
    NANNY: new Animated.Value(1),
  }).current;

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
        backgroundColor: colors.surface, // White in light mode, dark in dark mode
        flex: 1,
        paddingHorizontal: contentPadding,
        paddingTop: 24,
      },
      mainCanvas: {
        marginTop: -18,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingHorizontal: 20,
        paddingTop: 28,
        backgroundColor: colors.background, // Theme-aware background
      },
    };
  }, [colors, contentPadding]);

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

  const handlePressIn = (serviceKey: string) => {
    if (isServiceInactiveForProvider(serviceKey as ServiceType)) return;
    Animated.spring(scaleAnimations[serviceKey as keyof typeof scaleAnimations], {
      toValue: 0.97,
      friction: 5,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = (serviceKey: string) => {
    if (isServiceInactiveForProvider(serviceKey as ServiceType)) return;
    Animated.spring(scaleAnimations[serviceKey as keyof typeof scaleAnimations], {
      toValue: 1,
      friction: 5,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

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
          { width: Math.min(180, (screenWidth - contentPadding * 2) * 0.31) },
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
        <Text style={styles.iconCardTitle} numberOfLines={2}>
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

  const handleServiceTap = (serviceKey: ServiceType) => {
    // All services now directly open booking dialog for faster booking
    handleClick(serviceKey);
  };

  return (
    <View style={dynamicStyles.mainContainer}>
      <ScrollView
        ref={scrollRef}
        style={[dynamicStyles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Light Blue Background */}
        <View style={styles.headerSection}>
          <HomeHeroChrome closeDropdowns={closeDropdowns} onLogoPress={onLogoClick}>
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
          </HomeHeroChrome>
        </View>

        {/* White Content Section */}
        <View style={[dynamicStyles.whiteContentSection, styles.contentSheet, !isDarkMode && styles.contentSheetLight]}>
          {/* Search */}
          <View style={styles.heroTextContainer}>
            <View style={[
              styles.searchWrap,
              { backgroundColor: isDarkMode ? colors.surface2 : '#FFFFFF' }
            ]}>
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
                  {services.find(s => s.key === selectedServiceForDetails)?.title}
                </Text>
                <TouchableOpacity onPress={() => setSelectedServiceForDetails(null)}>
                  <Icon name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              
              <Text style={[styles.serviceDetailSubtitle, { color: colors.textSecondary }]}>
                {services.find(s => s.key === selectedServiceForDetails)?.subtitle}
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
                style={styles.trendingScroll}
                contentContainerStyle={styles.trendingContent}
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
                        width: Math.min(300, Math.max(220, Math.round(screenWidth * 0.37))),
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

          <View style={[styles.statsRow, isNarrowLayout && styles.statsRowNarrow]}>
            <View style={[styles.statCell, styles.statCellStart, isNarrowLayout && styles.statCellNarrow]}>
              <View style={styles.statValueRow}>
                <Text style={[styles.statValue, { color: colors.text }]}>50k+</Text>
                <View style={styles.avatarStack}>
                  {HAPPY_HOME_AVATARS.map((bg, i) => (
                    <View key={bg} style={[styles.stackAvatar, { backgroundColor: bg, marginLeft: i === 0 ? 0 : -8 }]}>
                      <Icon name="person" size={14} color="#64748B" />
                    </View>
                  ))}
                </View>
              </View>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Happy Homes</Text>
            </View>
            <View style={[styles.statCell, styles.statDivider, isNarrowLayout && styles.statCellNarrow]}>
              <Icon name="verified" size={34} color="#1D8CF0" style={styles.statIcon} />
              <View>
                <Text style={[styles.statValue, { color: colors.text }]}>2000+</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Verified Pros</Text>
              </View>
            </View>
            <View style={[styles.statCell, isNarrowLayout && styles.statCellNarrow]}>
              <Icon name="star" size={34} color="#F5A623" style={styles.statIcon} />
              <View>
                <Text style={[styles.statValue, { color: colors.text }]}>4.8/5</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Avg Rating</Text>
              </View>
            </View>
          </View>

          <View style={styles.helpSection}>
            <View style={styles.helpLinks}>
              <Text style={[styles.helpTitle, { color: colors.text }]}>Need help choosing?</Text>
              <TouchableOpacity 
                style={styles.helpLink} 
                onPress={() => {
                  Linking.openURL('tel:+918792827744').catch((err) => {
                    console.error("Couldn't make phone call", err);
                    Alert.alert('Error', 'Unable to make the call. Please try again.');
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
  scrollContent: { paddingBottom: 0 },
  siteFooterWrap: { width: '100%', alignSelf: 'stretch', marginTop: 8 },
  
  // Header Section
  headerSection: {
    backgroundColor: 'transparent',
    overflow: 'visible', // Allow location dropdown to extend beyond
    zIndex: 1000, // Keep header above other content
  },
  
  // Hero Text Container
  heroTextContainer: {
    marginBottom: 20,
  },
  contentSheet: {
    marginTop: -24,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 20,
    zIndex: 1,
  },
  contentSheetLight: { backgroundColor: "#EAF4FE" },
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
  
  // Hero Title on White
  heroTitleWhite: {
    // Color will be dynamic
    color: "#FFFFFF",
    fontWeight: "800",
    lineHeight: 34,
    maxWidth: "54%",
  },
  
  // Hero Subtitle on White
  heroSubtitleWhite: {
    // Color will be dynamic
    lineHeight: 20,
    marginBottom: 16,
    maxWidth: "95%",
  },
  searchWrap: {
    flexDirection: "row", alignItems: "center", 
    // backgroundColor will be dynamic
    borderRadius: 30, height: 58, paddingHorizontal: 18, marginBottom: 8,
    shadowColor: "#1D6FD8", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 14, elevation: 5,
  },
  searchIcon: { marginRight: 10 },
  searchTuneWrap: { borderLeftWidth: 1, borderLeftColor: "#E2E8F0", paddingLeft: 14, marginLeft: 8 },
  searchInput: { 
    flex: 1, 
    fontSize: 16, 
    // color will be dynamic
    paddingVertical: 0 
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
    backgroundColor: 'rgba(224, 240, 255, 0.92)',
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 20,
    shadowColor: '#00BFFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 191, 255, 0.15)',
  },
  heroChipTextWhite: {
    color: '#0F2A4A',
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0,
  },
  mainCanvas: {
    marginTop: -18,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 28,
    // backgroundColor will be dynamic from dynamicStyles
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
    // color will be dynamic
    letterSpacing: -0.5,
  },
  sectionSubtitle: { 
    fontSize: 14, 
    marginTop: 6, 
    lineHeight: 20,
    // color will be dynamic
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
    width: '31%',
    aspectRatio: 1,
    borderRadius: 20,
    overflow: 'hidden',
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#6D5BF0",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
    position: 'relative',
  },
  iconCardImageBox: {
    flex: 1,
    width: '100%',
    alignItems: "center",
    justifyContent: "center",
  },
  iconCardImage: { width: '100%', height: '100%' },
  iconCardTitle: {
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
    position: 'absolute',
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
  
  // Keep old carousel styles for backward compatibility (can remove later)
  // Carousel Styles
  carousel: {
    marginHorizontal: 0,
    marginBottom: 0,
  },
  carouselContainer: {
    // Gap removed - using marginRight on cards instead
  },
  carouselCardWrap: {
    // Width is set dynamically via inline style (75% of screen)
    paddingHorizontal: 0,
    marginRight: 12, // Gap between cards
  },
  carouselCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 0,
    minHeight: 180,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
    overflow: 'hidden',
  },
  carouselCardInactive: {
    borderStyle: "dashed",
    opacity: 0.92,
  },
  carouselCardActive: {
    borderColor: "#86EFAC",
    backgroundColor: "#F0FDF4",
  },
  carouselCardContent: {
    flexDirection: "row",
    padding: 20,
    gap: 16,
    alignItems: 'flex-start',
  },
  carouselCardLeft: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  carouselIconBox: {
    width: 72,
    height: 72,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#00BFFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  carouselCardRight: {
    flex: 1,
    justifyContent: 'space-between',
    minHeight: 140,
  },
  carouselCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    gap: 8,
  },
  carouselTitle: { 
    fontSize: 20, 
    fontWeight: "800", 
    letterSpacing: -0.3,
    flex: 1,
  },
  carouselSubtitle: { 
    fontSize: 14, 
    lineHeight: 20, 
    opacity: 0.75,
    marginBottom: 12,
  },
  statusPillCarousel: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  carouselBadgeRow: { 
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  carouselBadge: { 
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  carouselBadgeText: {
    fontSize: 12, 
    fontWeight: "600", 
    color: '#475569',
  },
  carouselBookButton: {
    backgroundColor: '#00BFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: "#00BFFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  carouselBookButtonInactive: {
    backgroundColor: '#E2E8F0',
    shadowOpacity: 0,
  },
  carouselBookButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  carouselBookButtonTextInactive: {
    color: '#94A3B8',
  },
  
  // Dot Indicators
  dotIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    marginBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CBD5E1',
    transition: 'all 0.3s ease',
  },
  dotActive: {
    width: 24,
    backgroundColor: '#00BFFF',
  },
  
  // Keep old grid styles for backward compatibility (can be removed later)
  serviceGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 14 },
  gridCardWrap: { width: "48%" },
  gridCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    minHeight: 140,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  gridCardInactive: {
    borderStyle: "dashed",
    opacity: 0.92,
  },
  gridCardActive: {
    borderColor: "#86EFAC",
    backgroundColor: "#F0FDF4",
  },
  gridCardTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 8,
  },
  gridIconBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#00BFFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    maxWidth: "52%",
  },
  statusPillInactive: {
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  statusPillActive: {
    backgroundColor: "#DCFCE7",
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.2,
  },
  statusPillTextInactive: {
    color: "#B91C1C",
  },
  statusPillTextActive: {
    color: "#166534",
  },
  gridTitle: { fontSize: 17, fontWeight: "700", marginBottom: 5, letterSpacing: -0.2 },
  gridSubtitle: { fontSize: 13, lineHeight: 18, opacity: 0.8 },
  inactiveHintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 10,
  },
  inactiveHintText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#B45309",
  },
  gridBadgeRow: { marginTop: 8 },
  gridBadge: { fontSize: 11, fontWeight: "600", color: HOME_M3.secondary },
  emptySearch: { textAlign: "center", marginVertical: 12, fontSize: 14 },
  helperTextContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
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
  trendingScroll: { marginHorizontal: -20, marginBottom: 16, overflow: "visible" },
  trendingContent: { paddingHorizontal: 20, paddingVertical: 4, gap: 10 },
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
  statLabel: { fontSize: 14, fontWeight: "500" },
  helpSection: { alignItems: "center", marginBottom: 12, paddingBottom: 8 },
  helpTitle: { fontSize: 15, fontWeight: "700" },
  helpLinks: { flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 },
  helpLink: { flexDirection: "row", alignItems: "center", gap: 4 },
  helpLinkText: { color: "#1D8CF0", fontSize: 15, fontWeight: "500" },
  helpDivider: { color: HOME_M3.outlineVariant, fontSize: 18 },
  stepsCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },
  stepsTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  stepRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  stepDot: { width: 22, height: 22, borderRadius: 11, textAlign: "center", lineHeight: 22, color: "#fff", backgroundColor: HOME_M3.secondary, fontSize: 12, fontWeight: "700" },
  stepText: { fontSize: 14, fontWeight: "500", flex: 1 },
  dialogOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "center", alignItems: "center", zIndex: 1000 },
  dialogBox: { borderRadius: 12, padding: 20, shadowColor: "#0f172a", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 12 },
});

export default HomePage;
