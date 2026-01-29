import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';

export interface AddressData {
  apartment: string;
  street: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
}

interface AddressComponentProps {
  onAddressChange: (type: 'permanent' | 'correspondence', data: AddressData) => void;
  permanentAddress: AddressData;
  correspondenceAddress: AddressData;
  errors?: {
    permanent?: Partial<AddressData>;
    correspondence?: Partial<AddressData>;
  };
  onSameAddressToggle?: (checked: boolean) => void;
  isSameAddress?: boolean;
}

const AddressComponent: React.FC<AddressComponentProps> = ({
  onAddressChange,
  permanentAddress,
  correspondenceAddress,
  errors = {},
  onSameAddressToggle,
  isSameAddress: externalIsSameAddress,
}) => {
  // Use internal state only if external state is not provided
  const [internalIsSameAddress, setInternalIsSameAddress] = useState(false);
  const isSameAddress = externalIsSameAddress !== undefined ? externalIsSameAddress : internalIsSameAddress;

  const handlePermanentAddressChange = (field: keyof AddressData, value: string) => {
    const newAddress = { ...permanentAddress, [field]: value };
    onAddressChange('permanent', newAddress);

    if (isSameAddress) {
      onAddressChange('correspondence', newAddress);
    }
  };

  const handleCorrespondenceAddressChange = (field: keyof AddressData, value: string) => {
    const newAddress = { ...correspondenceAddress, [field]: value };
    onAddressChange('correspondence', newAddress);
  };

  const handleSameAddressToggle = () => {
    const checked = !isSameAddress;
    if (externalIsSameAddress !== undefined && onSameAddressToggle) {
      onSameAddressToggle(checked);
    } else {
      setInternalIsSameAddress(checked);
    }

    if (checked) {
      // Copy permanent → correspondence
      onAddressChange('correspondence', permanentAddress);
    }
  };

  const renderInput = (
    label: string,
    value: string,
    onChange: (text: string) => void,
    error?: string,
    isHalfWidth?: boolean,
    keyboardType: 'default' | 'numeric' = 'default',
    maxLength?: number
  ) => (
    <View style={[styles.inputContainer, isHalfWidth && styles.halfWidth]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          error && styles.inputError,
        ]}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        maxLength={maxLength}
        placeholder={`Enter ${label.toLowerCase()}`}
        placeholderTextColor="#999"
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Address Information</Text>

      {/* Permanent Address */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Permanent Address *</Text>
        
        <View style={styles.row}>
          {renderInput(
            'Apartment Name/Flat Name or Number *',
            permanentAddress.apartment,
            (text) => handlePermanentAddressChange('apartment', text),
            errors.permanent?.apartment,
            false
          )}
        </View>

        <View style={styles.row}>
          {renderInput(
            'Street Name/Locality name *',
            permanentAddress.street,
            (text) => handlePermanentAddressChange('street', text),
            errors.permanent?.street,
            false
          )}
        </View>

        <View style={styles.row}>
          {renderInput(
            'City *',
            permanentAddress.city,
            (text) => handlePermanentAddressChange('city', text),
            errors.permanent?.city,
            true
          )}
          {renderInput(
            'State *',
            permanentAddress.state,
            (text) => handlePermanentAddressChange('state', text),
            errors.permanent?.state,
            true
          )}
        </View>

        <View style={styles.row}>
          {renderInput(
            'Country *',
            permanentAddress.country,
            (text) => handlePermanentAddressChange('country', text),
            errors.permanent?.country,
            true
          )}
          {renderInput(
            'Pincode *',
            permanentAddress.pincode,
            (text) => handlePermanentAddressChange('pincode', text.replace(/\D/g, '').slice(0, 6)),
            errors.permanent?.pincode,
            true,
            'numeric',
            6
          )}
        </View>
      </View>

      {/* Same as Permanent Checkbox */}
      <View style={styles.checkboxContainer}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={handleSameAddressToggle}
        >
          <View style={[styles.checkboxBox, isSameAddress && styles.checkboxChecked]}>
            {isSameAddress && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>Same as Permanent Address</Text>
        </TouchableOpacity>
      </View>

      {/* Correspondence Address (only show if not same) */}
      {!isSameAddress && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Correspondence Address *</Text>
          
          <View style={styles.row}>
            {renderInput(
              'Apartment Name/Flat Name or Number *',
              correspondenceAddress.apartment,
              (text) => handleCorrespondenceAddressChange('apartment', text),
              errors.correspondence?.apartment,
              false
            )}
          </View>

          <View style={styles.row}>
            {renderInput(
              'Street Name/Locality name *',
              correspondenceAddress.street,
              (text) => handleCorrespondenceAddressChange('street', text),
              errors.correspondence?.street,
              false
            )}
          </View>

          <View style={styles.row}>
            {renderInput(
              'City *',
              correspondenceAddress.city,
              (text) => handleCorrespondenceAddressChange('city', text),
              errors.correspondence?.city,
              true
            )}
            {renderInput(
              'State *',
              correspondenceAddress.state,
              (text) => handleCorrespondenceAddressChange('state', text),
              errors.correspondence?.state,
              true
            )}
          </View>

          <View style={styles.row}>
            {renderInput(
              'Country *',
              correspondenceAddress.country,
              (text) => handleCorrespondenceAddressChange('country', text),
              errors.correspondence?.country,
              true
            )}
            {renderInput(
              'Pincode *',
              correspondenceAddress.pincode,
              (text) => handleCorrespondenceAddressChange('pincode', text.replace(/\D/g, '').slice(0, 6)),
              errors.correspondence?.pincode,
              true,
              'numeric',
              6
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const { width } = Dimensions.get('window');
const isSmallScreen = width < 375;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    color: '#333',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  row: {
    flexDirection: isSmallScreen ? 'column' : 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  inputContainer: {
    flex: 1,
    marginBottom: 12,
    marginHorizontal: 4,
  },
  halfWidth: {
    flex: 0.48,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#d32f2f',
  },
  errorText: {
    fontSize: 12,
    color: '#d32f2f',
    marginTop: 4,
  },
  checkboxContainer: {
    marginBottom: 24,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#1976d2',
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#1976d2',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
  },
});

export default AddressComponent;