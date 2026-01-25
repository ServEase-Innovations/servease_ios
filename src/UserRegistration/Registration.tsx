import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
  Image,
  Modal,
  Button,
  Linking,
} from 'react-native';
import { CheckBox } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { launchImageLibrary } from 'react-native-image-picker';
import axiosInstance from '../services/axiosInstance';
import axios from 'axios';
import Geolocation from '@react-native-community/geolocation';
import Geocoder from 'react-native-geocoding';
import { PERMISSIONS, request, RESULTS } from 'react-native-permissions';
import { NativeModules } from 'react-native';

// Initialize Geocoder with your API key
Geocoder.init('AIzaSyBWoIIAX-gE7fvfAkiquz70WFgDaL7YXSk');

// Define the shape of formData using an interface
interface FormData {
  firstName: string;
  middleName: string;
  lastName: string;
  emailId: string;
  password: string;
  confirmPassword: string;
  mobileNo: string;
  gender: string;
  address: string;
  locality: string;
  street: string;
  pincode: string;
  buildingName: string;
  currentLocation: string;
  agreeToTerms: boolean;
  hobbies: string;
  language: string;
  profilePic: string;
  latitude?: number;
  longitude?: number;
}

// Define the shape of errors to hold string messages
interface FormErrors {
  firstName?: string;
  lastName?: string;
  emailId?: string;
  password?: string;
  confirmPassword?: string;
  mobileNo?: string;
  gender?: string;
  address?: string;
  locality?: string;
  street?: string;
  pincode?: string;
  buildingName?: string;
  currentLocation?: string;
  agreeToTerms?: string;
}

// Regex for validation
const nameRegex = /^[A-Za-z\s]+$/;
const emailIdRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Z|a-z]{2,}$/;
const strongPasswordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const phoneRegex = /^[0-9]{10}$/;
const pincodeRegex = /^[0-9]{6}$/;

const steps = ['Basic Info', 'Address', 'Additional Details', 'Confirmation'];

interface RegistrationProps {
  onBackToLogin: (data: boolean) => void;
}

