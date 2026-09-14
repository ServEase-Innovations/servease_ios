import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import providerInstance from '../services/providerInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth0 } from '@auth0/auth0-react';

interface DeleteAccountButtonProps {
  userId: number;
  userRole: 'CUSTOMER' | 'SERVICE_PROVIDER' | 'VENDOR';
  onAccountDeleted?: () => void;
}

const DeleteAccountButton: React.FC<DeleteAccountButtonProps> = ({
  userId,
  userRole,
  onAccountDeleted,
}) => {
  const { t } = useTranslation();
  const { clearSession } = useAuth0();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    // First confirmation
    Alert.alert(
      t('profile.deleteAccount.title', 'Delete Account'),
      t(
        'profile.deleteAccount.warning',
        'Are you sure you want to delete your account? This action cannot be undone.'
      ),
      [
        {
          text: t('common.cancel', 'Cancel'),
          style: 'cancel',
        },
        {
          text: t('common.continue', 'Continue'),
          style: 'destructive',
          onPress: () => showFinalConfirmation(),
        },
      ]
    );
  };

  const showFinalConfirmation = () => {
    // Final confirmation
    Alert.alert(
      t('profile.deleteAccount.finalWarning', 'Final Warning'),
      t(
        'profile.deleteAccount.finalWarningMessage',
        'Your account will be deactivated permanently. All your data will remain but you will not be able to access it. Contact support to reactivate your account.\n\nAre you absolutely sure?'
      ),
      [
        {
          text: t('common.cancel', 'Cancel'),
          style: 'cancel',
        },
        {
          text: t('profile.deleteAccount.confirm', 'Yes, Delete My Account'),
          style: 'destructive',
          onPress: () => performAccountDeletion(),
        },
      ]
    );
  };

  const performAccountDeletion = async () => {
    try {
      setIsDeleting(true);

      // Determine endpoint based on user role
      let endpoint = '';
      if (userRole === 'SERVICE_PROVIDER') {
        endpoint = `/api/serviceprovider/${userId}/deactivate`;
      } else if (userRole === 'CUSTOMER') {
        endpoint = `/api/customer/${userId}/deactivate`;
      } else {
        Alert.alert(t('common.error', 'Error'), 'User role not supported');
        setIsDeleting(false);
        return;
      }

      // Call deactivation API
      const response = await providerInstance.post(endpoint);

      console.log('Account deactivated:', response.data);

      // Clear local storage
      await AsyncStorage.multiRemove([
        'token',
        'userId',
        'userRole',
        'userData',
      ]);

      // Clear Auth0 session
      try {
        await clearSession();
      } catch (error) {
        console.log('Auth0 session clear error (non-critical):', error);
      }

      // Show success message
      Alert.alert(
        t('profile.deleteAccount.success', 'Account Deleted'),
        t(
          'profile.deleteAccount.successMessage',
          'Your account has been deactivated successfully. Contact support at support@servease.com to reactivate.'
        ),
        [
          {
            text: t('common.ok', 'OK'),
            onPress: () => {
              if (onAccountDeleted) {
                onAccountDeleted();
              }
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Account deletion error:', error);
      
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        t('profile.deleteAccount.error', 'Failed to delete account');

      Alert.alert(t('common.error', 'Error'), errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.dangerZone}>
        <Text style={styles.dangerTitle}>
          {t('profile.deleteAccount.dangerZone', 'Danger Zone')}
        </Text>
        <Text style={styles.dangerDescription}>
          {t(
            'profile.deleteAccount.description',
            'Permanently delete your account and all associated data'
          )}
        </Text>

        <TouchableOpacity
          style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
          onPress={handleDeleteAccount}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.deleteButtonText}>
              {t('profile.deleteAccount.button', 'Delete Account')}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 30,
    marginBottom: 20,
  },
  dangerZone: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: '#FEE2E2',
  },
  dangerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: 8,
  },
  dangerDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  deleteButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonDisabled: {
    backgroundColor: '#FCA5A5',
  },
  deleteButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DeleteAccountButton;
