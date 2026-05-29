/* eslint-disable */
import React, { useState, useEffect, useMemo } from "react";
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
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import PaymentInstance from "../services/paymentInstance";
import { BRAND, PRIMARY_BUTTON_GRADIENT } from "../theme/brandColors";
import LinearGradient from "react-native-linear-gradient";

const MIN_WITHDRAWAL = 500;
const TDS_RATE = 0.01;

interface WithdrawalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceProviderId: number | null;
  availableBalance: number;
  onWithdrawalSuccess?: () => void;
}

const formatInr = (value: number) =>
  `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const WithdrawalDialog: React.FC<WithdrawalDialogProps> = ({
  open,
  onOpenChange,
  serviceProviderId,
  availableBalance,
  onWithdrawalSuccess,
}) => {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) setAmount("");
  }, [open]);

  const numericAmount = parseFloat(amount) || 0;
  const canWithdraw = availableBalance >= MIN_WITHDRAWAL;
  const tdsAmount = useMemo(
    () => Number((numericAmount * TDS_RATE).toFixed(2)),
    [numericAmount]
  );
  const netAmount = useMemo(
    () => Math.max(0, numericAmount - tdsAmount),
    [numericAmount, tdsAmount]
  );

  const validationMessage = useMemo(() => {
    if (!amount) return null;
    if (numericAmount <= 0) return "Enter an amount greater than zero";
    if (numericAmount < MIN_WITHDRAWAL) return `Minimum withdrawal is ${formatInr(MIN_WITHDRAWAL)}`;
    if (numericAmount > availableBalance) {
      return `Amount exceeds available balance of ${formatInr(availableBalance)}`;
    }
    return null;
  }, [amount, numericAmount, availableBalance]);

  const isValidAmount = !validationMessage && numericAmount >= MIN_WITHDRAWAL;

  const handleAmountChange = (value: string) => {
    if (/^\d*\.?\d*$/.test(value)) setAmount(value);
  };

  const applyAmount = (value: number) => {
    const clamped = Math.min(Math.max(0, value), availableBalance);
    setAmount(String(Math.floor(clamped)));
  };

  const quickAmounts = useMemo(() => {
    const half = Math.floor(availableBalance / 2);
    const options = [
      { label: formatInr(MIN_WITHDRAWAL), value: MIN_WITHDRAWAL },
      { label: formatInr(1000), value: 1000 },
    ];
    if (half >= MIN_WITHDRAWAL && half !== 1000 && half !== MIN_WITHDRAWAL) {
      options.push({ label: "50%", value: half });
    }
    options.push({ label: "Max", value: availableBalance });
    return options.filter((opt, idx, arr) => {
      if (opt.value > availableBalance || opt.value < MIN_WITHDRAWAL) return false;
      return arr.findIndex((o) => o.value === opt.value) === idx;
    });
  }, [availableBalance]);

  const handleConfirmWithdrawal = async () => {
    if (!serviceProviderId) {
      Alert.alert("Error", "Service provider ID not found");
      return;
    }
    if (!isValidAmount) {
      Alert.alert("Invalid amount", validationMessage || "Please check the amount and try again");
      return;
    }

    setLoading(true);
    try {
      const response = await PaymentInstance.post(
        `/api/service-providers/${serviceProviderId}/withdraw`,
        { amount: numericAmount, payout_mode: "BANK" }
      );

      if (response.status === 200 || response.status === 201) {
        Alert.alert(
          "Request submitted",
          `Your withdrawal of ${formatInr(numericAmount)} has been submitted. Funds typically arrive in 2–3 business days.`
        );
        onWithdrawalSuccess?.();
        handleClose();
      } else {
        throw new Error("Withdrawal failed. Please try again.");
      }
    } catch (error: any) {
      let errorMessage = "Failed to process withdrawal. Please try again.";
      if (error.response) {
        errorMessage =
          error.response.data?.message ||
          error.response.data?.error ||
          errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }
      Alert.alert("Withdrawal failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAmount("");
    onOpenChange(false);
  };

  return (
    <Modal visible={open} animationType="slide" onRequestClose={handleClose}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.sheet}>
            <View style={styles.headerAccent} />
            <View style={styles.header}>
              <View style={styles.headerIcon}>
                <MaterialIcon name="account-balance-wallet" size={22} color={BRAND.accent} />
              </View>
              <View style={styles.headerTextCol}>
                <Text style={styles.headerTitle}>Request Withdrawal</Text>
                <Text style={styles.headerSubtitle}>Transfer earnings to your bank account</Text>
              </View>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton} hitSlop={8}>
                <MaterialIcon name="close" size={22} color={BRAND.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.content}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Balance hero */}
              <View style={styles.balanceCard}>
                <View style={styles.balanceCardTop}>
                  <Text style={styles.balanceEyebrow}>Available to withdraw</Text>
                  <Text
                    style={[
                      styles.balanceValue,
                      availableBalance < 0 && styles.balanceValueNegative,
                    ]}
                  >
                    {formatInr(availableBalance)}
                  </Text>
                </View>
                <View style={styles.balanceMetaRow}>
                  <View style={styles.balanceMetaPill}>
                    <MaterialIcon name="info-outline" size={14} color={BRAND.accent} />
                    <Text style={styles.balanceMetaText}>Min {formatInr(MIN_WITHDRAWAL)}</Text>
                  </View>
                  <View style={styles.balanceMetaPill}>
                    <MaterialIcon name="schedule" size={14} color={BRAND.accent} />
                    <Text style={styles.balanceMetaText}>2–3 business days</Text>
                  </View>
                </View>
              </View>

              {!canWithdraw ? (
                <View style={styles.blockedCard}>
                  <MaterialIcon name="lock" size={28} color={BRAND.textMuted} />
                  <Text style={styles.blockedTitle}>
                    {availableBalance < 0 ? "Negative balance" : "Not enough to withdraw"}
                  </Text>
                  <Text style={styles.blockedText}>
                    {availableBalance < 0
                      ? "Your available balance is negative. Please contact support before requesting a withdrawal."
                      : `You need at least ${formatInr(MIN_WITHDRAWAL)} available to request a withdrawal.`}
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={styles.sectionLabel}>Withdrawal amount</Text>
                  <View
                    style={[
                      styles.inputWrap,
                      validationMessage && styles.inputWrapError,
                      isValidAmount && styles.inputWrapValid,
                    ]}
                  >
                    <Text style={styles.currencySymbol}>₹</Text>
                    <TextInput
                      style={styles.amountInput}
                      value={amount}
                      onChangeText={handleAmountChange}
                      placeholder="0"
                      placeholderTextColor="#94a3b8"
                      keyboardType="decimal-pad"
                      returnKeyType="done"
                    />
                    <TouchableOpacity style={styles.maxChip} onPress={() => applyAmount(availableBalance)}>
                      <Text style={styles.maxChipText}>MAX</Text>
                    </TouchableOpacity>
                  </View>

                  {validationMessage ? (
                    <View style={styles.errorRow}>
                      <MaterialIcon name="error-outline" size={16} color="#dc2626" />
                      <Text style={styles.errorText}>{validationMessage}</Text>
                    </View>
                  ) : null}

                  <View style={styles.quickRow}>
                    {quickAmounts.map((opt) => {
                      const selected = numericAmount === opt.value;
                      return (
                        <TouchableOpacity
                          key={opt.label}
                          style={[styles.quickChip, selected && styles.quickChipActive]}
                          onPress={() => applyAmount(opt.value)}
                        >
                          <Text
                            style={[styles.quickChipText, selected && styles.quickChipTextActive]}
                          >
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {isValidAmount ? (
                    <View style={styles.summaryCard}>
                      <Text style={styles.summaryTitle}>Payout summary</Text>
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Withdrawal amount</Text>
                        <Text style={styles.summaryValue}>{formatInr(numericAmount)}</Text>
                      </View>
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>TDS (1%)</Text>
                        <Text style={styles.summaryMuted}>− {formatInr(tdsAmount)}</Text>
                      </View>
                      <View style={styles.summaryDivider} />
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabelStrong}>You'll receive</Text>
                        <Text style={styles.summaryNet}>{formatInr(netAmount)}</Text>
                      </View>
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Balance after</Text>
                        <Text style={styles.summaryRemaining}>
                          {formatInr(availableBalance - numericAmount)}
                        </Text>
                      </View>
                    </View>
                  ) : null}
                </>
              )}

              <View style={styles.payoutCard}>
                <View style={styles.payoutIcon}>
                  <MaterialIcon name="account-balance" size={22} color={BRAND.accent} />
                </View>
                <View style={styles.payoutTextCol}>
                  <Text style={styles.payoutTitle}>Bank transfer</Text>
                  <Text style={styles.payoutDesc}>
                    Sent to your registered bank account via standard NEFT/IMPS processing.
                  </Text>
                </View>
              </View>

              <View style={styles.notesCard}>
                <MaterialIcon name="lightbulb-outline" size={18} color={BRAND.accent} />
                <Text style={styles.notesText}>
                  Withdrawals are reviewed automatically. You'll see the status under Withdrawal
                  history on your dashboard.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={handleClose}
                disabled={loading}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.submitWrap,
                  (!isValidAmount || loading || !canWithdraw) && styles.submitDisabled,
                ]}
                onPress={handleConfirmWithdrawal}
                disabled={!isValidAmount || loading || !canWithdraw}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={
                    isValidAmount && !loading && canWithdraw
                      ? [...PRIMARY_BUTTON_GRADIENT]
                      : ["#94a3b8", "#64748b"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitBtnGradient}
                />
                <View style={styles.submitBtnContent}>
                  {loading ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <>
                      <MaterialIcon name="send" size={18} color="#ffffff" />
                      <Text style={styles.submitBtnText} numberOfLines={1}>
                        Request withdrawal
                      </Text>
                    </>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BRAND.canvas,
  },
  flex: {
    flex: 1,
  },
  sheet: {
    flex: 1,
    backgroundColor: BRAND.canvas,
  },
  headerAccent: {
    height: 3,
    backgroundColor: BRAND.accent,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: BRAND.accentSoft,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.line,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: BRAND.surface,
    borderWidth: 1,
    borderColor: BRAND.line,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  headerTextCol: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: BRAND.text,
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: BRAND.textMuted,
    marginTop: 2,
    fontWeight: "500",
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BRAND.surface,
    borderWidth: 1,
    borderColor: BRAND.line,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 24,
    gap: 14,
  },
  balanceCard: {
    backgroundColor: BRAND.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BRAND.line,
    overflow: "hidden",
    shadowColor: BRAND.bookingNavy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  balanceCardTop: {
    padding: 16,
    backgroundColor: BRAND.accentSoft,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.line,
  },
  balanceEyebrow: {
    fontSize: 12,
    fontWeight: "600",
    color: BRAND.accent,
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: "800",
    color: BRAND.text,
    letterSpacing: -0.5,
  },
  balanceValueNegative: {
    color: "#dc2626",
  },
  balanceMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    padding: 12,
  },
  balanceMetaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: BRAND.canvas,
    borderWidth: 1,
    borderColor: BRAND.line,
  },
  balanceMetaText: {
    fontSize: 12,
    fontWeight: "600",
    color: BRAND.textMuted,
  },
  blockedCard: {
    alignItems: "center",
    padding: 24,
    borderRadius: 16,
    backgroundColor: BRAND.surface,
    borderWidth: 1,
    borderColor: BRAND.line,
    gap: 8,
  },
  blockedTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: BRAND.text,
    marginTop: 4,
  },
  blockedText: {
    fontSize: 13,
    color: BRAND.textMuted,
    textAlign: "center",
    lineHeight: 19,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: BRAND.text,
    marginBottom: -6,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BRAND.surface,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: BRAND.line,
    minHeight: 64,
    paddingRight: 8,
  },
  inputWrapError: {
    borderColor: "#fecaca",
    backgroundColor: "#fffbfb",
  },
  inputWrapValid: {
    borderColor: BRAND.accent,
  },
  currencySymbol: {
    fontSize: 28,
    fontWeight: "700",
    color: BRAND.textMuted,
    paddingLeft: 16,
    paddingRight: 4,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: "700",
    color: BRAND.text,
    paddingVertical: 0,
  },
  maxChip: {
    backgroundColor: BRAND.accentSoft,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: BRAND.line,
  },
  maxChipText: {
    fontSize: 12,
    fontWeight: "800",
    color: BRAND.accent,
    letterSpacing: 0.5,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: -6,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: "#dc2626",
    fontWeight: "500",
  },
  quickRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  quickChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: BRAND.surface,
    borderWidth: 1,
    borderColor: BRAND.line,
  },
  quickChipActive: {
    backgroundColor: BRAND.accent,
    borderColor: BRAND.accent,
  },
  quickChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: BRAND.textMuted,
  },
  quickChipTextActive: {
    color: "#ffffff",
  },
  summaryCard: {
    backgroundColor: BRAND.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 14,
    gap: 10,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: BRAND.text,
    marginBottom: 2,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 13,
    color: BRAND.textMuted,
  },
  summaryLabelStrong: {
    fontSize: 14,
    fontWeight: "700",
    color: BRAND.text,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "700",
    color: BRAND.text,
  },
  summaryMuted: {
    fontSize: 13,
    fontWeight: "600",
    color: BRAND.textMuted,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: BRAND.line,
    marginVertical: 2,
  },
  summaryNet: {
    fontSize: 16,
    fontWeight: "800",
    color: "#059669",
  },
  summaryRemaining: {
    fontSize: 13,
    fontWeight: "700",
    color: BRAND.accent,
  },
  payoutCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: BRAND.surface,
    borderWidth: 1,
    borderColor: BRAND.line,
  },
  payoutIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: BRAND.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  payoutTextCol: {
    flex: 1,
  },
  payoutTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: BRAND.text,
    marginBottom: 4,
  },
  payoutDesc: {
    fontSize: 12,
    lineHeight: 17,
    color: BRAND.textMuted,
  },
  notesCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: BRAND.accentSoft,
    borderWidth: 1,
    borderColor: BRAND.line,
  },
  notesText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: BRAND.textMuted,
    fontWeight: "500",
  },
  footer: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: Platform.OS === "ios" ? 18 : 16,
    borderTopWidth: 1,
    borderTopColor: BRAND.line,
    backgroundColor: BRAND.surface,
  },
  cancelBtn: {
    flex: 1,
    minHeight: 52,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.canvas,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: BRAND.textMuted,
  },
  submitWrap: {
    flex: 1.35,
    minHeight: 52,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    justifyContent: "center",
  },
  submitDisabled: {
    opacity: 0.55,
  },
  submitBtnGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  submitBtnContent: {
    minHeight: 52,
    paddingHorizontal: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffff",
    flexShrink: 1,
  },
});

export default WithdrawalDialog;
