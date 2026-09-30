import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  ScrollView,
  BackHandler,
  Clipboard,
  TouchableWithoutFeedback,
  Platform,
  Animated,
  PanResponder,
  Vibration,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialIcons";
import Snackbar from "react-native-snackbar";
import LinearGradient from "react-native-linear-gradient";
import { useTheme } from "../Settings/ThemeContext";
import { FIRST_BOOKING_COUPON_CODES } from "../services/couponService";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SHEET_MAX_HEIGHT = Math.min(SCREEN_HEIGHT * 0.9, 700);
const DISMISS_DRAG = 72;
const HEADER_DRAG_ZONE = 112;

const SERVICES = [
  {
    id: "COOK",
    title: "Home Cook",
    icon: "👩‍🍳",
    subtitle: "Daily & custom meals",
    colors: ["#0284c7", "#0369a1"],
    couponCode: FIRST_BOOKING_COUPON_CODES.COOK,
    isLarge: true,
  },
  {
    id: "MAID",
    title: "Cleaning Help",
    icon: "🧹",
    subtitle: "Home cleaning & upkeep",
    colors: ["#059669", "#047857"],
    couponCode: FIRST_BOOKING_COUPON_CODES.MAID,
    isLarge: false,
  },
  {
    id: "NANNY",
    title: "Caregiver",
    icon: "👶",
    subtitle: "Child & elder care",
    colors: ["#7c3aed", "#6d28d9"],
    couponCode: null,
    isLarge: false,
  },
];

interface ServiceSelectionDialogProps {
  visible: boolean;
  onClose: () => void;
  onSelectService: (serviceType: string) => void;
}

