// Login.tsx - React Native CLI version with inline styles and gradient header
/* eslint-disable */
import React, { useState } from "react";
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
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useDispatch } from "react-redux";
import { add } from "../features/userSlice";
import axiosInstance from "../services/axiosInstance";

// Custom components (you'll need to create these)
import Registration from "../UserRegistration/Registration";
import AgentRegistrationForm from "../Agent/AgentRegistrationForm";
import ServiceProviderRegistration from "../Registration/ServiceProviderRegistration";
import ForgotPassword from "./ForgotPassword";

const { width, height } = Dimensions.get("window");

interface ChildComponentProps {
  sendDataToParent?: (data: string) => void;
  bookingPage?: (data: string | undefined) => void;
  embedded?: boolean;
  onBack?: () => void;
}

// Custom Snackbar Component
const CustomSnackbar: React.FC<{
  visible: boolean;
  message: string;
  severity: "success" | "error";
  onDismiss: () => void;
  autoHideDuration?: number;
}> = ({ visible, message, severity, onDismiss, autoHideDuration = 6000 }) => {
  const translateY = new Animated.Value(100);

  React.useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        speed: 12,
        bounciness: 4,
      }).start();

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

  const backgroundColor = severity === "success" ? "#10b981" : "#ef4444";

  return (
    <Animated.View
      style={[
        styles.snackbarContainer,
        {
          transform: [{ translateY }],
          backgroundColor,
        },
      ]}
    >
      <Text style={styles.snackbarMessage}>{message}</Text>
      <TouchableOpacity onPress={handleDismiss} style={styles.snackbarCloseButton}>
        <Text style={styles.snackbarCloseText}>✕</Text>
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

  const dispatch = useDispatch();

  const handleBackToLogin = () => {
    setIsRegistration(false);
    setIsForgotPassword(false);
    setServiceRegistration(false);
    setAgentRegistration(false);
  };

  const handleSnackbarClose = () => {
    setOpenSnackbar(false);
  };

  const handleKeyPress = () => {
    if (otpSent) {
      handleVerifyOtp();
    } else {
      handleSendOtp();
    }
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
      const response = await axiosInstance.post("/api/auth/otp/send", {
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
      const response = await axiosInstance.post("/api/auth/otp/verify", {
        mobile: mobile.replace(/\D/g, ""),
        otp: otp.trim(),
      });

      const payload = response?.data?.data;
      if (!payload?.customer) {
        throw new Error("Invalid response from OTP login.");
      }

      localStorage.setItem("token", payload.token);
      dispatch(add(payload));
      setSnackbarMessage("Login successful!");
      setSnackbarSeverity("success");
      setOpenSnackbar(true);

      setTimeout(() => {
        if (sendDataToParent) {
          sendDataToParent("");
        } else if (bookingPage) {
          bookingPage("CUSTOMER");
        }
      }, 700);
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

  React.useEffect(() => {
    if (!otpSent || resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((prev) => prev - 1), 1000);
    return () => clearTimeout(t);
  }, [otpSent, resendIn]);

  // Render header with gradient for embedded mode
  const renderHeader = () => {
    if (!embedded) return null;
    
    return (
      <LinearGradient
        colors={['#0d1935', '#1c4485', '#255697']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Login with Phone</Text>
          {onBack && <View style={styles.backButtonPlaceholder} />}
        </View>
      </LinearGradient>
    );
  };

  if (isForgotPassword) {
    return <ForgotPassword onBackToLogin={handleBackToLogin} />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {renderHeader()}
      
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          embedded ? styles.embeddedScroll : styles.normalScroll,
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[
          styles.mainContainer,
          embedded ? styles.embeddedMain : styles.normalMain
        ]}>
          <View style={[
            embedded ? styles.embeddedWrapper : styles.normalWrapper
          ]}>
            <View style={[
              embedded ? styles.embeddedCard : styles.normalCard
            ]}>
              {isRegistration ? (
                <Registration onBackToLogin={handleBackToLogin} />
              ) : isServiceRegistration ? (
                <ServiceProviderRegistration onBackToLogin={handleBackToLogin} />
              ) : isAgentRegistration ? (
                <AgentRegistrationForm onBackToLogin={handleBackToLogin} />
              ) : (
                <>
                  {!embedded && (
                    <>
                      <Text style={[
                        styles.title,
                        embedded ? styles.embeddedTitle : styles.normalTitle
                      ]}>
                        Mobile OTP Login
                      </Text>
                      <Text style={[
                        styles.subtitle,
                        embedded ? styles.embeddedSubtitle : styles.normalSubtitle
                      ]}>
                        Enter your mobile number to receive a one-time password.
                      </Text>
                    </>
                  )}
                  
                  {embedded && (
                    <Text style={styles.embeddedFormTitle}>
                      Enter your mobile number
                    </Text>
                  )}
                  
                  <View style={styles.form}>
                    <View>
                      {!embedded && (
                        <Text style={[
                          styles.label,
                          embedded ? styles.embeddedLabel : styles.normalLabel
                        ]}>
                          Mobile Number
                        </Text>
                      )}
                      <TextInput
                        style={[
                          styles.input,
                          embedded ? styles.embeddedInput : styles.normalInput
                        ]}
                        placeholder={embedded ? "Enter 10-digit mobile number" : "Enter 10-digit mobile number"}
                        placeholderTextColor={embedded ? "#94a3b8" : "#9ca3af"}
                        keyboardType="phone-pad"
                        value={mobile}
                        onChangeText={setMobile}
                        onSubmitEditing={handleKeyPress}
                        maxLength={10}
                      />
                    </View>
                    
                    {otpSent && (
                      <View style={styles.otpContainer}>
                        {!embedded && (
                          <Text style={[
                            styles.label,
                            embedded ? styles.embeddedLabel : styles.normalLabel
                          ]}>
                            OTP
                          </Text>
                        )}
                        <TextInput
                          style={[
                            styles.input,
                            embedded ? styles.embeddedInput : styles.normalInput
                          ]}
                          placeholder={embedded ? "Enter 6-digit OTP" : "Enter 6-digit OTP"}
                          placeholderTextColor={embedded ? "#94a3b8" : "#9ca3af"}
                          keyboardType="number-pad"
                          value={otp}
                          onChangeText={setOtp}
                          onSubmitEditing={handleKeyPress}
                          maxLength={6}
                        />
                      </View>
                    )}

                    {!otpSent ? (
                      <TouchableOpacity
                        style={[
                          styles.button,
                          embedded ? styles.embeddedButton : styles.normalButton,
                          sendingOtp && styles.buttonDisabled
                        ]}
                        onPress={handleSendOtp}
                        disabled={sendingOtp}
                      >
                        {sendingOtp ? (
                          <ActivityIndicator color={embedded ? "#ffffff" : "#ffffff"} />
                        ) : (
                          <Text style={[
                            styles.buttonText,
                            embedded ? styles.embeddedButtonText : styles.normalButtonText
                          ]}>
                            {embedded ? "Send OTP" : "SEND OTP"}
                          </Text>
                        )}
                      </TouchableOpacity>
                    ) : (
                      <>
                        <TouchableOpacity
                          style={[
                            styles.button,
                            embedded ? styles.embeddedButton : styles.normalButton,
                            verifyingOtp && styles.buttonDisabled
                          ]}
                          onPress={handleVerifyOtp}
                          disabled={verifyingOtp}
                        >
                          {verifyingOtp ? (
                            <ActivityIndicator color={embedded ? "#ffffff" : "#ffffff"} />
                          ) : (
                            <Text style={[
                              styles.buttonText,
                              embedded ? styles.embeddedButtonText : styles.normalButtonText
                            ]}>
                              {embedded ? "Verify OTP" : "VERIFY OTP"}
                            </Text>
                          )}
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={styles.resendButton}
                          onPress={() => {
                            if (resendIn > 0) return;
                            handleSendOtp();
                          }}
                          disabled={resendIn > 0 || sendingOtp}
                        >
                          <Text style={[
                            styles.resendText,
                            embedded ? styles.embeddedResendText : styles.normalResendText,
                            (resendIn > 0 || sendingOtp) && styles.resendDisabled
                          ]}>
                            {resendIn > 0 ? `Resend OTP in ${resendIn}s` : "Resend OTP"}
                          </Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>

                  {!embedded && (
                    <View style={styles.signupLinks}>
                      <TouchableOpacity onPress={() => setIsRegistration(true)}>
                        <Text style={styles.linkText}>New User? Register</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setIsForgotPassword(true)}>
                        <Text style={styles.linkText}>Forgot Password?</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
      
      <CustomSnackbar
        visible={openSnackbar}
        message={snackbarMessage}
        severity={snackbarSeverity}
        onDismiss={handleSnackbarClose}
        autoHideDuration={6000}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  headerGradient: {
    paddingTop: Platform.OS === "ios" ? 50 : 40,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.16)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 5,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
    width: 40,
  },
  backButtonText: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "600",
  },
  backButtonPlaceholder: {
    width: 40,
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  embeddedScroll: {
    padding: 4,
  },
  normalScroll: {
    padding: 16,
  },
  mainContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  embeddedMain: {
    maxWidth: width * 0.95,
  },
  normalMain: {
    maxWidth: width * 0.9,
  },
  embeddedWrapper: {
    width: "100%",
  },
  normalWrapper: {
    width: "100%",
    borderRadius: 26,
    overflow: "hidden",
    margin: 0,
  },
  embeddedCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  normalCard: {
    borderRadius: 20,
    backgroundColor: "#ffffff",
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 0,
  },
  embeddedTitle: {
    fontSize: 24,
    color: "#0f172a",
  },
  normalTitle: {
    fontSize: 36,
    color: "#1f2937",
  },
  subtitle: {
    marginTop: 8,
    textAlign: "center",
  },
  embeddedSubtitle: {
    fontSize: 14,
    color: "#64748b",
  },
  normalSubtitle: {
    fontSize: 14,
    color: "#6b7280",
  },
  embeddedFormTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 16,
    textAlign: "center",
  },
  form: {
    marginTop: 20,
    gap: 16,
  },
  label: {
    marginBottom: 8,
  },
  embeddedLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
  },
  normalLabel: {
    fontSize: 18,
    fontWeight: "400",
    color: "#374151",
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  embeddedInput: {
    borderColor: "#cbd5e1",
    backgroundColor: "#ffffff",
    color: "#0f172a",
  },
  normalInput: {
    borderColor: "#d1d5db",
    backgroundColor: "#ffffff",
    color: "#1f2937",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  otpContainer: {
    marginTop: 0,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 10,
    marginTop: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  embeddedButton: {
    backgroundColor: "#0284c7",
  },
  normalButton: {
    backgroundColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontWeight: "600",
    textAlign: "center",
  },
  embeddedButtonText: {
    color: "#ffffff",
    fontSize: 14,
  },
  normalButtonText: {
    color: "#ffffff",
    fontSize: 16,
  },
  resendButton: {
    marginTop: 12,
    alignItems: "center",
  },
  resendText: {
    fontSize: 14,
  },
  embeddedResendText: {
    color: "#0284c7",
    fontWeight: "500",
  },
  normalResendText: {
    color: "#60a5fa",
  },
  resendDisabled: {
    opacity: 0.5,
  },
  signupLinks: {
    marginTop: 20,
    alignItems: "center",
    gap: 12,
  },
  linkText: {
    color: "#0284c7",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 8,
  },
  snackbarContainer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 9999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  snackbarMessage: {
    color: "#ffffff",
    fontSize: 14,
    flex: 1,
    marginRight: 12,
  },
  snackbarCloseButton: {
    padding: 4,
  },
  snackbarCloseText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default Login;