// WithdrawalHistoryDialog.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  SafeAreaView,
  StyleSheet,
} from "react-native";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import PaymentInstance from "../services/paymentInstance";
import { BRAND } from "../theme/brandColors";

type FilterKey = "all" | "credit" | "debit";

interface LedgerEntry {
  ledger_id: string;
  engagement_id: string | null;
  amount: number;
  direction: "CREDIT" | "DEBIT";
  reason: "DAILY_EARNED" | "WITHDRAWAL" | "SERVICE_FEE" | "SECURITY_DEPOSIT" | "REFUND" | "OTHER";
  reference_type: string;
  reference_id: string;
  created_at: string;
}

interface PayoutHistoryResponse {
  success: boolean;
  serviceproviderid: string;
  summary: {
    total_earned: number;
    total_withdrawn: number;
    available_to_withdraw: number;
    wallet_balance: number;
    security_deposit_paid: boolean;
    security_deposit_amount: number;
  };
  ledger: LedgerEntry[];
  payouts?: Array<{
    payout_id: string;
    engagement_id: string;
    gross_amount: number;
    provider_fee: number;
    tds_amount: number;
    net_amount: number;
    payout_mode: string | null;
    status: string;
    created_at: string;
  }>;
}

interface WithdrawalHistoryDialogProps {
  visible: boolean;
  onClose: () => void;
  serviceProviderId: number | null;
}

const FILTER_TABS: { key: FilterKey; label: string; icon: string }[] = [
  { key: "all", label: "All", icon: "receipt-long" },
  { key: "credit", label: "Earnings", icon: "trending-up" },
  { key: "debit", label: "Withdrawals", icon: "trending-down" },
];

const formatInr = (amount: number, compact = false) =>
  `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: compact ? 0 : 2,
    maximumFractionDigits: compact ? 0 : 2,
  })}`;

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function getReasonMeta(reason: LedgerEntry["reason"]) {
  switch (reason) {
    case "DAILY_EARNED":
      return { label: "Service payment", icon: "payments", tone: "credit" as const };
    case "WITHDRAWAL":
      return { label: "Withdrawal", icon: "account-balance-wallet", tone: "debit" as const };
    case "SERVICE_FEE":
      return { label: "Service fee", icon: "receipt", tone: "debit" as const };
    case "SECURITY_DEPOSIT":
      return { label: "Security deposit", icon: "verified-user", tone: "neutral" as const };
    case "REFUND":
      return { label: "Refund", icon: "undo", tone: "credit" as const };
    default:
      return { label: "Transaction", icon: "swap-horiz", tone: "neutral" as const };
  }
}

function getPayoutStatusStyle(status: string) {
  const s = status.toUpperCase();
  if (s === "SUCCESS" || s === "COMPLETED") {
    return { bg: "#ecfdf5", text: "#059669", border: "#a7f3d0", label: "Completed" };
  }
  if (s === "PENDING") {
    return { bg: "#fffbeb", text: "#d97706", border: "#fde68a", label: "Pending" };
  }
  if (s === "FAILED") {
    return { bg: "#fef2f2", text: "#dc2626", border: "#fecaca", label: "Failed" };
  }
  return { bg: BRAND.canvas, text: BRAND.textMuted, border: BRAND.line, label: status };
}

