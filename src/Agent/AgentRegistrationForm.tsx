import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Clipboard,
  Animated,
  Dimensions,
} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import Icon from 'react-native-vector-icons/MaterialIcons';
import providerInstance from '../services/providerInstance';
import axios from 'axios';
import { useFieldValidation } from '../Registration/useFieldValidation';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../Settings/ThemeContext';
import { HOME_M3 } from '../theme/brandColors';
import {
  RegistrationKeyboardAccessory,
  RegistrationAndroidKeyboardBar,
  registrationKeyboardInputProps,
} from '../common/RegistrationKeyboardAccessory';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.94;
const SHEET_RADIUS = 18;

interface RegistrationProps {
  onBackToLogin: (data: boolean) => void;
  onClose?: () => void;
  visible?: boolean;
}

interface RegistrationContentProps extends RegistrationProps {
  onDismiss: () => void;
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
  accentColor?: string;
}> = ({ registrationId, onCopy, disabled, accentColor = HOME_M3.secondary }) => (
  <View style={styles.registrationIdContainer}>
    <View style={styles.registrationIdContent}>
      <Text style={styles.registrationIdLabel}>Registration ID</Text>
      <Text style={[styles.registrationIdValue, { color: accentColor }]}>{registrationId}</Text>
    </View>
    <TouchableOpacity
      onPress={onCopy}
      disabled={disabled}
      style={styles.copyButton}
    >
      <Icon name="content-copy" size={20} color={accentColor} />
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

const AgentRegistrationForm: React.FC<RegistrationProps> = (props) => (
  <Modal
    visible={props.visible !== false}
    transparent
    animationType="none"
    statusBarTranslucent
    onRequestClose={() => {
      if (props.onClose) props.onClose();
      else props.onBackToLogin(true);
    }}
  >
    <SafeAreaProvider>
      <AgentRegistrationSheetHost {...props} />
    </SafeAreaProvider>
  </Modal>
);

const AgentRegistrationSheetHost: React.FC<RegistrationProps> = (props) => {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const finishDismiss = useCallback(() => {
    slideAnim.setValue(SCREEN_HEIGHT);
    fadeAnim.setValue(0);
    if (props.onClose) {
      props.onClose();
    } else {
      props.onBackToLogin(true);
    }
  }, [fadeAnim, props, slideAnim]);

  const dismissWithAnimation = useCallback(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(finishDismiss);
  }, [fadeAnim, finishDismiss, slideAnim]);

  useEffect(() => {
    if (props.visible === false) return;
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 9,
        tension: 70,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, props.visible, slideAnim]);

  return (
    <View style={styles.modalRoot}>
      <Animated.View style={[styles.sheetOverlay, { opacity: fadeAnim }]}>
        <TouchableWithoutFeedback onPress={dismissWithAnimation}>
          <View style={styles.sheetOverlayTap} />
        </TouchableWithoutFeedback>
      </Animated.View>

      <Animated.View
        style={[
          styles.sheet,
          {
            maxHeight: SHEET_MAX_HEIGHT,
            paddingBottom: Math.max(insets.bottom, 8),
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <AgentRegistrationContent {...props} onDismiss={dismissWithAnimation} />
      </Animated.View>
    </View>
  );
};

const AgentRegistrationContent: React.FC<RegistrationContentProps> = ({
  onDismiss,
}) => {
  const { t } = useTranslation();
  const { colors, isDarkMode } = useTheme();

  const palette = useMemo(
    () => ({
      canvas: isDarkMode ? colors.background : HOME_M3.surface,
      card: isDarkMode ? colors.card : HOME_M3.surfaceContainerLowest,
      cardBorder: isDarkMode ? colors.border : HOME_M3.outlineVariant,
      text: isDarkMode ? colors.text : HOME_M3.onSurface,
      muted: isDarkMode ? colors.textSecondary : HOME_M3.onSurfaceVariant,
      accent: isDarkMode ? colors.primary : HOME_M3.secondary,
      inputBg: isDarkMode ? colors.surface : HOME_M3.surfaceContainerLow,
      placeholder: isDarkMode ? colors.placeholder : HOME_M3.outline,
      primaryBtn: isDarkMode ? colors.primary : HOME_M3.primary,
      disabledBtn: isDarkMode ? colors.disabled : HOME_M3.outlineVariant,
      error: isDarkMode ? colors.error : HOME_M3.error,
    }),
    [colors, isDarkMode],
  );

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
          onDismiss();
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
      return <ActivityIndicator size="small" color={palette.accent} />;
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
    if (isSubmitting) return;
    onDismiss();
  };

  return (
    <View style={[styles.sheetBody, { backgroundColor: palette.canvas }]}>
      <View style={[styles.sheetHeader, { backgroundColor: palette.card, borderBottomColor: palette.cardBorder }]}>
        <View style={styles.headerAccent} />
        <View style={styles.handleRow}>
          <View style={[styles.sheetHandle, { backgroundColor: palette.cardBorder }]} />
        </View>
        <View style={styles.headerTitleRow}>
          <View style={styles.headerTextCol}>
            <Text style={[styles.headerEyebrow, { color: palette.muted }]}>Registration</Text>
            <Text style={[styles.sheetHeaderTitle, { color: palette.text }]}>
              {t('Agent Registration', { defaultValue: 'Agent' })}
            </Text>
            <Text style={[styles.headerSub, { color: palette.muted }]} numberOfLines={1}>
              Create your vendor account
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleClose}
            style={[styles.sheetCloseBtn, { backgroundColor: palette.inputBg }]}
            disabled={isSubmitting}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Close registration"
            accessibilityRole="button"
          >
            <Icon name="close" size={22} color={palette.text} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.keyboardView}>
        <RegistrationKeyboardAccessory />
        <RegistrationAndroidKeyboardBar />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { backgroundColor: palette.canvas }]}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
        >
          <View style={styles.form}>
                  {/* Company Name */}
                  <View style={styles.inputContainer}>
                    <Text style={[styles.label, { color: palette.text }]}>{t('companyName')} *</Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: palette.inputBg,
                          borderColor: palette.cardBorder,
                          color: palette.text,
                        },
                      ]}
                      value={formData.companyName}
                      onChangeText={(value) => handleChange('companyName', value)}
                      editable={!isSubmitting}
                      placeholder={t('companyName')}
                      placeholderTextColor={palette.placeholder}
                    />
                  </View>

                  {/* Mobile Number */}
                  <View style={styles.inputContainer}>
                    <Text style={[styles.label, { color: palette.text }]}>{t('mobileNumber')} *</Text>
                    <View style={styles.inputWithIcon}>
                      <TextInput
                        style={[
                          styles.input,
                          styles.inputWithIconField,
                          {
                            backgroundColor: palette.inputBg,
                            borderColor: palette.cardBorder,
                            color: palette.text,
                          },
                          (!!validationErrors.phoneNo ||
                            validationResults.mobile.isAvailable === false) && {
                            borderColor: palette.error,
                          },
                        ]}
                        value={formData.phoneNo}
                        onChangeText={(value) => handleChange('phoneNo', value)}
                        editable={!isSubmitting}
                        keyboardType="phone-pad"
                        maxLength={10}
                        placeholder={t('mobileNumber')}
                        placeholderTextColor={palette.placeholder}
                      />
                      <View style={styles.iconContainer}>
                        {renderValidationIcon('mobile')}
                      </View>
                    </View>
                    {(validationErrors.phoneNo ||
                      validationResults.mobile.error ||
                      validationResults.mobile.isAvailable === false) && (
                      <Text style={[styles.errorText, { color: palette.error }]}>
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
                    <Text style={[styles.label, { color: palette.text }]}>{t('emailId')} *</Text>
                    <View style={styles.inputWithIcon}>
                      <TextInput
                        style={[
                          styles.input,
                          styles.inputWithIconField,
                          {
                            backgroundColor: palette.inputBg,
                            borderColor: palette.cardBorder,
                            color: palette.text,
                          },
                          (!!validationErrors.emailId ||
                            validationResults.email.isAvailable === false) && {
                            borderColor: palette.error,
                          },
                        ]}
                        value={formData.emailId}
                        onChangeText={(value) => handleChange('emailId', value)}
                        editable={!isSubmitting}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        placeholder={t('emailId')}
                        placeholderTextColor={palette.placeholder}
                      />
                      <View style={styles.iconContainer}>
                        {renderValidationIcon('email')}
                      </View>
                    </View>
                    {(validationErrors.emailId ||
                      validationResults.email.error ||
                      validationResults.email.isAvailable === false) && (
                      <Text style={[styles.errorText, { color: palette.error }]}>
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
                      <Text style={[styles.label, { color: palette.text, marginBottom: 0 }]}>{t('registrationId')} *</Text>
                      <TouchableOpacity 
                        onPress={handleInfoPress} 
                        style={styles.infoButton}
                        activeOpacity={0.7}
                      >
                        <Icon name="info-outline" size={20} color={palette.accent} />
                      </TouchableOpacity>
                    </View>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: palette.inputBg,
                          borderColor: palette.cardBorder,
                          color: palette.text,
                        },
                        !!validationErrors.registrationId && { borderColor: palette.error },
                      ]}
                      value={formData.registrationId}
                      onChangeText={(value) =>
                        handleChange('registrationId', value.toUpperCase())
                      }
                      editable={!isSubmitting}
                      maxLength={20}
                      placeholder={t('registrationId')}
                      placeholderTextColor={palette.placeholder}
                      autoCapitalize="characters"
                    />
                    {validationErrors.registrationId && (
                      <Text style={[styles.errorText, { color: palette.error }]}>
                        {validationErrors.registrationId}
                      </Text>
                    )}
                  </View>

                  {/* Password */}
                  <View style={styles.inputContainer}>
                    <Text style={[styles.label, { color: palette.text }]}>{t('password')} *</Text>
                    <View style={styles.inputWithIcon}>
                      <TextInput
                        style={[
                          styles.input,
                          styles.inputWithIconField,
                          {
                            backgroundColor: palette.inputBg,
                            borderColor: palette.cardBorder,
                            color: palette.text,
                          },
                          !!validationErrors.password && { borderColor: palette.error },
                        ]}
                        value={formData.password}
                        onChangeText={(value) => handleChange('password', value)}
                        editable={!isSubmitting}
                        secureTextEntry={!showPassword}
                        placeholder={t('password')}
                        placeholderTextColor={palette.placeholder}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.iconContainer}
                        disabled={isSubmitting}
                      >
                        <Icon
                          name={showPassword ? 'visibility-off' : 'visibility'}
                          size={20}
                          color={palette.muted}
                        />
                      </TouchableOpacity>
                    </View>
                    {validationErrors.password && (
                      <Text style={[styles.errorText, { color: palette.error }]}>
                        {validationErrors.password}
                      </Text>
                    )}
                  </View>

                  {/* Confirm Password */}
                  <View style={styles.inputContainer}>
                    <Text style={[styles.label, { color: palette.text }]}>{t('confirmPassword')} *</Text>
                    <View style={styles.inputWithIcon}>
                      <TextInput
                        style={[
                          styles.input,
                          styles.inputWithIconField,
                          {
                            backgroundColor: palette.inputBg,
                            borderColor: palette.cardBorder,
                            color: palette.text,
                          },
                          !!validationErrors.confirmPassword && { borderColor: palette.error },
                        ]}
                        value={formData.confirmPassword}
                        onChangeText={(value) =>
                          handleChange('confirmPassword', value)
                        }
                        editable={!isSubmitting}
                        secureTextEntry={!showConfirmPassword}
                        placeholder={t('confirmPassword')}
                        placeholderTextColor={palette.placeholder}
                      />
                      <TouchableOpacity
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={styles.iconContainer}
                        disabled={isSubmitting}
                      >
                        <Icon
                          name={showConfirmPassword ? 'visibility-off' : 'visibility'}
                          size={20}
                          color={palette.muted}
                        />
                      </TouchableOpacity>
                    </View>
                    {validationErrors.confirmPassword && (
                      <Text style={[styles.errorText, { color: palette.error }]}>
                        {validationErrors.confirmPassword}
                      </Text>
                    )}
                  </View>

                  {/* Address */}
                  <View style={styles.inputContainer}>
                    <Text style={[styles.label, { color: palette.text }]}>{t('companyAddress')} *</Text>
                    <TextInput
                      style={[
                        styles.input,
                        styles.textArea,
                        {
                          backgroundColor: palette.inputBg,
                          borderColor: palette.cardBorder,
                          color: palette.text,
                        },
                      ]}
                      value={formData.address}
                      onChangeText={(value) => handleChange('address', value)}
                      editable={!isSubmitting}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                      placeholder={t('companyAddress')}
                      placeholderTextColor={palette.placeholder}
                    />
                  </View>

                  {/* Submit Button */}
                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      { backgroundColor: palette.primaryBtn },
                      (!isFormValid() || isSubmitting) && {
                        backgroundColor: palette.disabledBtn,
                      },
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
                      accentColor={palette.accent}
                    />
                  )}
                </View>
        </ScrollView>

        <CustomSnackbar
          visible={snackbarVisible}
          message={message}
          type={snackbarSeverity}
          onDismiss={() => setSnackbarVisible(false)}
        />

        <Tooltip
          visible={showTooltip}
          text="Government-issued company registration ID"
          onClose={() => setShowTooltip(false)}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 6, 23, 0.72)',
  },
  sheetOverlayTap: {
    flex: 1,
  },
  sheet: {
    width: SCREEN_WIDTH,
    height: SHEET_MAX_HEIGHT,
    backgroundColor: HOME_M3.surface,
    borderTopLeftRadius: SHEET_RADIUS,
    borderTopRightRadius: SHEET_RADIUS,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 24,
  },
  sheetBody: {
    flex: 1,
  },
  sheetHeader: {
    borderBottomWidth: 1,
    flexShrink: 0,
  },
  headerAccent: {
    height: 4,
    width: '100%',
    backgroundColor: HOME_M3.primary,
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 999,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  headerTextCol: {
    flex: 1,
    minWidth: 0,
  },
  headerEyebrow: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  sheetHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    lineHeight: 26,
  },
  headerSub: {
    fontSize: 13,
    marginTop: 2,
  },
  sheetCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
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
    fontWeight: '600',
    marginBottom: 8,
  },
  infoButton: {
    marginLeft: 8,
    padding: 2,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  errorText: {
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
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
    minHeight: 48,
    justifyContent: 'center',
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
    backgroundColor: HOME_M3.secondaryFixed,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: HOME_M3.outlineVariant,
    marginTop: 16,
  },
  registrationIdContent: {
    flex: 1,
  },
  registrationIdLabel: {
    fontSize: 12,
    color: HOME_M3.onSurfaceVariant,
    marginBottom: 4,
    fontWeight: '600',
  },
  registrationIdValue: {
    fontSize: 18,
    fontWeight: '700',
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
    borderRadius: 10,
    elevation: 6,
    shadowColor: HOME_M3.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
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