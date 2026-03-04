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
        Alert.alert('Invalid Year', `Year must be between ${minYear} and ${maxYear}`);
        return;
      }

      if (monthNum < 1 || monthNum > 12) {
        Alert.alert('Invalid Month', 'Month must be between 01 and 12');
        return;
      }

      if (dayNum < 1 || dayNum > 31) {
        Alert.alert('Invalid Day', 'Day must be between 01 and 31');
        return;
      }

      // Create date string in YYYY-MM-DD format
      const formattedDate = `${yearVal}-${monthVal}-${dayVal}`;
      
      // Check if date is valid
      const date = moment(formattedDate, 'YYYY-MM-DD');
      if (!date.isValid()) {
        Alert.alert('Invalid Date', 'Please enter a valid date');
        return;
      }

      // Check age
      const today = moment();
      const birthDate = moment(formattedDate, 'YYYY-MM-DD');
      const age = today.diff(birthDate, 'years');

      if (age < 18) {
        Alert.alert('Age Restriction', 'You must be at least 18 years old');
        return;
      }

      // Update form data with YYYY-MM-DD format
      onDobChange({ target: { name: 'dob', value: formattedDate } });
    }
  };

  const handleGenderChange = (gender: string) => {
    handleTextChange('gender', gender);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.spacing}>
        <View style={styles.section}>
          <ProfileImageUpload onImageSelect={onImageSelect} />
        </View>
        
        {/* First Name */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>First Name <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={[styles.input, errors.firstName && styles.inputError]}
            placeholder="Enter your first name"
            placeholderTextColor="#999"
            value={formData.firstName}
            onChangeText={(text) => handleTextChange('firstName', text)}
            onFocus={() => onFieldFocus('firstName')}
            maxLength={MAX_NAME_LENGTH}
          />
          {errors.firstName && (
            <HelperText type="error" visible={!!errors.firstName}>
              {errors.firstName}
            </HelperText>
          )}
        </View>
        
        {/* Middle Name */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Middle Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your middle name"
            placeholderTextColor="#999"
            value={formData.middleName}
            onChangeText={(text) => handleTextChange('middleName', text)}
          />
        </View>
        
        {/* Last Name */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Last Name <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={[styles.input, errors.lastName && styles.inputError]}
            placeholder="Enter your last name"
            placeholderTextColor="#999"
            value={formData.lastName}
            onChangeText={(text) => handleTextChange('lastName', text)}
            onFocus={() => onFieldFocus('lastName')}
            maxLength={MAX_NAME_LENGTH}
          />
          {errors.lastName && (
            <HelperText type="error" visible={!!errors.lastName}>
              {errors.lastName}
            </HelperText>
          )}
        </View>
        
        {/* Date of Birth - YYYY MM DD Format */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Date of Birth <Text style={styles.required}>*</Text></Text>
          
          <View style={styles.dobRow}>
            <View style={[styles.dobField, styles.dobFieldYear]}>
              <TextInput
                style={[styles.dobInput, errors.dob && styles.inputError]}
                placeholder="YYYY"
                placeholderTextColor="#999"
                value={year}
                onChangeText={handleYearChange}
                keyboardType="numeric"
                maxLength={4}
                textAlign="center"
              />
            </View>
            
            <View style={styles.dobField}>
              <TextInput
                style={[styles.dobInput, errors.dob && styles.inputError]}
                placeholder="MM"
                placeholderTextColor="#999"
                value={month}
                onChangeText={handleMonthChange}
                keyboardType="numeric"
                maxLength={2}
                textAlign="center"
              />
            </View>
            
            <View style={styles.dobField}>
              <TextInput
                style={[styles.dobInput, errors.dob && styles.inputError]}
                placeholder="DD"
                placeholderTextColor="#999"
                value={day}
                onChangeText={handleDayChange}
                keyboardType="numeric"
                maxLength={2}
                textAlign="center"
              />
            </View>
          </View>

          {formData.dob && (
            <HelperText type="info" visible={true}>
              Age: {moment().diff(moment(formData.dob), 'years')} years
            </HelperText>
          )}
          
          {errors.dob && (
            <HelperText type="error" visible={!!errors.dob}>
              {errors.dob}
            </HelperText>
          )}
          
          {!errors.dob && !formData.dob && (
            <HelperText type="info" visible={true}>
              Enter your date of birth (YYYY/MM/DD) - You must be at least 18 years old
            </HelperText>
          )}
        </View>
        
        {/* Gender */}
        <View style={styles.genderContainer}>
          <Text style={styles.label}>Gender <Text style={styles.required}>*</Text></Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity
              style={styles.radioOption}
              onPress={() => handleGenderChange('MALE')}
            >
              <View style={[
                styles.radioOuter,
                formData.gender === 'MALE' && styles.radioSelected
              ]}>
                {formData.gender === 'MALE' && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.radioText}>Male</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.radioOption}
              onPress={() => handleGenderChange('FEMALE')}
            >
              <View style={[
                styles.radioOuter,
                formData.gender === 'FEMALE' && styles.radioSelected
              ]}>
                {formData.gender === 'FEMALE' && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.radioText}>Female</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.radioOption}
              onPress={() => handleGenderChange('OTHER')}
            >
              <View style={[
                styles.radioOuter,
                formData.gender === 'OTHER' && styles.radioSelected
              ]}>
                {formData.gender === 'OTHER' && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.radioText}>Other</Text>
            </TouchableOpacity>
          </View>
          {errors.gender && (
            <HelperText type="error" visible={!!errors.gender}>
              {errors.gender}
            </HelperText>
          )}
        </View>
        
        {/* Email */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email <Text style={styles.required}>*</Text></Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={[styles.input, (errors.emailId || validationResults.email.isAvailable === false) && styles.inputError]}
              placeholder="Enter your email address"
              placeholderTextColor="#999"
              value={formData.emailId}
              onChangeText={(text) => handleTextChange('emailId', text)}
              onFocus={() => onFieldFocus('emailId')}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View style={styles.inputAdornment}>
              {validationResults.email.loading ? (
                <ActivityIndicator size="small" />
              ) : validationResults.email.isAvailable ? (
                <MaterialCommunityIcon name="check-circle" size={20} color="#4caf50" />
              ) : validationResults.email.isAvailable === false ? (
                <TouchableOpacity onPress={onClearEmail}>
                  <Icon name="close" size={20} color="#d32f2f" />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
          {(errors.emailId || validationResults.email.isAvailable === false || validationResults.email.loading) && (
            <HelperText 
              type={errors.emailId || validationResults.email.isAvailable === false ? "error" : "info"} 
              visible={true}
            >
              {errors.emailId ||
                (validationResults.email.loading ? "Checking availability..." :
                  validationResults.email.error ||
                  (validationResults.email.isAvailable ? "Email is available" : "Email is already taken"))}
            </HelperText>
          )}
        </View>
        
        {/* Password */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password <Text style={styles.required}>*</Text></Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={[styles.input, errors.password && styles.inputError]}
              placeholder="Enter your password"
              placeholderTextColor="#999"
              secureTextEntry={!showPassword}
              value={formData.password}
              onChangeText={(text) => handleTextChange('password', text)}
              onFocus={() => onFieldFocus('password')}
            />
            <TouchableOpacity 
              style={styles.inputAdornment}
              onPress={onTogglePasswordVisibility}
            >
              <Icon 
                name={showPassword ? "visibility" : "visibility-off"} 
                size={20} 
                color="#666" 
              />
            </TouchableOpacity>
          </View>
          {errors.password && (
            <HelperText type="error" visible={!!errors.password}>
              {errors.password}
            </HelperText>
          )}
        </View>
        
        {/* Confirm Password */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Confirm Password <Text style={styles.required}>*</Text></Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={[styles.input, errors.confirmPassword && styles.inputError]}
              placeholder="Confirm your password"
              placeholderTextColor="#999"
              secureTextEntry={!showConfirmPassword}
              value={formData.confirmPassword}
              onChangeText={(text) => handleTextChange('confirmPassword', text)}
              onFocus={() => onFieldFocus('confirmPassword')}
            />
            <TouchableOpacity 
              style={styles.inputAdornment}
              onPress={onToggleConfirmPasswordVisibility}
            >
              <Icon 
                name={showConfirmPassword ? "visibility" : "visibility-off"} 
                size={20} 
                color="#666" 
              />
            </TouchableOpacity>
          </View>
          {errors.confirmPassword && (
            <HelperText type="error" visible={!!errors.confirmPassword}>
              {errors.confirmPassword}
            </HelperText>
          )}
        </View>
        
        {/* Mobile Number */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Mobile Number <Text style={styles.required}>*</Text></Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={[styles.input, (errors.mobileNo || validationResults.mobile.isAvailable === false) && styles.inputError]}
              placeholder="Enter your mobile number"
              placeholderTextColor="#999"
              value={formData.mobileNo}
              onChangeText={(text) => handleTextChange('mobileNo', text)}
              onFocus={() => onFieldFocus('mobileNo')}
              keyboardType="phone-pad"
              maxLength={10}
            />
            <View style={styles.inputAdornment}>
              {validationResults.mobile.loading ? (
                <ActivityIndicator size="small" />
              ) : validationResults.mobile.isAvailable ? (
                <MaterialCommunityIcon name="check-circle" size={20} color="#4caf50" />
              ) : validationResults.mobile.isAvailable === false ? (
                <TouchableOpacity onPress={onClearMobile}>
                  <Icon name="close" size={20} color="#d32f2f" />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
          {(errors.mobileNo || validationResults.mobile.isAvailable === false || validationResults.mobile.loading) && (
            <HelperText 
              type={errors.mobileNo || validationResults.mobile.isAvailable === false ? "error" : "info"} 
              visible={true}
            >
              {errors.mobileNo ||
                (validationResults.mobile.loading ? "Checking availability..." :
                  validationResults.mobile.error ||
                  (validationResults.mobile.isAvailable ? "Mobile number is available" : "Mobile number is already taken"))}
            </HelperText>
          )}
        </View>

        {/* Alternate Number */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Alternate Number</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={[styles.input, (errors.AlternateNumber || validationResults.alternate.isAvailable === false) && styles.inputError]}
              placeholder="Enter alternate number (optional)"
              placeholderTextColor="#999"
              value={formData.AlternateNumber}
              onChangeText={(text) => handleTextChange('AlternateNumber', text)}
              keyboardType="phone-pad"
              maxLength={10}
            />
            <View style={styles.inputAdornment}>
              {validationResults.alternate.loading ? (
                <ActivityIndicator size="small" />
              ) : validationResults.alternate.isAvailable ? (
                <MaterialCommunityIcon name="check-circle" size={20} color="#4caf50" />
              ) : validationResults.alternate.isAvailable === false ? (
                <TouchableOpacity onPress={onClearAlternate}>
                  <Icon name="close" size={20} color="#d32f2f" />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
          {(errors.AlternateNumber || validationResults.alternate.isAvailable === false || validationResults.alternate.loading) && (
            <HelperText 
              type={errors.AlternateNumber || validationResults.alternate.isAvailable === false ? "error" : "info"} 
              visible={true}
            >
              {errors.AlternateNumber ||
                (validationResults.alternate.loading ? "Checking availability..." :
                  validationResults.alternate.error ||
                  (validationResults.alternate.isAvailable ? "Alternate number is available" : "Alternate number is already taken"))}
            </HelperText>
          )}
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
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
  },
  required: {
    color: '#d32f2f',
  },
  inputWrapper: {
    position: 'relative',
    width: '100%',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    width: '100%',
    color: '#000',
  },
  inputError: {
    borderColor: '#d32f2f',
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
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    textAlign: 'center',
    color: '#000',
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
    borderColor: '#666',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  radioSelected: {
    borderColor: '#1976d2',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1976d2',
  },
  radioText: {
    fontSize: 16,
    color: '#000',
  },
});

export default BasicInformation;