// WithdrawalHistoryDialog.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import PaymentInstance from '../services/paymentInstance';

// Types
interface LedgerEntry {
  ledger_id: string;
  engagement_id: string | null;
  amount: number;
  direction: 'CREDIT' | 'DEBIT';
  reason: 'DAILY_EARNED' | 'WITHDRAWAL' | 'SERVICE_FEE' | 'SECURITY_DEPOSIT' | 'REFUND' | 'OTHER';
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

const { width: screenWidth } = Dimensions.get('window');

// Common Badge Component
const Badge: React.FC<{
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'default';
}> = ({ children, variant = 'default' }) => {
  const getBadgeStyle = () => {
    switch (variant) {
      case 'success':
        return { backgroundColor: '#d1fae5', color: '#065f46' };
      case 'warning':
        return { backgroundColor: '#fef3c7', color: '#92400e' };
      case 'danger':
        return { backgroundColor: '#fee2e2', color: '#991b1b' };
      default:
        return { backgroundColor: '#e5e7eb', color: '#374151' };
    }
  };

  const badgeStyle = getBadgeStyle();
  
  return (
    <View
      style={{
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: badgeStyle.backgroundColor,
      }}>
      <Text style={{ fontSize: 12, fontWeight: '500', color: badgeStyle.color }}>
        {children}
      </Text>
    </View>
  );
};

// Common Button Component
const Button: React.FC<{
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  containerStyle?: any;
}> = ({ title, onPress, variant = 'primary', size = 'md', disabled = false, loading = false, containerStyle }) => {
  const getButtonStyle = () => {
    let backgroundColor = '#004aad';
    let borderColor = '#004aad';
    let textColor = '#ffffff';

    if (variant === 'outline') {
      backgroundColor = 'transparent';
      borderColor = '#004aad';
      textColor = '#004aad';
    } else if (variant === 'secondary') {
      backgroundColor = '#6c757d';
      borderColor = '#6c757d';
      textColor = '#ffffff';
    }

    let paddingVertical = 8;
    let paddingHorizontal = 16;
    
    if (size === 'sm') {
      paddingVertical = 6;
      paddingHorizontal = 12;
    } else if (size === 'lg') {
      paddingVertical = 12;
      paddingHorizontal = 24;
    }

    return {
      backgroundColor,
      borderColor,
      textColor,
      paddingVertical,
      paddingHorizontal,
    };
  };

  const styleObj = getButtonStyle();

  return (
    <View style={containerStyle}>
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        style={{
          backgroundColor: styleObj.backgroundColor,
          borderWidth: variant === 'outline' ? 1 : 0,
          borderColor: styleObj.borderColor,
          paddingVertical: styleObj.paddingVertical,
          paddingHorizontal: styleObj.paddingHorizontal,
          borderRadius: 8,
          opacity: disabled ? 0.5 : 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {loading && (
          <ActivityIndicator
            size="small"
            color={styleObj.textColor}
            style={{ marginRight: 8 }}
          />
        )}
        <Text style={{ color: styleObj.textColor, fontWeight: '600', fontSize: 14 }}>
          {title}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// Common Filter Button Component
const FilterButton: React.FC<{
  title: string;
  active: boolean;
  onPress: () => void;
  icon?: string;
  iconColor?: string;
}> = ({ title, active, onPress, icon, iconColor }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: active ? '#004aad' : '#f3f4f6',
        marginRight: 8,
        flexDirection: 'row',
        alignItems: 'center',
      }}>
      {icon && (
        <Icon
          name={icon}
          size={16}
          color={active ? '#ffffff' : iconColor || '#6b7280'}
          style={{ marginRight: 6 }}
        />
      )}
      <Text
        style={{
          color: active ? '#ffffff' : '#374151',
          fontWeight: active ? '600' : '500',
          fontSize: 13,
        }}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

// Summary Card Component
const SummaryCard: React.FC<{
  title: string;
  amount: number;
  gradientColors: string[];
}> = ({ title, amount, gradientColors }) => {
  const formatAmount = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={{
        borderRadius: 12,
        padding: 16,
        flex: 1,
        marginHorizontal: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}>
      <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.9)', marginBottom: 4 }}>
        {title}
      </Text>
      <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#ffffff' }}>
        {formatAmount(amount)}
      </Text>
    </LinearGradient>
  );
};

export const WithdrawalHistoryDialog: React.FC<WithdrawalHistoryDialogProps> = ({
  visible,
  onClose,
  serviceProviderId,
}) => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [historyData, setHistoryData] = useState<PayoutHistoryResponse | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'credit' | 'debit'>('all');

  useEffect(() => {
    if (visible && serviceProviderId) {
      fetchWithdrawalHistory();
    }
  }, [visible, serviceProviderId]);

  const showError = (message: string) => {
    Alert.alert('Error', message);
  };

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
      console.error('Error fetching withdrawal history:', error);
      showError('Failed to load withdrawal history. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchWithdrawalHistory();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'SUCCESS':
        return <Badge variant="success">Completed</Badge>;
      case 'pending':
      case 'PENDING':
        return <Badge variant="warning">Pending</Badge>;
      case 'failed':
      case 'FAILED':
        return <Badge variant="danger">Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getReasonText = (reason: LedgerEntry['reason']) => {
    switch (reason) {
      case 'DAILY_EARNED':
        return 'Service Payment';
      case 'WITHDRAWAL':
        return 'Withdrawal';
      case 'SERVICE_FEE':
        return 'Service Fee';
      case 'SECURITY_DEPOSIT':
        return 'Security Deposit';
      case 'REFUND':
        return 'Refund';
      default:
        return 'Transaction';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAmount = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const filteredLedger = historyData?.ledger?.filter((entry) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'credit') return entry.direction === 'CREDIT';
    if (selectedFilter === 'debit') return entry.direction === 'DEBIT';
    return true;
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
        {/* Header with Gradient */}
        <LinearGradient
          colors={['#0a2a66ff', '#004aadff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            paddingTop: 48,
            paddingBottom: 16,
            paddingHorizontal: 20,
            borderBottomLeftRadius: 20,
            borderBottomRightRadius: 20,
          }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <Icon name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text
              style={{
                fontSize: 20,
                fontWeight: 'bold',
                color: '#ffffff',
                textAlign: 'center',
                flex: 1,
              }}>
              Withdrawal History
            </Text>
            <View style={{ width: 32 }} />
          </View>
          <Text
            style={{
              fontSize: 14,
              color: 'rgba(255,255,255,0.9)',
              textAlign: 'center',
              marginTop: 8,
            }}>
            View your earnings, withdrawals, and transaction history
          </Text>
        </LinearGradient>

        {/* Content */}
        {loading && !refreshing ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#004aad" />
          </View>
        ) : !historyData ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <Icon name="receipt" size={48} color="#d1d5db" />
            <Text style={{ fontSize: 16, color: '#6b7280', marginTop: 12 }}>
              No history data available
            </Text>
            <View style={{ marginTop: 16 }}>
              <Button
                title="Retry"
                onPress={fetchWithdrawalHistory}
                variant="outline"
              />
            </View>
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}>
            <View style={{ padding: 16 }}>
              {/* Summary Cards */}
              <View style={{ flexDirection: 'row', marginBottom: 20 }}>
                <SummaryCard
                  title="Total Earned"
                  amount={historyData.summary.total_earned}
                  gradientColors={['#3b82f6', '#2563eb']}
                />
                <SummaryCard
                  title="Available Balance"
                  amount={historyData.summary.available_to_withdraw}
                  gradientColors={['#10b981', '#059669']}
                />
                <SummaryCard
                  title="Total Withdrawn"
                  amount={historyData.summary.total_withdrawn}
                  gradientColors={['#f59e0b', '#d97706']}
                />
              </View>

              {/* Filters */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 16 }}>
                <FilterButton
                  title="All Transactions"
                  active={selectedFilter === 'all'}
                  onPress={() => setSelectedFilter('all')}
                />
                <FilterButton
                  title="Earnings"
                  active={selectedFilter === 'credit'}
                  onPress={() => setSelectedFilter('credit')}
                  icon="arrow-up"
                  iconColor="#10b981"
                />
                <FilterButton
                  title="Withdrawals"
                  active={selectedFilter === 'debit'}
                  onPress={() => setSelectedFilter('debit')}
                  icon="arrow-down"
                  iconColor="#ef4444"
                />
              </ScrollView>

              {/* Transaction History */}
              <View
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#e5e7eb',
                  overflow: 'hidden',
                  marginBottom: 20,
                }}>
                {filteredLedger && filteredLedger.length > 0 ? (
                  filteredLedger.map((entry) => (
                    <View
                      key={entry.ledger_id}
                      style={{
                        padding: 16,
                        borderBottomWidth: 1,
                        borderBottomColor: '#f3f4f6',
                      }}>
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                        }}>
                        <View style={{ flexDirection: 'row', flex: 1 }}>
                          <View
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 20,
                              backgroundColor:
                                entry.direction === 'CREDIT'
                                  ? '#d1fae5'
                                  : '#fee2e2',
                              justifyContent: 'center',
                              alignItems: 'center',
                              marginRight: 12,
                            }}>
                            <Icon
                              name={
                                entry.direction === 'CREDIT'
                                  ? 'arrow-up'
                                  : 'arrow-down'
                              }
                              size={20}
                              color={
                                entry.direction === 'CREDIT'
                                  ? '#059669'
                                  : '#dc2626'
                              }
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={{
                                fontSize: 16,
                                fontWeight: '600',
                                color: '#111827',
                              }}>
                              {getReasonText(entry.reason)}
                            </Text>
                            <Text
                              style={{
                                fontSize: 12,
                                color: '#6b7280',
                                marginTop: 2,
                              }}>
                              {formatDate(entry.created_at)}
                              {entry.engagement_id && (
                                <Text> • Engagement #{entry.engagement_id}</Text>
                              )}
                            </Text>
                            {entry.reference_type && (
                              <Text
                                style={{
                                  fontSize: 11,
                                  color: '#9ca3af',
                                  marginTop: 4,
                                }}>
                                Ref: {entry.reference_type} #{entry.reference_id}
                              </Text>
                            )}
                          </View>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text
                            style={{
                              fontSize: 16,
                              fontWeight: 'bold',
                              color:
                                entry.direction === 'CREDIT'
                                  ? '#059669'
                                  : '#dc2626',
                            }}>
                            {entry.direction === 'CREDIT' ? '+' : '-'}
                            {formatAmount(entry.amount)}
                          </Text>
                          <Text
                            style={{
                              fontSize: 11,
                              color: '#6b7280',
                              marginTop: 2,
                            }}>
                            {entry.direction === 'CREDIT' ? 'Credit' : 'Debit'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))
                ) : (
                  <View
                    style={{
                      padding: 40,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <Icon name="receipt" size={48} color="#d1d5db" />
                    <Text
                      style={{
                        fontSize: 14,
                        color: '#6b7280',
                        marginTop: 12,
                      }}>
                      No transactions found
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: '#9ca3af',
                        marginTop: 4,
                      }}>
                      {selectedFilter !== 'all'
                        ? `No ${selectedFilter} transactions`
                        : 'Start providing services to see transactions'}
                    </Text>
                  </View>
                )}
              </View>

              {/* Payout History Section */}
              {historyData.payouts && historyData.payouts.length > 0 && (
                <View style={{ marginBottom: 20 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: '#111827',
                      marginBottom: 12,
                    }}>
                    Payout Requests
                  </Text>
                  <View
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: '#e5e7eb',
                      overflow: 'hidden',
                    }}>
                    {historyData.payouts.map((payout) => (
                      <View
                        key={payout.payout_id}
                        style={{
                          padding: 16,
                          borderBottomWidth: 1,
                          borderBottomColor: '#f3f4f6',
                        }}>
                        <View
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                          }}>
                          <View>
                            <Text
                              style={{
                                fontSize: 14,
                                fontWeight: '600',
                                color: '#111827',
                              }}>
                              Payout #{payout.payout_id}
                            </Text>
                            <Text
                              style={{
                                fontSize: 12,
                                color: '#6b7280',
                                marginTop: 2,
                              }}>
                              {formatDate(payout.created_at)}
                            </Text>
                            {payout.engagement_id && (
                              <Text
                                style={{
                                  fontSize: 12,
                                  color: '#6b7280',
                                  marginTop: 4,
                                }}>
                                Engagement #{payout.engagement_id}
                              </Text>
                            )}
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text
                              style={{
                                fontSize: 16,
                                fontWeight: 'bold',
                                color: '#111827',
                              }}>
                              {formatAmount(payout.net_amount)}
                            </Text>
                            <View style={{ marginTop: 4 }}>
                              {getStatusBadge(payout.status)}
                            </View>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
};