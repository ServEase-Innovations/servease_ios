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
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { Portal } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HOME_M3 } from "../theme/brandColors";

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
}: OtpVerificationDialogProps) {
  const insets = useSafeAreaInsets();
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

  const handleVerifyPress = useCallback(() => {
    dismissKeyboard();
    void handleVerify();
  }, [dismissKeyboard, handleVerify]);

  const handleResendHint = () => {
    Alert.alert(
      "Ask the client to resend",
      "The customer can generate a new verification code from their booking in the Serveaso app. Ask them to open today's visit and tap to show or resend the code."
    );
  };

  const canVerify = otpValue.trim().length === OTP_LENGTH && !verifying && !verifiedSuccess;
  const progressRatio = otpValue.length / OTP_LENGTH;
  const cardWidth = Math.min(windowWidth - 40, 400);
  const otpDigits = Array.from({ length: OTP_LENGTH }, (_, index) => otpValue[index] ?? "");

  const otpAccessoryBar = (
    <View style={styles.accessoryBar}>
      <TouchableOpacity onPress={dismissKeyboard} style={styles.accessoryButton}>
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
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleClose}
      >
        {Platform.OS === "ios" ? (
          <InputAccessoryView nativeID={OTP_ACCESSORY_ID}>{otpAccessoryBar}</InputAccessoryView>
        ) : null}

        <KeyboardAvoidingView
          style={styles.screen}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingTop: Math.max(insets.top, 16) + 12,
                paddingBottom: Math.max(insets.bottom, 20) + 16,
              },
              keyboardVisible && styles.scrollContentKeyboardOpen,
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.heroSection}>
              <View style={styles.heroIconBox}>
                <Icon name="shield-check" size={28} color={HOME_M3.secondary} />
              </View>
              <Text style={styles.heroTitle}>Service Verification</Text>
              <Text style={styles.heroSubtitle}>
                Enter the 6-digit code received by the client to verify the start of service.
              </Text>
            </View>

            <View style={[styles.card, { width: cardWidth }]}>
              {verifiedSuccess ? (
                <View style={styles.successBlock}>
                  <Icon name="check-circle" size={48} color="#10b981" />
                  <Text style={styles.successTitle}>Verified!</Text>
                  <Text style={styles.successSubtitle}>
                    Service verified successfully. This screen will close shortly.
                  </Text>
                </View>
              ) : (
                <>
                  {verifyError ? (
                    <View style={styles.errorBanner}>
                      <Icon name="alert-circle-outline" size={18} color="#b91c1c" />
                      <Text style={styles.errorText}>{verifyError}</Text>
                    </View>
                  ) : null}

                  <Animated.View
                    style={[styles.otpRow, { transform: [{ translateX: shakeAnim }] }]}
                  >
                    <Pressable onPress={focusInput} style={styles.otpBoxesPressable}>
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
                            <Text
                              style={[styles.otpBoxDigit, isFilled && styles.otpBoxDigitFilled]}
                            >
                              {digit}
                            </Text>
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

                  <View style={styles.progressSection}>
                    <Text style={styles.progressLabel}>
                      {otpValue.length} of {OTP_LENGTH} digits entered
                    </Text>
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${progressRatio * 100}%` }]} />
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.verifyButton,
                      canVerify ? styles.verifyButtonEnabled : styles.verifyButtonDisabled,
                    ]}
                    onPress={handleVerifyPress}
                    disabled={!canVerify}
                    activeOpacity={0.9}
                  >
                    {verifying ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <View style={styles.verifyButtonInner}>
                        <Text style={styles.verifyButtonText}>Verify Service</Text>
                        <Icon name="chevron-right" size={20} color="#ffffff" />
                      </View>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleClose}
                    disabled={verifying}
                    style={styles.cancelLinkBtn}
                  >
                    <Text style={styles.cancelLinkText}>Cancel & Back</Text>
                  </TouchableOpacity>

                  <Text style={styles.resendText}>
                    Didn&apos;t get a code?{" "}
                    <Text style={styles.resendLink} onPress={handleResendHint}>
                      Ask client to resend
                    </Text>
                  </Text>

                  {Platform.OS === "android" && keyboardVisible ? otpAccessoryBar : null}
                </>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: HOME_M3.surface,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  scrollContentKeyboardOpen: {
    justifyContent: "flex-start",
  },
  heroSection: {
    alignItems: "center",
    marginBottom: 28,
    maxWidth: 340,
  },
  heroIconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: HOME_M3.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: HOME_M3.outlineVariant,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: HOME_M3.onSurface,
    letterSpacing: -0.4,
    textAlign: "center",
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: HOME_M3.onSurfaceVariant,
    textAlign: "center",
  },
  card: {
    backgroundColor: HOME_M3.surfaceContainerLowest,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: HOME_M3.outlineVariant,
    padding: 20,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
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
  errorText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: "#b91c1c",
    fontWeight: "600",
  },
  otpRow: {
    position: "relative",
    marginBottom: 16,
  },
  otpBoxesPressable: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  otpBox: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: HOME_M3.outlineVariant,
    backgroundColor: HOME_M3.surfaceContainerLow,
    alignItems: "center",
    justifyContent: "center",
  },
  otpBoxFilled: {
    borderColor: HOME_M3.secondary,
    backgroundColor: HOME_M3.surfaceContainerLowest,
  },
  otpBoxActive: {
    borderColor: HOME_M3.secondary,
    borderWidth: 2,
    backgroundColor: "#ffffff",
  },
  otpBoxError: {
    borderColor: "#f87171",
    backgroundColor: "#fef2f2",
  },
  otpBoxDigit: {
    fontSize: 22,
    fontWeight: "700",
    color: HOME_M3.outlineVariant,
  },
  otpBoxDigitFilled: {
    color: HOME_M3.onSurface,
  },
  hiddenInput: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0,
    color: "transparent",
  },
  progressSection: {
    marginBottom: 18,
  },
  progressLabel: {
    fontSize: 13,
    color: HOME_M3.onSurfaceVariant,
    marginBottom: 8,
    fontWeight: "500",
  },
  progressTrack: {
    height: 4,
    borderRadius: 999,
    backgroundColor: HOME_M3.outlineVariant,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: HOME_M3.secondary,
  },
  verifyButton: {
    minHeight: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  verifyButtonEnabled: {
    backgroundColor: HOME_M3.primary,
  },
  verifyButtonDisabled: {
    backgroundColor: "#94a3b8",
  },
  verifyButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
  cancelLinkBtn: {
    alignItems: "center",
    paddingVertical: 8,
    marginBottom: 16,
  },
  cancelLinkText: {
    fontSize: 15,
    fontWeight: "600",
    color: HOME_M3.secondary,
  },
  resendText: {
    fontSize: 13,
    color: HOME_M3.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 20,
  },
  resendLink: {
    color: HOME_M3.secondary,
    fontWeight: "700",
  },
  successBlock: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 10,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#059669",
  },
  successSubtitle: {
    fontSize: 14,
    color: HOME_M3.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 20,
  },
  accessoryBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: HOME_M3.surfaceContainerLowest,
    borderTopWidth: 1,
    borderTopColor: HOME_M3.outlineVariant,
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
    color: HOME_M3.onSurfaceVariant,
  },
  accessoryDoneText: {
    fontSize: 17,
    fontWeight: "600",
    color: HOME_M3.secondary,
  },
  accessoryVerifyButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: HOME_M3.secondary,
    minWidth: 72,
    alignItems: "center",
  },
  accessoryVerifyDisabled: {
    backgroundColor: HOME_M3.outlineVariant,
  },
  accessoryVerifyText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
  },
  accessoryVerifyTextDisabled: {
    color: "#94a3b8",
  },
});

export default OtpVerificationDialog;
