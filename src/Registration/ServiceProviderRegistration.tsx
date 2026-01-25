import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import moment from "moment";
import Icon from "react-native-vector-icons/MaterialIcons";
import { debounce } from "../utils/debounce";
import { useFieldValidation } from "../hooks/useFieldValidation";
import ProfileImageUpload from "./ProfileImageUpload";
import CustomFileInput from "./CustomFileInput";
import AddressComponent from "./AddressComponent";
import { TermsCheckboxes } from "../common/TermsCheckboxes";
// import Button from "../common/Button";
import axiosInstance from "../services/axiosInstance";

// Define proper file interface for React Native
interface RNFile {
  name: string;
  type: string;
  uri: string;
  size?: number | null;
}

// Define the shape of formData using an interface
interface FormData {
  firstName: string;
  middleName: string;
  lastName: string;
  gender: string;
  emailId: string;
  password: string;
  confirmPassword: string;
  mobileNo: string;
  AlternateNumber: string;
  buildingName: string;
  locality: string;
  street: string;
  currentLocation: string;
  nearbyLocation: string;
  pincode: string;
  latitude: number;
  longitude: number;
  AADHAR: string;
  pan: string;
  panImage: RNFile | null;
  housekeepingRole: string;
  description: string;
  experience: string;
  kyc: string;
  documentImage: RNFile | null;
  otherDetails: string;
  profileImage: RNFile | null;
  cookingSpeciality: string;
  age: string;
  diet: string;
  dob: string;
  profilePic: string;
  timeslot: string;
  referralCode: string;
  agreeToTerms: boolean;
  terms: boolean;
  privacy: boolean;
  keyFacts: boolean;
  permanentAddress: {
    apartment: string;
    street: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
  };
  correspondenceAddress: {
    apartment: string;
    street: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
  };
}

// Define the shape of errors to hold string messages
interface FormErrors {
  firstName?: string;
  lastName?: string;
  gender?: string;
  emailId?: string;
  password?: string;
  confirmPassword?: string;
  mobileNo?: string;
  AlternateNumber?: string;
  buildingName?: string;
  locality?: string;
  street?: string;
  currentLocation?: string;
  pincode?: string;
  AADHAR?: string;
  pan?: string;
  agreeToTerms?: string;
  terms?: string;
  privacy?: string;
  keyFacts?: string;
  housekeepingRole?: string;
  description?: string;
  experience?: string;
  kyc?: string;
  documentImage?: string;
  cookingSpeciality?: string;
  diet?: string;
  permanentAddress?: {
    apartment?: string;
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
  };
  correspondenceAddress?: {
    apartment?: string;
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
  };
}

// Regex for validation
const nameRegex = /^[A-Za-z]+(?:[ ][A-Za-z]+)*$/;
const emailIdRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Z|a-z]{2,}$/;
const strongPasswordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const phoneRegex = /^[0-9]{10}$/;
const pincodeRegex = /^[0-9]{6}$/;
const aadhaarRegex = /^[0-9]{12}$/;
const MAX_NAME_LENGTH = 30;

const steps = [
  "Basic Information",
  "Address Information",
  "Additional Details",
  "KYC Verification",
  "Confirmation",
];

interface RegistrationProps {
  onBackToLogin: (data: boolean) => void;
}