const AnimatedServiceCard = ({ service, onPress, isDarkMode }: any) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, tension: 300 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 300 }).start();
  };

  return (
    <Animated.View style={[styles.cardContainer, service.isLarge ? styles.cardLarge : styles.cardSmall, { transform: [{ scale }] }]}>
      <TouchableOpacity
        onPress={() => onPress(service.id)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        style={styles.cardTouchable}
        accessibilityRole="button"
        accessibilityLabel={`Book ${service.title}`}
      >
        <LinearGradient
          colors={service.colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          {/* Glassmorphic overlay for text area */}
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{service.title}</Text>
              <Text style={styles.cardSubtitle}>{service.subtitle}</Text>
            </View>
            
            {service.couponCode && (
              <View style={styles.cardBadge}>
                <Text style={styles.cardBadgeText}>Code: {service.couponCode}</Text>
              </View>
            )}
          </View>
          
          <Text style={[styles.floatingIcon, service.isLarge ? styles.floatingIconLarge : styles.floatingIconSmall]}>
            {service.icon}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const ServiceSelectionDialog: React.FC<ServiceSelectionDialogProps> = ({
  visible,
  onClose,
  onSelectService,
}) => {
  const { colors, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const [couponCopied, setCouponCopied] = useState(false);
  const [mounted, setMounted] = useState(visible);

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollOffsetY = useRef(0);
  const dragStartY = useRef(0);

  const dismissSheet = useCallback(() => {
    dragY.setValue(0);
    onClose();
  }, [dragY, onClose]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (visible) {
        dismissSheet();
        return true;
      }
      return false;
    });
    return () => backHandler.remove();
  }, [visible, dismissSheet]);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      scrollOffsetY.current = 0;
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
        setCouponCopied(false);
      });
    }
  }, [visible, mounted, slideAnim, dragY, fadeAnim]);

  const finishDismiss = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      dragY.setValue(0);
      slideAnim.setValue(SCREEN_HEIGHT);
      dismissSheet();
    });
  }, [slideAnim, dragY, dismissSheet]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gesture) => {
          const inHeader = dragStartY.current <= HEADER_DRAG_ZONE;
          const downward = gesture.dy > 6 && Math.abs(gesture.dy) > Math.abs(gesture.dx);
          if (!downward) return false;
          return inHeader || scrollOffsetY.current <= 0;
        },
        onMoveShouldSetPanResponderCapture: (_, gesture) => {
          const inHeader = dragStartY.current <= HEADER_DRAG_ZONE;
          const downward = gesture.dy > 8 && Math.abs(gesture.dy) > Math.abs(gesture.dx);
          if (!downward) return false;
          return inHeader || scrollOffsetY.current <= 0;
        },
        onPanResponderGrant: (evt) => {
          dragStartY.current = evt.nativeEvent.locationY;
        },
        onPanResponderMove: (_, gesture) => {
          if (gesture.dy > 0) {
            dragY.setValue(gesture.dy);
          }
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy > DISMISS_DRAG || gesture.vy > 0.45) {
            finishDismiss();
            return;
          }
          Animated.spring(dragY, {
            toValue: 0,
            useNativeDriver: true,
            friction: 8,
            tension: 80,
          }).start();
        },
        onPanResponderTerminate: () => {
          Animated.spring(dragY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        },
      }),
    [dragY, finishDismiss]
  );

  const handleSelectService = (serviceId: string) => {
    if (Platform.OS === "android") Vibration.vibrate(10);
    else if (Platform.OS === "ios") Vibration.vibrate(15);
    
    onSelectService(serviceId);
    dismissSheet();
  };

  const copyCoupon = async (code: string) => {
    try {
      if (Platform.OS === "android") Vibration.vibrate(10);
      else if (Platform.OS === "ios") Vibration.vibrate(15);
      
      await Clipboard.setString(code);
      setCouponCopied(true);
      Snackbar.show({
        text: `Coupon ${code} copied — apply at checkout`,
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: "#059669",
        textColor: "#ffffff",
      });
      setTimeout(() => setCouponCopied(false), 2200);
    } catch {
      Snackbar.show({
        text: "Could not copy coupon. Please try again.",
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: "#DC2626",
        textColor: "#ffffff",
      });
    }
  };

  if (!mounted) return null;

  const surface = isDarkMode ? colors.surface : "#FFFFFF";
  const textPrimary = isDarkMode ? colors.textPrimary : "#0F172A";
  const textMuted = isDarkMode ? colors.textSecondary : "#64748B";
  const sheetTranslateY = Animated.add(slideAnim, dragY);

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={dismissSheet}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <TouchableWithoutFeedback onPress={dismissSheet}>
            <View style={styles.backdropTap} />
          </TouchableWithoutFeedback>
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: surface,
              maxHeight: SHEET_MAX_HEIGHT,
              paddingBottom: Math.max(insets.bottom, 24),
              transform: [{ translateY: sheetTranslateY }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.handleWrap}>
            <View style={[styles.handle, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)" }]} />
          </View>

          <View style={styles.headerRow}>
            <View style={styles.headerTextWrap}>
              <Text style={[styles.headerEyebrow, { color: textMuted }]}>Our Services</Text>
              <Text style={[styles.headerTitle, { color: textPrimary }]}>What do you need?</Text>
            </View>
            <TouchableOpacity
              onPress={dismissSheet}
              style={[styles.closeBtn, { backgroundColor: isDarkMode ? colors.card : "#F1F5F9" }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Close"
            >
              <Icon name="close" size={20} color={textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={(e) => {
              scrollOffsetY.current = e.nativeEvent.contentOffset.y;
            }}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Minimal Offer Banner */}
            <View style={[styles.minimalBanner, { backgroundColor: isDarkMode ? colors.card : "#FFFBEB", borderColor: isDarkMode ? "rgba(253, 230, 138, 0.2)" : "rgba(253, 230, 138, 0.6)" }]}>
              <View style={styles.bannerLeft}>
                <Text style={styles.bannerTitle}>🔥 First Booking Special</Text>
                <Text style={[styles.bannerSubtitle, { color: textMuted }]}>Flat ₹99 for Maid or Cook</Text>
              </View>
              <View style={styles.bannerRight}>
                <TouchableOpacity onPress={() => void copyCoupon(FIRST_BOOKING_COUPON_CODES.MAID)} style={styles.miniCoupon}>
                  <Text style={styles.miniCouponText}>{FIRST_BOOKING_COUPON_CODES.MAID}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => void copyCoupon(FIRST_BOOKING_COUPON_CODES.COOK)} style={styles.miniCoupon}>
                  <Text style={styles.miniCouponText}>{FIRST_BOOKING_COUPON_CODES.COOK}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Bento Box Grid */}
            <View style={styles.bentoGrid}>
              {SERVICES.map((service) => (
                <AnimatedServiceCard 
                  key={service.id} 
                  service={service} 
                  onPress={handleSelectService} 
                  isDarkMode={isDarkMode} 
                />
              ))}
            </View>

            <Text style={[styles.footerNote, { color: textMuted }]}>
              Tap a service to view available professionals and select your preferred schedule.
            </Text>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0, 0, 0, 0.45)" },
  backdropTap: { flex: 1 },
  sheet: {
    width: "100%",
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 24,
  },
  handleWrap: { alignItems: "center", paddingTop: 16, paddingBottom: 8 },
  handle: { width: 50, height: 6, borderRadius: 4 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 28,
    paddingTop: 8,
    paddingBottom: 20,
  },
  headerTextWrap: { flex: 1, paddingRight: 12 },
  headerEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  headerTitle: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 24 },
  
  // Minimal Banner
  minimalBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 24,
  },
  bannerLeft: { flex: 1 },
  bannerTitle: { fontSize: 14, fontWeight: "800", color: "#DC2626", marginBottom: 2 },
  bannerSubtitle: { fontSize: 12, fontWeight: "600" },
  bannerRight: { flexDirection: "row", gap: 8 },
  miniCoupon: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  miniCouponText: { fontSize: 11, fontWeight: "800", color: "#92400E" },

  // Bento Grid
  bentoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 16,
  },
  cardContainer: {
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  cardLarge: {
    width: "100%",
    height: 180,
  },
  cardSmall: {
    width: "47%",
    height: 190,
  },
  cardTouchable: { flex: 1 },
  cardGradient: {
    flex: 1,
    padding: 20,
    position: "relative",
  },
  cardContent: {
    flex: 1,
    justifyContent: "space-between",
    zIndex: 10,
  },
  cardHeader: {
    backgroundColor: "rgba(0,0,0,0.2)",
    padding: 12,
    borderRadius: 16,
    alignSelf: "flex-start",
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 2,
    letterSpacing: -0.5,
  },
  cardSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
  },
  cardBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  cardBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  floatingIcon: {
    position: "absolute",
    opacity: 0.9,
  },
  floatingIconLarge: {
    fontSize: 100,
    bottom: -20,
    right: 10,
  },
  floatingIconSmall: {
    fontSize: 80,
    bottom: -15,
    right: -10,
  },
  footerNote: {
    marginTop: 28,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    fontWeight: "500",
    paddingHorizontal: 12,
  },
});

export default ServiceSelectionDialog;
