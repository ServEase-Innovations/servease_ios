// components/Registration/KYCVerification.tsx
import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from "react-native";
import {
  RadioButton,
  HelperText,
  Divider,
  Card,
} from "react-native-paper";
import CustomFileInput from "./CustomFileInput";

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
  const kycOptions = [
    { 
      value: "AADHAR", 
      label: "Aadhaar Card", 
      description: "Government ID proof", 
      placeholder: "Aadhaar Number *", 
      pattern: "[0-9]{12}", 
      maxLength: 12, 
      helperText: "Enter 12-digit Aadhaar number" 
    },
    { 
      value: "PAN", 
      label: "PAN Card", 
      description: "Permanent Account Number", 
      placeholder: "PAN Number *", 
      pattern: "[A-Z]{5}[0-9]{4}[A-Z]{1}", 
      maxLength: 10, 
      helperText: "Enter 10-digit PAN (e.g., ABCDE1234F)" 
    },
    { 
      value: "DRIVING_LICENSE", 
      label: "Driving License", 
      description: "Driving License", 
      placeholder: "Driving License Number *", 
      pattern: "^[A-Z]{2}[0-9]{2}[0-9]{4,11}*$", 
      maxLength: 16, 
      helperText: "Enter your driving license number" 
    },
    { 
      value: "VOTER_ID", 
      label: "Voter ID", 
      description: "Voter Identification Card", 
      placeholder: "Voter ID Number *", 
      pattern: "[A-Z]{3}[0-9]{7}", 
      maxLength: 10, 
      helperText: "Enter 10-digit Voter ID" 
    },
    { 
      value: "PASSPORT", 
      label: "Passport", 
      description: "Passport", 
      placeholder: "Passport Number *", 
      pattern: "[A-Z]{1}[0-9]{7}", 
      maxLength: 8, 
      helperText: "Enter 8-character passport number" 
    },
  ];

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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.spacing}>
        {/* KYC Type Selection */}
        <View>
          <Text style={styles.label}>
            Select KYC Document Type <Text style={styles.asterisk}>*</Text>
          </Text>
          
          <View style={styles.optionsGrid}>
            {kycOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionCard,
                  formData.kycType === option.value && styles.selectedOption,
                ]}
                onPress={() => handleKycTypePress(option.value)}
              >
                <View style={styles.optionContent}>
                  <Text
                    style={[
                      styles.optionLabel,
                      formData.kycType === option.value && styles.selectedOptionText,
                    ]}
                    numberOfLines={1}
                  >
                    {option.label}
                  </Text>
                  <Text
                    style={[
                      styles.optionDescription,
                      formData.kycType === option.value && styles.selectedOptionDescription,
                    ]}
                    numberOfLines={1}
                  >
                    {option.description}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          
          {errors.kycType && (
            <HelperText type="error" visible={!!errors.kycType} style={styles.helperText}>
              {errors.kycType}
            </HelperText>
          )}
        </View>

        <View style={styles.dividerContainer}>
          <Divider style={styles.divider} />
        </View>

        {/* Selected KYC Type Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.selectedKycTitle}>
            {currentOption.label}
          </Text>
          <Text style={styles.selectedKycDescription}>
            {currentOption.description}
          </Text>
        </View>

        {/* Dynamic Document Number Field based on KYC Type */}
        <View style={styles.inputContainer}>
          <TextInput
            style={[
              styles.input,
              errors.kycNumber && styles.inputError
            ]}
            placeholder={currentOption.placeholder}
            value={formData.kycNumber || ""}
            onChangeText={handleTextChange}
            onFocus={() => onFieldFocus("kycNumber")}
            maxLength={currentOption.maxLength}
            keyboardType={currentOption.value === "AADHAR" ? "numeric" : "default"}
          />
          {errors.kycNumber ? (
            <HelperText type="error" visible={!!errors.kycNumber} style={styles.helperText}>
              {errors.kycNumber}
            </HelperText>
          ) : (
            <HelperText type="info" visible={true} style={styles.helperText}>
              {currentOption.helperText}
            </HelperText>
          )}
        </View>

        {/* Document Upload Section */}
        <View style={styles.uploadContainer}>
          <CustomFileInput
            name="documentImage"
            accept="image/*,.pdf"
            required
            value={formData.documentImage}
            onChange={onDocumentUpload}
            buttonText={`Upload ${currentOption.label} Document`}
          />
        </View>

        {/* Helper Text based on KYC Type */}
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            <Text style={styles.infoNote}>Note: </Text>
            Please upload a clear image of your {currentOption.label}. Accepted formats: JPG, PNG, PDF. Max size: 5MB.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  spacing: {
    padding: 16,
    gap: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  asterisk: {
    color: '#d32f2f',
    fontSize: 14,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    width: '100%',
  },
  optionCard: {
    flex: 1,
    minWidth: 90,
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 2,
  },
  selectedOption: {
    backgroundColor: '#e3f2fd',
    borderColor: '#1976d2',
  },
  optionContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#000',
    textAlign: 'center',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 9,
    color: '#666',
    textAlign: 'center',
    opacity: 0.8,
  },
  selectedOptionText: {
    color: '#1976d2',
    fontWeight: '600',
  },
  selectedOptionDescription: {
    color: '#1976d2',
  },
  helperText: {
    fontSize: 11,
    marginTop: 4,
    marginLeft: 0,
  },
  dividerContainer: {
    marginVertical: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  headerContainer: {
    marginBottom: 8,
  },
  selectedKycTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: 2,
  },
  selectedKycDescription: {
    fontSize: 11,
    color: '#666',
  },
  inputContainer: {
    width: '100%',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    padding: 12,
    fontSize: 13,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#d32f2f',
  },
  uploadContainer: {
    width: '100%',
  },
  infoCard: {
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    marginTop: 8,
  },
  infoText: {
    fontSize: 11,
    color: '#666',
    textAlign: 'left',
  },
  infoNote: {
    fontWeight: '600',
    color: '#1976d2',
  },
});

export default KYCVerification;