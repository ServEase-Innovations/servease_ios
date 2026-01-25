// MobileNumberDialog.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Modal,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios'; // Or use your axiosInstance
import { useAppUser } from '../context/AppUserContext';
import axiosInstance from '../services/axiosInstance';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface ValidationState {
  loading: boolean;
  error: string;
  isAvailable: boolean | null;
}

interface MobileNumberDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const MobileNumberDialog: React.FC<MobileNumberDialogProps> = ({ 
  open, 
  onClose, 
  onSuccess 
}) => {
  const [contactNumber, setContactNumber] = useState('');
  const [altContactNumber, setAltContactNumber] = useState('');
  const [loading, setLoading] = useState(false);

  // Validation states
  const [contactValidation, setContactValidation] = useState<ValidationState>({
    loading: false,
    error: '',
    isAvailable: null,
  });
  const [altContactValidation, setAltContactValidation] = useState<ValidationState>({
    loading: false,
    error: '',
    isAvailable: null,
  });

  const { appUser } = useAppUser();

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      // Reset form state when dialog opens
      setContactNumber('');
      setAltContactNumber('');
      setContactValidation({ loading: false, error: '', isAvailable: null });
      setAltContactValidation({ loading: false, error: '', isAvailable: null });
    }
  }, [open]);

  // Validate mobile number format
  const validateMobileFormat = (number: string): boolean => {
    const mobilePattern = /^[0-9]{10}$/;
    return mobilePattern.test(number);
  };

  // Check if mobile number is available
  const checkMobileAvailability = async (
    number: string,
    isAlternate: boolean = false
  ): Promise<boolean> => {
    if (!number || !validateMobileFormat(number)) {
      return false;
    }

    const setValidation = isAlternate ? setAltContactValidation : setContactValidation;

    setValidation({
      loading: true,
      error: '',
      isAvailable: null,
    });

    try {
      // Use different endpoints for mobile and alternate number validation
      const endpoint = isAlternate
        ? `/api/serviceproviders/check-alternate/${encodeURIComponent(number)}`
        : `/api/serviceproviders/check-mobile/${encodeURIComponent(number)}`;

      const response = await axiosInstance.get(endpoint);

      const isAvailable = response.data.available !== false;

      setValidation({
        loading: false,
        error: isAvailable ? '' : `${isAlternate ? 'Alternate' : 'Mobile'} number is already registered`,
        isAvailable,
      });

      return isAvailable;
    } catch (error: any) {
      console.error('Error validating mobile number:', error);

      let errorMessage = `Error checking ${isAlternate ? 'alternate' : 'mobile'} number`;
      if (error.response?.status === 409) {
        errorMessage = `${isAlternate ? 'Alternate' : 'Mobile'} number is already registered`;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      setValidation({
        loading: false,
        error: errorMessage,
        isAvailable: false,
      });

      return false;
    }
  };

  // Debounced validation for mobile numbers
  const useDebouncedValidation = () => {
    const timeouts = {
      contact: null as NodeJS.Timeout | null,
      alternate: null as NodeJS.Timeout | null,
    };

    return (number: string, isAlternate: boolean = false) => {
      const timeoutKey = isAlternate ? 'alternate' : 'contact';

      if (timeouts[timeoutKey]) {
        clearTimeout(timeouts[timeoutKey]!);
      }

      timeouts[timeoutKey] = setTimeout(() => {
        checkMobileAvailability(number, isAlternate);
      }, 500);
    };
  };

  const debouncedValidation = useDebouncedValidation();

  // Handle contact number change
  const handleContactNumberChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '').slice(0, 10);
    setContactNumber(numericValue);

    if (numericValue.length === 10) {
      debouncedValidation(numericValue, false);

      // Also check if alternate number is same as contact number
      if (altContactNumber === numericValue) {
        setAltContactValidation((prev) => ({
          ...prev,
          error: 'Alternate number cannot be same as contact number',
          isAvailable: false,
        }));
      } else if (
        altContactNumber &&
        altContactValidation.error === 'Alternate number cannot be same as contact number'
      ) {
        // Clear the error if numbers are now different
        setAltContactValidation((prev) => ({
          ...prev,
          error: '',
          isAvailable: null,
        }));
        // Re-validate alternate number
        if (validateMobileFormat(altContactNumber)) {
          debouncedValidation(altContactNumber, true);
        }
      }
    } else {
      setContactValidation({
        loading: false,
        error: numericValue ? 'Please enter a valid 10-digit mobile number' : '',
        isAvailable: null,
      });
    }
  };

  // Handle alternate contact number change
  const handleAltContactNumberChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '').slice(0, 10);
    setAltContactNumber(numericValue);

    if (numericValue && numericValue.length === 10) {
      // Check if alternate number is same as contact number
      if (numericValue === contactNumber) {
        setAltContactValidation({
          loading: false,
          error: 'Alternate number cannot be same as contact number',
          isAvailable: false,
        });
      } else {
        debouncedValidation(numericValue, true);
      }
    } else {
      setAltContactValidation({
        loading: false,
        error: numericValue ? 'Please enter a valid 10-digit mobile number' : '',
        isAvailable: null,
      });
    }
  };

  // Check if numbers are unique
  const areNumbersUnique = (): boolean => {
    if (!contactNumber || !altContactNumber) return true;
    return contactNumber !== altContactNumber;
  };

  // Validate all fields before submission
  const validateAllFields = async (): Promise<boolean> => {
    // Validate contact number
    if (!validateMobileFormat(contactNumber)) {
      Alert.alert('Validation Error', 'Please enter a valid 10-digit contact number');
      return false;
    }

    // Validate alternate number if provided
    if (altContactNumber && !validateMobileFormat(altContactNumber)) {
      Alert.alert('Validation Error', 'Please enter a valid 10-digit alternate contact number');
      return false;
    }

    // Check uniqueness
    if (!areNumbersUnique()) {
      Alert.alert('Validation Error', 'Contact number and alternate contact number must be different');
      return false;
    }

    // Check contact number availability
    const isContactAvailable = await checkMobileAvailability(contactNumber, false);
    if (!isContactAvailable) {
      Alert.alert('Validation Error', 'Contact number is not available');
      return false;
    }

    // Check alternate number availability if provided
    if (altContactNumber) {
      const isAltContactAvailable = await checkMobileAvailability(altContactNumber, true);
      if (!isAltContactAvailable) {
        Alert.alert('Validation Error', 'Alternate contact number is not available');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    // Validate all fields before submission
    const isValid = await validateAllFields();
    if (!isValid) {
      return;
    }

    setLoading(true);

    try {
      if (!appUser?.customerid) {
        console.error('❌ Customer ID not found in appUser');
        Alert.alert('Error', 'Customer ID not found!');
        setLoading(false);
        return;
      }

      // Prepare payload conditionally
      const payload: any = {};
      if (contactNumber) payload.mobileNo = contactNumber;
      if (altContactNumber) payload.altMobileNo = altContactNumber;

      console.log(' Sending update payload:', payload);

      // Real PUT API call
      const response = await axiosInstance.put(
        `/api/customer/update-customer/${appUser.customerid}`,
        payload
      );

      console.log('✅ API Response:', response.data);
      Alert.alert('Success', 'Mobile number(s) updated successfully!');
      onSuccess(); // Call the success callback
      onClose(); // Close the dialog
    } catch (error) {
      console.error('❌ Error updating mobile numbers:', error);
      Alert.alert('Error', 'Something went wrong while updating!');
    } finally {
      setLoading(false);
    }
  };

  // Check if form is valid for submission
  const isFormValid = (): boolean => {
    const basicValidation =
      validateMobileFormat(contactNumber) &&
      contactValidation.isAvailable !== false &&
      (altContactNumber === '' || validateMobileFormat(altContactNumber)) &&
      areNumbersUnique();

    // For alternate number, check availability only if it's provided and valid
    const altNumberValidation =
      altContactNumber === '' ||
      (validateMobileFormat(altContactNumber) &&
        altContactValidation.isAvailable !== false &&
        areNumbersUnique());

    return basicValidation && altNumberValidation;
  };

  const renderValidationIcon = (validation: ValidationState) => {
    if (validation.loading) {
      return <ActivityIndicator size="small" color="#007AFF" />;
    } else if (validation.isAvailable) {
      return <Text style={styles.successIcon}>✓</Text>;
    } else if (validation.isAvailable === false) {
      return <Text style={styles.errorIcon}>✗</Text>;
    }
    return null;
  };

  return (
    <Modal
      visible={open}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
 <LinearGradient
                        colors={["#0a2a66ff", "#004aadff"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.linearGradient}
                      >
          {/* Header */}
          <View style={styles.header}>
           <TouchableOpacity onPress={onClose}
                       style={styles.closeButton}
                       >
                        <Icon name="close" size={30} color="#f2f2f2ff" />
                      </TouchableOpacity>
            <Text style={styles.headtitle}>Update Contact Numbers</Text>

            {/* <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity> */}
          </View>
          </LinearGradient>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.description}>
              Please enter your mobile and alternative contact numbers to continue.
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Contact Number *</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[
                    styles.input,
                    (contactValidation.error || (contactNumber.length > 0 && contactNumber.length !== 10)) &&
                    styles.inputError,
                  ]}
                  placeholder="10-digit mobile number"
                  value={contactNumber}
                  onChangeText={handleContactNumberChange}
                  keyboardType="numeric"
                  maxLength={10}
                />
                <View style={styles.validationIcon}>
                  {renderValidationIcon(contactValidation)}
                </View>
              </View>
              {contactValidation.error ? (
                <Text style={styles.errorText}>{contactValidation.error}</Text>
              ) : contactNumber && contactNumber.length !== 10 ? (
                <Text style={styles.errorText}>Please enter exactly 10 digits</Text>
              ) : contactValidation.isAvailable ? (
                <Text style={styles.successText}>Contact number is available</Text>
              ) : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Alternative Contact Number</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[
                    styles.input,
                    (altContactValidation.error || (altContactNumber.length > 0 && altContactNumber.length !== 10)) &&
                    styles.inputError,
                  ]}
                  placeholder="10-digit mobile number"
                  value={altContactNumber}
                  onChangeText={handleAltContactNumberChange}
                  keyboardType="numeric"
                  maxLength={10}
                />
                <View style={styles.validationIcon}>
                  {renderValidationIcon(altContactValidation)}
                </View>
              </View>
              {altContactValidation.error ? (
                <Text style={styles.errorText}>{altContactValidation.error}</Text>
              ) : altContactNumber && altContactNumber.length !== 10 ? (
                <Text style={styles.errorText}>Please enter exactly 10 digits</Text>
              ) : altContactValidation.isAvailable ? (
                <Text style={styles.successText}>Alternate number is available</Text>
              ) : null}
            </View>

            {!areNumbersUnique() && contactNumber && altContactNumber && (
              <View style={styles.warningBox}>
                <Text style={styles.warningText}>
                  ⚠️ Contact number and alternate contact number must be different
                </Text>
              </View>
            )}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.submitButton,
                (loading || !isFormValid()) && styles.disabledButton,
              ]}
              onPress={handleSubmit}
              disabled={loading || !isFormValid()}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Updating...' : 'Submit'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
     linearGradient: {
    // padding: 20,
    // borderTopLeftRadius: 12,
    // borderTopRightRadius: 12,
  },
  headtitle: {
    paddingTop: 6,
    paddingLeft: 40,
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 24,
    color: 'white',
    fontWeight: '300',
  },
  content: {
    padding: 24,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: 'white',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  validationIcon: {
    marginLeft: 8,
    width: 20,
    alignItems: 'center',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  successText: {
    color: '#10b981',
    fontSize: 12,
    marginTop: 4,
  },
  successIcon: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorIcon: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
  warningBox: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  warningText: {
    color: '#dc2626',
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#cacfd3ff',
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#2563eb',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '500',
  },
});

export default MobileNumberDialog;