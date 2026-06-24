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
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../src/Settings/ThemeContext';
import { BOOKING_HEADER_GRADIENT, GRADIENTS } from '../theme/brandColors';
import { useAppUser } from '../context/AppUserContext';
import { getMobileTabBarHeight } from '../Constants/mobileLayout';
import {
  CustomerWallet,
  fetchCustomerWallet,
  formatWalletMoney,
  formatWalletTransactionDisplayLabel,
  groupWalletTransactions,
  isCreditTransaction,
  isPaymentCancelledError,
  topUpCustomerWallet,
  WALLET_TOPUP_MAX_INR,
  WALLET_TOPUP_MIN_INR,
  WalletTransaction,
} from '../services/walletService';
import { resolveCustomerId } from '../services/couponService';

const HORIZONTAL_GUTTER = 16;
const TOP_UP_PRESETS = [500, 1000, 2000, 5000];

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


const formatTime = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '';
  }
};

const WalletPage: React.FC<WalletPageProps> = ({ onBack }) => {
  const { colors, isDarkMode, fontSize } = useTheme();
  const { t } = useTranslation();
  const { appUser } = useAppUser();
  const insets = useSafeAreaInsets();
  const footerClearance = getMobileTabBarHeight(insets.bottom) + 28;

  const [activeTab, setActiveTab] = useState<'transactions' | 'rewards'>('transactions');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [wallet, setWallet] = useState<CustomerWallet | null>(null);
  const [displayBalance, setDisplayBalance] = useState(0);
  const [addMoneyOpen, setAddMoneyOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [banner, setBanner] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const customerId = resolveCustomerId(appUser);
  const parsedTopUpAmount = Number(topUpAmount);
  const topUpAmountValid =
    Number.isFinite(parsedTopUpAmount) &&
    parsedTopUpAmount >= WALLET_TOPUP_MIN_INR &&
    parsedTopUpAmount <= WALLET_TOPUP_MAX_INR;

  const customerPrefill = useMemo(() => {
    const user = appUser as Record<string, unknown> | null | undefined;
    const first = String(user?.firstname || user?.firstName || user?.given_name || '').trim();
    const last = String(user?.lastname || user?.lastName || user?.family_name || '').trim();
    return {
      name: [first, last].filter(Boolean).join(' ').trim() || undefined,
      email: String(user?.emailid || user?.email || '').trim() || undefined,
      contact: String(user?.mobileno || user?.mobile || user?.phone || '').trim() || undefined,
    };
  }, [appUser]);

  const transactionGroups = useMemo(
    () => groupWalletTransactions(wallet?.transactions ?? []),
    [wallet?.transactions]
  );

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
        setDisplayBalance(Number(data.balance ?? 0));
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

  const showBanner = (type: 'success' | 'error' | 'info', message: string) => {
    setBanner({ type, message });
  };

  const handleTopUp = async () => {
    if (!customerId || !topUpAmountValid || topUpLoading) return;

    setTopUpLoading(true);
    try {
      const result = await topUpCustomerWallet(
        customerId,
        parsedTopUpAmount,
        customerPrefill
      );
      setAddMoneyOpen(false);
      setTopUpAmount('');
      await fetchWalletData(false);
      setDisplayBalance(Number(result.balance ?? 0));
      showBanner(
        'success',
        result.alreadyProcessed
          ? t('wallet.topUp.alreadyDone')
          : t('wallet.topUp.success', {
              amount: parsedTopUpAmount.toLocaleString('en-IN'),
            })
      );
    } catch (error) {
      if (isPaymentCancelledError(error)) {
        showBanner('info', t('wallet.topUp.cancelled'));
      } else {
        const msg =
          error &&
          typeof error === 'object' &&
          'response' in error &&
          (error as { response?: { data?: { error?: string } } }).response?.data?.error;
        showBanner(
          'error',
          typeof msg === 'string' && msg.trim() ? msg : t('wallet.topUp.failed')
        );
      }
    } finally {
      setTopUpLoading(false);
    }
  };

  const transactions = wallet?.transactions ?? [];

  // Updated header with BOOKING_HEADER_GRADIENT
  const renderHeader = () => (
    <LinearGradient
      colors={[...(isDarkMode ? GRADIENTS.walletDark : GRADIENTS.walletLight)]}
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
            {t('wallet.title')}
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {t('wallet.subtitle', { defaultValue: 'Manage your balance and rewards' })}
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

  const renderAddMoneyPanel = () => (
    <View
      style={[
        styles.addMoneyPanel,
        {
          backgroundColor: isDarkMode ? colors.surface : '#f8fafc',
          borderColor: colors.border + '55',
        },
      ]}
    >
      <Text style={[styles.addMoneyHint, { color: colors.textSecondary, fontSize: fontSizes.small }]}>
        {t('wallet.topUp.hint')}
      </Text>

      <View style={styles.presetRow}>
        {TOP_UP_PRESETS.map((preset) => {
          const selected = parsedTopUpAmount === preset;
          return (
            <TouchableOpacity
              key={preset}
              style={[
                styles.presetChip,
                {
                  borderColor: selected ? colors.primary : colors.border,
                  backgroundColor: selected ? colors.primary : colors.card,
                },
              ]}
              onPress={() => setTopUpAmount(String(preset))}
              disabled={topUpLoading}
            >
              <Text
                style={[
                  styles.presetChipText,
                  {
                    color: selected ? '#fff' : colors.text,
                    fontSize: fontSizes.small,
                  },
                ]}
              >
                {formatWalletMoney(preset, { compact: true })}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[styles.inputLabel, { color: colors.textSecondary, fontSize: fontSizes.small }]}>
        {t('wallet.topUp.enterAmount')}
      </Text>
      <View style={[styles.amountInputWrap, { borderColor: topUpAmount.length > 0 && !topUpAmountValid ? colors.error : colors.border, backgroundColor: colors.card }]}>
        <Text style={[styles.currencyPrefix, { color: colors.textSecondary }]}>₹</Text>
        <TextInput
          style={[styles.amountInput, { color: colors.text, fontSize: fontSizes.text }]}
          value={topUpAmount}
          onChangeText={(text) => setTopUpAmount(text.replace(/[^\d]/g, ''))}
          keyboardType="number-pad"
          placeholder={`${WALLET_TOPUP_MIN_INR} – ${WALLET_TOPUP_MAX_INR.toLocaleString('en-IN')}`}
          placeholderTextColor={colors.placeholder}
          editable={!topUpLoading}
        />
      </View>
      <Text style={[styles.limitsText, { color: colors.textSecondary, fontSize: fontSizes.small }]}>
        {t('wallet.topUp.limits', {
          min: WALLET_TOPUP_MIN_INR,
          max: WALLET_TOPUP_MAX_INR.toLocaleString('en-IN'),
        })}
      </Text>

      <TouchableOpacity
        style={[
          styles.payButton,
          {
            backgroundColor: colors.primary,
            opacity: !topUpAmountValid || topUpLoading ? 0.55 : 1,
          },
        ]}
        onPress={() => void handleTopUp()}
        disabled={!topUpAmountValid || topUpLoading}
      >
        {topUpLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Icon name="shield-check-outline" size={18} color="#fff" />
            <Text style={[styles.payButtonText, { fontSize: fontSizes.button }]}>
              {t('wallet.topUp.proceedToPay')}
            </Text>
          </>
        )}
      </TouchableOpacity>
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
                {t('wallet.availableBalance')}
              </Text>
              <Text
                style={[styles.balanceAmount, { color: colors.text, fontSize: fontSizes.balance }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.65}
              >
                {formatMoney(displayBalance)}
              </Text>
            </View>
            <View style={[styles.walletIconWrap, { backgroundColor: colors.primary + '12' }]}>
              <Icon name="wallet-outline" size={24} color={colors.primary} />
            </View>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.primaryAction, { backgroundColor: colors.primary }]}
              onPress={() => setAddMoneyOpen((open) => !open)}
              activeOpacity={0.9}
              disabled={topUpLoading}
            >
              <Icon name={addMoneyOpen ? 'close' : 'plus'} size={18} color="#ffffff" />
              <Text style={[styles.primaryActionText, { color: '#ffffff', fontSize: fontSizes.button }]}>
                {addMoneyOpen ? t('wallet.topUp.close') : t('wallet.addMoney')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.secondaryAction,
                {
                  backgroundColor: isDarkMode ? colors.surface : '#f8fafc',
                  borderColor: colors.primary + '45',
                },
              ]}
              onPress={() => Alert.alert(t('wallet.transfer'), t('wallet.transferComingSoon', { defaultValue: 'This feature will be available soon.' }))}
              activeOpacity={0.9}
            >
              <Icon name="swap-horizontal" size={18} color={colors.primary} />
              <Text style={[styles.secondaryActionText, { color: colors.primary, fontSize: fontSizes.button }]}>
                {t('wallet.transfer')}
              </Text>
            </TouchableOpacity>
          </View>

          {addMoneyOpen ? renderAddMoneyPanel() : null}
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
            {formatWalletTransactionDisplayLabel(transaction)}
          </Text>
          <Text style={[styles.txMeta, { color: colors.textSecondary, fontSize: fontSizes.small }]}>
            {formatTime(transaction.created_at)} · {transaction.status || 'completed'}
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

  const groupLabel = (labelKey: 'today' | 'yesterday' | 'earlier', dateLabel?: string) => {
    if (labelKey === 'today') return t('wallet.groups.today');
    if (labelKey === 'yesterday') return t('wallet.groups.yesterday');
    return dateLabel || t('wallet.groups.earlier');
  };

  const renderTransactions = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionLabel, { color: colors.textSecondary, fontSize: fontSizes.small }]}>
        {t('wallet.recentActivity')}
      </Text>
      {transactions.length > 0 ? (
        transactionGroups.map((group) => (
          <View key={group.key}>
            <Text style={[styles.groupLabel, { color: colors.textSecondary, fontSize: fontSizes.small }]}>
              {groupLabel(group.labelKey, group.dateLabel)}
            </Text>
            {group.items.map(renderTransactionItem)}
          </View>
        ))
      ) : (
        <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border + '25' }]}>
          <Icon name="history" size={44} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text, fontSize: fontSizes.title }]}>
            {t('wallet.noTransactions')}
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary, fontSize: fontSizes.text }]}>
            {t('wallet.noTransactionsDesc')}
          </Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: colors.primary }]}
            onPress={() => setAddMoneyOpen(true)}
          >
            <Text style={[styles.retryBtnText, { fontSize: fontSizes.button }]}>{t('wallet.addMoney')}</Text>
          </TouchableOpacity>
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

      {banner ? (
        <View
          style={[
            styles.banner,
            {
              backgroundColor:
                banner.type === 'success'
                  ? colors.successLight
                  : banner.type === 'error'
                    ? colors.error + '18'
                    : colors.infoLight,
              borderColor:
                banner.type === 'success'
                  ? colors.success
                  : banner.type === 'error'
                    ? colors.error
                    : colors.primary,
            },
          ]}
        >
          <Text
            style={[
              styles.bannerText,
              {
                color:
                  banner.type === 'success'
                    ? colors.success
                    : banner.type === 'error'
                      ? colors.error
                      : colors.primary,
                fontSize: fontSizes.small,
              },
            ]}
          >
            {banner.message}
          </Text>
          <TouchableOpacity onPress={() => setBanner(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Icon name="close" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      ) : null}

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
  addMoneyPanel: {
    marginTop: 14,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  addMoneyHint: { lineHeight: 18 },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetChip: {
    flexGrow: 1,
    minWidth: '22%',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  presetChipText: { fontWeight: '700' },
  inputLabel: {
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  amountInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    minHeight: 46,
  },
  currencyPrefix: { fontWeight: '700', marginRight: 6, fontSize: 16 },
  amountInput: {
    flex: 1,
    paddingVertical: 10,
    fontWeight: '600',
  },
  limitsText: { lineHeight: 18 },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 46,
    borderRadius: 12,
    marginTop: 4,
  },
  payButtonText: { color: '#fff', fontWeight: '700' },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: HORIZONTAL_GUTTER,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  bannerText: { flex: 1, lineHeight: 18, fontWeight: '500' },
  groupLabel: {
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 4,
    textTransform: 'uppercase',
  },
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