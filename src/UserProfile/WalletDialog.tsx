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
  const [activeTab, setActiveTab] = useState('transactions');
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  useEffect(() => {
    if (open && appUser?.customerid) {
      fetchWalletData();
    } else if (open) {
      // If no customerid, show error immediately
      setError('Unable to retrieve wallet information');
      setLoading(false);
    }
  }, [open, appUser]);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      setError(null);
      setWallet(null); // Reset wallet data
      
      console.log('Fetching wallet for user:', appUser?.customerid);

      const response = await PaymentInstance.get(`/api/wallets/${appUser?.customerid}`);
      
      console.log('Wallet API Response:', response.data);
      setWallet(response.data);
      
    } catch (error: any) {
      console.error('Wallet fetch error:', error);
      
      // Check different error conditions
      if (!appUser?.customerid) {
        setError('Wallet information unavailable');
      } else if (error.response?.status === 404) {
        setError('No wallet account found');
      } else if (error.response?.status === 401) {
        setError('Please sign in to access wallet features');
      } else if (error.code === 'ECONNABORTED') {
        setError('Connection timeout. Please check your network');
      } else if (error.message?.includes('Network Error')) {
        setError('Network unavailable. Please check your connection');
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Temporarily unable to load wallet data');
      }
      
    } finally {
      setLoading(false);
    }
  };

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
      return dateString; // Return original string if parsing fails
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
        return '#10b981'; // Green for credits
      case 'debit':
        return '#ef4444'; // Red for debits
      default:
        return '#6b7280';
    }
  };

  const renderTransactions = () => {
    if (!wallet?.transactions || wallet.transactions.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Icon name="receipt" size={48} color="#d1d5db" />
          <Text style={styles.emptyStateTitle}>No Transactions Yet</Text>
          <Text style={styles.emptyStateSubtitle}>
            Your transaction history will appear here
          </Text>
        </View>
      );
    }
    
    return wallet.transactions.map((transaction) => (
      <View key={transaction.transaction_id} style={styles.transactionItem}>
        <View style={styles.transactionIcon}>
          <Icon
            name={getTransactionIcon(transaction.transaction_type)}
            size={24}
            color={getTransactionColor(transaction.transaction_type)}
          />
        </View>
        <View style={styles.transactionDetails}>
          <Text style={styles.transactionDescription}>{transaction.description}</Text>
          <Text style={styles.transactionMeta}>
            {formatDate(transaction.created_at)} • {transaction.status}
          </Text>
        </View>
        <Text
          style={[
            styles.transactionAmount,
            { color: getTransactionColor(transaction.transaction_type) }
          ]}
        >
          {transaction.transaction_type === 'credit' ? '+' : '-'}₹{transaction.amount}
        </Text>
      </View>
    ));
  };

  const renderRewards = () => (
    <View style={styles.rewardsContainer}>
      <Text style={styles.sectionTitle}>Your Rewards</Text>
      <View style={styles.rewardsCard}>
        <View style={styles.rewardsHeader}>
          <Text style={styles.rewardsIcon}>⭐</Text>
          <Text style={styles.rewardsPoints}>
            {wallet?.rewards ?? 0} Points
          </Text>
        </View>
        <Text style={styles.rewardsDescription}>
          Earn more points by completing services and referring friends
        </Text>
        <TouchableOpacity style={styles.rewardsButton}>
          <Text style={styles.rewardsButtonText}>View Rewards Catalog</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingTitle}>Loading Wallet</Text>
            <Text style={styles.loadingSubtitle}>
              Retrieving your account information
            </Text>
          </View>
        </View>
      );
    }

    if (error || !wallet) {
      const isNoWalletError = error === 'No wallet account found' || 
                            error === 'Wallet information unavailable' ||
                            !appUser?.customerid;
      
      return (
        <View style={styles.errorContainer}>
          <View style={styles.errorCard}>
            <View style={styles.errorIconContainer}>
              <Icon 
                name={isNoWalletError ? "wallet-plus" : "wifi-off"} 
                size={56} 
                color={isNoWalletError ? "#9ca3af" : "#f59e0b"} 
              />
            </View>
            
            
            <Text style={styles.errorMessage}>
              {error || 'Wallet information currently unavailable'}
            </Text>
            
            {/* <Text style={styles.errorSubtitle}>
              {isNoWalletError 
                ?
                 'Please complete your account setup to access wallet features' 
                : 'Please check your internet connection and try again'}
            </Text> */}
            
            <View style={styles.errorActions}>
              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={fetchWalletData}
              >
                <Text style={styles.primaryButtonText}>Try Again</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={onClose}
              >
                <Text style={styles.secondaryButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    return (
      <ScrollView style={styles.content}>
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>
            ₹{wallet.balance.toLocaleString('en-IN')}
          </Text>
          <View style={styles.balanceButtons}>
            <TouchableOpacity style={styles.addMoneyButton}>
              <Icon name="plus-circle" size={18} color="#2563eb" />
              <Text style={styles.addMoneyText}>Add Money</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.transferButton}>
              <Icon name="swap-horizontal" size={18} color="#fff" />
              <Text style={styles.transferText}>Transfer</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'transactions' && styles.activeTab]}
            onPress={() => setActiveTab('transactions')}
          >
            <Icon 
              name="history" 
              size={18} 
              color={activeTab === 'transactions' ? '#2563eb' : '#6b7280'} 
              style={styles.tabIcon}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'transactions' && styles.activeTabText,
              ]}
            >
              Transactions
            </Text>
            {activeTab === 'transactions' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'rewards' && styles.activeTab]}
            onPress={() => setActiveTab('rewards')}
          >
            <Icon 
              name="gift" 
              size={18} 
              color={activeTab === 'rewards' ? '#2563eb' : '#6b7280'} 
              style={styles.tabIcon}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'rewards' && styles.activeTabText,
              ]}
            >
              Rewards
            </Text>
            {activeTab === 'rewards' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'transactions' ? (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <ScrollView style={styles.transactionsList}>
              {renderTransactions()}
            </ScrollView>
          </View>
        ) : (
          renderRewards()
        )}
      </ScrollView>
    );
  };

  if (!open) return null;

  return (
    <Modal
      visible={open}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
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
              <Text style={styles.headtitle}>My Wallet</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close-thick" size={22} color="#f2f2f2" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {renderContent()}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  closeButton: {
    padding: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
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
    backgroundColor: '#fff',
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
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  loadingSubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#64748b',
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
    backgroundColor: '#fff',
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
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 12,
  },
  errorSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  errorActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 15,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 10,
  },
  emptyStateTitle: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
  },
  emptyStateSubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  balanceCard: {
    backgroundColor: '#2563eb',
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
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 36,
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
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  addMoneyText: {
    color: '#2563eb',
    fontWeight: '600',
    fontSize: 15,
  },
  transferButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  transferText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
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
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
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
    backgroundColor: '#2563eb',
    borderRadius: 2,
  },
  tabContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  transactionsList: {
    maxHeight: 400,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
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
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 10,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1f2937',
  },
  transactionMeta: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  rewardsContainer: {
    flex: 1,
  },
  rewardsCard: {
    backgroundColor: '#f59e0b',
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  rewardsDescription: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  rewardsButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  rewardsButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
    letterSpacing: 0.3,
  },
});

export default WalletDialog;