import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import type { QuoteBreakdownRow } from "../utils/quoteBreakdown";
import { formatInr } from "../utils/maidPricingUtils";
import type { PaymentTotals } from "../utils/paymentTotals";

export interface PriceBreakdownProps {
  rows: QuoteBreakdownRow[];
  loading?: boolean;
  paymentTotals?: PaymentTotals | null;
}

const PriceBreakdown: React.FC<PriceBreakdownProps> = ({
  rows,
  loading,
  paymentTotals,
}) => {
  if (loading || rows.length === 0) return null;

  const lineRows = rows.filter((r) => r.kind !== "total");
  const totalRow = rows.find((r) => r.kind === "total");
  const showTaxesInfo =
    paymentTotals != null && paymentTotals.taxes_and_fees > 0;

  const onTaxesInfoPress = () => {
    if (!paymentTotals) return;
    Alert.alert(
      "Taxes & fees breakup",
      `Platform fee: ${formatInr(paymentTotals.platform_fee)}\nGST (18% on platform fee): ${formatInr(paymentTotals.gst)}`,
      [{ text: "OK" }]
    );
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Price breakup</Text>
      <Text style={styles.sub}>How your total is calculated</Text>

      {lineRows.map((row, idx) => (
        <View key={`${row.kind}-${idx}-${row.label}`} style={styles.row}>
          <View style={styles.labelCol}>
            <View style={styles.labelRow}>
              <Text
                style={[
                  styles.label,
                  (row.kind === "discount" || row.kind === "savings") &&
                    styles.labelDiscount,
                ]}
              >
                {row.label}
              </Text>
              {row.kind === "taxes_fees" && showTaxesInfo ? (
                <TouchableOpacity
                  onPress={onTaxesInfoPress}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel="Taxes and fees breakdown"
                >
                  <Icon name="info-outline" size={18} color="#0b5bd3" />
                </TouchableOpacity>
              ) : null}
            </View>
            {row.detail ? <Text style={styles.detail}>{row.detail}</Text> : null}
          </View>
          <Text
            style={[
              styles.amount,
              (row.kind === "discount" || row.kind === "savings") &&
                styles.amountDiscount,
            ]}
          >
            {row.kind === "discount" || row.kind === "savings" ? "−" : ""}
            {formatInr(Math.abs(row.amount))}
          </Text>
        </View>
      ))}

      {totalRow ? (
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>{totalRow.label}</Text>
          <Text style={styles.totalAmount}>{formatInr(totalRow.amount)}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  title: { fontSize: 15, fontWeight: "700", color: "#0f172a" },
  sub: { fontSize: 12, color: "#64748b", marginTop: 2, marginBottom: 12 },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 10,
    gap: 8,
  },
  labelCol: { flex: 1, minWidth: 0 },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  label: { fontSize: 13, color: "#475569", lineHeight: 18, flexShrink: 1 },
  labelDiscount: { color: "#15803d" },
  detail: { fontSize: 11, color: "#94a3b8", marginTop: 2 },
  amount: { fontSize: 14, fontWeight: "600", color: "#1e293b" },
  amountDiscount: { color: "#15803d" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  totalLabel: { fontSize: 14, fontWeight: "700", color: "#0f172a" },
  totalAmount: { fontSize: 16, fontWeight: "700", color: "#0b5bd3" },
});

export default PriceBreakdown;
