import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Clipboard,
} from 'react-native';
import {
  SafeAreaView,
  SafeAreaProvider,
} from 'react-native-safe-area-context';

import Icon from 'react-native-vector-icons/MaterialIcons';
import providerInstance from '../services/providerInstance';
import axios from 'axios';
import { useFieldValidation } from '../Registration/useFieldValidation';
import LinearGradient from 'react-native-linear-gradient';
import { useTranslation } from 'react-i18next';

interface RegistrationProps {
  onBackToLogin: (data: boolean) => void;
  onClose?: () => void;
  visible?: boolean;
}

interface FormData {
  companyName: string;
  phoneNo: string;
  emailId: string;
  address: string;
  registrationId: string;
  password: string;
  confirmPassword: string;
}

interface ValidationErrors {
  phoneNo: string;
  emailId: string;
  registrationId: string;
  password: string;
  confirmPassword: string;
}

interface ApiResponse {
  registrationId?: string;
  message?: string;
  error?: string;
}

interface ApiRequestPayload {
  companyName: string;
  address: string;
  emailid: string;
  phoneNo: string;
  registrationId: string;
}

const CustomSnackbar: React.FC<{
  visible: boolean;
  message: string;
  type: 'success' | 'error';
  onDismiss: () => void;
}> = ({ visible, message, type, onDismiss }) => {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onDismiss();
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [visible, onDismiss]);

  if (!visible) return null;

  return (
    <View
      style={[
        styles.snackbar,
        type === 'success' ? styles.snackbarSuccess : styles.snackbarError,
      ]}
    >
      <Text style={styles.snackbarText}>{message}</Text>
      <TouchableOpacity onPress={onDismiss}>
        <Icon name="close" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const RegistrationIdDisplay: React.FC<{
  registrationId: string;
  onCopy: () => void;
  disabled?: boolean;
}> = ({ registrationId, onCopy, disabled }) => (
  <View style={styles.registrationIdContainer}>
    <View style={styles.registrationIdContent}>
      <Text style={styles.registrationIdLabel}>Registration ID</Text>
      <Text style={styles.registrationIdValue}>{registrationId}</Text>
    </View>
    <TouchableOpacity
      onPress={onCopy}
      disabled={disabled}
      style={styles.copyButton}
    >
      <Icon name="content-copy" size={20} color="#1976d2" />
    </TouchableOpacity>
  </View>
);

// Tooltip Component
const Tooltip: React.FC<{
  visible: boolean;
  text: string;
  onClose: () => void;
}> = ({ visible, text, onClose }) => {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <View style={styles.tooltipContainer}>
      <View style={styles.tooltipContent}>
        <Text style={styles.tooltipText}>{text}</Text>
        <TouchableOpacity onPress={onClose} style={styles.tooltipClose}>
          <Icon name="close" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
      <View style={styles.tooltipArrow} />
    </View>
  );
};

