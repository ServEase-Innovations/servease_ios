// BankDetails.tsx - Updated for React Native
import React, { useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
} from "react-native";
import Icon from 'react-native-vector-icons/MaterialIcons';

export interface BankDetailsData {
  bankName: string;
  ifscCode: string;
  accountHolderName: string;
  accountNumber: string;
  accountType: string;
  upiId: string;
}

export interface BankDetailsErrors {
  bankName?: string;
  ifscCode?: string;
  accountHolderName?: string;
  accountNumber?: string;
  accountType?: string;
  upiId?: string;
}

interface BankDetailsProps {
  formData: BankDetailsData;
  errors: BankDetailsErrors;
  onFieldChange: (fieldName: string, value: string) => void;
  onFieldFocus?: (fieldName: string) => void;
}

const accountTypes = [
  { label: "Savings Account", value: "SAVINGS" },
  { label: "Current Account", value: "CURRENT" },
  { label: "Salary Account", value: "SALARY" },
  { label: "Fixed Deposit Account", value: "FIXED_DEPOSIT" },
  { label: "NRI Account", value: "NRI" },
];

const BankDetails: React.FC<BankDetailsProps> = ({
  formData,
  errors,
  onFieldChange,
  onFieldFocus,
}) => {
  const [showAccountTypePicker, setShowAccountTypePicker] = React.useState(false);

  const handleInputChange = useCallback((fieldName: string, value: string) => {
    onFieldChange(fieldName, value);
  }, [onFieldChange]);

  const handleSelectAccountType = useCallback((value: string) => {
    onFieldChange("accountType", value);
    setShowAccountTypePicker(false);
  }, [onFieldChange]);

  const renderOptionalLabel = (label: string) => (
    <View style={styles.labelContainer}>
      <Text style={styles.labelText}>{label}</Text>
      <Text style={styles.optionalText}>(Optional)</Text>
    </View>
  );

  const renderInfoAlert = () => (
    <View style={styles.infoAlertContainer}>
      <Icon name="info" size={20} color="#0288d1" style={styles.alertIcon} />
      <View style={styles.alertContent}>
        <Text style={styles.alertTitle}>Bank Details</Text>
        <Text style={styles.alertMessage}>
          Bank details are optional but recommended for payment processing.
        </Text>
      </View>
    </View>
  );

  const renderBottomAlert = () => (
    <View style={styles.bottomAlertContainer}>
      <Icon name="info" size={16} color="#666" style={styles.bottomAlertIcon} />
      <Text style={styles.bottomAlertText}>
        All bank details are optional. You can add or update them later from your profile settings.
      </Text>
    </View>
  );

  const renderAccountTypePicker = () => {
    if (!showAccountTypePicker) return null;
    
    return (
      <Modal
        visible={showAccountTypePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAccountTypePicker(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowAccountTypePicker(false)}
        >
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Account Type</Text>
              <TouchableOpacity onPress={() => setShowAccountTypePicker(false)}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={accountTypes}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerItem}
                  onPress={() => handleSelectAccountType(item.value)}
                >
                  <Text style={[
                    styles.pickerItemText,
                    formData.accountType === item.value && styles.pickerItemTextSelected
                  ]}>
                    {item.label}
                  </Text>
                  {formData.accountType === item.value && (
                    <Icon name="check" size={20} color="#1976d2" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {renderInfoAlert()}

        {/* Bank Name Field */}
        <View style={styles.fieldContainer}>
          {renderOptionalLabel("Bank Name")}
          <View style={[styles.inputWrapper, errors.bankName && styles.inputWrapperError]}>
            <Icon name="account-balance" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter bank name"
              placeholderTextColor="#999"
              value={formData.bankName}
              onChangeText={(value) => handleInputChange("bankName", value)}
              onFocus={() => onFieldFocus && onFieldFocus("bankName")}
            />
          </View>
          {errors.bankName && <Text style={styles.errorText}>{errors.bankName}</Text>}
        </View>

        {/* Account Holder Name Field */}
        <View style={styles.fieldContainer}>
          {renderOptionalLabel("Account Holder Name")}
          <View style={[styles.inputWrapper, errors.accountHolderName && styles.inputWrapperError]}>
            <Icon name="person" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter account holder name"
              placeholderTextColor="#999"
              value={formData.accountHolderName}
              onChangeText={(value) => handleInputChange("accountHolderName", value)}
              onFocus={() => onFieldFocus && onFieldFocus("accountHolderName")}
            />
          </View>
          {errors.accountHolderName && <Text style={styles.errorText}>{errors.accountHolderName}</Text>}
        </View>

        {/* Account Number Field */}
        <View style={styles.fieldContainer}>
          {renderOptionalLabel("Account Number")}
          <View style={[styles.inputWrapper, errors.accountNumber && styles.inputWrapperError]}>
            <Icon name="credit-card" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter account number"
              placeholderTextColor="#999"
              value={formData.accountNumber}
              onChangeText={(value) => handleInputChange("accountNumber", value)}
              onFocus={() => onFieldFocus && onFieldFocus("accountNumber")}
              keyboardType="numeric"
              maxLength={20}
            />
          </View>
          {errors.accountNumber && <Text style={styles.errorText}>{errors.accountNumber}</Text>}
        </View>

        {/* IFSC Code Field */}
        <View style={styles.fieldContainer}>
          {renderOptionalLabel("IFSC Code")}
          <View style={[styles.inputWrapper, errors.ifscCode && styles.inputWrapperError]}>
            <Icon name="code" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, styles.uppercaseInput]}
              placeholder="Enter IFSC code (e.g., SBIN0001234)"
              placeholderTextColor="#999"
              value={formData.ifscCode}
              onChangeText={(value) => handleInputChange("ifscCode", value.toUpperCase())}
              onFocus={() => onFieldFocus && onFieldFocus("ifscCode")}
              maxLength={11}
              autoCapitalize="characters"
            />
          </View>
          {errors.ifscCode && <Text style={styles.errorText}>{errors.ifscCode}</Text>}
        </View>

        {/* Account Type Field */}
        <View style={styles.fieldContainer}>
          {renderOptionalLabel("Account Type")}
          <TouchableOpacity 
            style={[styles.selectWrapper, errors.accountType && styles.selectWrapperError]}
            onPress={() => setShowAccountTypePicker(true)}
          >
            <Icon name="credit-card" size={20} color="#666" style={styles.inputIcon} />
            <Text style={[
              styles.selectText,
              !formData.accountType && styles.selectPlaceholder
            ]}>
              {formData.accountType 
                ? accountTypes.find((type) => type.value === formData.accountType)?.label 
                : "Select account type"}
            </Text>
            <Icon name="arrow-drop-down" size={24} color="#666" />
          </TouchableOpacity>
          {errors.accountType && <Text style={styles.errorText}>{errors.accountType}</Text>}
        </View>

        {/* UPI ID Field */}
        <View style={styles.fieldContainer}>
          {renderOptionalLabel("UPI ID")}
          <View style={[styles.inputWrapper, errors.upiId && styles.inputWrapperError]}>
            <Icon name="payment" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter UPI ID (e.g., username@bankname)"
              placeholderTextColor="#999"
              value={formData.upiId}
              onChangeText={(value) => handleInputChange("upiId", value)}
              onFocus={() => onFieldFocus && onFieldFocus("upiId")}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          {errors.upiId && <Text style={styles.errorText}>{errors.upiId}</Text>}
        </View>

        {renderBottomAlert()}
      </View>

      {renderAccountTypePicker()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    padding: 16,
  },
  infoAlertContainer: {
    flexDirection: "row",
    backgroundColor: "#e3f2fd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#90caf9",
  },
  alertIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0d3c61",
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 14,
    color: "#0d3c61",
    lineHeight: 20,
  },
  bottomAlertContainer: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  bottomAlertIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  bottomAlertText: {
    flex: 1,
    fontSize: 12,
    color: "#666",
    lineHeight: 18,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  labelText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginRight: 4,
  },
  optionalText: {
    fontSize: 12,
    fontWeight: "normal",
    color: "#666",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    backgroundColor: "#fff",
    minHeight: 56,
  },
  inputWrapperError: {
    borderColor: "#d32f2f",
  },
  inputIcon: {
    marginLeft: 12,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    paddingVertical: 12,
    paddingRight: 12,
  },
  uppercaseInput: {
    textTransform: "uppercase",
  },
  errorText: {
    fontSize: 12,
    color: "#d32f2f",
    marginTop: 4,
    marginLeft: 14,
  },
  selectWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    backgroundColor: "#fff",
    minHeight: 56,
  },
  selectWrapperError: {
    borderColor: "#d32f2f",
  },
  selectText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    paddingVertical: 12,
  },
  selectPlaceholder: {
    color: "#999",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  pickerContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    width: "90%",
    maxHeight: "80%",
    overflow: "hidden",
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  pickerItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  pickerItemText: {
    fontSize: 16,
    color: "#333",
  },
  pickerItemTextSelected: {
    color: "#1976d2",
    fontWeight: "500",
  },
});

export default BankDetails;