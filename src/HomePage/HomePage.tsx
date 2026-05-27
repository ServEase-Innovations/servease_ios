import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  useWindowDimensions,
  Animated,
  Platform,
} from "react-native";
import { useDispatch } from "react-redux";
import { add } from "../features/bookingTypeSlice";
import { DETAILS } from "../Constants/pagesConstants";
import LinearGradient from "react-native-linear-gradient";
import { useAuth0 } from "react-native-auth0";
import { useTheme } from "../Settings/ThemeContext";
import { BRAND, GRADIENTS } from "../theme/brandColors";
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
import BroadcastMessage from "./BroadcastMessage";

const cookImage = require("../../assets/images/Cooknew.png");
const maidImage = require("../../assets/images/Maidnew.png");
const nannyImage = require("../../assets/images/Nannynew.png");

interface ChildComponentProps {
  sendDataToParent: (data: string) => void;
  bookingType: (data: string) => void;
  user?: any;
  providerDetails?: any;
}

type ServiceType = "COOK" | "MAID" | "NANNY";

const HomePage: React.FC<ChildComponentProps> = ({ sendDataToParent }) => {
  const { colors, isDarkMode, fontSize } = useTheme();
  const { t } = useTranslation();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { user: auth0User } = useAuth0();
  const dispatch = useDispatch();

  const isSmallScreen = screenWidth < 375;
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
  const [showOffer, setShowOffer] = useState(true);
  const [showServiceSelection, setShowServiceSelection] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  // Animation values for each service card
  const scaleAnimations = useRef({
    COOK: new Animated.Value(1),
    MAID: new Animated.Value(1),
    NANNY: new Animated.Value(1),
  }).current;

  useEffect(() => {
    setIsAuthenticated(!!auth0User);
  }, [auth0User]);

  useEffect(() => {
    if (isAuthenticated && auth0User) {
      const userRole = auth0User.role || "CUSTOMER";
      setRole(userRole);
    }
  }, [isAuthenticated, auth0User]);

  const services = useMemo(
    () => [
      { 
        key: "COOK" as ServiceType, 
        title: t("home.services.homeCook"), 
        subtitle: "Daily and custom meals", 
        image: cookImage,
        gradientColors: [...GRADIENTS.serviceCardCook],
      },
      { 
        key: "MAID" as ServiceType, 
        title: t("home.services.cleaningHelp"), 
        subtitle: "Cleaning and upkeep", 
        image: maidImage,
        gradientColors: [...GRADIENTS.serviceCardMaid],
      },
      { 
        key: "NANNY" as ServiceType, 
        title: t("home.services.caregiver"), 
        subtitle: "Child and elder care", 
        image: nannyImage,
        gradientColors: [...GRADIENTS.serviceCardNanny],
      },
    ],
    [t]
  );

  const isServiceDisabled = role === "SERVICE_PROVIDER";

  const handlePressIn = (serviceKey: string) => {
    Animated.spring(scaleAnimations[serviceKey as keyof typeof scaleAnimations], {
      toValue: 0.97,
      friction: 5,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = (serviceKey: string) => {
    Animated.spring(scaleAnimations[serviceKey as keyof typeof scaleAnimations], {
      toValue: 1,
      friction: 5,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handleClick = (data: ServiceType) => {
    if (isServiceDisabled) {
      Alert.alert(t("home.serviceProvider.alert.title"), t("home.serviceProvider.alert.message"), [{ text: t("common.ok") }]);
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
    bookingDetails.startTime = bookingDetails.startTime.format("HH:mm");
    bookingDetails.endTime = bookingDetails.endTime.format("HH:mm");

    const formatDate = (value: any) => {
      if (!value) return "";
      const date = new Date(value);
      if (isNaN(date.getTime())) return value;
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
    const endTimeStr = bookingDetails.endTime
      ? formatTime(bookingDetails.endTime)
      : "";
    const booking = {
      startDate: formatDate(bookingDetails.startDate),
      startTime: startTimeStr,
      endDate: formatDate(bookingDetails.endDate || bookingDetails.startDate),
      endTime: endTimeStr,
      timeRange:
        startTimeStr && endTimeStr
          ? `${startTimeStr}-${endTimeStr}`
          : startTimeStr || "",
      bookingPreference: selectedRadioButtonValue,
      housekeepingRole: selectedType,
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

  const ServiceCard = ({ service, index }: { service: typeof services[0], index: number }) => {
    const slideAnim = useRef(new Animated.Value(50)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          delay: index * 100,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 400,
          delay: index * 100,
          useNativeDriver: true,
        }),
      ]).start();
    }, []);

    return (
      <Animated.View
        style={{
          transform: [{ translateX: slideAnim }],
          opacity: opacityAnim,
        }}
      >
        <TouchableOpacity
          onPress={() => handleClick(service.key)}
          onLongPress={() => handleLearnMore(service.key)}
          onPressIn={() => handlePressIn(service.key)}
          onPressOut={() => handlePressOut(service.key)}
          disabled={isServiceDisabled}
          activeOpacity={0.9}
        >
          <Animated.View
            style={[
              styles.serviceCardWrapper,
              {
                transform: [{ scale: scaleAnimations[service.key as keyof typeof scaleAnimations] }],
              },
            ]}
          >
            <View
              style={[
                styles.serviceCardBorder,
                { borderColor: service.gradientColors[1] ?? BRAND.accent },
              ]}
            >
              <View style={styles.serviceCardInner}>
                <View style={styles.serviceImageContainer}>
                  <View style={styles.serviceImageGlow}>
                    <Image source={service.image} style={styles.serviceImage} />
                  </View>
                </View>

                <View style={styles.serviceContent}>
                  <View style={styles.serviceHeader}>
                    <Text style={styles.serviceTitle} numberOfLines={1}>
                      {service.title}
                    </Text>
                    <View style={styles.serviceBadge}>
                      <Text style={styles.serviceBadgeText}>⭐ Top Rated</Text>
                    </View>
                  </View>

                  <Text style={styles.serviceSub} numberOfLines={2}>
                    {service.subtitle}
                  </Text>

                  <View style={styles.serviceFeatures}>
                    <View style={styles.featureChip}>
                      <Text style={styles.featureChipText}>✓ Verified</Text>
                    </View>
                    <View style={styles.featureChip}>
                      <Text style={styles.featureChipText}>✓ Insured</Text>
                    </View>
                  </View>

                  <View style={styles.bookButton}>
                    <Text style={styles.bookButtonText}>Book Now →</Text>
                  </View>
                </View>
              </View>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.mainContainer, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section - Extreme deep shadow */}
        <View style={styles.heroOuter}>
          <View style={styles.heroShadowLayer}>
            <View style={styles.hero}>
              <Text style={styles.heroEyebrow}>SERVEASO HOME SERVICES</Text>
              <Text
                style={[
                  styles.heroTitle,
                  {
                    fontSize: fontSize === "large" ? heroTitleSize + 2 : heroTitleSize,
                    lineHeight: (fontSize === "large" ? heroTitleSize + 2 : heroTitleSize) + 3,
                  },
                ]}
                numberOfLines={3}
                allowFontScaling={false}
              >
                {t("home.hero.title")}
              </Text>
              <Text
                style={[styles.heroSubtitle, { fontSize: heroSubtitleSize, lineHeight: heroSubtitleSize + 6 }]}
                numberOfLines={4}
                allowFontScaling={false}
              >
                {t("home.hero.subtitle")}
              </Text>
              <View style={styles.heroPills}>
                <Text style={styles.heroPill}>Trusted Pros</Text>
                <Text style={styles.heroPill}>Easy Booking</Text>
                <Text style={styles.heroPill}>Flexible Slots</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Section Wrap with deep shadow */}
        <View style={styles.sectionWrapOuter}>
          <View style={styles.sectionWrapShadowLayer}>
            <View style={[styles.sectionWrap, { backgroundColor: isDarkMode ? colors.card : "#ffffff" }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {isServiceDisabled ? t("home.hero.exploreServices") : t("home.hero.whatService")}
              </Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                {isServiceDisabled ? t("home.hero.learnAboutServices") : t("home.hero.tapToBook")}
              </Text>

              <View style={styles.serviceGrid}>
                {services.map((service, index) => (
                  <ServiceCard key={service.key} service={service} index={index} />
                ))}
              </View>

              <Text style={[styles.helperText, { color: colors.textSecondary }]}>Long press a card to view details</Text>
              
              {/* Quick Stats with individual deep shadows */}
              <View style={styles.quickStats}>
                <View style={styles.quickStatOuter}>
                  <View style={styles.quickStatShadowLayer}>
                    <View style={[styles.quickStatCard, { backgroundColor: isDarkMode ? colors.surface : "#f1f5f9" }]}>
                      <Text style={[styles.quickStatValue, { color: colors.text }]}>4.8</Text>
                      <Text style={[styles.quickStatLabel, { color: colors.textSecondary }]}>Avg Rating</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.quickStatOuter}>
                  <View style={styles.quickStatShadowLayer}>
                    <View style={[styles.quickStatCard, { backgroundColor: isDarkMode ? colors.surface : "#f1f5f9" }]}>
                      <Text style={[styles.quickStatValue, { color: colors.text }]}>30m</Text>
                      <Text style={[styles.quickStatLabel, { color: colors.textSecondary }]}>Fast Match</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.quickStatOuter}>
                  <View style={styles.quickStatShadowLayer}>
                    <View style={[styles.quickStatCard, { backgroundColor: isDarkMode ? colors.surface : "#f1f5f9" }]}>
                      <Text style={[styles.quickStatValue, { color: colors.text }]}>10k+</Text>
                      <Text style={[styles.quickStatLabel, { color: colors.textSecondary }]}>Bookings</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {!isServiceDisabled && showOffer ? (
          <View style={styles.promoOuter}>
            <View style={styles.promoShadowLayer}>
              <View style={styles.promoWrap}>
                <FirstBookingOffer onPress={() => setShowServiceSelection(true)} />
              </View>
            </View>
          </View>
        ) : null}

        {/* Steps Card with deep shadow */}
        <View style={styles.stepsCardOuter}>
          <View style={styles.stepsCardShadowLayer}>
            <View style={[styles.stepsCard, { backgroundColor: isDarkMode ? colors.card : "#ffffff", borderColor: colors.border + "55" }]}>
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
          </View>
        </View>

        {!isServiceDisabled && (
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

      <Modal visible={showAgentRegistration} animationType="slide">
        <AgentRegistrationForm onBackToLogin={() => setShowAgentRegistration(false)} />
      </Modal>

      {showRegistration && <ServiceProviderRegistration onBackToLogin={() => setShowRegistration(false)} />}
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  container: { flex: 1 },
  
  // Hero Section with extreme deep shadow
  heroOuter: {
    marginHorizontal: 14,
    marginTop: 25,
    marginBottom: 12,
  },
  heroShadowLayer: {
    borderRadius: 24,
    backgroundColor: "#ffffff",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 20,
  },
  hero: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 18,
    alignItems: "center",
    overflow: "hidden",
  },
  heroEyebrow: {
    color: "#1e3a8a",
    letterSpacing: 3.2,
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 5,
    width: "100%",
    alignSelf: "center",
  },
  heroTitle: {
    color: "#0f172a",
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 4,
    width: "92%",
    alignSelf: "center",
  },
  heroSubtitle: {
    color: "#334155",
    textAlign: "center",
    marginBottom: 4,
    fontWeight: "500",
    width: "90%",
    alignSelf: "center",
  },
  heroPills: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 5,
    paddingHorizontal: 10,
    marginTop: 0,
  },
  heroPill: {
    color: "#1e3a8a",
    backgroundColor: "#e0e7ff",
    borderColor: "#c7d2fe",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
    fontSize: 11,
    fontWeight: "600",
  },
  
  // Section Wrap with deep shadow
  sectionWrapOuter: {
    marginHorizontal: 14,
    marginTop: 6,
    marginBottom: 4,
  },
  sectionWrapShadowLayer: {
    borderRadius: 18,
    backgroundColor: "#ffffff",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 16,
  },
  sectionWrap: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },
  sectionSubtitle: {
    textAlign: "center",
    marginTop: 4,
    marginBottom: 14,
  },
  serviceGrid: {
    gap: 16,
  },
  
  // Service Cards with extremely deep shadow
  serviceCardWrapper: {
    borderRadius: 16,
    ...Platform.select({
      ios: {},
      android: { overflow: "hidden" as const },
    }),
    shadowColor: "#0a0f1e",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 18,
  },
  serviceCardBorder: {
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: "#fff",
  },
  serviceCardInner: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    alignItems: "flex-start",
  },
  serviceImageContainer: {
    marginRight: 12,
  },
  serviceImageGlow: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e0e7ff",
    shadowColor: "#1e3a8a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
  },
  serviceImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  serviceContent: {
    flex: 1,
    minWidth: 0,
    paddingTop: 2,
  },
  serviceHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 6,
    gap: 8,
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: "800",
    flex: 1,
    flexShrink: 1,
    color: BRAND.text,
  },
  serviceBadge: {
    flexShrink: 0,
    backgroundColor: BRAND.accentDark,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minHeight: 28,
    justifyContent: "center",
  },
  serviceBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 14,
  },
  serviceSub: {
    fontSize: 13,
    marginBottom: 8,
    color: "#475569",
    lineHeight: 18,
  },
  serviceFeatures: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  featureChip: {
    backgroundColor: "#e0e7ff",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  featureChipText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#1e3a8a",
  },
  bookButton: {
    alignSelf: "flex-start",
    backgroundColor: BRAND.accent,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    minHeight: 40,
    justifyContent: "center",
    marginTop: 4,
  },
  bookButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 16,
  },
  helperText: {
    textAlign: "center",
    marginTop: 12,
    fontSize: 12,
  },
  
  // Quick Stats with deep shadow
  quickStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    gap: 8,
  },
  quickStatOuter: {
    flex: 1,
  },
  quickStatShadowLayer: {
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  quickStatCard: {
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
  },
  quickStatValue: {
    fontSize: 14,
    fontWeight: "800",
  },
  quickStatLabel: {
    fontSize: 11,
    fontWeight: "500",
  },
  
  // Promo section with deep shadow
  promoOuter: {
    marginHorizontal: 14,
    marginTop: 10,
    marginBottom: 4,
  },
  promoShadowLayer: {
    borderRadius: 16,
    backgroundColor: "transparent",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 16,
  },
  promoWrap: {
    borderRadius: 16,
    overflow: "hidden",
  },
  
  // Steps Card with deep shadow
  stepsCardOuter: {
    marginHorizontal: 14,
    marginTop: 12,
    marginBottom: 4,
  },
  stepsCardShadowLayer: {
    borderRadius: 16,
    backgroundColor: "#ffffff",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 16,
  },
  stepsCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  stepsTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    textAlign: "center",
    lineHeight: 22,
    color: "#fff",
    backgroundColor: "#1e3a8a",
    fontSize: 12,
    fontWeight: "700",
  },
  stepText: {
    fontSize: 14,
    fontWeight: "500",
  },
  dialogOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  dialogBox: {
    borderRadius: 12,
    padding: 20,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 20,
  },
});

export default HomePage;