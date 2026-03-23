/* eslint-disable */
import React, { useEffect, useState, useRef } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAppUser } from "../context/AppUserContext";
import providerInstance from "../services/providerInstance";
import { useDispatch } from "react-redux";
import { setHasMobileNumber } from "../features/customerSlice";
import LinearGradient from "react-native-linear-gradient";
import { useTheme } from "../../src/Settings/ThemeContext";
import { useTranslation } from 'react-i18next';

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
  const { colors, fontSize, isDarkMode } = useTheme();
  const { t } = useTranslation();
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

  // Get font sizes based on theme
  const getFontSizes = () => {
    switch (fontSize) {
      case 'small':
        return {
          headerTitle: 16,
          description: 13,
          label: 13,
          input: 14,
          buttonText: 13,
          snackbarText: 13,
          errorText: 11,
          successText: 11,
          warningText: 13,
        };
      case 'large':
        return {
          headerTitle: 20,
          description: 16,
          label: 16,
          input: 18,
          buttonText: 16,
          snackbarText: 16,
          errorText: 14,
          successText: 14,
          warningText: 16,
        };
      default:
        return {
          headerTitle: 18,
          description: 14,
          label: 14,
          input: 16,
          buttonText: 14,
          snackbarText: 14,
          errorText: 12,
          successText: 12,
          warningText: 14,
        };
    }
  };

  const fontSizes = getFontSizes();

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
          ? isAlternate 
            ? t('errors.alternateNumberUnavailable') 
            : t('errors.contactNumberUnavailable')
          : '';
      } else if (response.data.available !== undefined) {
        isAvailable = response.data.available;
        errorMessage = !response.data.available 
          ? isAlternate 
            ? t('errors.alternateNumberUnavailable') 
            : t('errors.contactNumberUnavailable')
          : '';
      } else if (response.data.isAvailable !== undefined) {
        isAvailable = response.data.isAvailable;
        errorMessage = !response.data.isAvailable 
          ? isAlternate 
            ? t('errors.alternateNumberUnavailable') 
            : t('errors.contactNumberUnavailable')
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
      
      let errorMessage = t('errors.generic');
      
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
        errorMessage = t('validation.phone');
      } else if (error.response?.status === 409) {
        errorMessage = isAlternate 
          ? t('errors.alternateNumberUnavailable') 
          : t('errors.contactNumberUnavailable');
      } else if (error.response?.status === 500) {
        errorMessage = t('errors.server');
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
        error: prev.error === t('mobileDialog.enterExactly10Digits') ? '' : prev.error
      }));
      
      debouncedValidation(cleanedValue, false);
      
      if (altContactNumber === cleanedValue) {
        setAltContactValidation(prev => ({
          ...prev,
          error: t('mobileDialog.numbersMustBeDifferent'),
          isAvailable: false,
          formatError: false
        }));
      } else if (altContactNumber && altContactNumber.length === 10) {
        if (altContactValidation.error === t('mobileDialog.numbersMustBeDifferent')) {
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
        error: t('mobileDialog.enterExactly10Digits'),
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
          error: prev.error === t('mobileDialog.enterExactly10Digits') ? '' : prev.error
        }));

        if (cleanedValue === contactNumber) {
          setAltContactValidation({
            loading: false,
            error: t('mobileDialog.numbersMustBeDifferent'),
            isAvailable: false,
            formatError: false
          });
        } else {
          debouncedValidation(cleanedValue, true);
        }
      } else {
        setAltContactValidation({
          loading: false,
          error: t('mobileDialog.enterExactly10Digits'),
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
      showSnackbar(t('mobileDialog.enterExactly10Digits'), "error");
      return false;
    }

    if (!validatedFields.has('contactNumber') || contactValidation.isAvailable === null) {
      const isContactAvailable = await checkMobileAvailability(contactNumber, false);
      if (!isContactAvailable) {
        showSnackbar(t('errors.contactNumberUnavailable'), "error");
        return false;
      }
    } else if (contactValidation.isAvailable === false) {
      showSnackbar(t('errors.contactNumberUnavailable'), "error");
      return false;
    }

    if (altContactNumber) {
      if (!validateMobileFormat(altContactNumber)) {
        showSnackbar(t('mobileDialog.enterExactly10Digits'), "error");
        return false;
      }

      if (!areNumbersUnique()) {
        showSnackbar(t('mobileDialog.numbersMustBeDifferent'), "error");
        return false;
      }

      if (!validatedFields.has('altContactNumber') || altContactValidation.isAvailable === null) {
        const isAltContactAvailable = await checkMobileAvailability(altContactNumber, true);
        if (!isAltContactAvailable) {
          showSnackbar(t('errors.alternateNumberUnavailable'), "error");
          return false;
        }
      } else if (altContactValidation.isAvailable === false) {
        showSnackbar(t('errors.alternateNumberUnavailable'), "error");
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
        showSnackbar(t('errors.customerIdNotFound'), "error");
        setLoading(false);
        return;
      }

      // Create payload with lowercase field names as per API requirement
      const payload: any = {
        customerid: appUser.customerid  // Keep as customerid (already lowercase)
      };

      // Use lowercase field names: mobileno, alternateno
      if (contactNumber) {
        payload.mobileno = contactNumber;  // lowercase
      }
      
      if (altContactNumber) {
        payload.alternateno = altContactNumber;  // lowercase
      }

      console.log("📤 Sending update payload with lowercase fields:", payload);

      // Use providerInstance with the correct endpoint (same as in ProfileScreen)
      const response = await providerInstance.put(
        `/api/customer/${appUser.customerid}`,  // Using providerInstance and correct endpoint
        payload
      );

      console.log("✅ API Response:", response.data);
      
      // Update the appUser context with mobile numbers
      const updatedUser = {
        ...appUser,
        mobileNo: contactNumber,  // Keep camelCase in context if that's what it expects
        alternateNo: altContactNumber || null,
      };
      
      setAppUser(updatedUser);

      // Update Redux state
      dispatch(setHasMobileNumber(true));

      console.log("✅ Updated appUser with mobile numbers:", updatedUser);
      console.log("✅ Updated Redux state: hasMobileNumber = true");

      showSnackbar(t('mobileDialog.updateSuccess'), "success");
      
      setValidatedFields(new Set());
      setContactValidation({ loading: false, error: '', isAvailable: null, formatError: false });
      setAltContactValidation({ loading: false, error: '', isAvailable: null, formatError: false });
      
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (error: any) {
      console.error("❌ Error updating mobile numbers:", error);
      
      // Better error handling
      let errorMessage = t('mobileDialog.updateFailed');
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
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

  const dynamicStyles = StyleSheet.create({
    modalContainer: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      width: '90%',
      maxWidth: 400,
      backgroundColor: colors.card,
      borderRadius: 12,
      overflow: 'hidden',
      maxHeight: '80%',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
    },
    headerTitle: {
      color: '#fff',
      fontSize: fontSizes.headerTitle,
      fontWeight: '600',
    },
    closeButton: {
      padding: 4,
    },
    content: {
      padding: 20,
    },
    description: {
      color: colors.textSecondary,
      fontSize: fontSizes.description,
      marginBottom: 20,
    },
    inputContainer: {
      marginBottom: 20,
    },
    label: {
      fontSize: fontSizes.label,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 8,
    },
    inputWrapper: {
      position: 'relative',
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: fontSizes.input,
      paddingRight: 40,
      backgroundColor: colors.card,
      color: colors.text,
    },
    inputError: {
      borderColor: colors.error,
    },
    inputIcon: {
      position: 'absolute',
      right: 12,
      top: 12,
    },
    errorText: {
      color: colors.error,
      fontSize: fontSizes.errorText,
      marginTop: 4,
    },
    successText: {
      color: colors.success,
      fontSize: fontSizes.successText,
      marginTop: 4,
    },
    warningContainer: {
      backgroundColor: colors.errorLight,
      borderWidth: 1,
      borderColor: colors.error,
      borderRadius: 8,
      padding: 12,
      marginTop: 8,
    },
    warningText: {
      color: colors.error,
      fontSize: fontSizes.warningText,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
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
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cancelButtonText: {
      color: colors.text,
      fontWeight: '500',
      fontSize: fontSizes.buttonText,
    },
    submitButton: {
      backgroundColor: colors.primary,
    },
    submitButtonText: {
      color: '#fff',
      fontWeight: '500',
      fontSize: fontSizes.buttonText,
    },
    disabledButton: {
      backgroundColor: colors.disabled,
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
      backgroundColor: colors.success,
    },
    snackbarError: {
      backgroundColor: colors.error,
    },
    snackbarInfo: {
      backgroundColor: colors.info,
    },
    snackbarText: {
      color: '#fff',
      fontSize: fontSizes.snackbarText,
      fontWeight: '500',
      textAlign: 'center',
    },
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={dynamicStyles.modalContainer}
      >
        <View style={dynamicStyles.modalContent}>
          <LinearGradient
            colors={["#0a2a66ff", "#004aadff"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={dynamicStyles.header}
          >
            <Text style={dynamicStyles.headerTitle}>{t('mobileDialog.title')}</Text>
            <TouchableOpacity onPress={onClose} style={dynamicStyles.closeButton}>
              <Icon name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView style={dynamicStyles.content} showsVerticalScrollIndicator={false}>
            <Text style={dynamicStyles.description}>
              {t('mobileDialog.description')}
            </Text>

            <View style={dynamicStyles.inputContainer}>
              <Text style={dynamicStyles.label}>{t('mobileDialog.contactNumberRequired')}</Text>
              <View style={dynamicStyles.inputWrapper}>
                <TextInput
                  style={[
                    dynamicStyles.input,
                    (!!contactValidation.error || contactValidation.formatError) && dynamicStyles.inputError
                  ]}
                  placeholder={t('mobileDialog.enter10Digit')}
                  placeholderTextColor={colors.placeholder}
                  value={contactNumber}
                  onChangeText={handleContactNumberChange}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
                <View style={dynamicStyles.inputIcon}>
                  {contactValidation.loading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : contactValidation.isAvailable ? (
                    <Icon name="check-circle" size={20} color={colors.success} />
                  ) : contactValidation.isAvailable === false ? (
                    <TouchableOpacity onPress={handleClearContactNumber}>
                      <Icon name="cancel" size={20} color={colors.error} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
              {contactValidation.error ? (
                <Text style={dynamicStyles.errorText}>{contactValidation.error}</Text>
              ) : contactValidation.formatError ? (
                <Text style={dynamicStyles.errorText}>{t('mobileDialog.enterExactly10Digits')}</Text>
              ) : contactValidation.isAvailable ? (
                <Text style={dynamicStyles.successText}>{t('mobileDialog.contactNumberAvailable')}</Text>
              ) : null}
            </View>

            <View style={dynamicStyles.inputContainer}>
              <Text style={dynamicStyles.label}>{t('mobileDialog.alternativeContactOptional')}</Text>
              <View style={dynamicStyles.inputWrapper}>
                <TextInput
                  style={[
                    dynamicStyles.input,
                    (!!altContactValidation.error || altContactValidation.formatError) && dynamicStyles.inputError
                  ]}
                  placeholder={t('mobileDialog.enter10Digit')}
                  placeholderTextColor={colors.placeholder}
                  value={altContactNumber}
                  onChangeText={handleAltContactNumberChange}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
                <View style={dynamicStyles.inputIcon}>
                  {altContactValidation.loading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : altContactValidation.isAvailable ? (
                    <Icon name="check-circle" size={20} color={colors.success} />
                  ) : altContactValidation.isAvailable === false ? (
                    <TouchableOpacity onPress={handleClearAltContactNumber}>
                      <Icon name="cancel" size={20} color={colors.error} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
              {altContactValidation.error ? (
                <Text style={dynamicStyles.errorText}>{altContactValidation.error}</Text>
              ) : altContactValidation.formatError ? (
                <Text style={dynamicStyles.errorText}>{t('mobileDialog.enterExactly10Digits')}</Text>
              ) : altContactValidation.isAvailable ? (
                <Text style={dynamicStyles.successText}>{t('mobileDialog.alternateNumberAvailable')}</Text>
              ) : null}
            </View>

            {!areNumbersUnique() && contactNumber && altContactNumber && (
              <View style={dynamicStyles.warningContainer}>
                <Text style={dynamicStyles.warningText}>
                  ⚠️ {t('mobileDialog.numbersMustBeDifferent')}
                </Text>
              </View>
            )}
          </ScrollView>

          <View style={dynamicStyles.actions}>
            <TouchableOpacity
              style={[dynamicStyles.button, dynamicStyles.cancelButton]}
              onPress={onClose}
            >
              <Text style={dynamicStyles.cancelButtonText}>{t('mobileDialog.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                dynamicStyles.button,
                dynamicStyles.submitButton,
                (loading || !isFormValid()) && dynamicStyles.disabledButton
              ]}
              onPress={handleSubmit}
              disabled={loading || !isFormValid()}
            >
              {loading ? (
                <View style={dynamicStyles.loadingContainer}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={dynamicStyles.submitButtonText}> {t('mobileDialog.updating')}</Text>
                </View>
              ) : (
                <Text style={dynamicStyles.submitButtonText}>{t('mobileDialog.submit')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {snackbar.visible && (
        <View style={[
          dynamicStyles.snackbar,
          snackbar.type === 'success' ? dynamicStyles.snackbarSuccess :
          snackbar.type === 'error' ? dynamicStyles.snackbarError :
          dynamicStyles.snackbarInfo
        ]}>
          <Text style={dynamicStyles.snackbarText}>{snackbar.message}</Text>
        </View>
      )}
    </Modal>
  );
};

export default MobileNumberDialog;