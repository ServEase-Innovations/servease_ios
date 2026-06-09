/* eslint-disable */
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Platform,
  useWindowDimensions,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { BOOKING_HEADER_GRADIENT } from "../theme/brandColors";

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
  const verificationCompletedRef = useRef(false);
  const inputRef = useRef<TextInput>(null);

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

  // Reset ref when dialog opens
  useEffect(() => {
    if (open) {
      verificationCompletedRef.current = false;
      setVerifyError(null);
      setOtpValue("");
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [open]);

  // Handle successful verification completion
  useEffect(() => {
    if (!verifying && verificationCompletedRef.current) {
      const timer = setTimeout(() => {
        handleClose();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [verifying]);

  const handleVerify = async () => {
    if (!otpValue.trim()) return;

    setVerifyError(null);
    try {
      await onVerify(otpValue.trim());
      verificationCompletedRef.current = true;
    } catch (err) {
      verificationCompletedRef.current = false;
      setVerifyError(getVerifyErrorMessage(err));
    }
  };

  const handleClose = () => {
    setOtpValue("");
    setVerifyError(null);
    onOpenChange(false);
  };

  const handleOtpChange = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, "");
    setOtpValue(numericText);
    if (verifyError) setVerifyError(null);
  };

  // Responsive modal width
  const modalWidth = Math.min(windowWidth * 0.9, 420);

  return (
    <Modal
      visible={open}
      animationType="fade"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { width: modalWidth }]}>
          
          {/* Header with BOOKING_HEADER_GRADIENT */}
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
              Enter the verification code to confirm service completion
            </Text>
          </LinearGradient>

          <View style={styles.content}>
            {/* Booking Info Card with Gradient */}
            {bookingInfo && (
              <LinearGradient
                colors={['#eff6ff', '#dbeafe']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.bookingInfoCard}
              >
                <View style={styles.bookingInfoIcon}>
                  <Icon name="calendar-check" size={20} color="#1e40af" />
                </View>
                <View style={styles.bookingInfoText}>
                  <Text style={styles.bookingInfoTitle}>
                    Service for {bookingInfo.clientName || 'Client'}
                  </Text>
                  <Text style={styles.bookingInfoSubtitle}>
                    {bookingInfo.service || 'Service'} • #{bookingInfo.bookingId || 'N/A'}
                  </Text>
                </View>
              </LinearGradient>
            )}
            
            {verifyError ? (
              <View style={styles.errorBanner} accessibilityRole="alert">
                <Icon name="alert-circle" size={18} color="#b91c1c" />
                <Text style={styles.errorText}>{verifyError}</Text>
              </View>
            ) : null}

            {/* OTP Section */}
            <View style={styles.otpSection}>
              <View style={styles.instructionIconContainer}>
                <Icon name="cellphone-key" size={20} color="#3b82f6" />
                <Text style={styles.instructions}>
                  Please enter the 6-digit verification code sent to your registered mobile number
                </Text>
              </View>
              
              <View style={styles.otpInputContainer}>
                <View style={styles.otpInputWrapper}>
                  <TextInput
                    ref={inputRef}
                    placeholder="000000"
                    placeholderTextColor="#cbd5e1"
                    value={otpValue}
                    onChangeText={handleOtpChange}
                    keyboardType="number-pad"
                    maxLength={6}
                    style={styles.otpInput}
                    editable={!verifying}
                    selectionColor="#3B82F6"
                  />
                  {otpValue.length > 0 && (
                    <View style={styles.inputIndicator}>
                      <Icon name="check-circle" size={16} color="#10b981" />
                    </View>
                  )}
                </View>
                
                {/* OTP Dots Indicator */}
                <View style={styles.otpDotsContainer}>
                  {[1, 2, 3, 4, 5, 6].map((index) => (
                    <View
                      key={index}
                      style={[
                        styles.otpDot,
                        otpValue.length >= index && styles.otpDotFilled,
                        otpValue.length + 1 === index && styles.otpDotActive,
                      ]}
                    />
                  ))}
                </View>
              </View>
              
              <View style={styles.verificationNoteContainer}>
                <Icon name="information" size={14} color="#94a3b8" />
                <Text style={styles.verificationNote}>
                  This code verifies that the service has been completed successfully
                </Text>
              </View>
            </View>
            
            {/* Action Buttons */}
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
                  (verifying || !otpValue.trim() || otpValue.length < 4) && styles.disabledButton,
                ]}
                onPress={handleVerify}
                disabled={verifying || !otpValue.trim() || otpValue.length < 4}
              >
                <LinearGradient
                  colors={(!verifying && otpValue.trim() && otpValue.length >= 4) ? [...BOOKING_HEADER_GRADIENT] : ['#94a3b8', '#64748b']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.verifyButtonGradient}
                >
                  {verifying ? (
                    <View style={styles.verifyingContainer}>
                      <ActivityIndicator color="#FFFFFF" size="small" />
                      <Text style={styles.verifyingText}>Verifying...</Text>
                    </View>
                  ) : (
                    <View style={styles.verifyButtonContent}>
                      <Icon name="check-decagram" size={18} color="#ffffff" />
                      <Text style={styles.verifyButtonText}>Verify Code</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
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
    fontWeight: "500",
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
    marginBottom: 24,
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
  otpInputContainer: {
    marginBottom: 16,
  },
  otpInputWrapper: {
    position: "relative",
  },
  otpInput: {
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 24,
    textAlign: "center",
    letterSpacing: 12,
    color: "#0f172a",
    fontWeight: "700",
    backgroundColor: "#ffffff",
  },
  inputIndicator: {
    position: "absolute",
    right: 16,
    top: "50%",
    transform: [{ translateY: -8 }],
  },
  otpDotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginTop: 16,
  },
  otpDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#e2e8f0",
  },
  otpDotFilled: {
    backgroundColor: "#3b82f6",
  },
  otpDotActive: {
    backgroundColor: "#93c5fd",
    transform: [{ scale: 1.2 }],
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
    marginTop: 8,
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
    opacity: 0.6,
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