export const WithdrawalHistoryDialog: React.FC<WithdrawalHistoryDialogProps> = ({
  visible,
  onClose,
  serviceProviderId,
}) => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [historyData, setHistoryData] = useState<PayoutHistoryResponse | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<FilterKey>("all");

  useEffect(() => {
    if (visible && serviceProviderId) {
      fetchWithdrawalHistory();
    } else if (!visible) {
      setSelectedFilter("all");
    }
  }, [visible, serviceProviderId]);

  const fetchWithdrawalHistory = async () => {
    if (!serviceProviderId) return;

    setLoading(true);
    try {
      const response = await PaymentInstance.get(
        `/api/service-providers/${serviceProviderId}/payouts?detailed=true&include_ledger=true`
      );

      if (response.status === 200 && response.data) {
        setHistoryData(response.data);
      } else {
        throw new Error(`Failed to fetch history: ${response.status}`);
      }
    } catch (error) {
      console.error("Error fetching withdrawal history:", error);
      Alert.alert("Error", "Failed to load withdrawal history. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchWithdrawalHistory();
  };

  const filteredLedger = useMemo(() => {
    const ledger = historyData?.ledger ?? [];
    if (selectedFilter === "credit") return ledger.filter((e) => e.direction === "CREDIT");
    if (selectedFilter === "debit") return ledger.filter((e) => e.direction === "DEBIT");
    return ledger;
  }, [historyData, selectedFilter]);

  const filterCounts = useMemo(
    () => ({
      all: historyData?.ledger?.length ?? 0,
      credit: historyData?.ledger?.filter((e) => e.direction === "CREDIT").length ?? 0,
      debit: historyData?.ledger?.filter((e) => e.direction === "DEBIT").length ?? 0,
    }),
    [historyData]
  );

  const renderLedgerItem = (entry: LedgerEntry, index: number, total: number) => {
    const meta = getReasonMeta(entry.reason);
    const isCredit = entry.direction === "CREDIT";
    const iconBg = isCredit ? "#ecfdf5" : "#fef2f2";
    const iconColor = isCredit ? "#059669" : "#dc2626";

    return (
      <View
        key={entry.ledger_id}
        style={[styles.txnCard, index < total - 1 && styles.txnCardBorder]}
      >
        <View style={[styles.txnIcon, { backgroundColor: iconBg }]}>
          <MaterialIcon name={meta.icon} size={20} color={iconColor} />
        </View>

        <View style={styles.txnBody}>
          <Text style={styles.txnTitle}>{meta.label}</Text>
          <Text style={styles.txnDate}>{formatDate(entry.created_at)}</Text>
          {entry.engagement_id ? (
            <Text style={styles.txnMeta}>Engagement #{entry.engagement_id}</Text>
          ) : null}
        </View>

        <View style={styles.txnAmountCol}>
          <Text style={[styles.txnAmount, { color: isCredit ? "#059669" : "#dc2626" }]}>
            {isCredit ? "+" : "−"}
            {formatInr(entry.amount)}
          </Text>
          <Text style={styles.txnDirection}>{isCredit ? "Credit" : "Debit"}</Text>
        </View>
      </View>
    );
  };

  const renderPayoutItem = (payout: NonNullable<PayoutHistoryResponse["payouts"]>[0], index: number, total: number) => {
    const statusStyle = getPayoutStatusStyle(payout.status);

    return (
      <View
        key={payout.payout_id}
        style={[styles.payoutRow, index < total - 1 && styles.txnCardBorder]}
      >
        <View style={styles.payoutLeft}>
          <Text style={styles.payoutTitle}>Withdrawal request</Text>
          <Text style={styles.txnDate}>{formatDate(payout.created_at)}</Text>
          <Text style={styles.txnMeta}>
            Gross {formatInr(payout.gross_amount)} · TDS {formatInr(payout.tds_amount)}
          </Text>
        </View>
        <View style={styles.payoutRight}>
          <Text style={styles.payoutAmount}>{formatInr(payout.net_amount)}</Text>
          <View style={[styles.statusPill, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
            <Text style={[styles.statusPillText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.sheet}>
          <View style={styles.headerAccent} />
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <MaterialIcon name="receipt-long" size={22} color={BRAND.accent} />
            </View>
            <View style={styles.headerTextCol}>
              <Text style={styles.headerTitle}>Withdrawal History</Text>
              <Text style={styles.headerSubtitle}>Earnings, withdrawals & payout status</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={8}>
              <MaterialIcon name="close" size={22} color={BRAND.textMuted} />
            </TouchableOpacity>
          </View>

          {loading && !refreshing ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={BRAND.bookingSky} />
              <Text style={styles.loadingText}>Loading history...</Text>
            </View>
          ) : !historyData ? (
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIcon}>
                <MaterialIcon name="receipt-long" size={36} color={BRAND.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>No history available</Text>
              <Text style={styles.emptyDesc}>Your transaction history will appear here.</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={fetchWithdrawalHistory}>
                <Text style={styles.retryBtnText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <ScrollView
                style={styles.list}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor={BRAND.bookingSky}
                    colors={[BRAND.bookingSky]}
                  />
                }
              >
                {/* Balance hero */}
                <View style={styles.heroCard}>
                  <View style={styles.heroAccent} />
                  <View style={styles.heroInner}>
                    <Text style={styles.heroLabel}>Available to withdraw</Text>
                    <Text
                      style={[
                        styles.heroValue,
                        historyData.summary.available_to_withdraw < 0 && styles.heroValueNegative,
                      ]}
                    >
                      {formatInr(historyData.summary.available_to_withdraw, true)}
                    </Text>
                  </View>
                </View>

                {/* Summary stats */}
                <View style={styles.statsRow}>
                  <View style={styles.statCard}>
                    <View style={[styles.statBar, { backgroundColor: BRAND.accent }]} />
                    <View style={styles.statInner}>
                      <MaterialIcon name="trending-up" size={18} color={BRAND.accent} />
                      <Text style={styles.statLabel}>Total earned</Text>
                      <Text style={styles.statValue}>{formatInr(historyData.summary.total_earned, true)}</Text>
                    </View>
                  </View>
                  <View style={styles.statCard}>
                    <View style={[styles.statBar, { backgroundColor: "#d97706" }]} />
                    <View style={styles.statInner}>
                      <MaterialIcon name="south-west" size={18} color="#d97706" />
                      <Text style={styles.statLabel}>Withdrawn</Text>
                      <Text style={styles.statValue}>{formatInr(historyData.summary.total_withdrawn, true)}</Text>
                    </View>
                  </View>
                </View>

                {historyData.summary.security_deposit_amount > 0 ? (
                  <View style={styles.depositPill}>
                    <MaterialIcon
                      name={historyData.summary.security_deposit_paid ? "verified-user" : "shield"}
                      size={16}
                      color={BRAND.accent}
                    />
                    <Text style={styles.depositText}>
                      Security deposit: {formatInr(historyData.summary.security_deposit_amount, true)}
                      {historyData.summary.security_deposit_paid ? " · Paid" : " · Pending"}
                    </Text>
                  </View>
                ) : null}

                {/* Filters */}
                <View style={styles.segmentWrap}>
                  {FILTER_TABS.map(({ key, label, icon }) => {
                    const active = selectedFilter === key;
                    return (
                      <TouchableOpacity
                        key={key}
                        style={[styles.segment, active && styles.segmentActive]}
                        onPress={() => setSelectedFilter(key)}
                        activeOpacity={0.85}
                      >
                        <MaterialIcon
                          name={icon}
                          size={15}
                          color={active ? "#ffffff" : BRAND.textMuted}
                        />
                        <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>
                          {label}
                        </Text>
                        <View style={[styles.segmentCount, active && styles.segmentCountActive]}>
                          <Text
                            style={[styles.segmentCountText, active && styles.segmentCountTextActive]}
                          >
                            {filterCounts[key]}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Ledger */}
                <Text style={styles.sectionTitle}>Transactions</Text>
                <View style={styles.sectionCard}>
                  {filteredLedger.length > 0 ? (
                    filteredLedger.map((entry, index) =>
                      renderLedgerItem(entry, index, filteredLedger.length)
                    )
                  ) : (
                    <View style={styles.sectionEmpty}>
                      <MaterialIcon name="inbox" size={32} color={BRAND.textMuted} />
                      <Text style={styles.sectionEmptyTitle}>No transactions</Text>
                      <Text style={styles.sectionEmptyDesc}>
                        {selectedFilter !== "all"
                          ? `No ${selectedFilter === "credit" ? "earnings" : "withdrawals"} in this view`
                          : "Complete services to see earnings here"}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Payout requests */}
                {historyData.payouts && historyData.payouts.length > 0 ? (
                  <>
                    <Text style={styles.sectionTitle}>Payout requests</Text>
                    <View style={styles.sectionCard}>
                      {historyData.payouts.map((payout, index) =>
                        renderPayoutItem(payout, index, historyData.payouts!.length)
                      )}
                    </View>
                  </>
                ) : null}
              </ScrollView>
            </>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BRAND.canvas,
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
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: BRAND.textMuted,
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: BRAND.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: BRAND.text,
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 14,
    color: BRAND.textMuted,
    textAlign: "center",
    marginBottom: 16,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: BRAND.accent,
  },
  retryBtnText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 14,
  },
  heroCard: {
    backgroundColor: BRAND.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BRAND.line,
    overflow: "hidden",
  },
  heroAccent: {
    height: 3,
    backgroundColor: BRAND.accent,
  },
  heroInner: {
    padding: 16,
    backgroundColor: BRAND.accentSoft,
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: BRAND.accent,
    marginBottom: 4,
  },
  heroValue: {
    fontSize: 30,
    fontWeight: "800",
    color: BRAND.text,
    letterSpacing: -0.5,
  },
  heroValueNegative: {
    color: "#dc2626",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: BRAND.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BRAND.line,
    overflow: "hidden",
  },
  statBar: {
    height: 3,
    width: "100%",
  },
  statInner: {
    padding: 12,
    gap: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: BRAND.textMuted,
    marginTop: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "800",
    color: BRAND.text,
    letterSpacing: -0.3,
  },
  depositPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: BRAND.surface,
    borderWidth: 1,
    borderColor: BRAND.line,
  },
  depositText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: BRAND.textMuted,
  },
  segmentWrap: {
    flexDirection: "row",
    gap: 8,
  },
  segment: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 12,
    backgroundColor: BRAND.surface,
    borderWidth: 1,
    borderColor: BRAND.line,
  },
  segmentActive: {
    backgroundColor: BRAND.accent,
    borderColor: BRAND.accent,
  },
  segmentLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: BRAND.textMuted,
  },
  segmentLabelActive: {
    color: "#ffffff",
  },
  segmentCount: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: BRAND.canvas,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentCountActive: {
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  segmentCountText: {
    fontSize: 10,
    fontWeight: "700",
    color: BRAND.accent,
  },
  segmentCountTextActive: {
    color: "#ffffff",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: BRAND.text,
    marginBottom: -6,
  },
  sectionCard: {
    backgroundColor: BRAND.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BRAND.line,
    overflow: "hidden",
  },
  txnCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    gap: 12,
  },
  txnCardBorder: {
    borderBottomWidth: 1,
    borderBottomColor: BRAND.line,
  },
  txnIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  txnBody: {
    flex: 1,
    minWidth: 0,
  },
  txnTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: BRAND.text,
    marginBottom: 3,
  },
  txnDate: {
    fontSize: 12,
    color: BRAND.textMuted,
  },
  txnMeta: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 4,
  },
  txnAmountCol: {
    alignItems: "flex-end",
    flexShrink: 0,
  },
  txnAmount: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 2,
  },
  txnDirection: {
    fontSize: 11,
    color: BRAND.textMuted,
    fontWeight: "500",
  },
  sectionEmpty: {
    alignItems: "center",
    paddingVertical: 36,
    paddingHorizontal: 20,
    gap: 6,
  },
  sectionEmptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: BRAND.text,
    marginTop: 4,
  },
  sectionEmptyDesc: {
    fontSize: 13,
    color: BRAND.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },
  payoutRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: 14,
    gap: 12,
  },
  payoutLeft: {
    flex: 1,
    minWidth: 0,
  },
  payoutTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: BRAND.text,
    marginBottom: 3,
  },
  payoutRight: {
    alignItems: "flex-end",
    flexShrink: 0,
    gap: 6,
  },
  payoutAmount: {
    fontSize: 15,
    fontWeight: "800",
    color: BRAND.text,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: "700",
  },
});

export default WithdrawalHistoryDialog;
