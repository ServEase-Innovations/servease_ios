import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';

interface Payment {
  id: string;
  date: string;
  description: string;
  amount: string;
  status: "completed" | "pending" | "failed";
  type: "earning" | "withdrawal";
}

interface PaymentHistoryProps {
  payments: Payment[];
}

export function PaymentHistory({ payments }: PaymentHistoryProps) {
  const { t } = useTranslation();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return { backgroundColor: '#10b981', color: '#ffffff' };
      case "pending":
        return { backgroundColor: '#f59e0b', color: '#ffffff' };
      case "failed":
        return { backgroundColor: '#ef4444', color: '#ffffff' };
      default:
        return { backgroundColor: '#e5e7eb', color: '#374151' };
    }
  };

  const getStatusTranslation = (status: string) => {
    switch (status) {
      case "completed":
        return t('wallet.transactionTypes.COMPLETED') || t('common.completed');
      case "pending":
        return t('wallet.transactionTypes.PENDING') || t('common.pending');
      case "failed":
        return t('wallet.transactionTypes.FAILED') || t('common.failed');
      default:
        return status;
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{t('wallet.recentActivity')}</Text>
      </View>
      <View style={styles.cardContent}>
        <View style={styles.paymentsContainer}>
          {payments.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>{t('wallet.noTransactions')}</Text>
              <Text style={styles.emptyStateDescription}>{t('wallet.noTransactionsDesc')}</Text>
            </View>
          ) : (
            payments.map((payment) => {
              const statusColors = getStatusColor(payment.status);
              const statusText = getStatusTranslation(payment.status);
              const isEarning = payment.type === "earning";
              
              return (
                <View 
                  key={payment.id} 
                  style={styles.paymentItem}
                >
                  <View style={styles.paymentLeft}>
                    <View style={[
                      styles.paymentIconContainer,
                      isEarning ? styles.earningIcon : styles.withdrawalIcon
                    ]}>
                      {isEarning ? (
                        <MaterialIcon name="trending-up" size={16} color="#10b981" />
                      ) : (
                        <MaterialIcon name="trending-down" size={16} color="#3b82f6" />
                      )}
                    </View>
                    <View style={styles.paymentInfo}>
                      <Text style={styles.paymentDescription}>{payment.description}</Text>
                      <Text style={styles.paymentDate}>{payment.date}</Text>
                    </View>
                  </View>
                  <View style={styles.paymentRight}>
                    <Text style={[
                      styles.paymentAmount,
                      isEarning ? styles.earningAmount : styles.withdrawalAmount
                    ]}>
                      {isEarning ? '+' : '-'}{payment.amount}
                    </Text>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: statusColors.backgroundColor }
                    ]}>
                      <Text style={[
                        styles.statusText,
                        { color: statusColors.color }
                      ]}>
                        {statusText}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 0,
    marginBottom: 16,
    width: '100%',
  },
  cardHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  cardContent: {
    padding: 16,
  },
  paymentsContainer: {
    gap: 16,
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  paymentIconContainer: {
    padding: 8,
    borderRadius: 20,
  },
  earningIcon: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  withdrawalIcon: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  paymentInfo: {
    gap: 4,
  },
  paymentDescription: {
    fontWeight: '500',
    color: '#111827',
  },
  paymentDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  paymentRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  paymentAmount: {
    fontWeight: '600',
  },
  earningAmount: {
    color: '#10b981',
  },
  withdrawalAmount: {
    color: '#111827',
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
});