/* eslint-disable */
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Pressable,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
  KeyboardAvoidingView,
  ScrollView,
  Keyboard,
  InputAccessoryView,
  Animated,
  Vibration,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { Portal } from "react-native-paper";
import { BOOKING_HEADER_GRADIENT } from "../theme/brandColors";

const OTP_ACCESSORY_ID = "otp-verification-accessory";
const OTP_LENGTH = 6;
const AUTO_VERIFY_DELAY_MS = 450;

interface OtpVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerify: (otp: string) => Promise<void>;
  verifying: boolean;
  bookingInfo?: {
    clientName?: string;
    service?: string;
    bookingId?: string | number;
  };
}

export function OtpVerificationDialog({
  open,
  onOpenChange,
  onVerify,
  verifying,
  bookingInfo,
}: OtpVerificationDialogProps) {
  const { width: windowWidth } = useWindowDimensions();
  const [otpValue, setOtpValue] = useState("");
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);
  const verificationCompletedRef = useRef(false);
  const lastAutoVerifiedOtpRef = useRef("");
  const inputRef = useRef<TextInput>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const getVerifyErrorMessage = (err: unknown): string => {
    if (err && typeof err === "object" && "response" in err) {
      const data = (err as { response?: { data?: { error?: string; message?: string } } })
        .response?.data;
      if (data?.error) return data.error;
      if (data?.message) return data.message;
    }
    if (err instanceof Error && err.message) return err.message;
    return "Invalid or expired OTP. Please check the code and try again.";
  };

  const triggerShake = useCallback(() => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 12, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
    inputRef.current?.blur();
  }, []);

  const focusInput = useCallback(() => {
    if (!verifying && !verifiedSuccess) {
      inputRef.current?.focus();
    }
  }, [verifying, verifiedSuccess]);

  const handleClose = useCallback(() => {
    setOtpValue("");
    setVerifyError(null);
    setVerifiedSuccess(false);
    lastAutoVerifiedOtpRef.current = "";
    dismissKeyboard();
    onOpenChange(false);
  }, [dismissKeyboard, onOpenChange]);

  const handleVerify = useCallback(async () => {
    if (otpValue.trim().length !== OTP_LENGTH || verifying || verifiedSuccess) return;

    setVerifyError(null);
    try {
      await onVerify(otpValue.trim());
      verificationCompletedRef.current = true;
      setVerifiedSuccess(true);
      dismissKeyboard();
    } catch (err) {
      verificationCompletedRef.current = false;
      lastAutoVerifiedOtpRef.current = "";
      setVerifyError(getVerifyErrorMessage(err));
      setOtpValue("");
      triggerShake();
      if (Platform.OS === "ios") {
        Vibration.vibrate();
      } else {
        Vibration.vibrate(80);
      }
      setTimeout(() => focusInput(), 150);
    }
  }, [
    otpValue,
    onVerify,
    verifying,
    verifiedSuccess,
    dismissKeyboard,
    triggerShake,
    focusInput,
  ]);

  useEffect(() => {
    if (open) {
      verificationCompletedRef.current = false;
      setVerifyError(null);
      setOtpValue("");
      setVerifiedSuccess(false);
      lastAutoVerifiedOtpRef.current = "";
      setTimeout(() => focusInput(), 350);
    }
  }, [open, focusInput]);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (!verifying && verificationCompletedRef.current && verifiedSuccess) {
      const timer = setTimeout(() => {
        handleClose();
      }, 1400);
      return () => clearTimeout(timer);
    }
  }, [verifying, verifiedSuccess, handleClose]);

  useEffect(() => {
    if (
      !open ||
      verifying ||
      verifiedSuccess ||
      otpValue.length !== OTP_LENGTH ||
      otpValue === lastAutoVerifiedOtpRef.current
    ) {
      return;
    }

    const timer = setTimeout(() => {
      lastAutoVerifiedOtpRef.current = otpValue;
      void handleVerify();
    }, AUTO_VERIFY_DELAY_MS);

    return () => clearTimeout(timer);
  }, [otpValue, open, verifying, verifiedSuccess, handleVerify]);

  const handleOtpChange = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, "").slice(0, OTP_LENGTH);
    setOtpValue(numericText);
    if (verifyError) setVerifyError(null);
    if (numericText.length < OTP_LENGTH) {
      lastAutoVerifiedOtpRef.current = "";
    }
  };

  const handleClearOtp = () => {
    setOtpValue("");
    setVerifyError(null);
    lastAutoVerifiedOtpRef.current = "";
    focusInput();
  };

  const canVerify = otpValue.trim().length === OTP_LENGTH && !verifying && !verifiedSuccess;

  const handleVerifyPress = useCallback(() => {
    dismissKeyboard();
    void handleVerify();
  }, [dismissKeyboard, handleVerify]);

  const modalWidth = Math.min(windowWidth * 0.9, 420);
  const otpDigits = Array.from({ length: OTP_LENGTH }, (_, index) => otpValue[index] ?? "");

  const otpAccessoryBar = (
    <View style={styles.accessoryBar}>
      <TouchableOpacity
        onPress={dismissKeyboard}
        style={styles.accessoryButton}
        accessibilityRole="button"
        accessibilityLabel="Done"
      >
        <Text style={styles.accessoryDoneText}>Done</Text>
      </TouchableOpacity>
      <View style={styles.accessoryCenter}>
        <Text style={styles.accessoryProgress}>
          {otpValue.length}/{OTP_LENGTH}
        </Text>
      </View>
      <TouchableOpacity
        onPress={handleVerifyPress}
        style={[styles.accessoryVerifyButton, !canVerify && styles.accessoryVerifyDisabled]}
        disabled={!canVerify}
        accessibilityRole="button"
        accessibilityLabel="Verify code"
      >
        <Text style={[styles.accessoryVerifyText, !canVerify && styles.accessoryVerifyTextDisabled]}>
          Verify
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Portal>
      <Modal
        visible={open}
        animationType="fade"
        transparent={true}
        onRequestClose={handleClose}
      >
        {Platform.OS === "ios" ? (
          <InputAccessoryView nativeID={OTP_ACCESSORY_ID}>
            {otpAccessoryBar}
          </InputAccessoryView>
        ) : null}

        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
        >
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              keyboardVisible && styles.scrollContentKeyboardOpen,
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            bounces={false}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.modalContent, { width: modalWidth }]}>
              <LinearGradient
                colors={[...BOOKING_HEADER_GRADIENT]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
              >
                <View style={styles.headerContent}>
                  <View style={styles.headerIconContainer}>
                    <Icon name="shield-check" size={24} color="#ffffff" />
                  </View>
                  <Text style={styles.headerTitle}>Verify Service</Text>
                  <TouchableOpacity
                    onPress={handleClose}
                    style={styles.closeButton}
                    disabled={verifying}
                  >
                    <Icon name="close" size={22} color="#ffffff" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.headerSubtitle}>
                  Ask the client for their 6-digit code to confirm completion
                </Text>
              </LinearGradient>

              <View style={styles.content}>
                {bookingInfo && (
                  <LinearGradient
                    colors={["#eff6ff", "#dbeafe"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.bookingInfoCard}
                  >
                    <View style={styles.bookingInfoIcon}>
                      <Icon name="calendar-check" size={20} color="#1e40af" />
                    </View>
                    <View style={styles.bookingInfoText}>
                      <Text style={styles.bookingInfoTitle}>
                        Service for {bookingInfo.clientName || "Client"}
                      </Text>
                      <Text style={styles.bookingInfoSubtitle}>
                        {bookingInfo.service || "Service"} • #{bookingInfo.bookingId || "N/A"}
                      </Text>
                    </View>
                  </LinearGradient>
                )}

                {verifiedSuccess ? (
                  <View style={styles.successBanner} accessibilityRole="alert">
                    <View style={styles.successIconWrap}>
                      <Icon name="check-circle" size={40} color="#10b981" />
                    </View>
                    <Text style={styles.successTitle}>Verified!</Text>
                    <Text style={styles.successSubtitle}>
                      Service marked complete. Earnings will be credited shortly.
                    </Text>
                  </View>
                ) : (
                  <>
                    {verifyError ? (
                      <View style={styles.errorBanner} accessibilityRole="alert">
                        <Icon name="alert-circle" size={18} color="#b91c1c" />
                        <View style={styles.errorTextWrap}>
                          <Text style={styles.errorText}>{verifyError}</Text>
                          <Text style={styles.errorHint}>Code cleared — enter it again.</Text>
                        </View>
                      </View>
                    ) : null}

                    <View style={styles.otpSection}>
                      <View style={styles.instructionIconContainer}>
                        <Icon name="cellphone-key" size={20} color="#3b82f6" />
                        <Text style={styles.instructions}>
                          Enter the code the client received. It verifies automatically when all 6 digits are entered.
                        </Text>
                      </View>

                      <Animated.View
                        style={[
                          styles.otpBoxesContainer,
                          { transform: [{ translateX: shakeAnim }] },
                        ]}
                      >
                        <Pressable
                          onPress={focusInput}
                          style={styles.otpBoxesPressable}
                          accessibilityRole="none"
                        >
                          {otpDigits.map((digit, index) => {
                            const isActive = otpValue.length === index;
                            const isFilled = otpValue.length > index;
                            const hasError = Boolean(verifyError);
                            return (
                              <View
                                key={index}
                                style={[
                                  styles.otpBox,
                                  isFilled && styles.otpBoxFilled,
                                  isActive && styles.otpBoxActive,
                                  hasError && styles.otpBoxError,
                                ]}
                              >
                                <Text style={[styles.otpBoxDigit, isFilled && styles.otpBoxDigitFilled]}>
                                  {digit}
                                </Text>
                                {isActive && !verifying ? <View style={styles.otpCursor} /> : null}
                              </View>
                            );
                          })}
                        </Pressable>

                        <TextInput
                          ref={inputRef}
                          value={otpValue}
                          onChangeText={handleOtpChange}
                          keyboardType="number-pad"
                          inputAccessoryViewID={Platform.OS === "ios" ? OTP_ACCESSORY_ID : undefined}
                          maxLength={OTP_LENGTH}
                          style={styles.hiddenInput}
                          editable={!verifying}
                          caretHidden
                          autoComplete={Platform.OS === "android" ? "sms-otp" : "one-time-code"}
                          textContentType="oneTimeCode"
                          importantForAutofill="yes"
                        />
                      </Animated.View>

                      <View style={styles.otpMetaRow}>
                        <Text style={styles.otpProgress}>
                          {otpValue.length} of {OTP_LENGTH} digits
                        </Text>
                        {otpValue.length > 0 ? (
                          <TouchableOpacity
                            onPress={handleClearOtp}
                            disabled={verifying}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Text style={styles.clearText}>Clear</Text>
                          </TouchableOpacity>
                        ) : (
                          <Text style={styles.tapHint}>Tap boxes to type</Text>
                        )}
                      </View>

                      {verifying ? (
                        <View style={styles.verifyingBanner}>
                          <ActivityIndicator color="#2563eb" size="small" />
                          <Text style={styles.verifyingBannerText}>Checking code…</Text>
                        </View>
                      ) : null}

                      {!keyboardVisible ? (
                        <View style={styles.verificationNoteContainer}>
                          <Icon name="information" size={14} color="#92400e" />
                          <Text style={styles.verificationNote}>
                            This confirms the service was completed and releases your payment.
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    {Platform.OS === "android" && keyboardVisible ? otpAccessoryBar : null}

                    <View style={styles.actions}>
                      <TouchableOpacity
                        style={[styles.button, styles.cancelButton]}
                        onPress={handleClose}
                        disabled={verifying}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.button,
                          styles.verifyButton,
                          (verifying || !canVerify) && styles.disabledButton,
                        ]}
                        onPress={handleVerifyPress}
                        disabled={verifying || !canVerify}
                      >
                        <LinearGradient
                          colors={canVerify ? [...BOOKING_HEADER_GRADIENT] : ["#94a3b8", "#64748b"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.verifyButtonGradient}
                        >
                          {verifying ? (
                            <View style={styles.verifyingContainer}>
                              <ActivityIndicator color="#FFFFFF" size="small" />
                              <Text style={styles.verifyingText}>Verifying…</Text>
                            </View>
                          ) : (
                            <View style={styles.verifyButtonContent}>
                              <Icon name="check-decagram" size={18} color="#ffffff" />
                              <Text style={styles.verifyButtonText}>
                                {canVerify ? "Verify Now" : "Enter 6 Digits"}
                              </Text>
                            </View>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    paddingBottom: 32,
  },
  scrollContentKeyboardOpen: {
    justifyContent: "flex-start",
    paddingTop: Platform.OS === "ios" ? 48 : 24,
    paddingBottom: 16,
  },
  accessoryBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8fafc",
    borderTopWidth: 1,
    borderTopColor: "#cbd5e1",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  accessoryButton: {
    paddingVertical: 6,
    paddingHorizontal: 4,
    minWidth: 56,
  },
  accessoryCenter: {
    flex: 1,
    alignItems: "center",
  },
  accessoryProgress: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
  },
  accessoryDoneText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#2563eb",
  },
  accessoryVerifyButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#2563eb",
    minWidth: 72,
    alignItems: "center",
  },
  accessoryVerifyDisabled: {
    backgroundColor: "#e2e8f0",
  },
  accessoryVerifyText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
  },
  accessoryVerifyTextDisabled: {
    color: "#94a3b8",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
    flex: 1,
    textAlign: "center",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    lineHeight: 18,
    textAlign: "center",
  },
  content: {
    padding: 20,
  },
  successBanner: {
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 12,
  },
  successIconWrap: {
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#059669",
    marginBottom: 6,
  },
  successSubtitle: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorTextWrap: {
    flex: 1,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
    color: "#b91c1c",
    fontWeight: "600",
  },
  errorHint: {
    fontSize: 12,
    color: "#dc2626",
    marginTop: 2,
  },
  bookingInfoCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  bookingInfoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  bookingInfoText: {
    flex: 1,
  },
  bookingInfoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e40af",
    marginBottom: 2,
  },
  bookingInfoSubtitle: {
    fontSize: 12,
    color: "#3b82f6",
  },
  otpSection: {
    marginBottom: 20,
  },
  instructionIconContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
    gap: 10,
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 12,
  },
  instructions: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 18,
    flex: 1,
  },
  otpBoxesContainer: {
    position: "relative",
    marginBottom: 10,
  },
  otpBoxesPressable: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  otpBox: {
    flex: 1,
    aspectRatio: 0.85,
    maxHeight: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
  },
  otpBoxFilled: {
    borderColor: "#3b82f6",
    backgroundColor: "#ffffff",
  },
  otpBoxActive: {
    borderColor: "#2563eb",
    backgroundColor: "#ffffff",
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  otpBoxError: {
    borderColor: "#f87171",
    backgroundColor: "#fef2f2",
  },
  otpBoxDigit: {
    fontSize: 22,
    fontWeight: "700",
    color: "#cbd5e1",
  },
  otpBoxDigitFilled: {
    color: "#0f172a",
  },
  otpCursor: {
    position: "absolute",
    bottom: 10,
    width: 2,
    height: 20,
    borderRadius: 1,
    backgroundColor: "#2563eb",
  },
  hiddenInput: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0,
    color: "transparent",
  },
  otpMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  otpProgress: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
  },
  tapHint: {
    fontSize: 12,
    color: "#94a3b8",
  },
  clearText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2563eb",
  },
  verifyingBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#eff6ff",
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 4,
    marginBottom: 8,
  },
  verifyingBannerText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2563eb",
  },
  verificationNoteContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fef3c7",
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  verificationNote: {
    fontSize: 12,
    color: "#92400e",
    flex: 1,
    lineHeight: 16,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 4,
  },
  button: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  cancelButton: {
    borderWidth: 2,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
  },
  verifyButton: {
    overflow: "hidden",
  },
  verifyButtonGradient: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  verifyButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  disabledButton: {
    opacity: 0.85,
  },
  verifyButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },
  verifyingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  verifyingText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#ffffff",
  },
});

export default OtpVerificationDialog;
