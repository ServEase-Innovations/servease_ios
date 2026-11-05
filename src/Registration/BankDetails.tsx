// BankDetails.tsx - Updated for React Native
import React, { useCallback, useMemo } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
} from "react-native";
import { Text, TextInput } from "../theme/BrandTypography";
import { useTheme } from "../Settings/ThemeContext";
import Icon from 'react-native-vector-icons/MaterialIcons';
import { registrationKeyboardInputProps } from "../common/RegistrationKeyboardAccessory";

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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
      <Icon name="info" size={20} color={colors.primary} style={styles.alertIcon} />
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
      <Icon name="info" size={16} color={colors.textSecondary} style={styles.bottomAlertIcon} />
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
                <Icon name="close" size={24} color={colors.text} />
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
                    <Icon name="check" size={20} color={colors.primary} />
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
            <Icon name="account-balance" size={20} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              {...registrationKeyboardInputProps}
              style={styles.input}
              placeholder="Enter bank name"
              placeholderTextColor={colors.placeholder}
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
            <Icon name="person" size={20} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              {...registrationKeyboardInputProps}
              style={styles.input}
              placeholder="Enter account holder name"
              placeholderTextColor={colors.placeholder}
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
            <Icon name="credit-card" size={20} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              {...registrationKeyboardInputProps}
              style={styles.input}
              placeholder="Enter account number"
              placeholderTextColor={colors.placeholder}
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
            <Icon name="code" size={20} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              {...registrationKeyboardInputProps}
              style={[styles.input, styles.uppercaseInput]}
              placeholder="Enter IFSC code (e.g., SBIN0001234)"
              placeholderTextColor={colors.placeholder}
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
            <Icon name="credit-card" size={20} color={colors.textSecondary} style={styles.inputIcon} />
            <Text style={[
              styles.selectText,
              !formData.accountType && styles.selectPlaceholder
            ]}>
              {formData.accountType 
                ? accountTypes.find((type) => type.value === formData.accountType)?.label 
                : "Select account type"}
            </Text>
            <Icon name="arrow-drop-down" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          {errors.accountType && <Text style={styles.errorText}>{errors.accountType}</Text>}
        </View>

        {/* UPI ID Field */}
        <View style={styles.fieldContainer}>
          {renderOptionalLabel("UPI ID")}
          <View style={[styles.inputWrapper, errors.upiId && styles.inputWrapperError]}>
            <Icon name="payment" size={20} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              {...registrationKeyboardInputProps}
              style={styles.input}
              placeholder="Enter UPI ID (e.g., username@bankname)"
              placeholderTextColor={colors.placeholder}
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

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
  },
  infoAlertContainer: {
    flexDirection: "row",
    backgroundColor: colors.accentSoft,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.primary,
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
    color: colors.primaryDark,
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  bottomAlertContainer: {
    flexDirection: "row",
    backgroundColor: colors.surface2,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bottomAlertIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  bottomAlertText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
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
    color: colors.text,
    marginRight: 4,
  },
  optionalText: {
    fontSize: 12,
    fontWeight: "normal",
    color: colors.textSecondary,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    minHeight: 56,
  },
  inputWrapperError: {
    borderColor: colors.error,
  },
  inputIcon: {
    marginLeft: 12,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 12,
    paddingRight: 12,
  },
  uppercaseInput: {
    textTransform: "uppercase",
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
    marginLeft: 14,
  },
  selectWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    minHeight: 56,
  },
  selectWrapperError: {
    borderColor: colors.error,
  },
  selectText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 12,
  },
  selectPlaceholder: {
    color: colors.placeholder,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  pickerContainer: {
    backgroundColor: colors.surface,
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
    borderBottomColor: colors.border,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
  },
  pickerItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerItemText: {
    fontSize: 16,
    color: colors.text,
  },
  pickerItemTextSelected: {
    color: colors.primary,
    fontWeight: "500",
  },
});

export default BankDetails;