const Registration: React.FC<RegistrationProps> = ({ onBackToLogin }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<any>(null);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [address, setAddress] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [showGPSButton, setShowGPSButton] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    middleName: '',
    lastName: '',
    emailId: '',
    password: '',
    confirmPassword: '',
    mobileNo: '',
    gender: '',
    address: '',
    locality: '',
    street: '',
    pincode: '',
    buildingName: '',
    currentLocation: '',
    agreeToTerms: false,
    hobbies: '',
    language: '',
    profilePic: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const availableLanguages = [
    'Assamese',
    'Bengali',
    'Gujarati',
    'Hindi',
    'Kannada',
    'Kashmiri',
    'Marathi',
    'Malayalam',
    'Oriya',
    'Punjabi',
    'Sanskrit',
    'Tamil',
    'Telugu',
    'Urdu',
    'Sindhi',
    'Konkani',
    'Nepali',
    'Manipuri',
    'Bodo',
    'Dogri',
    'Maithili',
    'Santhali',
  ];

  const requestLocationPermission = async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'android') {
        const [fineStatus, coarseStatus] = await Promise.all([
          request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION),
          request(PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION),
        ]);

        if (Platform.Version >= 31) {
          await request(PERMISSIONS.ANDROID.BLUETOOTH_SCAN);
        }

        return fineStatus === RESULTS.GRANTED || coarseStatus === RESULTS.GRANTED;
      } else {
        const iosStatus = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
        return iosStatus === RESULTS.GRANTED;
      }
    } catch (err) {
      console.warn('Permission request error:', err);
      return false;
    }
  };

  const checkLocationAccuracy = async (): Promise<void> => {
    if (Platform.OS === 'android') {
      try {
        const locationMode = await NativeModules.LocationSettings.getLocationMode();
        
        if (locationMode !== 'high_accuracy') {
          Alert.alert(
            'High Accuracy Recommended',
            'For best results, please enable high accuracy location mode in your device settings.',
            [
              {
                text: 'Open Settings',
                onPress: () => NativeModules.LocationSettings.openLocationSettings(),
              },
              { text: 'Continue Anyway', onPress: () => {} },
            ]
          );
        }
      } catch (err) {
        console.warn('Error checking location accuracy:', err);
      }
    }
  };

  const checkLocationServices = async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'android') {
        return await NativeModules.LocationSettings.checkLocationServices();
      }
      return true;
    } catch (err) {
      console.warn('Error checking location services:', err);
      return false;
    }
  };

  const getAddressFromCoords = async (lat: number, lon: number) => {
    try {
      const res = await Geocoder.from(lat, lon);
      const addressComponent = res.results?.[0]?.formatted_address;
      const addressParts = res.results?.[0]?.address_components || [];
      
      if (addressComponent) {
        setAddress(addressComponent);
        
        // Extract address components
        let street = '';
        let locality = '';
        let pincode = '';
        
        addressParts.forEach(component => {
          if (component.types.includes('route')) {
            street = component.long_name;
          }
          if (component.types.includes('locality')) {
            locality = component.long_name;
          }
          if (component.types.includes('postal_code')) {
            pincode = component.long_name;
          }
        });
        
        // Update form data with extracted components
        setFormData(prev => ({
          ...prev,
          address: addressComponent,
          street: street || prev.street,
          locality: locality || prev.locality,
          pincode: pincode || prev.pincode,
          currentLocation: addressComponent,
          latitude: lat,
          longitude: lon
        }));
      }
    } catch (error) {
      console.warn('Geocoder error:', error);
    }
  };

  const fetchLocation = () => {
    setLocationLoading(true);
    setShowGPSButton(false);
    
    Geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        setLatitude(latitude);
        setLongitude(longitude);
        getAddressFromCoords(latitude, longitude);
        setLocationLoading(false);
      },
      error => {
        console.warn('Location fetch error:', error);
        setLocationLoading(false);
        setShowGPSButton(true);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const fetchLocationWithChecks = async () => {
    setLocationLoading(true);
    
    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Location access is required for this feature. Please enable it in settings.',
          [
            {
              text: 'Open Settings',
              onPress: () => NativeModules.LocationSettings.openLocationSettings(),
            },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
        return;
      }

      const servicesEnabled = await checkLocationServices();
      if (!servicesEnabled) {
        Alert.alert(
          'Location Services Disabled',
          'Please enable location services to continue.',
          [
            {
              text: 'Enable',
              onPress: () => NativeModules.LocationSettings.showLocationSettingsDialog(),
            },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
        setShowGPSButton(true);
        return;
      }

      await checkLocationAccuracy();
      fetchLocation();
    } catch (error) {
      console.warn('Location fetch error:', error);
      setShowGPSButton(true);
    } finally {
      setLocationLoading(false);
    }
  };

  const handleOpenSettings = async () => {
    await Linking.openSettings();
    fetchLocationWithChecks();
  };

  const handleBackLogin = () => {
    onBackToLogin(true);
  };

  const handleImageSelect = () => {
    launchImageLibrary({ mediaType: 'photo' }, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        console.log('ImagePicker Error: ', response.errorMessage);
      } else if (response.assets && response.assets.length > 0) {
        const source = { uri: response.assets[0].uri };
        setImage(source);
      }
    });
  };

  const handleRealTimeValidation = (name: string, value: string) => {
    // Password field validation
    if (name === 'password') {
      if (value.length < 8) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          password: 'Password must be at least 8 characters long.',
        }));
      } else if (!/[A-Z]/.test(value)) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          password: 'Password must contain at least one uppercase letter.',
        }));
      } else if (!/[a-z]/.test(value)) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          password: 'Password must contain at least one lowercase letter.',
        }));
      } else if (!/[0-9]/.test(value)) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          password: 'Password must contain at least one digit.',
        }));
      } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          password: 'Password must contain at least one special character.',
        }));
      } else {
        setErrors((prevErrors) => ({
          ...prevErrors,
          password: '',
        }));
      }
    }

    // Confirm Password field validation
    if (name === 'confirmPassword') {
      if (value !== formData.password) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          confirmPassword: 'Passwords do not match',
        }));
      } else {
        setErrors((prevErrors) => ({
          ...prevErrors,
          confirmPassword: '',
        }));
      }
    }

    // Email field validation
    if (name === 'emailId') {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(value)) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          emailId: 'Please enter a valid email address.',
        }));
      } else {
        setErrors((prevErrors) => ({
          ...prevErrors,
          emailId: '',
        }));
      }
    }

    // Mobile number field validation
    if (name === 'mobileNo') {
      const mobilePattern = /^[0-9]{10}$/;
      if (!mobilePattern.test(value)) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          mobileNo: 'Please enter a valid 10-digit mobile number.',
        }));
      } else {
        setErrors((prevErrors) => ({
          ...prevErrors,
          mobileNo: '',
        }));
      }
    }

    // Pincode field validation
    if (name === 'pincode') {
      const pincodePattern = /^[0-9]{6}$/;
      if (!pincodePattern.test(value)) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          pincode: 'Pincode must be exactly 6 digits.',
        }));
      } else {
        setErrors((prevErrors) => ({
          ...prevErrors,
          pincode: '',
        }));
      }
    }

    // Update the formData state
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleChange = (name: string, value: string | boolean) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const validateForm = () => {
    let tempErrors: FormErrors = {};

    if (activeStep === 0) {
      if (!formData.firstName || !nameRegex.test(formData.firstName)) {
        tempErrors.firstName =
          'First Name is required and should contain only alphabets.';
      }
      if (!formData.lastName || !nameRegex.test(formData.lastName)) {
        tempErrors.lastName =
          'Last Name is required and should contain only alphabets.';
      }
      if (!formData.emailId || !emailIdRegex.test(formData.emailId)) {
        tempErrors.emailId = 'Valid email is required.';
      }
      if (!formData.password || !strongPasswordRegex.test(formData.password)) {
        tempErrors.password = 'Password is required.';
      }
      if (formData.password !== formData.confirmPassword) {
        tempErrors.confirmPassword = 'Passwords do not match.';
      }
      if (!formData.mobileNo || !phoneRegex.test(formData.mobileNo)) {
        tempErrors.mobileNo = 'Phone number is required.';
      }
      if (!formData.gender) {
        tempErrors.gender = 'Select Your Gender.';
      }
    }

    if (activeStep === 1) {
      if (!formData.address) {
        tempErrors.address = 'Address is required.';
      }
      if (!formData.locality) {
        tempErrors.locality = 'City is required.';
      }
      if (!formData.street) {
        tempErrors.street = 'State is required.';
      }
      if (!formData.pincode || !pincodeRegex.test(formData.pincode)) {
        tempErrors.pincode = 'Pincode is required.';
      }
      if (!formData.currentLocation) {
        tempErrors.currentLocation = 'Current Location is required.';
      }
      if (!formData.buildingName) {
        tempErrors.buildingName = 'Building Name is required.';
      }
    }

    if (activeStep === 3) {
      if (!formData.agreeToTerms) {
        tempErrors.agreeToTerms =
          'You must agree to the Terms of Service and Privacy Policy.';
      }
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleNext = () => {
    if (validateForm()) {
      setActiveStep((prevStep) => Math.min(prevStep + 1, steps.length - 1));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      // If image is selected, upload it first
      let profilePicUrl = '';
      if (image) {
        const formDataToSend = new FormData();
        formDataToSend.append('image', {
          uri: image.uri,
          type: 'image/jpeg',
          name: 'profile.jpg',
        });

        // const imageResponse = await axios.post(
        //   'http://65.2.153.173:3000/upload',
        //   formDataToSend,
        //   {
        //     headers: {
        //       'Content-Type': 'multipart/form-data',
        //     },
        //   }
        // );

        // if (imageResponse.status === 200) {
        //   profilePicUrl = imageResponse.data.imageUrl;
        // }
      }

      // Prepare the final data to send
      const finalData = {
        ...formData,
        profilePic: profilePicUrl,
      };

      // Call customer add API
      const response = await axiosInstance.post(
        '/api/customer/add-customer',
        finalData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 201) {
        // Send email if needed
        const emailData = {
          email: formData.emailId,
          name: formData.firstName,
        };

        // await axios.post(
        //   'http://3.110.168.35:3000/send-email',
        //   emailData,
        //   {
        //     headers: {
        //       'Content-Type': 'application/json',
        //     },
        //   }
        // );

        Alert.alert('Success', 'Registration successful!');
        onBackToLogin(true);
      }
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        console.error('Axios error:', {
          message: error.message,
          code: error.code,
          status: error.response?.status,
          data: error.response?.data,
          config: error.config,
        });
      } else {
        console.error('Unexpected error:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <View style={styles.stepContainer}>
            {/* Profile Picture Upload */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Profile Information</Text>
              <TouchableOpacity onPress={handleImageSelect} style={styles.imageUpload}>
                {image ? (
                  <Image source={image} style={styles.profileImage} />
                ) : (
                  <View style={styles.uploadPlaceholder}>
                    <Icon name="add-a-photo" size={30} color="#555" />
                    <Text style={styles.uploadText}>Upload Profile Picture</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Personal Details</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>First Name *</Text>
                <TextInput
                  style={[styles.input, errors.firstName && styles.inputError]}
                  placeholder="Enter your first name"
                  value={formData.firstName}
                  onChangeText={(text) => handleChange('firstName', text)}
                />
                {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Middle Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your middle name"
                  value={formData.middleName}
                  onChangeText={(text) => handleChange('middleName', text)}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Last Name *</Text>
                <TextInput
                  style={[styles.input, errors.lastName && styles.inputError]}
                  placeholder="Enter your last name"
                  value={formData.lastName}
                  onChangeText={(text) => handleChange('lastName', text)}
                />
                {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Gender *</Text>
                <View style={styles.radioGroup}>
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => handleChange('gender', 'MALE')}
                  >
                    <View style={styles.radioCircle}>
                      {formData.gender === 'MALE' && <View style={styles.selectedRb} />}
                    </View>
                    <Text style={styles.radioText}>Male</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => handleChange('gender', 'FEMALE')}
                  >
                    <View style={styles.radioCircle}>
                      {formData.gender === 'FEMALE' && <View style={styles.selectedRb} />}
                    </View>
                    <Text style={styles.radioText}>Female</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => handleChange('gender', 'OTHERS')}
                  >
                    <View style={styles.radioCircle}>
                      {formData.gender === 'OTHERS' && <View style={styles.selectedRb} />}
                    </View>
                    <Text style={styles.radioText}>Other</Text>
                  </TouchableOpacity>
                </View>
                {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}
              </View>
            </View>

            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Contact Information</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email *</Text>
                <TextInput
                  style={[styles.input, errors.emailId && styles.inputError]}
                  placeholder="Enter your email address"
                  keyboardType="email-address"
                  value={formData.emailId}
                  onChangeText={(text) => handleRealTimeValidation('emailId', text)}
                />
                {errors.emailId && <Text style={styles.errorText}>{errors.emailId}</Text>}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Mobile Number *</Text>
                <TextInput
                  style={[styles.input, errors.mobileNo && styles.inputError]}
                  placeholder="Enter your 10-digit mobile number"
                  keyboardType="phone-pad"
                  value={formData.mobileNo}
                  onChangeText={(text) => handleRealTimeValidation('mobileNo', text)}
                />
                {errors.mobileNo && <Text style={styles.errorText}>{errors.mobileNo}</Text>}
              </View>
            </View>

            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Account Security</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password *</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, errors.password && styles.inputError]}
                    placeholder="Create a strong password"
                    secureTextEntry={!showPassword}
                    value={formData.password}
                    onChangeText={(text) => handleRealTimeValidation('password', text)}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Icon name={showPassword ? 'visibility-off' : 'visibility'} size={20} />
                  </TouchableOpacity>
                </View>
                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                <Text style={styles.passwordHint}>
                  Password must contain at least 8 characters, including uppercase, lowercase, number, and special character
                </Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Confirm Password *</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, errors.confirmPassword && styles.inputError]}
                    placeholder="Re-enter your password"
                    secureTextEntry={!showConfirmPassword}
                    value={formData.confirmPassword}
                    onChangeText={(text) => handleRealTimeValidation('confirmPassword', text)}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Icon name={showConfirmPassword ? 'visibility-off' : 'visibility'} size={20} />
                  </TouchableOpacity>
                </View>
                {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
              </View>
            </View>
          </View>
        );
      case 1:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Address Information</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Full Address *</Text>
                <TextInput
                  style={[styles.input, errors.address && styles.inputError]}
                  placeholder="Enter your full address"
                  value={formData.address}
                  onChangeText={(text) => handleChange('address', text)}
                  multiline
                  numberOfLines={3}
                />
                {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Locality*</Text>
                <TextInput
                  style={[styles.input, errors.locality && styles.inputError]}
                  placeholder="Enter your city"
                  value={formData.locality}
                  onChangeText={(text) => handleChange('locality', text)}
                />
                {errors.locality && <Text style={styles.errorText}>{errors.locality}</Text>}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Street*</Text>
                <TextInput
                  style={[styles.input, errors.street && styles.inputError]}
                  placeholder="Enter your state"
                  value={formData.street}
                  onChangeText={(text) => handleChange('street', text)}
                />
                {errors.street && <Text style={styles.errorText}>{errors.street}</Text>}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Pincode *</Text>
                <TextInput
                  style={[styles.input, errors.pincode && styles.inputError]}
                  placeholder="Enter 6-digit pincode"
                  keyboardType="number-pad"
                  value={formData.pincode}
                  onChangeText={(text) => handleRealTimeValidation('pincode', text)}
                />
                {errors.pincode && <Text style={styles.errorText}>{errors.pincode}</Text>}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Building Name *</Text>
                <TextInput
                  style={[styles.input, errors.buildingName && styles.inputError]}
                  placeholder="Enter building name"
                  value={formData.buildingName}
                  onChangeText={(text) => handleChange('buildingName', text)}
                />
                {errors.buildingName && <Text style={styles.errorText}>{errors.buildingName}</Text>}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Current Location *</Text>
                <TextInput
                  style={[styles.input, errors.currentLocation && styles.inputError]}
                  placeholder="Enter your current location"
                  value={formData.currentLocation}
                  onChangeText={(text) => handleChange('currentLocation', text)}
                />
                {errors.currentLocation && <Text style={styles.errorText}>{errors.currentLocation}</Text>}
              </View>

              <TouchableOpacity
                style={styles.fetchLocationButton}
                onPress={fetchLocationWithChecks}
                disabled={locationLoading}
              >
                {locationLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.fetchLocationText}>Fetch Current Location</Text>
                )}
              </TouchableOpacity>

              {/* Location Modal */}
              <Modal
                animationType="slide"
                transparent={true}
                visible={locationModalVisible}
                onRequestClose={() => setLocationModalVisible(false)}
              >
                <View style={styles.modalContainer}>
                  <View style={styles.modalContent}>
                    <Text style={styles.locationTitleText}>Location Details</Text>
                    
                    {locationLoading ? (
                      <View style={styles.statusContainer}>
                        <ActivityIndicator size="large" color="#007BFF" />
                        <Text style={styles.statusText}>Getting your location...</Text>
                      </View>
                    ) : showGPSButton ? (
                      <View style={styles.statusContainer}>
                        <Icon name="location-off" size={50} color="red" />
                        <Text style={styles.statusText}>Location services are disabled</Text>
                        <View style={styles.button}>
                          <Button
                            title="Enable Location Services"
                            onPress={handleOpenSettings}
                            color="#007BFF"
                          />
                        </View>
                      </View>
                    ) : (
                      <>
                        <View style={styles.infoBox}>
                          <Text style={styles.text}>Address: {formData.address}</Text>
                          <Text style={styles.text}>Locality: {formData.locality}</Text>
                          <Text style={styles.text}>Street: {formData.street}</Text>
                          <Text style={styles.text}>Pincode: {formData.pincode}</Text>
                        </View>

                        <View style={styles.buttonRow}>
                          <View style={styles.button}>
                            <Button
                              title="Refresh Location"
                              onPress={fetchLocationWithChecks}
                              color="#6c757d"
                            />
                          </View>
                          <View style={styles.button}>
                            <Button
                              title="Use This Location"
                              onPress={() => setLocationModalVisible(false)}
                              color="#28a745"
                            />
                          </View>
                        </View>
                      </>
                    )}
                  </View>
                </View>
              </Modal>
            </View>
          </View>
        );
      case 2:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Additional Information</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Hobbies</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your hobbies (separated by commas)"
                  value={formData.hobbies}
                  onChangeText={(text) => handleChange('hobbies', text)}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Languages Known</Text>
                <Text style={styles.inputSubLabel}>Select all that apply</Text>
                <View style={styles.chipContainer}>
                  {availableLanguages.map((lang) => (
                    <TouchableOpacity
                      key={lang}
                      style={[
                        styles.chip,
                        formData.language.includes(lang) && styles.chipSelected,
                      ]}
                      onPress={() => {
                        const langs = formData.language.split(',').filter(l => l);
                        if (langs.includes(lang)) {
                          handleChange(
                            'language',
                            langs.filter(l => l !== lang).join(',')
                          );
                        } else {
                          handleChange('language', [...langs, lang].join(','));
                        }
                      }}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          formData.language.includes(lang) && styles.chipTextSelected,
                        ]}
                      >
                        {lang}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>
        );
      case 3:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Review Your Information</Text>
              <Text style={styles.confirmationText}>
                Please review all the information you've entered before submitting.
              </Text>

              <View style={styles.summaryContainer}>
                <Text style={styles.summaryTitle}>Personal Details</Text>
                <Text style={styles.summaryText}>Name: {`${formData.firstName} ${formData.middleName} ${formData.lastName}`}</Text>
                <Text style={styles.summaryText}>Gender: {formData.gender}</Text>
                <Text style={styles.summaryText}>Email: {formData.emailId}</Text>
                <Text style={styles.summaryText}>Phone: {formData.mobileNo}</Text>

                <Text style={[styles.summaryTitle, { marginTop: 15 }]}>Address</Text>
                <Text style={styles.summaryText}>Address: {formData.address}</Text>
                <Text style={styles.summaryText}>City: {formData.locality}</Text>
                <Text style={styles.summaryText}>State: {formData.street}</Text>
                <Text style={styles.summaryText}>Pincode: {formData.pincode}</Text>
                <Text style={styles.summaryText}>Building: {formData.buildingName}</Text>
                {formData.latitude && formData.longitude && (
                  <Text style={styles.summaryText}>Location: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}</Text>
                )}

                {formData.hobbies && (
                  <>
                    <Text style={[styles.summaryTitle, { marginTop: 15 }]}>Hobbies</Text>
                    <Text style={styles.summaryText}>{formData.hobbies}</Text>
                  </>
                )}

                {formData.language && (
                  <>
                    <Text style={[styles.summaryTitle, { marginTop: 15 }]}>Languages</Text>
                    <Text style={styles.summaryText}>{formData.language.replace(/,/g, ', ')}</Text>
                  </>
                )}
              </View>

              <CheckBox
                title="I agree to the Terms of Service and Privacy Policy"
                checked={formData.agreeToTerms}
                onPress={() => handleChange('agreeToTerms', !formData.agreeToTerms)}
                containerStyle={styles.checkboxContainer}
                textStyle={styles.checkboxText}
              />
              {errors.agreeToTerms && <Text style={styles.errorText}>{errors.agreeToTerms}</Text>}
            </View>
          </View>
        );
      default:
        return <Text>Unknown step</Text>;
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>User Registration</Text>

      {/* Stepper */}
      <View style={styles.stepper}>
        {steps.map((label, index) => (
          <View key={index} style={styles.step}>
            <View
              style={[
                styles.stepCircle,
                activeStep >= index && styles.activeStepCircle,
              ]}
            >
              {activeStep > index ? (
                <Icon name="check" size={16} color="#fff" />
              ) : (
                <Text style={styles.stepNumber}>{index + 1}</Text>
              )}
            </View>
            <Text
              style={[
                styles.stepLabel,
                activeStep >= index && styles.activeStepLabel,
              ]}
            >
              {label}
            </Text>
            {index < steps.length - 1 && (
              <View
                style={[
                  styles.stepConnector,
                  activeStep > index && styles.activeStepConnector,
                ]}
              />
            )}
          </View>
        ))}
      </View>

      {/* Form Content */}
      {renderStepContent(activeStep)}

      {/* Navigation Buttons */}
      <View style={styles.buttonContainer}>
        {activeStep > 0 && (
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Icon name="arrow-back" size={20} color="#fff" />
            <Text style={styles.buttonText}>Back</Text>
          </TouchableOpacity>
        )}

        {activeStep < steps.length - 1 ? (
          <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
            <Text style={styles.buttonText}>Next</Text>
            <Icon name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        ) : (
      
          <TouchableOpacity
  onPress={handleSubmit}
  style={styles.submitButton}
>
  <Text style={styles.buttonText}>Submit</Text>
</TouchableOpacity>

        )}
      </View>

      <View style={styles.loginLinkContainer}>
        <Text style={styles.loginText}>Already have an account? </Text>
        <TouchableOpacity onPress={handleBackLogin}>
          <Text style={styles.loginLink}>Sign in</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#f9f9f9',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  stepper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  step: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeStepCircle: {
    backgroundColor: '#1976d2',
  },
  stepNumber: {
    color: '#757575',
    fontWeight: 'bold',
  },
  stepLabel: {
    marginTop: 5,
    fontSize: 12,
    color: '#757575',
    textAlign: 'center',
  },
  activeStepLabel: {
    color: '#1976d2',
    fontWeight: 'bold',
  },
  stepConnector: {
    position: 'absolute',
    top: 15,
    left: '50%',
    right: '-50%',
    height: 2,
    backgroundColor: '#e0e0e0',
    zIndex: -1,
  },
  activeStepConnector: {
    backgroundColor: '#1976d2',
  },
  stepContainer: {
    marginBottom: 20,
  },
  sectionContainer: {
    marginBottom: 25,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
    color: '#555',
  },
  inputSubLabel: {
    fontSize: 12,
    color: '#777',
    marginBottom: 5,
  },
  input: {
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    fontSize: 14,
    color: '#000',
  },
  inputError: {
    borderColor: '#f44336',
  },
  errorText: {
    color: '#f44336',
    fontSize: 12,
    marginTop: 5,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    fontStyle: 'italic',
  },
  eyeIcon: {
    position: 'absolute',
    right: 10,
    top: 10,
  },
  radioGroup: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 15,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  radioCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#1976d2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 5,
  },
  selectedRb: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1976d2',
  },
  radioText: {
    fontSize: 14,
    color: '#333',
  },
  fetchLocationButton: {
    backgroundColor: '#1976d2',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 10,
  },
  fetchLocationText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: {
    backgroundColor: '#1976d2',
  },
  chipText: {
    fontSize: 12,
    color: '#333',
  },
  chipTextSelected: {
    color: '#fff',
  },
  confirmationText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#555',
    lineHeight: 22,
  },
  summaryContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    padding: 15,
    marginBottom: 15,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  summaryText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 3,
    lineHeight: 20,
  },
  checkboxContainer: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
    marginLeft: 0,
    marginRight: 0,
    marginBottom: 15,
  },
  checkboxText: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#757575',
    padding: 12,
    borderRadius: 4,
    minWidth: 100,
    justifyContent: 'center',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1976d2',
    padding: 12,
    borderRadius: 4,
    minWidth: 100,
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  submitButton: {
    backgroundColor: '#4caf50',
    padding: 12,
    borderRadius: 4,
    minWidth: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginHorizontal: 5,
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    fontSize: 14,
    color: '#555',
  },
  loginLink: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: 'bold',
  },
  imageUpload: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 15,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  uploadPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText:{
fontSize: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  locationTitleText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  statusContainer: {
    alignItems: 'center',
    padding: 20,
  },
  statusText: {
    marginTop: 10,
    textAlign: 'center',
  },
  infoBox: {
    marginBottom: 20,
  },
  text: {
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
});

export default Registration;