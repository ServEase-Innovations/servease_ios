// components/Registration/KYCVerification.tsx
import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from "react-native";
import {
  HelperText,
  Divider,
} from "react-native-paper";
import CustomFileInput from "./CustomFileInput";
import { useTheme } from "../../src/Settings/ThemeContext";
import { useTranslation } from 'react-i18next';

interface KYCVerificationProps {
  formData: any;
  errors: any;
  onFieldChange: (e: any) => void;
  onFieldFocus: (fieldName: string) => void;
  onDocumentUpload: (file: any) => void;
  onKycTypeChange: (kycType: string) => void;
}

const KYCVerification: React.FC<KYCVerificationProps> = ({
  formData,
  errors,
  onFieldChange,
  onFieldFocus,
  onDocumentUpload,
  onKycTypeChange,
}) => {
  const { colors, fontSize, isDarkMode } = useTheme();
  const { t } = useTranslation();

  const kycOptions = [
    { 
      value: "AADHAR", 
      label: t('registration.kyc.documentType.aadhar'), 
      description: t('registration.kyc.documentDescription.aadhar'), 
      placeholder: t('registration.kyc.documentNumber.aadhar'), 
      pattern: "[0-9]{12}", 
      maxLength: 12, 
    },
    { 
      value: "PAN", 
      label: t('registration.kyc.documentType.pan'), 
      description: t('registration.kyc.documentDescription.pan'), 
      placeholder: t('registration.kyc.documentNumber.pan'), 
      pattern: "[A-Z]{5}[0-9]{4}[A-Z]{1}", 
      maxLength: 10, 
    },
    { 
      value: "DRIVING_LICENSE", 
      label: t('registration.kyc.documentType.drivingLicense'), 
      description: t('registration.kyc.documentDescription.drivingLicense'), 
      placeholder: t('registration.kyc.documentNumber.drivingLicense'), 
      pattern: "^[A-Z]{2}[0-9]{2}[0-9]{4,11}*$", 
      maxLength: 16, 
    },
    { 
      value: "VOTER_ID", 
      label: t('registration.kyc.documentType.voterId'), 
      description: t('registration.kyc.documentDescription.voterId'), 
      placeholder: t('registration.kyc.documentNumber.voterId'), 
      pattern: "[A-Z]{3}[0-9]{7}", 
      maxLength: 10, 
    },
    { 
      value: "PASSPORT", 
      label: t('registration.kyc.documentType.passport'), 
      description: t('registration.kyc.documentDescription.passport'), 
      placeholder: t('registration.kyc.documentNumber.passport'), 
      pattern: "[A-Z]{1}[0-9]{7}", 
      maxLength: 8, 
    },
  ];

  // Get font sizes based on theme
  const getFontSizes = () => {
    switch (fontSize) {
      case 'small':
        return {
          stepText: 22,
          sectionTitle: 15,
          optionLabel: 13,
          optionDescription: 11,
          selectedDocTitle: 16,
          selectedDocDescription: 13,
          input: 14,
          helper: 11,
          uploadLabel: 13,
          noteText: 12,
          buttonText: 14,
          errorText: 11,
        };
      case 'large':
        return {
          stepText: 28,
          sectionTitle: 18,
          optionLabel: 16,
          optionDescription: 14,
          selectedDocTitle: 20,
          selectedDocDescription: 16,
          input: 18,
          helper: 14,
          uploadLabel: 16,
          noteText: 15,
          buttonText: 16,
          errorText: 14,
        };
      default:
        return {
          stepText: 24,
          sectionTitle: 16,
          optionLabel: 14,
          optionDescription: 12,
          selectedDocTitle: 18,
          selectedDocDescription: 14,
          input: 16,
          helper: 12,
          uploadLabel: 14,
          noteText: 13,
          buttonText: 15,
          errorText: 12,
        };
    }
  };

  const fontSizes = getFontSizes();

  const getCurrentKycOption = () => {
    return kycOptions.find(option => option.value === formData.kycType) || kycOptions[0];
  };

  const currentOption = getCurrentKycOption();

  const handleKycTypePress = (value: string) => {
    onKycTypeChange(value);
  };

  const handleTextChange = (text: string) => {
    onFieldChange({ target: { name: 'kycNumber', value: text } });
  };

  const handleFileChange = (file: any) => {
    onDocumentUpload(file);
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 20,
    },
    stepIndicator: {
      marginBottom: 24,
    },
    stepText: {
      fontSize: fontSizes.stepText,
      fontWeight: 'bold',
      color: colors.primary,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: fontSizes.sectionTitle,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    asterisk: {
      color: colors.error,
    },
    optionsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -4,
    },
    optionCard: {
      width: '50%',
      paddingHorizontal: 4,
      marginBottom: 8,
    },
    optionContent: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      backgroundColor: colors.card,
      minHeight: 70,
    },
    selectedOptionCard: {
      borderColor: colors.primary,
      backgroundColor: isDarkMode ? colors.primary + '20' : '#E3F2FD',
      borderWidth: 2,
    },
    optionLabel: {
      fontSize: fontSizes.optionLabel,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    optionDescription: {
      fontSize: fontSizes.optionDescription,
      color: colors.textSecondary,
      lineHeight: 16,
    },
    selectedOptionLabel: {
      color: colors.primary,
    },
    selectedOptionDescription: {
      color: colors.primary,
    },
    errorText: {
      fontSize: fontSizes.errorText,
      color: colors.error,
      marginTop: 4,
      marginLeft: 0,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 20,
    },
    selectedDocHeader: {
      marginBottom: 16,
    },
    selectedDocTitle: {
      fontSize: fontSizes.selectedDocTitle,
      fontWeight: '600',
      color: colors.primary,
      marginBottom: 2,
    },
    selectedDocDescription: {
      fontSize: fontSizes.selectedDocDescription,
      color: colors.textSecondary,
    },
    inputWrapper: {
      marginBottom: 20,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 14,
      fontSize: fontSizes.input,
      backgroundColor: colors.card,
      color: colors.text,
    },
    inputError: {
      borderColor: colors.error,
    },
    helperInfo: {
      fontSize: fontSizes.helper,
      color: colors.textSecondary,
      marginTop: 6,
      marginLeft: 4,
    },
    uploadSection: {
      marginBottom: 16,
    },
    uploadLabel: {
      fontSize: fontSizes.uploadLabel,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 8,
    },
    noteContainer: {
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    noteText: {
      fontSize: fontSizes.noteText,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    noteBold: {
      fontWeight: '600',
      color: colors.primary,
    },
    navigationContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 24,
      marginBottom: 16,
    },
    backButton: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    backButtonText: {
      color: colors.primary,
      fontSize: fontSizes.buttonText,
      fontWeight: '500',
    },
    nextButton: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      backgroundColor: colors.primary,
    },
    nextButtonText: {
      color: '#fff',
      fontSize: fontSizes.buttonText,
      fontWeight: '500',
    },
  });

  return (
    <ScrollView style={dynamicStyles.container} showsVerticalScrollIndicator={false}>
      <View style={dynamicStyles.content}>

        {/* KYC Type Selection */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>
            {t('registration.kyc.selectDocument')} <Text style={dynamicStyles.asterisk}>*</Text>
          </Text>
          
          <View style={dynamicStyles.optionsContainer}>
            {kycOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  dynamicStyles.optionCard,
                  formData.kycType === option.value && dynamicStyles.selectedOptionCard,
                ]}
                onPress={() => handleKycTypePress(option.value)}
              >
                <View style={dynamicStyles.optionContent}>
                  <Text
                    style={[
                      dynamicStyles.optionLabel,
                      formData.kycType === option.value && dynamicStyles.selectedOptionLabel,
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Text
                    style={[
                      dynamicStyles.optionDescription,
                      formData.kycType === option.value && dynamicStyles.selectedOptionDescription,
                    ]}
                  >
                    {option.description}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          
          {errors.kycType && (
            <HelperText type="error" visible={!!errors.kycType} style={{ color: colors.error, fontSize: fontSizes.errorText }}>
              {errors.kycType}
            </HelperText>
          )}
        </View>

        <Divider style={dynamicStyles.divider} />

        {/* Selected KYC Document Section */}
        <View style={dynamicStyles.section}>
          <View style={dynamicStyles.selectedDocHeader}>
            <Text style={dynamicStyles.selectedDocTitle}>
              {currentOption.label}
            </Text>
            <Text style={dynamicStyles.selectedDocDescription}>
              {currentOption.description}
            </Text>
          </View>

          {/* Document Number Input */}
          <View style={dynamicStyles.inputWrapper}>
            <TextInput
              style={[
                dynamicStyles.input,
                errors.kycNumber && dynamicStyles.inputError
              ]}
              placeholder={currentOption.placeholder}
              placeholderTextColor={colors.placeholder}
              value={formData.kycNumber || ""}
              onChangeText={handleTextChange}
              onFocus={() => onFieldFocus("kycNumber")}
              maxLength={currentOption.maxLength}
              keyboardType={currentOption.value === "AADHAR" ? "numeric" : "default"}
            />
            
            {/* Helper text based on KYC type */}
            {currentOption.value === "AADHAR" && !errors.kycNumber && (
              <HelperText type="info" visible={true} style={{ color: colors.info, fontSize: fontSizes.helper }}>
                {t('registration.kyc.documentNumber.aadhar')}
              </HelperText>
            )}
            
            {errors.kycNumber && (
              <HelperText type="error" visible={!!errors.kycNumber} style={{ color: colors.error, fontSize: fontSizes.errorText }}>
                {errors.kycNumber}
              </HelperText>
            )}
          </View>

          {/* Document Upload */}
          <View style={dynamicStyles.uploadSection}>
            <Text style={dynamicStyles.uploadLabel}>
              {t('registration.kyc.uploadDocument', { document: currentOption.label })} <Text style={dynamicStyles.asterisk}>*</Text>
            </Text>
            <CustomFileInput
              name="documentImage"
              accept="image/*,.pdf"
              required
              value={formData.documentImage}
              onChange={handleFileChange}
              buttonText={t('registration.kyc.chooseFile')}
            />
            {errors.documentImage && (
              <HelperText type="error" visible={!!errors.documentImage} style={{ color: colors.error, fontSize: fontSizes.errorText }}>
                {errors.documentImage}
              </HelperText>
            )}
          </View>

          {/* Upload Note */}
          <View style={dynamicStyles.noteContainer}>
            <Text style={dynamicStyles.noteText}>
              <Text style={dynamicStyles.noteBold}>{t('registration.kyc.note')}: </Text>
              {t('registration.kyc.noteText', { document: currentOption.label })}
            </Text>
          </View>
        </View>

      </View>
    </ScrollView>
  );
};

export default KYCVerification;