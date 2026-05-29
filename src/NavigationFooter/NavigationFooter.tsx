// NavigationFooter.tsx - Fully Responsive with iOS/Android Support
import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  Pressable,
  Animated,
  TextInput,
  ActivityIndicator,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import FeatherIcon from "react-native-vector-icons/Feather";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import NotificationsDialog from "../Notifications/NotificationsPage";
import { useAuth0 } from "react-native-auth0";
import { useDispatch } from "react-redux";
import { add, remove } from "../features/userSlice";
import Snackbar from "react-native-snackbar";
import { PROFILE, BOOKINGS, DASHBOARD, HOME, AGENT_DASHBOARD, WALLET } from "../Constants/pagesConstants";
import ProfileMenuSheet from "../ProfileMenuSheet/ProfileMenuSheet";
import { useTranslation } from 'react-i18next';
import Settings from "../Settings/Settings";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from "../Settings/ThemeContext";
import { BOOKING_HEADER_GRADIENT } from "../theme/brandColors";
import { useAppUser } from "../context/AppUserContext";
import providerInstance from "../services/providerInstance";

type MobileTab = {
  key: string;
  label: string;
  onPress: () => void;
  iconName?: string;
  isAccount?: boolean;
  variant?: "default" | "destructive";
  disabled?: boolean;
};

import {
  MOBILE_TAB_BAR_CONTENT_HEIGHT,
  MOBILE_TAB_BAR_EDGE_PAD,
  getMobileTabBarHeight,
} from "../Constants/mobileLayout";

export {
  MOBILE_TAB_BAR_CONTENT_HEIGHT,
  MOBILE_TAB_BAR_EDGE_PAD,
  getMobileTabBarHeight,
};

interface NavigationFooterProps {
  onHomeClick: () => void;
  onBookingsClick: () => void;
  onDashboardClick: () => void;
  onAboutClick: () => void;
  onContactClick: () => void;
  onOpenSignup: () => void;
  auth0User: any;
  appUser: any;
  bookingType?: string;
  onProfileClick?: () => void;
  onNavigateToPage: (page: string) => void;
  activePage: string;
  onSignOutComplete?: () => Promise<void>;
  bookingsRef?: React.MutableRefObject<any>;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const isMobile = SCREEN_WIDTH < 768;

// Responsive sizing functions
const scale = (size: number) => {
  const baseWidth = 375;
  return (SCREEN_WIDTH / baseWidth) * size;
};

const verticalScale = (size: number) => {
  const baseHeight = 667;
  return (SCREEN_HEIGHT / baseHeight) * size;
};

const moderateScale = (size: number, factor = 0.5) => {
  return size + (scale(size) - size) * factor;
};

// Professional Login Method Card Component
const ProfessionalMethodCard: React.FC<{
  icon: string;
  iconSet?: "material" | "feather" | "community";
  title: string;
  description: string;
  onPress: () => void;
  colors: any;
  gradientColors: string[];
  isHighlighted?: boolean;
}> = ({ icon, iconSet = "community", title, description, onPress, colors, gradientColors, isHighlighted = false }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isHighlighted) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: false,
          }),
        ])
      ).start();
    }
  }, [isHighlighted]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const glowIntensity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.15],
  });

  const renderIcon = () => {
    const iconSize = moderateScale(26);
    const iconColor = "#ffffff";
    
    if (iconSet === "material") {
      return <MaterialIcon name={icon} size={iconSize} color={iconColor} />;
    } else if (iconSet === "feather") {
      return <FeatherIcon name={icon} size={iconSize} color={iconColor} />;
    } else {
      return <Icon name={icon} size={iconSize} color={iconColor} />;
    }
  };

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale: scaleAnim }],
          shadowColor: gradientColors[0],
          shadowOffset: { width: 0, height: verticalScale(4) },
          shadowOpacity: glowIntensity,
          shadowRadius: moderateScale(12),
          elevation: glowAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [2, 8],
          }),
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.proMethodCard,
          { backgroundColor: colors.card, padding: moderateScale(16) }
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.95}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.proMethodIconContainer,
            { width: moderateScale(52), height: moderateScale(52), borderRadius: moderateScale(26) }
          ]}
        >
          {renderIcon()}
        </LinearGradient>
        <View style={styles.proMethodContent}>
          <Text style={[styles.proMethodTitle, { color: colors.text, fontSize: moderateScale(16) }]}>
            {title}
          </Text>
          <Text style={[styles.proMethodDescription, { color: colors.textSecondary, fontSize: moderateScale(13) }]}>
            {description}
          </Text>
        </View>
        <View style={styles.proMethodArrow}>
          <MaterialIcon name="arrow-forward-ios" size={moderateScale(16)} color={colors.textSecondary} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Custom Snackbar Component
const CustomSnackbar: React.FC<{
  visible: boolean;
  message: string;
  severity: "success" | "error" | "info";
  onDismiss: () => void;
  autoHideDuration?: number;
}> = ({ visible, message, severity, onDismiss, autoHideDuration = 4000 }) => {
  const translateY = useRef(new Animated.Value(100)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          speed: 12,
          bounciness: 4,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        handleDismiss();
      }, autoHideDuration);

      return () => clearTimeout(timer);
    }
  }, [visible, autoHideDuration]);

  const handleDismiss = () => {
    Animated.timing(translateY, {
      toValue: 100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => onDismiss());
  };

  if (!visible) return null;

  const gradientColors =
    severity === "success"
      ? ["#10b981", "#059669"]
      : severity === "error"
      ? ["#ef4444", "#dc2626"]
      : ["#3b82f6", "#1e40af"];

  return (
    <Animated.View
      style={[
        styles.snackbarContainer,
        {
          transform: [{ translateY }],
          opacity: fadeAnim,
          left: moderateScale(20),
          right: moderateScale(20),
          bottom: verticalScale(30),
        },
      ]}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.snackbarGradient, { paddingHorizontal: moderateScale(18), paddingVertical: verticalScale(14) }]}
      >
        <View style={styles.snackbarContent}>
          <Text style={[styles.snackbarIcon, { fontSize: moderateScale(18) }]}>
            {severity === "success" ? "✓" : severity === "error" ? "⚠" : "ℹ"}
          </Text>
          <Text style={[styles.snackbarMessage, { fontSize: moderateScale(14) }]}>{message}</Text>
        </View>
        <TouchableOpacity onPress={handleDismiss} style={styles.snackbarCloseButton}>
          <FeatherIcon name="x" size={moderateScale(18)} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );
};

