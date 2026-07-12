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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialIcons";
import Snackbar from "react-native-snackbar";
import { useTheme } from "../Settings/ThemeContext";
import { FIRST_BOOKING_COUPON_CODES } from "../services/couponService";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SHEET_MAX_HEIGHT = Math.min(SCREEN_HEIGHT * 0.88, 640);
const DISMISS_DRAG = 72;
const HEADER_DRAG_ZONE = 112;

const SERVICES = [
  {
    id: "COOK",
    title: "Home Cook",
    icon: "👩‍🍳",
    subtitle: "Daily & custom meals",
    accent: "#0EA5E9",
    tint: "#E0F2FE",
    couponCode: FIRST_BOOKING_COUPON_CODES.COOK,
  },
  {
    id: "MAID",
    title: "Cleaning Help",
    icon: "🧹",
    subtitle: "Home cleaning & upkeep",
    accent: "#059669",
    tint: "#D1FAE5",
    couponCode: FIRST_BOOKING_COUPON_CODES.MAID,
  },
  {
    id: "NANNY",
    title: "Caregiver",
    icon: "👶",
    subtitle: "Child & elder care",
    accent: "#7C3AED",
    tint: "#EDE9FE",
    couponCode: null,
  },
] as const;

interface ServiceSelectionDialogProps {
  visible: boolean;
  onClose: () => void;
  onSelectService: (serviceType: string) => void;
}

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
    onSelectService(serviceId);
    dismissSheet();
  };

  const copyCoupon = async (code: string) => {
    try {
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
  const borderColor = isDarkMode ? colors.border : "#E2E8F0";
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
              paddingBottom: Math.max(insets.bottom, 16),
              transform: [{ translateY: sheetTranslateY }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.handleWrap}>
            <View style={[styles.handle, { backgroundColor: borderColor }]} />
          </View>

          <View style={styles.headerRow}>
            <View style={styles.headerTextWrap}>
              <Text style={[styles.headerEyebrow, { color: textMuted }]}>Limited offer</Text>
              <Text style={[styles.headerTitle, { color: textPrimary }]}>Pick a service</Text>
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
            <View
              style={[
                styles.offerCard,
                { borderColor: "#FDE68A", backgroundColor: isDarkMode ? colors.card : "#FFFBEB" },
              ]}
            >
              <View style={styles.offerTop}>
                <View style={styles.hotPill}>
                  <Text style={styles.hotPillText}>🔥 HOT DEAL</Text>
                </View>
                <Text style={[styles.offerHint, { color: textMuted }]}>First booking only</Text>
              </View>

              <View style={styles.offerMain}>
                <View style={styles.priceBlock}>
                  <Text style={[styles.priceLabel, { color: textMuted }]}>First maid or cook booking</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceValue}>₹99</Text>
                    <Text style={[styles.priceSuffix, { color: textMuted }]}>flat</Text>
                  </View>
                </View>

                <View style={styles.couponStack}>
                  <TouchableOpacity
                    onPress={() => void copyCoupon(FIRST_BOOKING_COUPON_CODES.MAID)}
                    activeOpacity={0.85}
                    style={[styles.couponChip, couponCopied && styles.couponChipCopied]}
                    accessibilityRole="button"
                    accessibilityLabel={`Copy coupon code ${FIRST_BOOKING_COUPON_CODES.MAID}`}
                  >
                    <Text style={[styles.couponLabel, { color: textMuted }]}>Maid</Text>
                    <View style={styles.couponCodeRow}>
                      <Text style={styles.couponCode}>{FIRST_BOOKING_COUPON_CODES.MAID}</Text>
                      <Icon name="content-copy" size={15} color="#92400E" />
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => void copyCoupon(FIRST_BOOKING_COUPON_CODES.COOK)}
                    activeOpacity={0.85}
                    style={[styles.couponChip, couponCopied && styles.couponChipCopied]}
                    accessibilityRole="button"
                    accessibilityLabel={`Copy coupon code ${FIRST_BOOKING_COUPON_CODES.COOK}`}
                  >
                    <Text style={[styles.couponLabel, { color: textMuted }]}>Cook</Text>
                    <View style={styles.couponCodeRow}>
                      <Text style={styles.couponCode}>{FIRST_BOOKING_COUPON_CODES.COOK}</Text>
                      <Icon name="content-copy" size={15} color="#92400E" />
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <Text style={[styles.sectionLabel, { color: textPrimary }]}>Choose your service</Text>

            <View style={styles.serviceList}>
              {SERVICES.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  style={[
                    styles.serviceRow,
                    {
                      backgroundColor: isDarkMode ? colors.card : "#FFFFFF",
                      borderColor,
                    },
                  ]}
                  onPress={() => handleSelectService(service.id)}
                  activeOpacity={0.82}
                  accessibilityRole="button"
                  accessibilityLabel={`Book ${service.title}`}
                >
                  <View style={[styles.serviceIconWrap, { backgroundColor: service.tint }]}>
                    <Text style={styles.serviceEmoji}>{service.icon}</Text>
                  </View>

                  <View style={styles.serviceCopy}>
                    <Text style={[styles.serviceTitle, { color: textPrimary }]} numberOfLines={1}>
                      {service.title}
                    </Text>
                    <Text style={[styles.serviceSubtitle, { color: textMuted }]} numberOfLines={2}>
                      {service.subtitle}
                    </Text>
                    {service.couponCode ? (
                      <Text style={[styles.serviceCoupon, { color: textMuted }]} numberOfLines={1}>
                        Code: {service.couponCode}
                      </Text>
                    ) : null}
                  </View>

                  <View style={[styles.serviceCta, { backgroundColor: service.tint }]}>
                    <Icon name="arrow-forward" size={18} color={service.accent} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.footerNote, { color: textMuted }]}>
              Copy {FIRST_BOOKING_COUPON_CODES.MAID} (maid) or {FIRST_BOOKING_COUPON_CODES.COOK} (cook),
              pick a service, then apply the matching coupon at checkout.
            </Text>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.52)",
  },
  backdropTap: {
    flex: 1,
  },
  sheet: {
    width: "100%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    ...Platform.select({
      ios: {
        shadowColor: "#0f172a",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: { elevation: 16 },
    }),
  },
  handleWrap: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 999,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
  },
  headerTextWrap: {
    flex: 1,
    paddingRight: 12,
  },
  headerEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  offerCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 18,
  },
  offerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  hotPill: {
    backgroundColor: "#DC2626",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  hotPillText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  offerHint: {
    fontSize: 11,
    fontWeight: "500",
  },
  offerMain: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  priceBlock: {
    flex: 1,
    minWidth: 0,
  },
  priceLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 2,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  priceValue: {
    fontSize: 32,
    fontWeight: "800",
    color: "#DC2626",
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  priceSuffix: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
    marginBottom: 5,
  },
  couponStack: {
    gap: 8,
    flexShrink: 0,
  },
  couponChip: {
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: "center",
    minWidth: 96,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  couponChipCopied: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  couponLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.4,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  couponCodeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  couponCode: {
    fontSize: 14,
    fontWeight: "800",
    color: "#92400E",
    letterSpacing: 1,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 10,
  },
  serviceList: {
    gap: 10,
  },
  serviceRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  serviceIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  serviceEmoji: {
    fontSize: 24,
  },
  serviceCopy: {
    flex: 1,
    minWidth: 0,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  serviceSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  serviceCoupon: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: "600",
  },
  serviceCta: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  footerNote: {
    marginTop: 14,
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
  },
});

export default ServiceSelectionDialog;
