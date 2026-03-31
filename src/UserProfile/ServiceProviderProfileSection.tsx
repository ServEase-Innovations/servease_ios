/* eslint-disable */
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  Modal,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAuth0 } from 'react-native-auth0';
import { useAppUser } from '../context/AppUserContext';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import Slider from '@react-native-community/slider';
import providerInstance from '../services/providerInstance';
import { useTheme } from '../../src/Settings/ThemeContext';

const { width } = Dimensions.get('window');

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

interface DisabledRange {
  start: number;
  end: number;
}

interface ValidationState {
  loading: boolean;
  error: string;
  isAvailable: boolean | null;
  formatError: boolean;
}

interface ServiceProviderProfileSectionProps {
  userId: number | null;
  userEmail: string | null;
  onBack?: () => void;
}

const ServiceProviderProfileSection: React.FC<ServiceProviderProfileSectionProps> = ({
  userId,
  userEmail,
  onBack,
}) => {
  const { t } = useTranslation();
  const { user: auth0User } = useAuth0();
  const { appUser } = useAppUser();
  const { colors, fontSize, isDarkMode } = useTheme();

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
  const [selectedTimeSlotIndex, setSelectedTimeSlotIndex] = useState<{ type: string; index: number } | null>(null);
  const [showTimePickerModal, setShowTimePickerModal] = useState(false);

  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    contactNumber: '',
    altContactNumber: '',
    gender: '',
    dob: '',
    diet: '',
    cookingSpeciality: '',
    nannyCareType: '',
    housekeepingRole: [] as string[],
    experience: 0,
    languageKnown: '',
    timeslot: '',
  });

  const [originalData, setOriginalData] = useState({ ...userData });

  // Mobile validation states
  const [contactValidation, setContactValidation] = useState<ValidationState>({
    loading: false,
    error: '',
    isAvailable: null,
    formatError: false,
  });

  const [altContactValidation, setAltContactValidation] = useState<ValidationState>({
    loading: false,
    error: '',
    isAvailable: null,
    formatError: false,
  });

  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState({
    personal: true,
    professional: true,
    address: true,
    availability: true,
    kyc: true,
    additional: true,
  });

  // Get font sizes based on theme
  const getFontSizes = () => {
    switch (fontSize) {
      case 'small':
        return {
          greeting: 20,
          roleText: 13,
          formTitle: 18,
          sectionTitle: 13,
          inputLabel: 13,
          input: 13,
          buttonText: 13,
          addressType: 13,
          addressText: 13,
          footerText: 11,
          validationText: 11,
        };
      case 'large':
        return {
          greeting: 26,
          roleText: 16,
          formTitle: 22,
          sectionTitle: 16,
          inputLabel: 16,
          input: 16,
          buttonText: 16,
          addressType: 16,
          addressText: 16,
          footerText: 14,
          validationText: 14,
        };
      default:
        return {
          greeting: 22,
          roleText: 14,
          formTitle: 20,
          sectionTitle: 14,
          inputLabel: 14,
          input: 14,
          buttonText: 14,
          addressType: 14,
          addressText: 14,
          footerText: 12,
          validationText: 12,
        };
    }
  };

  const fontSizes = getFontSizes();

  const serviceTypes = [
    { value: 'COOK', label: t('profile.page.cook'), icon: 'chef-hat' },
    { value: 'NANNY', label: t('profile.page.nanny'), icon: 'heart' },
    { value: 'MAID', label: t('profile.page.maid'), icon: 'briefcase' },
  ];

  const dietOptions = [
    { value: 'VEG', label: t('profile.page.veg') },
    { value: 'NONVEG', label: t('profile.page.nonVeg') },
    { value: 'BOTH', label: t('profile.page.both') },
  ];

  const cookingSpecialityOptions = [
    { value: 'VEG', label: t('profile.page.veg') },
    { value: 'NONVEG', label: t('profile.page.nonVeg') },
    { value: 'BOTH', label: t('profile.page.both') },
  ];

  const nannyCareOptions = [
    { value: 'BABY_CARE', label: t('profile.page.babyCare') },
    { value: 'ELDERLY_CARE', label: t('profile.page.elderlyCare') },
    { value: 'BOTH', label: t('profile.page.both') },
  ];

  const genderOptions = [
    { value: 'MALE', label: t('profile.page.male') },
    { value: 'FEMALE', label: t('profile.page.female') },
    { value: 'OTHER', label: t('profile.page.other') },
  ];

  // Helper functions for time slots
  const formatDisplayTime = (value: number): string => {
    const hour = Math.floor(value);
    const minute = (value % 1) * 60;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour}:${minute === 0 ? '00' : minute} ${ampm}`;
  };

  const parseTimeToNumber = (timeStr: string): number => {
    const [time, period] = timeStr.trim().split(' ');
    let [hour, minute] = time.split(':').map(Number);
    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    return hour + (minute / 60);
  };

  const formatSelectedTimeSlots = (): string => {
    const allSlots = [...morningSlots, ...eveningSlots];
    if (allSlots.length === 0) return '';
    return allSlots
      .map(slot => `${formatDisplayTime(slot[0])} - ${formatDisplayTime(slot[1])}`)
      .join(', ');
  };

  // Validation functions
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
        error: isAvailable ? '' : `${isAlternate ? t('profile.page.alternate') : t('profile.page.mobile')} ${t('errors.numberAlreadyRegistered')}`,
        isAvailable,
        formatError: false,
      });

      return isAvailable;
    } catch (error) {
      setValidation({
        loading: false,
        error: `${t('errors.errorCheckingNumber')} ${isAlternate ? t('profile.page.alternate') : t('profile.page.mobile')}`,
        isAvailable: false,
        formatError: false,
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
        languageKnown = languageKnown.join(', ');
      }

      // Parse housekeepingRole
      let roles: string[] = [];
      if (typeof data.housekeepingRole === 'string') {
        if (data.housekeepingRole.includes(',')) {
          roles = data.housekeepingRole.split(',').map((r: string) => r.trim());
        } else {
          roles = [data.housekeepingRole];
        }
      } else if (Array.isArray(data.housekeepingRole)) {
        roles = data.housekeepingRole;
      }

      // Parse time slots if they exist
      if (data.timeslot) {
        const slots = data.timeslot.split(',').map((slot: string) => slot.trim());
        const morning: number[][] = [];
        const evening: number[][] = [];

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
              console.error('Error parsing time slot:', slot);
            }
          }
        });

        setMorningSlots(morning);
        setEveningSlots(evening);
        setIsFullTime(morning.length === 0 && evening.length === 0);
      } else {
        setMorningSlots([]);
        setEveningSlots([]);
        setIsFullTime(true);
      }

      const updatedUserData = {
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        middleName: data.middleName || '',
        email: data.emailId || userEmail || '',
        contactNumber: data.mobileNo || '',
        altContactNumber: data.alternateNo && data.alternateNo !== '0' ? data.alternateNo : '',
        gender: data.gender || '',
        dob: data.dob ? new Date(data.dob).toLocaleDateString() : '',
        diet: data.diet || '',
        cookingSpeciality: data.cookingSpeciality || '',
        nannyCareType: data.nannyCareType || '',
        housekeepingRole: roles,
        experience: data.experience || 0,
        languageKnown: languageKnown || '',
        timeslot: data.timeslot || '',
      };

      setUserData(updatedUserData);
      setOriginalData(updatedUserData);

      setContactValidation({ loading: false, error: '', isAvailable: null, formatError: false });
      setAltContactValidation({ loading: false, error: '', isAvailable: null, formatError: false });
    } catch (error) {
      console.error('Failed to fetch service provider data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchServiceProviderData();
    }

    return () => {
      if (contactDebounceRef.current) clearTimeout(contactDebounceRef.current);
      if (altContactDebounceRef.current) clearTimeout(altContactDebounceRef.current);
    };
  }, [userId]);

  // Time slot handlers
  const handleAddMorningSlot = () => {
    if (morningSlots.length < 12) {
      setMorningSlots([...morningSlots, [6, 12]]);
    }
  };

  const handleRemoveMorningSlot = (index: number) => {
    setMorningSlots(morningSlots.filter((_, i) => i !== index));
  };

  const handleAddEveningSlot = () => {
    if (eveningSlots.length < 16) {
      setEveningSlots([...eveningSlots, [12, 20]]);
    }
  };

  const handleRemoveEveningSlot = (index: number) => {
    setEveningSlots(eveningSlots.filter((_, i) => i !== index));
  };

  const handleMorningSlotChange = (index: number, newStart: number, newEnd: number) => {
    const updatedSlots = [...morningSlots];
    updatedSlots[index] = [newStart, newEnd];
    setMorningSlots(updatedSlots);
  };

  const handleEveningSlotChange = (index: number, newStart: number, newEnd: number) => {
    const updatedSlots = [...eveningSlots];
    updatedSlots[index] = [newStart, newEnd];
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
    const cleanedValue = value.replace(/\D/g, '').slice(0, 10);
    setUserData(prev => ({ ...prev, contactNumber: cleanedValue }));

    setContactValidation({ loading: false, error: '', isAvailable: null, formatError: false });

    if (cleanedValue.length === 10) {
      setTimeout(() => checkMobileAvailability(cleanedValue, false), 800);
    } else if (cleanedValue) {
      setContactValidation({
        loading: false,
        error: t('profile.page.exactly10Digits'),
        isAvailable: null,
        formatError: true,
      });
    }
  };

  const handleAltContactNumberChange = (value: string) => {
    const cleanedValue = value.replace(/\D/g, '').slice(0, 10);
    setUserData(prev => ({ ...prev, altContactNumber: cleanedValue }));

    setAltContactValidation({ loading: false, error: '', isAvailable: null, formatError: false });

    if (cleanedValue.length === 10) {
      if (cleanedValue === userData.contactNumber) {
        setAltContactValidation({
          loading: false,
          error: t('profile.page.numbersMustBeDifferent'),
          isAvailable: false,
          formatError: false,
        });
      } else {
        setTimeout(() => checkMobileAvailability(cleanedValue, true), 800);
      }
    } else if (cleanedValue) {
      setAltContactValidation({
        loading: false,
        error: t('profile.page.exactly10Digits'),
        isAvailable: null,
        formatError: true,
      });
    }
  };

  const handleRoleToggle = (role: string) => {
    setUserData(prev => ({
      ...prev,
      housekeepingRole: prev.housekeepingRole.includes(role)
        ? prev.housekeepingRole.filter(r => r !== role)
        : [...prev.housekeepingRole, role],
    }));
  };

  const handleSave = async () => {
    if (!userId) return;

    // Validate mobile numbers
    if (userData.contactNumber && !validateMobileFormat(userData.contactNumber)) {
      Alert.alert(t('common.error'), t('profile.page.enterValidContact'));
      return;
    }

    if (userData.altContactNumber && !validateMobileFormat(userData.altContactNumber)) {
      Alert.alert(t('common.error'), t('profile.page.enterValidAlternate'));
      return;
    }

    if (
      userData.contactNumber &&
      userData.altContactNumber &&
      userData.contactNumber === userData.altContactNumber
    ) {
      Alert.alert(t('common.error'), t('profile.page.numbersMustBeDifferent'));
      return;
    }

    setIsSaving(true);

    try {
      const payload: any = {};

      // Compare field by field and add ONLY changed ones
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
        userData.housekeepingRole.join(',') !==
        originalData.housekeepingRole.join(',')
      ) {
        payload.housekeepingRole = userData.housekeepingRole.join(',');
      }

      if (userData.experience !== originalData.experience) {
        payload.experience = userData.experience;
      }

      if (userData.languageKnown !== originalData.languageKnown) {
        payload.languageKnown = userData.languageKnown;
      }

      // Handle time slots
      let timeslotString = '';
      if (!isFullTime) {
        const allSlots = [...morningSlots, ...eveningSlots];
        if (allSlots.length > 0) {
          timeslotString = allSlots
            .map(slot => `${formatDisplayTime(slot[0])} - ${formatDisplayTime(slot[1])}`)
            .join(',');
        }
      }

      if (timeslotString !== originalData.timeslot) {
        payload.timeslot = timeslotString || null;
      }

      // If nothing changed, skip API
      if (Object.keys(payload).length === 0) {
        Alert.alert(t('common.info'), t('profile.page.noChangesDetected'));
        setIsEditing(false);
        return;
      }

      await providerInstance.put(
        `/api/service-providers/serviceprovider/${userId}`,
        payload
      );

      await fetchServiceProviderData();
      setIsEditing(false);
      Alert.alert(t('common.success'), t('profile.page.updateSuccess'));
    } catch (error) {
      console.error('Failed to save data:', error);
      Alert.alert(t('common.error'), t('profile.page.updateFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setUserData(originalData);
    setIsEditing(false);
    setContactValidation({ loading: false, error: '', isAvailable: null, formatError: false });
    setAltContactValidation({ loading: false, error: '', isAvailable: null, formatError: false });
    // Reset time slots to original state
    if (providerData?.timeslot) {
      const slots = providerData.timeslot.split(',').map((slot: string) => slot.trim());
      const morning: number[][] = [];
      const evening: number[][] = [];

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
            console.error('Error parsing time slot:', slot);
          }
        }
      });

      setMorningSlots(morning);
      setEveningSlots(evening);
      setIsFullTime(morning.length === 0 && evening.length === 0);
    } else {
      setMorningSlots([]);
      setEveningSlots([]);
      setIsFullTime(true);
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const hasChanges = (): boolean => {
    const currentTimeSlotString = !isFullTime ? formatSelectedTimeSlots() : '';
    const timeSlotChanged = currentTimeSlotString !== originalData.timeslot;

    return JSON.stringify(userData) !== JSON.stringify(originalData) || timeSlotChanged;
  };

  const isFormValid = (): boolean => {
    if (userData.contactNumber && !validateMobileFormat(userData.contactNumber)) return false;
    if (userData.altContactNumber && !validateMobileFormat(userData.altContactNumber)) return false;
    if (userData.contactNumber && userData.altContactNumber &&
      userData.contactNumber === userData.altContactNumber) return false;
    return true;
  };

  const getKYCStatus = () => {
    if (!providerData) return { status: t('profile.page.pending'), color: '#ef4444', icon: 'x-circle' };

    if (providerData.kyc) {
      return {
        status: t('profile.page.verified'),
        color: '#10b981',
        icon: 'check-circle',
        details: providerData.kycType ? `(${providerData.kycType})` : '',
      };
    }

    if (providerData.kycNumber && providerData.kycType) {
      return {
        status: t('profile.page.pendingVerification'),
        color: '#f59e0b',
        icon: 'alert-circle',
        details: `${providerData.kycType} ${t('profile.page.numberProvidedAwaitingVerification')}`,
      };
    }

    return {
      status: t('profile.page.notSubmitted'),
      color: '#ef4444',
      icon: 'x-circle',
      details: t('profile.page.pleaseSubmitKYCDocuments'),
    };
  };

  const kycStatus = getKYCStatus();

  const getIconComponent = (iconName: string, size: number, color: string) => {
    switch (iconName) {
      case 'check-circle':
        return <MaterialCommunityIcons name="check-circle" size={size} color={color} />;
      case 'alert-circle':
        return <MaterialCommunityIcons name="alert-circle" size={size} color={color} />;
      case 'x-circle':
        return <MaterialCommunityIcons name="close-circle" size={size} color={color} />;
      case 'chef-hat':
        return <MaterialCommunityIcons name="chef-hat" size={size} color={color} />;
      case 'heart':
        return <MaterialCommunityIcons name="heart" size={size} color={color} />;
      case 'briefcase':
        return <MaterialCommunityIcons name="briefcase" size={size} color={color} />;
      default:
        return <Icon name={iconName} size={size} color={color} />;
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.skeletonCard, { backgroundColor: colors.card }]}>
          <View style={styles.skeletonHeader}>
            <View>
              <View style={[styles.skeletonTitle, { backgroundColor: colors.surface }]} />
              <View style={styles.skeletonStatusRow}>
                <View style={[styles.skeletonStatus, { backgroundColor: colors.surface }]} />
                <View style={[styles.skeletonRating, { backgroundColor: colors.surface }]} />
              </View>
            </View>
            <View style={[styles.skeletonButton, { backgroundColor: colors.surface }]} />
          </View>

          {[1, 2, 3, 4, 5].map((_, idx) => (
            <View key={idx} style={styles.skeletonSection}>
              <View style={styles.skeletonSectionHeader}>
                <View style={[styles.skeletonSectionIcon, { backgroundColor: colors.surface }]} />
                <View style={[styles.skeletonSectionTitle, { backgroundColor: colors.surface }]} />
              </View>
              <View style={styles.skeletonGrid}>
                {[1, 2, 3].map((_, i) => (
                  <View key={i} style={styles.skeletonInputGroup}>
                    <View style={[styles.skeletonLabel, { backgroundColor: colors.surface }]} />
                    <View style={[styles.skeletonInput, { backgroundColor: colors.surface }]} />
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.mainContent}>
          <View style={[styles.formContainer, { backgroundColor: colors.card }]}>
            {/* Header */}
            <View style={[styles.formHeader, { borderBottomColor: colors.border }]}>
              <View>
                <Text style={[styles.formTitle, { color: colors.text, fontSize: fontSizes.formTitle }]}>
                  {t('profile.page.serviceProviderProfile')}
                </Text>
                <View style={styles.statusRow}>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: providerData?.isactive ? colors.successLight : colors.errorLight,
                      },
                    ]}
                  >
                    {getIconComponent(
                      providerData?.isactive ? 'check-circle' : 'close-circle',
                      12,
                      providerData?.isactive ? colors.success : colors.error
                    )}
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color: providerData?.isactive ? colors.success : colors.error,
                          fontSize: fontSizes.roleText,
                        },
                      ]}
                    >
                      {providerData?.isactive ? t('profile.page.active') : t('profile.page.inactive')}
                    </Text>
                  </View>
                  {providerData?.rating && providerData.rating > 0 && (
                    <View style={styles.ratingContainer}>
                      <Icon name="star" size={14} color="#f59e0b" />
                      <Text style={[styles.ratingText, { color: colors.textSecondary, fontSize: fontSizes.roleText }]}>
                        {providerData.rating}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              {!isEditing && (
                <TouchableOpacity
                  style={[styles.editButtonTop, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    setOriginalData({ ...userData });
                    setIsEditing(true);
                  }}
                >
                  <Icon name="edit-3" size={16} color="#fff" />
                  <Text style={[styles.editButtonText, { color: '#fff', fontSize: fontSizes.buttonText }]}>
                    {t('profile.page.editProfile')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Personal Information Section */}
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => toggleSection('personal')}
              >
                <View style={styles.sectionHeaderLeft}>
                  <Icon name="user" size={18} color={colors.primary} />
                  <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontSize: fontSizes.sectionTitle }]}>
                    {t('profile.page.personalInformation')}
                  </Text>
                </View>
                <Icon
                  name={expandedSections.personal ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>

              {expandedSections.personal && (
                <View style={styles.sectionContent}>
                  <View style={styles.inputRow}>
                    <View style={styles.inputContainer}>
                      <Text style={[styles.inputLabel, { color: colors.text, fontSize: fontSizes.inputLabel }]}>
                        {t('profile.page.firstName')}
                      </Text>
                      <TextInput
                        style={[
                          styles.input,
                          {
                            borderColor: colors.border,
                            backgroundColor: isEditing ? colors.card : colors.surface,
                            color: colors.text,
                            fontSize: fontSizes.input,
                          },
                          !isEditing && styles.readOnlyInput,
                        ]}
                        value={userData.firstName}
                        onChangeText={value => setUserData(prev => ({ ...prev, firstName: value }))}
                        editable={isEditing}
                        placeholder={t('profile.page.firstNamePlaceholder')}
                        placeholderTextColor={colors.placeholder}
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={[styles.inputLabel, { color: colors.text, fontSize: fontSizes.inputLabel }]}>
                        {t('profile.page.middleName')}
                      </Text>
                      <TextInput
                        style={[
                          styles.input,
                          {
                            borderColor: colors.border,
                            backgroundColor: isEditing ? colors.card : colors.surface,
                            color: colors.text,
                            fontSize: fontSizes.input,
                          },
                          !isEditing && styles.readOnlyInput,
                        ]}
                        value={userData.middleName}
                        onChangeText={value => setUserData(prev => ({ ...prev, middleName: value }))}
                        editable={isEditing}
                        placeholder={t('profile.page.middleNamePlaceholder')}
                        placeholderTextColor={colors.placeholder}
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={[styles.inputLabel, { color: colors.text, fontSize: fontSizes.inputLabel }]}>
                        {t('profile.page.lastName')}
                      </Text>
                      <TextInput
                        style={[
                          styles.input,
                          {
                            borderColor: colors.border,
                            backgroundColor: isEditing ? colors.card : colors.surface,
                            color: colors.text,
                            fontSize: fontSizes.input,
                          },
                          !isEditing && styles.readOnlyInput,
                        ]}
                        value={userData.lastName}
                        onChangeText={value => setUserData(prev => ({ ...prev, lastName: value }))}
                        editable={isEditing}
                        placeholder={t('profile.page.lastNamePlaceholder')}
                        placeholderTextColor={colors.placeholder}
                      />
                    </View>
                  </View>

                  <View style={styles.inputRow}>
                    <View style={styles.inputContainer}>
                      <Text style={[styles.inputLabel, { color: colors.text, fontSize: fontSizes.inputLabel }]}>
                        {t('profile.page.email')}
                      </Text>
                      <TextInput
                        style={[
                          styles.input,
                          styles.readOnlyInput,
                          {
                            borderColor: colors.border,
                            backgroundColor: colors.surface,
                            color: colors.text,
                            fontSize: fontSizes.input,
                          },
                        ]}
                        value={userData.email}
                        editable={false}
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={[styles.inputLabel, { color: colors.text, fontSize: fontSizes.inputLabel }]}>
                        {t('profile.page.contactNumber')}
                      </Text>
                      <View style={styles.phoneInputContainer}>
                        <TextInput
                          style={[
                            styles.phoneInput,
                            {
                              borderColor: contactValidation.error ? colors.error : colors.border,
                              backgroundColor: isEditing ? colors.card : colors.surface,
                              color: colors.text,
                              fontSize: fontSizes.input,
                            },
                            !isEditing && styles.readOnlyInput,
                          ]}
                          value={userData.contactNumber}
                          onChangeText={handleContactNumberChange}
                          placeholder={t('profile.page.enter10Digit')}
                          placeholderTextColor={colors.placeholder}
                          editable={isEditing}
                          keyboardType="phone-pad"
                          maxLength={10}
                        />
                        {isEditing && (
                          <View style={styles.validationIcon}>
                            {contactValidation.loading && (
                              <ActivityIndicator size="small" color={colors.primary} />
                            )}
                            {contactValidation.isAvailable && !contactValidation.loading && (
                              <Icon name="check" size={16} color={colors.success} />
                            )}
                            {contactValidation.isAvailable === false && !contactValidation.loading && (
                              <Icon name="alert-circle" size={16} color={colors.error} />
                            )}
                          </View>
                        )}
                      </View>
                      {contactValidation.error && (
                        <Text style={[styles.validationError, { color: colors.error, fontSize: fontSizes.validationText }]}>
                          {contactValidation.error}
                        </Text>
                      )}
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={[styles.inputLabel, { color: colors.text, fontSize: fontSizes.inputLabel }]}>
                        {t('profile.page.alternativeContact')}
                      </Text>
                      <View style={styles.phoneInputContainer}>
                        <TextInput
                          style={[
                            styles.phoneInput,
                            {
                              borderColor: altContactValidation.error ? colors.error : colors.border,
                              backgroundColor: isEditing ? colors.card : colors.surface,
                              color: colors.text,
                              fontSize: fontSizes.input,
                            },
                            !isEditing && styles.readOnlyInput,
                          ]}
                          value={userData.altContactNumber}
                          onChangeText={handleAltContactNumberChange}
                          placeholder={t('profile.page.enter10Digit')}
                          placeholderTextColor={colors.placeholder}
                          editable={isEditing}
                          keyboardType="phone-pad"
                          maxLength={10}
                        />
                        {isEditing && (
                          <View style={styles.validationIcon}>
                            {altContactValidation.loading && (
                              <ActivityIndicator size="small" color={colors.primary} />
                            )}
                            {altContactValidation.isAvailable && !altContactValidation.loading && (
                              <Icon name="check" size={16} color={colors.success} />
                            )}
                            {altContactValidation.isAvailable === false && !altContactValidation.loading && (
                              <Icon name="alert-circle" size={16} color={colors.error} />
                            )}
                          </View>
                        )}
                      </View>
                      {altContactValidation.error && (
                        <Text style={[styles.validationError, { color: colors.error, fontSize: fontSizes.validationText }]}>
                          {altContactValidation.error}
                        </Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.inputRow}>
                    <View style={styles.inputContainer}>
                      <Text style={[styles.inputLabel, { color: colors.text, fontSize: fontSizes.inputLabel }]}>
                        {t('profile.page.gender')}
                      </Text>
                      {isEditing ? (
                        <View style={[styles.pickerContainer, { borderColor: colors.border }]}>
                          <Picker
                            selectedValue={userData.gender}
                            onValueChange={value => setUserData(prev => ({ ...prev, gender: value }))}
                            style={{ color: colors.text }}
                          >
                            <Picker.Item label={t('profile.page.selectGender')} value="" />
                            {genderOptions.map(opt => (
                              <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
                            ))}
                          </Picker>
                        </View>
                      ) : (
                        <TextInput
                          style={[
                            styles.input,
                            styles.readOnlyInput,
                            {
                              borderColor: colors.border,
                              backgroundColor: colors.surface,
                              color: colors.text,
                              fontSize: fontSizes.input,
                            },
                          ]}
                          value={
                            userData.gender
                              ? genderOptions.find(g => g.value === userData.gender)?.label || userData.gender
                              : t('profile.page.notSpecified')
                          }
                          editable={false}
                        />
                      )}
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={[styles.inputLabel, { color: colors.text, fontSize: fontSizes.inputLabel }]}>
                        {t('profile.page.dateOfBirth')}
                      </Text>
                      <TextInput
                        style={[
                          styles.input,
                          styles.readOnlyInput,
                          {
                            borderColor: colors.border,
                            backgroundColor: colors.surface,
                            color: colors.text,
                            fontSize: fontSizes.input,
                          },
                        ]}
                        value={userData.dob || t('profile.page.notSpecified')}
                        editable={false}
                      />
                    </View>
                  </View>
                </View>
              )}
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Professional Information Section */}
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => toggleSection('professional')}
              >
                <View style={styles.sectionHeaderLeft}>
                  <Icon name="briefcase" size={18} color={colors.primary} />
                  <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontSize: fontSizes.sectionTitle }]}>
                    {t('profile.page.professionalInformation')}
                  </Text>
                </View>
                <Icon
                  name={expandedSections.professional ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>

              {expandedSections.professional && (
                <View style={styles.sectionContent}>
                  {/* Service Types */}
                  <View>
                    <Text style={[styles.inputLabel, { color: colors.text, fontSize: fontSizes.inputLabel, marginBottom: 12 }]}>
                      {t('profile.page.serviceTypes')}
                    </Text>
                    {isEditing ? (
                      <View style={styles.serviceTypesGrid}>
                        {serviceTypes.map(service => (
                          <TouchableOpacity
                            key={service.value}
                            style={[
                              styles.serviceTypeCard,
                              {
                                borderColor: colors.border,
                                backgroundColor: colors.card,
                              },
                              userData.housekeepingRole.includes(service.value) && [
                                styles.serviceTypeCardActive,
                                { borderColor: colors.primary, backgroundColor: colors.primary + '20' },
                              ],
                            ]}
                            onPress={() => handleRoleToggle(service.value)}
                          >
                            <View style={styles.serviceTypeContent}>
                              <View style={styles.serviceTypeIcon}>
                                {getIconComponent(service.icon, 16, userData.housekeepingRole.includes(service.value) ? colors.primary : colors.textSecondary)}
                              </View>
                              <Text
                                style={[
                                  styles.serviceTypeText,
                                  {
                                    color: userData.housekeepingRole.includes(service.value) ? colors.primary : colors.text,
                                    fontSize: fontSizes.inputLabel,
                                  },
                                ]}
                              >
                                {service.label}
                              </Text>
                            </View>
                            {userData.housekeepingRole.includes(service.value) && (
                              <Icon name="check" size={16} color={colors.primary} />
                            )}
                          </TouchableOpacity>
                        ))}
                      </View>
                    ) : (
                      <View style={styles.serviceTypesList}>
                        {userData.housekeepingRole.length > 0 ? (
                          userData.housekeepingRole.map(role => (
                            <View
                              key={role}
                              style={[styles.serviceTypeBadge, { backgroundColor: colors.primary + '20' }]}
                            >
                              <Text style={[styles.serviceTypeBadgeText, { color: colors.primary, fontSize: fontSizes.inputLabel }]}>
                                {serviceTypes.find(s => s.value === role)?.label || role}
                              </Text>
                            </View>
                          ))
                        ) : (
                          <Text style={[styles.noDataText, { color: colors.textSecondary, fontSize: fontSizes.roleText }]}>
                            {t('profile.page.noServicesSelected')}
                          </Text>
                        )}
                      </View>
                    )}
                  </View>

                  {/* Cook-specific fields */}
                  {userData.housekeepingRole.includes('COOK') && (
                    <View style={styles.serviceSpecificFields}>
                      <View style={styles.inputContainer}>
                        <Text style={[styles.inputLabel, { color: colors.text, fontSize: fontSizes.inputLabel }]}>
                          {t('profile.page.cookingSpeciality')}
                        </Text>
                        {isEditing ? (
                          <View style={[styles.pickerContainer, { borderColor: colors.border }]}>
                            <Picker
                              selectedValue={userData.cookingSpeciality}
                              onValueChange={value => setUserData(prev => ({ ...prev, cookingSpeciality: value }))}
                              style={{ color: colors.text }}
                            >
                              <Picker.Item label={t('profile.page.selectSpeciality')} value="" />
                              {cookingSpecialityOptions.map(opt => (
                                <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
                              ))}
                            </Picker>
                          </View>
                        ) : (
                          <TextInput
                            style={[
                              styles.input,
                              styles.readOnlyInput,
                              {
                                borderColor: colors.border,
                                backgroundColor: colors.surface,
                                color: colors.text,
                                fontSize: fontSizes.input,
                              },
                            ]}
                            value={
                              userData.cookingSpeciality
                                ? cookingSpecialityOptions.find(o => o.value === userData.cookingSpeciality)?.label || userData.cookingSpeciality
                                : t('profile.page.notSpecified')
                            }
                            editable={false}
                          />
                        )}
                      </View>
                    </View>
                  )}

                  {/* Nanny-specific fields */}
                  {userData.housekeepingRole.includes('NANNY') && (
                    <View style={styles.serviceSpecificFields}>
                      <View style={styles.inputContainer}>
                        <Text style={[styles.inputLabel, { color: colors.text, fontSize: fontSizes.inputLabel }]}>
                          {t('profile.page.careType')}
                        </Text>
                        {isEditing ? (
                          <View style={[styles.pickerContainer, { borderColor: colors.border }]}>
                            <Picker
                              selectedValue={userData.nannyCareType}
                              onValueChange={value => setUserData(prev => ({ ...prev, nannyCareType: value }))}
                              style={{ color: colors.text }}
                            >
                              <Picker.Item label={t('profile.page.selectCareType')} value="" />
                              {nannyCareOptions.map(opt => (
                                <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
                              ))}
                            </Picker>
                          </View>
                        ) : (
                          <TextInput
                            style={[
                              styles.input,
                              styles.readOnlyInput,
                              {
                                borderColor: colors.border,
                                backgroundColor: colors.surface,
                                color: colors.text,
                                fontSize: fontSizes.input,
                              },
                            ]}
                            value={
                              userData.nannyCareType
                                ? nannyCareOptions.find(o => o.value === userData.nannyCareType)?.label || userData.nannyCareType
                                : t('profile.page.notSpecified')
                            }
                            editable={false}
                          />
                        )}
                      </View>
                    </View>
                  )}

                  {/* Diet Preference */}
                  {(userData.housekeepingRole.includes('COOK') ||
                    userData.housekeepingRole.includes('NANNY') ||
                    userData.housekeepingRole.includes('MAID')) && (
                    <View style={styles.inputContainer}>
                      <Text style={[styles.inputLabel, { color: colors.text, fontSize: fontSizes.inputLabel }]}>
                        {t('profile.page.dietPreference')}
                      </Text>
                      {isEditing ? (
                        <View style={[styles.pickerContainer, { borderColor: colors.border }]}>
                          <Picker
                            selectedValue={userData.diet}
                            onValueChange={value => setUserData(prev => ({ ...prev, diet: value }))}
                            style={{ color: colors.text }}
                          >
                            <Picker.Item label={t('profile.page.selectDiet')} value="" />
                            {dietOptions.map(opt => (
                              <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
                            ))}
                          </Picker>
                        </View>
                      ) : (
                        <TextInput
                          style={[
                            styles.input,
                            styles.readOnlyInput,
                            {
                              borderColor: colors.border,
                              backgroundColor: colors.surface,
                              color: colors.text,
                              fontSize: fontSizes.input,
                            },
                          ]}
                          value={
                            userData.diet
                              ? dietOptions.find(o => o.value === userData.diet)?.label || userData.diet
                              : t('profile.page.notSpecified')
                          }
                          editable={false}
                        />
                      )}
                    </View>
                  )}

                  {/* Common fields */}
                  <View style={styles.inputRow}>
                    <View style={styles.inputContainer}>
                      <Text style={[styles.inputLabel, { color: colors.text, fontSize: fontSizes.inputLabel }]}>
                        {t('profile.page.experience')} ({t('profile.page.years')})
                      </Text>
                      <TextInput
                        style={[
                          styles.input,
                          {
                            borderColor: colors.border,
                            backgroundColor: isEditing ? colors.card : colors.surface,
                            color: colors.text,
                            fontSize: fontSizes.input,
                          },
                          !isEditing && styles.readOnlyInput,
                        ]}
                        value={userData.experience.toString()}
                        onChangeText={value => setUserData(prev => ({ ...prev, experience: parseInt(value) || 0 }))}
                        editable={isEditing}
                        keyboardType="numeric"
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={[styles.inputLabel, { color: colors.text, fontSize: fontSizes.inputLabel }]}>
                        {t('profile.page.languagesKnown')}
                      </Text>
                      <TextInput
                        style={[
                          styles.input,
                          {
                            borderColor: colors.border,
                            backgroundColor: isEditing ? colors.card : colors.surface,
                            color: colors.text,
                            fontSize: fontSizes.input,
                          },
                          !isEditing && styles.readOnlyInput,
                        ]}
                        value={userData.languageKnown}
                        onChangeText={value => setUserData(prev => ({ ...prev, languageKnown: value }))}
                        editable={isEditing}
                        placeholder={t('profile.page.languagesPlaceholder')}
                        placeholderTextColor={colors.placeholder}
                      />
                    </View>
                  </View>
                </View>
              )}
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Availability Section */}
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => toggleSection('availability')}
              >
                <View style={styles.sectionHeaderLeft}>
                  <Icon name="clock" size={18} color={colors.primary} />
                  <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontSize: fontSizes.sectionTitle }]}>
                    {t('profile.page.availability')}
                  </Text>
                </View>
                <Icon
                  name={expandedSections.availability ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>

              {expandedSections.availability && (
                <View style={styles.sectionContent}>
                  {isEditing ? (
                    <View>
                      {/* Full Time Toggle */}
                      <View style={[styles.fullTimeContainer, { backgroundColor: isFullTime ? colors.primary + '20' : colors.surface }]}>
                        <View style={styles.fullTimeContent}>
                          <View>
                            <Text style={[styles.fullTimeTitle, { color: colors.text, fontSize: fontSizes.inputLabel, fontWeight: 'bold' }]}>
                              {t('profile.page.fullTimeAvailability')}
                            </Text>
                            <Text style={[styles.fullTimeDescription, { color: colors.textSecondary, fontSize: fontSizes.roleText }]}>
                              {t('profile.page.fullTimeDescription')}
                            </Text>
                          </View>
                          <Switch
                            value={isFullTime}
                            onValueChange={handleFullTimeToggle}
                            trackColor={{ false: colors.border, true: colors.primary }}
                            thumbColor={isFullTime ? '#fff' : '#f4f3f4'}
                          />
                        </View>
                      </View>

                      {!isFullTime && (
                        <View>
                          {/* Morning Slots */}
                          <View style={styles.timeSlotSection}>
                            <View style={styles.timeSlotHeader}>
                              <View style={styles.timeSlotTitleContainer}>
                                <Icon name="sunrise" size={16} color={colors.primary} />
                                <Text style={[styles.timeSlotTitle, { color: colors.text, fontSize: fontSizes.inputLabel }]}>
                                  {t('profile.page.morningAvailability')}
                                </Text>
                              </View>
                              <TouchableOpacity
                                style={[styles.addSlotButton, { backgroundColor: colors.primary }]}
                                onPress={handleAddMorningSlot}
                                disabled={morningSlots.length >= 12}
                              >
                                <Icon name="plus" size={14} color="#fff" />
                                <Text style={[styles.addSlotText, { color: '#fff', fontSize: fontSizes.buttonText }]}>
                                  {morningSlots.length === 0 ? t('profile.page.addMorningSlots') : t('profile.page.addSlot')}
                                </Text>
                              </TouchableOpacity>
                            </View>

                            {morningSlots.length === 0 ? (
                              <View style={[styles.emptySlotContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                <Text style={[styles.emptySlotText, { color: colors.textSecondary, fontSize: fontSizes.roleText }]}>
                                  {t('profile.page.notAvailableMorning')}
                                </Text>
                              </View>
                            ) : (
                              morningSlots.map((slot, index) => (
                                <View key={`morning-${index}`} style={[styles.timeSlotCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                  <View style={styles.timeSlotCardHeader}>
                                    <Text style={[styles.timeSlotNumber, { color: colors.primary, fontSize: fontSizes.inputLabel }]}>
                                      {t('profile.page.timeSlot')} {index + 1}
                                    </Text>
                                    {morningSlots.length > 1 && (
                                      <TouchableOpacity onPress={() => handleRemoveMorningSlot(index)}>
                                        <Icon name="x" size={18} color={colors.error} />
                                      </TouchableOpacity>
                                    )}
                                  </View>
                                  <Text style={[styles.selectedTimeText, { color: colors.textSecondary, fontSize: fontSizes.roleText }]}>
                                    {t('profile.page.selected')} {formatDisplayTime(slot[0])} - {formatDisplayTime(slot[1])}
                                  </Text>
                                  <View style={styles.sliderContainer}>
                                    <Text style={[styles.sliderLabel, { color: colors.textSecondary, fontSize: fontSizes.roleText }]}>
                                      {formatDisplayTime(slot[0])}
                                    </Text>
                                    <Slider
                                      style={styles.slider}
                                      minimumValue={6}
                                      maximumValue={12}
                                      step={0.5}
                                      value={slot[0]}
                                      onValueChange={value => handleMorningSlotChange(index, value, slot[1])}
                                      minimumTrackTintColor={colors.primary}
                                      maximumTrackTintColor={colors.border}
                                    />
                                    <Text style={[styles.sliderLabel, { color: colors.textSecondary, fontSize: fontSizes.roleText }]}>
                                      {formatDisplayTime(slot[1])}
                                    </Text>
                                    <Slider
                                      style={styles.slider}
                                      minimumValue={slot[0]}
                                      maximumValue={12}
                                      step={0.5}
                                      value={slot[1]}
                                      onValueChange={value => handleMorningSlotChange(index, slot[0], value)}
                                      minimumTrackTintColor={colors.primary}
                                      maximumTrackTintColor={colors.border}
                                    />
                                  </View>
                                </View>
                              ))
                            )}
                          </View>

                          {/* Evening Slots */}
                          <View style={styles.timeSlotSection}>
                            <View style={styles.timeSlotHeader}>
                              <View style={styles.timeSlotTitleContainer}>
                                <Icon name="sunset" size={16} color={colors.primary} />
                                <Text style={[styles.timeSlotTitle, { color: colors.text, fontSize: fontSizes.inputLabel }]}>
                                  {t('profile.page.eveningAvailability')}
                                </Text>
                              </View>
                              <TouchableOpacity
                                style={[styles.addSlotButton, { backgroundColor: colors.primary }]}
                                onPress={handleAddEveningSlot}
                                disabled={eveningSlots.length >= 16}
                              >
                                <Icon name="plus" size={14} color="#fff" />
                                <Text style={[styles.addSlotText, { color: '#fff', fontSize: fontSizes.buttonText }]}>
                                  {eveningSlots.length === 0 ? t('profile.page.addEveningSlots') : t('profile.page.addSlot')}
                                </Text>
                              </TouchableOpacity>
                            </View>

                            {eveningSlots.length === 0 ? (
                              <View style={[styles.emptySlotContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                <Text style={[styles.emptySlotText, { color: colors.textSecondary, fontSize: fontSizes.roleText }]}>
                                  {t('profile.page.notAvailableEvening')}
                                </Text>
                              </View>
                            ) : (
                              eveningSlots.map((slot, index) => (
                                <View key={`evening-${index}`} style={[styles.timeSlotCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                  <View style={styles.timeSlotCardHeader}>
                                    <Text style={[styles.timeSlotNumber, { color: colors.primary, fontSize: fontSizes.inputLabel }]}>
                                      {t('profile.page.timeSlot')} {index + 1}
                                    </Text>
                                    {eveningSlots.length > 1 && (
                                      <TouchableOpacity onPress={() => handleRemoveEveningSlot(index)}>
                                        <Icon name="x" size={18} color={colors.error} />
                                      </TouchableOpacity>
                                    )}
                                  </View>
                                  <Text style={[styles.selectedTimeText, { color: colors.textSecondary, fontSize: fontSizes.roleText }]}>
                                    {t('profile.page.selected')} {formatDisplayTime(slot[0])} - {formatDisplayTime(slot[1])}
                                  </Text>
                                  <View style={styles.sliderContainer}>
                                    <Text style={[styles.sliderLabel, { color: colors.textSecondary, fontSize: fontSizes.roleText }]}>
                                      {formatDisplayTime(slot[0])}
                                    </Text>
                                    <Slider
                                      style={styles.slider}
                                      minimumValue={12}
                                      maximumValue={20}
                                      step={0.5}
                                      value={slot[0]}
                                      onValueChange={value => handleEveningSlotChange(index, value, slot[1])}
                                      minimumTrackTintColor={colors.primary}
                                      maximumTrackTintColor={colors.border}
                                    />
                                    <Text style={[styles.sliderLabel, { color: colors.textSecondary, fontSize: fontSizes.roleText }]}>
                                      {formatDisplayTime(slot[1])}
                                    </Text>
                                    <Slider
                                      style={styles.slider}
                                      minimumValue={slot[0]}
                                      maximumValue={20}
                                      step={0.5}
                                      value={slot[1]}
                                      onValueChange={value => handleEveningSlotChange(index, slot[0], value)}
                                      minimumTrackTintColor={colors.primary}
                                      maximumTrackTintColor={colors.border}
                                    />
                                  </View>
                                </View>
                              ))
                            )}
                          </View>

                          {/* Summary */}
                          {(morningSlots.length > 0 || eveningSlots.length > 0) && (
                            <View style={[styles.summaryCard, { backgroundColor: colors.infoLight, borderColor: colors.info }]}>
                              <Text style={[styles.summaryTitle, { color: colors.primary, fontSize: fontSizes.inputLabel, fontWeight: 'bold' }]}>
                                {t('profile.page.yourSelectedTimeSlots')}
                              </Text>
                              <Text style={[styles.summaryText, { color: colors.text, fontSize: fontSizes.roleText }]}>
                                {formatSelectedTimeSlots()}
                              </Text>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  ) : (
                    <View>
                      {providerData?.timeslot ? (
                        <View style={styles.timeSlotsContainer}>
                          {providerData.timeslot.split(',').map((slot, index) => (
                            <View key={index} style={[styles.timeSlotBadge, { backgroundColor: colors.successLight }]}>
                              <Icon name="clock" size={12} color={colors.success} />
                              <Text style={[styles.timeSlotBadgeText, { color: colors.success, fontSize: fontSizes.roleText }]}>
                                {slot.trim()}
                              </Text>
                            </View>
                          ))}
                        </View>
                      ) : (
                        <Text style={[styles.noDataText, { color: colors.textSecondary, fontSize: fontSizes.roleText }]}>
                          {t('profile.page.noTimeSlotsSpecified')}
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              )}
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* KYC Information Section */}
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => toggleSection('kyc')}
              >
                <View style={styles.sectionHeaderLeft}>
                  <Icon name="file-text" size={18} color={colors.primary} />
                  <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontSize: fontSizes.sectionTitle }]}>
                    {t('profile.page.kycInformation')}
                  </Text>
                </View>
                <Icon
                  name={expandedSections.kyc ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>

              {expandedSections.kyc && (
                <View style={[styles.kycCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.kycRow}>
                    <View style={styles.kycItem}>
                      <Text style={[styles.kycLabel, { color: colors.textSecondary, fontSize: fontSizes.inputLabel }]}>
                        {t('profile.page.kycStatus')}
                      </Text>
                      <View style={[styles.kycStatusBadge, { backgroundColor: kycStatus.color + '20' }]}>
                        {getIconComponent(kycStatus.icon, 14, kycStatus.color)}
                        <Text style={[styles.kycStatusText, { color: kycStatus.color, fontSize: fontSizes.roleText }]}>
                          {kycStatus.status}
                        </Text>
                      </View>
                    </View>

                    {providerData?.kycType && (
                      <View style={styles.kycItem}>
                        <Text style={[styles.kycLabel, { color: colors.textSecondary, fontSize: fontSizes.inputLabel }]}>
                          {t('profile.page.kycType')}
                        </Text>
                        <View style={styles.kycValueContainer}>
                          <Icon name="file-text" size={14} color={colors.textSecondary} />
                          <Text style={[styles.kycValue, { color: colors.text, fontSize: fontSizes.input }]}>
                            {providerData.kycType}
                          </Text>
                        </View>
                      </View>
                    )}

                    {providerData?.kycNumber && (
                      <View style={styles.kycItem}>
                        <Text style={[styles.kycLabel, { color: colors.textSecondary, fontSize: fontSizes.inputLabel }]}>
                          {t('profile.page.kycNumber')}
                        </Text>
                        <View style={styles.kycValueContainer}>
                          <Icon name="credit-card" size={14} color={colors.textSecondary} />
                          <Text style={[styles.kycValue, { color: colors.text, fontSize: fontSizes.input }]}>
                            {providerData.kycNumber.replace(/(\d{4})(\d{4})(\d{4})/, '$1-$2-$3')}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>

                  {kycStatus.details && (
                    <Text style={[styles.kycDetails, { color: colors.textTertiary, fontSize: fontSizes.validationText }]}>
                      {kycStatus.details}
                    </Text>
                  )}

                  {providerData?.kycImage && (
                    <TouchableOpacity
                      style={styles.viewDocumentButton}
                      onPress={() => {
                        Alert.alert(t('common.info'), t('profile.page.viewDocument'));
                      }}
                    >
                      <Icon name="eye" size={14} color={colors.primary} />
                      <Text style={[styles.viewDocumentText, { color: colors.primary, fontSize: fontSizes.roleText }]}>
                        {t('profile.page.viewDocument')}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Address Information Section */}
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => toggleSection('address')}
              >
                <View style={styles.sectionHeaderLeft}>
                  <Icon name="map-pin" size={18} color={colors.primary} />
                  <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontSize: fontSizes.sectionTitle }]}>
                    {t('profile.page.addressInformation')}
                  </Text>
                </View>
                <Icon
                  name={expandedSections.address ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>

              {expandedSections.address && (
                <View style={styles.sectionContent}>
                  <View style={styles.addressCardsRow}>
                    {providerData?.permanentAddress && (
                      <View style={[styles.addressCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <View style={styles.addressCardHeader}>
                          <Icon name="home" size={16} color={colors.primary} />
                          <Text style={[styles.addressCardTitle, { color: colors.text, fontSize: fontSizes.inputLabel }]}>
                            {t('profile.page.permanentAddress')}
                          </Text>
                        </View>
                        <Text style={[styles.addressCardText, { color: colors.textSecondary, fontSize: fontSizes.addressText }]}>
                          {providerData.permanentAddress.field1} {providerData.permanentAddress.field2}
                        </Text>
                        <Text style={[styles.addressCardText, { color: colors.textSecondary, fontSize: fontSizes.addressText }]}>
                          {providerData.permanentAddress.ctarea}, {providerData.permanentAddress.state}
                        </Text>
                        <Text style={[styles.addressCardText, { color: colors.textSecondary, fontSize: fontSizes.addressText }]}>
                          {providerData.permanentAddress.country} - {providerData.permanentAddress.pinno}
                        </Text>
                      </View>
                    )}

                    {providerData?.correspondenceAddress && (
                      <View style={[styles.addressCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <View style={styles.addressCardHeader}>
                          <Icon name="map-pin" size={16} color={colors.primary} />
                          <Text style={[styles.addressCardTitle, { color: colors.text, fontSize: fontSizes.inputLabel }]}>
                            {t('profile.page.correspondenceAddress')}
                          </Text>
                        </View>
                        <Text style={[styles.addressCardText, { color: colors.textSecondary, fontSize: fontSizes.addressText }]}>
                          {providerData.correspondenceAddress.field1} {providerData.correspondenceAddress.field2}
                        </Text>
                        <Text style={[styles.addressCardText, { color: colors.textSecondary, fontSize: fontSizes.addressText }]}>
                          {providerData.correspondenceAddress.ctarea}, {providerData.correspondenceAddress.state}
                        </Text>
                        <Text style={[styles.addressCardText, { color: colors.textSecondary, fontSize: fontSizes.addressText }]}>
                          {providerData.correspondenceAddress.country} - {providerData.correspondenceAddress.pinno}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Additional Information Section */}
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => toggleSection('additional')}
              >
                <View style={styles.sectionHeaderLeft}>
                  <Icon name="award" size={18} color={colors.primary} />
                  <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontSize: fontSizes.sectionTitle }]}>
                    {t('profile.page.additionalInformation')}
                  </Text>
                </View>
                <Icon
                  name={expandedSections.additional ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>

              {expandedSections.additional && (
                <View style={styles.sectionContent}>
                  <View style={styles.inputRow}>
                    <View style={styles.inputContainer}>
                      <Text style={[styles.inputLabel, { color: colors.text, fontSize: fontSizes.inputLabel }]}>
                        {t('profile.page.enrolledDate')}
                      </Text>
                      <TextInput
                        style={[
                          styles.input,
                          styles.readOnlyInput,
                          {
                            borderColor: colors.border,
                            backgroundColor: colors.surface,
                            color: colors.text,
                            fontSize: fontSizes.input,
                          },
                        ]}
                        value={providerData?.enrolleddate ? new Date(providerData.enrolleddate).toLocaleDateString() : t('profile.page.notAvailable')}
                        editable={false}
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={[styles.inputLabel, { color: colors.text, fontSize: fontSizes.inputLabel }]}>
                        {t('profile.page.keyFacts')}
                      </Text>
                      <TextInput
                        style={[
                          styles.input,
                          styles.readOnlyInput,
                          {
                            borderColor: colors.border,
                            backgroundColor: colors.surface,
                            color: colors.text,
                            fontSize: fontSizes.input,
                          },
                        ]}
                        value={providerData?.keyFacts ? t('common.available') : t('profile.page.notAvailable')}
                        editable={false}
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={[styles.inputLabel, { color: colors.text, fontSize: fontSizes.inputLabel }]}>
                        {t('profile.page.profileCreated')}
                      </Text>
                      <TextInput
                        style={[
                          styles.input,
                          styles.readOnlyInput,
                          {
                            borderColor: colors.border,
                            backgroundColor: colors.surface,
                            color: colors.text,
                            fontSize: fontSizes.input,
                          },
                        ]}
                        value={providerData?.enrolleddate ? new Date(providerData.enrolleddate).toLocaleDateString() : t('profile.page.notAvailable')}
                        editable={false}
                      />
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            {isEditing && (
              <View style={styles.actionButtonsContainer}>
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton, { backgroundColor: colors.textSecondary }]}
                    onPress={handleCancel}
                    disabled={isSaving}
                  >
                    <Text style={[styles.buttonText, { color: '#fff', fontSize: fontSizes.buttonText }]}>
                      {t('common.cancel')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.button,
                      styles.saveButton,
                      { backgroundColor: colors.primary },
                      (!isFormValid() || !hasChanges()) && [styles.disabledButton, { backgroundColor: colors.disabled }],
                    ]}
                    onPress={handleSave}
                    disabled={isSaving || !isFormValid() || !hasChanges()}
                  >
                    {isSaving ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={[styles.buttonText, { color: '#fff', fontSize: fontSizes.buttonText }]}>
                        {t('profile.page.saveChanges')}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContent: {
    alignItems: 'center',
    padding: 16,
  },
  formContainer: {
    width: width - 32,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    paddingBottom: 12,
    marginBottom: 16,
  },
  formTitle: {
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
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
  statusText: {
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontWeight: '500',
  },
  editButtonTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  editButtonText: {
    fontWeight: '600',
    marginLeft: 6,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionContent: {
    marginTop: 12,
  },
  inputRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  inputContainer: {
    flex: 1,
    minWidth: width > 500 ? 200 : '100%',
    marginBottom: 12,
  },
  inputLabel: {
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  readOnlyInput: {
    backgroundColor: '#f7fafc',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  phoneInput: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  validationIcon: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -8 }],
  },
  validationError: {
    marginTop: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  serviceTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  serviceTypeCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    minWidth: 100,
  },
  serviceTypeCardActive: {
    borderWidth: 2,
  },
  serviceTypeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  serviceTypeIcon: {
    width: 24,
    alignItems: 'center',
  },
  serviceTypeText: {
    fontWeight: '500',
  },
  serviceTypesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  serviceTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  serviceTypeBadgeText: {
    fontWeight: '500',
  },
  serviceSpecificFields: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  noDataText: {
    fontStyle: 'italic',
  },
  fullTimeContainer: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  fullTimeContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fullTimeTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  fullTimeDescription: {},
  timeSlotSection: {
    marginBottom: 24,
  },
  timeSlotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeSlotTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeSlotTitle: {
    fontWeight: '600',
  },
  addSlotButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  addSlotText: {
    fontWeight: '500',
  },
  emptySlotContainer: {
    padding: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  emptySlotText: {
    fontStyle: 'italic',
  },
  timeSlotCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  timeSlotCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeSlotNumber: {
    fontWeight: '600',
  },
  selectedTimeText: {
    marginBottom: 12,
  },
  sliderContainer: {
    marginTop: 8,
  },
  slider: {
    width: '100%',
    height: 40,
    marginVertical: 8,
  },
  sliderLabel: {
    textAlign: 'center',
    marginBottom: 4,
  },
  timeSlotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  timeSlotBadgeText: {
    fontWeight: '500',
  },
  summaryCard: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 16,
  },
  summaryTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  summaryText: {},
  kycCard: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  kycRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 12,
  },
  kycItem: {
    flex: 1,
    minWidth: 150,
  },
  kycLabel: {
    fontWeight: '600',
    marginBottom: 8,
  },
  kycStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  kycStatusText: {
    fontWeight: '500',
  },
  kycValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  kycValue: {
    fontWeight: '500',
  },
  kycDetails: {
    marginTop: 8,
  },
  viewDocumentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  viewDocumentText: {
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  addressCardsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 16,
  },
  addressCard: {
    flex: 1,
    minWidth: 200,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  addressCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  addressCardTitle: {
    fontWeight: '600',
  },
  addressCardText: {
    marginBottom: 4,
    lineHeight: 20,
  },
  actionButtonsContainer: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: 120,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  saveButton: {
    backgroundColor: '#0a2a66',
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
  // Skeleton styles
  skeletonCard: {
    width: width - 32,
    borderRadius: 12,
    padding: 20,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  skeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 12,
    marginBottom: 16,
  },
  skeletonTitle: {
    width: 180,
    height: 24,
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonStatusRow: {
    flexDirection: 'row',
    gap: 8,
  },
  skeletonStatus: {
    width: 80,
    height: 24,
    borderRadius: 12,
  },
  skeletonRating: {
    width: 60,
    height: 20,
    borderRadius: 4,
  },
  skeletonButton: {
    width: 120,
    height: 40,
    borderRadius: 20,
  },
  skeletonSection: {
    marginBottom: 20,
  },
  skeletonSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  skeletonSectionIcon: {
    width: 18,
    height: 18,
    borderRadius: 4,
  },
  skeletonSectionTitle: {
    width: 150,
    height: 20,
    borderRadius: 4,
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  skeletonInputGroup: {
    flex: 1,
    minWidth: 150,
  },
  skeletonLabel: {
    width: 80,
    height: 16,
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonInput: {
    width: '100%',
    height: 40,
    borderRadius: 8,
  },
});

export default ServiceProviderProfileSection;