// Main Auth Modal Component
const AuthModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  onEmailLogin: () => Promise<void>;
  colors: any;
  isDarkMode: boolean;
  setAppUser: any;
  dispatch: any;
  sendDataToParent?: (data: string) => void;
}> = ({ visible, onClose, onEmailLogin, colors, isDarkMode, setAppUser, dispatch, sendDataToParent }) => {
  const [showMobileForm, setShowMobileForm] = useState(false);
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [snackbar, setSnackbar] = useState<{ visible: boolean; message: string; severity: "success" | "error" | "info" }>({
    visible: false,
    message: "",
    severity: "info",
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(verticalScale(30))).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      setShowMobileForm(false);
      resetForm();
    }
  }, [visible]);

  const resetForm = () => {
    setMobile("");
    setOtp("");
    setOtpSent(false);
  };

  const showSnackbar = (message: string, severity: "success" | "error" | "info") => {
    setSnackbar({ visible: true, message, severity });
    setTimeout(() => {
      setSnackbar((prev) => ({ ...prev, visible: false }));
    }, 4000);
  };

  const handleSendOtp = async () => {
    const sanitizedMobile = mobile.replace(/\D/g, "");
    if (!/^\d{10}$/.test(sanitizedMobile)) {
      showSnackbar("Please enter a valid 10-digit mobile number.", "error");
      return;
    }

    try {
      setSendingOtp(true);
      const response = await providerInstance.post("/api/auth/otp/send", {
        mobile: sanitizedMobile,
      });
      setOtpSent(true);
      setResendIn(30);
      showSnackbar(
        response?.data?.data?.devOtp ? `OTP sent. Dev OTP: ${response.data.data.devOtp}` : "OTP sent successfully!",
        "success"
      );
      setOtp("");
    } catch (error: any) {
      showSnackbar(error.response?.data?.message || "Failed to send OTP.", "error");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      showSnackbar("Please enter OTP.", "error");
      return;
    }

    try {
      setVerifyingOtp(true);
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

      let userData: any = {
        token: payload.token,
        role: role,
        email: null,
        name: "",
      };

      if (role === "SERVICE_PROVIDER") {
        const providerData = payload.serviceProvider;
        userData = {
          ...userData,
          name: providerData ? [providerData.firstName, providerData.lastName].filter(Boolean).join(" ") : "Service Provider",
          email: providerData?.emailId ?? null,
        };
      } else if (role === "VENDOR") {
        const vendorData = payload.vendor;
        userData = {
          ...userData,
          name: vendorData ? [vendorData.firstName, vendorData.lastName].filter(Boolean).join(" ") : "Vendor",
          email: vendorData?.emailId ?? null,
        };
      } else if (role === "CUSTOMER") {
        const customerData = payload.customer;
        userData = {
          ...userData,
          name: customerData ? [customerData.firstname, customerData.lastname].filter(Boolean).join(" ") : "Customer",
          email: customerData?.emailid ?? null,
          mobile: mobile.replace(/\D/g, ""),
        };
      }

      setAppUser(userData);
      showSnackbar("Login successful! Welcome back.", "success");

      setTimeout(() => {
        onClose();
        if (sendDataToParent) {
          sendDataToParent(
            role === "SERVICE_PROVIDER" ? "PROFILE" : role === "VENDOR" ? "AGENT_DASHBOARD" : ""
          );
        }
      }, 500);
    } catch (error: any) {
      showSnackbar(error.response?.data?.message || "Invalid OTP. Please try again.", "error");
    } finally {
      setVerifyingOtp(false);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpSent && resendIn > 0) {
      interval = setInterval(() => {
        setResendIn((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [otpSent, resendIn]);

  const handleBack = () => {
    resetForm();
    setShowMobileForm(false);
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.6)" translucent />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalKeyboardView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : verticalScale(20)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <Pressable style={styles.modalOverlay} onPress={onClose}>
            <Animated.View
              style={[
                styles.modalContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                  marginTop: insets.top > 0 ? verticalScale(20) : verticalScale(40),
                  marginBottom: insets.bottom > 0 ? verticalScale(20) : verticalScale(40),
                },
              ]}
            >
              <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
                {/* Gradient Header */}
                <LinearGradient
                  colors={[...BOOKING_HEADER_GRADIENT]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.modalHeader, { paddingHorizontal: moderateScale(20), paddingVertical: verticalScale(20) }]}
                >
                  <View style={[styles.modalHeaderLeft, { width: moderateScale(40) }]}>
                    {showMobileForm && (
                      <TouchableOpacity onPress={handleBack} style={[styles.backButton, { width: moderateScale(36), height: moderateScale(36), borderRadius: moderateScale(18) }]}>
                        <FeatherIcon name="arrow-left" size={moderateScale(24)} color="#fff" />
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text style={[styles.modalHeaderTitle, { fontSize: moderateScale(20) }]}>
                    {showMobileForm ? "Mobile Login" : "Welcome Back"}
                  </Text>
                  <TouchableOpacity onPress={onClose} style={[styles.modalHeaderRight, { width: moderateScale(40) }]}>
                    <FeatherIcon name="x" size={moderateScale(24)} color="#fff" />
                  </TouchableOpacity>
                </LinearGradient>

                {/* Body */}
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                  contentContainerStyle={styles.modalScrollContent}
                  keyboardShouldPersistTaps="handled"
                >
                  {!showMobileForm ? (
                    <View style={[styles.optionsContainer, { padding: moderateScale(24) }]}>
                      <Text style={[styles.optionsTitle, { color: colors.text, fontSize: moderateScale(24), marginBottom: verticalScale(8) }]}>
                        Choose Login Method
                      </Text>
                      <Text style={[styles.optionsSubtitle, { color: colors.textSecondary, fontSize: moderateScale(14), marginBottom: verticalScale(32) }]}>
                        Secure access to your account
                      </Text>

                      <ProfessionalMethodCard
                        icon="cellphone-arrow-down"
                        iconSet="community"
                        title="Mobile OTP Login"
                        description="Instant login with one-time password"
                        onPress={() => setShowMobileForm(true)}
                        colors={colors}
                        gradientColors={["#3b82f6", "#1e40af"]}
                        isHighlighted={true}
                      />

                      <ProfessionalMethodCard
                        icon="email-outline"
                        iconSet="community"
                        title="Email Login"
                        description="Continue with your email address"
                        onPress={() => {
                          onClose();
                          onEmailLogin();
                        }}
                        colors={colors}
                        gradientColors={["#3b82f6", "#1e40af"]}
                      />

                    </View>
                  ) : (
                    <View style={[styles.mobileFormContainer, { padding: moderateScale(24) }]}>
                      <View style={[styles.mobileIconWrapper, { marginBottom: verticalScale(24) }]}>
                        <LinearGradient
                          colors={["#3b82f6", "#1e40af"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={[styles.mobileIconCircle, { width: moderateScale(80), height: moderateScale(80), borderRadius: moderateScale(40) }]}
                        >
                          <Icon name="cellphone-check" size={moderateScale(42)} color="#ffffff" />
                        </LinearGradient>
                      </View>

                      <Text style={[styles.mobileFormTitle, { color: colors.text, fontSize: moderateScale(22), marginBottom: verticalScale(8) }]}>
                        Mobile Number Verification
                      </Text>
                      <Text style={[styles.mobileFormSubtitle, { color: colors.textSecondary, fontSize: moderateScale(14), marginBottom: verticalScale(32), lineHeight: verticalScale(20) }]}>
                        We'll send a verification code to your mobile number
                      </Text>

                      <View style={[styles.inputGroup, { marginBottom: verticalScale(20) }]}>
                        <Text style={[styles.inputLabel, { color: colors.textSecondary, fontSize: moderateScale(14), marginBottom: verticalScale(8) }]}>
                          Mobile Number
                        </Text>
                        <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.surface, height: verticalScale(54), borderRadius: moderateScale(16), paddingHorizontal: moderateScale(16) }]}>
                          <Icon name="phone-outline" size={moderateScale(20)} color={colors.textSecondary} style={{ marginRight: moderateScale(12) }} />
                          <Text style={[styles.countryCode, { fontSize: moderateScale(16), marginRight: moderateScale(12) }]}>+91</Text>
                          <TextInput
                            style={[styles.input, { color: colors.text, fontSize: moderateScale(16) }]}
                            placeholder="Enter 10-digit number"
                            placeholderTextColor={colors.textSecondary}
                            keyboardType="phone-pad"
                            value={mobile}
                            onChangeText={setMobile}
                            editable={!otpSent}
                            maxLength={10}
                          />
                        </View>
                      </View>

                      {otpSent && (
                        <Animated.View style={[styles.inputGroup, { marginBottom: verticalScale(20), opacity: fadeAnim }]}>
                          <Text style={[styles.inputLabel, { color: colors.textSecondary, fontSize: moderateScale(14), marginBottom: verticalScale(8) }]}>
                            Verification Code
                          </Text>
                          <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.surface, height: verticalScale(54), borderRadius: moderateScale(16), paddingHorizontal: moderateScale(16) }]}>
                            <Icon name="keyboard-settings-outline" size={moderateScale(20)} color={colors.textSecondary} style={{ marginRight: moderateScale(12) }} />
                            <TextInput
                              style={[styles.input, styles.otpInput, { color: colors.text, fontSize: moderateScale(16), letterSpacing: moderateScale(4) }]}
                              placeholder="Enter 6-digit OTP"
                              placeholderTextColor={colors.textSecondary}
                              keyboardType="number-pad"
                              value={otp}
                              onChangeText={setOtp}
                              maxLength={6}
                              autoFocus={true}
                            />
                          </View>
                        </Animated.View>
                      )}

                      {!otpSent ? (
                        <TouchableOpacity
                          style={[styles.submitButton, sendingOtp && styles.buttonDisabled, { marginTop: verticalScale(8), borderRadius: moderateScale(16) }]}
                          onPress={handleSendOtp}
                          disabled={sendingOtp}
                        >
                          <LinearGradient
                            colors={["#3b82f6", "#1e40af"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[styles.submitGradient, { paddingVertical: verticalScale(16) }]}
                          >
                            {sendingOtp ? (
                              <ActivityIndicator color="#fff" size="small" />
                            ) : (
                              <>
                                <Icon name="shield-check" size={moderateScale(18)} color="#ffffff" style={{ marginRight: moderateScale(8) }} />
                                <Text style={[styles.submitButtonText, { fontSize: moderateScale(16) }]}>Send OTP</Text>
                              </>
                            )}
                          </LinearGradient>
                        </TouchableOpacity>
                      ) : (
                        <>
                          <TouchableOpacity
                            style={[styles.submitButton, verifyingOtp && styles.buttonDisabled, { marginTop: verticalScale(8), borderRadius: moderateScale(16) }]}
                            onPress={handleVerifyOtp}
                            disabled={verifyingOtp}
                          >
                            <LinearGradient
                              colors={["#10b981", "#047857"]}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                              style={[styles.submitGradient, { paddingVertical: verticalScale(16) }]}
                            >
                              {verifyingOtp ? (
                                <ActivityIndicator color="#fff" size="small" />
                              ) : (
                                <>
                                  <Icon name="login" size={moderateScale(18)} color="#ffffff" style={{ marginRight: moderateScale(8) }} />
                                  <Text style={[styles.submitButtonText, { fontSize: moderateScale(16) }]}>Verify & Login</Text>
                                </>
                              )}
                            </LinearGradient>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.resendButton, { paddingVertical: verticalScale(16) }]}
                            onPress={() => {
                              if (resendIn === 0 && !sendingOtp) {
                                handleSendOtp();
                              }
                            }}
                            disabled={resendIn > 0 || sendingOtp}
                          >
                            <Icon name="refresh-circle" size={moderateScale(16)} color={colors.primary} style={{ marginRight: moderateScale(6) }} />
                            <Text
                              style={[
                                styles.resendText,
                                { color: colors.primary, fontSize: moderateScale(14) },
                                (resendIn > 0 || sendingOtp) && styles.resendDisabledText,
                              ]}
                            >
                              {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend verification code"}
                            </Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  )}
                </ScrollView>
              </Pressable>
            </Animated.View>
          </Pressable>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      <CustomSnackbar
        visible={snackbar.visible}
        message={snackbar.message}
        severity={snackbar.severity}
        onDismiss={() => setSnackbar((prev) => ({ ...prev, visible: false }))}
      />
    </Modal>
  );
};

const NavigationFooter: React.FC<NavigationFooterProps> = ({
  onHomeClick,
  onBookingsClick,
  onDashboardClick,
  onAboutClick,
  onContactClick,
  onOpenSignup,
  auth0User,
  appUser,
  bookingType = "",
  onProfileClick,
  onNavigateToPage,
  activePage,
  onSignOutComplete,
  bookingsRef,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isProfileMenuVisible, setIsProfileMenuVisible] = useState(false);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [lastTap, setLastTap] = useState<number>(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const safeBottom = Number.isFinite(insets.bottom) ? insets.bottom : 0;
  const { colors, isDarkMode } = useTheme();
  const { setAppUser } = useAppUser();

  const { authorize, clearSession, getCredentials } = useAuth0();
  const dispatch = useDispatch();

  const isAuthenticated = !!(auth0User || (appUser && appUser.token));

  const getUserRole = () => {
    if (appUser && appUser.role) {
      return appUser.role;
    }
    return null;
  };

  const userRole = getUserRole();
  const isCustomer = userRole === "CUSTOMER";
  const isServiceProvider = userRole === "SERVICE_PROVIDER";
  const isVendor = userRole === "VENDOR";

  const handleDoubleTapRefresh = useCallback(() => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (lastTap && now - lastTap < DOUBLE_TAP_DELAY) {
      Snackbar.show({
        text: "Refreshing bookings...",
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: "#3b82f6",
        textColor: "#ffffff",
      });

      if (bookingsRef?.current && bookingsRef.current.forceRefresh) {
        bookingsRef.current.forceRefresh();
      } else if (bookingsRef?.current && bookingsRef.current.refreshBookings) {
        bookingsRef.current.refreshBookings();
      } else {
        if (isAuthenticated && isCustomer) {
          onNavigateToPage(BOOKINGS);
        } else if (!isAuthenticated) {
          setShowAuthModal(true);
        } else {
          onBookingsClick();
        }
      }

      setLastTap(0);
    } else {
      setLastTap(now);
      if (isAuthenticated && isCustomer) {
        onNavigateToPage(BOOKINGS);
      } else if (!isAuthenticated) {
        setShowAuthModal(true);
      } else {
        onBookingsClick();
      }
      setIsProfileMenuVisible(false);
    }
  }, [lastTap, isAuthenticated, isCustomer, onNavigateToPage, onBookingsClick]);

  const handleEmailLogin = async () => {
    setShowAuthModal(false);
    try {
      await authorize({
        scope: "openid profile email",
        redirectUrl: "com.serveaso://dev-plavkbiy7v55pbg4.us.auth0.com/android/com.serveaso/callback",
      });

      const credentials = await getCredentials();
      Snackbar.show({
        text: t("navigation.loggedInSuccess"),
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: "#10b981",
        textColor: "#ffffff",
      });
    } catch (e) {
      Snackbar.show({
        text: t("navigation.loginFailed"),
        duration: Snackbar.LENGTH_LONG,
        backgroundColor: "#ef4444",
        textColor: "#ffffff",
      });
    }
  };

  const handleProfileButtonClick = () => {
    if (isAuthenticated) {
      setIsProfileMenuVisible(true);
    } else {
      setShowAuthModal(true);
    }
  };

  const handleHomeButtonClick = () => {
    onHomeClick();
    setIsProfileMenuVisible(false);
  };

  const handleBookingsButtonClick = () => {
    if (isAuthenticated && isCustomer) {
      onNavigateToPage(BOOKINGS);
    } else if (!isAuthenticated) {
      setShowAuthModal(true);
    } else {
      onBookingsClick();
    }
    setIsProfileMenuVisible(false);
  };

  const handleDashboardButtonClick = () => {
    if (isAuthenticated && isServiceProvider) {
      onNavigateToPage(DASHBOARD);
    } else if (!isAuthenticated) {
      setShowAuthModal(true);
    } else {
      onDashboardClick();
    }
    setIsProfileMenuVisible(false);
  };

  const handleAgentDashboardButtonClick = () => {
    if (isAuthenticated && isVendor) {
      onNavigateToPage(AGENT_DASHBOARD);
    } else if (!isAuthenticated) {
      setShowAuthModal(true);
    }
    setIsProfileMenuVisible(false);
  };

  const handleWalletClick = () => {
    if (isAuthenticated && isCustomer) {
      onNavigateToPage(WALLET);
    } else if (!isAuthenticated) {
      setShowAuthModal(true);
    }
    setIsProfileMenuVisible(false);
  };

  const handleSignOut = async () => {
    if (isSigningOut) return;

    setIsSigningOut(true);
    setIsProfileMenuVisible(false);

    try {
      Snackbar.show({
        text: t("navigation.signingOutMsg"),
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: "#3b82f6",
        textColor: "#ffffff",
      });

      await AsyncStorage.multiRemove(["token", "userRole", "@app_user_data"]);

      try {
        await clearSession({
          returnToUrl: "com.serveaso://logout",
        });
      } catch (e) {
        console.log("No Auth0 session to clear:", e);
      }

      dispatch(remove());

      if (onSignOutComplete) {
        await onSignOutComplete();
      }
    } catch (e) {
      Snackbar.show({
        text: t("navigation.signOut"),
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: "#ef4444",
        textColor: "#ffffff",
      });
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleProfileMenuNavigation = (page: string) => {
    setIsProfileMenuVisible(false);
    onNavigateToPage(page);
  };

  const handleSettingsOpen = () => {
    setIsSettingsVisible(true);
  };

  const renderCompactAccountAvatar = () => {
    const avatarSize = moderateScale(24);

    if (!auth0User && appUser?.name) {
      return (
        <View
          style={[
            styles.compactAvatarInner,
            { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 },
          ]}
        >
          <Text style={[styles.compactAvatarInitial, { fontSize: moderateScale(11) }]}>
            {appUser.name.charAt(0).toUpperCase()}
          </Text>
        </View>
      );
    }

    if (!auth0User) {
      return <FeatherIcon name="user" size={moderateScale(20)} color={isDarkMode ? "#94a3b8" : "#64748b"} />;
    }

    if (auth0User.picture) {
      return (
        <Image
          source={{ uri: auth0User.picture }}
          style={{ width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }}
        />
      );
    }

    return (
      <View
        style={[
          styles.compactAvatarInner,
          { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 },
        ]}
      >
        <Text style={[styles.compactAvatarInitial, { fontSize: moderateScale(11) }]}>
          {auth0User.name ? auth0User.name.charAt(0).toUpperCase() : "U"}
        </Text>
      </View>
    );
  };

  const renderMobileTabIcon = (tab: MobileTab, isActive: boolean) => {
    const iconMuted = isDarkMode ? "#94a3b8" : "#64748b";
    const iconActiveColor = colors.primary;

    if (tab.isAccount) {
      return (
        <View
          style={[
            styles.compactAvatarRing,
            isDarkMode && styles.compactAvatarRingDark,
            isActive && styles.compactAvatarRingActive,
            isActive && isDarkMode && styles.compactAvatarRingActiveDark,
          ]}
        >
          {renderCompactAccountAvatar()}
        </View>
      );
    }

    const iconColor =
      tab.variant === "destructive"
        ? isActive
          ? "#b91c1c"
          : "#ef4444"
        : isActive
        ? iconActiveColor
        : iconMuted;

    return (
      <View style={styles.navIconSlot}>
        <MaterialIcon name={tab.iconName ?? "circle"} size={moderateScale(24)} color={iconColor} />
      </View>
    );
  };

  const renderUserAvatar = (isMobileView: boolean = false) => {
    if (!auth0User && appUser?.name) {
      return (
        <View style={isMobileView ? styles.userAvatarContainerMobile : styles.userAvatarContainer}>
          <View style={isMobileView ? styles.userAvatarPlaceholderMobile : styles.userAvatarPlaceholder}>
            <Text style={isMobileView ? styles.userAvatarPlaceholderTextMobile : styles.userAvatarPlaceholderText}>
              {appUser.name ? appUser.name.charAt(0).toUpperCase() : "U"}
            </Text>
          </View>
          {!isMobileView && (
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { fontSize: moderateScale(13) }]} numberOfLines={1}>
                {appUser.name?.split(" ")[0] || "User"}
              </Text>
              <FeatherIcon name="chevron-down" size={moderateScale(14)} color="#fff" />
            </View>
          )}
        </View>
      );
    }

    if (!auth0User) {
      return (
        <View style={isMobileView ? styles.userIconContainerMobile : styles.userIconContainer}>
          <FeatherIcon name="user" size={isMobileView ? moderateScale(22) : moderateScale(20)} color="#fff" />
        </View>
      );
    }

    return (
      <View style={isMobileView ? styles.userAvatarContainerMobile : styles.userAvatarContainer}>
        {auth0User.picture ? (
          <Image
            source={{ uri: auth0User.picture }}
            style={isMobileView ? styles.userAvatarMobile : styles.userAvatar}
          />
        ) : (
          <View style={isMobileView ? styles.userAvatarPlaceholderMobile : styles.userAvatarPlaceholder}>
            <Text style={isMobileView ? styles.userAvatarPlaceholderTextMobile : styles.userAvatarPlaceholderText}>
              {auth0User.name ? auth0User.name.charAt(0).toUpperCase() : "U"}
            </Text>
          </View>
        )}
        {!isMobileView && (
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { fontSize: moderateScale(13) }]} numberOfLines={1}>
              {t("navigation.account")}
            </Text>
            <FeatherIcon name="chevron-down" size={moderateScale(14)} color="#fff" />
          </View>
        )}
      </View>
    );
  };

  if (isMobile) {
    const tabs: MobileTab[] = [];

    tabs.push({
      key: HOME,
      label: t("navigation.home"),
      iconName: "home",
      onPress: handleHomeButtonClick,
    });

    if (isAuthenticated) {
      tabs.push({
        key: "ACCOUNT",
        label: t("navigation.account"),
        isAccount: true,
        onPress: handleProfileButtonClick,
      });

      if (isCustomer) {
        tabs.push({
          key: BOOKINGS,
          label: t("navigation.bookings"),
          iconName: "event-note",
          onPress: handleDoubleTapRefresh,
        });
        tabs.push({
          key: WALLET,
          label: t("navigation.wallet"),
          iconName: "account-balance-wallet",
          onPress: handleWalletClick,
        });
      }

      if (isServiceProvider) {
        tabs.push({
          key: DASHBOARD,
          label: t("navigation.dashboard"),
          iconName: "dashboard",
          onPress: handleDashboardButtonClick,
        });
      }

      if (isVendor) {
        tabs.push({
          key: AGENT_DASHBOARD,
          label: "Agent",
          iconName: "business-center",
          onPress: handleAgentDashboardButtonClick,
        });
      }

      tabs.push({
        key: "SIGN_OUT",
        label: t("navigation.signOut"),
        iconName: "logout",
        variant: "destructive",
        disabled: isSigningOut,
        onPress: handleSignOut,
      });
    } else {
      tabs.push({
        key: "ACCOUNT",
        label: t("navigation.signIn"),
        isAccount: true,
        onPress: handleProfileButtonClick,
      });
      tabs.push({
        key: "SIGN_UP",
        label: t("navigation.signUp"),
        iconName: "person-add-alt-1",
        onPress: onOpenSignup,
      });
      tabs.push({
        key: "SETTINGS",
        label: t("navigation.settings") || "Settings",
        iconName: "settings",
        onPress: handleSettingsOpen,
      });
    }

    const navSurface = isDarkMode ? colors.card : "#ffffff";
    const navBorder = isDarkMode ? colors.border : "#e2e8f0";
    const textMuted = isDarkMode ? "#94a3b8" : "#64748b";
    const textActiveColor = colors.primary;
    const bottomPad = safeBottom > 0 ? Math.max(verticalScale(4), safeBottom - verticalScale(18)) : MOBILE_TAB_BAR_EDGE_PAD;

    return (
      <>
        <View
          style={[
            styles.mobileNavShell,
            {
              backgroundColor: navSurface,
              borderTopColor: navBorder,
              paddingBottom: bottomPad,
            },
          ]}
        >
          <View style={styles.mobileNavContainer}>
            {tabs.map((tab) => {
              const isActive =
                tab.variant !== "destructive" &&
                (activePage === tab.key || (tab.key === "ACCOUNT" && activePage === PROFILE));
              const isDisabled = !!tab.disabled;

              return (
                <TouchableOpacity
                  key={tab.key}
                  onPress={tab.onPress}
                  disabled={isDisabled}
                  style={[
                    styles.mobileNavItem,
                    isActive && { backgroundColor: `${colors.primary}1A` },
                    isDisabled && styles.disabledTab,
                  ]}
                  activeOpacity={0.72}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive, disabled: isDisabled }}
                >
                  {renderMobileTabIcon(tab, isActive)}
                  <Text
                    style={[
                      styles.mobileNavText,
                      { color: textMuted, fontSize: moderateScale(10) },
                      isActive && { color: textActiveColor, fontWeight: "600" },
                      tab.variant === "destructive" && styles.mobileNavTextDestructive,
                      isDisabled && styles.disabledTabText,
                    ]}
                    numberOfLines={1}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <NotificationsDialog visible={showNotifications} onClose={() => setShowNotifications(false)} />
        <ProfileMenuSheet
          visible={isProfileMenuVisible}
          onClose={() => setIsProfileMenuVisible(false)}
          onProfile={() => handleProfileMenuNavigation(PROFILE)}
          onBookings={() => handleBookingsButtonClick()}
          onDashboard={() => handleDashboardButtonClick()}
          onWallet={handleWalletClick}
          onContact={onContactClick}
          dockAboveTabBar
        />
        <Settings visible={isSettingsVisible} onClose={() => setIsSettingsVisible(false)} />
        <AuthModal
          visible={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onEmailLogin={handleEmailLogin}
          colors={colors}
          isDarkMode={isDarkMode}
          setAppUser={setAppUser}
          dispatch={dispatch}
          sendDataToParent={(data) => {
            if (data === "PROFILE") {
              onNavigateToPage(PROFILE);
            } else if (data === "AGENT_DASHBOARD") {
              onNavigateToPage(AGENT_DASHBOARD);
            }
          }}
        />
      </>
    );
  }

  return (
    <>
      <LinearGradient
        colors={[...colors.chromeGradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.desktopNavContainer}
      >
        <View style={[styles.desktopNavInner, { paddingHorizontal: moderateScale(20), paddingVertical: verticalScale(12) }]}>
          <View style={[styles.desktopNavLinks, { gap: moderateScale(28) }]}>
            <TouchableOpacity onPress={handleHomeButtonClick} style={[styles.desktopNavItem, { paddingVertical: verticalScale(8), paddingHorizontal: moderateScale(8), gap: moderateScale(6) }]}>
              <MaterialIcon name="home" size={moderateScale(20)} color="#fff" style={styles.navIcon} />
              <Text style={[styles.desktopNavText, { fontSize: moderateScale(15) }]}>{t("navigation.home")}</Text>
            </TouchableOpacity>

            {isCustomer && (
              <>
                <TouchableOpacity onPress={handleDoubleTapRefresh} style={[styles.desktopNavItem, { paddingVertical: verticalScale(8), paddingHorizontal: moderateScale(8), gap: moderateScale(6) }]}>
                  <MaterialIcon name="event-note" size={moderateScale(20)} color="#fff" style={styles.navIcon} />
                  <Text style={[styles.desktopNavText, { fontSize: moderateScale(15) }]}>{t("navigation.myBookings")}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleWalletClick} style={[styles.desktopNavItem, { paddingVertical: verticalScale(8), paddingHorizontal: moderateScale(8), gap: moderateScale(6) }]}>
                  <MaterialIcon name="account-balance-wallet" size={moderateScale(20)} color="#fff" style={styles.navIcon} />
                  <Text style={[styles.desktopNavText, { fontSize: moderateScale(15) }]}>Wallet</Text>
                </TouchableOpacity>
              </>
            )}

            {isServiceProvider && (
              <TouchableOpacity onPress={handleDashboardButtonClick} style={[styles.desktopNavItem, { paddingVertical: verticalScale(8), paddingHorizontal: moderateScale(8), gap: moderateScale(6) }]}>
                <MaterialIcon name="dashboard" size={moderateScale(20)} color="#fff" style={styles.navIcon} />
                <Text style={[styles.desktopNavText, { fontSize: moderateScale(15) }]}>{t("navigation.dashboard")}</Text>
              </TouchableOpacity>
            )}

            {isVendor && (
              <TouchableOpacity onPress={handleAgentDashboardButtonClick} style={[styles.desktopNavItem, { paddingVertical: verticalScale(8), paddingHorizontal: moderateScale(8), gap: moderateScale(6) }]}>
                <MaterialIcon name="business" size={moderateScale(20)} color="#fff" style={styles.navIcon} />
                <Text style={[styles.desktopNavText, { fontSize: moderateScale(15) }]}>Agent Dashboard</Text>
              </TouchableOpacity>
            )}

            {!isAuthenticated && (
              <>
                <TouchableOpacity onPress={onAboutClick} style={[styles.desktopNavItem, { paddingVertical: verticalScale(8), paddingHorizontal: moderateScale(8), gap: moderateScale(6) }]}>
                  <MaterialIcon name="info" size={moderateScale(20)} color="#fff" style={styles.navIcon} />
                  <Text style={[styles.desktopNavText, { fontSize: moderateScale(15) }]}>{t("navigation.aboutUs")}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onContactClick} style={[styles.desktopNavItem, { paddingVertical: verticalScale(8), paddingHorizontal: moderateScale(8), gap: moderateScale(6) }]}>
                  <MaterialIcon name="contact-support" size={moderateScale(20)} color="#fff" style={styles.navIcon} />
                  <Text style={[styles.desktopNavText, { fontSize: moderateScale(15) }]}>{t("navigation.contactUs")}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSettingsOpen} style={[styles.desktopNavItem, { paddingVertical: verticalScale(8), paddingHorizontal: moderateScale(8), gap: moderateScale(6) }]}>
                  <MaterialIcon name="settings" size={moderateScale(20)} color="#fff" style={styles.navIcon} />
                  <Text style={[styles.desktopNavText, { fontSize: moderateScale(15) }]}>{t("navigation.settings") || "Settings"}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <View style={[styles.desktopActionIcons, { gap: moderateScale(16) }]}>
            <TouchableOpacity onPress={handleProfileButtonClick} style={[styles.desktopActionIcon, styles.userMenuButton, { padding: moderateScale(8), borderRadius: moderateScale(20), paddingHorizontal: moderateScale(12), paddingVertical: verticalScale(6) }]}>
              {renderUserAvatar()}
              {!isAuthenticated && <Text style={[styles.signInText, { fontSize: moderateScale(14) }]}>{t("navigation.signIn")}</Text>}
            </TouchableOpacity>

            {isAuthenticated && (
              <TouchableOpacity
                onPress={handleSignOut}
                disabled={isSigningOut}
                style={[styles.desktopActionIcon, styles.signOutButton, isSigningOut && styles.disabledDesktopButton, { padding: moderateScale(8), borderRadius: moderateScale(20), gap: moderateScale(6) }]}
              >
                <MaterialIcon name="logout" size={moderateScale(22)} color={isSigningOut ? "#94a3b8" : "#fff"} />
                <Text style={[styles.signOutText, isSigningOut && styles.disabledTabText, { fontSize: moderateScale(14) }]}>
                  {isSigningOut ? t("navigation.signingOut") : t("navigation.signOut")}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>

      <NotificationsDialog visible={showNotifications} onClose={() => setShowNotifications(false)} />
      <ProfileMenuSheet
        visible={isProfileMenuVisible}
        onClose={() => setIsProfileMenuVisible(false)}
        onProfile={() => handleProfileMenuNavigation(PROFILE)}
        onBookings={() => handleBookingsButtonClick()}
        onDashboard={() => handleDashboardButtonClick()}
        onWallet={handleWalletClick}
        onContact={onContactClick}
      />
      <Settings visible={isSettingsVisible} onClose={() => setIsSettingsVisible(false)} />
      <AuthModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onEmailLogin={handleEmailLogin}
        colors={colors}
        isDarkMode={isDarkMode}
        setAppUser={setAppUser}
        dispatch={dispatch}
      />
    </>
  );
};

const styles = StyleSheet.create({
  // Mobile Navigation Styles
  mobileNavShell: {
    width: "100%",
    alignSelf: "stretch",
    borderTopWidth: 1,
  },
  mobileNavContainer: {
    width: "100%",
    height: MOBILE_TAB_BAR_CONTENT_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  mobileNavItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 2,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 2,
  },
  navIconSlot: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  compactAvatarRing: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
  },
  compactAvatarRingDark: {
    borderColor: "#334155",
    backgroundColor: "#1e293b",
  },
  compactAvatarRingActive: {
    borderColor: "#0b5bd3",
    backgroundColor: "#eff6ff",
  },
  compactAvatarRingActiveDark: {
    borderColor: "#60a5fa",
    backgroundColor: "#1e3a5f",
  },
  compactAvatarInner: {
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
  },
  compactAvatarInitial: {
    color: "#fff",
    fontWeight: "700",
  },
  mobileNavText: {
    fontWeight: "500",
    textAlign: "center",
    letterSpacing: 0.1,
    maxWidth: "100%",
    flexShrink: 1,
  },
  mobileNavTextDestructive: {
    color: "#ef4444",
    fontWeight: "600",
  },
  disabledTab: {
    opacity: 0.5,
  },
  disabledTabText: {
    color: "#94a3b8",
  },

  // Desktop Navigation Styles
  desktopNavContainer: {
    flex: 2,
    justifyContent: "center",
  },
  desktopNavInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  desktopNavLinks: {
    flexDirection: "row",
    alignItems: "center",
  },
  desktopNavItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
  },
  navIcon: {
    marginRight: 4,
  },
  desktopNavText: {
    color: "white",
    fontWeight: "500",
  },
  desktopActionIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  desktopActionIcon: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    flexDirection: "row",
    alignItems: "center",
  },
  userMenuButton: {},
  userIconContainer: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  userIconContainerMobile: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  userAvatarContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  userAvatarContainerMobile: {
    alignItems: "center",
    gap: 4,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  userAvatarMobile: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  userAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  userAvatarPlaceholderMobile: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  userAvatarPlaceholderText: {
    color: "white",
    fontWeight: "600",
  },
  userAvatarPlaceholderTextMobile: {
    color: "white",
    fontWeight: "600",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  userName: {
    color: "white",
    fontWeight: "500",
    maxWidth: 60,
  },
  signOutButton: {
    backgroundColor: "rgba(239, 68, 68, 0.8)",
  },
  signInText: {
    color: "white",
    fontWeight: "500",
  },
  signOutText: {
    color: "white",
    fontWeight: "500",
  },
  disabledDesktopButton: {
    opacity: 0.6,
  },

  // Modal Styles
  modalKeyboardView: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    maxWidth: 420,
    backgroundColor: "transparent",
  },
  modalContent: {
    backgroundColor: "transparent",
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 32,
    elevation: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalHeaderLeft: {
    alignItems: "flex-start",
  },
  modalHeaderRight: {
    alignItems: "flex-end",
  },
  backButton: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalHeaderTitle: {
    fontWeight: "700",
    color: "#ffffff",
  },
  modalScrollContent: {
    flexGrow: 1,
  },
  optionsContainer: {
    backgroundColor: "#ffffff",
  },
  optionsTitle: {
    fontWeight: "700",
    textAlign: "center",
  },
  optionsSubtitle: {
    textAlign: "center",
    opacity: 0.7,
  },
  proMethodCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  proMethodIconContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  proMethodContent: {
    flex: 1,
  },
  proMethodTitle: {
    fontWeight: "700",
    marginBottom: 4,
  },
  proMethodDescription: {
    opacity: 0.7,
  },
  proMethodArrow: {
    width: 32,
    alignItems: "flex-end",
  },
  signupPrompt: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  signupPromptText: {},
  signupLink: {
    fontWeight: "600",
  },
  mobileFormContainer: {
    backgroundColor: "#ffffff",
  },
  mobileIconWrapper: {
    alignItems: "center",
  },
  mobileIconCircle: {
    alignItems: "center",
    justifyContent: "center",
  },
  mobileFormTitle: {
    fontWeight: "700",
    textAlign: "center",
  },
  mobileFormSubtitle: {
    textAlign: "center",
    opacity: 0.7,
  },
  inputGroup: {},
  inputLabel: {
    fontWeight: "600",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
  },
  countryCode: {
    fontWeight: "600",
    color: "#64748b",
  },
  input: {
    flex: 1,
  },
  otpInput: {
    textAlign: "center",
  },
  submitButton: {
    overflow: "hidden",
  },
  submitGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  resendButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  resendText: {
    fontWeight: "600",
  },
  resendDisabledText: {
    opacity: 0.5,
  },

  // Snackbar Styles
  snackbarContainer: {
    position: "absolute",
    overflow: "hidden",
    borderRadius: 14,
    zIndex: 9999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  snackbarGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  snackbarContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  snackbarIcon: {
    color: "#fff",
    fontWeight: "bold",
  },
  snackbarMessage: {
    color: "#fff",
    flex: 1,
    fontWeight: "500",
  },
  snackbarCloseButton: {
    padding: 4,
  },
});

export default NavigationFooter;