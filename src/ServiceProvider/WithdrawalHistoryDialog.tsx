/* eslint-disable */
import { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  FlatList,
  Alert,
} from "react-native";
// import { useToast } from "../hooks/use-toast"; // You'll need to adapt this for React Native
import PaymentInstance from "../services/paymentInstance";
import { useToast } from "../hooks/useToast";

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
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceProviderId: number | null;
}

export function WithdrawalHistoryDialog({
  open,
  onOpenChange,
  serviceProviderId,
}: WithdrawalHistoryDialogProps) {
  const [loading, setLoading] = useState(false);
  const [historyData, setHistoryData] = useState<PayoutHistoryResponse | null>(null);
  const { toast } = useToast(); // Replace with React Native alert/toast
  const [selectedFilter, setSelectedFilter] = useState<"all" | "credit" | "debit">("all");

  useEffect(() => {
    if (open && serviceProviderId) {
      fetchWithdrawalHistory();
    }
  }, [open, serviceProviderId]);

  const fetchWithdrawalHistory = async () => {
    if (!serviceProviderId) return;

    setLoading(true);
    try {
      const response = await PaymentInstance.get(
        `/api/service-providers/${serviceProviderId}/payouts?detailed=true&include_ledger=true`
      );

      if (response.status === 200) {
        setHistoryData(response.data);
      } else {
        throw new Error(`Failed to fetch history: ${response.status}`);
      }
    } catch (error) {
      console.error("Error fetching withdrawal history:", error);
      // Use Alert.alert or your toast implementation
      Alert.alert("Error", "Failed to load withdrawal history. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    let backgroundColor, textColor, borderColor, label;
    
    switch (status) {
      case "completed":
      case "SUCCESS":
        backgroundColor = "#DCFCE7";
        textColor = "#166534";
        borderColor = "#86EFAC";
        label = "Completed";
        break;
      case "pending":
      case "PENDING":
        backgroundColor = "#FEF9C3";
        textColor = "#854D0E";
        borderColor = "#FDE047";
        label = "Pending";
        break;
      case "failed":
      case "FAILED":
        backgroundColor = "#FEE2E2";
        textColor = "#991B1B";
        borderColor = "#FCA5A5";
        label = "Failed";
        break;
      default:
        backgroundColor = "#F3F4F6";
        textColor = "#374151";
        borderColor = "#D1D5DB";
        label = status;
    }

    return (
      <View style={[styles.badge, { backgroundColor, borderColor }]}>
        <Text style={[styles.badgeText, { color: textColor }]}>{label}</Text>
      </View>
    );
  };

  const getReasonText = (reason: LedgerEntry["reason"]) => {
    switch (reason) {
      case "DAILY_EARNED":
        return "Service Payment";
      case "WITHDRAWAL":
        return "Withdrawal";
      case "SERVICE_FEE":
        return "Service Fee";
      case "SECURITY_DEPOSIT":
        return "Security Deposit";
      case "REFUND":
        return "Refund";
      default:
        return "Transaction";
    }
  };

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

  const formatAmount = (amount: number) => {
    return `₹${amount.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const filteredLedger = historyData?.ledger?.filter((entry) => {
    if (selectedFilter === "all") return true;
    if (selectedFilter === "credit") return entry.direction === "CREDIT";
    if (selectedFilter === "debit") return entry.direction === "DEBIT";
    return true;
  });

  const handleClose = () => {
    onOpenChange(false);
  };

  const renderTransactionItem = ({ item }: { item: LedgerEntry }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionContent}>
        <View style={styles.transactionLeft}>
          <View style={[
            styles.transactionIconContainer,
            item.direction === "CREDIT" 
              ? styles.creditIcon 
              : styles.debitIcon
          ]}>
            <Text style={styles.transactionIcon}>
              {item.direction === "CREDIT" ? "↑" : "↓"}
            </Text>
          </View>
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionTitle}>
              {getReasonText(item.reason)}
            </Text>
            <Text style={styles.transactionDate}>
              {formatDate(item.created_at)}
              {item.engagement_id && (
                <Text style={styles.engagementId}>
                  • Engagement #{item.engagement_id}
                </Text>
              )}
            </Text>
          </View>
        </View>
        <View style={styles.transactionRight}>
          <Text style={[
            styles.transactionAmount,
            item.direction === "CREDIT" 
              ? styles.creditAmount 
              : styles.debitAmount
          ]}>
            {item.direction === "CREDIT" ? "+" : "-"}
            {formatAmount(item.amount)}
          </Text>
          <Text style={styles.transactionDirection}>
            {item.direction === "CREDIT" ? "Credit" : "Debit"}
          </Text>
        </View>
      </View>
      {item.reference_type && (
        <Text style={styles.referenceText}>
          Ref: {item.reference_type} #{item.reference_id}
        </Text>
      )}
    </View>
  );

  const renderPayoutItem = ({ item }: { item: any }) => (
    <View style={styles.payoutItem}>
      <View style={styles.payoutContent}>
        <View>
          <Text style={styles.payoutTitle}>Payout #{item.payout_id}</Text>
          <Text style={styles.payoutDate}>{formatDate(item.created_at)}</Text>
        </View>
        <View style={styles.payoutRight}>
          <Text style={styles.payoutAmount}>{formatAmount(item.net_amount)}</Text>
          {getStatusBadge(item.status)}
        </View>
      </View>
      {item.engagement_id && (
        <Text style={styles.engagementText}>
          Engagement #{item.engagement_id}
        </Text>
      )}
    </View>
  );

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
              <Text style={styles.headerTitle}>Withdrawal History</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.contentContainer}>
            <Text style={styles.subtitle}>
              View your earnings, withdrawals, and transaction history
            </Text>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
              </View>
            ) : !historyData ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No history data available</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={fetchWithdrawalHistory}
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView style={styles.scrollContainer}>
                {/* Summary Cards */}
                <View style={styles.summaryGrid}>
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Total Earned</Text>
                    <Text style={styles.summaryValue}>
                      {formatAmount(historyData.summary.total_earned)}
                    </Text>
                  </View>
                  <View style={[styles.summaryCard, styles.summaryCardGreen]}>
                    <Text style={styles.summaryLabelGreen}>Available Balance</Text>
                    <Text style={styles.summaryValueGreen}>
                      {formatAmount(historyData.summary.available_to_withdraw)}
                    </Text>
                  </View>
                  <View style={[styles.summaryCard, styles.summaryCardOrange]}>
                    <Text style={styles.summaryLabelOrange}>Total Withdrawn</Text>
                    <Text style={styles.summaryValueOrange}>
                      {formatAmount(historyData.summary.total_withdrawn)}
                    </Text>
                  </View>
                </View>

                {/* Filters */}
                <View style={styles.filterContainer}>
                  <TouchableOpacity
                    style={[
                      styles.filterButton,
                      selectedFilter === "all" && styles.filterButtonActive,
                    ]}
                    onPress={() => setSelectedFilter("all")}
                  >
                    <Text style={[
                      styles.filterButtonText,
                      selectedFilter === "all" && styles.filterButtonTextActive,
                    ]}>
                      All Transactions
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.filterButton,
                      selectedFilter === "credit" && styles.filterButtonActive,
                    ]}
                    onPress={() => setSelectedFilter("credit")}
                  >
                    <Text style={[styles.creditIconSmall, { marginRight: 4 }]}>↑</Text>
                    <Text style={[
                      styles.filterButtonText,
                      selectedFilter === "credit" && styles.filterButtonTextActive,
                    ]}>
                      Earnings
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.filterButton,
                      selectedFilter === "debit" && styles.filterButtonActive,
                    ]}
                    onPress={() => setSelectedFilter("debit")}
                  >
                    <Text style={[styles.debitIconSmall, { marginRight: 4 }]}>↓</Text>
                    <Text style={[
                      styles.filterButtonText,
                      selectedFilter === "debit" && styles.filterButtonTextActive,
                    ]}>
                      Withdrawals
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Transaction History */}
                <View style={styles.transactionListContainer}>
                  {filteredLedger && filteredLedger.length > 0 ? (
                    <FlatList
                      data={filteredLedger}
                      renderItem={renderTransactionItem}
                      keyExtractor={(item) => item.ledger_id}
                      scrollEnabled={false}
                      ItemSeparatorComponent={() => <View style={styles.separator} />}
                    />
                  ) : (
                    <View style={styles.emptyTransactionContainer}>
                      <Text style={styles.emptyTransactionIcon}>🧾</Text>
                      <Text style={styles.emptyTransactionTitle}>
                        No transactions found
                      </Text>
                      <Text style={styles.emptyTransactionSubtitle}>
                        {selectedFilter !== "all"
                          ? `No ${selectedFilter} transactions`
                          : "Start providing services to see transactions"}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Payout History Section */}
                {historyData.payouts && historyData.payouts.length > 0 && (
                  <View style={styles.payoutSection}>
                    <Text style={styles.payoutSectionTitle}>Payout Requests</Text>
                    <View style={styles.payoutListContainer}>
                      <FlatList
                        data={historyData.payouts}
                        renderItem={renderPayoutItem}
                        keyExtractor={(item) => item.payout_id}
                        scrollEnabled={false}
                        ItemSeparatorComponent={() => <View style={styles.separator} />}
                      />
                    </View>
                  </View>
                )}
              </ScrollView>
            )}
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
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
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
  contentContainer: {
    padding: 20,
    flex: 1,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 20,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: "#9CA3AF",
    marginBottom: 16,
  },
  retryButton: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    fontSize: 14,
    color: "#374151",
  },
  scrollContainer: {
    flex: 1,
  },
  summaryGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
  },
  summaryCardGreen: {
    backgroundColor: "#DCFCE7",
    borderColor: "#86EFAC",
  },
  summaryCardOrange: {
    backgroundColor: "#FFEDD5",
    borderColor: "#FDBA74",
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#1E40AF",
    marginBottom: 4,
  },
  summaryLabelGreen: {
    color: "#166534",
  },
  summaryLabelOrange: {
    color: "#9A3412",
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E40AF",
  },
  summaryValueGreen: {
    color: "#166534",
  },
  summaryValueOrange: {
    color: "#9A3412",
  },
  filterContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  filterButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  filterButtonActive: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },
  filterButtonText: {
    fontSize: 12,
    color: "#374151",
  },
  filterButtonTextActive: {
    color: "#FFFFFF",
  },
  creditIconSmall: {
    color: "#16A34A",
    fontSize: 14,
  },
  debitIconSmall: {
    color: "#DC2626",
    fontSize: 14,
  },
  transactionListContainer: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    marginBottom: 24,
  },
  transactionItem: {
    padding: 16,
  },
  transactionContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  transactionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  transactionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  creditIcon: {
    backgroundColor: "#DCFCE7",
  },
  debitIcon: {
    backgroundColor: "#FEE2E2",
  },
  transactionIcon: {
    fontSize: 18,
    fontWeight: "600",
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: "#6B7280",
  },
  engagementId: {
    color: "#9CA3AF",
  },
  transactionRight: {
    alignItems: "flex-end",
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  creditAmount: {
    color: "#16A34A",
  },
  debitAmount: {
    color: "#DC2626",
  },
  transactionDirection: {
    fontSize: 12,
    color: "#6B7280",
  },
  referenceText: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 8,
  },
  separator: {
    height: 1,
    backgroundColor: "#F3F4F6",
  },
  emptyTransactionContainer: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  emptyTransactionIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTransactionTitle: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 4,
  },
  emptyTransactionSubtitle: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  payoutSection: {
    marginTop: 8,
  },
  payoutSectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  payoutListContainer: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
  },
  payoutItem: {
    padding: 16,
  },
  payoutContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  payoutTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
    marginBottom: 2,
  },
  payoutDate: {
    fontSize: 12,
    color: "#6B7280",
  },
  payoutRight: {
    alignItems: "flex-end",
  },
  payoutAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  engagementText: {
    fontSize: 12,
    color: "#6B7280",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "500",
  },
});