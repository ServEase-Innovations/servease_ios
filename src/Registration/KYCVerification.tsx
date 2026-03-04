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
      placeholder: "Enter 12-digit Aadhaar number", 
      pattern: "[0-9]{12}", 
      maxLength: 12, 
    },
    { 
      value: "PAN", 
      label: "PAN Card", 
      description: "Permanent Account Number (PAN)", 
      placeholder: "Enter 10-digit PAN number", 
      pattern: "[A-Z]{5}[0-9]{4}[A-Z]{1}", 
      maxLength: 10, 
    },
    { 
      value: "DRIVING_LICENSE", 
      label: "Driving License", 
      description: "Driving License", 
      placeholder: "Enter driving license number", 
      pattern: "^[A-Z]{2}[0-9]{2}[0-9]{4,11}*$", 
      maxLength: 16, 
    },
    { 
      value: "VOTER_ID", 
      label: "Voter ID", 
      description: "Voter Identification Card", 
      placeholder: "Enter 10-digit Voter ID", 
      pattern: "[A-Z]{3}[0-9]{7}", 
      maxLength: 10, 
    },
    { 
      value: "PASSPORT", 
      label: "Passport", 
      description: "Passport", 
      placeholder: "Enter passport number", 
      pattern: "[A-Z]{1}[0-9]{7}", 
      maxLength: 8, 
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

  const handleFileChange = (file: any) => {
    onDocumentUpload(file);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>

        {/* KYC Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Select KYC Document Type <Text style={styles.asterisk}>*</Text>
          </Text>
          
          <View style={styles.optionsContainer}>
            {kycOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionCard,
                  formData.kycType === option.value && styles.selectedOptionCard,
                ]}
                onPress={() => handleKycTypePress(option.value)}
              >
                <View style={styles.optionContent}>
                  <Text
                    style={[
                      styles.optionLabel,
                      formData.kycType === option.value && styles.selectedOptionLabel,
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Text
                    style={[
                      styles.optionDescription,
                      formData.kycType === option.value && styles.selectedOptionDescription,
                    ]}
                  >
                    {option.description}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          
          {errors.kycType && (
            <HelperText type="error" visible={!!errors.kycType} style={styles.errorText}>
              {errors.kycType}
            </HelperText>
          )}
        </View>

        <Divider style={styles.divider} />

        {/* Selected KYC Document Section */}
        <View style={styles.section}>
          <View style={styles.selectedDocHeader}>
            <Text style={styles.selectedDocTitle}>
              {currentOption.label}
            </Text>
            <Text style={styles.selectedDocDescription}>
              {currentOption.description}
            </Text>
          </View>

          {/* Document Number Input */}
          <View style={styles.inputWrapper}>
            <TextInput
              style={[
                styles.input,
                errors.kycNumber && styles.inputError
              ]}
              placeholder={currentOption.placeholder}
              placeholderTextColor="#999"
              value={formData.kycNumber || ""}
              onChangeText={handleTextChange}
              onFocus={() => onFieldFocus("kycNumber")}
              maxLength={currentOption.maxLength}
              keyboardType={currentOption.value === "AADHAR" ? "numeric" : "default"}
            />
            
            {/* Helper text based on KYC type */}
            {currentOption.value === "AADHAR" && !errors.kycNumber && (
              <HelperText type="info" visible={true} style={styles.helperInfo}>
                Enter 12-digit Aadhaar number
              </HelperText>
            )}
            
            {errors.kycNumber && (
              <HelperText type="error" visible={!!errors.kycNumber} style={styles.errorText}>
                {errors.kycNumber}
              </HelperText>
            )}
          </View>

          {/* Document Upload */}
          <View style={styles.uploadSection}>
            <Text style={styles.uploadLabel}>
              Upload {currentOption.label} <Text style={styles.asterisk}>*</Text>
            </Text>
            <CustomFileInput
              name="documentImage"
              accept="image/*,.pdf"
              required
              value={formData.documentImage}
              onChange={handleFileChange}
              buttonText="Choose File"
            />
            {errors.documentImage && (
              <HelperText type="error" visible={!!errors.documentImage} style={styles.errorText}>
                {errors.documentImage}
              </HelperText>
            )}
          </View>

          {/* Upload Note */}
          <View style={styles.noteContainer}>
            <Text style={styles.noteText}>
              <Text style={styles.noteBold}>Note: </Text>
              Please upload a clear image of your {currentOption.label}. 
              Accepted formats: JPG, PNG, PDF. Max size: 5MB.
            </Text>
          </View>
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
  content: {
    padding: 20,
  },
  stepIndicator: {
    marginBottom: 24,
  },
  stepText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  asterisk: {
    color: '#d32f2f',
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
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    minHeight: 70,
  },
  selectedOptionCard: {
    borderColor: '#1976d2',
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  selectedOptionLabel: {
    color: '#1976d2',
  },
  selectedOptionDescription: {
    color: '#1976d2',
  },
  errorText: {
    fontSize: 12,
    color: '#d32f2f',
    marginTop: 4,
    marginLeft: 0,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 20,
  },
  selectedDocHeader: {
    marginBottom: 16,
  },
  selectedDocTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: 2,
  },
  selectedDocDescription: {
    fontSize: 14,
    color: '#666',
  },
  inputWrapper: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 14,
    fontSize: 15,
    backgroundColor: '#fff',
    color: '#333',
  },
  inputError: {
    borderColor: '#d32f2f',
  },
  helperInfo: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
    marginLeft: 4,
  },
  uploadSection: {
    marginBottom: 16,
  },
  uploadLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  noteContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  noteText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
  },
  noteBold: {
    fontWeight: '600',
    color: '#1976d2',
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
    borderColor: '#1976d2',
  },
  backButtonText: {
    color: '#1976d2',
    fontSize: 15,
    fontWeight: '500',
  },
  nextButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#1976d2',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
});

export default KYCVerification;