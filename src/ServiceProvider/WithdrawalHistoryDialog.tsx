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
  useWindowDimensions,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import PaymentInstance from '../services/paymentInstance';
import { BOOKING_HEADER_GRADIENT } from '../theme/brandColors';

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

// Common Badge Component with Gradient
const Badge: React.FC<{
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'default';
}> = ({ children, variant = 'default' }) => {
  const getBadgeGradient = () => {
    switch (variant) {
      case 'success':
        return ['#d1fae5', '#a7f3d0'];
      case 'warning':
        return ['#fef3c7', '#fde68a'];
      case 'danger':
        return ['#fee2e2', '#fecaca'];
      default:
        return ['#f1f5f9', '#e2e8f0'];
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'success': return '#065f46';
      case 'warning': return '#92400e';
      case 'danger': return '#991b1b';
      default: return '#475569';
    }
  };

  const gradientColors = getBadgeGradient();
  
  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={{
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
      }}>
      <Text style={{ fontSize: 11, fontWeight: '600', color: getTextColor() }}>
        {children}
      </Text>
    </LinearGradient>
  );
};

// Summary Card Component with Gradient
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
      end={{ x: 1, y: 1 }}
      style={{
        borderRadius: 16,
        padding: 16,
        flex: 1,
        marginHorizontal: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
      }}>
      <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', marginBottom: 6, fontWeight: '500' }}>
        {title}
      </Text>
      <Text style={{ fontSize: 20, fontWeight: '800', color: '#ffffff' }}>
        {formatAmount(amount)}
      </Text>
    </LinearGradient>
  );
};

// Filter Button Component with Gradient
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
        borderRadius: 24,
        overflow: 'hidden',
        marginRight: 10,
      }}>
      <LinearGradient
        colors={active ? [...BOOKING_HEADER_GRADIENT] : ['#f1f5f9', '#f1f5f9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          paddingHorizontal: 18,
          paddingVertical: 10,
          flexDirection: 'row',
          alignItems: 'center',
        }}>
        {icon && (
          <Icon
            name={icon}
            size={16}
            color={active ? '#ffffff' : iconColor || '#64748b'}
            style={{ marginRight: 8 }}
          />
        )}
        <Text
          style={{
            color: active ? '#ffffff' : '#475569',
            fontWeight: active ? '600' : '500',
            fontSize: 13,
          }}>
          {title}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

