/* eslint-disable */
import React from "react";
import {
  View,
  Text,
  ScrollView,
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
  onTogglePasswordVisibility,
  onToggleConfirmPasswordVisibility,
  onClearEmail,
  onClearMobile,
  onClearAlternate,
}) => {
  const { colors, fontSize, isDarkMode } = useTheme();
  const { t } = useTranslation();
  const MAX_NAME_LENGTH = 30;
  const [year, setYear] = React.useState('');
  const [month, setMonth] = React.useState('');
  const [day, setDay] = React.useState('');

  // Initialize date fields from formData if exists (format: YYYY-MM-DD)
  React.useEffect(() => {
    if (formData.dob) {
      const [yearVal, monthVal, dayVal] = formData.dob.split('-');
      setYear(yearVal || '');
      setMonth(monthVal || '');
      setDay(dayVal || '');
    }
  }, [formData.dob]);

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
    onFieldChange({ target: { name: fieldName, value: text } });
  };

  const handleYearChange = (text: string) => {
    // Allow only numbers
    const numericText = text.replace(/[^0-9]/g, '');
    if (numericText.length <= 4) {
      setYear(numericText);
      validateAndUpdateDate(numericText, month, day);
    }
  };

  const handleMonthChange = (text: string) => {
    // Allow only numbers
    const numericText = text.replace(/[^0-9]/g, '');
    if (numericText.length <= 2) {
      setMonth(numericText);
      validateAndUpdateDate(year, numericText, day);
    }
  };

  const handleDayChange = (text: string) => {
    // Allow only numbers
    const numericText = text.replace(/[^0-9]/g, '');
    if (numericText.length <= 2) {
      setDay(numericText);
      validateAndUpdateDate(year, month, numericText);
    }
  };

  const validateAndUpdateDate = (yearVal: string, monthVal: string, dayVal: string) => {
    // Only validate and update if all fields are filled
    if (yearVal.length === 4 && monthVal.length === 2 && dayVal.length === 2) {
      const yearNum = parseInt(yearVal, 10);
      const monthNum = parseInt(monthVal, 10);
      const dayNum = parseInt(dayVal, 10);
      const currentYear = new Date().getFullYear();
      const minYear = currentYear - 100;
      const maxYear = currentYear - 18;

      // Basic validation
      if (yearNum < minYear || yearNum > maxYear) {
        Alert.alert(
          t('errors.invalidYear'), 
          t('errors.yearBetween', { min: minYear, max: maxYear })
        );
        return;
      }

      if (monthNum < 1 || monthNum > 12) {
        Alert.alert(
          t('errors.invalidMonth'), 
          t('errors.monthBetween')
        );
        return;
      }

      if (dayNum < 1 || dayNum > 31) {
        Alert.alert(
          t('errors.invalidDay'), 
          t('errors.dayBetween')
        );
        return;
      }

      // Create date string in YYYY-MM-DD format
      const formattedDate = `${yearVal}-${monthVal}-${dayVal}`;
      
      // Check if date is valid
      const date = moment(formattedDate, 'YYYY-MM-DD');
      if (!date.isValid()) {
        Alert.alert(
          t('errors.invalidDate'), 
          t('errors.invalidDate')
        );
        return;
      }

      // Check age
      const today = moment();
      const birthDate = moment(formattedDate, 'YYYY-MM-DD');
      const age = today.diff(birthDate, 'years');

      if (age < 18) {
        Alert.alert(
          t('errors.ageRestriction'), 
          t('errors.mustBe18')
        );
        return;
      }

      // Update form data with YYYY-MM-DD format
      onDobChange({ target: { name: 'dob', value: formattedDate } });
    }
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
    // DOB Styles - YYYY MM DD Format
    dobRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 8,
    },
    dobField: {
      flex: 1,
    },
    dobFieldYear: {
      flex: 1.5, // Give more space for year
    },
    dobInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: fontSizes.input,
      backgroundColor: colors.card,
      textAlign: 'center',
      color: colors.text,
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
        
        {/* Date of Birth - YYYY MM DD Format */}
        <View style={dynamicStyles.inputContainer}>
          <Text style={dynamicStyles.label}>
            {t('registration.basicInformation.dateOfBirth')} <Text style={dynamicStyles.required}>*</Text>
          </Text>
          
          <View style={dynamicStyles.dobRow}>
            <View style={[dynamicStyles.dobField, dynamicStyles.dobFieldYear]}>
              <TextInput
                style={[dynamicStyles.dobInput, errors.dob && dynamicStyles.inputError]}
                placeholder={t('time.format.YYYY')}
                placeholderTextColor={colors.placeholder}
                value={year}
                onChangeText={handleYearChange}
                keyboardType="numeric"
                maxLength={4}
                textAlign="center"
              />
            </View>
            
            <View style={dynamicStyles.dobField}>
              <TextInput
                style={[dynamicStyles.dobInput, errors.dob && dynamicStyles.inputError]}
                placeholder={t('time.format.MM')}
                placeholderTextColor={colors.placeholder}
                value={month}
                onChangeText={handleMonthChange}
                keyboardType="numeric"
                maxLength={2}
                textAlign="center"
              />
            </View>
            
            <View style={dynamicStyles.dobField}>
              <TextInput
                style={[dynamicStyles.dobInput, errors.dob && dynamicStyles.inputError]}
                placeholder={t('time.format.DD')}
                placeholderTextColor={colors.placeholder}
                value={day}
                onChangeText={handleDayChange}
                keyboardType="numeric"
                maxLength={2}
                textAlign="center"
              />
            </View>
          </View>

          {formData.dob && (
            <HelperText type="info" visible={true} style={{ color: colors.info, fontSize: fontSizes.helper }}>
              {t('registration.basicInformation.age', { age: moment().diff(moment(formData.dob), 'years') })}
            </HelperText>
          )}
          
          {errors.dob && (
            <HelperText type="error" visible={!!errors.dob} style={{ color: colors.error, fontSize: fontSizes.helper }}>
              {errors.dob}
            </HelperText>
          )}
          
          {!errors.dob && !formData.dob && (
            <HelperText type="info" visible={true} style={{ color: colors.info, fontSize: fontSizes.helper }}>
              {t('registration.basicInformation.dobHelper')}
            </HelperText>
          )}
        </View>
        
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