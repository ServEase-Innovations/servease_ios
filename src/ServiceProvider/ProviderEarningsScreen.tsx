import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import { AxiosResponse } from "axios";
import PaymentInstance from "../services/paymentInstance";
import { useAppUser } from "../context/AppUserContext";
import { HOME_M3 } from "../theme/brandColors";
import { DashboardMetricCard, METRIC_CARD_WIDTH } from "./DashboardMetricCard";
import type { ProviderPayoutResponse } from "./Dashboard";
import WithdrawalDialog from "./WithdrawalDialog";
import { WithdrawalHistoryDialog } from "./WithdrawalHistoryDialog";

function getCurrentMonthYear() {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  return `${year}-${month}`;
}

function formatInr(amount: number) {
  const abs = Math.abs(amount);
  const hasFraction = Math.abs(amount - Math.trunc(amount)) > 0.001;
  const formatted = abs.toLocaleString("en-IN", {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  });
  return amount < 0 ? `-₹${formatted}` : `₹${formatted}`;
}

function formatRelativePayment(iso: string | undefined | null): string {
  if (!iso) return "No recent payments";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "No recent payments";
  const diffDays = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "Last payment today";
  if (diffDays === 1) return "Last payment 1 day ago";
  return `Last payment ${diffDays} days ago`;
}

export default function ProviderEarningsScreen() {
  const insets = useSafeAreaInsets();
  const { appUser } = useAppUser();
  const [serviceProviderId, setServiceProviderId] = useState<number | null>(null);
  const [payout, setPayout] = useState<ProviderPayoutResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [withdrawalDialogOpen, setWithdrawalDialogOpen] = useState(false);
  const [withdrawalHistoryDialogOpen, setWithdrawalHistoryDialogOpen] = useState(false);

  useEffect(() => {
    const id = appUser?.serviceProviderId ? Number(appUser.serviceProviderId) : null;
    setServiceProviderId(id && Number.isFinite(id) ? id : null);
  }, [appUser?.serviceProviderId]);

  const fetchPayout = useCallback(async () => {
    if (!serviceProviderId) return;
    try {
      const currentMonthYear = getCurrentMonthYear();
      const payoutResponse: AxiosResponse<ProviderPayoutResponse> = await PaymentInstance.get(
        `/api/service-providers/${serviceProviderId}/payouts?month=${currentMonthYear}&detailed=true`
      );
      setPayout(payoutResponse.data);
    } catch {
      Alert.alert("Error", "Failed to load earnings. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [serviceProviderId]);

  useEffect(() => {
    if (serviceProviderId) void fetchPayout();
  }, [serviceProviderId, fetchPayout]);

  const onRefresh = () => {
    setRefreshing(true);
    void fetchPayout();
  };

  const availableBalance = payout?.summary?.available_to_withdraw ?? 0;
  const depositPaid = Boolean(payout?.summary?.security_deposit_paid);

  const metrics = [
    {
      title: "Total Earnings",
      value: formatInr(payout?.summary?.total_earned ?? 0),
      icon: "rupee" as const,
      variant: "earnings" as const,
      hint: "",
      hintVariant: "default" as const,
      highlighted: false,
    },
    {
      title: "Deposit",
      value: formatInr(payout?.summary?.security_deposit_amount ?? 0),
      icon: "shield" as const,
      variant: "deposit" as const,
      hint: depositPaid ? "Paid" : "Pending",
      hintVariant: depositPaid ? ("success" as const) : ("warning" as const),
      highlighted: false,
    },
    {
      title: "Withdrawn",
      value: formatInr(payout?.summary?.total_withdrawn ?? 0),
      icon: "credit-card" as const,
      variant: "withdrawn" as const,
      hint: "",
      hintVariant: "default" as const,
      highlighted: false,
    },
    {
      title: "Available",
      value: formatInr(availableBalance),
      icon: "wallet" as const,
      variant: "balance" as const,
      hint: "",
      hintVariant: "default" as const,
      highlighted: true,
      onPress: () => setWithdrawalDialogOpen(true),
    },
  ];

  const latestPayoutDate = payout?.payouts?.length
    ? [...payout.payouts].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0]?.created_at
    : null;

  const handleWithdrawalSuccess = async () => {
    await fetchPayout();
    Alert.alert("Success", "Withdrawal request submitted successfully!");
  };

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingTop: Math.max(insets.top, 12) + 8, paddingBottom: 100 },
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Earnings</Text>
        <Text style={styles.subtitle}>Track payouts, deposits, and withdrawals</Text>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={HOME_M3.secondary} />
          </View>
        ) : (
          <>
            <View style={styles.metricsGrid}>
              {metrics.map((metric) => (
                <DashboardMetricCard key={metric.title} {...metric} />
              ))}
            </View>

            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => setWithdrawalDialogOpen(true)}
              activeOpacity={0.88}
            >
              <View style={[styles.actionIcon, { backgroundColor: "#ecfdf5" }]}>
                <MaterialIcon name="account-balance-wallet" size={22} color="#059669" />
              </View>
              <View style={styles.actionCopy}>
                <Text style={styles.actionTitle}>Request withdrawal</Text>
                <Text style={styles.actionSubtitle}>
                  {availableBalance >= 500
                    ? `${formatInr(availableBalance)} available`
                    : "Minimum ₹500 required"}
                </Text>
              </View>
              <MaterialIcon name="chevron-right" size={22} color="#94a3b8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.recentActivityRow}
              onPress={() => setWithdrawalHistoryDialogOpen(true)}
              activeOpacity={0.88}
            >
              <View style={styles.recentIcon}>
                <MaterialIcon name="history" size={22} color={HOME_M3.secondary} />
              </View>
              <View style={styles.recentCopy}>
                <Text style={styles.recentTitle}>Recent Activity</Text>
                <Text style={styles.recentSubtitle}>
                  {formatRelativePayment(latestPayoutDate)}
                </Text>
              </View>
              <MaterialIcon name="chevron-right" size={22} color="#94a3b8" />
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      <WithdrawalHistoryDialog
        visible={withdrawalHistoryDialogOpen}
        onClose={() => setWithdrawalHistoryDialogOpen(false)}
        serviceProviderId={serviceProviderId}
      />

      <WithdrawalDialog
        open={withdrawalDialogOpen}
        onOpenChange={setWithdrawalDialogOpen}
        serviceProviderId={serviceProviderId}
        availableBalance={availableBalance}
        onWithdrawalSuccess={handleWithdrawalSuccess}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: HOME_M3.surface,
  },
  content: {
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: HOME_M3.onSurface,
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: HOME_M3.onSurfaceVariant,
    marginBottom: 20,
    lineHeight: 20,
  },
  loadingWrap: {
    paddingVertical: 48,
    alignItems: "center",
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 12,
    rowGap: 12,
    marginBottom: 16,
    width: METRIC_CARD_WIDTH * 2 + 12,
    alignSelf: "stretch",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e8edf4",
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  actionCopy: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: HOME_M3.onSurface,
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 13,
    color: HOME_M3.onSurfaceVariant,
  },
  recentActivityRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#e8edf4",
  },
  recentIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: HOME_M3.secondaryFixed,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  recentCopy: {
    flex: 1,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: HOME_M3.onSurface,
    marginBottom: 2,
  },
  recentSubtitle: {
    fontSize: 13,
    color: HOME_M3.onSurfaceVariant,
  },
});
