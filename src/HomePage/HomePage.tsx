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
  Platform,
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

const cookImage = require("../../assets/images/Cooknew.png");
const maidImage = require("../../assets/images/Maidnew.png");
const nannyImage = require("../../assets/images/Nannynew.png");

type ServiceType = "COOK" | "MAID" | "NANNY";

// Softer, more professional feature chips
const HERO_FEATURE_CHIPS = [
  { key: "trusted", icon: "verified", label: "Verified Pros" },
  { key: "booking", icon: "bolt", label: "Instant Booking" },
  { key: "slots", icon: "schedule", label: "24/7 Available" },
] as const;

const SERVICE_ICONS: Record<ServiceType, string> = {
  COOK: "restaurant",
  MAID: "cleaning-services",
  NANNY: "volunteer-activism",
};

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

    // Get service-specific colors (unified cyan palette)
    const getServiceColors = (serviceKey: ServiceType) => {
      switch (serviceKey) {
        case "COOK":
          return {
            iconBg: isInactive ? (isDarkMode ? "#334155" : "#E2E8F0") : HOME_M3.cookCardLight,
            icon: isInactive ? "#94A3B8" : HOME_M3.cookCard,
          };
        case "MAID":
          return {
            iconBg: isInactive ? (isDarkMode ? "#334155" : "#E2E8F0") : HOME_M3.maidCardLight,
            icon: isInactive ? "#94A3B8" : HOME_M3.maidCard,
          };
        case "NANNY":
          return {
            iconBg: isInactive ? (isDarkMode ? "#334155" : "#E2E8F0") : HOME_M3.nannyCardLight,
            icon: isInactive ? "#94A3B8" : HOME_M3.nannyCard,
          };
      }
    };

    const serviceColors = getServiceColors(service.key);

    return (
      <TouchableOpacity
        onPress={() => handleServiceTap(service.key)}
        onLongPress={() => handleLearnMore(service.key)}
        activeOpacity={isInteractionDisabled ? 1 : 0.7}
        accessibilityState={{ disabled: isInteractionDisabled }}
        accessibilityLabel={service.title}
        style={[
          styles.iconCard,
          {
            backgroundColor: isInactive
              ? isDarkMode
                ? "#1e293b"
                : "#F8FAFC"
              : isSelected
                ? '#E0F2FE'
                : isDarkMode
                  ? colors.card
                  : HOME_M3.surfaceContainerLowest,
            borderColor: isSelected ? '#00BFFF' : isInactive
              ? isDarkMode
                ? "#475569"
                : "#CBD5E1"
              : isDarkMode
                ? colors.border
                : HOME_M3.outlineVariant,
            borderWidth: isSelected ? 2 : 1,
          },
        ]}
      >
        <View
          style={[
            styles.iconCardIconBox,
            {
              backgroundColor: serviceColors.iconBg,
            },
          ]}
        >
          <Icon
            name={isInactive ? "block" : SERVICE_ICONS[service.key]}
            size={32}
            color={isSelected ? '#00BFFF' : serviceColors.icon}
          />
        </View>
        <Text
          style={[
            styles.iconCardTitle,
            { color: isInactive ? "#64748B" : isSelected ? '#00BFFF' : colors.text },
          ]}
          numberOfLines={2}
        >
          {service.title}
        </Text>
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Icon name="check-circle" size={16} color="#00BFFF" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const scrollToHowItWorks = () => {
    scrollRef.current?.scrollToEnd({ animated: true });
  };

  const handleServiceTap = (serviceKey: ServiceType) => {
    if (selectedServiceForDetails === serviceKey) {
      // If already selected, proceed to booking
      handleClick(serviceKey);
    } else {
      // Show details
      setSelectedServiceForDetails(serviceKey);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <ScrollView
        ref={scrollRef}
        style={[styles.container, { backgroundColor: HOME_M3.surface }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Light Blue Background */}
        <View style={styles.headerSection}>
          <HomeHeroChrome closeDropdowns={closeDropdowns} onLogoPress={onLogoClick} />
        </View>

        {/* White Content Section */}
        <View style={styles.whiteContentSection}>
          {/* Hero Title and Subtitle */}
          <View style={styles.heroTextContainer}>
            <Text
              style={[
                styles.heroTitleWhite,
                { fontSize: fontSize === "large" ? heroTitleSize + 4 : heroTitleSize + 2 },
              ]}
            >
              {t("home.hero.title")}
            </Text>
            <Text style={[styles.heroSubtitleWhite, { fontSize: heroSubtitleSize + 1 }]}>
              {t("home.hero.subtitle")}
            </Text>

            <View style={styles.chipsRow}>
              {HERO_FEATURE_CHIPS.map((chip) => (
                <View key={chip.key} style={styles.heroChipWhite}>
                  <Icon name={chip.icon} size={17} color="#00BFFF" />
                  <Text style={styles.heroChipTextWhite}>{chip.label}</Text>
                </View>
              ))}
            </View>

            <View style={styles.searchWrap}>
              <Icon name="search" size={20} color={HOME_M3.outline} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Find a cook, maid, or cleaner..."
                placeholderTextColor={HOME_M3.outline}
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
              />
              {searchQuery.length > 0 ? (
                <TouchableOpacity onPress={() => setSearchQuery("")} hitSlop={8}>
                  <Icon name="close" size={18} color={HOME_M3.outline} />
                </TouchableOpacity>
              ) : (
                <Icon name="tune" size={20} color={HOME_M3.outline} />
              )}
            </View>
          </View>

          {/* What Service Section */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderText}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {isServiceProvider ? t("home.hero.exploreServices") : t("home.hero.whatService")}
              </Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                {isServiceProvider ? t("home.hero.learnAboutServices") : "Choose a professional for your home"}
              </Text>
            </View>
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
            <Icon name="touch-app" size={16} color={colors.textSecondary} />
            <Text style={[styles.helperText, { color: colors.textSecondary }]}>
              Tap any service to see details • Long press for more info
            </Text>
          </View>

          {!isServiceProvider && !checkingOffer && showOffer ? (
            <View style={styles.promoWrap}>
              <FirstBookingOffer onPress={() => setShowServiceSelection(true)} />
            </View>
          ) : null}

          <View style={styles.statsRow}>
            <View style={styles.statCell}>
              <Text style={styles.statValue}>50k+</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Happy Homes</Text>
            </View>
            <View style={[styles.statCell, styles.statDivider]}>
              <Text style={styles.statValue}>2000+</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Verified Pros</Text>
            </View>
            <View style={styles.statCell}>
              <Text style={styles.statValue}>4.8/5</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Avg Rating</Text>
            </View>
          </View>

          <View style={styles.helpSection}>
            <Text style={[styles.helpTitle, { color: colors.textSecondary }]}>Need help choosing?</Text>
            <View style={styles.helpLinks}>
              <TouchableOpacity style={styles.helpLink} onPress={() => onContactClick?.()}>
                <Icon name="support-agent" size={18} color={HOME_M3.secondary} />
                <Text style={styles.helpLinkText}>Talk to Support</Text>
              </TouchableOpacity>
              <Text style={styles.helpDivider}>|</Text>
              <TouchableOpacity style={styles.helpLink} onPress={scrollToHowItWorks}>
                <Icon name="help-outline" size={18} color={HOME_M3.secondary} />
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

      {showAgentRegistration && (
        <AgentRegistrationForm onBackToLogin={() => setShowAgentRegistration(false)} />
      )}

      {showRegistration && <ServiceProviderRegistration onBackToLogin={() => setShowRegistration(false)} />}
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  container: { flex: 1 },
  scrollContent: { paddingBottom: 0 },
  siteFooterWrap: { width: '100%', alignSelf: 'stretch', marginTop: 8 },
  
  // Softer Cyan Header with Gradient Effect
  headerSection: {
    background Color: '#FFFFFF',
    overflow: 'visible',
    zIndex: 1000,
  },
  
  // Smooth White Content Section with Subtle Shadow
  whiteContentSection: {
    backgroundColor: '#F8FAFC', // Slightly off-white for softer look
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  
  // Hero Text with Better Typography
  heroTextContainer: {
    marginBottom: 28,
  },
  
  heroTitleWhite: {
    color: '#0F172A',
    fontWeight: "800",
    lineHeight: 36,
    marginBottom: 10,
    letterSpacing: -0.5, // Tighter letter spacing for modern look
  },
  
  heroSubtitleWhite: {
    color: '#64748B',
    lineHeight: 22,
    marginBottom: 20,
    maxWidth: "95%",
    letterSpacing: 0.2,
  },
  
  // Modern Search Bar
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    height: 56,
    paddingHorizontal: 16,
    marginBottom: 20,
    shadowColor: "#00BFFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: { marginRight: 10 },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#0F172A',
    paddingVertical: 0,
    fontWeight: '500',
  },
  
  // Elegant Feature Chips
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    columnGap: 12,
    rowGap: 12,
    marginBottom: 24,
    paddingHorizontal: 2,
  },
  heroChipWhite: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E0F2FE',
    shadowColor: "#00BFFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  heroChipTextWhite: {
    color: '#00BFFF',
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  
  // Section Headers
  mainCanvas: {
    marginTop: -20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 32,
    backgroundColor: '#F8FAFC',
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 20,
  },
  sectionHeaderText: { flex: 1 },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 30,
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
    color: '#64748B',
    letterSpacing: 0.1,
  },
  
  providerBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#FFFBEB",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#FDE68A",
    padding: 14,
    marginBottom: 20,
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  providerBannerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: "#92400E",
    fontWeight: "500",
  },
  
  // Modern Icon Grid with Better Spacing
  iconGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
    gap: 14,
    paddingHorizontal: 4,
  },
  
  // Elevated Service Cards with Glassmorphism
  iconCard: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    shadowColor: "#00BFFF",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
    position: 'relative',
    backgroundColor: '#FFFFFF',
  },
  
  // Icon Container with Gradient Effect
  iconCardIconBox: {
    width: 68,
    height: 68,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#00BFFF",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  
  // Service Title with Better Typography
  iconCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 19,
    letterSpacing: 0.1,
    marginTop: 2,
  },
  
  selectedIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  
  // Service Detail Card with Smooth Shadows
  serviceDetailCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 24,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: "#00BFFF",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
  serviceDetailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  serviceDetailTitle: {
    fontSize: 24,
    fontWeight: "800",
    flex: 1,
    letterSpacing: -0.3,
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
    marginTop: 12, 
    marginBottom: 8,
  },
  helperText: { 
    textAlign: "center", 
    fontSize: 12,
  },
  promoWrap: { marginVertical: 12 },
  statsRow: { flexDirection: "row", borderTopWidth: 1, borderBottomWidth: 1, borderColor: HOME_M3.outlineVariant, paddingVertical: 24, marginVertical: 16 },
  statCell: { flex: 1, alignItems: "center" },
  statDivider: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: HOME_M3.outlineVariant },
  statValue: { fontSize: 18, fontWeight: "700", color: HOME_M3.secondary, marginBottom: 4 },
  statLabel: { fontSize: 12, fontWeight: "500", textAlign: "center" },
  helpSection: { alignItems: "center", marginBottom: 20, paddingBottom: 8 },
  helpTitle: { fontSize: 16, fontWeight: "600", marginBottom: 12 },
  helpLinks: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", justifyContent: "center", gap: 8 },
  helpLink: { flexDirection: "row", alignItems: "center", gap: 6 },
  helpLinkText: { color: HOME_M3.secondary, fontSize: 14, fontWeight: "600" },
  helpDivider: { color: HOME_M3.outlineVariant, fontSize: 14 },
  stepsCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },
  stepsTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  stepRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  stepDot: { width: 22, height: 22, borderRadius: 11, textAlign: "center", lineHeight: 22, color: "#fff", backgroundColor: HOME_M3.secondary, fontSize: 12, fontWeight: "700" },
  stepText: { fontSize: 14, fontWeight: "500", flex: 1 },
  dialogOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "center", alignItems: "center", zIndex: 1000 },
  dialogBox: { borderRadius: 12, padding: 20, shadowColor: "#0f172a", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 12 },
});

export default HomePage;
