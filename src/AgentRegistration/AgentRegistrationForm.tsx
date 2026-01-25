import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import axios from 'axios';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface AgentRegistrationFormProps {
  onBackToLogin: () => void;
  onRegistrationSuccess: () => void;
}

const AgentRegistrationForm: React.FC<AgentRegistrationFormProps> = ({
  onBackToLogin,
  onRegistrationSuccess,
}) => {
  const [formData, setFormData] = useState({
    companyName: '',
    mobileNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [referralCode, setReferralCode] = useState('');

  const [validationErrors, setValidationErrors] = useState({
    mobileNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const mobileRegex = /^[0-9]{10}$/;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  const handleChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
    validateForm(name, value);
  };

  const validateForm = (field: string, value: string) => {
    let errors = { ...validationErrors };

    switch (field) {
      case 'mobileNumber':
        errors.mobileNumber = mobileRegex.test(value) ? '' : 'Enter a valid 10-digit mobile number';
        break;
      case 'email':
        errors.email = emailRegex.test(value) ? '' : 'Enter a valid email address';
        break;
      case 'password':
        errors.password = passwordRegex.test(value)
          ? ''
          : 'Password must be at least 8 characters with 1 letter, 1 number, and 1 special character';
        break;
      case 'confirmPassword':
        errors.confirmPassword =
          value === formData.password ? '' : 'Passwords do not match';
        break;
    }

    setValidationErrors(errors);
  };

  const isFormValid = () => {
    const requiredFields = ['companyName', 'mobileNumber', 'email', 'password', 'confirmPassword', 'address'];
    for (const field of requiredFields) {
      if (!formData[field as keyof typeof formData]) {
        Alert.alert('Validation Error', 'Please fill all required fields.');
        return false;
      }
    }

    for (const error in validationErrors) {
      if (validationErrors[error as keyof typeof validationErrors]) {
        Alert.alert('Validation Error', 'Please fix the form errors before submitting.');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!isFormValid()) return;

    const requestData = {
      companyName: formData.companyName,
      emailId: formData.email,
      phoneNo: Number(formData.mobileNumber),
      address: formData.address,
      password: formData.password,
    };

    try {
      const response = await axios.post(
        'http://43.205.212.94:8080/vendors/add',
        requestData,
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (response.status === 200) {
        const generatedCode = response.data.referralCode || 'REF1234567';
        setReferralCode(generatedCode);
        Clipboard.setString(generatedCode);
        Alert.alert('Success', 'Vendor added successfully!\nReferral code copied to clipboard!');
        onRegistrationSuccess();
      } else {
        Alert.alert('Error', response.data.error || 'Failed to add vendor');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'An error occurred while connecting to the API.');
    }
  };

  const handleCopyReferralCode = () => {
    if (referralCode) {
      Clipboard.setString(referralCode);
      Alert.alert('Copied', 'Referral code copied to clipboard!');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <TouchableOpacity style={styles.backButton} onPress={onBackToLogin}>
          <MaterialIcons name="arrow-back" size={20} color="#fff" />
          <Text style={styles.backButtonText}>Back to Login</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Agent Registration</Text>

        <Text style={styles.label}>Company Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter company name"
          value={formData.companyName}
          onChangeText={(text) => handleChange('companyName', text)}
        />

        <Text style={styles.label}>Mobile Number *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter 10-digit mobile number"
          keyboardType="numeric"
          value={formData.mobileNumber}
          onChangeText={(text) => handleChange('mobileNumber', text)}
        />
        {validationErrors.mobileNumber && <Text style={styles.error}>{validationErrors.mobileNumber}</Text>}

        <Text style={styles.label}>Email ID *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter email address"
          keyboardType="email-address"
          value={formData.email}
          onChangeText={(text) => handleChange('email', text)}
        />
        {validationErrors.email && <Text style={styles.error}>{validationErrors.email}</Text>}

        <Text style={styles.label}>Password *</Text>
        <TextInput
          style={styles.input}
          placeholder="Create password"
          secureTextEntry={!showPassword}
          value={formData.password}
          onChangeText={(text) => handleChange('password', text)}
        />
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setShowPassword(!showPassword)}
        >
          <Text style={styles.toggleText}>{showPassword ? 'Hide' : 'Show'} Password</Text>
        </TouchableOpacity>
        {validationErrors.password && <Text style={styles.error}>{validationErrors.password}</Text>}

        <Text style={styles.label}>Confirm Password *</Text>
        <TextInput
          style={styles.input}
          placeholder="Re-enter password"
          secureTextEntry={!showConfirmPassword}
          value={formData.confirmPassword}
          onChangeText={(text) => handleChange('confirmPassword', text)}
        />
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
        >
          <Text style={styles.toggleText}>{showConfirmPassword ? 'Hide' : 'Show'} Password</Text>
        </TouchableOpacity>
        {validationErrors.confirmPassword && <Text style={styles.error}>{validationErrors.confirmPassword}</Text>}

        <Text style={styles.label}>Company Address *</Text>
        <TextInput
          style={[styles.input, styles.addressInput]}
          placeholder="Enter full address"
          value={formData.address}
          onChangeText={(text) => handleChange('address', text)}
          multiline
        />

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit Registration</Text>
        </TouchableOpacity>

        {referralCode !== '' && (
          <View style={styles.referralBox}>
            <Text style={styles.referralText}>Your Referral Code: {referralCode}</Text>
            <TouchableOpacity style={styles.copyButton} onPress={handleCopyReferralCode}>
              <Text style={styles.copyLink}>Copy to Clipboard</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default AgentRegistrationForm;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 25,
    textAlign: 'center',
    color: '#333',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#444',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  addressInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  toggleButton: {
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  toggleText: {
    color: '#4f8ad5',
    fontSize: 14,
  },
  error: {
    color: 'red',
    marginBottom: 10,
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: '#4f8ad5',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  referralBox: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  referralText: {
    fontSize: 16,
    marginBottom: 10,
  },
  copyButton: {
    alignSelf: 'flex-start',
  },
  copyLink: {
    color: '#4f8ad5',
    fontSize: 14,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButtonText: {
    color: '#4f8ad5',
    marginLeft: 8,
    fontSize: 16,
  },
});
