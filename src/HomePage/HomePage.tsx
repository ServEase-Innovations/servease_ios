import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  Button,
  Platform,
  TextStyle,
  ViewStyle,
  ImageStyle,
  Animated,
  Dimensions,
  Alert
} from "react-native";
import { useDispatch } from "react-redux";
import { add } from "../features/bookingTypeSlice";
import { DETAILS } from "../Constants/pagesConstants";
import DateTimePicker from "@react-native-community/datetimepicker";
import RadioButton from '../common/RadioButton';
import ServiceProviderRegistration from '../Registration/ServiceProviderRegistration'; // Already imported
import ServiceDetailsDialog from './ServiceDetailsDialog'; 
import MaidServiceDialog from "../ServiceDialogs/MaidServiceDialog";
import DemoCook from "../ServiceDialogs/CookServiceDialog";
import NannyServicesDialog from "../ServiceDialogs/NannyServiceDialog";
import LinearGradient from 'react-native-linear-gradient';
import AgentRegistrationForm from '../AgentRegistration/AgentRegistrationForm';
import { useAuth0 } from 'react-native-auth0';
import BookingDialog from '../BookingDialog/BookingDialog'; // Import the BookingDialog component

// Import local images
const cookImage = require("../../assets/images/Cooknew.png");
const maidImage = require("../../assets/images/Maidnew.png");
const nannyImage = require("../../assets/images/Nannynew.png");
const heroImage1 = require("../../assets/images/CookLand.png");
const heroImage2 = require("../../assets/images/MaidLand.png");
const heroImage3 = require("../../assets/images/NannyLand.png");

interface ChildComponentProps {
  sendDataToParent: (data: string) => void;
  bookingType: (data: string) => void;
  user?: any;
  providerDetails?: any;
}

// Define slides outside the component
const howItWorksSlides = [
  {
    icon: "✋",
    title: "Choose your service",
    desc: "Select from a variety of tasks that suit your needs.",
    color: "#c0aceeff",
    iconColor: "#d7b0eeff",
    gradientColors: ['#d59effff', '#e5dbf0ff', '#f2e9faff']
  },
  {
    icon: "📅",
    title: "Schedule in minutes",
    desc: "Book a time that works for you, quickly and easily.",
    color: "#9ED2FF",
    iconColor: "#5C9EFF",
    gradientColors: ['#9ED2FF', '#D2E9FF', '#F0F8FF']
  },
  {
    icon: "🏠",
    title: "Relax, we'll handle the rest",
    desc: "Our verified professionals ensure your peace of mind.",
    color: "#a4f6c6ff",
    iconColor: "#92f5d9ff",
    gradientColors: ['#90e9e5ff', '#d2fff4ff', '#F0FFF2']
  },
];

