/* eslint-disable */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  BackHandler,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/Settings/ThemeContext';
import { BOOKING_HEADER_GRADIENT } from '../theme/brandColors';
import { useAppUser } from '../context/AppUserContext';
import { getMobileTabBarHeight } from '../Constants/mobileLayout';
import {
  CustomerWallet,
  fetchCustomerWallet,
  formatWalletTransactionLabel,
  isCreditTransaction,
  WalletTransaction,
} from '../services/walletService';
import { resolveCustomerId } from '../services/couponService';

const HORIZONTAL_GUTTER = 16;

interface WalletPageProps {
  onBack?: () => void;
}

const formatMoney = (value: number) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return '₹0.00';
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatMoneyCompact = (value: number) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return '₹0';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}k`;
  return `₹${Math.round(n)}`;
};

const formatDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
};

const WalletPage: React.FC<WalletPageProps> = ({ onBack }) => {
  const { colors, isDarkMode, fontSize } = useTheme();
  const { appUser } = useAppUser();
  const insets = useSafeAreaInsets();
  const footerClearance = getMobileTabBarHeight(insets.bottom) + 28;

  const [activeTab, setActiveTab] = useState<'transactions' | 'rewards'>('transactions');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [wallet, setWallet] = useState<CustomerWallet | null>(null);

  const customerId = resolveCustomerId(appUser);

  const fontSizes = useMemo(() => {
    switch (fontSize) {
      case 'small':
        return { title: 18, balance: 30, text: 13, small: 11, button: 12, header: 18 };
      case 'large':
        return { title: 24, balance: 36, text: 17, small: 15, button: 16, header: 24 };
      default:
        return { title: 20, balance: 32, text: 15, small: 13, button: 14, header: 20 };
    }
  }, [fontSize]);

  const fetchWalletData = useCallback(
    async (showLoading = true) => {
      if (!customerId) {
        setHasError(true);
        setIsLoading(false);
        return;
      }

      if (showLoading) setIsLoading(true);
      setHasError(false);

      try {
        const data = await fetchCustomerWallet(customerId);
        setWallet(data);
        setHasError(false);
      } catch (error: unknown) {
        console.error('Wallet fetch error:', error);
        setHasError(true);
        setWallet(null);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [customerId]
  );

  useEffect(() => {
    void fetchWalletData(true);
  }, [fetchWalletData]);

  // Handle back button press - returns to homepage
  const handleBackPress = () => {
    if (onBack) {
      onBack();
      return true;
    }
    return false;
  };

  // Set up back handler when component mounts
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    
    // Clean up the event listener when component unmounts
    return () => backHandler.remove();
  }, [onBack]);

  const onRefresh = () => {
    setIsRefreshing(true);
    void fetchWalletData(false);
  };

  const transactions = wallet?.transactions ?? [];

  // Updated header with BOOKING_HEADER_GRADIENT
  const renderHeader = () => (
    <LinearGradient
      colors={[...BOOKING_HEADER_GRADIENT]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.headerGradient}
    >
      <View style={styles.headerContent}>
        <TouchableOpacity
          style={[styles.headerSideSlot, styles.headerBackBtn]}
          onPress={handleBackPress}
          accessibilityLabel="Go back"
        >
          <Icon name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerTitleBlock} pointerEvents="none">
          <Text style={[styles.headerTitle, { fontSize: fontSizes.header + 2 }]} numberOfLines={1}>
            My Wallet
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            Manage your balance and rewards
          </Text>
        </View>
        <View style={styles.headerSideSlot} />
      </View>
    </LinearGradient>
  );

  const renderTabSwitcher = () => (
    <View style={styles.tabRow}>
      {(
        [
          { key: 'transactions' as const, label: 'Transactions', icon: 'history', count: transactions.length },
          { key: 'rewards' as const, label: 'Rewards', icon: 'star-outline', count: wallet?.rewards ?? 0 },
        ] as const
      ).map((tab) => {
        const active = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tabChip,
              {
                backgroundColor: active ? colors.primary : isDarkMode ? colors.card : '#ffffff',
                borderColor: active ? colors.primary : colors.border + '55',
              },
            ]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.85}
          >
            <Icon name={tab.icon} size={16} color={active ? '#fff' : colors.textSecondary} />
            <Text style={[styles.tabChipText, { color: active ? '#fff' : colors.textSecondary, fontSize: fontSizes.small }]}>
              {tab.label}
            </Text>
            <View style={[styles.tabCount, { backgroundColor: active ? 'rgba(255,255,255,0.28)' : colors.border + '90' }]}>
              <Text style={[styles.tabCountText, { color: active ? '#fff' : colors.textSecondary }]}>{tab.count}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderBalanceCard = () => {
    const cardBg = isDarkMode ? colors.card : '#ffffff';
    return (
      <View
        style={[
          styles.balanceCardShell,
          {
            backgroundColor: cardBg,
            borderColor: colors.border + (isDarkMode ? '55' : '35'),
          },
        ]}
      >
        <View style={styles.balanceCardContent}>
          <View style={styles.balanceTop}>
            <View style={styles.balanceMain}>
              <Text style={[styles.balanceLabel, { color: colors.textSecondary, fontSize: fontSizes.small }]}>
                Available balance
              </Text>
              <Text
                style={[styles.balanceAmount, { color: colors.text, fontSize: fontSizes.balance }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.65}
              >
                {formatMoney(wallet?.balance ?? 0)}
              </Text>
            </View>
            <View style={[styles.walletIconWrap, { backgroundColor: colors.primary + '12' }]}>
              <Icon name="wallet-outline" size={24} color={colors.primary} />
            </View>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.primaryAction, { backgroundColor: colors.primary }]}
              onPress={() => Alert.alert('Add money', 'This feature will be available soon.')}
              activeOpacity={0.9}
            >
              <Icon name="plus" size={18} color="#ffffff" />
              <Text style={[styles.primaryActionText, { color: '#ffffff', fontSize: fontSizes.button }]}>Add money</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.secondaryAction,
                {
                  backgroundColor: isDarkMode ? colors.surface : '#f8fafc',
                  borderColor: colors.primary + '45',
                },
              ]}
              onPress={() => Alert.alert('Transfer', 'This feature will be available soon.')}
              activeOpacity={0.9}
            >
              <Icon name="swap-horizontal" size={18} color={colors.primary} />
              <Text style={[styles.secondaryActionText, { color: colors.primary, fontSize: fontSizes.button }]}>
                Transfer
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderTransactionItem = (transaction: WalletTransaction) => {
    const isCredit = isCreditTransaction(transaction.transaction_type);
    return (
      <View
        key={String(transaction.transaction_id)}
        style={[styles.txCard, { backgroundColor: colors.card, borderColor: colors.border + '30' }]}
      >
        <View
          style={[
            styles.txIcon,
            { backgroundColor: isCredit ? colors.success + '18' : colors.error + '18' },
          ]}
        >
          <Icon
            name={isCredit ? 'arrow-bottom-left' : 'arrow-top-right'}
            size={20}
            color={isCredit ? colors.success : colors.error}
          />
        </View>
        <View style={styles.txBody}>
          <Text style={[styles.txTitle, { color: colors.text, fontSize: fontSizes.text }]} numberOfLines={2}>
            {formatWalletTransactionLabel(transaction)}
          </Text>
          <Text style={[styles.txMeta, { color: colors.textSecondary, fontSize: fontSizes.small }]}>
            {formatDate(transaction.created_at)} · {transaction.status || 'completed'}
          </Text>
        </View>
        <View style={styles.txAmountCol}>
          <Text
            style={[styles.txAmount, { color: isCredit ? colors.success : colors.error, fontSize: fontSizes.text }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            {isCredit ? '+' : '-'}
            {formatMoney(transaction.amount)}
          </Text>
        </View>
      </View>
    );
  };

  const renderTransactions = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionLabel, { color: colors.textSecondary, fontSize: fontSizes.small }]}>
        RECENT ACTIVITY
      </Text>
      {transactions.length > 0 ? (
        transactions.map(renderTransactionItem)
      ) : (
        <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border + '25' }]}>
          <Icon name="history" size={44} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text, fontSize: fontSizes.title }]}>No transactions yet</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary, fontSize: fontSizes.text }]}>
            Your payments and refunds will show up here.
          </Text>
        </View>
      )}
    </View>
  );

  const renderRewards = () => (
    <View style={styles.section}>
      <LinearGradient
        colors={isDarkMode ? ['#312e81', '#4338ca'] : ['#4f46e5', '#6366f1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.rewardsCard}
      >
        <View style={styles.rewardsHeader}>
          <Icon name="star-four-points" size={32} color="#fde68a" />
          <View>
            <Text style={[styles.rewardsPoints, { fontSize: fontSizes.balance }]}>{wallet?.rewards ?? 0}</Text>
            <Text style={[styles.rewardsLabel, { fontSize: fontSizes.small }]}>Reward points</Text>
          </View>
        </View>
        <Text style={[styles.rewardsHint, { fontSize: fontSizes.text }]}>
          Earn points when you complete bookings. Redeem them for offers soon.
        </Text>
        <TouchableOpacity
          style={styles.rewardsCta}
          onPress={() => Alert.alert('Rewards', 'Rewards catalog coming soon.')}
        >
          <Text style={[styles.rewardsCtaText, { color: '#4338ca', fontSize: fontSizes.button }]}>View rewards catalog</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );

  const renderLoading = () => (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.centeredTitle, { color: colors.text, fontSize: fontSizes.text }]}>Loading wallet…</Text>
    </View>
  );

  const renderError = () => (
    <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border + '25', marginTop: 8 }]}>
      <Icon name="wallet-plus-outline" size={48} color={colors.primary} />
      <Text style={[styles.emptyTitle, { color: colors.text, fontSize: fontSizes.title }]}>No wallet yet</Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary, fontSize: fontSizes.text }]}>
        Book a service to activate your wallet and track payments in one place.
      </Text>
      <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={() => void fetchWalletData(true)}>
        <Text style={[styles.retryBtnText, { fontSize: fontSizes.button }]}>Try again</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {renderHeader()}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: footerClearance }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {isLoading ? (
          renderLoading()
        ) : hasError || !wallet ? (
          renderError()
        ) : (
          <>
            <View style={[styles.contentPad, styles.balanceSection]}>{renderBalanceCard()}</View>
            <View style={[styles.contentPad, styles.tabSection]}>{renderTabSwitcher()}</View>
            {activeTab === 'transactions' ? renderTransactions() : renderRewards()}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: {
    width: '100%',
    alignSelf: 'stretch',
    backgroundColor: 'transparent',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingBottom: 12,
    paddingTop: 6,
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    minHeight: 68,
    paddingHorizontal: HORIZONTAL_GUTTER,
  },
  headerSideSlot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  headerBackBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.20)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTitleBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    minWidth: 0,
  },
  headerTitle: {
    color: '#ffffff',
    fontWeight: '700',
    letterSpacing: -0.3,
    textAlign: 'center',
    width: '100%',
  },
  headerSubtitle: {
    color: 'rgba(219, 234, 254, 0.95)',
    textAlign: 'center',
    fontSize: 13,
    marginTop: 4,
    fontWeight: '500',
  },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  contentPad: {
    paddingHorizontal: HORIZONTAL_GUTTER,
  },
  balanceSection: {
    paddingTop: 16,
    paddingBottom: 4,
  },
  tabSection: {
    paddingTop: 12,
    paddingBottom: 4,
  },
  balanceCardShell: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  balanceCardContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  balanceTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  balanceMain: {
    flex: 1,
    minWidth: 0,
  },
  balanceLabel: { fontWeight: '600', letterSpacing: 0.2 },
  balanceAmount: {
    fontWeight: '800',
    marginTop: 4,
    letterSpacing: -0.5,
    lineHeight: 38,
  },
  walletIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 46,
    paddingVertical: 11,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  primaryActionText: { fontWeight: '700' },
  secondaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    minHeight: 46,
    paddingVertical: 11,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  secondaryActionText: { fontWeight: '700' },
  tabRow: {
    flexDirection: 'row',
    gap: 10,
  },
  tabChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  tabChipText: { fontWeight: '700' },
  tabCount: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
  },
  tabCountText: { fontSize: 10, fontWeight: '700' },
  section: {
    paddingHorizontal: HORIZONTAL_GUTTER,
    paddingTop: 12,
    paddingBottom: 24,
  },
  sectionLabel: {
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  txIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  txBody: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    paddingRight: 4,
  },
  txTitle: { fontWeight: '600', lineHeight: 20 },
  txMeta: { marginTop: 4, lineHeight: 18 },
  txAmountCol: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    flexShrink: 0,
    maxWidth: 118,
    minHeight: 44,
  },
  txAmount: {
    fontWeight: '700',
    textAlign: 'right',
    lineHeight: 20,
  },
  rewardsCard: {
    borderRadius: 18,
    padding: 22,
  },
  rewardsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  rewardsPoints: { color: '#fff', fontWeight: '800' },
  rewardsLabel: { color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  rewardsHint: { color: 'rgba(255,255,255,0.9)', lineHeight: 22, marginBottom: 16 },
  rewardsCta: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  rewardsCtaText: { fontWeight: '700' },
  emptyCard: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 36,
    borderRadius: 18,
    borderWidth: 1,
  },
  emptyTitle: { fontWeight: '700', marginTop: 14, textAlign: 'center' },
  emptyText: { marginTop: 8, textAlign: 'center', lineHeight: 22 },
  retryBtn: {
    marginTop: 18,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryBtnText: { color: '#fff', fontWeight: '700' },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  centeredTitle: { marginTop: 12, fontWeight: '600' },
});

export default WalletPage;