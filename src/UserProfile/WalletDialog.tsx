/* eslint-disable */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  RefreshControl,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../src/Settings/ThemeContext';
import { useAppUser } from '../context/AppUserContext';
import PaymentInstance from '../services/paymentInstance';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface WalletPageProps {
  onBack?: () => void;
}

interface Wallet {
  balance: number;
  transactions: {
    transaction_id: number;
    transaction_type: string;
    amount: number;
    description: string;
    created_at: string;
    status: string;
  }[];
  rewards: number;
}

const WalletPage: React.FC<WalletPageProps> = ({ onBack }) => {
  const { colors, isDarkMode, fontSize } = useTheme();
  const { appUser } = useAppUser();
  
  const [activeTab, setActiveTab] = useState<'transactions' | 'rewards'>('transactions');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [wallet, setWallet] = useState<Wallet | null>(null);

  // Get font sizes based on settings
  const getFontSizes = () => {
    switch (fontSize) {
      case 'small':
        return { 
          title: 20, 
          balance: 28, 
          text: 13, 
          smallText: 11, 
          buttonText: 12, 
          headerTitle: 24,
          headerSubtitle: 14 
        };
      case 'large':
        return { 
          title: 26, 
          balance: 34, 
          text: 17, 
          smallText: 15, 
          buttonText: 16, 
          headerTitle: 32,
          headerSubtitle: 18 
        };
      default:
        return { 
          title: 22, 
          balance: 30, 
          text: 15, 
          smallText: 13, 
          buttonText: 14, 
          headerTitle: 28,
          headerSubtitle: 16 
        };
    }
  };

  const fontSizes = getFontSizes();

  // Get customer ID from appUser context
  const customerId = appUser?.customerid;

  const fetchWalletData = async (showLoading = true) => {
    if (!customerId) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    if (showLoading) {
      setIsLoading(true);
    }
    setHasError(false);
    
    try {
      console.log("Fetching wallet for user:", customerId);
      const response = await PaymentInstance.get(`/api/wallets/${customerId}`);
      console.log("Wallet API Response:", response.data);
      setWallet(response.data);
    } catch (error: any) {
      console.error("Wallet fetch error:", error);
      if (error.response?.data?.error === "Wallet not found for this customer" || 
          error.message?.includes("Wallet not found")) {
        setHasError(true);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (customerId) {
      fetchWalletData(true);
    } else {
      setIsLoading(false);
      setHasError(true);
    }
  }, [customerId]);

  // Pull to refresh handler
  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchWalletData(false);
  };

  // Retry fetching wallet
  const handleRetry = () => {
    fetchWalletData(true);
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  // Render loading state
  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.loadingText, { color: colors.text, fontSize: fontSizes.text }]}>
        Loading Wallet...
      </Text>
      <Text style={[styles.loadingSubtext, { color: colors.textSecondary, fontSize: fontSizes.smallText }]}>
        Retrieving account info
      </Text>
    </View>
  );

  // Render error state
  const renderError = () => (
    <View style={styles.errorContainer}>
      <View style={[styles.errorIconContainer, { backgroundColor: colors.border }]}>
        <Icon name="wallet-outline" size={40} color={colors.textSecondary} />
      </View>
      <Text style={[styles.errorTitle, { color: colors.text, fontSize: fontSizes.title }]}>
        No Wallet Found
      </Text>
      <Text style={[styles.errorMessage, { color: colors.textSecondary, fontSize: fontSizes.text }]}>
        You don't have a wallet yet. Start using our services to create one.
      </Text>
      <TouchableOpacity 
        style={[styles.retryButton, { backgroundColor: colors.primary }]} 
        onPress={handleRetry}
      >
        <Text style={[styles.retryButtonText, { color: '#fff', fontSize: fontSizes.buttonText }]}>
          Try Again
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Render balance card with gradient
  const renderBalanceCard = () => (
    <LinearGradient
      colors={['#0a2a66ff', '#004aadff']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.balanceCard}
    >
      <Text style={[styles.balanceLabel, { color: '#ffffffCC', fontSize: fontSizes.smallText }]}>
        Current Balance
      </Text>
      <Text style={[styles.balanceAmount, { color: '#fff', fontSize: fontSizes.balance }]}>
        ₹{wallet ? wallet.balance : 0}
      </Text>
      <View style={styles.balanceButtonsContainer}>
        <TouchableOpacity 
          style={[styles.addMoneyButton, { backgroundColor: '#fff' }]} 
          onPress={() => Alert.alert('Add Money', 'This feature will be available soon')}
        >
          <Icon name="plus" size={18} color="#004aadff" />
          <Text style={[styles.addMoneyButtonText, { color: '#004aadff', fontSize: fontSizes.buttonText }]}>
            Add Money
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.transferButton, { backgroundColor: '#ffffff40' }]} 
          onPress={() => Alert.alert('Transfer', 'This feature will be available soon')}
        >
          <Icon name="swap-horizontal" size={18} color="#fff" />
          <Text style={[styles.transferButtonText, { color: '#fff', fontSize: fontSizes.buttonText }]}>
            Transfer
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );

  // Render transactions tab
  const renderTransactions = () => (
    <View style={styles.tabContent}>
      <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontSizes.text }]}>
        Recent Transactions
      </Text>
      <ScrollView 
        style={styles.transactionsList}
        showsVerticalScrollIndicator={false}
      >
        {(wallet?.transactions || []).map((transaction) => (
          <View key={transaction.transaction_id} style={[styles.transactionItem, { borderBottomColor: colors.border }]}>
            <View style={[
              styles.transactionIconContainer,
              { backgroundColor: transaction.transaction_type === 'credit' ? colors.success + '20' : colors.error + '20' }
            ]}>
              <Icon 
                name={transaction.transaction_type === 'credit' ? 'arrow-up' : 'arrow-down'} 
                size={20} 
                color={transaction.transaction_type === 'credit' ? colors.success : colors.error} 
              />
            </View>
            <View style={styles.transactionDetails}>
              <Text style={[styles.transactionDescription, { color: colors.text, fontSize: fontSizes.text }]}>
                {transaction.description}
              </Text>
              <Text style={[styles.transactionMeta, { color: colors.textSecondary, fontSize: fontSizes.smallText }]}>
                {formatDate(transaction.created_at)} • {transaction.status}
              </Text>
            </View>
            <Text style={[
              styles.transactionAmount,
              { 
                color: transaction.transaction_type === 'credit' ? colors.success : colors.error,
                fontSize: fontSizes.text
              }
            ]}>
              {transaction.transaction_type === 'credit' ? '+' : '-'}₹{transaction.amount}
            </Text>
          </View>
        ))}
        {(wallet?.transactions || []).length === 0 && (
          <View style={styles.emptyTransactions}>
            <Icon name="history" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyTransactionsText, { color: colors.textSecondary, fontSize: fontSizes.text }]}>
              No transactions yet
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );

  // Render rewards tab with gradient
  const renderRewards = () => (
    <View style={styles.tabContent}>
      <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontSizes.text }]}>
        Your Rewards
      </Text>
      <LinearGradient
        colors={['#0a2a66ff', '#004aadff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.rewardsCard}
      >
        <View style={styles.rewardsPointsContainer}>
          <Icon name="star" size={24} color="#fff" />
          <Text style={[styles.rewardsPoints, { color: '#fff', fontSize: fontSizes.balance }]}>
            {wallet?.rewards ?? 0} Points
          </Text>
        </View>
        <Text style={[styles.rewardsMessage, { color: '#ffffffCC', fontSize: fontSizes.smallText }]}>
          Complete more bookings to earn more points!
        </Text>
        <TouchableOpacity 
          style={styles.rewardsButton}
          onPress={() => Alert.alert('Rewards Catalog', 'This feature will be available soon')}
        >
          <Text style={[styles.rewardsButtonText, { color: '#004aadff', fontSize: fontSizes.buttonText }]}>
            View Rewards Catalog
          </Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );

  // Render tabs
  const renderTabs = () => (
    <View style={[styles.tabsContainer, { borderBottomColor: colors.border }]}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'transactions' && styles.activeTab]}
        onPress={() => setActiveTab('transactions')}
      >
        <Text style={[
          styles.tabText,
          { color: activeTab === 'transactions' ? colors.primary : colors.textSecondary, fontSize: fontSizes.text }
        ]}>
          Transactions
        </Text>
        {activeTab === 'transactions' && (
          <View style={[styles.activeTabIndicator, { backgroundColor: colors.primary }]} />
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'rewards' && styles.activeTab]}
        onPress={() => setActiveTab('rewards')}
      >
        <Text style={[
          styles.tabText,
          { color: activeTab === 'rewards' ? colors.primary : colors.textSecondary, fontSize: fontSizes.text }
        ]}>
          Rewards
        </Text>
        {activeTab === 'rewards' && (
          <View style={[styles.activeTabIndicator, { backgroundColor: colors.primary }]} />
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with gradient matching Bookings component */}
      <LinearGradient
        colors={[isDarkMode ? 'rgba(14, 48, 92, 0.9)' : 'rgba(139, 187, 221, 0.8)', isDarkMode ? 'rgba(30, 64, 108, 0.9)' : 'rgba(213, 229, 233, 0.8)', isDarkMode ? colors.background : 'rgba(255,255,255,1)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTopRow}>
          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { color: colors.primary, fontSize: fontSizes.headerTitle }]}>
              My Wallet
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary, fontSize: fontSizes.headerSubtitle }]}>
              Manage your wallet and rewards
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Content with Pull to Refresh */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressBackgroundColor={colors.card}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          renderLoading()
        ) : hasError ? (
          renderError()
        ) : (
          <>
            {renderBalanceCard()}
            {renderTabs()}
            {activeTab === 'transactions' ? renderTransactions() : renderRewards()}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerSubtitle: {
    marginTop: 8,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontWeight: '600',
  },
  loadingSubtext: {
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  errorTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  retryButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryButtonText: {
    fontWeight: '600',
  },
  balanceCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  balanceLabel: {
    opacity: 0.9,
    marginBottom: 8,
  },
  balanceAmount: {
    fontWeight: 'bold',
    marginBottom: 20,
  },
  balanceButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  addMoneyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  addMoneyButtonText: {
    fontWeight: '600',
  },
  transferButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  transferButtonText: {
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    position: 'relative',
  },
  activeTab: {},
  tabText: {
    fontWeight: '500',
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 2,
  },
  tabContent: {
    flex: 1,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 16,
  },
  transactionsList: {
    maxHeight: 500,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  transactionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontWeight: '500',
    marginBottom: 4,
  },
  transactionMeta: {
    opacity: 0.7,
  },
  transactionAmount: {
    fontWeight: '600',
  },
  emptyTransactions: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTransactionsText: {
    marginTop: 12,
  },
  rewardsCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  rewardsPointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  rewardsPoints: {
    fontWeight: 'bold',
  },
  rewardsMessage: {
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  rewardsButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  rewardsButtonText: {
    fontWeight: '600',
  },
});

export default WalletPage;