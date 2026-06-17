/* eslint-disable */
import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import {
  HelperText,
  ActivityIndicator,
} from "react-native-paper";
import Icon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import DribbbleDateTimePicker from "../common/DribbbleDateTimePicker";
import { registrationKeyboardInputProps } from "../common/RegistrationKeyboardAccessory";
import moment from "moment";
import ProfileImageUpload from "./ProfileImageUpload";
import { useTheme } from "../../src/Settings/ThemeContext";
import { useTranslation } from 'react-i18next';

interface BasicInformationProps {
  formData: any;
  errors: any;
  validationResults: any;
  showPassword: boolean;
  showConfirmPassword: boolean;
  isDobValid: boolean;
  onImageSelect: (file: any) => void;
  onFieldChange: (e: any) => void;
  onFieldFocus: (fieldName: string) => void;
  onDobChange: (e: any) => void;
  onDatePress: () => void;
  onTogglePasswordVisibility: () => void;
  onToggleConfirmPasswordVisibility: () => void;
  onClearEmail: () => void;
  onClearMobile: () => void;
  onClearAlternate: () => void;
  lockAuth0Email?: boolean;
  useCustomPassword?: boolean;
  onCustomPasswordModeChange?: (useCustom: boolean) => void;
  onScrollInputIntoView?: (fieldRef: View | null) => void;
}