export const WithdrawalHistoryDialog: React.FC<WithdrawalHistoryDialogProps> = ({
  visible,
  onClose,
  serviceProviderId,
}) => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [historyData, setHistoryData] = useState<PayoutHistoryResponse | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'credit' | 'debit'>('all');

  // Responsive dimensions
  const modalWidth = Math.min(windowWidth * 0.92, 500);

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

  const getReasonIcon = (reason: LedgerEntry['reason']) => {
    switch (reason) {
      case 'DAILY_EARNED':
        return 'cash-plus';
      case 'WITHDRAWAL':
        return 'cash-minus';
      case 'SERVICE_FEE':
        return 'hand-coin';
      case 'SECURITY_DEPOSIT':
        return 'shield-check';
      case 'REFUND':
        return 'cash-refund';
      default:
        return 'receipt';
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
      <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
        
        {/* Header with BOOKING_HEADER_GRADIENT */}
        <LinearGradient
          colors={[...BOOKING_HEADER_GRADIENT]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingTop: Platform.OS === 'ios' ? 50 : 40,
            paddingBottom: 24,
            paddingHorizontal: 20,
            borderBottomLeftRadius: 24,
            borderBottomRightRadius: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 8,
          }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <TouchableOpacity onPress={onClose} style={{ padding: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20 }}>
              <Icon name="close" size={22} color="#ffffff" />
            </TouchableOpacity>
            <Text
              style={{
                fontSize: 20,
                fontWeight: '700',
                color: '#ffffff',
                textAlign: 'center',
                flex: 1,
              }}>
              Withdrawal History
            </Text>
            <View style={{ width: 36 }} />
          </View>
          <Text
            style={{
              fontSize: 13,
              color: 'rgba(255,255,255,0.85)',
              textAlign: 'center',
              marginTop: 12,
            }}>
            View your earnings, withdrawals, and transaction history
          </Text>
        </LinearGradient>

        {/* Content */}
        {loading && !refreshing ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={{ marginTop: 12, fontSize: 14, color: '#64748b' }}>Loading history...</Text>
          </View>
        ) : !historyData ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Icon name="receipt" size={40} color="#94a3b8" />
            </View>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#334155', marginBottom: 8 }}>
              No history data available
            </Text>
            <Text style={{ fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 20 }}>
              Your transaction history will appear here
            </Text>
            <TouchableOpacity onPress={fetchWithdrawalHistory}>
              <LinearGradient
                colors={[...BOOKING_HEADER_GRADIENT]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ paddingHorizontal: 24, paddingVertical: 10, borderRadius: 24 }}>
                <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 14 }}>Retry</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" colors={["#3b82f6"]} />
            }
            showsVerticalScrollIndicator={false}>
            <View style={{ padding: 16 }}>
              {/* Summary Cards */}
              <View style={{ flexDirection: 'row', marginBottom: 24, flexWrap: 'wrap', gap: 8 }}>
                <SummaryCard
                  title="Total Earned"
                  amount={historyData.summary.total_earned}
                  gradientColors={['#3b82f6', '#1e40af']}
                />
                <SummaryCard
                  title="Available Balance"
                  amount={historyData.summary.available_to_withdraw}
                  gradientColors={['#10b981', '#047857']}
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
                style={{ marginBottom: 20 }}
                contentContainerStyle={{ paddingRight: 16 }}>
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
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: '#e2e8f0',
                  overflow: 'hidden',
                  marginBottom: 20,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.04,
                  shadowRadius: 4,
                  elevation: 2,
                }}>
                {filteredLedger && filteredLedger.length > 0 ? (
                  filteredLedger.map((entry, index) => (
                    <View
                      key={entry.ledger_id}
                      style={{
                        padding: 16,
                        borderBottomWidth: index === filteredLedger.length - 1 ? 0 : 1,
                        borderBottomColor: '#f1f5f9',
                      }}>
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                        }}>
                        <View style={{ flexDirection: 'row', flex: 1 }}>
                          <LinearGradient
                            colors={entry.direction === 'CREDIT' ? ['#d1fae5', '#a7f3d0'] : ['#fee2e2', '#fecaca']}
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: 24,
                              justifyContent: 'center',
                              alignItems: 'center',
                              marginRight: 14,
                            }}>
                            <Icon
                              name={getReasonIcon(entry.reason)}
                              size={22}
                              color={entry.direction === 'CREDIT' ? '#059669' : '#dc2626'}
                            />
                          </LinearGradient>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={{
                                fontSize: 15,
                                fontWeight: '600',
                                color: '#0f172a',
                                marginBottom: 4,
                              }}>
                              {getReasonText(entry.reason)}
                            </Text>
                            <Text
                              style={{
                                fontSize: 12,
                                color: '#64748b',
                              }}>
                              {formatDate(entry.created_at)}
                            </Text>
                            {entry.engagement_id && (
                              <Text
                                style={{
                                  fontSize: 11,
                                  color: '#94a3b8',
                                  marginTop: 4,
                                }}>
                                Engagement #{entry.engagement_id}
                              </Text>
                            )}
                          </View>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text
                            style={{
                              fontSize: 17,
                              fontWeight: '700',
                              color: entry.direction === 'CREDIT' ? '#059669' : '#dc2626',
                              marginBottom: 4,
                            }}>
                            {entry.direction === 'CREDIT' ? '+' : '-'}
                            {formatAmount(entry.amount)}
                          </Text>
                          <Text
                            style={{
                              fontSize: 11,
                              color: '#64748b',
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
                      padding: 48,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                      <Icon name="receipt" size={32} color="#94a3b8" />
                    </View>
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: '600',
                        color: '#334155',
                        marginBottom: 6,
                      }}>
                      No transactions found
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        color: '#94a3b8',
                        textAlign: 'center',
                      }}>
                      {selectedFilter !== 'all'
                        ? `No ${selectedFilter} transactions available`
                        : 'Start providing services to see transactions'}
                    </Text>
                  </View>
                )}
              </View>

              {/* Payout History Section */}
              {historyData.payouts && historyData.payouts.length > 0 && (
                <View style={{ marginBottom: 24 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '700',
                      color: '#0f172a',
                      marginBottom: 14,
                      paddingHorizontal: 4,
                    }}>
                    Payout Requests
                  </Text>
                  <View
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: '#e2e8f0',
                      overflow: 'hidden',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.04,
                      shadowRadius: 4,
                      elevation: 2,
                    }}>
                    {historyData.payouts.map((payout, index) => (
                      <View
                        key={payout.payout_id}
                        style={{
                          padding: 16,
                          borderBottomWidth: index === historyData.payouts!.length - 1 ? 0 : 1,
                          borderBottomColor: '#f1f5f9',
                        }}>
                        <View
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                          }}>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={{
                                fontSize: 14,
                                fontWeight: '600',
                                color: '#0f172a',
                                marginBottom: 4,
                              }}>
                              Payout Request
                            </Text>
                            <Text
                              style={{
                                fontSize: 12,
                                color: '#64748b',
                                marginBottom: 4,
                              }}>
                              {formatDate(payout.created_at)}
                            </Text>
                            {payout.engagement_id && (
                              <Text
                                style={{
                                  fontSize: 11,
                                  color: '#94a3b8',
                                }}>
                                Engagement #{payout.engagement_id}
                              </Text>
                            )}
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text
                              style={{
                                fontSize: 17,
                                fontWeight: '700',
                                color: '#0f172a',
                                marginBottom: 6,
                              }}>
                              {formatAmount(payout.net_amount)}
                            </Text>
                            {getStatusBadge(payout.status)}
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

export default WithdrawalHistoryDialog;