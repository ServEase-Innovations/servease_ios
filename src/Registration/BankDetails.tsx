// BankDetails.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface BankDetailsProps {
  onBankDetailsChange: (data: BankDetailsData) => void;
  initialData?: BankDetailsData;
  errors?: BankDetailsErrors;
}

export interface BankDetailsData {
  bankName: string;
  ifscCode: string;
  accountHolderName: string;
  accountNumber: string;
  accountType: string;
  upiId: string;
}

export interface BankDetailsErrors {
  bankName?: string;
  ifscCode?: string;
  accountHolderName?: string;
  accountNumber?: string;
  accountType?: string;
  upiId?: string;
}

const accountTypes = [
  { label: 'Savings Account', value: 'SAVINGS' },
  { label: 'Current Account', value: 'CURRENT' },
  { label: 'Salary Account', value: 'SALARY' },
  { label: 'Fixed Deposit Account', value: 'FIXED_DEPOSIT' },
  { label: 'NRI Account', value: 'NRI' },
];

const BankDetails: React.FC<BankDetailsProps> = ({
  onBankDetailsChange,
  initialData,
  errors: externalErrors,
}) => {
  const [bankDetails, setBankDetails] = useState<BankDetailsData>({
    bankName: initialData?.bankName || '',
    ifscCode: initialData?.ifscCode || '',
    accountHolderName: initialData?.accountHolderName || '',
    accountNumber: initialData?.accountNumber || '',
    accountType: initialData?.accountType || '',
    upiId: initialData?.upiId || '',
  });

  const [errors, setErrors] = useState<BankDetailsErrors>(externalErrors || {});
  const [showAccountTypes, setShowAccountTypes] = useState(false);

  // IFSC code validation (Indian format: 4 letters + 7 alphanumeric)
  const validateIFSC = (code: string): boolean => {
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    return ifscRegex.test(code);
  };

  // Account number validation (8-20 digits)
  const validateAccountNumber = (number: string): boolean => {
    const accountRegex = /^[0-9]{8,20}$/;
    return accountRegex.test(number);
  };

  // UPI ID validation
  const validateUPI = (upi: string): boolean => {
    const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;
    return upiRegex.test(upi);
  };

  const handleChange = (field: keyof BankDetailsData, value: string) => {
    // Remove whitespace for certain fields
    let processedValue = value;
    if (field === 'ifscCode') {
      processedValue = value.toUpperCase();
    } else if (field === 'accountNumber') {
      processedValue = value.replace(/[^0-9]/g, '');
    }

    const updatedDetails = { ...bankDetails, [field]: processedValue };
    setBankDetails(updatedDetails);
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // Real-time validation
    let error = '';
    switch (field) {
      case 'ifscCode':
        if (processedValue && !validateIFSC(processedValue)) {
          error = 'Invalid IFSC code format (e.g., SBIN0001234)';
        }
        break;
      case 'accountNumber':
        if (processedValue && !validateAccountNumber(processedValue)) {
          error = 'Account number must be 8-20 digits';
        }
        break;
      case 'upiId':
        if (processedValue && !validateUPI(processedValue)) {
          error = 'Invalid UPI ID format (e.g., username@bankname)';
        }
        break;
    }
    
    setErrors(prev => ({ ...prev, [field]: error }));
    onBankDetailsChange(updatedDetails);
  };

  const handleAccountTypeSelect = (type: string) => {
    setBankDetails(prev => ({ ...prev, accountType: type }));
    setShowAccountTypes(false);
    if (errors.accountType) {
      setErrors(prev => ({ ...prev, accountType: undefined }));
    }
    onBankDetailsChange({ ...bankDetails, accountType: type });
  };

  // Helper function to check if any required field is filled
  const hasAnyData = useCallback(() => {
    return Object.values(bankDetails).some(value => value && value.trim() !== '');
  }, [bankDetails]);

  // Notify parent of changes
  useEffect(() => {
    onBankDetailsChange(bankDetails);
  }, [bankDetails, onBankDetailsChange]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.infoContainer}>
        <Icon name="info-outline" size={20} color="#1976d2" />
        <Text style={styles.infoText}>
          Bank details are optional but recommended for payment processing
        </Text>
      </View>

      {/* Bank Name */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>
          Bank Name <Text style={styles.optionalLabel}>(Optional)</Text>
        </Text>
        <View style={[styles.inputWrapper, errors.bankName && styles.inputError]}>
          <Icon name="account-balance" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Enter bank name"
            placeholderTextColor="#999"
            value={bankDetails.bankName}
            onChangeText={(value) => handleChange('bankName', value)}
          />
        </View>
        {errors.bankName && <Text style={styles.errorText}>{errors.bankName}</Text>}
      </View>

      {/* Account Holder Name */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>
          Account Holder Name <Text style={styles.optionalLabel}>(Optional)</Text>
        </Text>
        <View style={[styles.inputWrapper, errors.accountHolderName && styles.inputError]}>
          <Icon name="person" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Enter account holder name"
            placeholderTextColor="#999"
            value={bankDetails.accountHolderName}
            onChangeText={(value) => handleChange('accountHolderName', value)}
          />
        </View>
        {errors.accountHolderName && <Text style={styles.errorText}>{errors.accountHolderName}</Text>}
      </View>

      {/* Account Number */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>
          Account Number <Text style={styles.optionalLabel}>(Optional)</Text>
        </Text>
        <View style={[styles.inputWrapper, errors.accountNumber && styles.inputError]}>
          <Icon name="credit-card" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Enter account number"
            placeholderTextColor="#999"
            keyboardType="numeric"
            value={bankDetails.accountNumber}
            onChangeText={(value) => handleChange('accountNumber', value)}
            maxLength={20}
          />
        </View>
        {errors.accountNumber && <Text style={styles.errorText}>{errors.accountNumber}</Text>}
      </View>

      {/* IFSC Code */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>
          IFSC Code <Text style={styles.optionalLabel}>(Optional)</Text>
        </Text>
        <View style={[styles.inputWrapper, errors.ifscCode && styles.inputError]}>
          <Icon name="code" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Enter IFSC code (e.g., SBIN0001234)"
            placeholderTextColor="#999"
            autoCapitalize="characters"
            value={bankDetails.ifscCode}
            onChangeText={(value) => handleChange('ifscCode', value)}
            maxLength={11}
          />
        </View>
        {errors.ifscCode && <Text style={styles.errorText}>{errors.ifscCode}</Text>}
      </View>

      {/* Account Type */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>
          Account Type <Text style={styles.optionalLabel}>(Optional)</Text>
        </Text>
        <TouchableOpacity
          style={[styles.dropdownButton, errors.accountType && styles.inputError]}
          onPress={() => setShowAccountTypes(!showAccountTypes)}
        >
          <View style={styles.dropdownLeft}>
            <Icon name="account-balance-wallet" size={20} color="#666" />
            <Text style={[styles.dropdownText, !bankDetails.accountType && styles.placeholderText]}>
              {bankDetails.accountType 
                ? accountTypes.find(type => type.value === bankDetails.accountType)?.label 
                : 'Select account type'}
            </Text>
          </View>
          <Icon name={showAccountTypes ? "arrow-drop-up" : "arrow-drop-down"} size={24} color="#666" />
        </TouchableOpacity>
        {errors.accountType && <Text style={styles.errorText}>{errors.accountType}</Text>}
      </View>

      {/* Account Type Selection Modal */}
      {showAccountTypes && (
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            onPress={() => setShowAccountTypes(false)} 
          />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Account Type</Text>
            {accountTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.modalOption,
                  bankDetails.accountType === type.value && styles.modalOptionSelected
                ]}
                onPress={() => handleAccountTypeSelect(type.value)}
              >
                <Text style={[
                  styles.modalOptionText,
                  bankDetails.accountType === type.value && styles.modalOptionTextSelected
                ]}>
                  {type.label}
                </Text>
                {bankDetails.accountType === type.value && (
                  <Icon name="check" size={20} color="#1976d2" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* UPI ID */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>
          UPI ID <Text style={styles.optionalLabel}>(Optional)</Text>
        </Text>
        <View style={[styles.inputWrapper, errors.upiId && styles.inputError]}>
          <Icon name="payment" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Enter UPI ID (e.g., username@bankname)"
            placeholderTextColor="#999"
            autoCapitalize="none"
            value={bankDetails.upiId}
            onChangeText={(value) => handleChange('upiId', value)}
          />
        </View>
        {errors.upiId && <Text style={styles.errorText}>{errors.upiId}</Text>}
      </View>

      {/* Optional Fields Note */}
      <View style={styles.noteContainer}>
        <Icon name="info-outline" size={16} color="#666" />
        <Text style={styles.noteText}>
          All bank details are optional. You can add or update them later from your profile settings.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1976d2',
    marginLeft: 8,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  optionalLabel: {
    fontWeight: 'normal',
    fontSize: 12,
    color: '#666',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 12,
  },
  inputError: {
    borderColor: '#f44336',
  },
  errorText: {
    color: '#f44336',
    fontSize: 12,
    marginTop: 4,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  placeholderText: {
    color: '#999',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxHeight: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalOptionSelected: {
    backgroundColor: '#f0f7ff',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
  },
  modalOptionTextSelected: {
    color: '#1976d2',
    fontWeight: '500',
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    marginBottom: 10,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
});

export default BankDetails;