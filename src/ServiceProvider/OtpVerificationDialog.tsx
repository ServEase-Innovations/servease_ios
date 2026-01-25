// OtpVerificationDialog.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { X } from 'lucide-react-native';

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
  const [otpValue, setOtpValue] = useState('');

  // Close dialog when verification completes successfully
  useEffect(() => {
    if (!verifying && open && otpValue) {
      // Small delay to allow user to see success state if needed
      const timer = setTimeout(() => {
        handleClose();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [verifying, open, otpValue]);

  const handleVerify = async () => {
    if (!otpValue.trim()) return;
    try {
      await onVerify(otpValue.trim());
      // Dialog will close automatically via the useEffect above
    } catch (error) {
      Alert.alert('Error', 'Failed to verify OTP');
    }
  };

  const handleClose = () => {
    setOtpValue('');
    onOpenChange(false);
  };

  return (
    <Modal
      visible={open}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Dialog Header */}
          <View style={styles.dialogHeader}>
            <Text style={styles.dialogTitle}>Verify OTP to Complete Service</Text>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              accessibilityLabel="Close"
            >
              <X size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Dialog Content */}
          <View style={styles.dialogContent}>
            {bookingInfo && (
              <View style={styles.bookingInfoContainer}>
                <Text style={styles.bookingInfoTitle}>
                  Service for {bookingInfo.clientName || 'Client'}
                </Text>
                <Text style={styles.bookingInfoSubtitle}>
                  Booking ID: {bookingInfo.bookingId || 'N/A'} • {bookingInfo.service || 'Service'}
                </Text>
              </View>
            )}

            <View style={styles.contentContainer}>
              <View style={styles.instructionContainer}>
                <Text style={styles.instructionText}>
                  Please enter the OTP you received from the client to complete the service.
                </Text>
                <TextInput
                  placeholder="Enter 6-digit OTP"
                  placeholderTextColor="#6b7280"
                  value={otpValue}
                  onChangeText={setOtpValue}
                  style={styles.otpInput}
                  maxLength={6}
                  keyboardType="number-pad"
                  editable={!verifying}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <Text style={styles.noteText}>
                Once verified, the service will be marked as completed and your earnings will be credited.
              </Text>
            </View>

            <View style={styles.buttonContainer}>
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
                  <>
                    <ActivityIndicator size="small" color="#fff" style={styles.spinner} />
                    <Text style={styles.verifyButtonText}>Verifying...</Text>
                  </>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dialogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  dialogTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  dialogContent: {
    padding: 20,
  },
  bookingInfoContainer: {
    backgroundColor: '#eff6ff',
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
  },
  bookingInfoTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e40af',
  },
  bookingInfoSubtitle: {
    fontSize: 12,
    color: '#4b5563',
    marginTop: 4,
  },
  contentContainer: {
    paddingVertical: 16,
  },
  instructionContainer: {
    marginBottom: 16,
  },
  instructionText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  otpInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    letterSpacing: 4,
    textAlign: 'center',
    backgroundColor: '#f9fafb',
    color: '#111827',
  },
  noteText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    minWidth: 120,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: 'transparent',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  verifyButton: {
    backgroundColor: '#3b82f6',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
    opacity: 0.7,
  },
  verifyButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  spinner: {
    marginRight: 8,
  },
});