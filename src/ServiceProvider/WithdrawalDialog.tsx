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
} from "react-native";
// import { useToast } from "../hooks/use-toast"; // You'll need to adapt this hook for React Native
import PaymentInstance from "../services/paymentInstance";
import { useToast } from "../hooks/useToast";
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const { toast } = useToast(); // Replace with React Native toast/showAlert
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
    // Allow only numbers and decimal point
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
      // Use Alert.alert or your toast implementation
      Alert.alert(t('common.error'), t('withdrawal.error.missingId'));
      return;
    }

    if (!isValidAmount) {
      Alert.alert(
        t('withdrawal.invalidAmount'),
        t('withdrawal.amountRange', { balance: availableBalance.toLocaleString("en-IN") })
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
          t('common.success'),
          t('withdrawal.success', { amount: numericAmount.toLocaleString("en-IN") })
        );

        // Call success callback if provided
        if (onWithdrawalSuccess) {
          onWithdrawalSuccess();
        }

        // Close modal
        handleClose();
      } else {
        throw new Error(t('withdrawal.error.generic'));
      }
    } catch (error: any) {
      let errorMessage = t('withdrawal.error.generic');

      if (error.response) {
        if (error.response.status === 400) {
          errorMessage = error.response.data?.message || t('withdrawal.error.invalidRequest');
        } else if (error.response.status === 402) {
          errorMessage = t('withdrawal.error.insufficientBalance');
        } else if (error.response.status === 422) {
          errorMessage = t('withdrawal.error.validationError');
        } else if (error.response.status === 500) {
          errorMessage = t('withdrawal.error.serverError');
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert(t('withdrawal.title'), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAmount("");
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
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerIcon}>💰</Text>
              <Text style={styles.headerTitle}>{t('withdrawal.title')}</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <Text style={styles.subtitle}>
              {t('withdrawal.subtitle')}
            </Text>

            {/* Available Balance Card */}
            <View style={styles.balanceCard}>
              <View style={styles.balanceRow}>
                <View>
                  <Text style={styles.balanceLabel}>{t('withdrawal.availableBalance')}</Text>
                  <View style={styles.balanceAmountContainer}>
                    <Text style={styles.rupeeIcon}>{t('common.currency')}</Text>
                    <Text style={styles.balanceAmount}>
                      {availableBalance.toLocaleString("en-IN")}
                    </Text>
                  </View>
                </View>
                <View style={styles.minWithdrawalContainer}>
                  <Text style={styles.balanceLabel}>{t('withdrawal.minWithdrawal')}</Text>
                  <View style={styles.balanceAmountContainer}>
                    <Text style={styles.smallRupeeIcon}>{t('common.currency')}</Text>
                    <Text style={styles.minWithdrawalAmount}>{minWithdrawal}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Amount Input Section */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>{t('withdrawal.enterAmount')}</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.currencySymbol}>{t('common.currency')}</Text>
                <TextInput
                  style={styles.amountInput}
                  value={amount}
                  onChangeText={handleAmountChange}
                  placeholder="0.00"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="decimal-pad"
                />
                <TouchableOpacity
                  style={styles.maxButton}
                  onPress={handleMaxAmount}
                >
                  <Text style={styles.maxButtonText}>{t('withdrawal.max')}</Text>
                </TouchableOpacity>
              </View>

              {/* Validation Messages */}
              {amount && !isValidAmount && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorIcon}>⚠️</Text>
                  <Text style={styles.errorText}>
                    {numericAmount > availableBalance
                      ? t('withdrawal.amountExceeds', { balance: availableBalance.toLocaleString("en-IN") })
                      : t('withdrawal.amountMustBeGreater')}
                  </Text>
                </View>
              )}

              {/* Summary Card */}
              {isValidAmount && (
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryTitle}>{t('withdrawal.summary')}</Text>
                  <View style={styles.summaryContent}>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>{t('withdrawal.withdrawalAmount')}</Text>
                      <Text style={styles.summaryValue}>
                        {t('common.currency')}{numericAmount.toLocaleString("en-IN")}
                      </Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>{t('withdrawal.remainingBalance')}</Text>
                      <Text style={styles.remainingBalance}>
                        {t('common.currency')}{(availableBalance - numericAmount).toLocaleString("en-IN")}
                      </Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.summaryRow}>
                      <Text style={styles.processingLabel}>{t('withdrawal.processingTime')}</Text>
                      <Text style={styles.processingValue}>{t('withdrawal.processingTimeValue')}</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Payout Method Info */}
            <View style={styles.payoutCard}>
              <View style={styles.payoutRow}>
                <View style={styles.payoutIconContainer}>
                  <Text style={styles.payoutIcon}>🏦</Text>
                </View>
                <View style={styles.payoutInfo}>
                  <Text style={styles.payoutTitle}>{t('withdrawal.payoutMethod')}</Text>
                  <Text style={styles.payoutDescription}>
                    {t('withdrawal.payoutDescription')}
                  </Text>
                </View>
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
              <Text style={styles.cancelButtonText}>{t('withdrawal.cancel')}</Text>
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
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.withdrawButtonText}>{t('withdrawal.withdraw')}</Text>
              )}
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
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerIcon: {
    fontSize: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  closeButton: {
    padding: 4,
  },
  closeIcon: {
    fontSize: 24,
    color: "#6B7280",
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 16,
  },
  balanceCard: {
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    marginBottom: 20,
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1E40AF",
    marginBottom: 4,
  },
  balanceAmountContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rupeeIcon: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E3A8A",
    marginRight: 2,
  },
  smallRupeeIcon: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E3A8A",
    marginRight: 2,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E3A8A",
  },
  minWithdrawalContainer: {
    alignItems: "flex-end",
  },
  minWithdrawalAmount: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E3A8A",
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    height: 56,
    marginBottom: 8,
  },
  currencySymbol: {
    fontSize: 28,
    fontWeight: "500",
    color: "#6B7280",
    marginLeft: 16,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: "500",
    color: "#111827",
    height: "100%",
    paddingVertical: 0,
  },
  maxButton: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#93C5FD",
  },
  maxButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1D4ED8",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  errorIcon: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#DC2626",
    flex: 1,
  },
  summaryCard: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 12,
  },
  summaryContent: {
    gap: 8,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 14,
    color: "#4B5563",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  remainingBalance: {
    fontSize: 14,
    fontWeight: "600",
    color: "#059669",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 8,
  },
  processingLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  processingValue: {
    fontSize: 12,
    fontWeight: "500",
    color: "#374151",
  },
  payoutCard: {
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    marginBottom: 20,
  },
  payoutRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  payoutIconContainer: {
    backgroundColor: "#FFFFFF",
    padding: 8,
    borderRadius: 8,
  },
  payoutIcon: {
    fontSize: 20,
  },
  payoutInfo: {
    flex: 1,
  },
  payoutTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1E40AF",
  },
  payoutDescription: {
    fontSize: 12,
    color: "#1D4ED8",
    marginTop: 4,
    lineHeight: 16,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
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
  withdrawButton: {
    backgroundColor: "#2563EB",
  },
  disabledButton: {
    backgroundColor: "#D1D5DB",
  },
  withdrawButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#FFFFFF",
  },
});

export default WithdrawalDialog;