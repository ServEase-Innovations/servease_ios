/* eslint-disable */
import React, { useEffect, useState, useRef } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAppUser } from "../context/AppUserContext";
import axiosInstance from "../services/axiosInstance";
import providerInstance from "../services/providerInstance";
import { useDispatch } from "react-redux";
import { setHasMobileNumber } from "../features/customerSlice";
import LinearGradient from "react-native-linear-gradient";

interface MobileNumberDialogProps {
  visible: boolean;
  onClose: () => void;
  customerId: number;
  mobileNo?: string;
  alternativeMobileNo?: string;
  onSuccess: () => void;
}

interface ValidationState {
  loading: boolean;
  error: string;
  isAvailable: boolean | null;
  formatError: boolean;
}

interface SnackbarState {
  visible: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
}

const MobileNumberDialog: React.FC<MobileNumberDialogProps> = ({
  visible,
  onClose,
  customerId,
  onSuccess,
}) => {
  const [contactNumber, setContactNumber] = useState("");
  const [altContactNumber, setAltContactNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const { appUser, setAppUser } = useAppUser();
  const dispatch = useDispatch();

  const [contactValidation, setContactValidation] = useState<ValidationState>({
    loading: false,
    error: '',
    isAvailable: null,
    formatError: false
  });
  const [altContactValidation, setAltContactValidation] = useState<ValidationState>({
    loading: false,
    error: '',
    isAvailable: null,
    formatError: false
  });

  const [snackbar, setSnackbar] = useState<SnackbarState>({
    visible: false,
    message: '',
    type: 'info'
  });

  const [validatedFields, setValidatedFields] = useState<Set<string>>(new Set());
  const timeouts = useRef<{
    contact: NodeJS.Timeout | null;
    alternate: NodeJS.Timeout | null;
  }>({
    contact: null,
    alternate: null
  });

  useEffect(() => {
    if (visible && appUser) {
      setContactNumber(appUser.mobileNo || "");
      setAltContactNumber(appUser.alternateNo || "");
      
      setContactValidation({ loading: false, error: '', isAvailable: null, formatError: false });
      setAltContactValidation({ loading: false, error: '', isAvailable: null, formatError: false });
      setValidatedFields(new Set());
    }
  }, [visible, appUser]);

  const showSnackbar = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setSnackbar({
      visible: true,
      message,
      type
    });
    
    // Auto hide after 3 seconds
    setTimeout(() => {
      setSnackbar(prev => ({ ...prev, visible: false }));
    }, 3000);
  };

  const validateMobileFormat = (number: string): boolean => {
    const mobilePattern = /^[0-9]{10}$/;
    return mobilePattern.test(number);
  };

  const checkMobileAvailability = async (number: string, isAlternate: boolean = false): Promise<boolean> => {
    if (!number || !validateMobileFormat(number)) {
      return false;
    }

    const setValidation = isAlternate ? setAltContactValidation : setContactValidation;
    const fieldName = isAlternate ? 'altContactNumber' : 'contactNumber';
    
    setValidation({
      loading: true,
      error: '',
      isAvailable: null,
      formatError: false
    });

    try {
      const endpoint = '/api/service-providers/check-mobile';
      const payload = { mobile: number };
      
      const response = await providerInstance.post(endpoint, payload);
      
      let isAvailable = true;
      let errorMessage = '';
      
      if (response.data.exists !== undefined) {
        isAvailable = !response.data.exists;
        errorMessage = response.data.exists 
          ? `${isAlternate ? 'Alternate' : 'Mobile'} number is already registered` 
          : '';
      } else if (response.data.available !== undefined) {
        isAvailable = response.data.available;
        errorMessage = !response.data.available 
          ? `${isAlternate ? 'Alternate' : 'Mobile'} number is already registered` 
          : '';
      } else if (response.data.isAvailable !== undefined) {
        isAvailable = response.data.isAvailable;
        errorMessage = !response.data.isAvailable 
          ? `${isAlternate ? 'Alternate' : 'Mobile'} number is already registered` 
          : '';
      } else {
        isAvailable = true;
      }
      
      setValidation({
        loading: false,
        error: errorMessage,
        isAvailable,
        formatError: false
      });

      if (isAvailable) {
        setValidatedFields(prev => {
          const newSet = new Set(prev);
          newSet.add(fieldName);
          return newSet;
        });
      }

      return isAvailable;
    } catch (error: any) {
      console.error('Error validating mobile number:', error);
      
      let errorMessage = `Error checking ${isAlternate ? 'alternate' : 'mobile'} number`;
      
      if (error.response?.data) {
        const apiError = error.response.data;
        if (typeof apiError === 'string') {
          errorMessage = apiError;
        } else if (apiError.message) {
          errorMessage = apiError.message;
        } else if (apiError.error) {
          errorMessage = apiError.error;
        }
      } else if (error.response?.status === 400) {
        errorMessage = `Invalid ${isAlternate ? 'alternate' : 'mobile'} number format`;
      } else if (error.response?.status === 409) {
        errorMessage = `${isAlternate ? 'Alternate' : 'Mobile'} number is already registered`;
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      }

      setValidation({
        loading: false,
        error: errorMessage,
        isAvailable: false,
        formatError: false
      });

      return false;
    }
  };

  const debouncedValidation = (number: string, isAlternate: boolean = false) => {
    const timeoutKey = isAlternate ? 'alternate' : 'contact';
    
    if (timeouts.current[timeoutKey]) {
      clearTimeout(timeouts.current[timeoutKey]!);
    }

    timeouts.current[timeoutKey] = setTimeout(() => {
      checkMobileAvailability(number, isAlternate);
    }, 800);
  };

  const handleContactNumberChange = (value: string) => {
    const cleanedValue = value.replace(/\D/g, '').slice(0, 10);
    setContactNumber(cleanedValue);

    setContactValidation(prev => ({
      ...prev,
      loading: false,
      error: '',
      isAvailable: null,
      formatError: false
    }));

    if (cleanedValue.length === 10) {
      setContactValidation(prev => ({
        ...prev,
        formatError: false,
        error: prev.error === 'Please enter a valid 10-digit mobile number' ? '' : prev.error
      }));
      
      debouncedValidation(cleanedValue, false);
      
      if (altContactNumber === cleanedValue) {
        setAltContactValidation(prev => ({
          ...prev,
          error: 'Alternate number cannot be same as contact number',
          isAvailable: false,
          formatError: false
        }));
      } else if (altContactNumber && altContactNumber.length === 10) {
        if (altContactValidation.error === 'Alternate number cannot be same as contact number') {
          setAltContactValidation(prev => ({
            ...prev,
            error: '',
            isAvailable: null,
            formatError: false
          }));
          debouncedValidation(altContactNumber, true);
        }
      }
    } else if (cleanedValue) {
      setContactValidation({
        loading: false,
        error: 'Please enter a valid 10-digit mobile number',
        isAvailable: null,
        formatError: true
      });
    } else {
      setContactValidation({
        loading: false,
        error: '',
        isAvailable: null,
        formatError: false
      });
    }
  };

  const handleAltContactNumberChange = (value: string) => {
    const cleanedValue = value.replace(/\D/g, '').slice(0, 10);
    setAltContactNumber(cleanedValue);

    setAltContactValidation(prev => ({
      ...prev,
      loading: false,
      error: '',
      isAvailable: null,
      formatError: false
    }));

    if (cleanedValue) {
      if (cleanedValue.length === 10) {
        setAltContactValidation(prev => ({
          ...prev,
          formatError: false,
          error: prev.error === 'Please enter a valid 10-digit mobile number' ? '' : prev.error
        }));

        if (cleanedValue === contactNumber) {
          setAltContactValidation({
            loading: false,
            error: 'Alternate number cannot be same as contact number',
            isAvailable: false,
            formatError: false
          });
        } else {
          debouncedValidation(cleanedValue, true);
        }
      } else {
        setAltContactValidation({
          loading: false,
          error: 'Please enter a valid 10-digit mobile number',
          isAvailable: null,
          formatError: true
        });
      }
    } else {
      setAltContactValidation({
        loading: false,
        error: '',
        isAvailable: null,
        formatError: false
      });
    }
  };

  const areNumbersUnique = (): boolean => {
    if (!contactNumber || !altContactNumber) return true;
    return contactNumber !== altContactNumber;
  };

  const validateAllFields = async (): Promise<boolean> => {
    if (!validateMobileFormat(contactNumber)) {
      showSnackbar("Please enter a valid 10-digit contact number", "error");
      return false;
    }

    if (!validatedFields.has('contactNumber') || contactValidation.isAvailable === null) {
      const isContactAvailable = await checkMobileAvailability(contactNumber, false);
      if (!isContactAvailable) {
        showSnackbar("Contact number is not available", "error");
        return false;
      }
    } else if (contactValidation.isAvailable === false) {
      showSnackbar("Contact number is not available", "error");
      return false;
    }

    if (altContactNumber) {
      if (!validateMobileFormat(altContactNumber)) {
        showSnackbar("Please enter a valid 10-digit alternate contact number", "error");
        return false;
      }

      if (!areNumbersUnique()) {
        showSnackbar("Contact number and alternate contact number must be different", "error");
        return false;
      }

      if (!validatedFields.has('altContactNumber') || altContactValidation.isAvailable === null) {
        const isAltContactAvailable = await checkMobileAvailability(altContactNumber, true);
        if (!isAltContactAvailable) {
          showSnackbar("Alternate contact number is not available", "error");
          return false;
        }
      } else if (altContactValidation.isAvailable === false) {
        showSnackbar("Alternate contact number is not available", "error");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    const isValid = await validateAllFields();
    if (!isValid) {
      return;
    }

    setLoading(true);

    try {
      if (!appUser?.customerid) {
        console.error("❌ Customer ID not found in appUser");
        showSnackbar("Customer ID not found!", "error");
        setLoading(false);
        return;
      }

      const payload: any = {
        customerid: appUser.customerid
      };
      
      if (contactNumber) payload.mobileNo = contactNumber;
      if (altContactNumber) payload.alternateNo = altContactNumber;

      console.log("📤 Sending update payload:", payload);

      const response = await axiosInstance.put(
        `/api/customer/update-customer/${appUser.customerid}`,
        payload
      );

      console.log("✅ API Response:", response.data);
      
      const updatedUser = {
        ...appUser,
        mobileNo: contactNumber,
        alternateNo: altContactNumber || null,
      };
      
      setAppUser(updatedUser);
      dispatch(setHasMobileNumber(true));

      console.log("✅ Updated appUser with mobile numbers:", updatedUser);
      console.log("✅ Updated Redux state: hasMobileNumber = true");

      showSnackbar("Mobile number(s) updated successfully!", "success");
      
      setValidatedFields(new Set());
      setContactValidation({ loading: false, error: '', isAvailable: null, formatError: false });
      setAltContactValidation({ loading: false, error: '', isAvailable: null, formatError: false });
      
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (error: any) {
      console.error("❌ Error updating mobile numbers:", error);
      const errorMessage = error.response?.data?.message || "Something went wrong while updating!";
      showSnackbar(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = (): boolean => {
    const contactValid = validateMobileFormat(contactNumber) && 
      (contactValidation.isAvailable === true || contactValidation.isAvailable === null);

    const altContactValid = !altContactNumber ||
      (validateMobileFormat(altContactNumber) && 
       (altContactValidation.isAvailable === true || altContactValidation.isAvailable === null) &&
       areNumbersUnique());

    return contactValid && altContactValid;
  };

  const handleClearContactNumber = () => {
    setContactNumber("");
    setContactValidation({
      loading: false,
      error: '',
      isAvailable: null,
      formatError: false
    });
    setValidatedFields(prev => {
      const newSet = new Set(prev);
      newSet.delete('contactNumber');
      return newSet;
    });
  };

  const handleClearAltContactNumber = () => {
    setAltContactNumber("");
    setAltContactValidation({
      loading: false,
      error: '',
      isAvailable: null,
      formatError: false
    });
    setValidatedFields(prev => {
      const newSet = new Set(prev);
      newSet.delete('altContactNumber');
      return newSet;
    });
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          {/* <View style={styles.header}> */}
           <LinearGradient
                    colors={["#0a2a66ff", "#004aadff"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.header}
                  >
            <Text style={styles.headerTitle}>Update Contact Numbers</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#fff" />
            </TouchableOpacity>
          {/* </View> */}
          </LinearGradient>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.description}>
              Please enter your mobile and alternative contact numbers to continue.
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Contact Number *</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[
                    styles.input,
                    (!!contactValidation.error || contactValidation.formatError) && styles.inputError
                  ]}
                  placeholder="10-digit mobile number"
                  value={contactNumber}
                  onChangeText={handleContactNumberChange}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
                <View style={styles.inputIcon}>
                  {contactValidation.loading ? (
                    <ActivityIndicator size="small" color="#666" />
                  ) : contactValidation.isAvailable ? (
                    <Icon name="check-circle" size={20} color="#4caf50" />
                  ) : contactValidation.isAvailable === false ? (
                    <TouchableOpacity onPress={handleClearContactNumber}>
                      <Icon name="cancel" size={20} color="#f44336" />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
              {contactValidation.error ? (
                <Text style={styles.errorText}>{contactValidation.error}</Text>
              ) : contactValidation.formatError ? (
                <Text style={styles.errorText}>Please enter exactly 10 digits</Text>
              ) : contactValidation.isAvailable ? (
                <Text style={styles.successText}>Contact number is available</Text>
              ) : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Alternative Contact Number (Optional)</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[
                    styles.input,
                    (!!altContactValidation.error || altContactValidation.formatError) && styles.inputError
                  ]}
                  placeholder="10-digit mobile number"
                  value={altContactNumber}
                  onChangeText={handleAltContactNumberChange}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
                <View style={styles.inputIcon}>
                  {altContactValidation.loading ? (
                    <ActivityIndicator size="small" color="#666" />
                  ) : altContactValidation.isAvailable ? (
                    <Icon name="check-circle" size={20} color="#4caf50" />
                  ) : altContactValidation.isAvailable === false ? (
                    <TouchableOpacity onPress={handleClearAltContactNumber}>
                      <Icon name="cancel" size={20} color="#f44336" />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
              {altContactValidation.error ? (
                <Text style={styles.errorText}>{altContactValidation.error}</Text>
              ) : altContactValidation.formatError ? (
                <Text style={styles.errorText}>Please enter exactly 10 digits</Text>
              ) : altContactValidation.isAvailable ? (
                <Text style={styles.successText}>Alternate number is available</Text>
              ) : null}
            </View>

            {!areNumbersUnique() && contactNumber && altContactNumber && (
              <View style={styles.warningContainer}>
                <Text style={styles.warningText}>
                  ⚠️ Contact number and alternate contact number must be different
                </Text>
              </View>
            )}
          </ScrollView>

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
                (loading || !isFormValid()) && styles.disabledButton
              ]}
              onPress={handleSubmit}
              disabled={loading || !isFormValid()}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.submitButtonText}> Updating...</Text>
                </View>
              ) : (
                <Text style={styles.submitButtonText}>Submit</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {snackbar.visible && (
        <View style={[
          styles.snackbar,
          snackbar.type === 'success' ? styles.snackbarSuccess :
          snackbar.type === 'error' ? styles.snackbarError :
          styles.snackbarInfo
        ]}>
          <Text style={styles.snackbarText}>{snackbar.message}</Text>
        </View>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    maxHeight: '80%',
  },
  header: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  description: {
    color: '#4b5563',
    fontSize: 14,
    marginBottom: 20,
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
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    paddingRight: 40,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  inputIcon: {
    position: 'absolute',
    right: 12,
    top: 12,
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
  warningContainer: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fee2e2',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  warningText: {
    color: '#b91c1c',
    fontSize: 14,
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
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#2563eb',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  snackbar: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 8,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  snackbarSuccess: {
    backgroundColor: '#4caf50',
  },
  snackbarError: {
    backgroundColor: '#f44336',
  },
  snackbarInfo: {
    backgroundColor: '#2196f3',
  },
  snackbarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default MobileNumberDialog;