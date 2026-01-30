/* eslint-disable */
import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from "react-native";

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
  const [otpValue, setOtpValue] = useState("");
  const verificationCompletedRef = useRef(false);
  const inputRef = useRef<TextInput>(null);

  // Reset ref when dialog opens
  useEffect(() => {
    if (open) {
      verificationCompletedRef.current = false;
      // Focus input when dialog opens
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [open]);

  // Handle successful verification completion
  useEffect(() => {
    // Only run when verifying changes from true to false AND we were previously verifying
    if (!verifying && verificationCompletedRef.current) {
      const timer = setTimeout(() => {
        handleClose();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [verifying]);

  const handleVerify = async () => {
    if (!otpValue.trim()) return;
    
    // Mark that verification is starting
    verificationCompletedRef.current = true;
    await onVerify(otpValue.trim());
  };

  const handleClose = () => {
    setOtpValue("");
    onOpenChange(false);
  };

  const handleOtpChange = (text: string) => {
    // Only allow numbers
    const numericText = text.replace(/[^0-9]/g, '');
    setOtpValue(numericText);
  };

  return (
    <Modal
      visible={open}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Verify OTP to Complete Service</Text>
              <TouchableOpacity 
                onPress={handleClose}
                style={styles.closeButton}
                disabled={verifying}
              >
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.content}>
            {bookingInfo && (
              <View style={styles.bookingInfoCard}>
                <Text style={styles.bookingInfoTitle}>
                  Service for {bookingInfo.clientName || "Client"}
                </Text>
                <Text style={styles.bookingInfoSubtitle}>
                  Booking ID: {bookingInfo.bookingId || "N/A"} • {bookingInfo.service || "Service"}
                </Text>
              </View>
            )}
            
            <View style={styles.otpSection}>
              <Text style={styles.instructions}>
                Please enter the OTP you received from the client to complete the service.
              </Text>
              
              <View style={styles.otpInputContainer}>
                <TextInput
                  ref={inputRef}
                  placeholder="Enter 6-digit OTP"
                  placeholderTextColor="#9CA3AF"
                  value={otpValue}
                  onChangeText={handleOtpChange}
                  keyboardType="number-pad"
                  maxLength={6}
                  style={styles.otpInput}
                  editable={!verifying}
                  selectionColor="#3B82F6"
                />
              </View>
              
              <Text style={styles.verificationNote}>
                Once verified, the service will be marked as completed and your earnings will be credited.
              </Text>
            </View>
            
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
                {verifying ? (
                  <View style={styles.verifyingContainer}>
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    <Text style={styles.verifyingText}>Verifying...</Text>
                  </View>
                ) : (
                  <Text style={styles.verifyButtonText}>Verify & Complete</Text>
                )}
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
    overflow: "hidden",
  },
  header: {
    backgroundColor: "#1E40AF",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    flex: 1,
  },
  closeButton: {
    padding: 4,
    marginLeft: 16,
  },
  closeIcon: {
    fontSize: 20,
    fontWeight: "300",
    color: "#FFFFFF",
  },
  content: {
    padding: 20,
  },
  bookingInfoCard: {
    backgroundColor: "#EFF6FF",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  bookingInfoTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1E40AF",
    marginBottom: 4,
  },
  bookingInfoSubtitle: {
    fontSize: 12,
    color: "#4B5563",
  },
  otpSection: {
    marginBottom: 24,
  },
  instructions: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 16,
    lineHeight: 20,
  },
  otpInputContainer: {
    marginBottom: 16,
  },
  otpInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 20,
    textAlign: "center",
    letterSpacing: 8,
    color: "#111827",
    fontWeight: "500",
    backgroundColor: "#FFFFFF",
  },
  verificationNote: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: "center",
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  verifyButton: {
    backgroundColor: "#3B82F6",
  },
  disabledButton: {
    backgroundColor: "#D1D5DB",
  },
  verifyButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  verifyingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  verifyingText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#FFFFFF",
    marginLeft: 8,
  },
});