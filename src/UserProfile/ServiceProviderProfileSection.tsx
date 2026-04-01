import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import providerInstance from "../services/providerInstance";
import { SkeletonLoader } from "../common/SkeletonLoader";
import TimeSlotSelector from "../common/TimeSlotSelector/TimeSlotSelector";

interface ServiceProviderProfileSectionProps {
  userId: number | null;
  userEmail: string | null;
}

interface ServiceProviderData {
  serviceproviderid: string;
  dob: string;
  kyc: any | null;
  kycType?: string;
  kycNumber?: string;
  kycImage?: string | null;
  age: number | null;
  alternateNo: string;
  buildingName: string;
  cookingSpeciality: string;
  nannyCareType?: string;
  currentLocation: string;
  diet: string;
  timeslot: string | null;
  languageKnown: string[] | string | null;
  emailId: string;
  enrolleddate: string;
  experience: number;
  firstName: string;
  gender: string;
  housekeepingRole: string | string[];
  housekeepingRoles?: string[];
  lastName: string;
  latitude: number;
  locality: string;
  location: string;
  longitude: number;
  middleName: string;
  mobileNo: string;
  nearbyLocation: string;
  pincode: number;
  rating: number;
  isactive: boolean;
  street: string;
  keyFacts: boolean;
  correspondenceAddress: {
    id: string;
    country: string;
    ctarea: string;
    field1: string;
    field2: string;
    pinno: string;
    state: string;
  };
  permanentAddress: {
    id: string;
    country: string;
    ctarea: string;
    field1: string;
    field2: string;
    pinno: string;
    state: string;
  };
}