const HomePage: React.FC<ChildComponentProps> = ({
  sendDataToParent,
  bookingType,
}) => {
  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedtype] = useState("");
  const [selectedRadioButtonValue, setSelectedRadioButtonValue] = useState("");
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<any>(null);
  const [endTime, setEndTime] = useState<any>(null);
  const [showRegistration, setShowRegistration] = useState(false);
  const [serviceDetailsOpen, setServiceDetailsOpen] = useState(false);
  const [selectedServiceType, setSelectedServiceType] = useState<"cook" | "maid" | "babycare" | null>(null);
  const [showCookServicesDialog, setShowCookServicesDialog] = useState(false);
  const [showMaidServiceDialog, setShowMaidServiceDialog] = useState(false);
  const [showNannyServicesDialog, setShowNannyServicesDialog] = useState(false);
  const [showCookDialog, setShowCookDialog] = useState(false);
  const [hoveredService, setHoveredService] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [showAgentRegistration, setShowAgentRegistration] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auth0 authentication
  const { user: auth0User, authorize, clearSession } = useAuth0();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  // Check authentication status
  useEffect(() => {
    setIsAuthenticated(!!auth0User);
  }, [auth0User]);

  // Login function
  const handleLogin = async () => {
    try {
      await authorize();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  // Initialize user role from Auth0
  useEffect(() => {
    const initializeUser = async () => {
      if (isAuthenticated && auth0User) {
        const userRole = auth0User.role || "CUSTOMER";
        setRole(userRole);
        console.log("User role:", userRole);
      }
    };
    initializeUser();
  }, [isAuthenticated, auth0User]);

  const handleAgentWorkButtonClick = () => {
    setShowAgentRegistration(true);
  };
  
  // Carousel images array
  const carouselImages = [heroImage1, heroImage2, heroImage3];

  // Single interval for both carousel and How It Works slides
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === carouselImages.length - 1 ? 0 : prevIndex + 1
      );
      setCurrentSlide((prevSlide) => 
        prevSlide === howItWorksSlides.length - 1 ? 0 : prevSlide + 1
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const HowItWorksSection = () => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }, [currentSlide]);

    return (
      <View style={styles.howItWorksSection}>
        <Text style={styles.sectionTitle}>How It Works</Text>
        <View style={styles.slideshowContainer}>
          <Animated.View
            style={[
              styles.slide,
              {
                opacity: fadeAnim,
                transform: [{ translateX: slideAnim }],
                shadowColor: howItWorksSlides[currentSlide].iconColor,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 10,
                elevation: 10,
              },
            ]}
          >
            <LinearGradient
              colors={howItWorksSlides[currentSlide].gradientColors}
              start={{x: 0, y: 0}}
              end={{x: 0, y: 1}}
              style={styles.gradientContainer}
            >
              <View style={styles.iconContainer}>
                <Text style={[styles.stepIcon, { color: howItWorksSlides[currentSlide].iconColor }]}>
                  {howItWorksSlides[currentSlide].icon}
                </Text>
              </View>
              <Text style={styles.stepTitle}>{howItWorksSlides[currentSlide].title}</Text>
              <Text style={styles.stepDesc}>{howItWorksSlides[currentSlide].desc}</Text>
            </LinearGradient>
          </Animated.View>
        </View>
        <View style={styles.dotsContainer}>
          {howItWorksSlides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentSlide && [
                  styles.activeDot,
                  { backgroundColor: howItWorksSlides[index].iconColor },
                ],
              ]}
            />
          ))}
        </View>
      </View>
    );
  };

  const handleWorkButtonClick = () => {
    setShowRegistration(true);
  };

  const dispatch = useDispatch();

  const handleClick = (data: string) => {
    setOpen(true);
    setSelectedtype(data);
  };

  const getSelectedValue = (value: string) => {
    setSelectedRadioButtonValue(value);
    setStartDate(null);
    setEndDate(null);
    setStartTime(null);
    setEndTime(null);
  };

  const handleClose = () => {
    setOpen(false);
  };

