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

  const ServiceCard = ({ service, index }: { service: typeof services[0]; index: number }) => {
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const isInactive = showProviderInactiveVisual(service.key);
    const isInteractionDisabled = isServiceInactiveForProvider(service.key);
    const showProviderStatus = isServiceProvider && !loadingProviderProfile;
    const inactiveMessage = !isAccountActive
      ? t("home.serviceProvider.service.inactiveAlert.accountInactive")
      : t("home.serviceProvider.service.notOffered");

    useEffect(() => {
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 350,
        delay: index * 80,
        useNativeDriver: true,
      }).start();
    }, []);

    return (
      <Animated.View style={[styles.gridCardWrap, { opacity: opacityAnim }]}>
        <TouchableOpacity
          onPress={() => handleClick(service.key)}
          onLongPress={() => handleLearnMore(service.key)}
          onPressIn={() => handlePressIn(service.key)}
          onPressOut={() => handlePressOut(service.key)}
          activeOpacity={isInteractionDisabled ? 1 : 0.88}
          accessibilityState={{ disabled: isInteractionDisabled }}
          accessibilityLabel={
            isInactive
              ? `${service.title}. ${inactiveMessage}`
              : service.title
          }
          style={[
            styles.gridCard,
            {
              backgroundColor: isInactive
                ? isDarkMode
                  ? "#1e293b"
                  : "#F8FAFC"
                : isDarkMode
                  ? colors.card
                  : HOME_M3.surfaceContainerLowest,
              borderColor: isInactive
                ? isDarkMode
                  ? "#475569"
                  : "#CBD5E1"
                : isDarkMode
                  ? colors.border
                  : HOME_M3.outlineVariant,
            },
            isInactive && styles.gridCardInactive,
            showProviderStatus && !isInactive && !isDarkMode && styles.gridCardActive,
          ]}
        >
          <View style={styles.gridCardTopRow}>
            <View
              style={[
                styles.gridIconBox,
                {
                  backgroundColor: isInactive
                    ? isDarkMode
                      ? "#334155"
                      : "#E2E8F0"
                    : isDarkMode
                      ? colors.surface
                      : HOME_M3.secondaryFixed,
                },
              ]}
            >
              <Icon
                name={isInactive ? "block" : SERVICE_ICONS[service.key]}
                size={22}
                color={isInactive ? "#94A3B8" : HOME_M3.onSecondaryFixedVariant}
              />
            </View>
            {showProviderStatus ? (
              <View
                style={[
                  styles.statusPill,
                  isInactive ? styles.statusPillInactive : styles.statusPillActive,
                ]}
              >
                <Text
                  style={[
                    styles.statusPillText,
                    isInactive ? styles.statusPillTextInactive : styles.statusPillTextActive,
                  ]}
                >
                  {isInactive
                    ? t("home.serviceProvider.service.inactive")
                    : t("home.serviceProvider.service.active")}
                </Text>
              </View>
            ) : null}
          </View>

          <Text
            style={[
              styles.gridTitle,
              { color: isInactive ? "#64748B" : colors.text },
            ]}
            numberOfLines={1}
          >
            {service.title}
          </Text>
          <Text
            style={[
              styles.gridSubtitle,
              { color: isInactive ? "#94A3B8" : colors.textSecondary },
            ]}
            numberOfLines={3}
          >
            {isInactive ? inactiveMessage : service.subtitle}
          </Text>

          {isInactive ? (
            <View style={styles.inactiveHintRow}>
              <Icon name="info-outline" size={14} color="#B45309" />
              <Text style={styles.inactiveHintText}>Tap for details</Text>
            </View>
          ) : !showProviderStatus ? (
            <View style={styles.gridBadgeRow}>
              <Text style={styles.gridBadge}>⭐ Top Rated</Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const scrollToHowItWorks = () => {
    scrollRef.current?.scrollToEnd({ animated: true });
  };

  return (
    <View style={styles.mainContainer}>
      <ScrollView
        ref={scrollRef}
        style={[styles.container, { backgroundColor: HOME_M3.surface }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient colors={[...HOME_HERO_GRADIENT]} style={styles.heroGradient}>
          <HomeHeroChrome closeDropdowns={closeDropdowns} onLogoPress={onLogoClick} />

          <View style={styles.heroBody}>
            <Text
              style={[
                styles.heroTitle,
                { fontSize: fontSize === "large" ? heroTitleSize + 4 : heroTitleSize + 2 },
              ]}
            >
              {t("home.hero.title")}
            </Text>
            <Text style={[styles.heroSubtitle, { fontSize: heroSubtitleSize + 1 }]}>
              {t("home.hero.subtitle")}
            </Text>

            <View style={styles.chipsRow}>
              {HERO_FEATURE_CHIPS.map((chip) => (
                <View key={chip.key} style={styles.heroChip}>
                  <Icon name={chip.icon} size={17} color={HOME_M3.onPrimaryContainer} />
                  <Text style={styles.heroChipText}>{chip.label}</Text>
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
        </LinearGradient>

        <View
          style={[
            styles.mainCanvas,
            { backgroundColor: isDarkMode ? colors.background : HOME_M3.surface },
          ]}
        >
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

          <View style={styles.serviceGrid}>
            {filteredServices.map((service, index) => (
              <ServiceCard key={service.key} service={service} index={index} />
            ))}
          </View>

          {filteredServices.length === 0 ? (
            <Text style={[styles.emptySearch, { color: colors.textSecondary }]}>
              No services match your search.
            </Text>
          ) : null}

          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            Long press a card to view details
          </Text>

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

          <View
            style={[
              styles.stepsCard,
              {
                backgroundColor: isDarkMode ? colors.card : HOME_M3.surfaceContainerLowest,
                borderColor: isDarkMode ? colors.border : HOME_M3.outlineVariant,
              },
            ]}
          >
            <Text style={[styles.stepsTitle, { color: colors.text }]}>{t("home.howItWorks.title")}</Text>
            <View style={styles.stepRow}>
              <Text style={styles.stepDot}>1</Text>
              <Text style={[styles.stepText, { color: colors.textSecondary }]}>Choose a service</Text>
            </View>
            <View style={styles.stepRow}>
              <Text style={styles.stepDot}>2</Text>
              <Text style={[styles.stepText, { color: colors.textSecondary }]}>Select date and time</Text>
            </View>
            <View style={styles.stepRow}>
              <Text style={styles.stepDot}>3</Text>
              <Text style={[styles.stepText, { color: colors.textSecondary }]}>Confirm and relax</Text>
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
  heroGradient: { paddingBottom: 44, overflow: "visible" },
  heroBody: { paddingHorizontal: 20 },
  heroTitle: { color: HOME_M3.onPrimary, fontWeight: "800", lineHeight: 36, marginBottom: 8 },
  heroSubtitle: { color: HOME_M3.onPrimaryContainer, lineHeight: 20, marginBottom: 16, maxWidth: "95%" },
  searchWrap: {
    flexDirection: "row", alignItems: "center", backgroundColor: HOME_M3.surfaceContainerLowest,
    borderRadius: 12, height: 56, paddingHorizontal: 14, marginBottom: 4,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 6,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16, color: HOME_M3.onSurface, paddingVertical: 0 },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    columnGap: 18,
    rowGap: 10,
    marginBottom: 14,
  },
  heroChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroChipText: {
    color: HOME_M3.onPrimaryContainer,
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.1,
  },
  mainCanvas: {
    marginTop: -18,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 28,
  },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 },
  sectionHeaderText: { flex: 1 },
  sectionTitle: { fontSize: 22, fontWeight: "700", lineHeight: 28 },
  sectionSubtitle: { fontSize: 14, marginTop: 4, lineHeight: 20 },
  providerBanner: { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: "#FFFBEB", borderRadius: 12, borderWidth: 1, borderColor: "#FDE68A", padding: 12, marginBottom: 14 },
  providerBannerText: { flex: 1, fontSize: 13, lineHeight: 18, color: "#92400E", fontWeight: "500" },
  serviceGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 12 },
  gridCardWrap: { width: "48%" },
  gridCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    minHeight: 156,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
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
    marginBottom: 10,
    gap: 8,
  },
  gridIconBox: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
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
  },
  statusPillTextInactive: {
    color: "#B91C1C",
  },
  statusPillTextActive: {
    color: "#166534",
  },
  gridTitle: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  gridSubtitle: { fontSize: 12, lineHeight: 17 },
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
  helperText: { textAlign: "center", marginTop: 12, marginBottom: 8, fontSize: 12 },
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
