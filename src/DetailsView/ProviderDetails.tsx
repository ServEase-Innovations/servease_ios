import React, { useEffect, useRef, useState } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  Alert,
  Dimensions,
  useWindowDimensions,
  ScrollView,
  Modal
} from "react-native";
import moment from "moment";
import Icon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch, useSelector } from "react-redux";
import { add, update } from "../features/bookingTypeSlice";
import DemoCook from "../ServiceDialogs/CookServiceDialog";
import MaidServiceDialog from "../ServiceDialogs/MaidServiceDialog";
import NannyServicesDialog from "../ServiceDialogs/NannyServiceDialog";
import axiosInstance from "../services/axiosInstance";
import { useAppUser } from "../context/AppUserContext";
import { ServiceProviderDTO, EnhancedProviderDetails } from "../types/ProviderDetailsType";
import ProviderAvailabilityDrawer from "./ProviderAvailabilityDrawer";
import { CONFIRMATION, BOOKINGS } from "../Constants/pagesConstants";
import { useTheme } from '../Settings/ThemeContext';
import { useTranslation } from 'react-i18next';

interface BookingType {
  serviceproviderId: string;
  eveningSelection: string | null;
  morningSelection: string | null;
  timeRange?: string;
  duration?: number;
  [key: string]: any;
}

interface ProviderDetailsProps extends ServiceProviderDTO {
  selectedProvider: (provider: ServiceProviderDTO) => void;
  availableTimeSlots?: string[];
  sendDataToParent?: (data: string) => void;
}

