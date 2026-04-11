/* eslint-disable */
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import {
  HelperText,
  ActivityIndicator,
} from "react-native-paper";
import Icon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
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
}) => {
  const { colors, fontSize, isDarkMode } = useTheme();
  const { t } = useTranslation();
  const MAX_NAME_LENGTH = 30;
  
  // State for DateTimePicker
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

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

  // Handle date change from picker
  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (selectedDate && event.type !== 'dismissed') {
      // Validate if selected date is at least 18 years ago
      const today = new Date();
      const minAllowedDate = new Date(
        today.getFullYear() - 18,
        today.getMonth(),
        today.getDate()
      );
      
      if (selectedDate > minAllowedDate) {
        // Show error if user is under 18
        Alert.alert(
          "Age Restriction",
          "You must be at least 18 years old to register. Please select a date on or before " + 
          moment(minAllowedDate).format('DD MMM YYYY'),
          [{ text: "OK" }]
        );
        return;
      }
      
      // Format the date
      const formattedDate = moment(selectedDate).format('YYYY-MM-DD');
      const eventObj = {
        target: { value: formattedDate, name: 'dob' }
      };
      onDobChange(eventObj);
    }
    
    if (Platform.OS === 'ios' && event.type === 'dismissed') {
      setShowDatePicker(false);
    }
  };

  // Handle date picker open
  const handleDatePress = () => {
    setShowDatePicker(true);
    if (formData.dob) {
      setTempDate(new Date(formData.dob));
    } else {
      // Set default to 18 years ago
      const defaultDate = getMaxDate();
      setTempDate(defaultDate);
    }
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
  });

  return (
    <ScrollView style={dynamicStyles.container} showsVerticalScrollIndicator={false}>
      <View style={dynamicStyles.spacing}>
        <View style={dynamicStyles.section}>
          <ProfileImageUpload onImageSelect={onImageSelect} />
        </View>
        
        {/* First Name */}
        <View style={dynamicStyles.inputContainer}>
          <Text style={dynamicStyles.label}>
            {t('registration.basicInformation.firstName')} <Text style={dynamicStyles.required}>*</Text>
          </Text>
          <TextInput
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
        
        {/* Middle Name */}
        <View style={dynamicStyles.inputContainer}>
          <Text style={dynamicStyles.label}>
            {t('registration.basicInformation.middleName')}
          </Text>
          <TextInput
            style={dynamicStyles.input}
            placeholder={t('registration.basicInformation.enterMiddleName')}
            placeholderTextColor={colors.placeholder}
            value={formData.middleName}
            onChangeText={(text) => handleTextChange('middleName', text)}
          />
        </View>
        
        {/* Last Name */}
        <View style={dynamicStyles.inputContainer}>
          <Text style={dynamicStyles.label}>
            {t('registration.basicInformation.lastName')} <Text style={dynamicStyles.required}>*</Text>
          </Text>
          <TextInput
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
        
        {/* Date of Birth - Modern DateTimePicker with Age Restriction */}
        <View style={dynamicStyles.inputContainer}>
          <Text style={dynamicStyles.label}>
            {t('registration.basicInformation.dateOfBirth')} <Text style={dynamicStyles.required}>*</Text>
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

        {/* DateTimePicker Modal */}
        {showDatePicker && (
          <DateTimePicker
            value={tempDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
            maximumDate={maxDate}
            minimumDate={minDate}
            locale="en-IN"
          />
        )}
        
        {/* Gender */}
        <View style={dynamicStyles.genderContainer}>
          <Text style={dynamicStyles.label}>
            {t('registration.basicInformation.gender')} <Text style={dynamicStyles.required}>*</Text>
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
        
        {/* Email */}
        <View style={dynamicStyles.inputContainer}>
          <Text style={dynamicStyles.label}>
            {t('registration.basicInformation.email')} <Text style={dynamicStyles.required}>*</Text>
          </Text>
          <View style={dynamicStyles.inputWrapper}>
            <TextInput
              style={[dynamicStyles.input, (errors.emailId || validationResults.email.isAvailable === false) && dynamicStyles.inputError]}
              placeholder={t('registration.basicInformation.enterEmail')}
              placeholderTextColor={colors.placeholder}
              value={formData.emailId}
              onChangeText={(text) => handleTextChange('emailId', text)}
              onFocus={() => onFieldFocus('emailId')}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={dynamicStyles.inputAdornment}>
              {validationResults.email.loading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : validationResults.email.isAvailable ? (
                <MaterialCommunityIcon name="check-circle" size={20} color={colors.success} />
              ) : validationResults.email.isAvailable === false ? (
                <TouchableOpacity onPress={onClearEmail}>
                  <Icon name="close" size={20} color={colors.error} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
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
        
        {/* Password */}
        <View style={dynamicStyles.inputContainer}>
          <Text style={dynamicStyles.label}>
            {t('registration.basicInformation.password')} <Text style={dynamicStyles.required}>*</Text>
          </Text>
          <View style={dynamicStyles.inputWrapper}>
            <TextInput
              style={[dynamicStyles.input, errors.password && dynamicStyles.inputError]}
              placeholder={t('registration.basicInformation.enterPassword')}
              placeholderTextColor={colors.placeholder}
              secureTextEntry={!showPassword}
              value={formData.password}
              onChangeText={(text) => handleTextChange('password', text)}
              onFocus={() => onFieldFocus('password')}
              autoCapitalize="none"
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
        
        {/* Confirm Password */}
        <View style={dynamicStyles.inputContainer}>
          <Text style={dynamicStyles.label}>
            {t('registration.basicInformation.confirmPassword')} <Text style={dynamicStyles.required}>*</Text>
          </Text>
          <View style={dynamicStyles.inputWrapper}>
            <TextInput
              style={[dynamicStyles.input, errors.confirmPassword && dynamicStyles.inputError]}
              placeholder={t('registration.basicInformation.confirmYourPassword')}
              placeholderTextColor={colors.placeholder}
              secureTextEntry={!showConfirmPassword}
              value={formData.confirmPassword}
              onChangeText={(text) => handleTextChange('confirmPassword', text)}
              onFocus={() => onFieldFocus('confirmPassword')}
              autoCapitalize="none"
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
        
        {/* Mobile Number */}
        <View style={dynamicStyles.inputContainer}>
          <Text style={dynamicStyles.label}>
            {t('registration.basicInformation.mobileNumber')} <Text style={dynamicStyles.required}>*</Text>
          </Text>
          <View style={dynamicStyles.inputWrapper}>
            <TextInput
              style={[dynamicStyles.input, (errors.mobileNo || validationResults.mobile.isAvailable === false) && dynamicStyles.inputError]}
              placeholder={t('registration.basicInformation.enterMobileNumber')}
              placeholderTextColor={colors.placeholder}
              value={formData.mobileNo}
              onChangeText={(text) => handleTextChange('mobileNo', text)}
              onFocus={() => onFieldFocus('mobileNo')}
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

        {/* Alternate Number */}
        <View style={dynamicStyles.inputContainer}>
          <Text style={dynamicStyles.label}>
            {t('registration.basicInformation.alternateNumber')}
          </Text>
          <View style={dynamicStyles.inputWrapper}>
            <TextInput
              style={[dynamicStyles.input, (errors.AlternateNumber || validationResults.alternate.isAvailable === false) && dynamicStyles.inputError]}
              placeholder={t('registration.basicInformation.enterAlternateNumber')}
              placeholderTextColor={colors.placeholder}
              value={formData.AlternateNumber}
              onChangeText={(text) => handleTextChange('AlternateNumber', text)}
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
    </ScrollView>
  );
};

export default BasicInformation;