const ServiceProviderProfileSection: React.FC<ServiceProviderProfileSectionProps> = ({ 
  userId, 
  userEmail 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [providerData, setProviderData] = useState<ServiceProviderData | null>(null);
  
  // Refs for debouncing
  const contactDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const altContactDebounceRef = useRef<NodeJS.Timeout | null>(null);
  
  // Time slots state
  const [morningSlots, setMorningSlots] = useState<number[][]>([]);
  const [eveningSlots, setEveningSlots] = useState<number[][]>([]);
  const [isFullTime, setIsFullTime] = useState(false);
  
  // Original time slots for change detection
  const [originalMorningSlots, setOriginalMorningSlots] = useState<number[][]>([]);
  const [originalEveningSlots, setOriginalEveningSlots] = useState<number[][]>([]);
  const [originalIsFullTime, setOriginalIsFullTime] = useState<boolean>(true);
  
  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    email: "",
    contactNumber: "",
    altContactNumber: "",
    gender: "",
    dob: "",
    diet: "",
    cookingSpeciality: "",
    nannyCareType: "",
    housekeepingRole: [] as string[],
    experience: 0,
    languageKnown: "",
    currentLocation: "",
    locality: "",
    street: "",
    buildingName: "",
    pincode: "",
    nearbyLocation: "",
    timeslot: ""
  });
  
  const [originalData, setOriginalData] = useState({ ...userData });

  // Mobile validation states
  const [contactValidation, setContactValidation] = useState({
    loading: false,
    error: '',
    isAvailable: null as boolean | null,
    formatError: false
  });
  
  const [altContactValidation, setAltContactValidation] = useState({
    loading: false,
    error: '',
    isAvailable: null as boolean | null,
    formatError: false
  });

  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState({
    personal: true,
    professional: true,
    address: true,
    availability: true,
    kyc: true,
    additional: true
  });

  const serviceTypes = [
    { value: "COOK", label: "Cook", icon: "restaurant" },
    { value: "NANNY", label: "Nanny", icon: "favorite" },
    { value: "MAID", label: "Maid", icon: "work" },
  ];

  const dietOptions = [
    { value: "VEG", label: "Vegetarian" },
    { value: "NONVEG", label: "Non-Vegetarian" },
    { value: "BOTH", label: "Both" }
  ];
  
  const cookingSpecialityOptions = [
    { value: "VEG", label: "Vegetarian" },
    { value: "NONVEG", label: "Non-Vegetarian" },
    { value: "BOTH", label: "Both" }
  ];
  
  const nannyCareOptions = [
    { value: "BABY_CARE", label: "Baby Care" },
    { value: "ELDERLY_CARE", label: "Elderly Care" },
    { value: "BOTH", label: "Both" },
  ];

  const genderOptions = [
    { value: "MALE", label: "Male" },
    { value: "FEMALE", label: "Female" },
    { value: "OTHER", label: "Other" }
  ];

  // Helper functions for time slots
  const formatDisplayTime = (value: number): string => {
    const hour = Math.floor(value);
    const minute = (value % 1) * 60;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour}:${minute === 0 ? '00' : minute} ${ampm}`;
  };

  const formatTimeForPayload = (value: number): string => {
    const hour = Math.floor(value);
    const minute = (value % 1) * 60;
    const paddedHour = hour.toString().padStart(2, '0');
    const paddedMinute = minute === 0 ? '00' : minute.toString().padStart(2, '0');
    return `${paddedHour}:${paddedMinute}`;
  };

  const parseTimeToNumber = (timeStr: string): number => {
    const [time, period] = timeStr.trim().split(' ');
    let [hour, minute] = time.split(':').map(Number);
    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    return hour + (minute / 60);
  };

  // New function to get merged time slots array
  const getMergedTimeSlots = (slots: number[][]): number[][] => {
    if (!slots.length) return [];
    
    const sorted = [...slots].sort((a, b) => a[0] - b[0]);
    const merged: number[][] = [];
    
    for (const slot of sorted) {
      if (merged.length === 0) {
        merged.push([slot[0], slot[1]]);
      } else {
        const last = merged[merged.length - 1];
        if (slot[0] <= last[1]) {
          // Overlapping or adjacent slots, merge them
          last[1] = Math.max(last[1], slot[1]);
        } else {
          merged.push([slot[0], slot[1]]);
        }
      }
    }
    
    return merged;
  };

  const mergeTimeSlots = (slots: number[][]): string => {
    const merged = getMergedTimeSlots(slots);
    
    if (merged.length === 0) return "";
    
    return merged
      .map(([start, end]) => `${formatDisplayTime(start)} - ${formatDisplayTime(end)}`)
      .join(", ");
  };

  const mergedTimeSlotsString = useMemo(() => {
    const allSlots = [...morningSlots, ...eveningSlots];
    return mergeTimeSlots(allSlots);
  }, [morningSlots, eveningSlots]);

  useEffect(() => {
    if (userId) {
      fetchServiceProviderData();
    }
    
    return () => {
      if (contactDebounceRef.current) clearTimeout(contactDebounceRef.current);
      if (altContactDebounceRef.current) clearTimeout(altContactDebounceRef.current);
    };
  }, [userId]);

  const validateMobileFormat = (number: string): boolean => {
    return /^[0-9]{10}$/.test(number);
  };

  const checkMobileAvailability = async (number: string, isAlternate: boolean = false): Promise<boolean> => {
    if (!number || !validateMobileFormat(number)) return false;

    const setValidation = isAlternate ? setAltContactValidation : setContactValidation;
    
    setValidation({ loading: true, error: '', isAvailable: null, formatError: false });

    try {
      const response = await providerInstance.post('/api/service-providers/check-mobile', { mobile: number });
      
      let isAvailable = true;
      if (response.data.exists !== undefined) {
        isAvailable = !response.data.exists;
      }

      setValidation({
        loading: false,
        error: isAvailable ? '' : `${isAlternate ? "Alternate" : "Mobile"} number already registered`,
        isAvailable,
        formatError: false
      });

      return isAvailable;
    } catch (error) {
      setValidation({
        loading: false,
        error: `Error checking ${isAlternate ? "alternate" : "mobile"} number`,
        isAvailable: false,
        formatError: false
      });
      return false;
    }
  };

  const fetchServiceProviderData = async () => {
    setIsLoading(true);
    try {
      const response = await providerInstance.get(`/api/service-providers/serviceprovider/${userId}`);
      const data = response.data.data;
      
      setProviderData(data);

      let languageKnown = data.languageKnown;
      if (Array.isArray(languageKnown)) {
        languageKnown = languageKnown.join(", ");
      }

      let roles: string[] = [];
      if (data.housekeepingRoles && Array.isArray(data.housekeepingRoles)) {
        roles = data.housekeepingRoles;
      } else if (typeof data.housekeepingRole === 'string') {
        if (data.housekeepingRole.includes(',')) {
          roles = data.housekeepingRole.split(',').map((r: string) => r.trim());
        } else {
          roles = [data.housekeepingRole];
        }
      } else if (Array.isArray(data.housekeepingRole)) {
        roles = data.housekeepingRole;
      }

      let morning: number[][] = [];
      let evening: number[][] = [];
      if (data.timeslot) {
        const slots = data.timeslot.split(',').map((slot: string) => slot.trim());
        
        slots.forEach((slot: string) => {
          const [startStr, endStr] = slot.split('-');
          if (startStr && endStr) {
            try {
              const start = parseTimeToNumber(startStr);
              const end = parseTimeToNumber(endStr);
              
              if (start < 12) {
                morning.push([start, end]);
              } else {
                evening.push([start, end]);
              }
            } catch (error) {
              console.error("Error parsing time slot:", slot);
            }
          }
        });
      }
      
      setMorningSlots(morning);
      setEveningSlots(evening);
      setIsFullTime(morning.length === 0 && evening.length === 0);
      setOriginalMorningSlots(morning);
      setOriginalEveningSlots(evening);
      setOriginalIsFullTime(morning.length === 0 && evening.length === 0);

      const updatedUserData = {
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        middleName: data.middleName || "",
        email: data.emailId || userEmail || "",
        contactNumber: data.mobileNo || "",
        altContactNumber: data.alternateNo && data.alternateNo !== "0" ? data.alternateNo : "",
        gender: data.gender || "",
        dob: data.dob ? new Date(data.dob).toLocaleDateString() : "",
        diet: data.diet || "",
        cookingSpeciality: data.cookingSpeciality || "",
        nannyCareType: data.nannyCareType || "",
        housekeepingRole: roles,
        experience: data.experience || 0,
        languageKnown: languageKnown || "",
        currentLocation: data.currentLocation || "",
        locality: data.locality || "",
        street: data.street || "",
        buildingName: data.buildingName || "",
        pincode: data.pincode?.toString() || "",
        nearbyLocation: data.nearbyLocation || "",
        timeslot: data.timeslot || ""
      };

      setUserData(updatedUserData);
      setOriginalData(updatedUserData);
      
      setContactValidation({ loading: false, error: '', isAvailable: null, formatError: false });
      setAltContactValidation({ loading: false, error: '', isAvailable: null, formatError: false });
      
    } catch (error) {
      console.error("Failed to fetch service provider data:", error);
      Alert.alert("Error", "Failed to fetch service provider data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMorningSlot = () => {
    if (morningSlots.length < 12) {
      setMorningSlots([...morningSlots, [6, 12]]);
    } else {
      Alert.alert("Error", "Maximum morning slots reached");
    }
  };

  const handleRemoveMorningSlot = (index: number) => {
    setMorningSlots(morningSlots.filter((_, i) => i !== index));
  };

  const handleClearMorningSlots = () => {
    setMorningSlots([]);
  };

  const handleAddEveningSlot = () => {
    if (eveningSlots.length < 16) {
      setEveningSlots([...eveningSlots, [12, 20]]);
    } else {
      Alert.alert("Error", "Maximum evening slots reached");
    }
  };

  const handleRemoveEveningSlot = (index: number) => {
    setEveningSlots(eveningSlots.filter((_, i) => i !== index));
  };

  const handleClearEveningSlots = () => {
    setEveningSlots([]);
  };

  const handleMorningSlotChange = (index: number, newValue: number[]) => {
    const updatedSlots = [...morningSlots];
    updatedSlots[index] = newValue;
    setMorningSlots(updatedSlots);
  };

  const handleEveningSlotChange = (index: number, newValue: number[]) => {
    const updatedSlots = [...eveningSlots];
    updatedSlots[index] = newValue;
    setEveningSlots(updatedSlots);
  };

  const handleFullTimeToggle = (checked: boolean) => {
    setIsFullTime(checked);
    if (checked) {
      setMorningSlots([]);
      setEveningSlots([]);
    }
  };

  const handleContactNumberChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 10);
    setUserData(prev => ({ ...prev, contactNumber: cleaned }));

    setContactValidation({ loading: false, error: '', isAvailable: null, formatError: false });

    if (cleaned.length === 10) {
      setTimeout(() => checkMobileAvailability(cleaned, false), 800);
    } else if (cleaned) {
      setContactValidation({
        loading: false,
        error: "Please enter a valid 10-digit mobile number",
        isAvailable: null,
        formatError: true
      });
    }
  };

  const handleAltContactNumberChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 10);
    setUserData(prev => ({ ...prev, altContactNumber: cleaned }));

    setAltContactValidation({ loading: false, error: '', isAvailable: null, formatError: false });

    if (cleaned.length === 10) {
      if (cleaned === userData.contactNumber) {
        setAltContactValidation({
          loading: false,
          error: "Alternate number cannot be same as primary number",
          isAvailable: false,
          formatError: false
        });
      } else {
        setTimeout(() => checkMobileAvailability(cleaned, true), 800);
      }
    } else if (cleaned) {
      setAltContactValidation({
        loading: false,
        error: "Please enter a valid 10-digit mobile number",
        isAvailable: null,
        formatError: true
      });
    }
  };

  const handleRoleToggle = (role: string) => {
    setUserData(prev => ({
      ...prev,
      housekeepingRole: prev.housekeepingRole.includes(role)
        ? prev.housekeepingRole.filter(r => r !== role)
        : [...prev.housekeepingRole, role]
    }));
  };

  const handleSave = async () => {
    if (!userId) return;

    if (userData.contactNumber && !validateMobileFormat(userData.contactNumber)) {
      Alert.alert("Error", "Please enter a valid 10-digit mobile number");
      return;
    }

    if (userData.altContactNumber && !validateMobileFormat(userData.altContactNumber)) {
      Alert.alert("Error", "Please enter a valid 10-digit mobile number");
      return;
    }

    if (
      userData.contactNumber &&
      userData.altContactNumber &&
      userData.contactNumber === userData.altContactNumber
    ) {
      Alert.alert("Error", "Contact numbers must be different");
      return;
    }

    setIsSaving(true);

    try {
      const payload: any = {};

      if (userData.contactNumber !== originalData.contactNumber) {
        payload.mobileNo = userData.contactNumber;
      }

      if (userData.altContactNumber !== originalData.altContactNumber) {
        payload.alternateNo = userData.altContactNumber || null;
      }

      if (userData.gender !== originalData.gender) {
        payload.gender = userData.gender;
      }

      if (userData.diet !== originalData.diet) {
        payload.diet = userData.diet;
      }

      if (userData.cookingSpeciality !== originalData.cookingSpeciality) {
        payload.cookingSpeciality = userData.cookingSpeciality;
      }

      if (userData.nannyCareType !== originalData.nannyCareType) {
        payload.nannyCareType = userData.nannyCareType;
      }

      if (
        userData.housekeepingRole.join(",") !==
        originalData.housekeepingRole.join(",")
      ) {
        payload.housekeepingRole = userData.housekeepingRole.join(",");
      }

      if (userData.experience !== originalData.experience) {
        payload.experience = userData.experience;
      }

      if (userData.languageKnown !== originalData.languageKnown) {
        payload.languageKnown = userData.languageKnown;
      }

      if (userData.currentLocation !== originalData.currentLocation) {
        payload.currentLocation = userData.currentLocation;
      }

      if (userData.locality !== originalData.locality) {
        payload.locality = userData.locality;
      }

      if (userData.street !== originalData.street) {
        payload.street = userData.street;
      }

      if (userData.buildingName !== originalData.buildingName) {
        payload.buildingName = userData.buildingName;
      }

      if (userData.pincode !== originalData.pincode) {
        payload.pincode = parseInt(userData.pincode) || 0;
      }

      if (userData.nearbyLocation !== originalData.nearbyLocation) {
        payload.nearbyLocation = userData.nearbyLocation;
      }

      // Modified timeslot handling to use merged slots
      let timeslotString = '';
      if (!isFullTime) {
        const allSlots = [...morningSlots, ...eveningSlots];
        if (allSlots.length > 0) {
          // Get merged slots to avoid overlaps in payload
          const mergedSlots = getMergedTimeSlots(allSlots);
          timeslotString = mergedSlots
            .map(slot => `${formatTimeForPayload(slot[0])}-${formatTimeForPayload(slot[1])}`)
            .join(',');
        }
      }

      const slotsChanged = 
        isFullTime !== originalIsFullTime ||
        JSON.stringify(morningSlots) !== JSON.stringify(originalMorningSlots) ||
        JSON.stringify(eveningSlots) !== JSON.stringify(originalEveningSlots);

      if (slotsChanged) {
        payload.timeslot = timeslotString || null;
      }

      if (Object.keys(payload).length === 0) {
        Alert.alert("Info", "No changes detected");
        setIsEditing(false);
        return;
      }

      await providerInstance.put(
        `/api/service-providers/serviceprovider/${userId}`,
        payload
      );

      await fetchServiceProviderData();
      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully");

    } catch (error) {
      console.error("Failed to save data:", error);
      Alert.alert("Error", "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setUserData(originalData);
    setIsEditing(false);
    setContactValidation({ loading: false, error: '', isAvailable: null, formatError: false });
    setAltContactValidation({ loading: false, error: '', isAvailable: null, formatError: false });
    setMorningSlots(originalMorningSlots);
    setEveningSlots(originalEveningSlots);
    setIsFullTime(originalIsFullTime);
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const hasChanges = (): boolean => {
    const userDataChanged = JSON.stringify(userData) !== JSON.stringify(originalData);
    const slotsChanged = 
      isFullTime !== originalIsFullTime ||
      JSON.stringify(morningSlots) !== JSON.stringify(originalMorningSlots) ||
      JSON.stringify(eveningSlots) !== JSON.stringify(originalEveningSlots);
    return userDataChanged || slotsChanged;
  };

  const isFormValid = (): boolean => {
    if (userData.contactNumber && !validateMobileFormat(userData.contactNumber)) return false;
    if (userData.altContactNumber && !validateMobileFormat(userData.altContactNumber)) return false;
    if (userData.contactNumber && userData.altContactNumber && 
        userData.contactNumber === userData.altContactNumber) return false;
    return true;
  };

  const kycStatus = getKYCStatus();

  function getKYCStatus() {
    if (!providerData) return { status: "Pending", color: "#f44336", icon: "cancel" };
    
    if (providerData.kyc) {
      return { 
        status: "Verified", 
        color: "#4caf50", 
        icon: "check-circle",
        details: providerData.kycType ? `(${providerData.kycType})` : ""
      };
    }
    
    if (providerData.kycNumber && providerData.kycType) {
      return { 
        status: "Pending Verification", 
        color: "#ff9800", 
        icon: "error-outline",
        details: `${providerData.kycType} number provided, awaiting verification`
      };
    }
    
    return { 
      status: "Not Submitted", 
      color: "#f44336", 
      icon: "cancel",
      details: "Please submit KYC documents"
    };
  }

  const SectionHeader = ({ title, icon, section, expanded }: any) => (
    <TouchableOpacity 
      style={styles.sectionHeader}
      onPress={() => toggleSection(section)}
    >
      <View style={styles.sectionHeaderLeft}>
        <Icon name={icon} size={20} color="#1976d2" />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <Icon 
        name={expanded ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
        size={24} 
        color="#666" 
      />
    </TouchableOpacity>
  );

  const InputField = ({ label, value, onChangeText, editable = true, keyboardType = "default", placeholder = "", secureTextEntry = false }: any) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.input, !editable && styles.inputReadOnly]}
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        keyboardType={keyboardType}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
      />
    </View>
  );

  if (isLoading) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.loadingContainer}>
          {[...Array(8)].map((_, index) => (
            <View key={index} style={styles.skeletonItem}>
              <SkeletonLoader width={100} height={16} />
              <SkeletonLoader height={40} style={styles.skeletonInput} />
            </View>
          ))}
        </View>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Service Provider Profile</Text>
              <View style={styles.statusContainer}>
                <View style={[styles.statusBadge, providerData?.isactive ? styles.activeBadge : styles.inactiveBadge]}>
                  <Icon 
                    name={providerData?.isactive ? "check-circle" : "cancel"} 
                    size={12} 
                    color={providerData?.isactive ? "#2e7d32" : "#c62828"} 
                  />
                  <Text style={[styles.statusText, providerData?.isactive ? styles.activeText : styles.inactiveText]}>
                    {providerData?.isactive ? "Active" : "Inactive"}
                  </Text>
                </View>
                {providerData?.rating && providerData.rating > 0 && (
                  <View style={styles.ratingContainer}>
                    <Icon name="star" size={14} color="#ffb300" />
                    <Text style={styles.ratingText}>{providerData.rating}</Text>
                  </View>
                )}
              </View>
            </View>
            {!isEditing && (
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => {
                  setOriginalData({ ...userData });
                  setIsEditing(true);
                }}
              >
                <Icon name="edit" size={18} color="#fff" />
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Personal Information Section */}
          <View style={styles.section}>
            <SectionHeader 
              title="PERSONAL INFORMATION" 
              icon="person" 
              section="personal" 
              expanded={expandedSections.personal}
            />
            {expandedSections.personal && (
              <View style={styles.sectionContent}>
                <InputField 
                  label="First Name"
                  value={userData.firstName}
                  onChangeText={(text: string) => setUserData(prev => ({ ...prev, firstName: text }))}
                  editable={isEditing}
                />
                <InputField 
                  label="Middle Name"
                  value={userData.middleName}
                  onChangeText={(text: string) => setUserData(prev => ({ ...prev, middleName: text }))}
                  editable={isEditing}
                />
                <InputField 
                  label="Last Name"
                  value={userData.lastName}
                  onChangeText={(text: string) => setUserData(prev => ({ ...prev, lastName: text }))}
                  editable={isEditing}
                />
                <InputField 
                  label="Email"
                  value={userData.email}
                  editable={false}
                />
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Contact Number</Text>
                  <View style={styles.phoneInputContainer}>
                    <TextInput
                      style={[styles.input, styles.phoneInput, !isEditing && styles.inputReadOnly]}
                      value={userData.contactNumber}
                      onChangeText={handleContactNumberChange}
                      editable={isEditing}
                      keyboardType="phone-pad"
                      placeholder="Enter 10-digit mobile number"
                      maxLength={10}
                    />
                    {isEditing && (
                      <View style={styles.validationIcon}>
                        {contactValidation.loading && <ActivityIndicator size="small" color="#1976d2" />}
                        {contactValidation.isAvailable && !contactValidation.loading && (
                          <Icon name="check-circle" size={16} color="#4caf50" />
                        )}
                        {contactValidation.isAvailable === false && !contactValidation.loading && (
                          <Icon name="error" size={16} color="#f44336" />
                        )}
                      </View>
                    )}
                  </View>
                  {contactValidation.error && (
                    <Text style={styles.errorText}>{contactValidation.error}</Text>
                  )}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Alternate Contact Number</Text>
                  <View style={styles.phoneInputContainer}>
                    <TextInput
                      style={[styles.input, styles.phoneInput, !isEditing && styles.inputReadOnly]}
                      value={userData.altContactNumber}
                      onChangeText={handleAltContactNumberChange}
                      editable={isEditing}
                      keyboardType="phone-pad"
                      placeholder="Enter 10-digit mobile number"
                      maxLength={10}
                    />
                    {isEditing && (
                      <View style={styles.validationIcon}>
                        {altContactValidation.loading && <ActivityIndicator size="small" color="#1976d2" />}
                        {altContactValidation.isAvailable && !altContactValidation.loading && (
                          <Icon name="check-circle" size={16} color="#4caf50" />
                        )}
                        {altContactValidation.isAvailable === false && !altContactValidation.loading && (
                          <Icon name="error" size={16} color="#f44336" />
                        )}
                      </View>
                    )}
                  </View>
                  {altContactValidation.error && (
                    <Text style={styles.errorText}>{altContactValidation.error}</Text>
                  )}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Gender</Text>
                  {isEditing ? (
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={userData.gender}
                        onValueChange={(value) => setUserData(prev => ({ ...prev, gender: value }))}
                      >
                        <Picker.Item label="Select Gender" value="" />
                        {genderOptions.map(option => (
                          <Picker.Item key={option.value} label={option.label} value={option.value} />
                        ))}
                      </Picker>
                    </View>
                  ) : (
                    <Text style={[styles.input, styles.inputReadOnly]}>
                      {userData.gender ? 
                        (genderOptions.find(g => g.value === userData.gender)?.label || userData.gender) 
                        : "Not specified"}
                    </Text>
                  )}
                </View>

                <InputField 
                  label="Date of Birth"
                  value={userData.dob || "Not specified"}
                  editable={false}
                />
              </View>
            )}
          </View>

          <View style={styles.divider} />

          {/* Professional Information Section */}
          <View style={styles.section}>
            <SectionHeader 
              title="PROFESSIONAL INFORMATION" 
              icon="work" 
              section="professional" 
              expanded={expandedSections.professional}
            />
            {expandedSections.professional && (
              <View style={styles.sectionContent}>
                <Text style={styles.subsectionLabel}>Service Types</Text>
                <View style={styles.serviceTypesContainer}>
                  {serviceTypes.map(service => {
                    const isSelected = userData.housekeepingRole.includes(service.value);
                    return (
                      <TouchableOpacity
                        key={service.value}
                        style={[
                          styles.serviceTypeCard,
                          isSelected && styles.serviceTypeSelected,
                          !isEditing && styles.serviceTypeDisabled
                        ]}
                        onPress={() => isEditing && handleRoleToggle(service.value)}
                        disabled={!isEditing}
                      >
                        <View style={styles.serviceTypeContent}>
                          <Icon name={service.icon} size={20} color={isSelected ? "#1976d2" : "#666"} />
                          <Text style={[styles.serviceTypeText, isSelected && styles.serviceTypeTextSelected]}>
                            {service.label}
                          </Text>
                        </View>
                        {isSelected && (
                          <Icon name="check-circle" size={16} color="#1976d2" />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Service-specific fields */}
                <View style={styles.serviceFieldsContainer}>
                  {userData.housekeepingRole.includes('COOK') && (
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Cooking Speciality</Text>
                      {isEditing ? (
                        <View style={styles.pickerContainer}>
                          <Picker
                            selectedValue={userData.cookingSpeciality}
                            onValueChange={(value) => setUserData(prev => ({ ...prev, cookingSpeciality: value }))}
                          >
                            <Picker.Item label="Select Speciality" value="" />
                            {cookingSpecialityOptions.map(opt => (
                              <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
                            ))}
                          </Picker>
                        </View>
                      ) : (
                        <Text style={[styles.input, styles.inputReadOnly]}>
                          {userData.cookingSpeciality
                            ? (cookingSpecialityOptions.find(o => o.value === userData.cookingSpeciality)?.label || userData.cookingSpeciality)
                            : "Not specified"}
                        </Text>
                      )}
                    </View>
                  )}

                  {userData.housekeepingRole.includes('NANNY') && (
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Care Type</Text>
                      {isEditing ? (
                        <View style={styles.pickerContainer}>
                          <Picker
                            selectedValue={userData.nannyCareType}
                            onValueChange={(value) => setUserData(prev => ({ ...prev, nannyCareType: value }))}
                          >
                            <Picker.Item label="Select Care Type" value="" />
                            {nannyCareOptions.map(opt => (
                              <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
                            ))}
                          </Picker>
                        </View>
                      ) : (
                        <Text style={[styles.input, styles.inputReadOnly]}>
                          {userData.nannyCareType
                            ? (nannyCareOptions.find(o => o.value === userData.nannyCareType)?.label || userData.nannyCareType)
                            : "Not specified"}
                        </Text>
                      )}
                    </View>
                  )}

                  {(userData.housekeepingRole.includes('COOK') ||
                    userData.housekeepingRole.includes('NANNY') ||
                    userData.housekeepingRole.includes('MAID')) && (
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Diet Preference</Text>
                      {isEditing ? (
                        <View style={styles.pickerContainer}>
                          <Picker
                            selectedValue={userData.diet}
                            onValueChange={(value) => setUserData(prev => ({ ...prev, diet: value }))}
                          >
                            <Picker.Item label="Select Diet" value="" />
                            {dietOptions.map(opt => (
                              <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
                            ))}
                          </Picker>
                        </View>
                      ) : (
                        <Text style={[styles.input, styles.inputReadOnly]}>
                          {userData.diet
                            ? (dietOptions.find(o => o.value === userData.diet)?.label || userData.diet)
                            : "Not specified"}
                        </Text>
                      )}
                    </View>
                  )}
                </View>

                <InputField 
                  label="Experience (Years)"
                  value={userData.experience.toString()}
                  onChangeText={(text: string) => setUserData(prev => ({ ...prev, experience: parseInt(text) || 0 }))}
                  editable={isEditing}
                  keyboardType="numeric"
                />

                <InputField 
                  label="Languages Known"
                  value={userData.languageKnown}
                  onChangeText={(text: string) => setUserData(prev => ({ ...prev, languageKnown: text }))}
                  editable={isEditing}
                  placeholder="e.g., English, Hindi, Tamil"
                />
              </View>
            )}
          </View>

          <View style={styles.divider} />

          {/* Availability Section */}
          <View style={styles.section}>
            <SectionHeader 
              title="AVAILABILITY" 
              icon="access-time" 
              section="availability" 
              expanded={expandedSections.availability}
            />
            {expandedSections.availability && (
              <View style={styles.sectionContent}>
                {isEditing ? (
                  <View>
                    <View style={styles.fullTimeContainer}>
                      <View style={styles.fullTimeTextContainer}>
                        <Text style={styles.fullTimeTitle}>Full Time Availability</Text>
                        <Text style={styles.fullTimeDescription}>Available for full day shifts</Text>
                      </View>
                      <Switch
                        value={isFullTime}
                        onValueChange={handleFullTimeToggle}
                        trackColor={{ false: "#767577", true: "#1976d2" }}
                        thumbColor={isFullTime ? "#fff" : "#f4f3f4"}
                      />
                    </View>

                    {!isFullTime && (
                      <View>
                        <TimeSlotSelector
                          title="Morning Availability"
                          slots={morningSlots}
                          minTime={6}
                          maxTime={12}
                          marks={[
                            { value: 6, label: "6:00 AM" },
                            { value: 8, label: "8:00 AM" },
                            { value: 10, label: "10:00 AM" },
                            { value: 12, label: "12:00 PM" },
                          ]}
                          notAvailableMessage="Not available in the morning"
                          addSlotMessage="Add a morning time slot"
                          slotLabel="Time Slot"
                          addButtonLabel="Add Slot"
                          clearButtonLabel="Clear All"
                          duplicateErrorKey="This time slot already exists"
                          onAddSlot={handleAddMorningSlot}
                          onRemoveSlot={handleRemoveMorningSlot}
                          onClearSlots={handleClearMorningSlots}
                          onSlotChange={handleMorningSlotChange}
                          formatDisplayTime={formatDisplayTime}
                        />

                        <TimeSlotSelector
                          title="Evening Availability"
                          slots={eveningSlots}
                          minTime={12}
                          maxTime={20}
                          marks={[
                            { value: 12, label: "12:00 PM" },
                            { value: 14, label: "2:00 PM" },
                            { value: 16, label: "4:00 PM" },
                            { value: 18, label: "6:00 PM" },
                            { value: 20, label: "8:00 PM" },
                          ]}
                          notAvailableMessage="Not available in the evening"
                          addSlotMessage="Add an evening time slot"
                          slotLabel="Time Slot"
                          addButtonLabel="Add Slot"
                          clearButtonLabel="Clear All"
                          duplicateErrorKey="This time slot already exists"
                          onAddSlot={handleAddEveningSlot}
                          onRemoveSlot={handleRemoveEveningSlot}
                          onClearSlots={handleClearEveningSlots}
                          onSlotChange={handleEveningSlotChange}
                          formatDisplayTime={formatDisplayTime}
                        />

                        {mergedTimeSlotsString && (
                          <View style={styles.summaryCard}>
                            <Text style={styles.summaryTitle}>Your Selected Time Slots</Text>
                            <Text style={styles.summaryText}>{mergedTimeSlotsString}</Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                ) : (
                  <View>
                    {providerData?.timeslot ? (
                      <View style={styles.timeSlotsContainer}>
                        {providerData.timeslot.split(',').map((slot: string, index: number) => (
                          <View key={index} style={styles.timeSlotBadge}>
                            <Icon name="access-time" size={12} color="#2e7d32" />
                            <Text style={styles.timeSlotText}>{slot.trim()}</Text>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <Text style={styles.noDataText}>No time slots specified</Text>
                    )}
                  </View>
                )}
              </View>
            )}
          </View>

          <View style={styles.divider} />

          {/* KYC Information Section */}
          <View style={styles.section}>
            <SectionHeader 
              title="KYC INFORMATION" 
              icon="credit-card" 
              section="kyc" 
              expanded={expandedSections.kyc}
            />
            {expandedSections.kyc && (
              <View style={styles.kycContainer}>
                <View style={styles.kycRow}>
                  <Text style={styles.kycLabel}>KYC Status</Text>
                  <View style={[styles.kycStatusBadge, { backgroundColor: `${kycStatus.color}20` }]}>
                    <Icon name={kycStatus.icon} size={14} color={kycStatus.color} />
                    <Text style={[styles.kycStatusText, { color: kycStatus.color }]}>
                      {kycStatus.status}
                    </Text>
                  </View>
                </View>

                {providerData?.kycType && (
                  <View style={styles.kycRow}>
                    <Text style={styles.kycLabel}>KYC Type</Text>
                    <View style={styles.kycValueContainer}>
                      <Icon name="description" size={14} color="#666" />
                      <Text style={styles.kycValue}>{providerData.kycType}</Text>
                    </View>
                  </View>
                )}

                {providerData?.kycNumber && (
                  <View style={styles.kycRow}>
                    <Text style={styles.kycLabel}>KYC Number</Text>
                    <View style={styles.kycValueContainer}>
                      <Icon name="credit-card" size={14} color="#666" />
                      <Text style={styles.kycValue}>
                        {providerData.kycNumber.replace(/(\d{4})(\d{4})(\d{4})/, '$1-$2-$3')}
                      </Text>
                    </View>
                  </View>
                )}

                {kycStatus.details && (
                  <Text style={styles.kycDetails}>{kycStatus.details}</Text>
                )}

                {providerData?.kycImage && (
                  <TouchableOpacity 
                    style={styles.viewDocumentButton}
                    onPress={() => {
                      Alert.alert("Info", "View Document feature coming soon");
                    }}
                  >
                    <Icon name="description" size={16} color="#1976d2" />
                    <Text style={styles.viewDocumentText}>View Document</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          <View style={styles.divider} />

          {/* Address Information Section */}
          <View style={styles.section}>
            <SectionHeader 
              title="ADDRESS INFORMATION" 
              icon="location-on" 
              section="address" 
              expanded={expandedSections.address}
            />
            {expandedSections.address && (
              <View style={styles.addressContainer}>
                {providerData?.permanentAddress && (
                  <View style={styles.addressCard}>
                    <View style={styles.addressHeader}>
                      <Icon name="home" size={16} color="#1976d2" />
                      <Text style={styles.addressTitle}>Permanent Address</Text>
                    </View>
                    <Text style={styles.addressText}>
                      {providerData.permanentAddress.field1} {providerData.permanentAddress.field2}
                    </Text>
                    <Text style={styles.addressText}>
                      {providerData.permanentAddress.ctarea}, {providerData.permanentAddress.state}
                    </Text>
                    <Text style={styles.addressText}>
                      {providerData.permanentAddress.country} - {providerData.permanentAddress.pinno}
                    </Text>
                  </View>
                )}

                {providerData?.correspondenceAddress && (
                  <View style={styles.addressCard}>
                    <View style={styles.addressHeader}>
                      <Icon name="location-on" size={16} color="#1976d2" />
                      <Text style={styles.addressTitle}>Correspondence Address</Text>
                    </View>
                    <Text style={styles.addressText}>
                      {providerData.correspondenceAddress.field1} {providerData.correspondenceAddress.field2}
                    </Text>
                    <Text style={styles.addressText}>
                      {providerData.correspondenceAddress.ctarea}, {providerData.correspondenceAddress.state}
                    </Text>
                    <Text style={styles.addressText}>
                      {providerData.correspondenceAddress.country} - {providerData.correspondenceAddress.pinno}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          <View style={styles.divider} />

          {/* Additional Information Section */}
          <View style={styles.section}>
            <SectionHeader 
              title="ADDITIONAL INFORMATION" 
              icon="emoji-events" 
              section="additional" 
              expanded={expandedSections.additional}
            />
            {expandedSections.additional && (
              <View style={styles.sectionContent}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Enrolled Date</Text>
                  <Text style={styles.infoValue}>
                    {providerData?.enrolleddate ? new Date(providerData.enrolleddate).toLocaleDateString() : "Not available"}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Key Facts</Text>
                  <Text style={styles.infoValue}>
                    {providerData?.keyFacts ? "Available" : "Not available"}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Profile Created</Text>
                  <Text style={styles.infoValue}>
                    {providerData?.enrolleddate ? new Date(providerData.enrolleddate).toLocaleDateString() : "Not available"}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          {isEditing && (
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={handleCancel}
                disabled={isSaving}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveButton, (!isFormValid() || !hasChanges()) && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={isSaving || !isFormValid() || !hasChanges()}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    padding: 16,
  },
  skeletonItem: {
    marginBottom: 16,
  },
  skeletonInput: {
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  activeBadge: {
    backgroundColor: '#e8f5e9',
  },
  inactiveBadge: {
    backgroundColor: '#ffebee',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  activeText: {
    color: '#2e7d32',
  },
  inactiveText: {
    color: '#c62828',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#ffb300',
    fontWeight: '500',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1976d2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976d2',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    paddingTop: 8,
  },
  subsectionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 12,
  },
  serviceTypesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },
  serviceTypeCard: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  serviceTypeSelected: {
    borderColor: '#1976d2',
    backgroundColor: '#e3f2fd',
  },
  serviceTypeDisabled: {
    opacity: 0.8,
  },
  serviceTypeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  serviceTypeText: {
    fontSize: 14,
    color: '#666',
  },
  serviceTypeTextSelected: {
    color: '#1976d2',
    fontWeight: '500',
  },
  serviceFieldsContainer: {
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  inputReadOnly: {
    backgroundColor: '#f5f5f5',
    color: '#999',
  },
  phoneInputContainer: {
    position: 'relative',
  },
  phoneInput: {
    paddingRight: 40,
  },
  validationIcon: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  errorText: {
    fontSize: 12,
    color: '#f44336',
    marginTop: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 16,
  },
  fullTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 16,
  },
  fullTimeTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  fullTimeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  fullTimeDescription: {
    fontSize: 12,
    color: '#666',
  },
  summaryCard: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#90caf9',
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#1976d2',
  },
  timeSlotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  timeSlotText: {
    fontSize: 12,
    color: '#2e7d32',
  },
  noDataText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  kycContainer: {
    backgroundColor: '#fafafa',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  kycRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  kycLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  kycStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  kycStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  kycValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  kycValue: {
    fontSize: 13,
    color: '#333',
  },
  kycDetails: {
    fontSize: 11,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
  },
  viewDocumentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  viewDocumentText: {
    fontSize: 13,
    color: '#1976d2',
    fontWeight: '500',
  },
  addressContainer: {
    gap: 16,
  },
  addressCard: {
    backgroundColor: '#fafafa',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  addressTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  addressText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 32,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  cancelButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f44336',
    backgroundColor: 'transparent',
  },
  cancelButtonText: {
    color: '#f44336',
    fontSize: 14,
    fontWeight: '500',
  },
  saveButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#1976d2',
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ServiceProviderProfileSection;