const ProviderDetails: React.FC<ProviderDetailsProps> = (props) => {
  // Get theme values
  const { colors, isDarkMode, fontSize, compactMode } = useTheme();
  const { t } = useTranslation();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [eveningSelection, setEveningSelection] = useState<number | null>(null);
  const [morningSelection, setMorningSelection] = useState<number | null>(null);
  const [eveningSelectionTime, setEveningSelectionTime] = useState<string | null>(null);
  const [morningSelectionTime, setMorningSelectionTime] = useState<string | null>(null);
  const [loggedInUser, setLoggedInUser] = useState<any>();
  const [open, setOpen] = useState(false);
  const [engagementData, setEngagementData] = useState<any>(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [missingTimeSlots, setMissingTimeSlots] = useState<string[]>([]);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("12:00");
  const [warning, setWarning] = useState("");
  const [missingSlots, setMissingSlots] = useState<string[]>([]);
  const [uniqueMissingSlots, setUniqueMissingSlots] = useState<string[]>([]);
  const [matchedMorningSelection, setMatchedMorningSelection] = useState<string | null>(null);
  const [matchedEveningSelection, setMatchedEveningSelection] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Get font size styles based on settings
  const getFontSizeStyles = () => {
    switch (fontSize) {
      case 'small':
        return { textSize: 14, headingSize: 18, smallText: 12, xSmall: 10 };
      case 'large':
        return { textSize: 18, headingSize: 24, smallText: 16, xSmall: 14 };
      default:
        return { textSize: 16, headingSize: 20, smallText: 14, xSmall: 12 };
    }
  };

  const fontStyles = getFontSizeStyles();

  // Get spacing multiplier based on compact mode
  const spacingMultiplier = compactMode ? 0.8 : 1;

  const hasCheckedRef = useRef(false);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isMobile = windowWidth < 768;
  const isSmallScreen = windowWidth < 375;
  const isMediumScreen = windowWidth >= 375 && windowWidth < 768;
  const isLargeScreen = windowWidth >= 768;

  const dietImages: {[key: string]: any} = {
    VEG: require("../../assets/images/veg.png"),
    NONVEG: require("../../assets/images/nonveg.png"),
    BOTH: require("../../assets/images/nonveg.png"),
  };

  const dispatch = useDispatch();
  const bookingType = useSelector((state: any) => state.bookingType?.value);
  const user = useSelector((state: any) => state.user?.value);

  // Helper functions
  const calculateAge = (dob: string) => {
    if (!dob) return "";
    return moment().diff(moment(dob), "years");
  };

  const getAge = () => {
    if (props.age) {
      return props.age;
    }
    
    if (props.dob) {
      return calculateAge(props.dob);
    }
    
    return "";
  };

  const getHoursDifference = (start: string, end: string) => {
    const [startHours, startMinutes] = start.split(":").map(Number);
    const [endHours, endMinutes] = end.split(":").map(Number);
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    return (endTotalMinutes - startTotalMinutes) / 60;
  };

  const formatTimeForDisplay = (timeString: string | undefined) => {
    if (!timeString) return "05:00 AM";
    return moment(timeString, "HH:mm").format("hh:mm A");
  };

  // Helper function to normalize languages to array
  const normalizeLanguages = (languages: string | string[] | null | undefined): string[] => {
    if (!languages) return [];
    if (Array.isArray(languages)) return languages;
    if (typeof languages === 'string') {
      return languages.split(',').map(lang => lang.trim());
    }
    return [];
  };

  // Get all languages as array
  const getAllLanguages = (): string[] => {
    return normalizeLanguages(props.languageknown);
  };

  // Get diet color
  const getDietColor = () => {
    if (isDarkMode) {
      switch(props.diet?.toUpperCase()) {
        case 'VEG':
          return '#4ade80';
        case 'NONVEG':
          return '#f87171';
        default:
          return colors.textSecondary;
      }
    } else {
      switch(props.diet?.toUpperCase()) {
        case 'VEG':
          return colors.veg;
        case 'NONVEG':
          return colors.nonVeg;
        default:
          return colors.textSecondary;
      }
    }
  };

  // Get availability status
  const getAvailabilityStatus = () => {
    if (!props.monthlyAvailability) return "Available";
    
    if (props.monthlyAvailability.fullyAvailable) {
      return "Fully Available";
    } else {
      const exceptions = props.monthlyAvailability.exceptions?.length || 0;
      if (exceptions > 20) {
        return "Very Limited";
      } else if (exceptions > 10) {
        return "Limited";
      } else if (exceptions > 0) {
        return "Partially Available";
      }
      return "Partially Available";
    }
  };

  // Get availability chip style
  const getAvailabilityStyle = () => {
    if (!props.monthlyAvailability) return {
      container: { backgroundColor: isDarkMode ? '#2d3a4f' : colors.surface2 },
      text: { color: isDarkMode ? '#94a3b8' : colors.textSecondary }
    };
    
    if (props.monthlyAvailability.fullyAvailable) {
      return {
        container: { backgroundColor: isDarkMode ? '#1a3a2a' : '#e8f5e9' },
        text: { color: isDarkMode ? '#4ade80' : '#2e7d32' }
      };
    } else {
      const exceptions = props.monthlyAvailability.exceptions?.length || 0;
      if (exceptions > 20) {
        return {
          container: { backgroundColor: isDarkMode ? '#3a2a2a' : '#ffebee' },
          text: { color: isDarkMode ? '#f87171' : '#c62828' }
        };
      } else if (exceptions > 10) {
        return {
          container: { backgroundColor: isDarkMode ? '#3a352a' : '#fff3e0' },
          text: { color: isDarkMode ? '#fbbf24' : '#ed6c02' }
        };
      } else {
        return {
          container: { backgroundColor: isDarkMode ? '#1a2a3a' : '#e3f2fd' },
          text: { color: isDarkMode ? '#60a5fa' : '#0288d1' }
        };
      }
    }
  };

  // Get availability message
  const getAvailabilityMessage = () => {
    if (!props.monthlyAvailability) {
      return "Availability not specified";
    }
    
    if (props.monthlyAvailability.fullyAvailable) {
      return `Available at ${formatTimeForDisplay(props.monthlyAvailability.preferredTime)}`;
    }
    
    const exceptions = props.monthlyAvailability.exceptions?.length || 0;
    
    if (exceptions > 20) {
      return "Very limited availability";
    } else if (exceptions > 10) {
      return "Limited availability";
    } else if (exceptions > 0) {
      return `Usually available at ${formatTimeForDisplay(props.monthlyAvailability.preferredTime)}`;
    }
    
    return `Available at ${formatTimeForDisplay(props.monthlyAvailability.preferredTime)}`;
  };

  // Get time icon color
  const getTimeIconColor = () => {
    if (!props.monthlyAvailability) return isDarkMode ? '#64748b' : '#9e9e9e';
    
    if (props.monthlyAvailability.fullyAvailable) {
      return isDarkMode ? '#4ade80' : '#2e7d32';
    }
    
    const exceptions = props.monthlyAvailability.exceptions?.length || 0;
    
    if (exceptions > 20) {
      return isDarkMode ? '#f87171' : '#c62828';
    } else if (exceptions > 10) {
      return isDarkMode ? '#fbbf24' : '#ed6c02';
    } else {
      return isDarkMode ? '#60a5fa' : '#0288d1';
    }
  };

  // Get availability duration
  const getAvailabilityDuration = () => {
    if (!props.monthlyAvailability) return "Short Term";
    
    if (props.monthlyAvailability.summary?.daysAtPreferredTime >= 30) {
      return "Monthly";
    } else {
      return "Short Term";
    }
  };

  // Get gender symbol
  const getGenderSymbol = (gender: string) => {
    if (!gender) return "";
    switch (gender.toUpperCase()) {
      case 'FEMALE': 
      case 'F': 
        return 'F';
      case 'MALE': 
      case 'M': 
        return 'M';
      default: 
        return gender.charAt(0).toUpperCase();
    }
  };

  // Handle selection
  const handleSelection = (hour: number, isEvening: boolean, time: number) => {
    const startTime = moment({ hour: time, minute: 0 }).format("HH:mm");
    const endTime = moment({ hour: time + 1, minute: 0 }).format("HH:mm");
    const formattedTime = `${startTime}-${endTime}`;

    if (isEvening) {
      setEveningSelection(hour);
      setEveningSelectionTime(formattedTime);
      setMatchedEveningSelection(formattedTime);
      dispatch(update({ eveningSelection: formattedTime }));
    } else {
      setMorningSelection(hour);
      setMorningSelectionTime(formattedTime);
      setMatchedMorningSelection(formattedTime);
      dispatch(update({ morningSelection: formattedTime }));
    }
  };

  // Clear selection
  const clearSelection = (isEvening: boolean) => {
    if (isEvening) {
      setEveningSelection(null);
      setEveningSelectionTime(null);
      setMatchedEveningSelection(null);
      dispatch(update({ eveningSelection: null }));
    } else {
      setMorningSelection(null);
      setMorningSelectionTime(null);
      setMatchedMorningSelection(null);
      dispatch(update({ morningSelection: null }));
    }
  };

  // Toggle favorite
  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  // Get provider ID
  const getProviderId = () => {
    const id = props.serviceproviderid;
    return id ? String(id) : undefined;
  };

  // Get first name
  const getFirstName = () => {
    return props.firstName || '';
  };

  // Get last name
  const getLastName = () => {
    return props.lastName || '';
  };

  // Get housekeeping roles as array
  const getHousekeepingRoles = (): string[] => {
    console.log("getHousekeepingRoles called with props:", props.housekeepingRoles);
    
    if (props.housekeepingRoles && Array.isArray(props.housekeepingRoles)) {
      console.log("Returning array:", props.housekeepingRoles);
      return props.housekeepingRoles;
    }
    if (props.housekeepingRoles && typeof props.housekeepingRoles === 'string') {
      console.log("Converting string to array:", [props.housekeepingRoles]);
      return [props.housekeepingRoles];
    }
    console.log("Returning default UNKNOWN array");
    return ["UNKNOWN"];
  };

  // Get primary role (first in array) for display and logic purposes
  const getPrimaryHousekeepingRole = (): string => {
    const roles = getHousekeepingRoles();
    const primaryRole = roles[0] || "UNKNOWN";
    console.log("Primary role:", primaryRole);
    return primaryRole;
  };

  // Check if provider has a specific role
  const hasRole = (role: string): boolean => {
    const roles = getHousekeepingRoles();
    return roles.includes(role);
  };

  // Format roles for display
  const formatRolesDisplay = (roles: string[]): string => {
    return roles.join(', ');
  };

  // Handle Book Now - Updated to handle multiple roles
  const handleBookNow = () => {
    const providerId = getProviderId();
    console.log("Book Now clicked for provider ID:", providerId);
    
    if (!providerId) {
      console.error("No provider ID found!");
      Alert.alert(t('common.error'), t('errors.generic'));
      return;
    }

    const housekeepingRoles = getHousekeepingRoles();
    const primaryRole = getPrimaryHousekeepingRole();
    
    console.log("Housekeeping Roles array:", housekeepingRoles);
    console.log("Primary Role:", primaryRole);
    
    let booking: BookingType;

    if (primaryRole !== "NANNY") {
      booking = {
        serviceproviderId: providerId,
        eveningSelection: eveningSelectionTime,
        morningSelection: morningSelectionTime,
        housekeepingRoles: housekeepingRoles,
        ...bookingType
      };
    } else {
      booking = {
        serviceproviderId: providerId,
        timeRange: `${startTime} - ${endTime}`,
        duration: getHoursDifference(startTime, endTime),
        housekeepingRoles: housekeepingRoles,
        ...bookingType
      };
    }

    console.log("Dispatching booking with roles array:", housekeepingRoles);
    
    if (bookingType) {
      dispatch(update(booking));
    } else {
      dispatch(add(booking));
    }

    const providerDetails = {
      ...props,
      selectedMorningTime: morningSelection,
      selectedEveningTime: eveningSelection,
      housekeepingRoles: housekeepingRoles
    };
    
    props.selectedProvider(providerDetails);
    
    setOpen(true);
    console.log("Dialog opened state:", true);
  };

  // Handle login
  const handleLogin = () => {
    setOpen(true);
  };

  // Handle booking page
  const handleBookingPage = (data: string) => {
    console.log("📱 handleBookingPage called with:", data);
    setOpen(false);
    
    if (props.sendDataToParent) {
      console.log("🔄 Navigating to:", data);
      props.sendDataToParent(data);
    }
  };

  // Handle booking success callback
  const handleBookingSuccess = () => {
    console.log("🎉 Booking success callback triggered in ProviderDetails");
    setOpen(false);
    
    if (props.sendDataToParent) {
      console.log("🔄 Navigating to BOOKINGS after successful booking");
      props.sendDataToParent(BOOKINGS);
    }
  };

  // Handle view details
  const handleViewDetails = () => {
    setDrawerOpen(true);
  };

  // Handle drawer close
  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const { appUser } = useAppUser();

  useEffect(() => {
    if (appUser?.role === 'CUSTOMER') {
      setLoggedInUser(user);
    }
  }, [appUser]);

  // Get initials for avatar
  const getInitials = () => {
    const firstName = getFirstName();
    const lastName = getLastName();
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Get rating display
  const getRatingDisplay = () => {
    if (!props.rating || props.rating === 0) {
      return "0.0";
    }
    return props.rating.toFixed(1);
  };

  // Get review count display
  const getReviewCount = () => {
    return props.rating || 0;
  };

  // Get distance display
  const getDistanceDisplay = () => {
    return props.distance_km?.toFixed(2) || "0.00";
  };

  // Get experience display
  const getExperienceDisplay = () => {
    return props.experience || 1;
  };

  // Render service dialog - Updated to handle multiple roles
  const renderServiceDialog = () => {
    const providerId = getProviderId();
    const housekeepingRoles = getHousekeepingRoles();
    const primaryRole = getPrimaryHousekeepingRole();
    const firstName = getFirstName();
    const lastName = getLastName();
    
    console.log("Rendering dialog for roles:", housekeepingRoles);
    console.log("Primary role for dialog:", primaryRole);
    
    const providerDetailsData: any = {
      ...props,
      serviceproviderid: providerId,
      serviceproviderId: providerId,
      firstname: firstName,
      firstName: firstName,
      lastname: lastName,
      lastName: lastName,
      housekeepingRoles: housekeepingRoles,
      housekeepingRole: primaryRole,
      selectedMorningTime: morningSelection,
      selectedEveningTime: eveningSelection,
      matchedMorningSelection,
      matchedEveningSelection,
      startTime,
      endTime
    };

    switch (primaryRole) {
      case "COOK":
        return (
          <DemoCook 
            visible={open}
            onClose={handleClose}
            handleClose={handleClose}
            sendDataToParent={handleBookingPage}
            user={user}
            providerDetails={providerDetailsData}
            bookingType={bookingType}
            onBookingSuccess={handleBookingSuccess}
          />
        );
      case "MAID":
        return (
          <MaidServiceDialog
            open={open}
            handleClose={handleClose}
            providerDetails={providerDetailsData}
            sendDataToParent={handleBookingPage}
            user={user}
            bookingType={bookingType}
            onBookingSuccess={handleBookingSuccess}
          />
        );
      case "NANNY":
        return (
          <NannyServicesDialog 
            open={open}
            handleClose={handleClose}
            providerDetails={providerDetailsData}
            sendDataToParent={handleBookingPage}
            user={user}
            bookingType={bookingType}
            onBookingSuccess={handleBookingSuccess}
          />
        );
      default:
        return null;
    }
  };

  const age = getAge();
  const genderSymbol = getGenderSymbol(props.gender);
  const firstName = getFirstName();
  const lastName = getLastName();
  const fullName = `${firstName} ${lastName}`.trim();
  const housekeepingRoles = getHousekeepingRoles();
  const primaryRole = getPrimaryHousekeepingRole();
  const providerId = getProviderId();
  const availabilityStyle = getAvailabilityStyle();
  const allLanguages = getAllLanguages();
  const hasLanguages = allLanguages.length > 0;
  const diet = props.diet || "NONVEG";

  // Check if any badge is present
  const hasBadges = props.bestMatch || props.previouslyBooked;

  console.log("Rendering ProviderDetails with housekeepingRoles:", housekeepingRoles);

  return (
    <View style={[styles.container, { 
      padding: 12 * spacingMultiplier, 
      backgroundColor: 'transparent'
    }]}>
      <View style={[
        styles.card,
        isMobile && styles.cardMobile,
        isSmallScreen && styles.cardSmall,
        { 
          backgroundColor: colors.card,
          borderColor: colors.border,
          shadowColor: colors.shadow,
        }
      ]}>
        {/* Header Section with Badges and Roles */}
        <View style={[
          styles.headerSection,
          isMobile && styles.headerSectionMobile
        ]}>
          {/* Badges Container */}
          {hasBadges && (
            <View style={[
              styles.badgeContainer,
              isMobile && styles.badgeContainerMobile
            ]}>
              {/* Best Match Badge */}
              {props.bestMatch && (
                <View style={[
                  styles.bestMatchBadge,
                  isMobile && styles.bestMatchBadgeMobile,
                  { backgroundColor: '#ff9800' }
                ]}>
                  <MaterialCommunityIcons name="fire" size={12} color="#ffffff" />
                  <Text style={[
                    styles.badgeText,
                    isMobile && styles.badgeTextMobile,
                    { fontSize: fontStyles.xSmall }
                  ]}>Best Match</Text>
                </View>
              )}
              
              {/* Previously Booked Badge */}
              {props.previouslyBooked && (
                <View style={[
                  styles.previouslyBookedBadge,
                  isMobile && styles.previouslyBookedBadgeMobile,
                  { backgroundColor: '#2196f3' }
                ]}>
                  <MaterialCommunityIcons name="history" size={12} color="#ffffff" />
                  <Text style={[
                    styles.badgeText,
                    isMobile && styles.badgeTextMobile,
                    { fontSize: fontStyles.xSmall }
                  ]}>Previously Booked</Text>
                </View>
              )}
            </View>
          )}

          {/* Role Chips - Display multiple roles */}
          {housekeepingRoles.length > 0 && housekeepingRoles[0] !== "UNKNOWN" && (
            <View style={styles.rolesContainer}>
              {housekeepingRoles.map((role, index) => (
                <View key={index} style={[
                  styles.headerRoleChip,
                  { 
                    backgroundColor: colors.primary,
                    marginLeft: index > 0 ? 8 : 0
                  }
                ]}>
                  <Text style={[
                    styles.headerRoleChipText,
                    { color: '#ffffff', fontSize: fontStyles.smallText, fontWeight: '700' }
                  ]}>
                    {role}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Main Content */}
        <View style={[
          styles.mainContent,
          isMobile && styles.mainContentMobile
        ]}>
          {/* Left Section - Provider Info */}
          <View style={[
            styles.leftSection,
            isMobile && styles.leftSectionMobile
          ]}>
            {/* Name and Basic Info */}
            <View style={styles.nameRow}>
              <Text style={[
                styles.nameText,
                isMobile && styles.nameTextMobile,
                { color: colors.text, fontSize: fontStyles.headingSize }
              ]}>
                {fullName}
              </Text>
              <Text style={[
                styles.genderAgeText,
                isMobile && styles.genderAgeTextMobile,
                { color: colors.textSecondary, fontSize: fontStyles.smallText, marginLeft: 8 }
              ]}>
                {genderSymbol} • {age} yrs
              </Text>
            </View>

            {/* Meta Info Row - Diet and Languages */}
            <View style={[
              styles.metaRow,
              isMobile && styles.metaRowMobile
            ]}>
              {/* Diet */}
              <View style={styles.metaItem}>
                <MaterialCommunityIcons name="food" size={14} color={getDietColor()} />
                <Text style={[
                  styles.metaText,
                  isMobile && styles.metaTextMobile,
                  { color: colors.textSecondary, fontSize: fontStyles.smallText, marginLeft: 4 }
                ]}>{diet}</Text>
              </View>

              <View style={[styles.metaDivider, { 
                backgroundColor: colors.border,
                width: 1,
                height: 14,
                marginHorizontal: 8
              }]} />

              {/* Languages */}
              <View style={styles.metaItem}>
                <MaterialCommunityIcons name="translate" size={14} color={colors.textSecondary} />
                {hasLanguages ? (
                  <Text style={[
                    styles.metaText,
                    isMobile && styles.metaTextMobile,
                    { color: colors.textSecondary, fontSize: fontStyles.smallText, marginLeft: 4 }
                  ]}>
                    {allLanguages.join(', ')}
                  </Text>
                ) : (
                  <Text style={[
                    styles.metaText,
                    isMobile && styles.metaTextMobile,
                    { color: colors.textSecondary, fontSize: fontStyles.smallText, marginLeft: 4 }
                  ]}>Not specified</Text>
                )}
              </View>
            </View>

            {/* Roles Display Line */}
            {housekeepingRoles.length > 0 && housekeepingRoles[0] !== "UNKNOWN" && (
              <View style={[styles.rolesDisplayRow, { marginBottom: 8 }]}>
                <MaterialCommunityIcons name="badge-account" size={14} color={colors.textSecondary} />
                <Text style={[
                  styles.rolesDisplayText,
                  { color: colors.textSecondary, fontSize: fontStyles.smallText, marginLeft: 4 }
                ]}>
                  {formatRolesDisplay(housekeepingRoles)}
                </Text>
              </View>
            )}

            {/* Availability Section */}
            <View style={[
              styles.availabilitySection,
              { marginTop: 12 * spacingMultiplier }
            ]}>
              <Text style={[
                styles.availabilityLabel,
                { color: colors.textSecondary, fontSize: fontStyles.smallText, fontWeight: '600', marginBottom: 8 }
              ]}>Availability</Text>
              
              {/* Availability Info Row */}
              <View style={styles.availabilityInfoRow}>
                <MaterialCommunityIcons name="clock-outline" size={16} color={getTimeIconColor()} />
                <Text style={[
                  styles.availabilityMessage,
                  { color: colors.text, fontSize: fontStyles.textSize, marginLeft: 8, flex: 1 }
                ]}>
                  {getAvailabilityMessage()}
                </Text>
              </View>

              {/* Availability Chips Row */}
              <View style={[
                styles.availabilityChipsRow,
                { marginTop: 8, marginBottom: 8, gap: 8 }
              ]}>
                <View style={[
                  styles.durationChip,
                  { 
                    borderWidth: 1,
                    borderColor: colors.secondary,
                    borderRadius: 16,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    backgroundColor: 'transparent'
                  }
                ]}>
                  <Text style={[
                    styles.durationChipText,
                    { color: colors.secondary, fontSize: fontStyles.xSmall, fontWeight: '600' }
                  ]}>
                    {getAvailabilityDuration()}
                  </Text>
                </View>

                <View style={[
                  styles.availabilityChipContainer,
                  availabilityStyle.container,
                  {
                    borderRadius: 16,
                    paddingHorizontal: 10,
                    paddingVertical: 4
                  }
                ]}>
                  <Text style={[
                    styles.availabilityChipText,
                    { fontSize: fontStyles.xSmall, fontWeight: '600' },
                    availabilityStyle.text
                  ]}>
                    {getAvailabilityStatus()}
                  </Text>
                </View>
              </View>

              {/* Additional Availability Info */}
              {props.monthlyAvailability?.exceptions && props.monthlyAvailability.exceptions.length > 0 && (
                <View style={[
                  styles.exceptionContainer,
                  { 
                    marginTop: 4,
                    marginBottom: 4
                  }
                ]}>
                  <Text style={[
                    styles.exceptionText,
                    { color: isDarkMode ? '#fbbf24' : '#ed6c02', fontSize: fontStyles.xSmall, fontWeight: '500' }
                  ]}>
                    ⚠️ {props.monthlyAvailability.exceptions.length} schedule exceptions this month
                  </Text>
                </View>
              )}

              {props.monthlyAvailability?.fullyAvailable && (
                <View style={[
                  styles.fullyAvailableContainer,
                  { marginTop: 4, marginBottom: 4 }
                ]}>
                  <Text style={[
                    styles.fullyAvailableText,
                    { color: isDarkMode ? '#4ade80' : '#2e7d32', fontSize: fontStyles.xSmall, fontWeight: '500' }
                  ]}>
                    ✓ Fully available all month
                  </Text>
                </View>
              )}

              {props.monthlyAvailability && !props.monthlyAvailability.fullyAvailable && 
               (!props.monthlyAvailability.exceptions || props.monthlyAvailability.exceptions.length === 0) && (
                <View style={[
                  styles.partiallyAvailableContainer,
                  { marginTop: 4, marginBottom: 4 }
                ]}>
                  <Text style={[
                    styles.partiallyAvailableText,
                    { color: isDarkMode ? '#fbbf24' : '#ed6c02', fontSize: fontStyles.xSmall, fontWeight: '500' }
                  ]}>
                    ⚠️ Partially available this month
                  </Text>
                </View>
              )}

              {props.otherServices && (
                <View style={[
                  styles.otherServicesContainer,
                  { marginTop: 8 }
                ]}>
                  <Text style={[
                    styles.otherServicesText,
                    { color: colors.text, fontSize: fontStyles.smallText }
                  ]}>
                    {props.otherServices}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Metrics Section - Row of 3 metrics */}
          <View style={[
            styles.metricsSection,
            isMobile && styles.metricsSectionMobile,
            { gap: 8, marginTop: isMobile ? 12 : 0 }
          ]}>
            <View style={[
              styles.metricBox,
              { 
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                padding: 8,
                alignItems: 'center',
                flex: 1
              }
            ]}>
              <Text style={[
                styles.metricValue,
                { color: colors.text, fontSize: fontStyles.textSize, fontWeight: '700' }
              ]}>{getDistanceDisplay()}</Text>
              <Text style={[
                styles.metricLabel,
                { color: colors.textTertiary, fontSize: fontStyles.xSmall, marginTop: 4 }
              ]}>km away</Text>
            </View>

            <View style={[
              styles.metricBox,
              { 
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                padding: 8,
                alignItems: 'center',
                flex: 1
              }
            ]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <MaterialCommunityIcons name="star" size={14} color="#ffc107" />
                <Text style={[
                  styles.metricValue,
                  { color: colors.text, fontSize: fontStyles.textSize, fontWeight: '700' }
                ]}>{getRatingDisplay()}</Text>
              </View>
              <Text style={[
                styles.metricLabel,
                { color: colors.textTertiary, fontSize: fontStyles.xSmall, marginTop: 4 }
              ]}>{props.rating === 0 ? 'Ratings' : 'reviews'}</Text>
            </View>

            <View style={[
              styles.metricBox,
              { 
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                padding: 8,
                alignItems: 'center',
                flex: 1
              }
            ]}>
              <Text style={[
                styles.metricValue,
                { color: colors.success, fontSize: fontStyles.textSize, fontWeight: '700' }
              ]}>{getExperienceDisplay()}</Text>
              <Text style={[
                styles.metricLabel,
                { color: colors.textTertiary, fontSize: fontStyles.xSmall, marginTop: 4 }
              ]}>years exp</Text>
            </View>
          </View>

          {/* Right Section - Actions */}
          <View style={[
            styles.rightSection,
            isMobile && styles.rightSectionMobile,
            { gap: 8, marginTop: isMobile ? 12 : 0 }
          ]}>
            {/* View Details Button */}
            <TouchableOpacity 
              style={[
                styles.detailsButton,
                { 
                  borderWidth: 1,
                  borderColor: colors.primary,
                  borderRadius: 8,
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 6,
                  backgroundColor: 'transparent'
                }
              ]}
              onPress={handleViewDetails}
            >
              <MaterialCommunityIcons name="information-outline" size={16} color={colors.primary} />
              <Text style={[
                styles.detailsButtonText,
                { color: colors.primary, fontSize: fontStyles.smallText, fontWeight: '600' }
              ]}>
                Details
              </Text>
            </TouchableOpacity>

            {/* Book Now Button */}
            <TouchableOpacity 
              style={[
                styles.bookNowButton,
                { 
                  backgroundColor: colors.primary,
                  borderRadius: 8,
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  alignItems: 'center',
                  justifyContent: 'center'
                }
              ]}
              onPress={handleBookNow}
            >
              <Text style={[
                styles.bookNowButtonText,
                { color: '#ffffff', fontSize: fontStyles.textSize, fontWeight: '700' }
              ]}>
                Book Now
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Drawer and Dialogs */}
      <ProviderAvailabilityDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        provider={{
          ...props,
          housekeepingRoles: housekeepingRoles
        }}
      />

      {/* Render the dialog */}
      {renderServiceDialog()}
    </View>
  );
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 12,
    borderWidth: 1,
  },
  cardMobile: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  cardSmall: {
    padding: 10,
    borderRadius: 10,
  },
  // Header Section
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 8,
  },
  headerSectionMobile: {
    marginBottom: 12,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    flex: 1,
  },
  badgeContainerMobile: {
    gap: 6,
  },
  bestMatchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  bestMatchBadgeMobile: {
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  previouslyBookedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  previouslyBookedBadgeMobile: {
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  badgeText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  badgeTextMobile: {},
  rolesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  headerRoleChip: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  headerRoleChipText: {},
  rolesDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rolesDisplayText: {},
  mainContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  mainContentMobile: {
    flexDirection: 'column',
  },
  leftSection: {
    flex: 2,
    minWidth: 200,
  },
  leftSectionMobile: {
    width: '100%',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  nameText: {
    fontWeight: '700',
  },
  nameTextMobile: {
    fontSize: 16,
  },
  genderAgeText: {
    fontWeight: '500',
  },
  genderAgeTextMobile: {},
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  metaRowMobile: {},
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {},
  metaTextMobile: {},
  metaDivider: {},
  availabilitySection: {},
  availabilityLabel: {},
  availabilityInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  availabilityMessage: {
    flex: 1,
  },
  availabilityChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  durationChip: {},
  durationChipText: {},
  availabilityChipContainer: {},
  availabilityChipText: {},
  exceptionContainer: {},
  exceptionText: {},
  fullyAvailableContainer: {},
  fullyAvailableText: {},
  partiallyAvailableContainer: {},
  partiallyAvailableText: {},
  otherServicesContainer: {},
  otherServicesText: {},
  metricsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    marginLeft: 16,
  },
  metricsSectionMobile: {
    width: '100%',
    marginLeft: 0,
    marginTop: 12,
  },
  metricBox: {},
  metricValue: {},
  metricLabel: {},
  rightSection: {
    flexDirection: 'column',
    alignItems: 'stretch',
    minWidth: 110,
    marginLeft: 16,
  },
  rightSectionMobile: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 0,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  detailsButton: {},
  detailsButtonText: {},
  bookNowButton: {},
  bookNowButtonText: {},
});

export default ProviderDetails;