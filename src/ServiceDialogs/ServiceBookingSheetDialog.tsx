/* eslint-disable */
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Modal,
  View,
  StyleSheet,
  Animated,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
  Text,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch } from "react-redux";
import { useAuth0 } from "react-native-auth0";
import Snackbar from "react-native-snackbar";
import { BOOKINGS, DASHBOARD, AGENT_DASHBOARD } from "../Constants/pagesConstants";
import dayjs from "dayjs";
import BookingSuccessDialog from "../common/BookingSuccessDialog";
import { EnhancedProviderDetails } from "../types/ProviderDetailsType";
import LoginDrawer from "../LoginDrawer/LoginDrawer";
import { useAppUser } from "../context/AppUserContext";
import { logAuth0Error, runAuth0Authorize } from "../utils/auth0Config";
import { isCustomerCheckoutReady } from "../utils/authSession";
import ServiceBookingFlow, {
  type BookingSuccessDetails,
} from "./ServiceBookingFlow";
import {
  SERVICE_BOOKING_CONFIG,
  type ServiceBookingKind,
} from "./serviceBookingConfig";
import { closeBookingDialog, resetBookingSchedule } from "../features/bookingTypeSlice";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const SHEET_RADIUS = 18;
const SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.88;

export interface ServiceBookingSheetDialogProps {
  serviceKind: ServiceBookingKind;
  open: boolean;
  handleClose: () => void;
  providerDetails?: EnhancedProviderDetails;
  sendDataToParent?: (data: string) => void;
  onBookingSuccess?: () => void;
}

