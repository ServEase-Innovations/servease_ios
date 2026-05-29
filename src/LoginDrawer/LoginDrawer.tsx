import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  Modal,
  Easing,
  TextInput,
  ActivityIndicator,
  Keyboard,
  Platform,
  ScrollView,
  type KeyboardEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import LinearGradient from "react-native-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch } from "react-redux";
import { add } from "../features/userSlice";
import providerInstance from "../services/providerInstance";
import { useTheme } from "../Settings/ThemeContext";
import { getMobileTabBarHeight } from "../Constants/mobileLayout";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface LoginDrawerProps {
  visible: boolean;
  onClose: () => void;
  onEmailLogin: () => Promise<void>;
  setAppUser: (user: unknown) => void;
  sendDataToParent?: (data: string) => void;
}

const LoginDrawer: React.FC<LoginDrawerProps> = ({
  visible,
  onClose,
  onEmailLogin,
  setAppUser,
  sendDataToParent,
}) => {
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const keyboardShift = useRef(new Animated.Value(0)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const [showMobileForm, setShowMobileForm] = useState(false);
  const showMobileFormRef = useRef(false);
  showMobileFormRef.current = showMobileForm;
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "error" | "success" } | null>(null);
  const otpRequestInFlight = useRef(false);
  const verifyRequestInFlight = useRef(false);
  const mobileInputRef = useRef<TextInput>(null);
  const otpInputRef = useRef<TextInput>(null);

  const resetForm = () => {
    setMobile("");
    setOtp("");
    setOtpSent(false);
    setResendIn(0);
    setStatusMessage(null);
  };

  const handleClose = () => {
    Keyboard.dismiss();
    keyboardShift.setValue(0);
    otpRequestInFlight.current = false;
    verifyRequestInFlight.current = false;
    setSendingOtp(false);
    setVerifyingOtp(false);
    setShowMobileForm(false);
    resetForm();
    onClose();
  };

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 18,
          stiffness: 140,
          mass: 0.6,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 220,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start();
      setShowMobileForm(false);
      resetForm();
    }
  }, [visible, slideAnim, backdropAnim]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (otpSent && resendIn > 0) {
      interval = setInterval(() => {
        setResendIn((prev) => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [otpSent, resendIn]);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const animateKeyboardShift = (toValue: number, duration = 250) => {
      Animated.timing(keyboardShift, {
        toValue,
        duration,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    };

    const onKeyboardShow = (event: KeyboardEvent) => {
      if (!showMobileFormRef.current) return;

      const tabClearance = getMobileTabBarHeight(insets.bottom);
      const lift = event.endCoordinates.height - tabClearance + 24;

      animateKeyboardShift(
        -Math.max(lift, 0),
        Platform.OS === "ios" ? event.duration || 250 : 200
      );
    };

    const onKeyboardHide = (event?: KeyboardEvent) => {
      animateKeyboardShift(0, Platform.OS === "ios" ? event?.duration || 250 : 200);
    };

    const showSub = Keyboard.addListener(showEvent, onKeyboardShow);
    const hideSub = Keyboard.addListener(hideEvent, onKeyboardHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [insets.bottom, keyboardShift]);

  useEffect(() => {
    if (!visible || !showMobileForm) {
      keyboardShift.setValue(0);
    }
  }, [visible, showMobileForm, keyboardShift]);

  useEffect(() => {
    if (!visible || !showMobileForm || !otpSent) return;
    const timer = setTimeout(() => otpInputRef.current?.focus(), 120);
    return () => clearTimeout(timer);
  }, [otpSent, visible, showMobileForm]);

  const showStatus = (text: string, type: "error" | "success") => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleSendOtp = async () => {
    const sanitizedMobile = mobile.replace(/\D/g, "");

    try {
      const response = await providerInstance.post("/api/auth/otp/send", {
        mobile: sanitizedMobile,
      });
      setOtpSent(true);
      setResendIn(30);
      const devOtp = response?.data?.data?.devOtp;
      showStatus(
        devOtp ? `OTP sent. Dev OTP: ${devOtp}` : "OTP sent successfully!",
        "success"
      );
      setOtp("");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      showStatus(err.response?.data?.message || "Failed to send OTP.", "error");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      const response = await providerInstance.post("/api/auth/otp/verify", {
        mobile: mobile.replace(/\D/g, ""),
        otp: otp.trim(),
      });

      const payload = response?.data?.data;
      const role = payload?.role;

      if (!role || !payload?.token) {
        throw new Error("Invalid response from OTP login.");
      }

      await AsyncStorage.setItem("token", payload.token);
      await AsyncStorage.setItem("userRole", role);
      dispatch(add(payload));

      let userData: Record<string, unknown> = {
        token: payload.token,
        role,
        email: null,
        name: "",
      };

      if (role === "SERVICE_PROVIDER") {
        const providerData = payload.serviceProvider;
        userData = {
          ...userData,
          name: providerData
            ? [providerData.firstName, providerData.lastName].filter(Boolean).join(" ")
            : "Service Provider",
          email: providerData?.emailId ?? null,
        };
      } else if (role === "VENDOR") {
        const vendorData = payload.vendor;
        userData = {
          ...userData,
          name: vendorData
            ? [vendorData.firstName, vendorData.lastName].filter(Boolean).join(" ")
            : "Vendor",
          email: vendorData?.emailId ?? null,
        };
      } else if (role === "CUSTOMER") {
        const customerData = payload.customer;
        userData = {
          ...userData,
          name: customerData
            ? [customerData.firstname, customerData.lastname].filter(Boolean).join(" ")
            : "Customer",
          email: customerData?.emailid ?? null,
          mobile: mobile.replace(/\D/g, ""),
          customerid: customerData?.customerid ?? customerData?.id,
        };
      }

      setAppUser(userData);
      showStatus("Login successful! Welcome back.", "success");

      setTimeout(() => {
        handleClose();
        if (sendDataToParent) {
          sendDataToParent(
            role === "SERVICE_PROVIDER" ? "PROFILE" : role === "VENDOR" ? "AGENT_DASHBOARD" : ""
          );
        }
      }, 400);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      showStatus(err.response?.data?.message || "Invalid OTP. Please try again.", "error");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleBack = () => {
    resetForm();
    setShowMobileForm(false);
  };

  if (!visible) return null;

  const drawerTitle = showMobileForm ? "Mobile Login" : "Choose Login Method";
  const tabBarClearance = getMobileTabBarHeight(insets.bottom);

  const renderPrimaryActionButton = (
    label: string,
    loadingLabel: string,
    loading: boolean,
    onPress: () => void,
    gradientColors: string[]
  ) => (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryBtn,
        pressed && !loading && styles.primaryBtnPressed,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: loading, busy: loading }}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.primaryBtnGradient}
      >
        <View style={styles.primaryBtnContent} collapsable={false}>
          {loading ? (
            <ActivityIndicator color="#ffffff" size="small" animating />
          ) : null}
          <Text style={[styles.primaryBtnText, loading && styles.primaryBtnTextLoading]}>
            {loading ? loadingLabel : label}
          </Text>
        </View>
      </LinearGradient>
    </Pressable>
  );

  const handleSendOtpPress = () => {
    if (otpRequestInFlight.current || sendingOtp) return;

    const sanitizedMobile = mobile.replace(/\D/g, "");
    if (!/^\d{10}$/.test(sanitizedMobile)) {
      showStatus("Please enter a valid 10-digit mobile number.", "error");
      return;
    }

    otpRequestInFlight.current = true;
    setSendingOtp(true);
    requestAnimationFrame(() => {
      mobileInputRef.current?.focus();
    });
    void handleSendOtp().finally(() => {
      otpRequestInFlight.current = false;
    });
  };

  const handleVerifyOtpPress = () => {
    if (verifyRequestInFlight.current || verifyingOtp) return;

    if (!otp.trim()) {
      showStatus("Please enter OTP.", "error");
      return;
    }

    verifyRequestInFlight.current = true;
    setVerifyingOtp(true);
    void handleVerifyOtp().finally(() => {
      verifyRequestInFlight.current = false;
    });
  };

  const renderOtpPrimaryButton = () => {
    if (!otpSent) {
      return renderPrimaryActionButton(
        "Get OTP",
        "Sending...",
        sendingOtp,
        handleSendOtpPress,
        ["#3b82f6", "#1e40af"]
      );
    }

    return (
      <>
        {renderPrimaryActionButton(
          "Verify & Login",
          "Verifying...",
          verifyingOtp,
          handleVerifyOtpPress,
          ["#10b981", "#047857"]
        )}

        <TouchableOpacity
          style={styles.resendBtn}
          onPress={() => {
            if (resendIn === 0 && !sendingOtp) handleSendOtpPress();
          }}
          disabled={resendIn > 0 || sendingOtp}
        >
          <Text
            style={[
              styles.resendText,
              (resendIn > 0 || sendingOtp) && styles.resendTextDisabled,
            ]}
          >
            {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend verification code"}
          </Text>
        </TouchableOpacity>
      </>
    );
  };

  const renderMobileFormFields = () => (
      <View style={styles.formBody}>
        <Text style={styles.formHint}>
          We&apos;ll send a verification code to your mobile number
        </Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Mobile Number</Text>
          <View
            style={[
              styles.inputRow,
              { borderColor: colors.border, backgroundColor: colors.surface },
            ]}
          >
            <View style={styles.inputIconSlot}>
              <Icon name="phone-outline" size={20} color={colors.textSecondary} />
            </View>
            <Text style={styles.countryCode}>+91</Text>
            <TextInput
              ref={mobileInputRef}
              style={[styles.input, { color: colors.text }]}
              placeholder="Enter 10-digit number"
              placeholderTextColor={colors.textSecondary}
              keyboardType="phone-pad"
              value={mobile}
              onChangeText={setMobile}
              editable={!otpSent}
              maxLength={10}
              textAlign="left"
              blurOnSubmit={false}
              returnKeyType="done"
            />
          </View>
        </View>

        {otpSent ? (
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Verification Code</Text>
            <View
              style={[
                styles.inputRow,
                { borderColor: colors.border, backgroundColor: colors.surface },
              ]}
            >
              <View style={styles.inputIconSlot}>
                <Icon name="shield-key-outline" size={20} color={colors.textSecondary} />
              </View>
              <TextInput
                ref={otpInputRef}
                style={[styles.input, styles.otpInput, { color: colors.text }]}
                placeholder="Enter 6-digit OTP"
                placeholderTextColor={colors.textSecondary}
                keyboardType="number-pad"
                value={otp}
                onChangeText={setOtp}
                maxLength={6}
                textAlign="left"
                blurOnSubmit={false}
                returnKeyType="done"
              />
            </View>
          </View>
        ) : null}
      </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={StyleSheet.absoluteFillObject}>
        <TouchableWithoutFeedback onPress={handleClose}>
          <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]} />
        </TouchableWithoutFeedback>

        <View style={[styles.drawerAnchor, { bottom: tabBarClearance }]}>
          <Animated.View
            style={{ transform: [{ translateY: Animated.add(slideAnim, keyboardShift) }] }}
          >
            <View style={styles.drawer}>
            <View style={styles.handleRow}>
              <View style={styles.handle} />
            </View>

            <View style={styles.header}>
              <View style={styles.headerSide}>
                {showMobileForm ? (
                  <TouchableOpacity onPress={handleBack} hitSlop={10} style={styles.headerIconBtn}>
                    <MaterialIcon name="arrow-back" size={22} color="#374151" />
                  </TouchableOpacity>
                ) : null}
              </View>
              <Text style={styles.title} numberOfLines={1}>
                {drawerTitle}
              </Text>
              <View style={styles.headerSide}>
                <TouchableOpacity onPress={handleClose} hitSlop={10} style={styles.headerIconBtn}>
                  <MaterialIcon name="close" size={22} color="#333" />
                </TouchableOpacity>
              </View>
            </View>

            {statusMessage ? (
              <View
                style={[
                  styles.statusBanner,
                  statusMessage.type === "error" ? styles.statusError : styles.statusSuccess,
                ]}
              >
                <Text style={styles.statusText}>{statusMessage.text}</Text>
              </View>
            ) : null}

            {!showMobileForm ? (
              <View style={styles.methodBody}>
                <Text style={styles.subtitle}>Secure access to your account</Text>

                <TouchableOpacity
                  style={styles.item}
                  onPress={() => setShowMobileForm(true)}
                  activeOpacity={0.85}
                >
                  <MaterialIcon name="phone-android" size={24} color="#1c4485" />
                  <View style={styles.itemTextCol}>
                    <Text style={styles.itemText}>Mobile OTP Login</Text>
                    <Text style={styles.itemSubtext}>Instant login with one-time password</Text>
                  </View>
                  <MaterialIcon name="chevron-right" size={22} color="#9ca3af" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.item, styles.itemLast]}
                  onPress={() => {
                    handleClose();
                    void onEmailLogin();
                  }}
                  activeOpacity={0.85}
                >
                  <MaterialIcon name="email" size={24} color="#1c4485" />
                  <View style={styles.itemTextCol}>
                    <Text style={styles.itemText}>Email Login</Text>
                    <Text style={styles.itemSubtext}>Continue with your email address</Text>
                  </View>
                  <MaterialIcon name="chevron-right" size={22} color="#9ca3af" />
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView
                style={styles.formScroll}
                contentContainerStyle={styles.formScrollContent}
                keyboardShouldPersistTaps="always"
                keyboardDismissMode="none"
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                {renderMobileFormFields()}
                <View style={styles.drawerFooter}>{renderOtpPrimaryButton()}</View>
              </ScrollView>
            )}
            </View>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  drawerAnchor: {
    position: "absolute",
    left: 0,
    right: 0,
    width: "100%",
  },
  drawer: {
    width: "100%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    overflow: "visible",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 12,
  },
  formScroll: {
    width: "100%",
    maxHeight: SCREEN_HEIGHT * 0.32,
  },
  formScrollContent: {
    flexGrow: 0,
  },
  drawerFooter: {
    width: "100%",
    paddingTop: 16,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    marginTop: 4,
  },
  handleRow: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#d1d5db",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerSide: {
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerIconBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    textAlign: "center",
    paddingHorizontal: 4,
  },
  methodBody: {
    width: "100%",
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 16,
    textAlign: "center",
    width: "100%",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: "#f9fafb",
  },
  itemLast: {
    marginBottom: 0,
  },
  itemTextCol: {
    flex: 1,
    minWidth: 0,
    marginLeft: 14,
    marginRight: 8,
    justifyContent: "center",
  },
  itemText: {
    fontSize: 16,
    color: "#374151",
    fontWeight: "600",
  },
  itemSubtext: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
  statusBanner: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  statusError: {
    backgroundColor: "#fef2f2",
  },
  statusSuccess: {
    backgroundColor: "#ecfdf5",
  },
  statusText: {
    fontSize: 13,
    color: "#374151",
    textAlign: "center",
  },
  formBody: {
    width: "100%",
    paddingTop: 4,
    paddingBottom: 4,
  },
  formHint: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    width: "100%",
    paddingHorizontal: 4,
    marginBottom: 16,
    lineHeight: 20,
  },
  fieldGroup: {
    width: "100%",
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 10,
    width: "100%",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 52,
    width: "100%",
  },
  inputIconSlot: {
    width: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  countryCode: {
    fontWeight: "600",
    color: "#64748b",
    fontSize: 16,
    marginRight: 8,
    lineHeight: 20,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
    margin: 0,
    height: 52,
    ...Platform.select({
      android: { includeFontPadding: false, textAlignVertical: "center" },
      ios: { paddingTop: 0, paddingBottom: 0 },
      default: {},
    }),
  },
  otpInput: {
    letterSpacing: 3,
  },
  primaryBtn: {
    borderRadius: 12,
    overflow: "hidden",
    width: "100%",
    minHeight: 52,
    alignSelf: "stretch",
  },
  primaryBtnPressed: {
    opacity: 0.92,
  },
  primaryBtnGradient: {
    width: "100%",
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnContent: {
    width: "100%",
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 16,
  },
  primaryBtnText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
    textAlign: "center",
    ...Platform.select({
      android: { includeFontPadding: false },
      default: {},
    }),
  },
  primaryBtnTextLoading: {
    opacity: 1,
  },
  resendBtn: {
    marginTop: 16,
    alignItems: "center",
    paddingVertical: 10,
    width: "100%",
  },
  resendText: {
    color: "#1c4485",
    fontSize: 14,
    fontWeight: "600",
  },
  resendTextDisabled: {
    color: "#9ca3af",
  },
});

export default LoginDrawer;
