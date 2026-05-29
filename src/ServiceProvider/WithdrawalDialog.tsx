/* eslint-disable */
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  useWindowDimensions,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import PaymentInstance from "../services/paymentInstance";
import { BOOKING_HEADER_GRADIENT } from "../theme/brandColors";

interface WithdrawalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceProviderId: number | null;
  availableBalance: number;
  onWithdrawalSuccess?: () => void;
}

const WithdrawalDialog: React.FC<WithdrawalDialogProps> = ({
  open,
  onOpenChange,
  serviceProviderId,
  availableBalance,
  onWithdrawalSuccess,
}) => {
  const { width: windowWidth } = useWindowDimensions();
  const [amount, setAmount] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setAmount("");
    }
  }, [open]);

  const numericAmount = parseFloat(amount) || 0;
  const isValidAmount = numericAmount > 0 && numericAmount <= availableBalance;
  const minWithdrawal = 500;

  const handleAmountChange = (value: string) => {
    const regex = /^\d*\.?\d*$/;
    if (regex.test(value)) {
      setAmount(value);
    }
  };

  const handleMaxAmount = () => {
    setAmount(availableBalance.toString());
  };

  const handleConfirmWithdrawal = async () => {
    if (!serviceProviderId) {
      Alert.alert('Error', 'Service provider ID not found');
      return;
    }

    if (!isValidAmount) {
      Alert.alert(
        'Invalid Amount',
        `Please enter an amount between 1 and ${availableBalance.toLocaleString("en-IN")}`
      );
      return;
    }

    setLoading(true);
    try {
      const response = await PaymentInstance.post(
        `/api/service-providers/${serviceProviderId}/withdraw`,
        {
          amount: numericAmount,
          payout_mode: "BANK",
        }
      );

      if (response.status === 200 || response.status === 201) {
        Alert.alert(
          'Success',
          `Withdrawal request of ₹${numericAmount.toLocaleString("en-IN")} has been submitted successfully!`
        );

        if (onWithdrawalSuccess) {
          onWithdrawalSuccess();
        }

        handleClose();
      } else {
        throw new Error('Withdrawal failed. Please try again.');
      }
    } catch (error: any) {
      let errorMessage = 'Failed to process withdrawal. Please try again.';

      if (error.response) {
        if (error.response.status === 400) {
          errorMessage = error.response.data?.message || 'Invalid withdrawal request';
        } else if (error.response.status === 402) {
          errorMessage = 'Insufficient balance for withdrawal';
        } else if (error.response.status === 422) {
          errorMessage = 'Please check the amount and try again';
        } else if (error.response.status === 500) {
          errorMessage = 'Server error. Please try again later';
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Withdrawal Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAmount("");
    onOpenChange(false);
  };

  // Responsive modal width
  const modalWidth = Math.min(windowWidth * 0.92, 450);

  return (
    <Modal
      visible={open}
      animationType="slide"
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
            style={styles.gradientHeader}
          >
            <View style={styles.header}>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Icon name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Withdraw Funds</Text>
              <View style={styles.headerRight} />
            </View>
            <Text style={styles.headerSubtitle}>
              Request a withdrawal from your available balance
            </Text>
          </LinearGradient>

          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Available Balance Card with Gradient */}
            <LinearGradient
              colors={['#eff6ff', '#dbeafe']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.balanceCard}
            >
              <View style={styles.balanceRow}>
                <View style={styles.balanceLeft}>
                  <Text style={styles.balanceLabel}>Available Balance</Text>
                  <View style={styles.balanceAmountContainer}>
                    <Text style={styles.rupeeIcon}>₹</Text>
                    <Text style={styles.balanceAmount}>
                      {availableBalance.toLocaleString("en-IN")}
                    </Text>
                  </View>
                </View>
                <View style={styles.minWithdrawalContainer}>
                  <Text style={styles.balanceLabel}>Minimum Withdrawal</Text>
                  <View style={styles.balanceAmountContainer}>
                    <Text style={styles.smallRupeeIcon}>₹</Text>
                    <Text style={styles.minWithdrawalAmount}>{minWithdrawal}</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>

            {/* Amount Input Section */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Enter Amount</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={styles.amountInput}
                  value={amount}
                  onChangeText={handleAmountChange}
                  placeholder="0.00"
                  placeholderTextColor="#94a3b8"
                  keyboardType="decimal-pad"
                />
                <TouchableOpacity
                  style={styles.maxButton}
                  onPress={handleMaxAmount}
                >
                  <Text style={styles.maxButtonText}>MAX</Text>
                </TouchableOpacity>
              </View>

              {/* Validation Messages */}
              {amount && !isValidAmount && (
                <View style={styles.errorContainer}>
                  <Icon name="alert-circle" size={16} color="#dc2626" />
                  <Text style={styles.errorText}>
                    {numericAmount > availableBalance
                      ? `Amount exceeds available balance of ₹${availableBalance.toLocaleString("en-IN")}`
                      : "Amount must be greater than 0"}
                  </Text>
                </View>
              )}

              {/* Summary Card */}
              {isValidAmount && (
                <LinearGradient
                  colors={['#f8fafc', '#f1f5f9']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.summaryCard}
                >
                  <Text style={styles.summaryTitle}>Transaction Summary</Text>
                  <View style={styles.summaryContent}>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Withdrawal Amount</Text>
                      <Text style={styles.summaryValue}>
                        ₹{numericAmount.toLocaleString("en-IN")}
                      </Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Remaining Balance</Text>
                      <Text style={styles.remainingBalance}>
                        ₹{(availableBalance - numericAmount).toLocaleString("en-IN")}
                      </Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.summaryRow}>
                      <Text style={styles.processingLabel}>Processing Time</Text>
                      <Text style={styles.processingValue}>2-3 Business Days</Text>
                    </View>
                  </View>
                </LinearGradient>
              )}
            </View>

            {/* Payout Method Info with Gradient */}
            <LinearGradient
              colors={['#eff6ff', '#dbeafe']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.payoutCard}
            >
              <View style={styles.payoutRow}>
                <LinearGradient
                  colors={['#ffffff', '#f8fafc']}
                  style={styles.payoutIconContainer}
                >
                  <Icon name="bank" size={24} color="#1e40af" />
                </LinearGradient>
                <View style={styles.payoutInfo}>
                  <Text style={styles.payoutTitle}>Payout Method</Text>
                  <Text style={styles.payoutDescription}>
                    Funds will be transferred to your registered bank account
                  </Text>
                </View>
              </View>
            </LinearGradient>

            {/* Important Notes */}
            <View style={styles.notesCard}>
              <View style={styles.notesHeader}>
                <Icon name="information" size={20} color="#3b82f6" />
                <Text style={styles.notesTitle}>Important Notes</Text>
              </View>
              <View style={styles.noteItem}>
                <View style={styles.noteBullet} />
                <Text style={styles.noteText}>Minimum withdrawal amount is ₹500</Text>
              </View>
              <View style={styles.noteItem}>
                <View style={styles.noteBullet} />
                <Text style={styles.noteText}>Withdrawals are processed within 2-3 business days</Text>
              </View>
              <View style={styles.noteItem}>
                <View style={styles.noteBullet} />
                <Text style={styles.noteText}>A nominal processing fee may apply</Text>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.withdrawButton,
                (!isValidAmount || loading) && styles.disabledButton,
              ]}
              onPress={handleConfirmWithdrawal}
              disabled={!isValidAmount || loading}
            >
              <LinearGradient
                colors={isValidAmount && !loading ? [...BOOKING_HEADER_GRADIENT] : ['#94a3b8', '#64748b']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.withdrawButtonGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.withdrawButtonText}>Request Withdrawal</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    maxHeight: "90%",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  gradientHeader: {
    paddingTop: Platform.OS === "ios" ? 20 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "center",
    flex: 1,
  },
  headerRight: {
    width: 36,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    lineHeight: 18,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  balanceCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  balanceLeft: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#1e40af",
    marginBottom: 6,
  },
  balanceAmountContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rupeeIcon: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1e3a8a",
    marginRight: 4,
  },
  smallRupeeIcon: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e3a8a",
    marginRight: 2,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1e3a8a",
  },
  minWithdrawalContainer: {
    alignItems: "flex-end",
  },
  minWithdrawalAmount: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e3a8a",
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    height: 64,
    marginBottom: 12,
    backgroundColor: "#ffffff",
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: "600",
    color: "#64748b",
    marginLeft: 18,
    marginRight: 10,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: "600",
    color: "#0f172a",
    height: "100%",
    paddingVertical: 0,
  },
  maxButton: {
    backgroundColor: "#dbeafe",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 14,
  },
  maxButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1d4ed8",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#dc2626",
    flex: 1,
  },
  summaryCard: {
    borderRadius: 16,
    padding: 18,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 14,
  },
  summaryContent: {
    gap: 10,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 13,
    color: "#64748b",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },
  remainingBalance: {
    fontSize: 14,
    fontWeight: "700",
    color: "#059669",
  },
  divider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 8,
  },
  processingLabel: {
    fontSize: 12,
    color: "#94a3b8",
  },
  processingValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  payoutCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  payoutRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  payoutIconContainer: {
    padding: 10,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  payoutInfo: {
    flex: 1,
  },
  payoutTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e40af",
    marginBottom: 2,
  },
  payoutDescription: {
    fontSize: 12,
    color: "#2563eb",
    lineHeight: 16,
  },
  notesCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  notesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  notesTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
  },
  noteItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  noteBullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#3b82f6",
  },
  noteText: {
    fontSize: 12,
    color: "#64748b",
    flex: 1,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    backgroundColor: "#ffffff",
  },
  button: {
    flex: 1,
    marginHorizontal: 6,
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
  withdrawButton: {
    overflow: "hidden",
  },
  withdrawButtonGradient: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: {
    opacity: 0.6,
  },
  withdrawButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },
});

export default WithdrawalDialog;