/** Bottom sheet for maid/cook booking with pricing engine checkout. */
const ServiceBookingSheetDialog: React.FC<ServiceBookingSheetDialogProps> = ({
  serviceKind,
  open,
  handleClose,
  providerDetails,
  sendDataToParent,
  onBookingSuccess,
}) => {
  const cfg = SERVICE_BOOKING_CONFIG[serviceKind];
  const dispatch = useDispatch();
  const [successShowing, setSuccessShowing] = useState(false);
  const [showLoginDrawer, setShowLoginDrawer] = useState(false);
  const [bookingSuccessDetails, setBookingSuccessDetails] =
    useState<BookingSuccessDetails | null>(null);
  const [mounted, setMounted] = useState(open || successShowing);
  const insets = useSafeAreaInsets();
  const { setAppUser, appUser } = useAppUser();
  const { authorize, cancelWebAuth, isAuthenticated: auth0IsAuthenticated } = useAuth0();

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const visible = open || successShowing;
  const providerFullName =
    `${providerDetails?.firstName || ""} ${providerDetails?.lastName || ""}`.trim();
  const isCheckoutAuthenticated = isCustomerCheckoutReady(appUser, auth0IsAuthenticated);

  useEffect(() => {
    if (isCheckoutAuthenticated) {
      setShowLoginDrawer(false);
    }
  }, [isCheckoutAuthenticated]);

  useEffect(() => {
    if (visible) {
      setMounted(true);
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
      });
    }
  }, [visible, mounted, slideAnim, dragY, fadeAnim]);

  const dismissSheet = useCallback(() => {
    if (successShowing) return;
    dragY.setValue(0);
    dispatch(resetBookingSchedule());
    dispatch(closeBookingDialog());
    handleClose();
  }, [successShowing, handleClose, dragY, dispatch]);

  const handleCheckoutSuccess = useCallback((details: BookingSuccessDetails) => {
    try {
      const bookingDate = details?.bookingDate;
      if (bookingDate) {
        const isFuture = dayjs(bookingDate).isAfter(dayjs(), 'day');
        (global as any).pendingOpenBookingsTab = isFuture ? 'upcoming' : 'today';
      } else {
        (global as any).pendingOpenBookingsTab = 'today';
      }
    } catch (e) {}

    setBookingSuccessDetails(details);
    setSuccessShowing(true);
    onBookingSuccess?.();
  }, [onBookingSuccess]);

  const finishAndUnmount = useCallback(() => {
    setSuccessShowing(false);
    setBookingSuccessDetails(null);
    setMounted(false);
    dragY.setValue(0);
    slideAnim.setValue(SCREEN_HEIGHT);
    fadeAnim.setValue(0);
  }, [dragY, slideAnim, fadeAnim]);

  const handleSuccessDialogClose = useCallback(() => {
    handleClose();
    finishAndUnmount();
  }, [handleClose, finishAndUnmount]);

  /** Navigate first, never re-show the booking sheet under the success modal. */
  const handleNavigateToBookings = useCallback(() => {
    sendDataToParent?.(BOOKINGS);
    handleClose();
    finishAndUnmount();
  }, [handleClose, sendDataToParent, finishAndUnmount]);

  const handleEmailLogin = useCallback(async () => {
    try {
      await runAuth0Authorize(authorize, cancelWebAuth);
    } catch (error) {
      logAuth0Error("email login failed", error);
      Snackbar.show({
        text: "Email sign-in was cancelled or failed. Please try again.",
        duration: Snackbar.LENGTH_LONG,
        backgroundColor: "#ef4444",
        textColor: "#ffffff",
      });
    }
  }, [authorize, cancelWebAuth]);

  const handleLoginNavigation = useCallback(
    (data: string) => {
      if (data === DASHBOARD || data === AGENT_DASHBOARD) {
        dismissSheet();
        sendDataToParent?.(data);
      }
    },
    [dismissSheet, sendDataToParent]
  );

  if (!mounted) return null;

  const sheetTranslateY = Animated.add(slideAnim, dragY);

  return (
    <Modal
      visible={mounted}
      animationType="none"
      transparent
      onRequestClose={dismissSheet}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableWithoutFeedback
          onPress={successShowing ? undefined : dismissSheet}
          disabled={successShowing}
        >
          <View style={styles.overlayTap} />
        </TouchableWithoutFeedback>
      </Animated.View>

      {successShowing && bookingSuccessDetails ? (
        <BookingSuccessDialog
          visible={successShowing}
          onClose={handleSuccessDialogClose}
          bookingDetails={bookingSuccessDetails}
          message={bookingSuccessDetails.message}
          onNavigateToBookings={handleNavigateToBookings}
        />
      ) : null}

      {open && !successShowing ? (
      <Animated.View
        style={[
          styles.sheet,
          {
            width: SCREEN_WIDTH,
            maxHeight: SHEET_MAX_HEIGHT,
            paddingBottom: Math.max(insets.bottom, 8),
            transform: [{ translateY: sheetTranslateY }],
          },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.headerAccent} />
          <View style={styles.headerInner}>
            <View
              style={styles.handleRow}
            >
              <View style={styles.handle} />
            </View>

            <View style={styles.headerTitleRow}>
              <View style={styles.headerTextCol}>
                <View style={styles.serviceBadge}>
                  <Text style={styles.serviceBadgeText}>{cfg.serviceType}</Text>
                </View>
                <Text style={styles.headerTitle}>{cfg.title}</Text>
                <Text style={styles.headerSub} numberOfLines={1}>
                  {providerFullName || "On-demand booking"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={dismissSheet}
                style={styles.closeBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="Close"
                accessibilityRole="button"
              >
                <Icon name="close" size={22} color="#475569" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.flowBody}>
          <ServiceBookingFlow
            serviceKind={serviceKind}
            active={open && !successShowing}
            hideHeader
            onClose={dismissSheet}
            providerDetails={providerDetails}
            sendDataToParent={sendDataToParent}
            onCheckoutSuccess={handleCheckoutSuccess}
            onLoginRequired={() => setShowLoginDrawer(true)}
          />
        </View>
      </Animated.View>
      ) : null}

      <LoginDrawer
        visible={showLoginDrawer}
        onClose={() => setShowLoginDrawer(false)}
        setAppUser={setAppUser}
        onEmailLogin={handleEmailLogin}
        sendDataToParent={handleLoginNavigation}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2, 6, 23, 0.72)",
  },
  overlayTap: {
    flex: 1,
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#f8fafc",
    overflow: "hidden",
    height: SHEET_MAX_HEIGHT,
    borderTopLeftRadius: SHEET_RADIUS,
    borderTopRightRadius: SHEET_RADIUS,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 24,
  },
  header: {
    width: SCREEN_WIDTH,
    overflow: "hidden",
    flexShrink: 0,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  headerAccent: {
    height: 4,
    width: "100%",
    backgroundColor: "#2563eb",
  },
  headerInner: {
    width: "100%",
    paddingBottom: 12,
  },
  handleRow: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 6,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#cbd5e1",
  },
  serviceBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#eff6ff",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  serviceBadgeText: {
    color: "#1d4ed8",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    gap: 12,
  },
  headerTextCol: {
    flex: 1,
    minWidth: 0,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    flexShrink: 0,
  },
  headerTitle: {
    color: "#0f172a",
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 28,
  },
  headerSub: {
    color: "#64748b",
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
  },
  flowBody: {
    flex: 1,
    flexShrink: 1,
    minHeight: 0,
    backgroundColor: "#f8fafc",
  },
});

export default ServiceBookingSheetDialog;
