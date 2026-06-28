// Login.tsx - React Native CLI version with modern redesign and gradient header
/* eslint-disable */
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Animated,
  Image,
  StatusBar,
  SafeAreaView,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { GRADIENTS, BOOKING_HEADER_GRADIENT } from "../theme/brandColors";
import { useDispatch } from "react-redux";
import { add } from "../features/userSlice";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Custom components
import Registration from "../UserRegistration/Registration";
import AgentRegistrationForm from "../Agent/AgentRegistrationForm";
import ServiceProviderRegistration from "../Registration/ServiceProviderRegistration";
// import ForgotPassword from "./ForgotPassword";

// Import the custom hook for AppUser context
import { useAppUser } from "../context/AppUserContext";
import providerInstance from "../services/providerInstance";
import { useTheme } from "../../src/Settings/ThemeContext";
import { DASHBOARD } from "../Constants/pagesConstants";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

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

interface ChildComponentProps {
  sendDataToParent?: (data: string) => void;
  bookingPage?: (data: string | undefined) => void;
  embedded?: boolean;
  onBack?: () => void;
}

// Modern Snackbar Component
const CustomSnackbar: React.FC<{
  visible: boolean;
  message: string;
  severity: "success" | "error";
  onDismiss: () => void;
  autoHideDuration?: number;
}> = ({ visible, message, severity, onDismiss, autoHideDuration = 6000 }) => {
  const translateY = new Animated.Value(100);
  const fadeAnim = new Animated.Value(0);

  React.useEffect(() => {
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
    } else {
      Animated.timing(translateY, {
        toValue: 100,
        duration: 300,
        useNativeDriver: true,
      }).start();
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

  const gradientColors = severity === "success" 
    ? ["#10b981", "#059669"] 
    : ["#ef4444", "#dc2626"];

  return (
    <Animated.View
      style={[
        styles.snackbarContainer,
        {
          transform: [{ translateY }],
          opacity: fadeAnim,
          left: moderateScale(20),
          right: moderateScale(20),
          bottom: verticalScale(20),
        },
      ]}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.snackbarGradient}
      >
        <Text style={[styles.snackbarMessage, { fontSize: moderateScale(14) }]}>{message}</Text>
        <TouchableOpacity onPress={handleDismiss} style={styles.snackbarCloseButton}>
          <Text style={[styles.snackbarCloseText, { fontSize: moderateScale(16) }]}>✕</Text>
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );
};

// Modern Method Selection Card
const LoginMethodCard = ({ 
  icon, 
  title, 
  description, 
  onPress, 
  colors,
  gradientColors 
}: any) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
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

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[styles.methodCard, { backgroundColor: colors.card }]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.methodIconContainer}
        >
          <Text style={[styles.methodIcon, { fontSize: moderateScale(28) }]}>{icon}</Text>
        </LinearGradient>
        <View style={styles.methodContent}>
          <Text style={[styles.methodTitle, { color: colors.text, fontSize: moderateScale(16) }]}>{title}</Text>
          <Text style={[styles.methodDescription, { color: colors.textSecondary, fontSize: moderateScale(12) }]}>
            {description}
          </Text>
        </View>
        <Text style={[styles.methodArrow, { fontSize: moderateScale(20) }]}>→</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const Login: React.FC<ChildComponentProps> = ({
  sendDataToParent,
  bookingPage,
  embedded = false,
  onBack,
}) => {
  const { colors, isDarkMode } = useTheme();
  const [isRegistration, setIsRegistration] = useState(false);
  const [isServiceRegistration, setServiceRegistration] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isAgentRegistration, setAgentRegistration] = useState(false);
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
    "success"
  );
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  const dispatch = useDispatch();
  const { setAppUser } = useAppUser();

  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (!isRegistration && !isServiceRegistration && !isAgentRegistration && !isForgotPassword) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isRegistration, isServiceRegistration, isAgentRegistration, isForgotPassword]);

  const handleBackToLogin = () => {
    setIsRegistration(false);
    setIsForgotPassword(false);
    setServiceRegistration(false);
    setAgentRegistration(false);
    setSelectedMethod(null);
    setOtpSent(false);
    setMobile("");
    setOtp("");
  };

  const handleSnackbarClose = () => {
    setOpenSnackbar(false);
  };

  const handleSendOtp = async () => {
    const sanitizedMobile = mobile.replace(/\D/g, "");
    if (!/^\d{10}$/.test(sanitizedMobile)) {
      setSnackbarMessage("Please enter a valid 10-digit mobile number.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      return;
    }

    try {
      setSendingOtp(true);
      const response = await providerInstance.post("/api/auth/otp/send", {
        mobile: sanitizedMobile,
      });
      setOtpSent(true);
      setResendIn(30);
      setSnackbarMessage(
        response?.data?.data?.devOtp
          ? `OTP sent. Dev OTP: ${response.data.data.devOtp}`
          : "OTP sent successfully."
      );
      setSnackbarSeverity("success");
      setOpenSnackbar(true);
      setOtp("");
    } catch (error: any) {
      console.error("Send OTP error:", error);
      setSnackbarMessage(
        error.response?.data?.message || "Failed to send OTP."
      );
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      setSnackbarMessage("Please enter OTP.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
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
        const rawSpId =
          payload.serviceProviderId ??
          payload.serviceproviderid ??
          payload.serviceProvider?.serviceproviderid ??
          payload.serviceProvider?.id;
        const serviceProviderId = rawSpId != null && rawSpId !== "" ? Number(rawSpId) : null;
        const providerData = payload.serviceProvider;
        userData = {
          ...userData,
          serviceProviderId: serviceProviderId,
          name: providerData
            ? [providerData.firstName, providerData.lastName].filter(Boolean).join(" ")
            : "Service Provider",
          email: providerData?.emailId ?? null,
          firstName: providerData?.firstName,
          lastName: providerData?.lastName,
        };
      }
      else if (role === "VENDOR") {
        const vendorId = payload.vendorId ? Number(payload.vendorId) : null;
        const vendorData = payload.vendor;
        userData = {
          ...userData,
          vendorId: vendorId,
          name: vendorData
            ? [vendorData.firstName, vendorData.lastName].filter(Boolean).join(" ")
            : "Vendor",
          email: vendorData?.emailId ?? null,
          firstName: vendorData?.firstName,
          lastName: vendorData?.lastName,
        };
      }
      else if (role === "CUSTOMER") {
        const customerIdRaw =
          payload.customerId ??
          payload.customer?.customerId ??
          payload.customer?.customerid ??
          payload.customer?.id;
        const customerId =
          customerIdRaw != null && customerIdRaw !== "" ? Number(customerIdRaw) : null;
        const customerData = payload.customer;
        const loginMobile = mobile.replace(/\D/g, "");
        userData = {
          ...userData,
          customerid: customerId,
          customerId: customerId,
          name: customerData
            ? [customerData.firstName ?? customerData.firstname, customerData.lastName ?? customerData.lastname]
                .filter(Boolean)
                .join(" ")
            : "Customer",
          email: customerData?.emailId ?? customerData?.emailid ?? null,
          firstName: customerData?.firstName ?? customerData?.firstname,
          lastName: customerData?.lastName ?? customerData?.lastname,
          mobileNo: loginMobile || null,
          mobile: loginMobile || null,
        };
      }
      else {
        userData = {
          ...userData,
          name: "User",
        };
      }

      setAppUser(userData);
      
      console.log("✅ User logged in successfully:", { role, name: userData.name });

      setSnackbarMessage("Login successful!");
      setSnackbarSeverity("success");
      setOpenSnackbar(true);

      setTimeout(() => {
        if (embedded && onBack) {
          onBack();
        }
        
        if (role === "SERVICE_PROVIDER") {
          if (sendDataToParent) {
            sendDataToParent(DASHBOARD);
          } else if (bookingPage) {
            bookingPage("SERVICE_PROVIDER");
          }
        } else if (role === "VENDOR") {
          if (sendDataToParent) {
            sendDataToParent("AGENT_DASHBOARD");
          } else if (bookingPage) {
            bookingPage("VENDOR");
          }
        } else if (role === "CUSTOMER") {
          if (sendDataToParent) {
            sendDataToParent("");
          } else if (bookingPage) {
            bookingPage("CUSTOMER");
          }
        } else {
          if (sendDataToParent) sendDataToParent("");
          if (bookingPage) bookingPage("CUSTOMER");
        }
      }, 500);
      
    } catch (error: any) {
      console.error("Verify OTP error:", error);
      setSnackbarMessage(
        error.response?.data?.message || "Invalid OTP. Please try again."
      );
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
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

  // Render header with BOOKING_HEADER_GRADIENT
  const renderHeader = () => {
    if (!embedded) return null;
    
    return (
      <LinearGradient
        colors={[...BOOKING_HEADER_GRADIENT]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerGradient, { paddingTop: Platform.OS === "ios" ? verticalScale(50) : verticalScale(40) }]}
      >
        <View style={styles.headerContent}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={[styles.backButton, { width: moderateScale(40), height: moderateScale(40) }]}>
              <Text style={[styles.backButtonText, { fontSize: moderateScale(24) }]}>←</Text>
            </TouchableOpacity>
          )}
          {onBack && <View style={[styles.backButtonPlaceholder, { width: moderateScale(40) }]} />}
        </View>
        <Text style={[styles.headerTitle, { fontSize: moderateScale(28), marginTop: verticalScale(12) }]}>Welcome Back!</Text>
        <Text style={[styles.headerSubtitle, { fontSize: moderateScale(14), marginTop: verticalScale(4) }]}>
          Sign in to continue to your account
        </Text>
      </LinearGradient>
    );
  };

  const renderLoginOptions = () => (
    <Animated.View 
      style={[
        styles.optionsContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }
      ]}
    >
      <View style={[styles.optionsCard, { backgroundColor: colors.card, borderColor: colors.border + '30' }]}>
        <Text style={[styles.optionsTitle, { color: colors.text, fontSize: moderateScale(24) }]}>Choose Login Method</Text>
        <Text style={[styles.optionsSubtitle, { color: colors.textSecondary, fontSize: moderateScale(14) }]}>
          Select how you'd like to access your account
        </Text>

        <LoginMethodCard
          icon="📱"
          title="Mobile OTP Login"
          description="Login instantly with OTP sent to your mobile"
          onPress={() => setSelectedMethod("mobile")}
          colors={colors}
          gradientColors={["#3b82f6", "#1e40af"]}
        />

        {/* <TouchableOpacity
          style={styles.forgotPasswordLink}
          onPress={() => setIsForgotPassword(true)}
        >
          <Text style={[styles.forgotPasswordText, { color: colors.primary, fontSize: moderateScale(14) }]}>
            Forgot Password?
          </Text>
        </TouchableOpacity> */}
      </View>
    </Animated.View>
  );

  const renderMobileLogin = () => (
    <Animated.View 
      style={[
        styles.mobileLoginContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }
      ]}
    >
      <TouchableOpacity onPress={() => setSelectedMethod(null)} style={styles.backToOptions}>
        <Text style={[styles.backToOptionsText, { fontSize: moderateScale(14) }]}>← Back to options</Text>
      </TouchableOpacity>

      <View style={[styles.mobileCard, { backgroundColor: colors.card, borderColor: colors.border + '30' }]}>
        <View style={styles.mobileHeader}>
          <LinearGradient
            colors={["#3b82f6", "#1e40af"]}
            style={[styles.mobileIconContainer, { width: moderateScale(72), height: moderateScale(72) }]}
          >
            <Text style={[styles.mobileIcon, { fontSize: moderateScale(36) }]}>📱</Text>
          </LinearGradient>
          <Text style={[styles.mobileTitle, { color: colors.text, fontSize: moderateScale(22), marginBottom: verticalScale(8) }]}>Mobile OTP Login</Text>
          <Text style={[styles.mobileSubtitle, { color: colors.textSecondary, fontSize: moderateScale(13) }]}>
            Enter your mobile number to receive a one-time password
          </Text>
        </View>

        <View style={[styles.form, { gap: verticalScale(20) }]}>
          <View style={[styles.inputGroup, { gap: verticalScale(8) }]}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary, fontSize: moderateScale(14) }]}>Mobile Number</Text>
            <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.surface, height: verticalScale(52) }]}>
              <Text style={[styles.countryCode, { fontSize: moderateScale(16), marginRight: moderateScale(12) }]}>+91</Text>
              <TextInput
                style={[styles.input, { color: colors.text, fontSize: moderateScale(16), paddingVertical: verticalScale(12) }]}
                placeholder="Enter 10-digit mobile number"
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
            <View style={[styles.inputGroup, { gap: verticalScale(8) }]}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary, fontSize: moderateScale(14) }]}>OTP</Text>
              <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.surface, height: verticalScale(52) }]}>
                <Text style={[styles.otpIcon, { fontSize: moderateScale(18), marginRight: moderateScale(12) }]}>🔐</Text>
                <TextInput
                  style={[styles.input, styles.otpInput, { color: colors.text, fontSize: moderateScale(16), paddingVertical: verticalScale(12) }]}
                  placeholder="Enter 6-digit OTP"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="number-pad"
                  value={otp}
                  onChangeText={setOtp}
                  maxLength={6}
                  autoFocus={true}
                />
              </View>
            </View>
          )}

          {!otpSent ? (
            <TouchableOpacity
              style={[styles.submitButton, sendingOtp && styles.buttonDisabled]}
              onPress={handleSendOtp}
              disabled={sendingOtp}
            >
              <LinearGradient
                colors={["#3b82f6", "#1e40af"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.submitGradient, { paddingVertical: verticalScale(14) }]}
              >
                {sendingOtp ? (
                  <ActivityIndicator color="#ffffff" size={moderateScale(20)} />
                ) : (
                  <Text style={[styles.submitButtonText, { fontSize: moderateScale(16) }]}>Send OTP</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.submitButton, verifyingOtp && styles.buttonDisabled]}
                onPress={handleVerifyOtp}
                disabled={verifyingOtp}
              >
                <LinearGradient
                  colors={["#3b82f6", "#1e40af"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.submitGradient, { paddingVertical: verticalScale(14) }]}
                >
                  {verifyingOtp ? (
                    <ActivityIndicator color="#ffffff" size={moderateScale(20)} />
                  ) : (
                    <Text style={[styles.submitButtonText, { fontSize: moderateScale(16) }]}>Verify & Login</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.resendButton, { paddingVertical: verticalScale(12) }]}
                onPress={() => {
                  if (resendIn > 0) return;
                  handleSendOtp();
                }}
                disabled={resendIn > 0 || sendingOtp}
              >
                <Text style={[
                  styles.resendText,
                  { color: colors.primary, fontSize: moderateScale(14) },
                  (resendIn > 0 || sendingOtp) && styles.resendDisabled
                ]}>
                  {resendIn > 0 ? `Resend OTP in ${resendIn}s` : "Resend OTP"}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Animated.View>
  );

  if (isRegistration) {
    return <Registration onBackToLogin={handleBackToLogin} />;
  }

  if (isServiceRegistration) {
    return <ServiceProviderRegistration onBackToLogin={handleBackToLogin} />;
  }

  if (isAgentRegistration) {
    return <AgentRegistrationForm onBackToLogin={handleBackToLogin} />;
  }

  // if (isForgotPassword) {
  //   return <ForgotPassword onBackToLogin={handleBackToLogin} />;
  // 

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : verticalScale(20)}
      >
        {renderHeader()}
        
        <ScrollView
          contentContainerStyle={[
            styles.scrollContainer,
            embedded ? styles.embeddedScroll : styles.normalScroll,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {selectedMethod === "mobile" ? renderMobileLogin() : renderLoginOptions()}
        </ScrollView>
        
        <CustomSnackbar
          visible={openSnackbar}
          message={snackbarMessage}
          severity={snackbarSeverity}
          onDismiss={handleSnackbarClose}
          autoHideDuration={6000}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingBottom: verticalScale(24),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: verticalScale(4) },
    shadowOpacity: 0.15,
    shadowRadius: verticalScale(12),
    elevation: 8,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: moderateScale(20),
  },
  backButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  backButtonText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  backButtonPlaceholder: {},
  headerLogoContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerLogo: {
    width: moderateScale(100),
    height: verticalScale(50),
  },
  headerTitle: {
    color: "#ffffff",
    fontWeight: "700",
    textAlign: "center",
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  embeddedScroll: {
    padding: moderateScale(16),
  },
  normalScroll: {
    padding: moderateScale(20),
  },
  optionsContainer: {
    width: "100%",
    maxWidth: moderateScale(400),
  },
  optionsCard: {
    padding: moderateScale(20),
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: verticalScale(2) },
    shadowOpacity: 0.05,
    shadowRadius: verticalScale(10),
    elevation: 3,
  },
  optionsTitle: {
    fontWeight: "700",
    textAlign: "center",
    marginBottom: verticalScale(8),
  },
  optionsSubtitle: {
    textAlign: "center",
    marginBottom: verticalScale(24),
    lineHeight: moderateScale(20),
  },
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: moderateScale(16),
    marginBottom: verticalScale(12),
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: verticalScale(1) },
    shadowOpacity: 0.05,
    shadowRadius: verticalScale(4),
    elevation: 2,
  },
  methodIconContainer: {
    width: moderateScale(56),
    height: moderateScale(56),
    alignItems: "center",
    justifyContent: "center",
    marginRight: moderateScale(16),
  },
  methodIcon: {},
  methodContent: {
    flex: 1,
  },
  methodTitle: {
    fontWeight: "700",
    marginBottom: verticalScale(4),
  },
  methodDescription: {
    lineHeight: moderateScale(16),
  },
  methodArrow: {
    color: "#94a3b8",
  },
  forgotPasswordLink: {
    marginTop: verticalScale(16),
    alignItems: "center",
  },
  forgotPasswordText: {
    fontWeight: "600",
  },
  mobileLoginContainer: {
    width: "100%",
    maxWidth: moderateScale(400),
  },
  backToOptions: {
    marginBottom: verticalScale(16),
  },
  backToOptionsText: {
    fontWeight: "600",
    color: "#3b82f6",
  },
  mobileCard: {
    padding: moderateScale(24),
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: verticalScale(2) },
    shadowOpacity: 0.05,
    shadowRadius: verticalScale(10),
    elevation: 3,
  },
  mobileHeader: {
    alignItems: "center",
    marginBottom: verticalScale(28),
  },
  mobileIconContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: verticalScale(16),
  },
  mobileIcon: {},
  mobileTitle: {
    fontWeight: "700",
  },
  mobileSubtitle: {
    textAlign: "center",
    lineHeight: moderateScale(18),
  },
  form: {},
  inputGroup: {},
  inputLabel: {
    fontWeight: "600",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingHorizontal: moderateScale(16),
  },
  countryCode: {
    fontWeight: "600",
    color: "#64748b",
  },
  otpIcon: {},
  input: {
    flex: 1,
  },
  otpInput: {
    textAlign: "center",
    letterSpacing: moderateScale(4),
  },
  submitButton: {
    overflow: "hidden",
    marginTop: verticalScale(8),
  },
  submitGradient: {
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
    alignItems: "center",
  },
  resendText: {
    fontWeight: "600",
  },
  resendDisabled: {
    opacity: 0.5,
  },
  snackbarContainer: {
    position: "absolute",
    overflow: "hidden",
    zIndex: 9999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: verticalScale(4) },
    shadowOpacity: 0.2,
    shadowRadius: verticalScale(8),
    elevation: 8,
  },
  snackbarGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: moderateScale(16),
    paddingVertical: verticalScale(14),
  },
  snackbarMessage: {
    color: "#ffffff",
    flex: 1,
    marginRight: moderateScale(12),
    fontWeight: "500",
  },
  snackbarCloseButton: {
    padding: moderateScale(4),
  },
  snackbarCloseText: {
    color: "#ffffff",
    fontWeight: "bold",
  },
});

export default Login;