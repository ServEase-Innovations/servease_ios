import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useAppUser } from '../context/AppUserContext';
import PaymentInstance from '../services/paymentInstance';
import { useTheme } from '../../src/Settings/ThemeContext';
import { useTranslation } from 'react-i18next';

interface WalletDialogProps {
  open: boolean;
  onClose: () => void;
}

interface Transaction {
  transaction_id: number;
  transaction_type: string;
  amount: number;
  description: string;
  created_at: string;
  status: string;
}

interface Wallet {
  balance: number;
  transactions: Transaction[];
  rewards: number;
}

const WalletDialog: React.FC<WalletDialogProps> = ({ open, onClose }) => {
  const { colors, fontSize, isDarkMode } = useTheme();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('transactions');
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const { appUser } = useAppUser();

  // Fallback dummy wallet (optional - not used when showing error)
  const walletData = {
    balance: 5420,
    transactions: [
      {
        transaction_id: 1,
        transaction_type: 'credit',
        amount: 2000,
        description: 'Home Cook Service',
        created_at: 'Aug 28, 2025',
        status: 'Completed',
      },
      {
        transaction_id: 2,
        transaction_type: 'debit',
        amount: 1500,
        description: 'Maid Service',
        created_at: 'Aug 25, 2025',
        status: 'Completed',
      },
    ],
    rewards: 450,
  };

  // Get font sizes based on theme
  const getFontSizes = () => {
    switch (fontSize) {
      case 'small':
        return {
          headtitle: 18,
          balanceLabel: 13,
          balanceAmount: 32,
          tabText: 13,
          sectionTitle: 16,
          transactionDescription: 14,
          transactionMeta: 12,
          transactionAmount: 15,
          loadingTitle: 16,
          loadingSubtitle: 13,
          errorTitle: 18,
          errorMessage: 14,
          errorSubtitle: 12,
          buttonText: 14,
          emptyStateTitle: 15,
          emptyStateSubtitle: 13,
          rewardsPoints: 26,
          rewardsDescription: 14,
        };
      case 'large':
        return {
          headtitle: 22,
          balanceLabel: 16,
          balanceAmount: 40,
          tabText: 16,
          sectionTitle: 20,
          transactionDescription: 18,
          transactionMeta: 15,
          transactionAmount: 18,
          loadingTitle: 20,
          loadingSubtitle: 16,
          errorTitle: 22,
          errorMessage: 17,
          errorSubtitle: 15,
          buttonText: 16,
          emptyStateTitle: 18,
          emptyStateSubtitle: 15,
          rewardsPoints: 32,
          rewardsDescription: 17,
        };
      default:
        return {
          headtitle: 20,
          balanceLabel: 14,
          balanceAmount: 36,
          tabText: 14,
          sectionTitle: 18,
          transactionDescription: 16,
          transactionMeta: 13,
          transactionAmount: 16,
          loadingTitle: 18,
          loadingSubtitle: 14,
          errorTitle: 20,
          errorMessage: 15,
          errorSubtitle: 13,
          buttonText: 15,
          emptyStateTitle: 16,
          emptyStateSubtitle: 14,
          rewardsPoints: 28,
          rewardsDescription: 15,
        };
    }
  };

  const fontSizes = getFontSizes();

  useEffect(() => {
    if (open && appUser?.customerid) {
      console.log('Fetching wallet for user:', appUser.customerid);
      setIsLoading(true);
      setHasError(false);
      
      PaymentInstance
        .get(`/api/wallets/${appUser.customerid}`)
        .then((response) => {
          console.log('Wallet API Response:', response.data);
          setWallet(response.data);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error('Wallet fetch error:', error);
          // Check if error is "Wallet not found for this customer"
          if (error.response?.data?.error === "Wallet not found for this customer" || 
              error.message?.includes("Wallet not found")) {
            setHasError(true);
          }
          setIsLoading(false);
        });
    } else if (open && (!appUser?.customerid)) {
      // If no customerid, show error
      setHasError(true);
      setIsLoading(false);
    }
  }, [open, appUser]);

  // Reset states when dialog closes
  useEffect(() => {
    if (!open) {
      setIsLoading(false);
      setHasError(false);
      setWallet(null);
    }
  }, [open]);

  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'credit':
        return 'arrow-down-circle';
      case 'debit':
        return 'arrow-up-circle';
      default:
        return 'cash';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'credit':
        return colors.success;
      case 'debit':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const renderTransactions = () => {
    if (!wallet?.transactions || wallet.transactions.length === 0) {
      return (
        <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
          <Icon name="receipt" size={48} color={colors.border} />
          <Text style={[styles.emptyStateTitle, { color: colors.text, fontSize: fontSizes.emptyStateTitle }]}>{t('wallet.noTransactions')}</Text>
          <Text style={[styles.emptyStateSubtitle, { color: colors.textSecondary, fontSize: fontSizes.emptyStateSubtitle }]}>
            {t('wallet.noTransactionsDesc')}
          </Text>
        </View>
      );
    }
    
    return wallet.transactions.map((transaction) => (
      <View key={transaction.transaction_id} style={[styles.transactionItem, { backgroundColor: colors.card }]}>
        <View style={[styles.transactionIcon, { backgroundColor: colors.surface }]}>
          <Icon
            name={getTransactionIcon(transaction.transaction_type)}
            size={24}
            color={getTransactionColor(transaction.transaction_type)}
          />
        </View>
        <View style={styles.transactionDetails}>
          <Text style={[styles.transactionDescription, { color: colors.text, fontSize: fontSizes.transactionDescription }]}>{transaction.description}</Text>
          <Text style={[styles.transactionMeta, { color: colors.textSecondary, fontSize: fontSizes.transactionMeta }]}>
            {formatDate(transaction.created_at)} • {transaction.status}
          </Text>
        </View>
        <Text
          style={[
            styles.transactionAmount,
            { color: getTransactionColor(transaction.transaction_type), fontSize: fontSizes.transactionAmount }
          ]}
        >
          {transaction.transaction_type === 'credit' ? '+' : '-'}₹{transaction.amount}
        </Text>
      </View>
    ));
  };

  const renderRewards = () => (
    <View style={styles.rewardsContainer}>
      <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontSizes.sectionTitle }]}>{t('wallet.yourRewards')}</Text>
      <View style={[styles.rewardsCard, { backgroundColor: colors.warning }]}>
        <View style={styles.rewardsHeader}>
          <Text style={styles.rewardsIcon}>⭐</Text>
          <Text style={[styles.rewardsPoints, { color: '#fff', fontSize: fontSizes.rewardsPoints }]}>
            {t('wallet.rewardsPoints', { points: wallet?.rewards ?? 0 })}
          </Text>
        </View>
        <Text style={[styles.rewardsDescription, { color: 'rgba(255,255,255,0.9)', fontSize: fontSizes.rewardsDescription }]}>
          {t('wallet.rewardsDescription')}
        </Text>
        <TouchableOpacity style={[styles.rewardsButton, { backgroundColor: 'rgba(255, 255, 255, 0.25)', borderColor: 'rgba(255,255,255,0.3)' }]}>
          <Text style={[styles.rewardsButtonText, { color: '#fff', fontSize: fontSizes.buttonText }]}>{t('wallet.viewRewardsCatalog')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render loading state
  if (isLoading) {
    return (
      <Modal
        visible={open}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
          <LinearGradient
            colors={["#0a2a66ff", "#004aadff"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.linearGradient}
          >
            <View style={styles.header}>
              <View style={styles.titleContainer}>
                <Icon name="wallet" size={22} color="#fff" style={styles.titleIcon} />
                <Text style={[styles.headtitle, { color: '#fff', fontSize: fontSizes.headtitle }]}>{t('wallet.title')}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                <Icon name="close-thick" size={22} color="#f2f2f2" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
          
          <View style={styles.loadingContainer}>
            <View style={[styles.loadingCard, { backgroundColor: colors.card }]}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingTitle, { color: colors.text, fontSize: fontSizes.loadingTitle }]}>{t('wallet.loading')}</Text>
              <Text style={[styles.loadingSubtitle, { color: colors.textSecondary, fontSize: fontSizes.loadingSubtitle }]}>
                {t('wallet.loadingDesc')}
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  // Render error state
  if (hasError) {
    return (
      <Modal
        visible={open}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
          <LinearGradient
            colors={["#0a2a66ff", "#004aadff"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.linearGradient}
          >
            <View style={styles.header}>
              <View style={styles.titleContainer}>
                <Icon name="wallet" size={22} color="#fff" style={styles.titleIcon} />
                <Text style={[styles.headtitle, { color: '#fff', fontSize: fontSizes.headtitle }]}>{t('wallet.title')}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                <Icon name="close-thick" size={22} color="#f2f2f2" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
          
          <View style={styles.errorContainer}>
            <View style={[styles.errorCard, { backgroundColor: colors.card }]}>
              <View style={[styles.errorIconContainer, { backgroundColor: colors.surface }]}>
                <Icon name="wallet-plus" size={56} color={colors.textSecondary} />
              </View>
              <Text style={[styles.errorMessage, { color: colors.textSecondary, fontSize: fontSizes.errorMessage }]}>
                {t('wallet.error.noAccount')}
              </Text>
              <View style={styles.errorActions}>
                <TouchableOpacity 
                  style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    // Reset and retry
                    setIsLoading(true);
                    setHasError(false);
                    if (appUser?.customerid) {
                      PaymentInstance
                        .get(`/api/wallets/${appUser.customerid}`)
                        .then((response) => {
                          setWallet(response.data);
                          setIsLoading(false);
                        })
                        .catch((error) => {
                          console.error('Retry error:', error);
                          setHasError(true);
                          setIsLoading(false);
                        });
                    }
                  }}
                >
                  <Text style={[styles.primaryButtonText, { color: '#fff', fontSize: fontSizes.buttonText }]}>{t('wallet.actions.tryAgain')}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.secondaryButton, { backgroundColor: colors.surface }]}
                  onPress={onClose}
                >
                  <Text style={[styles.secondaryButtonText, { color: colors.text, fontSize: fontSizes.buttonText }]}>{t('wallet.actions.close')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal
      visible={open}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <LinearGradient
          colors={["#0a2a66ff", "#004aadff"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.linearGradient}
        >
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Icon name="wallet" size={22} color="#fff" style={styles.titleIcon} />
              <Text style={[styles.headtitle, { color: '#fff', fontSize: fontSizes.headtitle }]}>{t('wallet.title')}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
              <Icon name="close-thick" size={22} color="#f2f2f2" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Content */}
        <ScrollView style={[styles.content, { backgroundColor: colors.background }]}>
          {/* Balance Card */}
          <View style={[styles.balanceCard, { backgroundColor: colors.primary }]}>
            <Text style={[styles.balanceLabel, { color: 'rgba(255,255,255,0.9)', fontSize: fontSizes.balanceLabel }]}>{t('wallet.availableBalance')}</Text>
            <Text style={[styles.balanceAmount, { color: '#fff', fontSize: fontSizes.balanceAmount }]}>
              {wallet ? formatCurrency(wallet.balance) : formatCurrency(walletData.balance)}
            </Text>
            <View style={styles.balanceButtons}>
              <TouchableOpacity style={[styles.addMoneyButton, { backgroundColor: '#fff' }]}>
                <Icon name="plus-circle" size={18} color={colors.primary} />
                <Text style={[styles.addMoneyText, { color: colors.primary, fontSize: fontSizes.buttonText }]}>{t('wallet.addMoney')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.transferButton, { backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255,255,255,0.3)' }]}>
                <Icon name="swap-horizontal" size={18} color="#fff" />
                <Text style={[styles.transferText, { color: '#fff', fontSize: fontSizes.buttonText }]}>{t('wallet.transfer')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Tabs */}
          <View style={[styles.tabContainer, { backgroundColor: colors.card }]}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'transactions' && [styles.activeTab, { backgroundColor: colors.surface }]]}
              onPress={() => setActiveTab('transactions')}
            >
              <Icon 
                name="history" 
                size={18} 
                color={activeTab === 'transactions' ? colors.primary : colors.textSecondary} 
                style={styles.tabIcon}
              />
              <Text
                style={[
                  styles.tabText,
                  { color: colors.textSecondary, fontSize: fontSizes.tabText },
                  activeTab === 'transactions' && [styles.activeTabText, { color: colors.primary }],
                ]}
              >
                {t('wallet.transactions')}
              </Text>
              {activeTab === 'transactions' && <View style={[styles.tabIndicator, { backgroundColor: colors.primary }]} />}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tab, activeTab === 'rewards' && [styles.activeTab, { backgroundColor: colors.surface }]]}
              onPress={() => setActiveTab('rewards')}
            >
              <Icon 
                name="gift" 
                size={18} 
                color={activeTab === 'rewards' ? colors.primary : colors.textSecondary} 
                style={styles.tabIcon}
              />
              <Text
                style={[
                  styles.tabText,
                  { color: colors.textSecondary, fontSize: fontSizes.tabText },
                  activeTab === 'rewards' && [styles.activeTabText, { color: colors.primary }],
                ]}
              >
                {t('wallet.rewards')}
              </Text>
              {activeTab === 'rewards' && <View style={[styles.tabIndicator, { backgroundColor: colors.primary }]} />}
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          {activeTab === 'transactions' ? (
            <View style={styles.tabContent}>
              <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontSizes.sectionTitle }]}>{t('wallet.recentActivity')}</Text>
              <ScrollView style={styles.transactionsList}>
                {(wallet?.transactions || []).map((transaction) => (
                  <View key={transaction.transaction_id} style={[styles.transactionItem, { backgroundColor: colors.card }]}>
                    <View style={[styles.transactionIcon, { backgroundColor: colors.surface }]}>
                      <Icon
                        name={getTransactionIcon(transaction.transaction_type)}
                        size={24}
                        color={getTransactionColor(transaction.transaction_type)}
                      />
                    </View>
                    <View style={styles.transactionDetails}>
                      <Text style={[styles.transactionDescription, { color: colors.text, fontSize: fontSizes.transactionDescription }]}>{transaction.description}</Text>
                      <Text style={[styles.transactionMeta, { color: colors.textSecondary, fontSize: fontSizes.transactionMeta }]}>
                        {formatDate(transaction.created_at)} • {transaction.status}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.transactionAmount,
                        { color: getTransactionColor(transaction.transaction_type), fontSize: fontSizes.transactionAmount }
                      ]}
                    >
                      {transaction.transaction_type === 'credit' ? '+' : '-'}₹{transaction.amount}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : (
            renderRewards()
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  linearGradient: {},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleIcon: {
    marginRight: 10,
  },
  headtitle: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  closeButton: {
    padding: 6,
    borderRadius: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingCard: {
    alignItems: 'center',
    borderRadius: 16,
    padding: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    width: '100%',
    maxWidth: 300,
  },
  loadingTitle: {
    marginTop: 20,
    fontWeight: '600',
  },
  loadingSubtitle: {
    marginTop: 8,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorCard: {
    alignItems: 'center',
    borderRadius: 16,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    width: '100%',
    maxWidth: 320,
  },
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  errorMessage: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  errorActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 10,
  },
  emptyStateTitle: {
    marginTop: 20,
    fontWeight: '600',
  },
  emptyStateSubtitle: {
    marginTop: 6,
    textAlign: 'center',
  },
  balanceCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  balanceLabel: {
    fontWeight: '500',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  balanceAmount: {
    fontWeight: '700',
    marginVertical: 8,
    letterSpacing: 0.5,
  },
  balanceButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  addMoneyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  addMoneyText: {
    fontWeight: '600',
  },
  transferButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
  },
  transferText: {
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 6,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#f1f5f9',
  },
  tabIcon: {
    marginRight: 8,
  },
  tabText: {
    fontWeight: '600',
  },
  activeTabText: {
    color: '#2563eb',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -6,
    left: '20%',
    right: '20%',
    height: 3,
    borderRadius: 2,
  },
  tabContent: {
    flex: 1,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  transactionsList: {
    maxHeight: 400,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  transactionIcon: {
    marginRight: 14,
    padding: 10,
    borderRadius: 10,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontWeight: '500',
  },
  transactionMeta: {
    marginTop: 4,
  },
  transactionAmount: {
    fontWeight: '600',
  },
  rewardsContainer: {
    flex: 1,
  },
  rewardsCard: {
    borderRadius: 16,
    padding: 24,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  rewardsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  rewardsIcon: {
    fontSize: 28,
  },
  rewardsPoints: {
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  rewardsDescription: {
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  rewardsButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  rewardsButtonText: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

export default WalletDialog;