const ServiceProviderRegistration: React.FC<RegistrationProps> = ({
  onBackToLogin,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [isFieldsDisabled, setIsFieldsDisabled] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error" | "warning">("success");
  const [sliderDisabled, setSliderDisabled] = useState(true);
  const [sliderValueMorning, setSliderValueMorning] = useState([6, 12]);
  const [sliderValueEvening, setSliderValueEvening] = useState([12, 20]);
  const [isCookSelected, setIsCookSelected] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
  } | null>(null);
  const [modalVisible, setModalVisible] = useState(true);

  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    middleName: "",
    lastName: "",
    gender: "",
    emailId: "",
    password: "",
    confirmPassword: "",
    mobileNo: "",
    AlternateNumber: "",
    buildingName: "",
    locality: "",
    street: "",
    currentLocation: "",
    nearbyLocation: "",
    pincode: "",
    latitude: 0,
    longitude: 0,
    AADHAR: "",
    pan: "",
    panImage: null,
    housekeepingRole: "",
    description: "",
    experience: "",
    kyc: "AADHAR",
    documentImage: null,
    otherDetails: "",
    profileImage: null,
    cookingSpeciality: "",
    age: "",
    diet: "",
    dob: "",
    profilePic: "",
    timeslot: "06:00-20:00",
    referralCode: "",
    agreeToTerms: false,
    terms: false,
    privacy: false,
    keyFacts: false,
    permanentAddress: {
      apartment: "",
      street: "",
      city: "",
      state: "",
      country: "",
      pincode: ""
    },
    correspondenceAddress: {
      apartment: "",
      street: "",
      city: "",
      state: "",
      country: "",
      pincode: ""
    },
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [image, setImage] = useState<RNFile | null>(null);

  const { validationResults, validateField, resetValidation } = useFieldValidation();

  const handleImageSelect = (file: RNFile | null) => {
    if (file) {
      setImage(file);
      setFormData(prev => ({ ...prev, profileImage: file }));
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleToggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddressChange = (type: 'permanent' | 'correspondence', data: any) => {
    setFormData(prev => ({
      ...prev,
      [type === 'permanent' ? 'permanentAddress' : 'correspondenceAddress']: data
    }));
  };

  // Add debounced validation functions
  const debouncedEmailValidation = useCallback(
    debounce((email: string) => {
      validateField('email', email);
    }, 500),
    [validateField]
  );

  const debouncedMobileValidation = useCallback(
    debounce((mobile: string) => {
      validateField('mobile', mobile);
    }, 500),
    [validateField]
  );

  const debouncedAlternateValidation = useCallback(
    debounce((alternate: string) => {
      validateField('alternate', alternate);
    }, 500),
    [validateField]
  );

  const handleRealTimeValidation = (name: string, value: string) => {
    const aadhaarPattern = /^[0-9]{12}$/;

    if (name === "firstName") {
      const trimmedValue = value.trim();
      if (!trimmedValue) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          firstName: "First Name is required.",
        }));
      } else if (!nameRegex.test(trimmedValue)) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          firstName: "First Name should contain only alphabets.",
        }));
      } else if (trimmedValue.length > MAX_NAME_LENGTH) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          firstName: `First Name should not exceed ${MAX_NAME_LENGTH} characters.`,
        }));
      } else {
        setErrors((prevErrors) => ({
          ...prevErrors,
          firstName: "",
        }));
      }
    }

    if (name === "lastName") {
      if (!value.trim()) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          lastName: "Last Name is required.",
        }));
      } else if (!nameRegex.test(value.trim())) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          lastName: "Last Name should contain only alphabets.",
        }));
      } else if (value.length > MAX_NAME_LENGTH) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          lastName: `Last Name should not exceed ${MAX_NAME_LENGTH} characters.`,
        }));
      } else {
        setErrors((prevErrors) => ({
          ...prevErrors,
          lastName: "",
        }));
      }
    }

    if (name === "password") {
      if (value.length < 8) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          password: "Password must be at least 8 characters long.",
        }));
      } else if (!/[A-Z]/.test(value)) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          password: "Password must contain at least one uppercase letter.",
        }));
      } else if (!/[a-z]/.test(value)) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          password: "Password must contain at least one lowercase letter.",
        }));
      } else if (!/[0-9]/.test(value)) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          password: "Password must contain at least one digit.",
        }));
      } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          password: "Password must contain at least one special character.",
        }));
      } else {
        setErrors((prevErrors) => ({
          ...prevErrors,
          password: "",
        }));
      }
    }

    if (name === "confirmPassword") {
      if (value !== formData.password) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          confirmPassword: "Passwords do not match",
        }));
      } else {
        setErrors((prevErrors) => ({
          ...prevErrors,
          confirmPassword: "",
        }));
      }
    }

    if (name === "emailId") {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(value)) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          emailId: "Please enter a valid email address.",
        }));
        resetValidation('email');
      } else {
        setErrors((prevErrors) => ({
          ...prevErrors,
          emailId: "",
        }));
        debouncedEmailValidation(value);
      }
    }

    if (name === "mobileNo") {
      const mobilePattern = /^[0-9]{10}$/;
      if (!mobilePattern.test(value)) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          mobileNo: "Please enter a valid 10-digit mobile number.",
        }));
        resetValidation('mobile');
      } else {
        setErrors((prevErrors) => ({
          ...prevErrors,
          mobileNo: "",
        }));
        debouncedMobileValidation(value);
      }
    }

    if (name === "AlternateNumber" && value) {
      const mobilePattern = /^[0-9]{10}$/;
      if (!mobilePattern.test(value)) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          AlternateNumber: "Please enter a valid 10-digit mobile number.",
        }));
        resetValidation('alternate');
      } else {
        setErrors((prevErrors) => ({
          ...prevErrors,
          AlternateNumber: "",
        }));
        debouncedAlternateValidation(value);
      }
    }

    if (name === "AADHAR") {
      if (!aadhaarPattern.test(value)) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          AADHAR: "AADHAR number must be exactly 12 digits.",
        }));
      } else {
        setErrors((prevErrors) => ({
          ...prevErrors,
          AADHAR: "",
        }));
      }
    }

    if (name === "pincode") {
      const numericValue = value.replace(/\D/g, "");
      setFormData((prevData) => ({
        ...prevData,
        [name]: numericValue.slice(0, 6),
      }));

      if (numericValue.length !== 6) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          pincode: "Pincode must be exactly 6 digits.",
        }));
      } else {
        setErrors((prevErrors) => ({
          ...prevErrors,
          pincode: "",
        }));
      }
    }

    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleCookingSpecialityChange = (value: string) => {
    setFormData((prevData) => ({ ...prevData, cookingSpeciality: value }));
  };

  const validateForm = (): boolean => {
    let tempErrors: FormErrors = {};

    if (activeStep === 0) {
      if (!formData.firstName) {
        tempErrors.firstName = "First Name is required.";
      } else if (!nameRegex.test(formData.firstName)) {
        tempErrors.firstName = "First Name should contain only alphabets.";
      } else if (formData.firstName.length > MAX_NAME_LENGTH) {
        tempErrors.firstName = `First Name should be under ${MAX_NAME_LENGTH} characters.`;
      }

      if (!formData.lastName) {
        tempErrors.lastName = "Last Name is required.";
      } else if (!nameRegex.test(formData.lastName)) {
        tempErrors.lastName = "Last Name should contain only alphabets.";
      } else if (formData.lastName.length > MAX_NAME_LENGTH) {
        tempErrors.lastName = `Last Name should be under ${MAX_NAME_LENGTH} characters.`;
      }

      if (!formData.gender) {
        tempErrors.gender = "Please select a gender.";
      }
      if (validationResults.email.error) {
        tempErrors.emailId = validationResults.email.error;
      }
      if (!formData.password || !strongPasswordRegex.test(formData.password)) {
        tempErrors.password = "Password is required.";
      }
      if (formData.password !== formData.confirmPassword) {
        tempErrors.confirmPassword = "Passwords do not match.";
      }
      if (validationResults.mobile.error) {
        tempErrors.mobileNo = validationResults.mobile.error;
      }
    }

    if (activeStep === 1) {
      // Validate permanent address
      if (!formData.permanentAddress.apartment) {
        tempErrors.permanentAddress = { ...tempErrors.permanentAddress, apartment: "Apartment is required." };
      }
      if (!formData.permanentAddress.street) {
        tempErrors.permanentAddress = { ...tempErrors.permanentAddress, street: "Street is required." };
      }
      if (!formData.permanentAddress.city) {
        tempErrors.permanentAddress = { ...tempErrors.permanentAddress, city: "City is required." };
      }
      if (!formData.permanentAddress.state) {
        tempErrors.permanentAddress = { ...tempErrors.permanentAddress, state: "State is required." };
      }
      if (!formData.permanentAddress.country) {
        tempErrors.permanentAddress = { ...tempErrors.permanentAddress, country: "Country is required." };
      }
      if (!formData.permanentAddress.pincode) {
        tempErrors.permanentAddress = { ...tempErrors.permanentAddress, pincode: "Pincode is required." };
      } else if (formData.permanentAddress.pincode.length !== 6) {
        tempErrors.permanentAddress = { ...tempErrors.permanentAddress, pincode: "Pincode must be exactly 6 digits." };
      }

      // Validate correspondence address only if it's different from permanent address
      const isSameAddress = 
        formData.permanentAddress.apartment === formData.correspondenceAddress.apartment &&
        formData.permanentAddress.street === formData.correspondenceAddress.street &&
        formData.permanentAddress.city === formData.correspondenceAddress.city &&
        formData.permanentAddress.state === formData.correspondenceAddress.state &&
        formData.permanentAddress.country === formData.correspondenceAddress.country &&
        formData.permanentAddress.pincode === formData.correspondenceAddress.pincode;

      if (!isSameAddress) {
        if (!formData.correspondenceAddress.apartment) {
          tempErrors.correspondenceAddress = { ...tempErrors.correspondenceAddress, apartment: "Apartment is required." };
        }
        if (!formData.correspondenceAddress.street) {
          tempErrors.correspondenceAddress = { ...tempErrors.correspondenceAddress, street: "Street is required." };
        }
        if (!formData.correspondenceAddress.city) {
          tempErrors.correspondenceAddress = { ...tempErrors.correspondenceAddress, city: "City is required." };
        }
        if (!formData.correspondenceAddress.state) {
          tempErrors.correspondenceAddress = { ...tempErrors.correspondenceAddress, state: "State is required." };
        }
        if (!formData.correspondenceAddress.country) {
          tempErrors.correspondenceAddress = { ...tempErrors.correspondenceAddress, country: "Country is required." };
        }
        if (!formData.correspondenceAddress.pincode) {
          tempErrors.correspondenceAddress = { ...tempErrors.correspondenceAddress, pincode: "Pincode is required." };
        } else if (formData.correspondenceAddress.pincode.length !== 6) {
          tempErrors.correspondenceAddress = { ...tempErrors.correspondenceAddress, pincode: "Pincode must be exactly 6 digits." };
        }
      }
    }

    if (activeStep === 2) {
      if (!formData.housekeepingRole) {
        tempErrors.housekeepingRole = "Please select a service type.";
      }
      if (formData.housekeepingRole === "COOK" && !formData.cookingSpeciality) {
        tempErrors.cookingSpeciality =
          "Please select a speciality for the cook service.";
      }
      if (!formData.diet) {
        tempErrors.diet = "Please select diet.";
      }
      if (!formData.experience) {
        tempErrors.experience = "Please select experience.";
      }
    }

    if (activeStep === 3) {
      if (!formData.AADHAR || !aadhaarRegex.test(formData.AADHAR)) {
        tempErrors.kyc = "Aadhaar number must be exactly 12 digits.";
      }
    }

    if (activeStep === 4) {
      if (!formData.keyFacts) {
        tempErrors.keyFacts = "You must agree to the Key Facts Document";
      }
      if (!formData.terms) {
        tempErrors.terms = "You must agree to the Terms and Conditions";
      }
      if (!formData.privacy) {
        tempErrors.privacy = "You must agree to the Privacy Policy";
      }
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      setActiveStep((prevStep) => Math.min(prevStep + 1, steps.length - 1));
      if (activeStep === steps.length - 1) {
        setSnackbarMessage("Registration Successful!");
        setSnackbarOpen(true);
      }
    }
  };

  const handleChangeCheckbox = (name: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleBack = () => {
    if (activeStep === 0) {
      onBackToLogin(true);
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (activeStep !== steps.length - 1) return;

    if (validateForm()) {
      try {
        let profilePicUrl = "";
        
        if (image) {
          const formData1 = new FormData();
          formData1.append("image", {
            uri: image.uri,
            type: image.type,
            name: image.name,
          } as any);

          const imageResponse = await axiosInstance.post(
            "http://65.2.153.173:3000/upload",
            formData1,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          );

          if (imageResponse.status === 200) {
            profilePicUrl = imageResponse.data.imageUrl;
          }
        }

        // Prepare the payload with conditional cookingSpeciality
        const payload = {
          firstName: formData.firstName,
          middleName: formData.middleName,
          lastName: formData.lastName,
          mobileNo: parseInt(formData.mobileNo) || 0,
          alternateNo: parseInt(formData.AlternateNumber) || 0,
          emailId: formData.emailId,
          gender: formData.gender,
          buildingName: formData.buildingName,
          locality: formData.locality,
          latitude: currentLocation?.latitude || formData.latitude,
          longitude: currentLocation?.longitude || formData.longitude,
          street: formData.street,
          pincode: parseInt(formData.pincode) || 0,
          currentLocation: formData.currentLocation,
          nearbyLocation: formData.nearbyLocation,
          location: formData.currentLocation,
          housekeepingRole: formData.housekeepingRole,
          diet: formData.diet,
          ...(formData.housekeepingRole === "COOK" && { 
            cookingSpeciality: formData.cookingSpeciality 
          }),
          timeslot: formData.timeslot,
          expectedSalary: 0,
          experience: parseInt(formData.experience) || 0,
          username: formData.emailId,
          password: formData.password,
          privacy: formData.privacy,
          keyFacts: formData.keyFacts,
          permanentAddress: {
            field1: formData.permanentAddress.apartment,
            field2: formData.permanentAddress.street,
            ctArea: formData.permanentAddress.city,
            pinNo: formData.permanentAddress.pincode,
            state: formData.permanentAddress.state,
            country: formData.permanentAddress.country
          },
          correspondenceAddress: {
            field1: formData.correspondenceAddress.apartment,
            field2: formData.correspondenceAddress.street,
            ctArea: formData.correspondenceAddress.city,
            pinNo: formData.correspondenceAddress.pincode,
            state: formData.correspondenceAddress.state,
            country: formData.correspondenceAddress.country
          },
          active: true,
          kyc: formData.kyc,
          dob: formData.dob
        };

        const response = await axiosInstance.post(
          "/api/serviceproviders/serviceprovider/add",
          payload,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        setSnackbarOpen(true);
        setSnackbarSeverity("success");
        setSnackbarMessage("Service provider added successfully!");

        // Create Auth0 user
        const authPayload = {
          email: formData.emailId,
          password: formData.password,
          name: `${formData.firstName} ${formData.lastName}`,
        };

        // Note: You'll need to implement this API call properly
        // axios.post('https://utils-ndt3.onrender.com/authO/create-autho-user', authPayload)
        //   .then((authResponse) => {
        //     console.log("AuthO user created successfully:", authResponse.data);
        //   }).catch((authError) => {
        //     console.error("Error creating AuthO user:", authError);
        //   });
        
        setTimeout(() => {
          onBackToLogin(true);
        }, 3000);
      } catch (error) {
        setSnackbarOpen(true);
        setSnackbarSeverity("error");
        setSnackbarMessage("Failed to add service provider. Please try again.");
        console.error("Error submitting form:", error);
      }
    } else {
      setSnackbarOpen(true);
      setSnackbarSeverity("warning");
      setSnackbarMessage("Please fill out all required fields.");
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const fetchLocationData = async () => {
    // React Native location implementation would go here
    // You would use a library like react-native-geolocation-service
    Alert.alert("Location", "Location fetch functionality would be implemented here");
  };

  const validateAge = (dob: string) => {
    if (!dob) return false;
    const birthDate = moment(dob, "YYYY-MM-DD");
    const today = moment();
    const age = today.diff(birthDate, "years");
    return age >= 18;
  };

  const handleDOBChange = (dob: string) => {
    setFormData((prev) => ({ ...prev, dob }));
    const isValidAge = validateAge(dob);

    if (!isValidAge) {
      setIsFieldsDisabled(true);
      Alert.alert("Age Restriction", "You must be at least 18 years old to proceed.");
    } else {
      setIsFieldsDisabled(false);
    }
  };

  const handleTermsChange = useCallback((allAccepted: boolean) => {
    setFormData(prev => ({
      ...prev,
      keyFacts: allAccepted,
      terms: allAccepted,
      privacy: allAccepted,
    }));
  }, []);

  const renderInput = (
    label: string,
    name: string,
    value: string,
    onChange: (text: string) => void,
    error?: string,
    secureTextEntry?: boolean,
    keyboardType: any = "default",
    maxLength?: number,
    showValidation?: boolean
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={[
            styles.input,
            error && styles.inputError,
          ]}
          value={value}
          onChangeText={onChange}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          maxLength={maxLength}
          placeholder={`Enter ${label.toLowerCase()}`}
          editable={!isFieldsDisabled}
        />
        {showValidation && validationResults.email.loading && (
          <ActivityIndicator size="small" style={styles.validationIcon} />
        )}
        {showValidation && validationResults.email.isAvailable && (
          <Icon name="check" size={20} color="green" style={styles.validationIcon} />
        )}
        {showValidation && validationResults.email.isAvailable === false && (
          <Icon name="close" size={20} color="red" style={styles.validationIcon} />
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
      {!error && showValidation && validationResults.email.isAvailable && (
        <Text style={styles.successText}>Email is available</Text>
      )}
    </View>
  );

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <View style={styles.stepContainer}>
            <ProfileImageUpload onImageSelect={handleImageSelect} />
            
            {renderInput(
              "First Name *",
              "firstName",
              formData.firstName,
              (text) => handleRealTimeValidation("firstName", text),
              errors.firstName,
              false,
              "default",
              MAX_NAME_LENGTH
            )}

            {renderInput(
              "Middle Name",
              "middleName",
              formData.middleName,
              (text) => handleChange("middleName", text),
              undefined,
              false
            )}

            {renderInput(
              "Last Name *",
              "lastName",
              formData.lastName,
              (text) => handleRealTimeValidation("lastName", text),
              errors.lastName,
              false,
              "default",
              MAX_NAME_LENGTH
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Date of Birth *</Text>
              <TextInput
                style={styles.input}
                value={formData.dob}
                onChangeText={(text) => handleDOBChange(text)}
                placeholder="YYYY-MM-DD"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Gender *</Text>
              <View style={styles.radioContainer}>
                <TouchableOpacity
                  style={styles.radioOption}
                  onPress={() => handleChange("gender", "MALE")}
                >
                  <View style={[
                    styles.radioCircle,
                    formData.gender === "MALE" && styles.radioSelected
                  ]} />
                  <Text>Male</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.radioOption}
                  onPress={() => handleChange("gender", "FEMALE")}
                >
                  <View style={[
                    styles.radioCircle,
                    formData.gender === "FEMALE" && styles.radioSelected
                  ]} />
                  <Text>Female</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.radioOption}
                  onPress={() => handleChange("gender", "OTHER")}
                >
                  <View style={[
                    styles.radioCircle,
                    formData.gender === "OTHER" && styles.radioSelected
                  ]} />
                  <Text>Other</Text>
                </TouchableOpacity>
              </View>
              {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}
            </View>

            {renderInput(
              "Email *",
              "emailId",
              formData.emailId,
              (text) => handleRealTimeValidation("emailId", text),
              errors.emailId,
              false,
              "email-address",
              undefined,
              true
            )}

            {renderInput(
              "Password *",
              "password",
              formData.password,
              (text) => handleRealTimeValidation("password", text),
              errors.password,
              !showPassword,
              "default"
            )}

            <TouchableOpacity
              style={styles.passwordToggle}
              onPress={handleTogglePasswordVisibility}
            >
              <Text>{showPassword ? "Hide" : "Show"} Password</Text>
            </TouchableOpacity>

            {renderInput(
              "Confirm Password *",
              "confirmPassword",
              formData.confirmPassword,
              (text) => handleRealTimeValidation("confirmPassword", text),
              errors.confirmPassword,
              !showConfirmPassword,
              "default"
            )}

            <TouchableOpacity
              style={styles.passwordToggle}
              onPress={handleToggleConfirmPasswordVisibility}
            >
              <Text>{showConfirmPassword ? "Hide" : "Show"} Confirm Password</Text>
            </TouchableOpacity>

            {renderInput(
              "Mobile Number *",
              "mobileNo",
              formData.mobileNo,
              (text) => handleRealTimeValidation("mobileNo", text),
              errors.mobileNo,
              false,
              "phone-pad",
              10,
              true
            )}

            {renderInput(
              "Alternate Number",
              "AlternateNumber",
              formData.AlternateNumber,
              (text) => handleRealTimeValidation("AlternateNumber", text),
              errors.AlternateNumber,
              false,
              "phone-pad",
              10,
              true
            )}
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContainer}>
            <AddressComponent
              onAddressChange={handleAddressChange}
              permanentAddress={formData.permanentAddress}
              correspondenceAddress={formData.correspondenceAddress}
              errors={{
                permanent: errors.permanentAddress,
                correspondence: errors.correspondenceAddress
              }}
            />
            <Button
              variant="contained"
              onPress={fetchLocationData}
              style={styles.locationButton}
              title="Fetch My Location"
            />
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Select Service Type *</Text>
              <View style={styles.picker}>
                <TouchableOpacity
                  style={[
                    styles.pickerOption,
                    formData.housekeepingRole === "COOK" && styles.pickerOptionSelected
                  ]}
                  onPress={() => {
                    handleChange("housekeepingRole", "COOK");
                    setIsCookSelected(true);
                  }}
                >
                  <Text>Cook</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.pickerOption,
                    formData.housekeepingRole === "NANNY" && styles.pickerOptionSelected
                  ]}
                  onPress={() => {
                    handleChange("housekeepingRole", "NANNY");
                    setIsCookSelected(false);
                  }}
                >
                  <Text>Nanny</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.pickerOption,
                    formData.housekeepingRole === "MAID" && styles.pickerOptionSelected
                  ]}
                  onPress={() => {
                    handleChange("housekeepingRole", "MAID");
                    setIsCookSelected(false);
                  }}
                >
                  <Text>Maid</Text>
                </TouchableOpacity>
              </View>
              {errors.housekeepingRole && <Text style={styles.errorText}>{errors.housekeepingRole}</Text>}
            </View>

            {isCookSelected && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Cooking Speciality *</Text>
                <View style={styles.radioContainer}>
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => handleCookingSpecialityChange("VEG")}
                  >
                    <View style={[
                      styles.radioCircle,
                      formData.cookingSpeciality === "VEG" && styles.radioSelected
                    ]} />
                    <Text>Veg</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => handleCookingSpecialityChange("NONVEG")}
                  >
                    <View style={[
                      styles.radioCircle,
                      formData.cookingSpeciality === "NONVEG" && styles.radioSelected
                    ]} />
                    <Text>Non-Veg</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => handleCookingSpecialityChange("BOTH")}
                  >
                    <View style={[
                      styles.radioCircle,
                      formData.cookingSpeciality === "BOTH" && styles.radioSelected
                    ]} />
                    <Text>Both</Text>
                  </TouchableOpacity>
                </View>
                {errors.cookingSpeciality && <Text style={styles.errorText}>{errors.cookingSpeciality}</Text>}
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Diet *</Text>
              <View style={styles.radioContainer}>
                <TouchableOpacity
                  style={styles.radioOption}
                  onPress={() => handleChange("diet", "VEG")}
                >
                  <View style={[
                    styles.radioCircle,
                    formData.diet === "VEG" && styles.radioSelected
                  ]} />
                  <Text>Veg</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.radioOption}
                  onPress={() => handleChange("diet", "NONVEG")}
                >
                  <View style={[
                    styles.radioCircle,
                    formData.diet === "NONVEG" && styles.radioSelected
                  ]} />
                  <Text>Non-Veg</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.radioOption}
                  onPress={() => handleChange("diet", "BOTH")}
                >
                  <View style={[
                    styles.radioCircle,
                    formData.diet === "BOTH" && styles.radioSelected
                  ]} />
                  <Text>Both</Text>
                </TouchableOpacity>
              </View>
              {errors.diet && <Text style={styles.errorText}>{errors.diet}</Text>}
            </View>

            {renderInput(
              "Description",
              "description",
              formData.description,
              (text) => handleChange("description", text)
            )}

            {renderInput(
              "Experience *",
              "experience",
              formData.experience,
              (text) => handleChange("experience", text),
              errors.experience,
              false,
              "numeric"
            )}

            {renderInput(
              "Referral Code (Optional)",
              "referralCode",
              formData.referralCode || "",
              (text) => handleChange("referralCode", text)
            )}
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContainer}>
            {renderInput(
              "Aadhaar Number *",
              "AADHAR",
              formData.AADHAR || "",
              (text) => handleRealTimeValidation("AADHAR", text),
              errors.kyc,
              false,
              "numeric",
              12
            )}

            <CustomFileInput
              name="documentImage"
              accept="image/*"
              required
              value={formData.documentImage}
              onChange={(file: RNFile | null) => setFormData(prev => ({ ...prev, documentImage: file }))}
              buttonText="Upload Aadhaar Document"
            />
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.termsTitle}>
              Please agree to the following before proceeding with your Registration:
            </Text>
            <TermsCheckboxes onChange={handleTermsChange} />
          </View>
        );

      default:
        return <Text>Unknown step</Text>;
    }
  };

  return (
    <Modal
      visible={modalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => onBackToLogin(true)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Service Provider Registration</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => onBackToLogin(true)}
          >
            <Icon name="close" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Stepper */}
          <View style={styles.stepper}>
            {steps.map((step, index) => (
              <View key={index} style={styles.step}>
                <View style={[
                  styles.stepCircle,
                  index <= activeStep && styles.stepCircleActive
                ]}>
                  <Text style={[
                    styles.stepNumber,
                    index <= activeStep && styles.stepNumberActive
                  ]}>
                    {index + 1}
                  </Text>
                </View>
                <Text style={[
                  styles.stepLabel,
                  index <= activeStep && styles.stepLabelActive
                ]}>
                  {step}
                </Text>
              </View>
            ))}
          </View>

          {/* Form Content */}
          {renderStepContent(activeStep)}

          {/* Navigation Buttons */}
          <View style={styles.navigation}>
            <Button
              onPress={handleBack}
              variant="contained"
              title="Back"
              disabled={activeStep === 0}
            />
            
            {activeStep === steps.length - 1 ? (
              <Button
                onPress={handleSubmit}
                variant="contained"
                title="Submit"
                disabled={!(formData.terms && formData.privacy && formData.keyFacts)}
              />
            ) : (
              <Button
                onPress={handleNext}
                variant="contained"
                title="Next"
              />
            )}
          </View>
        </ScrollView>

        {/* Snackbar/Alert */}
        {snackbarOpen && (
          <View style={[
            styles.snackbar,
            snackbarSeverity === "error" && styles.snackbarError,
            snackbarSeverity === "warning" && styles.snackbarWarning
          ]}>
            <Text style={styles.snackbarText}>{snackbarMessage}</Text>
            <TouchableOpacity onPress={handleCloseSnackbar}>
              <Icon name="close" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    position: 'relative',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  stepper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
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
    marginBottom: 8,
  },
  stepCircleActive: {
    backgroundColor: '#1976d2',
  },
  stepNumber: {
    color: '#666',
    fontWeight: 'bold',
  },
  stepNumberActive: {
    color: '#fff',
  },
  stepLabel: {
    fontSize: 10,
    textAlign: 'center',
    color: '#666',
  },
  stepLabelActive: {
    color: '#1976d2',
    fontWeight: 'bold',
  },
  stepContainer: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputWrapper: {
    position: 'relative',
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
  successText: {
    fontSize: 12,
    color: 'green',
    marginTop: 4,
  },
  validationIcon: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  passwordToggle: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  radioContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#666',
    marginRight: 8,
  },
  radioSelected: {
    backgroundColor: '#1976d2',
    borderColor: '#1976d2',
  },
  picker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pickerOption: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  pickerOptionSelected: {
    backgroundColor: '#1976d2',
    borderColor: '#1976d2',
  },
  locationButton: {
    marginTop: 16,
  },
  termsTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 16,
    textAlign: 'center',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  snackbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#4caf50',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  snackbarError: {
    backgroundColor: '#f44336',
  },
  snackbarWarning: {
    backgroundColor: '#ff9800',
  },
  snackbarText: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
});

export default ServiceProviderRegistration;