const AgentRegistrationForm: React.FC<RegistrationProps> = ({
  onBackToLogin,
  onClose,
  visible = true,
}) => {
  const { t } = useTranslation();

  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    phoneNo: '',
    emailId: '',
    address: '',
    registrationId: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({
    phoneNo: '',
    emailId: '',
    registrationId: '',
    password: '',
    confirmPassword: '',
  });

  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>(
    'success'
  );

  const [returnedRegistrationId, setReturnedRegistrationId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { validationResults, validateField, resetValidation } =
    useFieldValidation();

  const [emailTimer, setEmailTimer] = useState<NodeJS.Timeout | null>(null);
  const [mobileTimer, setMobileTimer] = useState<NodeJS.Timeout | null>(null);

  const mobileRegex = /^[0-9]{10}$/;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const passwordRegex =
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  const registrationIdRegex = /^[A-Z0-9]{10,20}$/;

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    setValidationErrors((prev) => ({
      ...prev,
      [field]: '',
    }));

    if (field === 'emailId') {
      if (emailTimer) clearTimeout(emailTimer);
      const timer = setTimeout(() => {
        if (value && emailRegex.test(value)) {
          validateField('email', value);
        }
      }, 500);
      setEmailTimer(timer);
    }

    if (field === 'phoneNo') {
      if (mobileTimer) clearTimeout(mobileTimer);
      const timer = setTimeout(() => {
        if (value && mobileRegex.test(value)) {
          validateField('mobile', value);
        }
      }, 500);
      setMobileTimer(timer);
    }

    validateForm(field, value);
  };

  const validateForm = (field: string, value: string) => {
    switch (field) {
      case 'phoneNo':
        setValidationErrors((prev) => ({
          ...prev,
          phoneNo: !mobileRegex.test(value)
            ? t('phoneValidationError')
            : '',
        }));
        break;
      case 'emailId':
        setValidationErrors((prev) => ({
          ...prev,
          emailId: !emailRegex.test(value) ? t('emailValidationError') : '',
        }));
        break;
      case 'registrationId':
        setValidationErrors((prev) => ({
          ...prev,
          registrationId: !value.trim()
            ? t('registrationIdRequired')
            : !registrationIdRegex.test(value)
            ? t('registrationIdValidationError')
            : '',
        }));
        break;
      case 'password':
        setValidationErrors((prev) => ({
          ...prev,
          password: !passwordRegex.test(value)
            ? t('passwordValidationError')
            : '',
        }));
        break;
      case 'confirmPassword':
        setValidationErrors((prev) => ({
          ...prev,
          confirmPassword:
            value !== formData.password ? t('passwordMismatch') : '',
        }));
        break;
      default:
        break;
    }
  };

  const isFormValid = () => {
    const basicValidations =
      !validationErrors.phoneNo &&
      !validationErrors.emailId &&
      !validationErrors.registrationId &&
      !validationErrors.password &&
      !validationErrors.confirmPassword &&
      formData.companyName &&
      formData.phoneNo &&
      formData.emailId &&
      formData.address &&
      formData.registrationId &&
      formData.password &&
      formData.confirmPassword;

    const availabilityValidations =
      validationResults.email.isAvailable === true &&
      validationResults.mobile.isAvailable === true;

    return basicValidations && availabilityValidations;
  };

  const handleSubmit = async () => {
    if (!formData.companyName || !formData.address) {
      setMessage(t('fillRequiredFields'));
      setSnackbarSeverity('error');
      setSnackbarVisible(true);
      return;
    }

    if (!isFormValid()) {
      setMessage(t('ensureValidFields'));
      setSnackbarSeverity('error');
      setSnackbarVisible(true);
      return;
    }

    setIsSubmitting(true);

    const requestData: ApiRequestPayload = {
      companyName: formData.companyName,
      address: formData.address,
      emailid: formData.emailId,
      phoneNo: formData.phoneNo,
      registrationId: formData.registrationId,
    };

    try {
      const response = await providerInstance.post<ApiResponse>(
        '/api/vendor/add',
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 200 || response.status === 201) {
        const authPayload = {
          email: formData.emailId,
          password: formData.password,
          name: `${formData.companyName}`,
        };

        axios
          .post(
            'https://utils-ndt3.onrender.com/authO/create-autho-user',
            authPayload
          )
          .then((authResponse) => {
            console.log('AuthO user created successfully:', authResponse.data);
          })
          .catch((authError) => {
            console.error('Error creating AuthO user:', authError);
          });

        const apiReturnedId =
          response.data.registrationId || formData.registrationId;
        setReturnedRegistrationId(apiReturnedId);
        setMessage(t('vendorAdded'));
        setSnackbarSeverity('success');
        setSnackbarVisible(true);

        setFormData({
          companyName: '',
          phoneNo: '',
          emailId: '',
          address: '',
          registrationId: '',
          password: '',
          confirmPassword: '',
        });

        resetValidation();

        setTimeout(() => {
          setIsSubmitting(false);
          if (onClose) {
            onClose();
          } else {
            onBackToLogin(true);
          }
        }, 2000);
      } else {
        setMessage(response.data.error || t('vendorAddFailed'));
        setSnackbarSeverity('error');
        setSnackbarVisible(true);
        setIsSubmitting(false);
      }
    } catch (error: any) {
      console.error('API Error:', error);

      if (error.response) {
        setMessage(error.response.data.error || t('serverError'));
      } else if (error.request) {
        setMessage(t('noServerResponse'));
      } else {
        setMessage(t('apiConnectionError'));
      }

      setSnackbarSeverity('error');
      setSnackbarVisible(true);
      setIsSubmitting(false);
    }
  };

  const handleCopyRegistrationId = async () => {
    try {
      await Clipboard.setString(returnedRegistrationId);
      setMessage(t('registrationIdCopied'));
      setSnackbarSeverity('success');
      setSnackbarVisible(true);
    } catch (err) {
      console.error('Failed to copy registration ID: ', err);
      setMessage(t('copyFailed'));
      setSnackbarSeverity('error');
      setSnackbarVisible(true);
    }
  };

  const handleInfoPress = () => {
    setShowTooltip(true);
  };

  useEffect(() => {
    return () => {
      if (emailTimer) clearTimeout(emailTimer);
      if (mobileTimer) clearTimeout(mobileTimer);
    };
  }, [emailTimer, mobileTimer]);

  const renderValidationIcon = (fieldType: 'email' | 'mobile') => {
    const result = validationResults[fieldType];

    if (result.loading) {
      return <ActivityIndicator size="small" color="#0000ff" />;
    }

    if (result.isAvailable === true) {
      return <Icon name="check-circle" size={20} color="#4caf50" />;
    }

    if (result.isAvailable === false) {
      return <Icon name="error" size={20} color="#f44336" />;
    }

    return null;
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      onBackToLogin(true);
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.modalOverlay} />
      </TouchableWithoutFeedback>
      
      <SafeAreaProvider>
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.dialogContainer}
          >
            <View style={styles.dialogContent}>
              {/* Dialog Header */}
              <LinearGradient
                colors={["#0a2a66ff", "#004aadff"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.dialogHeader}
              >
                <Text style={styles.dialogTitle}>{t('Agent Registration')}</Text>
                <View style={{ width: 40 }} />
                <TouchableOpacity onPress={handleClose} style={styles.closeButton} disabled={isSubmitting}>
                  <Icon name="close" size={24} color="#f8f5f5" />
                </TouchableOpacity>
              </LinearGradient>
              
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                <View style={styles.form}>
                  {/* Company Name */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>{t('companyName')} *</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.companyName}
                      onChangeText={(value) => handleChange('companyName', value)}
                      editable={!isSubmitting}
                      placeholder={t('companyName')}
                      placeholderTextColor="#999"
                    />
                  </View>

                  {/* Mobile Number */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>{t('mobileNumber')} *</Text>
                    <View style={styles.inputWithIcon}>
                      <TextInput
                        style={[
                          styles.input,
                          styles.inputWithIconField,
                          (!!validationErrors.phoneNo ||
                            validationResults.mobile.isAvailable === false) &&
                            styles.inputError,
                        ]}
                        value={formData.phoneNo}
                        onChangeText={(value) => handleChange('phoneNo', value)}
                        editable={!isSubmitting}
                        keyboardType="phone-pad"
                        maxLength={10}
                        placeholder={t('mobileNumber')}
                        placeholderTextColor="#999"
                      />
                      <View style={styles.iconContainer}>
                        {renderValidationIcon('mobile')}
                      </View>
                    </View>
                    {(validationErrors.phoneNo ||
                      validationResults.mobile.error ||
                      validationResults.mobile.isAvailable === false) && (
                      <Text style={styles.errorText}>
                        {validationErrors.phoneNo ||
                          validationResults.mobile.error ||
                          (validationResults.mobile.isAvailable === false
                            ? t('mobileAlreadyRegistered')
                            : '')}
                      </Text>
                    )}
                  </View>

                  {/* Email */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>{t('emailId')} *</Text>
                    <View style={styles.inputWithIcon}>
                      <TextInput
                        style={[
                          styles.input,
                          styles.inputWithIconField,
                          (!!validationErrors.emailId ||
                            validationResults.email.isAvailable === false) &&
                            styles.inputError,
                        ]}
                        value={formData.emailId}
                        onChangeText={(value) => handleChange('emailId', value)}
                        editable={!isSubmitting}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        placeholder={t('emailId')}
                        placeholderTextColor="#999"
                      />
                      <View style={styles.iconContainer}>
                        {renderValidationIcon('email')}
                      </View>
                    </View>
                    {(validationErrors.emailId ||
                      validationResults.email.error ||
                      validationResults.email.isAvailable === false) && (
                      <Text style={styles.errorText}>
                        {validationErrors.emailId ||
                          validationResults.email.error ||
                          (validationResults.email.isAvailable === false
                            ? t('emailAlreadyRegistered')
                            : '')}
                      </Text>
                    )}
                  </View>

                  {/* Registration ID with Info Button */}
                  <View style={styles.inputContainer}>
                    <View style={styles.labelContainer}>
                      <Text style={styles.label}>{t('registrationId')} *</Text>
                      <TouchableOpacity 
                        onPress={handleInfoPress} 
                        style={styles.infoButton}
                        activeOpacity={0.7}
                      >
                        <Icon name="info-outline" size={20} color="#1976d2" />
                      </TouchableOpacity>
                    </View>
                    <TextInput
                      style={[
                        styles.input,
                        !!validationErrors.registrationId && styles.inputError,
                      ]}
                      value={formData.registrationId}
                      onChangeText={(value) =>
                        handleChange('registrationId', value.toUpperCase())
                      }
                      editable={!isSubmitting}
                      maxLength={20}
                      placeholder={t('registrationId')}
                      placeholderTextColor="#999"
                      autoCapitalize="characters"
                    />
                    {validationErrors.registrationId && (
                      <Text style={styles.errorText}>
                        {validationErrors.registrationId}
                      </Text>
                    )}
                  </View>

                  {/* Password */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>{t('password')} *</Text>
                    <View style={styles.inputWithIcon}>
                      <TextInput
                        style={[
                          styles.input,
                          styles.inputWithIconField,
                          !!validationErrors.password && styles.inputError,
                        ]}
                        value={formData.password}
                        onChangeText={(value) => handleChange('password', value)}
                        editable={!isSubmitting}
                        secureTextEntry={!showPassword}
                        placeholder={t('password')}
                        placeholderTextColor="#999"
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.iconContainer}
                        disabled={isSubmitting}
                      >
                        <Icon
                          name={showPassword ? 'visibility-off' : 'visibility'}
                          size={20}
                          color="#757575"
                        />
                      </TouchableOpacity>
                    </View>
                    {validationErrors.password && (
                      <Text style={styles.errorText}>
                        {validationErrors.password}
                      </Text>
                    )}
                  </View>

                  {/* Confirm Password */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>{t('confirmPassword')} *</Text>
                    <View style={styles.inputWithIcon}>
                      <TextInput
                        style={[
                          styles.input,
                          styles.inputWithIconField,
                          !!validationErrors.confirmPassword && styles.inputError,
                        ]}
                        value={formData.confirmPassword}
                        onChangeText={(value) =>
                          handleChange('confirmPassword', value)
                        }
                        editable={!isSubmitting}
                        secureTextEntry={!showConfirmPassword}
                        placeholder={t('confirmPassword')}
                        placeholderTextColor="#999"
                      />
                      <TouchableOpacity
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={styles.iconContainer}
                        disabled={isSubmitting}
                      >
                        <Icon
                          name={showConfirmPassword ? 'visibility-off' : 'visibility'}
                          size={20}
                          color="#757575"
                        />
                      </TouchableOpacity>
                    </View>
                    {validationErrors.confirmPassword && (
                      <Text style={styles.errorText}>
                        {validationErrors.confirmPassword}
                      </Text>
                    )}
                  </View>

                  {/* Address */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>{t('companyAddress')} *</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={formData.address}
                      onChangeText={(value) => handleChange('address', value)}
                      editable={!isSubmitting}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                      placeholder={t('companyAddress')}
                      placeholderTextColor="#999"
                    />
                  </View>

                  {/* Submit Button */}
                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      (!isFormValid() || isSubmitting) &&
                        styles.submitButtonDisabled,
                    ]}
                    onPress={handleSubmit}
                    disabled={!isFormValid() || isSubmitting}
                  >
                    {isSubmitting ? (
                      <View style={styles.submitButtonContent}>
                        <ActivityIndicator size="small" color="#fff" />
                        <Text style={styles.submitButtonText}>
                          {t('submitting')}
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.submitButtonText}>{t('submit')}</Text>
                    )}
                  </TouchableOpacity>

                  {/* Registration ID Display */}
                  {returnedRegistrationId && (
                    <RegistrationIdDisplay
                      registrationId={returnedRegistrationId}
                      onCopy={handleCopyRegistrationId}
                      disabled={isSubmitting}
                    />
                  )}
                </View>
              </ScrollView>

              {/* Snackbar/Toast */}
              <CustomSnackbar
                visible={snackbarVisible}
                message={message}
                type={snackbarSeverity}
                onDismiss={() => setSnackbarVisible(false)}
              />

              {/* Tooltip */}
              <Tooltip
                visible={showTooltip}
                text="Government-issued company registration ID"
                onClose={() => setShowTooltip(false)}
              />
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  safeArea: {
    flex: 1,
  },
  dialogContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialogContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  dialogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  form: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  infoButton: {
    marginLeft: 8,
    padding: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  inputError: {
    borderColor: '#f44336',
  },
  errorText: {
    color: '#f44336',
    fontSize: 12,
    marginTop: 4,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  inputWithIconField: {
    flex: 1,
    paddingRight: 40,
  },
  iconContainer: {
    position: 'absolute',
    right: 12,
    height: '100%',
    justifyContent: 'center',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#1976d2',
    paddingVertical: 14,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  submitButtonDisabled: {
    backgroundColor: '#b0bec5',
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  registrationIdContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4caf50',
    marginTop: 16,
  },
  registrationIdContent: {
    flex: 1,
  },
  registrationIdLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  registrationIdValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  copyButton: {
    padding: 8,
  },
  snackbar: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 4,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 9999,
  },
  snackbarSuccess: {
    backgroundColor: '#4caf50',
  },
  snackbarError: {
    backgroundColor: '#f44336',
  },
  snackbarText: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  tooltipContainer: {
    position: 'absolute',
    top: '35%',
    left: '10%',
    right: '10%',
    zIndex: 10000,
    alignItems: 'center',
  },
  tooltipContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: '100%',
  },
  tooltipText: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  tooltipClose: {
    padding: 2,
  },
  tooltipArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'rgba(0, 0, 0, 0.85)',
    position: 'absolute',
    bottom: -8,
  },
});

export default AgentRegistrationForm;