const handleSave = (bookingDetails: any) => {
  const formatDate = (value: any) => {
    if (!value) return "";
    const date = new Date(value);
    if (isNaN(date.getTime())) return value; // already formatted string
    return date.toISOString().split("T")[0]; // "YYYY-MM-DD"
  };

  const formatTime = (value: any) => {
    if (!value) return "";
    
    console.log("🔧 formatTime input:", value, typeof value);
    
    // If it's a dayjs object, use it directly
    if (value && typeof value === 'object' && value.format) {
      console.log("📅 Using dayjs format");
      return value.format("HH:mm"); // 24-hour format
    }
    
    // If it's a Date object
    if (value instanceof Date) {
      console.log("📅 Using Date object");
      return value.toTimeString().slice(0, 5); // "HH:mm"
    }
    
    // If it's already a string, clean it up
    if (typeof value === 'string') {
      console.log("📅 Processing string time:", value);
      
      let timeStr = value.trim();
      
      // Handle 12-hour format with AM/PM
      if (timeStr.includes('AM') || timeStr.includes('PM')) {
        console.log("🕒 Converting 12-hour to 24-hour format");
        const [timePart, period] = timeStr.split(/\s+/);
        let [hours, minutes] = timePart.split(':').map(Number);
        
        if (period === 'PM' && hours < 12) {
          hours += 12;
        } else if (period === 'AM' && hours === 12) {
          hours = 0;
        }
        
        const result = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        console.log("🔄 Converted:", timeStr, "→", result);
        return result;
      }
      
      // If it's already in 24-hour format, clean and return
      const cleaned = timeStr.replace(/\s+/g, '');
      console.log("🧹 Cleaned time:", timeStr, "→", cleaned);
      return cleaned;
    }
    
    console.log("❌ Unhandled time format");
    return "";
  };

  const booking = {
    start_date: formatDate(bookingDetails.startDate),
    start_time: formatTime(bookingDetails.startTime),
    end_date: formatDate(bookingDetails.endDate || bookingDetails.startDate),
    end_time: formatTime(bookingDetails.endTime),
    timeRange:
      bookingDetails.startTime && bookingDetails.endTime
        ? `${formatTime(bookingDetails.startTime)} - ${formatTime(bookingDetails.endTime)}`
        : formatTime(bookingDetails.startTime) || "",
    bookingPreference: selectedRadioButtonValue,
    housekeepingRole: selectedType,
  };

  console.log("✅ Final booking object:", JSON.stringify(booking, null, 2));

  if (selectedRadioButtonValue === "Date") {
    switch (selectedType) {
      case "COOK":
        setShowCookDialog(true);
        break;
      case "MAID":
        setShowMaidServiceDialog(true);
        break;
      case "NANNY":
        setShowNannyServicesDialog(true);
        break;
      default:
        sendDataToParent(DETAILS);
    }
  } else {
    sendDataToParent(DETAILS);
  }

  setOpen(false);
  dispatch(add(booking));
};

  const handleLearnMore = (service: string) => {
    switch (service) {
      case "Home Cook":
        setSelectedServiceType("cook");
        break;
      case "Cleaning Help":
        setSelectedServiceType("maid");
        break;
      case "Caregiver":
        setSelectedServiceType("babycare");
        break;
      default:
        setSelectedServiceType(null);
    }
    setServiceDetailsOpen(true);
  };

  // Fix for disabled props - convert null to false
  const isServiceDisabled = role === "SERVICE_PROVIDER";

  return (
    <View style={styles.mainContainer}>
      {/* Main Home Page Content */}
      <ScrollView style={styles.container} scrollEnabled={!showRegistration && !showAgentRegistration}>
        <LinearGradient
          colors={['#0a2a66', '#004aad']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          style={styles.heroSectionGradient}
        >
          {/* Hero Section */}
          <View style={styles.heroTextContainer}>
            <Text style={styles.heroTitle}>
              Book trusted household help in minutes
            </Text>
            <Text style={styles.heroSubtitle}>
              ServEaso delivers instant, regular and short term access to safe, affordable, and trained maids, cooks, and caregivers.
            </Text>
            
            {/* Service Selection Header */}
            <Text style={styles.selectorTitle}>What service do you need?</Text>
            <Text style={styles.selectorSubtitle}>Tap to book instantly</Text>
            
            <View style={styles.serviceIconsContainer}>
              {/* Cook Service */}
              <View style={styles.serviceSelectorContainer}>
                <TouchableOpacity
                  style={[
                    styles.serviceIconContainerRectangular,
                    hoveredService === "COOK" && styles.serviceIconContainerRectangularHover,
                  ]}
                  onPress={() => !isServiceDisabled && handleClick("COOK")}
                  onPressIn={() => setHoveredService("COOK")}
                  onPressOut={() => setHoveredService(null)}
                  disabled={isServiceDisabled}
                >
                  <Image source={cookImage} style={[
                    styles.serviceImageRectangular,
                    isServiceDisabled && styles.disabledService
                  ]} />
                  <View style={styles.serviceOverlay}>
                    <Text style={styles.serviceLabelRectangular}>Home Cook</Text>
                    {isServiceDisabled && (
                      <Text style={styles.disabledText}>Not available</Text>
                    )}
                  </View>
                </TouchableOpacity>
              </View>

              {/* Maid Service */}
              <View style={styles.serviceSelectorContainer}>
                <TouchableOpacity
                  style={[
                    styles.serviceIconContainerRectangular,
                    hoveredService === "MAID" && styles.serviceIconContainerRectangularHover,
                  ]}
                  onPress={() => !isServiceDisabled && handleClick("MAID")}
                  onPressIn={() => setHoveredService("MAID")}
                  onPressOut={() => setHoveredService(null)}
                  disabled={isServiceDisabled}
                >
                  <Image source={maidImage} style={[
                    styles.serviceImageRectangular,
                    isServiceDisabled && styles.disabledService
                  ]} />
                  <View style={styles.serviceOverlay}>
                    <Text style={styles.serviceLabelRectangular}>Cleaning Help</Text>
                    {isServiceDisabled && (
                      <Text style={styles.disabledText}>Not available</Text>
                    )}
                  </View>
                </TouchableOpacity>
              </View>

              {/* Nanny Service */}
              <View style={styles.serviceSelectorContainer}>
                <TouchableOpacity
                  style={[
                    styles.serviceIconContainerRectangular,
                    hoveredService === "NANNY" && styles.serviceIconContainerRectangularHover,
                  ]}
                  onPress={() => !isServiceDisabled && handleClick("NANNY")}
                  onPressIn={() => setHoveredService("NANNY")}
                  onPressOut={() => setHoveredService(null)}
                  disabled={isServiceDisabled}
                >
                  <Image source={nannyImage} style={[
                    styles.serviceImageRectangular,
                    isServiceDisabled && styles.disabledService
                  ]} />
                  <View style={styles.serviceOverlay}>
                    <Text style={styles.serviceLabelRectangular}>Caregiver</Text>
                    {isServiceDisabled && (
                      <Text style={styles.disabledText}>Not available</Text>
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            </View>
            
            
          </View>
          
          {/* Carousel Section */}
          <View style={styles.carouselContainer}>
            <Image 
              source={carouselImages[currentImageIndex]} 
              style={styles.carouselImage}
              resizeMode="cover"
            />
            <View style={styles.carouselIndicators}>
              {carouselImages.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.carouselIndicator,
                    index === currentImageIndex && styles.carouselIndicatorActive
                  ]}
                />
              ))}
            </View>
          </View>
        </LinearGradient>
        
        {/* Services Section */}
        <View style={styles.servicesSection}>
          <Text style={styles.sectionTitle}>Popular Services</Text>
          <View style={styles.servicesGrid}>
            {[
              {
                title: "Home Cook",
                desc: "Skilled and hygienic cooks who specialize in home-style meals.",
                icon: "👩‍🍳",
                gradient: ['#c5d6efff', '#176269ff'],
                iconBg: '#FFF5F5',
              },
              {
                title: "Cleaning Help",
                desc: "Reliable maids for daily, deep, or special occasion cleaning.",
                icon: "🧼",
                gradient: ['#c5d6efff', '#124c66ff'],
                iconBg: '#F0F9F8',
              },
              {
                title: "Caregiver",
                desc: "Trained support for children, seniors, or patients at home.",
                icon: "❤️",
                gradient: ['#c5d6efff', '#233572ff'],
                iconBg: '#FFF5F5',
              },
            ].map((service, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.serviceCard}
                onPress={() => handleLearnMore(service.title)}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={service.gradient}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={styles.serviceCardGradient}
                >
                  <View style={styles.serviceCardContent}>
                    <View style={[styles.serviceIconContainer, { backgroundColor: service.iconBg }]}>
                      <Text style={styles.serviceIcon}>{service.icon}</Text>
                    </View>
                    <Text style={styles.serviceTitle}>{service.title}</Text>
                    <Text style={styles.serviceDesc}>{service.desc}</Text>
                    <View style={styles.learnMoreContainer}>
                      <Text style={styles.learnMoreLink}>Learn More</Text>
                      <Text style={styles.learnMoreArrow}>→</Text>
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* How it works */}
        <HowItWorksSection />

        {/* Booking Dialog */}
        <BookingDialog
          open={open}
          onClose={handleClose}
          onSave={handleSave}
          selectedOption={selectedRadioButtonValue}
          onOptionChange={getSelectedValue}
          startDate={startDate}
          endDate={endDate}
          startTime={startTime}
          endTime={endTime}
          setStartDate={setStartDate}
          setEndDate={setEndDate}
          setStartTime={setStartTime}
          setEndTime={setEndTime}
        />

        {/* Service Dialogs */}
        {showCookDialog && (
          <View style={styles.dialogOverlay}>
            <View style={styles.dialogBox}>
              <DemoCook
                onClose={() => setShowCookDialog(false)}
                sendDataToParent={sendDataToParent}
                bookingType={{
                  startDate: startDate,
                  endDate: endDate || startDate,
                  timeRange: startTime
                    ? `${startTime.format("HH:mm")} - ${endTime.format("HH:mm")}`
                    : startTime?.format("HH:mm") || "",
                  bookingPreference: selectedRadioButtonValue,
                  housekeepingRole: selectedType,
                }}
              />
            </View>
          </View>
        )}

        {showNannyServicesDialog && (
          <View style={styles.dialogOverlay}>
            <View style={styles.dialogBox}>
            <NannyServicesDialog
      open={showNannyServicesDialog}
      handleClose={() => setShowNannyServicesDialog(false)}
      sendDataToParent={sendDataToParent}
      bookingType={{
        start_date: startDate ? new Date(startDate).toISOString().split("T")[0] : "",
        start_time: startTime ? new Date(startTime).toTimeString().slice(0, 5) : "",
        end_date: endDate
          ? new Date(endDate).toISOString().split("T")[0]
          : startDate
          ? new Date(startDate).toISOString().split("T")[0]
          : "",
        end_time: endTime ? new Date(endTime).toTimeString().slice(0, 5) : "",
        timeRange:
          startTime
            ? `${new Date(startTime).toTimeString().slice(0, 5)}`
            : startTime
            ? new Date(startTime).toTimeString().slice(0, 5)
            : "",
        bookingPreference: selectedRadioButtonValue,
        housekeepingRole: selectedType,
      }}
    />

            </View>
          </View>
        )}

        {showMaidServiceDialog && (
          <View style={styles.dialogOverlay}>
            <View style={styles.dialogBox}>
              <MaidServiceDialog
                open={showMaidServiceDialog}
                handleClose={() => setShowMaidServiceDialog(false)}
                sendDataToParent={sendDataToParent}
                bookingType={{
      start_date: startDate ? new Date(startDate).toISOString().split("T")[0] : "",
      start_time: startTime ? new Date(startTime).toTimeString().slice(0, 5) : "",
      end_date: endDate
        ? new Date(endDate).toISOString().split("T")[0]
        : startDate
        ? new Date(startDate).toISOString().split("T")[0]
        : "",
      end_time: endTime ? new Date(endTime).toTimeString().slice(0, 5) : "",
      timeRange:
        startTime
          ? `${new Date(startTime).toTimeString().slice(0, 5)}`
          : startTime
          ? new Date(startTime).toTimeString().slice(0, 5)
          : "",
      bookingPreference: selectedRadioButtonValue,
      housekeepingRole: selectedType,
    }}
              />
            </View>
          </View>
        )}

        <ServiceDetailsDialog
          open={serviceDetailsOpen}
          onClose={() => setServiceDetailsOpen(false)}
          serviceType={selectedServiceType}
        />
      </ScrollView>

      {/* Agent Registration Modal */}
      <Modal visible={showAgentRegistration} animationType="slide">
        <AgentRegistrationForm
          onBackToLogin={() => setShowAgentRegistration(false)}
          onRegistrationSuccess={() => setShowAgentRegistration(false)}
        />
      </Modal>

      {/* Service Provider Registration - rendered conditionally */}
      {showRegistration && (
        <ServiceProviderRegistration
          onBackToLogin={() => setShowRegistration(false)}
        />
      )}
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
  },
  selectorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  selectorSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 20,
  },
  serviceSelectorContainer: {
    alignItems: 'center',
    marginHorizontal: 10,
    flex: 1,
  },
  serviceLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  heroSectionGradient: {
    paddingTop: 20,
    flexDirection: "column",
  },
  heroTextContainer: {
    flex: 1,
    paddingRight: 0,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
    color: "#fff",
  },
  heroSubtitle: {
    fontSize: 14,
    color: "#fff",
    marginBottom: 16,
    textAlign: "center",
  },
  serviceIconsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  serviceTooltipContainer: {
    alignItems: "center",
    position: 'relative',
  },
  serviceIconContainerHover: {
    transform: [{ scale: 1.05 }],
    shadowColor: "#1976d2",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    borderColor: "#0d47a1",
    borderWidth: 3,
  },
  serviceImage: {
    width: 100,
    height: 100,
  },
  tooltip: {
    position: 'absolute',
    bottom: -30,
    backgroundColor: '#333',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 10,
  },
  tooltipText: {
    color: '#fff',
    fontSize: 12,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    paddingTop: 16,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: "#fff",
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 120,
  },
  outlineButtonHover: {
    backgroundColor: "#f8f9fa",
    transform: [{ scale: 1.05 }],
  },
  outlineButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1976d2",
    textAlign: 'center',
  },
  carouselContainer: {
    height: 270,
    position: 'relative',
    marginTop: 10,
  },
  carouselImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  carouselIndicators: {
    position: 'absolute',
    bottom: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  carouselIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 4,
  },
  carouselIndicatorActive: {
    backgroundColor: '#fff',
    width: 12,
  },
  servicesSection: {
    padding: 20,
    paddingTop: 30,
    backgroundColor: '#f8fafc',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 24,
    color: '#1a365d',
  },
  servicesGrid: {
    flexDirection: "column",
    gap: 16,
  },
  serviceCard: {
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
    overflow: 'hidden',
  },
  serviceCardPressed: {
    transform: [{ scale: 0.98 }],
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
  },
  serviceCardGradient: {
    borderRadius: 20,
    padding: 0,
  },
  serviceCardContent: {
    alignItems: "center",
    padding: 16,
    gap: 15,
  },
  serviceIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  serviceIcon: {
    fontSize: 28,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  serviceDesc: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    lineHeight: 16,
  },
  learnMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  learnMoreLink: {
    fontSize: 14,
    color: "#fff",
    fontWeight: '600',
  },
  learnMoreArrow: {
    fontSize: 16,
    color: "#fff",
    fontWeight: 'bold',
  },
  howItWorksSection: {
    backgroundColor: "#ffffffff",
    padding: 40,
    paddingVertical: 20,
  },
  slideshowContainer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    borderRadius: 20,
    width: '100%',
    height: '100%',
  },
  iconContainer: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    width: '90%',
    maxWidth: 350,
    height: '100%',
    overflow: 'hidden',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#1976d2',
  },
  stepIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
    color: '#333',
  },
  stepDesc: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  dialogOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  dialogBox: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 10,
  },
  serviceIconContainerRectangular: {
    width: 100,
    height: 150,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#1976d2",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  serviceIconContainerRectangularHover: {
    transform: [{ scale: 1.05 }],
    shadowColor: "#1976d2",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    borderColor: "#0d47a1",
    borderWidth: 2,
  },
  serviceImageRectangular: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  serviceOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 8,
    alignItems: 'center',
  },
  serviceLabelRectangular: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  disabledService: {
    opacity: 0.5,
  },
  disabledText: {
    color: '#ff6b6b',
    fontSize: 10,
    marginTop: 2,
  },
});

export default HomePage;