const BasicInformation: React.FC<BasicInformationProps> = ({
  formData,
  errors,
  validationResults,
  showPassword,
  showConfirmPassword,
  isDobValid,
  onImageSelect,
  onFieldChange,
  onFieldFocus,
  onDobChange,
  onDatePress,
  onTogglePasswordVisibility,
  onToggleConfirmPasswordVisibility,
  onClearEmail,
  onClearMobile,
  onClearAlternate,
  lockAuth0Email = false,
  useCustomPassword = true,
  onCustomPasswordModeChange,
  onScrollInputIntoView,
}) => {
  const { colors, fontSize, isDarkMode } = useTheme();
  const { t } = useTranslation();
  const MAX_NAME_LENGTH = 30;
  const showPasswordFields = !lockAuth0Email || useCustomPassword;

  const emailRef = useRef<View>(null);
  const passwordRef = useRef<View>(null);
  const confirmPasswordRef = useRef<View>(null);
  const mobileRef = useRef<View>(null);
  const alternateRef = useRef<View>(null);
  
  // State for date picker visibility
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleFieldFocus = (fieldName: string, fieldRef?: View | null) => {
    onFieldFocus(fieldName);
    if (fieldRef) {
      onScrollInputIntoView?.(fieldRef);
    }
  };

  // Helper function to remove ALL spaces from any string
  const removeAllSpaces = (text: string) => {
    return text.replace(/\s/g, '');
  };

  // Calculate minimum age date (18 years ago from today)
  const getMaxDate = () => {
    const today = new Date();
    const eighteenYearsAgo = new Date(
      today.getFullYear() - 18,
      today.getMonth(),
      today.getDate()
    );
    return eighteenYearsAgo;
  };

  // Get the maximum selectable date (18 years ago)
  const maxDate = getMaxDate();
  
  // Get minimum selectable date (100 years ago, reasonable limit)
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 100);

  const handleDobSelect = (selectedDate: Date) => {
    const minAllowedDate = getMaxDate();
    if (selectedDate > minAllowedDate) {
      Alert.alert(
        "Age Restriction",
        "You must be at least 18 years old to register. Please select a date on or before " +
          moment(minAllowedDate).format("DD MMM YYYY"),
        [{ text: "OK" }]
      );
      return;
    }
    const formattedDate = moment(selectedDate).format("YYYY-MM-DD");
    onDobChange({ target: { value: formattedDate, name: "dob" } });
  };

  const handleDobClear = () => {
    onDobChange({ target: { value: "", name: "dob" } });
  };

  // Handle date picker open
  const handleDatePress = () => {
    setShowDatePicker((prev) => !prev);
    onDatePress();
  };

  // Format date for display (DD MMM YYYY format - e.g., "15 Jan 1990")
  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return '';
    return moment(dateString).format('DD MMM YYYY');
  };

  // Calculate age from date of birth
  const calculateAge = (dob: string) => {
    if (!dob) return null;
    return moment().diff(moment(dob), 'years');
  };

  const age = calculateAge(formData.dob);

  // Get font sizes based on theme
  const getFontSizes = () => {
    switch (fontSize) {
      case 'small':
        return {
          label: 12,
          input: 14,
          helper: 11,
          radio: 14,
          placeholder: 13,
        };
      case 'large':
        return {
          label: 16,
          input: 18,
          helper: 14,
          radio: 18,
          placeholder: 17,
        };
      default:
        return {
          label: 14,
          input: 16,
          helper: 12,
          radio: 16,
          placeholder: 15,
        };
    }
  };

  const fontSizes = getFontSizes();

  const handleTextChange = (fieldName: string, text: string) => {
    // Remove ALL spaces from the input automatically
    let processedText = removeAllSpaces(text);
    
    // Additional field-specific processing
    switch (fieldName) {
      case 'firstName':
      case 'middleName':
      case 'lastName':
        // For names, also capitalize first letter of each word (optional)
        processedText = processedText.replace(/\b\w/g, char => char.toUpperCase());
        break;
        
      case 'emailId':
        // Convert to lowercase for email
        processedText = processedText.toLowerCase();
        break;
        
      case 'mobileNo':
      case 'AlternateNumber':
        // For phone numbers, only allow digits
        processedText = processedText.replace(/[^0-9]/g, '');
        break;
        
      case 'password':
      case 'confirmPassword':
        // For passwords, just remove spaces (no other processing)
        break;
        
      default:
        break;
    }
    
    onFieldChange({ target: { name: fieldName, value: processedText } });
  };

  const handleGenderChange = (gender: string) => {
    handleTextChange('gender', gender);
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    spacing: {
      padding: 16,
      gap: 16,
    },
    section: {
      marginBottom: 8,
    },
    inputContainer: {
      width: '100%',
      marginBottom: 12,
    },
    label: {
      fontSize: fontSizes.label,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 6,
    },
    required: {
      color: colors.error,
    },
    inputWrapper: {
      position: 'relative',
      width: '100%',
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: fontSizes.input,
      backgroundColor: colors.card,
      width: '100%',
      color: colors.text,
    },
    inputError: {
      borderColor: colors.error,
    },
    inputDisabled: {
      backgroundColor: colors.surface,
      opacity: 0.85,
    },
    inputAdornment: {
      position: 'absolute',
      right: 12,
      top: 12,
      zIndex: 1,
    },
    // Modern Date Picker Styles
    datePickerButton: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 14,
      backgroundColor: colors.card,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    datePickerButtonError: {
      borderColor: colors.error,
      borderWidth: 1.5,
    },
    datePickerButtonActive: {
      borderColor: colors.primary,
      borderWidth: 1.5,
      backgroundColor: colors.primary + '08',
    },
    datePickerText: {
      fontSize: fontSizes.input,
      color: colors.text,
      fontWeight: '500',
    },
    datePickerPlaceholder: {
      fontSize: fontSizes.input,
      color: colors.placeholder,
    },
    calendarIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primary + '15',
      justifyContent: 'center',
      alignItems: 'center',
    },
    genderContainer: {
      marginBottom: 12,
    },
    radioGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 20,
      marginTop: 4,
    },
    radioOption: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    radioOuter: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: colors.textSecondary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 8,
    },
    radioSelected: {
      borderColor: colors.primary,
    },
    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.primary,
    },
    radioText: {
      fontSize: fontSizes.radio,
      color: colors.text,
    },
    helperText: {
      fontSize: fontSizes.helper,
      color: colors.textSecondary,
      marginTop: 4,
    },
    helperError: {
      color: colors.error,
    },
    helperSuccess: {
      color: colors.success,
    },
    helperInfo: {
      color: colors.info,
    },
    ageChip: {
      marginTop: 8,
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: colors.primary + '10',
      borderRadius: 20,
      alignSelf: 'flex-start',
    },
    ageText: {
      fontSize: fontSizes.helper,
      color: colors.primary,
      fontWeight: '500',
    },
    restrictionNote: {
      marginTop: 8,
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: colors.warning + '10',
      borderRadius: 8,
      borderLeftWidth: 3,
      borderLeftColor: colors.warning,
    },
    restrictionText: {
      fontSize: fontSizes.helper,
      color: colors.warning,
      fontWeight: '500',
    },
    pickerShell: {
      marginTop: 10,
      marginBottom: 4,
    },
    passwordModeRow: {
      flexDirection: 'row',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: 4,
      gap: 6,
      marginBottom: 12,
    },
    passwordModeButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderRadius: 8,
    },
    passwordModeButtonActive: {
      backgroundColor: colors.primary,
    },
    passwordModeText: {
      fontSize: fontSizes.small,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
    },
    passwordModeTextActive: {
      color: '#fff',
    },
    authInfoCard: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      borderRadius: 10,
      padding: 12,
      marginBottom: 12,
    },
  });

  return (
    <View style={dynamicStyles.container}>
      <View style={dynamicStyles.spacing}>
        <View style={dynamicStyles.section}>
          <ProfileImageUpload onImageSelect={onImageSelect} />
        </View>
        
        {/* First Name - NO ASTERISK */}
        <View style={dynamicStyles.inputContainer}>
          <Text style={dynamicStyles.label}>
            {t('registration.basicInformation.firstName')}
          </Text>
          <TextInput
            {...registrationKeyboardInputProps}
            style={[dynamicStyles.input, errors.firstName && dynamicStyles.inputError]}
            placeholder={t('registration.basicInformation.enterFirstName')}
            placeholderTextColor={colors.placeholder}
            value={formData.firstName}
            onChangeText={(text) => handleTextChange('firstName', text)}
            onFocus={() => onFieldFocus('firstName')}
            maxLength={MAX_NAME_LENGTH}
          />
          {errors.firstName && (
            <HelperText type="error" visible={!!errors.firstName} style={{ color: colors.error, fontSize: fontSizes.helper }}>
              {errors.firstName}
            </HelperText>
          )}
        </View>
        
        {/* Middle Name - NO ASTERISK */}
        <View style={dynamicStyles.inputContainer}>
          <Text style={dynamicStyles.label}>
            {t('registration.basicInformation.middleName')}
          </Text>
          <TextInput
            {...registrationKeyboardInputProps}
            style={dynamicStyles.input}
            placeholder={t('registration.basicInformation.enterMiddleName')}
            placeholderTextColor={colors.placeholder}
            value={formData.middleName}
            onChangeText={(text) => handleTextChange('middleName', text)}
          />
        </View>
        
        {/* Last Name - NO ASTERISK */}
        <View style={dynamicStyles.inputContainer}>
          <Text style={dynamicStyles.label}>
            {t('registration.basicInformation.lastName')}
          </Text>
          <TextInput
            {...registrationKeyboardInputProps}
            style={[dynamicStyles.input, errors.lastName && dynamicStyles.inputError]}
            placeholder={t('registration.basicInformation.enterLastName')}
            placeholderTextColor={colors.placeholder}
            value={formData.lastName}
            onChangeText={(text) => handleTextChange('lastName', text)}
            onFocus={() => onFieldFocus('lastName')}
            maxLength={MAX_NAME_LENGTH}
          />
          {errors.lastName && (
            <HelperText type="error" visible={!!errors.lastName} style={{ color: colors.error, fontSize: fontSizes.helper }}>
              {errors.lastName}
            </HelperText>
          )}
        </View>
        
        {/* Date of Birth - NO ASTERISK */}
        <View style={dynamicStyles.inputContainer}>
          <Text style={dynamicStyles.label}>
            {t('registration.basicInformation.dateOfBirth')}
          </Text>
          
          <TouchableOpacity 
            onPress={handleDatePress}
            style={[
              dynamicStyles.datePickerButton,
              errors.dob && dynamicStyles.datePickerButtonError,
              formData.dob && dynamicStyles.datePickerButtonActive
            ]}
            activeOpacity={0.7}
          >
            <Text style={formData.dob ? dynamicStyles.datePickerText : dynamicStyles.datePickerPlaceholder}>
              {formData.dob ? formatDateForDisplay(formData.dob) : "Select your date of birth"}
            </Text>
            <View style={dynamicStyles.calendarIconContainer}>
              <Icon name="calendar-today" size={20} color={colors.primary} />
            </View>
          </TouchableOpacity>

          {/* Age Display Chip */}
          {formData.dob && age !== null && (
            <View style={dynamicStyles.ageChip}>
              <Text style={dynamicStyles.ageText}>
                {age} years old {age >= 18 ? "✓" : "⚠️"}
              </Text>
            </View>
          )}

          {/* Age Restriction Note */}
          <View style={dynamicStyles.restrictionNote}>
            <Text style={dynamicStyles.restrictionText}>
              ⚠️ You must be at least 18 years old to register (born on or before {moment(maxDate).format('DD MMM YYYY')})
            </Text>
          </View>
          
          {errors.dob && (
            <HelperText type="error" visible={!!errors.dob} style={{ color: colors.error, fontSize: fontSizes.helper }}>
              {errors.dob}
            </HelperText>
          )}
        </View>

        {/* Dribbble calendar date picker */}
        {showDatePicker && (
          <View style={dynamicStyles.pickerShell}>
            <DribbbleDateTimePicker
              mode="single"
              birthdateMode
              birthdateQuickNav
              hideTimeSelection
              compact
              pickerTitle={t("registration.basicInformation.dateOfBirth")}
              value={formData.dob ? new Date(formData.dob) : undefined}
              minDate={minDate}
              maxDate={maxDate}
              onChange={handleDobSelect}
              onClear={handleDobClear}
            />
          </View>
        )}
        
        {/* Gender - NO ASTERISK */}
        <View style={dynamicStyles.genderContainer}>
          <Text style={dynamicStyles.label}>
            {t('registration.basicInformation.gender')}
          </Text>
          <View style={dynamicStyles.radioGroup}>
            <TouchableOpacity
              style={dynamicStyles.radioOption}
              onPress={() => handleGenderChange('MALE')}
            >
              <View style={[
                dynamicStyles.radioOuter,
                formData.gender === 'MALE' && dynamicStyles.radioSelected
              ]}>
                {formData.gender === 'MALE' && <View style={dynamicStyles.radioInner} />}
              </View>
              <Text style={dynamicStyles.radioText}>{t('common.gender.male')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={dynamicStyles.radioOption}
              onPress={() => handleGenderChange('FEMALE')}
            >
              <View style={[
                dynamicStyles.radioOuter,
                formData.gender === 'FEMALE' && dynamicStyles.radioSelected
              ]}>
                {formData.gender === 'FEMALE' && <View style={dynamicStyles.radioInner} />}
              </View>
              <Text style={dynamicStyles.radioText}>{t('common.gender.female')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={dynamicStyles.radioOption}
              onPress={() => handleGenderChange('OTHER')}
            >
              <View style={[
                dynamicStyles.radioOuter,
                formData.gender === 'OTHER' && dynamicStyles.radioSelected
              ]}>
                {formData.gender === 'OTHER' && <View style={dynamicStyles.radioInner} />}
              </View>
              <Text style={dynamicStyles.radioText}>{t('common.gender.other')}</Text>
            </TouchableOpacity>
          </View>
          {errors.gender && (
            <HelperText type="error" visible={!!errors.gender} style={{ color: colors.error, fontSize: fontSizes.helper }}>
              {errors.gender}
            </HelperText>
          )}
        </View>
        
        {/* Email - NO ASTERISK */}
        <View ref={emailRef} style={dynamicStyles.inputContainer}>
          <Text style={dynamicStyles.label}>
            {t('registration.basicInformation.email')}
          </Text>
          <View style={dynamicStyles.inputWrapper}>
            <TextInput
              {...registrationKeyboardInputProps}
              style={[
                dynamicStyles.input,
                lockAuth0Email && dynamicStyles.inputDisabled,
                (errors.emailId || validationResults.email.isAvailable === false) && dynamicStyles.inputError,
              ]}
              placeholder={t('registration.basicInformation.enterEmail')}
              placeholderTextColor={colors.placeholder}
              value={formData.emailId}
              onChangeText={(text) => handleTextChange('emailId', text)}
              onFocus={() => handleFieldFocus('emailId', emailRef.current)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!lockAuth0Email}
            />
            <View style={dynamicStyles.inputAdornment}>
              {validationResults.email.loading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : validationResults.email.isAvailable ? (
                <MaterialCommunityIcon name="check-circle" size={20} color={colors.success} />
              ) : validationResults.email.isAvailable === false && !lockAuth0Email ? (
                <TouchableOpacity onPress={onClearEmail}>
                  <Icon name="close" size={20} color={colors.error} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
          {lockAuth0Email ? (
            <HelperText type="info" visible style={{ color: colors.info, fontSize: fontSizes.helper }}>
              {t('registration.basicInformation.auth0EmailLocked', {
                defaultValue: 'Uses your login email so sign-in finds your profile.',
              })}
            </HelperText>
          ) : null}
          {(errors.emailId || validationResults.email.isAvailable === false || validationResults.email.loading) && (
            <HelperText 
              type={errors.emailId || validationResults.email.isAvailable === false ? "error" : "info"} 
              visible={true}
              style={{ 
                color: errors.emailId || validationResults.email.isAvailable === false ? colors.error : colors.info,
                fontSize: fontSizes.helper 
              }}
            >
              {errors.emailId ||
                (validationResults.email.loading ? t('registration.basicInformation.checkingAvailability') :
                  validationResults.email.error ||
                  (validationResults.email.isAvailable ? t('registration.basicInformation.emailAvailable') : t('registration.basicInformation.emailTaken')))}
            </HelperText>
          )}
        </View>

        {lockAuth0Email ? (
          <View style={dynamicStyles.authInfoCard}>
            <Text style={[dynamicStyles.label, { marginBottom: 8 }]}>
              {t('registration.basicInformation.passwordOptionTitle', {
                defaultValue: 'How do you want to sign in?',
              })}
            </Text>
            <View style={dynamicStyles.passwordModeRow}>
              <TouchableOpacity
                style={[
                  dynamicStyles.passwordModeButton,
                  !useCustomPassword && dynamicStyles.passwordModeButtonActive,
                ]}
                onPress={() => onCustomPasswordModeChange?.(false)}
              >
                <Text
                  style={[
                    dynamicStyles.passwordModeText,
                    !useCustomPassword && dynamicStyles.passwordModeTextActive,
                  ]}
                >
                  {t('registration.basicInformation.useMyLogin', {
                    defaultValue: 'Use my login',
                  })}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  dynamicStyles.passwordModeButton,
                  useCustomPassword && dynamicStyles.passwordModeButtonActive,
                ]}
                onPress={() => onCustomPasswordModeChange?.(true)}
              >
                <Text
                  style={[
                    dynamicStyles.passwordModeText,
                    useCustomPassword && dynamicStyles.passwordModeTextActive,
                  ]}
                >
                  {t('registration.basicInformation.createOwnPassword', {
                    defaultValue: 'Create my own password',
                  })}
                </Text>
              </TouchableOpacity>
            </View>
            <HelperText type="info" visible style={{ color: colors.info, fontSize: fontSizes.helper }}>
              {useCustomPassword
                ? t('registration.basicInformation.customPasswordHint', {
                    defaultValue: 'Set a new password for your provider account.',
                  })
                : t('registration.basicInformation.useLoginHint', {
                    defaultValue: 'Continue with your existing sign-in. No new password needed.',
                  })}
            </HelperText>
          </View>
        ) : null}
        
        {/* Password - NO ASTERISK */}
        {showPasswordFields ? (
        <View ref={passwordRef} style={dynamicStyles.inputContainer}>
          <Text style={dynamicStyles.label}>
            {t('registration.basicInformation.password')}
          </Text>
          <View style={dynamicStyles.inputWrapper}>
            <TextInput
              {...registrationKeyboardInputProps}
              style={[dynamicStyles.input, errors.password && dynamicStyles.inputError]}
              placeholder={t('registration.basicInformation.enterPassword')}
              placeholderTextColor={colors.placeholder}
              secureTextEntry={!showPassword}
              value={formData.password}
              onChangeText={(text) => handleTextChange('password', text)}
              onFocus={() => handleFieldFocus('password', passwordRef.current)}
              autoCapitalize="none"
              textContentType="newPassword"
              autoComplete="password-new"
            />
            <TouchableOpacity 
              style={dynamicStyles.inputAdornment}
              onPress={onTogglePasswordVisibility}
            >
              <Icon 
                name={showPassword ? "visibility" : "visibility-off"} 
                size={20} 
                color={colors.textSecondary} 
              />
            </TouchableOpacity>
          </View>
          {errors.password && (
            <HelperText type="error" visible={!!errors.password} style={{ color: colors.error, fontSize: fontSizes.helper }}>
              {errors.password}
            </HelperText>
          )}
        </View>
        ) : null}
        
        {/* Confirm Password - NO ASTERISK */}
        {showPasswordFields ? (
        <View ref={confirmPasswordRef} style={dynamicStyles.inputContainer}>
          <Text style={dynamicStyles.label}>
            {t('registration.basicInformation.confirmPassword')}
          </Text>
          <View style={dynamicStyles.inputWrapper}>
            <TextInput
              {...registrationKeyboardInputProps}
              style={[dynamicStyles.input, errors.confirmPassword && dynamicStyles.inputError]}
              placeholder={t('registration.basicInformation.confirmYourPassword')}
              placeholderTextColor={colors.placeholder}
              secureTextEntry={!showConfirmPassword}
              value={formData.confirmPassword}
              onChangeText={(text) => handleTextChange('confirmPassword', text)}
              onFocus={() => handleFieldFocus('confirmPassword', confirmPasswordRef.current)}
              autoCapitalize="none"
              textContentType="newPassword"
              autoComplete="password-new"
            />
            <TouchableOpacity 
              style={dynamicStyles.inputAdornment}
              onPress={onToggleConfirmPasswordVisibility}
            >
              <Icon 
                name={showConfirmPassword ? "visibility" : "visibility-off"} 
                size={20} 
                color={colors.textSecondary} 
              />
            </TouchableOpacity>
          </View>
          {errors.confirmPassword && (
            <HelperText type="error" visible={!!errors.confirmPassword} style={{ color: colors.error, fontSize: fontSizes.helper }}>
              {errors.confirmPassword}
            </HelperText>
          )}
        </View>
        ) : null}
        
        {/* Mobile Number - NO ASTERISK */}
        <View ref={mobileRef} style={dynamicStyles.inputContainer}>
          <Text style={dynamicStyles.label}>
            {t('registration.basicInformation.mobileNumber')}
          </Text>
          <View style={dynamicStyles.inputWrapper}>
            <TextInput
              {...registrationKeyboardInputProps}
              style={[dynamicStyles.input, (errors.mobileNo || validationResults.mobile.isAvailable === false) && dynamicStyles.inputError]}
              placeholder={t('registration.basicInformation.enterMobileNumber')}
              placeholderTextColor={colors.placeholder}
              value={formData.mobileNo}
              onChangeText={(text) => handleTextChange('mobileNo', text)}
              onFocus={() => handleFieldFocus('mobileNo', mobileRef.current)}
              keyboardType="phone-pad"
              maxLength={10}
            />
            <View style={dynamicStyles.inputAdornment}>
              {validationResults.mobile.loading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : validationResults.mobile.isAvailable ? (
                <MaterialCommunityIcon name="check-circle" size={20} color={colors.success} />
              ) : validationResults.mobile.isAvailable === false ? (
                <TouchableOpacity onPress={onClearMobile}>
                  <Icon name="close" size={20} color={colors.error} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
          {(errors.mobileNo || validationResults.mobile.isAvailable === false || validationResults.mobile.loading) && (
            <HelperText 
              type={errors.mobileNo || validationResults.mobile.isAvailable === false ? "error" : "info"} 
              visible={true}
              style={{ 
                color: errors.mobileNo || validationResults.mobile.isAvailable === false ? colors.error : colors.info,
                fontSize: fontSizes.helper 
              }}
            >
              {errors.mobileNo ||
                (validationResults.mobile.loading ? t('registration.basicInformation.checkingAvailability') :
                  validationResults.mobile.error ||
                  (validationResults.mobile.isAvailable ? t('registration.basicInformation.mobileAvailable') : t('registration.basicInformation.mobileTaken')))}
            </HelperText>
          )}
        </View>

        {/* Alternate Number - NO ASTERISK */}
        <View ref={alternateRef} style={dynamicStyles.inputContainer}>
          <Text style={dynamicStyles.label}>
            {t('registration.basicInformation.alternateNumber')}
          </Text>
          <View style={dynamicStyles.inputWrapper}>
            <TextInput
              {...registrationKeyboardInputProps}
              style={[dynamicStyles.input, (errors.AlternateNumber || validationResults.alternate.isAvailable === false) && dynamicStyles.inputError]}
              placeholder={t('registration.basicInformation.enterAlternateNumber')}
              placeholderTextColor={colors.placeholder}
              value={formData.AlternateNumber}
              onChangeText={(text) => handleTextChange('AlternateNumber', text)}
              onFocus={() => handleFieldFocus('AlternateNumber', alternateRef.current)}
              keyboardType="phone-pad"
              maxLength={10}
            />
            <View style={dynamicStyles.inputAdornment}>
              {validationResults.alternate.loading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : validationResults.alternate.isAvailable ? (
                <MaterialCommunityIcon name="check-circle" size={20} color={colors.success} />
              ) : validationResults.alternate.isAvailable === false ? (
                <TouchableOpacity onPress={onClearAlternate}>
                  <Icon name="close" size={20} color={colors.error} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
          {(errors.AlternateNumber || validationResults.alternate.isAvailable === false || validationResults.alternate.loading) && (
            <HelperText 
              type={errors.AlternateNumber || validationResults.alternate.isAvailable === false ? "error" : "info"} 
              visible={true}
              style={{ 
                color: errors.AlternateNumber || validationResults.alternate.isAvailable === false ? colors.error : colors.info,
                fontSize: fontSizes.helper 
              }}
            >
              {errors.AlternateNumber ||
                (validationResults.alternate.loading ? t('registration.basicInformation.checkingAvailability') :
                  validationResults.alternate.error ||
                  (validationResults.alternate.isAvailable ? t('registration.basicInformation.alternateAvailable') : t('registration.basicInformation.alternateTaken')))}
            </HelperText>
          )}
        </View>
      </View>
    </View>
  );
};

export default BasicInformation;