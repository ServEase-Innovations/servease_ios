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
import { CONFIRMATION } from "../Constants/pagesConstants";
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

  // Get diet color - more subtle in dark mode
  const getDietColor = () => {
    if (isDarkMode) {
      switch(props.diet?.toUpperCase()) {
        case 'VEG':
          return '#4ade80'; // Softer green
        case 'NONVEG':
          return '#f87171'; // Softer red
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
        return `Very Limited (${exceptions} exceptions)`;
      } else if (exceptions > 10) {
        return `Limited (${exceptions} exceptions)`;
      } else if (exceptions > 0) {
        return `Partially Available (${exceptions} exceptions)`;
      }
      return "Partially Available";
    }
  };

  // Get availability chip style - more subtle for dark mode
  const getAvailabilityStyle = () => {
    if (!props.monthlyAvailability) return {
      container: { backgroundColor: isDarkMode ? '#2d3a4f' : colors.surface2 },
      text: { color: isDarkMode ? '#94a3b8' : colors.textSecondary }
    };
    
    if (props.monthlyAvailability.fullyAvailable) {
      return {
        container: { backgroundColor: isDarkMode ? '#1a3a2a' : colors.successLight },
        text: { color: isDarkMode ? '#4ade80' : colors.success }
      };
    } else {
      const exceptions = props.monthlyAvailability.exceptions?.length || 0;
      if (exceptions > 20) {
        return {
          container: { backgroundColor: isDarkMode ? '#3a2a2a' : colors.errorLight },
          text: { color: isDarkMode ? '#f87171' : colors.error }
        };
      } else if (exceptions > 10) {
        return {
          container: { backgroundColor: isDarkMode ? '#3a352a' : colors.warningLight },
          text: { color: isDarkMode ? '#fbbf24' : colors.warning }
        };
      } else {
        return {
          container: { backgroundColor: isDarkMode ? '#1a2a3a' : colors.infoLight },
          text: { color: isDarkMode ? '#60a5fa' : colors.info }
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
      return "Limited availability this month";
    } else if (exceptions > 0) {
      return `Usually available at ${formatTimeForDisplay(props.monthlyAvailability.preferredTime)}`;
    }
    
    return `Available at ${formatTimeForDisplay(props.monthlyAvailability.preferredTime)}`;
  };

  // Get time icon color - more subtle for dark mode
  const getTimeIconColor = () => {
    if (!props.monthlyAvailability) return isDarkMode ? '#64748b' : colors.textTertiary;
    
    if (props.monthlyAvailability.fullyAvailable) {
      return isDarkMode ? '#4ade80' : colors.success;
    }
    
    const exceptions = props.monthlyAvailability.exceptions?.length || 0;
    
    if (exceptions > 20) {
      return isDarkMode ? '#f87171' : colors.error;
    } else if (exceptions > 10) {
      return isDarkMode ? '#fbbf24' : colors.warning;
    } else {
      return isDarkMode ? '#60a5fa' : colors.info;
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
    const id = props.serviceproviderId || props.serviceproviderid;
    return id ? String(id) : undefined;
  };

  // Get first name
  const getFirstName = () => {
    return props.firstName || props.firstname || '';
  };

  // Get last name
  const getLastName = () => {
    return props.lastName || props.lastname || '';
  };

  // Get housekeeping role
  const getHousekeepingRole = () => {
    return props.housekeepingRole || props.housekeepingrole || "UNKNOWN";
  };

  // Handle Book Now
  const handleBookNow = () => {
    const providerId = getProviderId();
    console.log("Book Now clicked for provider ID:", providerId);
    
    if (!providerId) {
      console.error("No provider ID found!");
      Alert.alert(t('common.error'), t('errors.generic'));
      return;
    }

    const housekeepingRole = getHousekeepingRole();
    
    let booking: BookingType;

    if (housekeepingRole !== "NANNY") {
      booking = {
        serviceproviderId: providerId,
        eveningSelection: eveningSelectionTime,
        morningSelection: morningSelectionTime,
        ...bookingType
      };
    } else {
      booking = {
        serviceproviderId: providerId,
        timeRange: `${startTime} - ${endTime}`,
        duration: getHoursDifference(startTime, endTime),
        ...bookingType
      };
    }

    console.log("Dispatching booking:", booking);
    
    if (bookingType) {
      dispatch(update(booking));
    } else {
      dispatch(add(booking));
    }

    const providerDetails = {
      ...props,
      selectedMorningTime: morningSelection,
      selectedEveningTime: eveningSelection
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
    setOpen(false);
    
    if (data === CONFIRMATION && props.sendDataToParent) {
      props.sendDataToParent(data);
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

  // Get language display
  const getLanguageDisplay = () => {
    if (props.languageknown && props.languageknown.length > 0) {
      return props.languageknown[0];
    }
    return "English";
  };

  // Get rating display
  const getRatingDisplay = () => {
    return props.rating?.toFixed(1) || "0.0";
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

  // Render service dialog
  const renderServiceDialog = () => {
    const providerId = getProviderId();
    const housekeepingRole = getHousekeepingRole();
    const firstName = getFirstName();
    const lastName = getLastName();
    
    const providerDetailsData: any = {
      ...props,
      serviceproviderid: providerId,
      serviceproviderId: providerId,
      firstname: firstName,
      firstName: firstName,
      lastname: lastName,
      lastName: lastName,
      housekeepingrole: housekeepingRole,
      housekeepingRole: housekeepingRole,
      selectedMorningTime: morningSelection,
      selectedEveningTime: eveningSelection,
      matchedMorningSelection,
      matchedEveningSelection,
      startTime,
      endTime
    };

    switch (housekeepingRole) {
      case "COOK":
        return (
          <DemoCook 
            visible={open}
            onClose={handleClose}
            sendDataToParent={handleBookingPage}
            user={user}
            providerDetails={providerDetailsData}
            bookingType={bookingType}
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
  const housekeepingRole = getHousekeepingRole();
  const providerId = getProviderId();
  const availabilityStyle = getAvailabilityStyle();

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
        {/* Best Match Ribbon */}
        {props.bestMatch && (
          <View style={[
            styles.bestMatchRibbon,
            isMobile && styles.bestMatchRibbonMobile,
            { backgroundColor: isDarkMode ? '#3b3f5c' : colors.accent }
          ]}>
            <MaterialCommunityIcons name="fire" size={14} color="#ffffff" />
            <Text style={[
              styles.bestMatchRibbonText,
              isMobile && styles.bestMatchRibbonTextMobile,
              { fontSize: fontStyles.xSmall }
            ]}>Best Match</Text>
          </View>
        )}

        {/* Main Content */}
        <View style={[
          styles.mainContent,
          isMobile && styles.mainContentMobile,
          { gap: 20 * spacingMultiplier }
        ]}>
          {/* Left Section - Provider Info */}
          <View style={[
            styles.leftSection,
            isMobile && styles.leftSectionMobile
          ]}>
            {/* Name and Basic Info */}
            <View style={[styles.nameRow, { marginBottom: 8 * spacingMultiplier, gap: 8 }]}>
              <Text style={[
                styles.nameText,
                isMobile && styles.nameTextMobile,
                { color: colors.text, fontSize: fontStyles.headingSize }
              ]}>
                {fullName}
              </Text>
              <View style={[styles.genderAgeChip, { 
                borderColor: isDarkMode ? '#4b5563' : colors.primary,
                backgroundColor: isDarkMode ? '#2d3a4f' : 'transparent'
              }]}>
                <Text style={[
                  styles.genderAgeText,
                  isMobile && styles.genderAgeTextMobile,
                  { color: isDarkMode ? '#e2e8f0' : colors.primary, fontSize: fontStyles.xSmall, fontWeight: '600' }
                ]}>
                  {genderSymbol} • {age} yrs
                </Text>
              </View>
            </View>

            {/* Meta Info Row */}
            <View style={[
              styles.metaRow,
              isMobile && styles.metaRowMobile,
              { marginBottom: 16 * spacingMultiplier, gap: 12 * spacingMultiplier }
            ]}>
              <View style={[styles.metaItem, { gap: 4 }]}>
                <Icon name="restaurant" size={14} color={getDietColor()} />
                <Text style={[
                  styles.metaText,
                  isMobile && styles.metaTextMobile,
                  { color: colors.textSecondary, fontSize: fontStyles.smallText }
                ]}>{props.diet || "NONVEG"}</Text>
              </View>

              <View style={[styles.metaDivider, { 
                backgroundColor: colors.border,
                height: 12 * spacingMultiplier,
              }]} />

              <View style={[styles.metaItem, { gap: 4 }]}>
                <Icon name="language" size={14} color={isDarkMode ? '#94a3b8' : colors.secondary} />
                <Text style={[
                  styles.metaText,
                  isMobile && styles.metaTextMobile,
                  { color: colors.textSecondary, fontSize: fontStyles.smallText }
                ]}>{getLanguageDisplay()}</Text>
              </View>

              <View style={[styles.metaDivider, { 
                backgroundColor: colors.border,
                height: 12 * spacingMultiplier,
              }]} />

              <View style={[styles.metaItem, { gap: 4 }]}>
                <Icon name="location-on" size={14} color={isDarkMode ? '#94a3b8' : colors.info} />
                <Text style={[
                  styles.metaText,
                  isMobile && styles.metaTextMobile,
                  { color: colors.textSecondary, fontSize: fontStyles.smallText }
                ]}>{props.locality || "Location not specified"}</Text>
              </View>
            </View>

            {/* Availability Section */}
            <View style={[
              styles.availabilitySection,
              isMobile && styles.availabilitySectionMobile,
              { marginBottom: 16 * spacingMultiplier }
            ]}>
              <Text style={[
                styles.availabilityLabel,
                isMobile && styles.availabilityLabelMobile,
                { color: colors.textSecondary, fontSize: fontStyles.smallText, fontWeight: '600' }
              ]}>Availability</Text>
              
              {/* Availability Info Row */}
              <View style={[
                styles.availabilityInfoRow,
                isMobile && styles.availabilityInfoRowMobile,
                { marginBottom: 8 * spacingMultiplier }
              ]}>
                <Icon name="access-time" size={16} color={getTimeIconColor()} />
                <Text style={[
                  styles.availabilityMessage,
                  isMobile && styles.availabilityMessageMobile,
                  { color: colors.text, fontSize: fontStyles.textSize }
                ]}>
                  {getAvailabilityMessage()}
                </Text>
              </View>

              {/* Availability Chips Row */}
              <View style={[
                styles.availabilityChipsRow,
                isMobile && styles.availabilityChipsRowMobile,
                { gap: 8 * spacingMultiplier, marginBottom: 8 * spacingMultiplier }
              ]}>
                <View style={[
                  styles.durationChip,
                  isMobile && styles.durationChipMobile,
                  { 
                    borderColor: isDarkMode ? '#4b5563' : colors.secondary,
                    backgroundColor: isDarkMode ? '#2d3a4f' : 'transparent'
                  }
                ]}>
                  <Text style={[
                    styles.durationChipText,
                    isMobile && styles.durationChipTextMobile,
                    { color: isDarkMode ? '#e2e8f0' : colors.secondary, fontSize: fontStyles.xSmall, fontWeight: '600' }
                  ]}>
                    {getAvailabilityDuration()}
                  </Text>
                </View>

                <View style={[
                  styles.availabilityChipContainer,
                  isMobile && styles.availabilityChipContainerMobile,
                  availabilityStyle.container
                ]}>
                  <Text style={[
                    styles.availabilityChipText,
                    isMobile && styles.availabilityChipTextMobile,
                    { fontSize: fontStyles.xSmall, fontWeight: '600' },
                    availabilityStyle.text
                  ]}>
                    {getAvailabilityStatus()}
                  </Text>
                </View>
              </View>

              {/* Additional Availability Info */}
              {props.monthlyAvailability?.exceptions && props.monthlyAvailability.exceptions.length > 0 && (
                <View style={[styles.exceptionContainer, { 
                  backgroundColor: isDarkMode ? '#3a352a' : colors.warningLight,
                  padding: 6 * spacingMultiplier,
                  borderRadius: 6,
                  marginTop: 4 * spacingMultiplier
                }]}>
                  <Text style={[
                    styles.exceptionText,
                    isMobile && styles.exceptionTextMobile,
                    { color: isDarkMode ? '#fffefc' : colors.warning, fontSize: fontStyles.xSmall, fontWeight: '500' }
                  ]}>
                    ⚠️ {props.monthlyAvailability.exceptions.length} schedule exceptions this month
                  </Text>
                </View>
              )}

              {props.monthlyAvailability?.fullyAvailable && (
                <View style={[styles.fullyAvailableContainer, { 
                  backgroundColor: isDarkMode ? '#1a3a2a' : colors.successLight,
                  padding: 6 * spacingMultiplier,
                  borderRadius: 6,
                  marginTop: 4 * spacingMultiplier
                }]}>
                  <Text style={[
                    styles.fullyAvailableText,
                    isMobile && styles.fullyAvailableTextMobile,
                    { color: isDarkMode ? '#4ade80' : colors.success, fontSize: fontStyles.xSmall, fontWeight: '500' }
                  ]}>
                    ✓ Fully available all month
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Metrics Section - Center */}
          <View style={[
            styles.metricsSection,
            isMobile && styles.metricsSectionMobile,
            { gap: 8 * spacingMultiplier }
          ]}>
            <View style={[
              styles.metricBox,
              isMobile && styles.metricBoxMobile,
              { 
                backgroundColor: isDarkMode ? '#2d3a4f' : colors.surface,
                borderColor: isDarkMode ? '#4b5563' : colors.borderLight,
                padding: 12 * spacingMultiplier,
                minWidth: isSmallScreen ? 60 : 70
              }
            ]}>
              <Text style={[
                styles.metricValue,
                isMobile && styles.metricValueMobile,
                { color: colors.text, fontSize: fontStyles.textSize, fontWeight: '700' }
              ]}>{getDistanceDisplay()}</Text>
              <Text style={[
                styles.metricLabel,
                isMobile && styles.metricLabelMobile,
                { color: colors.textTertiary, fontSize: fontStyles.xSmall }
              ]}>km away</Text>
            </View>

            <View style={[
              styles.metricBox,
              isMobile && styles.metricBoxMobile,
              { 
                backgroundColor: isDarkMode ? '#2d3a4f' : colors.surface,
                borderColor: isDarkMode ? '#4b5563' : colors.borderLight,
                padding: 12 * spacingMultiplier,
                minWidth: isSmallScreen ? 60 : 70
              }
            ]}>
              <View style={[styles.ratingRow, { gap: 4 * spacingMultiplier }]}>
                <Icon name="star" size={14} color={isDarkMode ? '#fbbf24' : colors.rating} />
                <Text style={[
                  styles.metricValue,
                  isMobile && styles.metricValueMobile,
                  { color: colors.text, fontSize: fontStyles.textSize, fontWeight: '700' }
                ]}>{getRatingDisplay()}</Text>
              </View>
              <Text style={[
                styles.metricLabel,
                isMobile && styles.metricLabelMobile,
                { color: colors.textTertiary, fontSize: fontStyles.xSmall }
              ]}>{t('provider.reviews', { count: getReviewCount() })}</Text>
            </View>

            <View style={[
              styles.metricBox,
              isMobile && styles.metricBoxMobile,
              { 
                backgroundColor: isDarkMode ? '#2d3a4f' : colors.surface,
                borderColor: isDarkMode ? '#4b5563' : colors.borderLight,
                padding: 12 * spacingMultiplier,
                minWidth: isSmallScreen ? 60 : 70
              }
            ]}>
              <Text style={[
                styles.metricValue,
                styles.experienceValue,
                isMobile && styles.metricValueMobile,
                { color: isDarkMode ? '#4ade80' : colors.success, fontSize: fontStyles.textSize, fontWeight: '700' }
              ]}>{getExperienceDisplay()}</Text>
              <Text style={[
                styles.metricLabel,
                isMobile && styles.metricLabelMobile,
                { color: colors.textTertiary, fontSize: fontStyles.xSmall }
              ]}>years exp</Text>
            </View>
          </View>

          {/* Right Section - Actions */}
          <View style={[
            styles.rightSection,
            isMobile && styles.rightSectionMobile,
            { gap: 8 * spacingMultiplier }
          ]}>
            {/* Role Chip */}
            {housekeepingRole && housekeepingRole !== "UNKNOWN" && (
              <View style={[
                styles.roleChip,
                isMobile && styles.roleChipMobile,
                { 
                  backgroundColor: isDarkMode ? '#4b5563' : colors.accent,
                  shadowColor: colors.shadow,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isDarkMode ? 0.2 : 0.3,
                  shadowRadius: 4,
                  elevation: isDarkMode ? 2 : 5,
                  paddingHorizontal: 12 * spacingMultiplier,
                  paddingVertical: 6 * spacingMultiplier,
                }
              ]}>
                <Text style={[
                  styles.roleChipText,
                  isMobile && styles.roleChipTextMobile,
                  { color: '#ffffff', fontSize: fontStyles.smallText, fontWeight: '700' }
                ]}>
                  {housekeepingRole}
                </Text>
              </View>
            )}

            {/* View Details Button */}
            <TouchableOpacity 
              style={[
                styles.detailsButton,
                isMobile && styles.detailsButtonMobile,
                { 
                  borderColor: isDarkMode ? '#4b5563' : colors.primary,
                  backgroundColor: isDarkMode ? '#2d3a4f' : colors.infoLight,
                  gap: 6 * spacingMultiplier,
                  paddingHorizontal: 12 * spacingMultiplier,
                  paddingVertical: 8 * spacingMultiplier,
                  borderRadius: 8,
                }
              ]}
              onPress={handleViewDetails}
            >
              <Icon name="info-outline" size={16} color={isDarkMode ? '#e2e8f0' : colors.primary} />
              <Text style={[
                styles.detailsButtonText,
                isMobile && styles.detailsButtonTextMobile,
                { color: isDarkMode ? '#e2e8f0' : colors.primary, fontSize: fontStyles.smallText, fontWeight: '600' }
              ]}>
                {t('provider.viewDetails')}
              </Text>
            </TouchableOpacity>

            {/* Book Now Button */}
            <TouchableOpacity 
              style={[
                styles.bookNowButton,
                isMobile && styles.bookNowButtonMobile,
                { 
                  backgroundColor: isDarkMode ? '#3b82f6' : colors.primary,
                  paddingHorizontal: 12 * spacingMultiplier,
                  paddingVertical: 10 * spacingMultiplier,
                  borderRadius: 8,
                  shadowColor: isDarkMode ? '#3b82f6' : colors.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: isDarkMode ? 0.2 : 0.3,
                  shadowRadius: 8,
                  elevation: isDarkMode ? 3 : 5,
                }
              ]}
              onPress={handleBookNow}
            >
              <Text style={[
                styles.bookNowButtonText,
                isMobile && styles.bookNowButtonTextMobile,
                { color: '#ffffff', fontSize: fontStyles.textSize, fontWeight: '700' }
              ]}>
                {t('provider.bookNow')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Drawer and Dialogs */}
      <ProviderAvailabilityDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        provider={props}
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
    position: 'relative',
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
  bestMatchRibbon: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  bestMatchRibbonMobile: {
    top: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  bestMatchRibbonText: {
    color: 'white',
    fontWeight: '700',
  },
  bestMatchRibbonTextMobile: {},
  mainContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  mainContentMobile: {
    flexDirection: 'column',
  },
  leftSection: {
    flex: 1,
  },
  leftSectionMobile: {
    width: '100%',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  nameText: {
    fontWeight: '700',
  },
  nameTextMobile: {
    fontSize: 16,
  },
  genderAgeChip: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  genderAgeText: {
    fontWeight: '600',
  },
  genderAgeTextMobile: {},
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  metaRowMobile: {},
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    marginLeft: 2,
  },
  metaTextMobile: {},
  metaDivider: {
    width: 1,
  },
  availabilitySection: {},
  availabilitySectionMobile: {},
  availabilityLabel: {
    marginBottom: 8,
  },
  availabilityLabelMobile: {},
  availabilityInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availabilityInfoRowMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  availabilityMessage: {
    marginLeft: 6,
    flex: 1,
  },
  availabilityMessageMobile: {},
  availabilityChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  availabilityChipsRowMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  durationChip: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  durationChipMobile: {
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  durationChipText: {
    fontWeight: '600',
  },
  durationChipTextMobile: {},
  availabilityChipContainer: {
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  availabilityChipContainerMobile: {
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  availabilityChipText: {
    fontWeight: '600',
  },
  availabilityChipTextMobile: {},
  exceptionContainer: {},
  exceptionText: {},
  exceptionTextMobile: {},
  fullyAvailableContainer: {},
  fullyAvailableText: {},
  fullyAvailableTextMobile: {},
  partiallyAvailableText: {},
  partiallyAvailableTextMobile: {},
  metricsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricsSectionMobile: {
    width: '100%',
    justifyContent: 'space-around',
  },
  metricBox: {
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    flex: 1,
  },
  metricBoxMobile: {},
  metricValue: {
    textAlign: 'center',
  },
  metricValueMobile: {},
  experienceValue: {},
  metricLabel: {
    marginTop: 4,
    textAlign: 'center',
  },
  metricLabelMobile: {},
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightSection: {
    flexDirection: 'column',
    alignItems: 'stretch',
    minWidth: 100,
  },
  rightSectionMobile: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
    marginTop: 12,
  },
  roleChip: {
    borderRadius: 20,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleChipMobile: {
    alignSelf: 'flex-start',
    borderRadius: 16,
  },
  roleChipText: {
    textAlign: 'center',
  },
  roleChipTextMobile: {},
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  detailsButtonMobile: {
    flex: 1,
    minHeight: 40,
  },
  detailsButtonText: {},
  detailsButtonTextMobile: {},
  bookNowButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookNowButtonMobile: {
    flex: 1,
    minHeight: 40,
  },
  bookNowButtonText: {},
  bookNowButtonTextMobile: {},
});

export default ProviderDetails;