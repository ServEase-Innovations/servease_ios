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

  // Helper functions from React code
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

  // Get availability status for the chip
  const getAvailabilityStatus = () => {
    if (!props.monthlyAvailability) return "Available";
    
    if (props.monthlyAvailability.fullyAvailable) {
      return "Fully Available";
    } else {
      const exceptions = props.monthlyAvailability.exceptions?.length || 0;
      if (exceptions > 0) {
        return `Partially Available (${exceptions} exception${exceptions > 1 ? 's' : ''})`;
      }
      return "Partially Available";
    }
  };

  // Get availability chip style
  const getAvailabilityStyle = () => {
    if (!props.monthlyAvailability) return styles.availabilityChipAvailable;
    
    if (props.monthlyAvailability.fullyAvailable) {
      return styles.availabilityChipFullyAvailable;
    } else {
      return styles.availabilityChipPartial;
    }
  };

  // Get availability message (similar to React)
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

  // Get time icon color based on availability
  const getTimeIconColor = () => {
    if (!props.monthlyAvailability) return "#757575";
    
    if (props.monthlyAvailability.fullyAvailable) {
      return "#4caf50";
    }
    
    const exceptions = props.monthlyAvailability.exceptions?.length || 0;
    
    if (exceptions > 10) {
      return "#ff9800";
    } else if (exceptions > 0) {
      return "#1976d2";
    }
    
    return "#1976d2";
  };

  // Check if it's monthly or short term based on daysAtPreferredTime
  const getAvailabilityDuration = () => {
    if (!props.monthlyAvailability) return "Short Term";
    
    if (props.monthlyAvailability.summary?.daysAtPreferredTime >= 30) {
      return "Monthly";
    } else {
      return "Short Term";
    }
  };

  // Get gender symbol - Updated to match image format (M, F)
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

  // Get provider ID - FIXED: Handle property name variations correctly
  const getProviderId = () => {
    // Try to get the provider ID from different property names
    const id = props.serviceproviderId || props.serviceproviderid;
    console.log("Provider ID check:", {
      serviceproviderId: props.serviceproviderId,
      serviceproviderid: props.serviceproviderid,
      
      selected: id
    });
    return id ? String(id) : undefined;
  };

  // Get first name - FIXED: Handle property name variations
  const getFirstName = () => {
    return props.firstName || props.firstname || '';
  };

  // Get last name - FIXED: Handle property name variations
  const getLastName = () => {
    return props.lastName || props.lastname || '';
  };

  // Get housekeeping role - FIXED: Handle property name variations
  const getHousekeepingRole = () => {
    return props.housekeepingRole || props.housekeepingrole || "UNKNOWN";
  };

  // Handle Book Now - FIXED VERSION
  const handleBookNow = () => {
    const providerId = getProviderId();
    console.log("Book Now clicked for provider ID:", providerId);
    
    if (!providerId) {
      console.error("No provider ID found!");
      Alert.alert("Error", "Provider ID not found");
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
    
    // FIXED: Directly open the dialog (matching web behavior)
    setOpen(true);
    console.log("Dialog opened state:", true);
  };

  // Handle login - Simplified version
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
    return props.distance_km || 0;
  };

  // Get experience display
  const getExperienceDisplay = () => {
    return props.experience || 1;
  };

  // Render service dialog - FIXED VERSION
  const renderServiceDialog = () => {
    const providerId = getProviderId();
    const housekeepingRole = getHousekeepingRole();
    const firstName = getFirstName();
    const lastName = getLastName();
    
    console.log("Rendering service dialog, open:", open);
    console.log("Provider role:", housekeepingRole);
    console.log("Provider ID:", providerId);
    console.log("First Name:", firstName);
    console.log("Last Name:", lastName);
    
    // FIXED: Create providerDetailsData exactly like in your React web version
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

    console.log("Dialog data prepared:", {
      id: providerDetailsData.serviceproviderId,
      name: `${providerDetailsData.firstName} ${providerDetailsData.lastName}`,
      role: providerDetailsData.housekeepingRole
    });

    // FIXED: Use the variable that handles both property name variations
    switch (housekeepingRole) {
      case "COOK":
        console.log("Rendering COOK dialog");
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
        console.log("Rendering MAID dialog");
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
        console.log("Rendering NANNY dialog");
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
        console.log("No dialog for role:", housekeepingRole);
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

  return (
    <View style={styles.container}>
      <View style={[
        styles.card,
        isMobile && styles.cardMobile,
        isSmallScreen && styles.cardSmall,
      ]}>
        {/* Best Match Ribbon */}
        {props.bestMatch && (
          <View style={[
            styles.bestMatchRibbon,
            isMobile && styles.bestMatchRibbonMobile
          ]}>
            <MaterialCommunityIcons name="fire" size={14} color="white" />
            <Text style={[
              styles.bestMatchRibbonText,
              isMobile && styles.bestMatchRibbonTextMobile
            ]}>Best Match</Text>
          </View>
        )}

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
                isMobile && styles.nameTextMobile
              ]}>
                {fullName}
              </Text>
              <View style={styles.genderAgeChip}>
                <Text style={[
                  styles.genderAgeText,
                  isMobile && styles.genderAgeTextMobile
                ]}>
                  {genderSymbol}. {age}
                </Text>
              </View>
            </View>

            {/* Meta Info Row */}
            <View style={[
              styles.metaRow,
              isMobile && styles.metaRowMobile
            ]}>
              <View style={styles.metaItem}>
                <Icon name="restaurant" size={14} color="#666" />
                <Text style={[
                  styles.metaText,
                  isMobile && styles.metaTextMobile
                ]}>{props.diet || "NONVEG"}</Text>
              </View>

              <View style={styles.metaDivider} />

              <View style={styles.metaItem}>
                <Icon name="language" size={14} color="#666" />
                <Text style={[
                  styles.metaText,
                  isMobile && styles.metaTextMobile
                ]}>{getLanguageDisplay()}</Text>
              </View>

              <View style={styles.metaDivider} />

              <View style={styles.metaItem}>
                <Icon name="location-on" size={14} color="#666" />
                <Text style={[
                  styles.metaText,
                  isMobile && styles.metaTextMobile
                ]}>{props.locality || "sukna forest"}</Text>
              </View>
            </View>

            {/* Availability Section */}
            <View style={[
              styles.availabilitySection,
              isMobile && styles.availabilitySectionMobile
            ]}>
              <Text style={[
                styles.availabilityLabel,
                isMobile && styles.availabilityLabelMobile
              ]}>Availability</Text>
              
              {/* Availability Info Row */}
              <View style={[
                styles.availabilityInfoRow,
                isMobile && styles.availabilityInfoRowMobile
              ]}>
                <Icon name="access-time" size={16} color={getTimeIconColor()} />
                <Text style={[
                  styles.availabilityMessage,
                  isMobile && styles.availabilityMessageMobile
                ]}>
                  {getAvailabilityMessage()}
                </Text>
              </View>

              {/* Availability Chips Row */}
              <View style={[
                styles.availabilityChipsRow,
                isMobile && styles.availabilityChipsRowMobile
              ]}>
                <View style={[
                  styles.durationChip,
                  isMobile && styles.durationChipMobile
                ]}>
                  <Text style={[
                    styles.durationChipText,
                    isMobile && styles.durationChipTextMobile
                  ]}>
                    {getAvailabilityDuration()}
                  </Text>
                </View>

                <View style={[
                  styles.availabilityChipContainer,
                  getAvailabilityStyle(),
                  isMobile && styles.availabilityChipContainerMobile
                ]}>
                  <Text style={[
                    styles.availabilityChipText,
                    isMobile && styles.availabilityChipTextMobile
                  ]}>
                    {getAvailabilityStatus()}
                  </Text>
                </View>
              </View>

              {/* Additional Availability Info */}
              {props.monthlyAvailability?.exceptions && props.monthlyAvailability.exceptions.length > 0 && (
                <Text style={[
                  styles.exceptionText,
                  isMobile && styles.exceptionTextMobile
                ]}>
                  ▲ {props.monthlyAvailability.exceptions.length} schedule exceptions this month
                </Text>
              )}

              {props.monthlyAvailability?.fullyAvailable && (
                <Text style={[
                  styles.fullyAvailableText,
                  isMobile && styles.fullyAvailableTextMobile
                ]}>
                  ✓ Fully available all month
                </Text>
              )}

              {props.monthlyAvailability && !props.monthlyAvailability.fullyAvailable && 
               (!props.monthlyAvailability.exceptions || props.monthlyAvailability.exceptions.length === 0) && (
                <Text style={[
                  styles.partiallyAvailableText,
                  isMobile && styles.partiallyAvailableTextMobile
                ]}>
                  ⚠️ Partially available this month
                </Text>
              )}
            </View>
          </View>

          {/* Metrics Section - Center */}
          <View style={[
            styles.metricsSection,
            isMobile && styles.metricsSectionMobile
          ]}>
            <View style={[
              styles.metricBox,
              isMobile && styles.metricBoxMobile
            ]}>
              <Text style={[
                styles.metricValue,
                isMobile && styles.metricValueMobile
              ]}>{getDistanceDisplay()}</Text>
              <Text style={[
                styles.metricLabel,
                isMobile && styles.metricLabelMobile
              ]}>km away</Text>
            </View>

            <View style={[
              styles.metricBox,
              isMobile && styles.metricBoxMobile
            ]}>
              <View style={styles.ratingRow}>
                <Icon name="star" size={14} color="#FFD700" />
                <Text style={[
                  styles.metricValue,
                  isMobile && styles.metricValueMobile
                ]}>{getRatingDisplay()}</Text>
              </View>
              <Text style={[
                styles.metricLabel,
                isMobile && styles.metricLabelMobile
              ]}>{getReviewCount()} reviews</Text>
            </View>

            <View style={[
              styles.metricBox,
              isMobile && styles.metricBoxMobile
            ]}>
              <Text style={[
                styles.metricValue,
                styles.experienceValue,
                isMobile && styles.metricValueMobile
              ]}>{getExperienceDisplay()}</Text>
              <Text style={[
                styles.metricLabel,
                isMobile && styles.metricLabelMobile
              ]}>yrs experience</Text>
            </View>
          </View>

          {/* Right Section - Actions */}
          <View style={[
            styles.rightSection,
            isMobile && styles.rightSectionMobile
          ]}>
            {/* Role Chip - FIXED: Use the function that handles both property names */}
            {housekeepingRole && housekeepingRole !== "UNKNOWN" && (
              <View style={[
                styles.roleChip,
                isMobile && styles.roleChipMobile
              ]}>
                <Text style={[
                  styles.roleChipText,
                  isMobile && styles.roleChipTextMobile
                ]}>
                  {housekeepingRole}
                </Text>
              </View>
            )}

            {/* View Details Button */}
            <TouchableOpacity 
              style={[
                styles.detailsButton,
                isMobile && styles.detailsButtonMobile
              ]}
              onPress={handleViewDetails}
            >
              <Icon name="info-outline" size={16} color="#1976d2" />
              <Text style={[
                styles.detailsButtonText,
                isMobile && styles.detailsButtonTextMobile
              ]}>
                Details
              </Text>
            </TouchableOpacity>

            {/* Book Now Button */}
            <TouchableOpacity 
              style={[
                styles.bookNowButton,
                isMobile && styles.bookNowButtonMobile
              ]}
              onPress={handleBookNow}
            >
              <Text style={[
                styles.bookNowButtonText,
                isMobile && styles.bookNowButtonTextMobile
              ]}>
                Book
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
      
      {/* Debug overlay - helpful for development */}
      {/* {__DEV__ && (
        <View style={styles.debugOverlay}>
          <Text style={styles.debugText}>Name: {fullName}</Text>
          <Text style={styles.debugText}>Provider ID: {providerId}</Text>
          <Text style={styles.debugText}>Role: {housekeepingRole}</Text>
        </View>
      )} */}
    </View>
  );
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: '#f5f5f5',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
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
    backgroundColor: '#ff9800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    shadowColor: '#000',
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
    fontSize: 12,
  },
  bestMatchRibbonTextMobile: {
    fontSize: 10,
  },
  mainContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 20,
  },
  mainContentMobile: {
    flexDirection: 'column',
    gap: 16,
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
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  nameText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginRight: 8,
  },
  nameTextMobile: {
    fontSize: 16,
  },
  genderAgeChip: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#666',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  genderAgeText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  genderAgeTextMobile: {
    fontSize: 11,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  metaRowMobile: {
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  metaText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
  metaTextMobile: {
    fontSize: 12,
  },
  metaDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#e0e0e0',
    marginRight: 8,
  },
  availabilitySection: {
    marginBottom: 16,
  },
  availabilitySectionMobile: {
    marginBottom: 12,
  },
  availabilityLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  availabilityLabelMobile: {
    fontSize: 13,
  },
  availabilityInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  availabilityInfoRowMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  availabilityMessage: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginLeft: 6,
  },
  availabilityMessageMobile: {
    fontSize: 14,
  },
  availabilityChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  availabilityChipsRowMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  durationChip: {
    borderWidth: 1,
    borderColor: '#1976d2',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  durationChipMobile: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  durationChipText: {
    fontSize: 11,
    color: '#1976d2',
    fontWeight: '500',
  },
  durationChipTextMobile: {
    fontSize: 10,
  },
  availabilityChipContainer: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  availabilityChipContainerMobile: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  availabilityChipAvailable: {
    backgroundColor: '#e8f5e9',
  },
  availabilityChipFullyAvailable: {
    backgroundColor: '#e8f5e9',
  },
  availabilityChipPartial: {
    backgroundColor: '#fff3e0',
  },
  availabilityChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  availabilityChipTextMobile: {
    fontSize: 10,
  },
  exceptionText: {
    fontSize: 12,
    color: '#ff9800',
    fontWeight: '500',
    marginTop: 2,
  },
  exceptionTextMobile: {
    fontSize: 11,
  },
  fullyAvailableText: {
    fontSize: 12,
    color: '#4caf50',
    fontWeight: '500',
    marginTop: 2,
  },
  fullyAvailableTextMobile: {
    fontSize: 11,
  },
  partiallyAvailableText: {
    fontSize: 12,
    color: '#ff9800',
    fontWeight: '500',
    marginTop: 2,
  },
  partiallyAvailableTextMobile: {
    fontSize: 11,
  },
  metricsSection: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: 240,
  },
  metricsSectionMobile: {
    width: '100%',
    gap: 8,
  },
  metricBox: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    alignItems: 'center',
    minWidth: 70,
  },
  metricBoxMobile: {
    padding: 10,
    minWidth: 65,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  metricValueMobile: {
    fontSize: 15,
  },
  experienceValue: {
    color: '#2e7d32',
  },
  metricLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
    textAlign: 'center',
  },
  metricLabelMobile: {
    fontSize: 10,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rightSection: {
    flexDirection: 'column',
    gap: 12,
    alignItems: 'stretch',
    minWidth: 100,
  },
  rightSectionMobile: {
    width: '100%',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
    marginTop: 12,
  },
  roleChip: {
    backgroundColor: '#1976d2',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  roleChipMobile: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  roleChipText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  roleChipTextMobile: {
    fontSize: 11,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#1976d2',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  detailsButtonMobile: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    minHeight: 36,
  },
  detailsButtonText: {
    color: '#1976d2',
    fontSize: 13,
    fontWeight: '500',
  },
  detailsButtonTextMobile: {
    fontSize: 12,
  },
  bookNowButton: {
    backgroundColor: '#1976d2',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  bookNowButtonMobile: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
    minHeight: 36,
  },
  bookNowButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  bookNowButtonTextMobile: {
    fontSize: 13,
  },
  // Debug styles
  // debugOverlay: {
  //   position: 'absolute',
  //   bottom: 10,
  //   right: 10,
  //   backgroundColor: 'rgba(0,0,0,0.7)',
  //   padding: 5,
  //   borderRadius: 5,
  // },
  // debugText: {
  //   color: 'white',
  //   fontSize: 10,
  // },
});

export default ProviderDetails;