// HomePage.tsx - Complete with Broadcast Message Component (Fully Responsive)
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  Platform,
  Animated,
  Dimensions,
  Alert,
  useWindowDimensions,
} from "react-native";
import { useDispatch } from "react-redux";
import { add } from "../features/bookingTypeSlice";
import { DETAILS } from "../Constants/pagesConstants";
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth0 } from 'react-native-auth0';
import { useTheme } from '../Settings/ThemeContext';
import { useTranslation } from 'react-i18next';
import FirstBookingOffer from './FirstBookingOffer';
import ServiceSelectionDialog from './ServiceSelectionDialog';
import BookingDialog from '../BookingDialog/BookingDialog';
import ServiceDetailsDialog from './ServiceDetailsDialog';
import MaidServiceDialog from "../ServiceDialogs/MaidServiceDialog";
import DemoCook from "../ServiceDialogs/CookServiceDialog";
import NannyServicesDialog from "../ServiceDialogs/NannyServiceDialog";
import ServiceProviderRegistration from '../Registration/ServiceProviderRegistration';
import AgentRegistrationForm from '../Agent/AgentRegistrationForm';
import BroadcastMessage from './BroadcastMessage';

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

// Popular services data for carousel
const popularServices = [
  {
    id: 1,
    title: "Home Cook",
    titleKey: "homeCook",
    descKey: "cookDesc",
    icon: "👩‍🍳",
    features: [
      { key: "professional", text: "Professional chefs" },
      { key: "hygiene", text: "Hygiene certified" },
      { key: "customMenus", text: "Custom menus" }
    ],
    gradient: ['#0f2027', '#203a43', '#2c5364'],
    accentColor: '#ff6b6b',
    iconBg: '#ffe5e5',
  },
  {
    id: 2,
    title: "Cleaning Help",
    titleKey: "cleaningHelp",
    descKey: "maidDesc",
    icon: "🧹",
    features: [
      { key: "deepCleaning", text: "Deep cleaning" },
      { key: "ecoFriendly", text: "Eco-friendly" },
      { key: "scheduled", text: "Scheduled visits" }
    ],
    gradient: ['#0b3b5c', '#1c5985', '#2a7a9e'],
    accentColor: '#4ecdc4',
    iconBg: '#e0f7fa',
  },
  {
    id: 3,
    title: "Caregiver",
    titleKey: "caregiver",
    descKey: "nannyDesc",
    icon: "👶",
    features: [
      { key: "cprCertified", text: "CPR certified" },
      { key: "backgroundChecked", text: "Background checked" },
      { key: "support247", text: "24/7 support" }
    ],
    gradient: ['#42275a', '#734b6d', '#b4869f'],
    accentColor: '#f8b195',
    iconBg: '#fff0e5',
  },
];

// How it works slides
const howItWorksSlides = [
  {
    icon: "🔍",
    title: "Choose Your Service",
    desc: "Browse through our curated selection of professional household services tailored to your needs.",
    gradientColors: ['#1a1c2c', '#2a2f4f', '#1a2639'],
    features: ["100+ Services", "Verified Pros", "Instant Booking"],
    illustration: "✨",
    accentColor: '#4a6fa5',
  },
  {
    icon: "📱",
    title: "Book in Seconds",
    desc: "Schedule your service with our intuitive platform. Pick date, time, and preferences effortlessly.",
    gradientColors: ['#1f2a44', '#2c3e6e', '#1e2f4a'],
    features: ["Real-time Availability", "Instant Confirmation", "Flexible Scheduling"],
    illustration: "⚡",
    accentColor: '#3b8ea5',
  },
  {
    icon: "🏆",
    title: "Premium Service",
    desc: "Sit back and relax while our verified experts deliver exceptional quality and care.",
    gradientColors: ['#2a1f2f', '#3d2b3d', '#2a1f2f'],
    features: ["Quality Guaranteed", "Secure Payment", "24/7 Support"],
    illustration: "🌟",
    accentColor: '#8a6d9c',
  },
];

const HomePage: React.FC<ChildComponentProps> = ({
  sendDataToParent,
  bookingType,
}) => {
  // Get theme values
  const { colors, isDarkMode, fontSize } = useTheme();
  const { t } = useTranslation();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  
  // Responsive sizing based on screen dimensions
  const isSmallScreen = screenWidth < 375;
  const isMediumScreen = screenWidth >= 375 && screenWidth < 768;
  const isLargeScreen = screenWidth >= 768;
  
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
  const [showMaidServiceDialog, setShowMaidServiceDialog] = useState(false);
  const [showNannyServicesDialog, setShowNannyServicesDialog] = useState(false);
  const [showCookDialog, setShowCookDialog] = useState(false);
  const [hoveredService, setHoveredService] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showAgentRegistration, setShowAgentRegistration] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentServiceIndex, setCurrentServiceIndex] = useState(0);
  
  // Promotional offer states
  const [showOffer, setShowOffer] = useState(true);
  const [showServiceSelection, setShowServiceSelection] = useState(false);
  
  // Animation values for hero carousel
  const fadeAnim1 = useRef(new Animated.Value(1)).current;
  const fadeAnim2 = useRef(new Animated.Value(0)).current;
  const fadeAnim3 = useRef(new Animated.Value(0)).current;
  
  // Animation values for services carousel
  const serviceFadeAnim = useRef(new Animated.Value(1)).current;
  const serviceSlideAnim = useRef(new Animated.Value(0)).current;

  // Animation values for how it works carousel
  const howItWorksFadeAnim = useRef(new Animated.Value(1)).current;
  const howItWorksSlideAnim = useRef(new Animated.Value(0)).current;

  // Auth0 authentication
  const { user: auth0User } = useAuth0();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  // Get font size styles based on settings and screen size
  const getFontSizeStyles = () => {
    let baseSize = 16;
    let headingSize = 20;
    let smallText = 14;
    
    if (isSmallScreen) {
      baseSize = 13;
      headingSize = 18;
      smallText = 11;
    } else if (isMediumScreen) {
      baseSize = 15;
      headingSize = 20;
      smallText = 13;
    } else if (isLargeScreen) {
      baseSize = 17;
      headingSize = 24;
      smallText = 15;
    }
    
    switch (fontSize) {
      case 'small':
        return { textSize: baseSize - 2, headingSize: headingSize - 2, smallText: smallText - 2 };
      case 'large':
        return { textSize: baseSize + 2, headingSize: headingSize + 2, smallText: smallText + 2 };
      default:
        return { textSize: baseSize, headingSize: headingSize, smallText: smallText };
    }
  };

  const fontStyles = getFontSizeStyles();

  // Carousel images array
  const carouselImages = [heroImage1, heroImage2, heroImage3];

  // Responsive service icon size
  const getServiceIconSize = () => {
    if (isSmallScreen) return 90;
    if (isMediumScreen) return 110;
    return 130;
  };

  const getServiceIconHeight = () => {
    if (isSmallScreen) return 140;
    if (isMediumScreen) return 160;
    return 180;
  };

  // Check authentication status
  useEffect(() => {
    setIsAuthenticated(!!auth0User);
  }, [auth0User]);

  // Initialize user role from Auth0
  useEffect(() => {
    const initializeUser = async () => {
      if (isAuthenticated && auth0User) {
        const userRole = auth0User.role || "CUSTOMER";
        setRole(userRole);
      }
    };
    initializeUser();
  }, [isAuthenticated, auth0User]);
  
  // Smooth carousel with crossfade animation for hero section
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    const startCarousel = () => {
      interval = setInterval(() => {
        const nextIndex = (currentImageIndex + 1) % carouselImages.length;
        
        if (currentImageIndex === 0 && nextIndex === 1) {
          Animated.parallel([
            Animated.timing(fadeAnim1, { toValue: 0, duration: 1500, useNativeDriver: true }),
            Animated.timing(fadeAnim2, { toValue: 1, duration: 1500, useNativeDriver: true }),
          ]).start(() => {
            setCurrentImageIndex(nextIndex);
            fadeAnim1.setValue(0);
            fadeAnim2.setValue(1);
            fadeAnim3.setValue(0);
          });
        } else if (currentImageIndex === 1 && nextIndex === 2) {
          Animated.parallel([
            Animated.timing(fadeAnim2, { toValue: 0, duration: 1500, useNativeDriver: true }),
            Animated.timing(fadeAnim3, { toValue: 1, duration: 1500, useNativeDriver: true }),
          ]).start(() => {
            setCurrentImageIndex(nextIndex);
            fadeAnim1.setValue(0);
            fadeAnim2.setValue(0);
            fadeAnim3.setValue(1);
          });
        } else if (currentImageIndex === 2 && nextIndex === 0) {
          Animated.parallel([
            Animated.timing(fadeAnim3, { toValue: 0, duration: 1500, useNativeDriver: true }),
            Animated.timing(fadeAnim1, { toValue: 1, duration: 1500, useNativeDriver: true }),
          ]).start(() => {
            setCurrentImageIndex(nextIndex);
            fadeAnim1.setValue(1);
            fadeAnim2.setValue(0);
            fadeAnim3.setValue(0);
          });
        }
      }, 5000);
    };
    
    startCarousel();
    return () => { if (interval) clearInterval(interval); };
  }, [currentImageIndex]);

  // Services carousel with smooth transitions
  useEffect(() => {
    let serviceInterval: NodeJS.Timeout;
    
    const startServiceCarousel = () => {
      serviceInterval = setInterval(() => {
        const nextIndex = (currentServiceIndex + 1) % popularServices.length;
        
        Animated.parallel([
          Animated.timing(serviceFadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
          Animated.timing(serviceSlideAnim, { toValue: -50, duration: 400, useNativeDriver: true }),
        ]).start(() => {
          setCurrentServiceIndex(nextIndex);
          serviceSlideAnim.setValue(50);
          Animated.parallel([
            Animated.timing(serviceFadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.timing(serviceSlideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
          ]).start();
        });
      }, 5000);
    };
    
    startServiceCarousel();
    return () => { if (serviceInterval) clearInterval(serviceInterval); };
  }, [currentServiceIndex]);

  // How It Works carousel with smooth transitions
  useEffect(() => {
    let howItWorksInterval: NodeJS.Timeout;
    
    const startHowItWorksCarousel = () => {
      howItWorksInterval = setInterval(() => {
        const nextIndex = (currentSlide + 1) % howItWorksSlides.length;
        
        Animated.parallel([
          Animated.timing(howItWorksFadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
          Animated.timing(howItWorksSlideAnim, { toValue: -50, duration: 400, useNativeDriver: true }),
        ]).start(() => {
          setCurrentSlide(nextIndex);
          howItWorksSlideAnim.setValue(50);
          Animated.parallel([
            Animated.timing(howItWorksFadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.timing(howItWorksSlideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
          ]).start();
        });
      }, 5000);
    };
    
    startHowItWorksCarousel();
    return () => { if (howItWorksInterval) clearInterval(howItWorksInterval); };
  }, [currentSlide]);

  // Initialize animation values
  useEffect(() => {
    fadeAnim1.setValue(1);
    fadeAnim2.setValue(0);
    fadeAnim3.setValue(0);
    serviceFadeAnim.setValue(1);
    serviceSlideAnim.setValue(0);
    howItWorksFadeAnim.setValue(1);
    howItWorksSlideAnim.setValue(0);
  }, []);

  const dispatch = useDispatch();

  const handleClick = (data: string) => {
    if (isServiceDisabled) {
      Alert.alert(
        t('home.serviceProvider.alert.title'),
        t('home.serviceProvider.alert.message'),
        [{ text: t('common.ok') }]
      );
      return;
    }
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
    bookingDetails.startTime = bookingDetails.startTime.format("HH:mm");
    bookingDetails.endTime = bookingDetails.endTime.format("HH:mm");
    
    const formatDate = (value: any) => {
      if (!value) return "";
      const date = new Date(value);
      if (isNaN(date.getTime())) return value;
      return date.toISOString().split("T")[0];
    };

    const formatTime = (value: any) => {
      if (!value) return "";
      if (value && typeof value === 'object' && value.format) {
        return value.format("HH:mm");
      }
      if (value instanceof Date) {
        return value.toTimeString().slice(0, 5);
      }
      if (typeof value === 'string') {
        let timeStr = value.trim();
        if (timeStr.includes('AM') || timeStr.includes('PM')) {
          const [timePart, period] = timeStr.split(/\s+/);
          let [hours, minutes] = timePart.split(':').map(Number);
          if (period === 'PM' && hours < 12) hours += 12;
          else if (period === 'AM' && hours === 12) hours = 0;
          return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        }
        return timeStr.replace(/\s+/g, '');
      }
      return "";
    };

    const booking = {
      start_date: formatDate(bookingDetails.startDate),
      start_time: formatTime(bookingDetails.startTime),
      end_date: formatDate(bookingDetails.endDate || bookingDetails.startDate),
      end_time: bookingDetails.endTime,
      timeRange: bookingDetails.startTime && bookingDetails.endTime
        ? `${formatTime(bookingDetails.startTime)} - ${formatTime(bookingDetails.endTime)}`
        : formatTime(bookingDetails.startTime) || "",
      bookingPreference: selectedRadioButtonValue,
      housekeepingRole: selectedType,
    };

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

  const isServiceDisabled = role === "SERVICE_PROVIDER";

  const handleCardPressIn = (index: number) => {
    Animated.spring(scaleAnimations[index], {
      toValue: 0.98,
      useNativeDriver: true,
      tension: 150,
      friction: 3
    }).start();
  };

  const handleCardPressOut = (index: number) => {
    Animated.spring(scaleAnimations[index], {
      toValue: 1,
      useNativeDriver: true,
      tension: 150,
      friction: 3
    }).start();
  };

  const scaleAnimations = useRef([
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1)
  ]).current;

  const goToServiceSlide = (index: number) => {
    if (index === currentServiceIndex) return;
    const direction = index > currentServiceIndex ? -50 : 50;
    
    Animated.parallel([
      Animated.timing(serviceFadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(serviceSlideAnim, { toValue: direction, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      setCurrentServiceIndex(index);
      serviceSlideAnim.setValue(direction * -1);
      Animated.parallel([
        Animated.timing(serviceFadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(serviceSlideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    });
  };

  const goToHowItWorksSlide = (index: number) => {
    if (index === currentSlide) return;
    const direction = index > currentSlide ? -50 : 50;
    
    Animated.parallel([
      Animated.timing(howItWorksFadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(howItWorksSlideAnim, { toValue: direction, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      setCurrentSlide(index);
      howItWorksSlideAnim.setValue(direction * -1);
      Animated.parallel([
        Animated.timing(howItWorksFadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(howItWorksSlideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    });
  };

  // Handle promotional offer press - opens service selection dialog
  const handlePromotionalOfferPress = () => {
    setShowServiceSelection(true);
  };

  // Handle service selection from dialog
  const handleServiceSelectedFromOffer = (serviceType: string) => {
    setSelectedtype(serviceType);
    setOpen(true);
  };

  // Handle coupon application from broadcast message
  const handleCouponApplied = (couponCode: string) => {
    console.log('Coupon applied:', couponCode);
  };

  // Responsive hero section height
  const getHeroMinHeight = () => {
    if (isSmallScreen) return 500;
    if (isMediumScreen) return 600;
    return 650;
  };

  return (
    <View style={[styles.mainContainer, { backgroundColor: colors.background }]}>
      <ScrollView 
        style={styles.container} 
        scrollEnabled={!showRegistration && !showAgentRegistration}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section with Blue Gradient Overlay */}
        <View style={[styles.heroSection, { minHeight: getHeroMinHeight() }]}>
          <View style={StyleSheet.absoluteFillObject}>
            <Animated.Image
              source={carouselImages[0]}
              style={[styles.backgroundImage, { opacity: fadeAnim1 }]}
              resizeMode="cover"
            />
            <Animated.Image
              source={carouselImages[1]}
              style={[styles.backgroundImage, { opacity: fadeAnim2 }]}
              resizeMode="cover"
            />
            <Animated.Image
              source={carouselImages[2]}
              style={[styles.backgroundImage, { opacity: fadeAnim3 }]}
              resizeMode="cover"
            />
          </View>
          
          {/* Blue Gradient Overlay */}
          <LinearGradient
            colors={["rgba(10, 42, 102, 0.7)", "rgba(0, 74, 173, 0.6)", "rgba(10, 42, 102, 0.8)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientOverlay}
          />
          
          <View style={styles.heroContent}>
            <Text style={[styles.heroTitle, { fontSize: fontStyles.headingSize + 4, marginBottom: isSmallScreen ? 8 : 12 }]}>
              {t('home.hero.title')}
            </Text>
            <Text style={[styles.heroSubtitle, { fontSize: fontStyles.textSize, marginBottom: isSmallScreen ? 16 : 24 }]}>
              {t('home.hero.subtitle')}
            </Text>
            
            <Text style={[styles.selectorTitle, { fontSize: fontStyles.headingSize - 2, marginTop: isSmallScreen ? 10 : 20 }]}>
              {isServiceDisabled ? t('home.hero.exploreServices') : t('home.hero.whatService')}
            </Text>
            <Text style={[styles.selectorSubtitle, { fontSize: fontStyles.smallText }]}>
              {isServiceDisabled ? t('home.hero.learnAboutServices') : t('home.hero.tapToBook')}
            </Text>
            
            <View style={styles.serviceIconsContainer}>
              {/* Cook Service */}
              <View style={[styles.serviceSelectorContainer, { marginHorizontal: isSmallScreen ? 4 : 8 }]}>
                <TouchableOpacity
                  style={[
                    styles.serviceIconContainerRectangular,
                    { width: getServiceIconSize(), height: getServiceIconHeight() },
                    hoveredService === "COOK" && styles.serviceIconContainerRectangularHover,
                    isServiceDisabled && styles.disabledServiceContainer,
                  ]}
                  onPress={() => !isServiceDisabled && handleClick("COOK")}
                  onPressIn={() => setHoveredService("COOK")}
                  onPressOut={() => setHoveredService(null)}
                  disabled={isServiceDisabled}
                >
                  <Image source={cookImage} style={[styles.serviceImageRectangular, isServiceDisabled && styles.disabledService]} />
                  <LinearGradient
                    colors={["rgba(0,0,0,0.7)", "rgba(0,0,0,0.5)"]}
                    style={styles.serviceOverlay}
                  >
                    <Text style={[styles.serviceLabelRectangular, { fontSize: fontStyles.smallText }]}>{t('home.services.homeCook')}</Text>
                    {isServiceDisabled && <Text style={[styles.disabledText, { fontSize: fontStyles.smallText - 2 }]}>{t('home.hero.viewOnly')}</Text>}
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Maid Service */}
              <View style={[styles.serviceSelectorContainer, { marginHorizontal: isSmallScreen ? 4 : 8 }]}>
                <TouchableOpacity
                  style={[
                    styles.serviceIconContainerRectangular,
                    { width: getServiceIconSize(), height: getServiceIconHeight() },
                    hoveredService === "MAID" && styles.serviceIconContainerRectangularHover,
                    isServiceDisabled && styles.disabledServiceContainer,
                  ]}
                  onPress={() => !isServiceDisabled && handleClick("MAID")}
                  onPressIn={() => setHoveredService("MAID")}
                  onPressOut={() => setHoveredService(null)}
                  disabled={isServiceDisabled}
                >
                  <Image source={maidImage} style={[styles.serviceImageRectangular, isServiceDisabled && styles.disabledService]} />
                  <LinearGradient
                    colors={["rgba(0,0,0,0.7)", "rgba(0,0,0,0.5)"]}
                    style={styles.serviceOverlay}
                  >
                    <Text style={[styles.serviceLabelRectangular, { fontSize: fontStyles.smallText }]}>{t('home.services.cleaningHelp')}</Text>
                    {isServiceDisabled && <Text style={[styles.disabledText, { fontSize: fontStyles.smallText - 2 }]}>{t('home.hero.viewOnly')}</Text>}
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Nanny Service */}
              <View style={[styles.serviceSelectorContainer, { marginHorizontal: isSmallScreen ? 4 : 8 }]}>
                <TouchableOpacity
                  style={[
                    styles.serviceIconContainerRectangular,
                    { width: getServiceIconSize(), height: getServiceIconHeight() },
                    hoveredService === "NANNY" && styles.serviceIconContainerRectangularHover,
                    isServiceDisabled && styles.disabledServiceContainer,
                  ]}
                  onPress={() => !isServiceDisabled && handleClick("NANNY")}
                  onPressIn={() => setHoveredService("NANNY")}
                  onPressOut={() => setHoveredService(null)}
                  disabled={isServiceDisabled}
                >
                  <Image source={nannyImage} style={[styles.serviceImageRectangular, isServiceDisabled && styles.disabledService]} />
                  <LinearGradient
                    colors={["rgba(0,0,0,0.7)", "rgba(0,0,0,0.5)"]}
                    style={styles.serviceOverlay}
                  >
                    <Text style={[styles.serviceLabelRectangular, { fontSize: fontStyles.smallText }]}>{t('home.services.caregiver')}</Text>
                    {isServiceDisabled && <Text style={[styles.disabledText, { fontSize: fontStyles.smallText - 2 }]}>{t('home.hero.viewOnly')}</Text>}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          
          <View style={styles.heroIndicators}>
            {carouselImages.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.heroIndicator,
                  index === currentImageIndex && styles.heroIndicatorActive,
                ]}
              />
            ))}
          </View>
          
          {/* PROMOTIONAL SECTION - Now includes both FirstBookingOffer and BroadcastMessage */}
          <View style={styles.promotionalSection}>
            {showOffer && !isServiceDisabled && (
              <>
                <View style={styles.offerWrapper}>
                  <FirstBookingOffer onPress={handlePromotionalOfferPress} />
                </View>
                {/* Broadcast Message Component */}
                <View style={styles.broadcastWrapper}>
                  <BroadcastMessage onCouponApplied={handleCouponApplied} />
                </View>
              </>
            )}
          </View>
        </View>
        
        {/* Popular Services Section */}
        <View style={[styles.servicesSection, { backgroundColor: isDarkMode ? colors.surface : '#f8fafc' }]}>
          <View style={styles.sectionHeader}>
            <LinearGradient
              colors={["#0a2a66ff", "#004aadff"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.sectionTitleGradient}
            >
              <Text style={[styles.sectionTitle, { fontSize: fontStyles.headingSize }]}>
                {t('home.services.title')}
              </Text>
            </LinearGradient>
            <Text style={[styles.sectionSubtitle, { color: isDarkMode ? colors.textSecondary : '#64748b', fontSize: fontStyles.smallText }]}>
              {t('home.services.subtitle')}
            </Text>
          </View>
          
          <View style={styles.servicesCarouselContainer}>
            <Animated.View
              style={[
                styles.serviceCarouselSlide,
                { opacity: serviceFadeAnim, transform: [{ translateX: serviceSlideAnim }] },
              ]}
            >
              <TouchableOpacity 
                style={[styles.serviceCard, isServiceDisabled && styles.disabledServiceCard]}
                onPress={() => handleLearnMore(popularServices[currentServiceIndex].title)}
                onPressIn={() => handleCardPressIn(currentServiceIndex)}
                onPressOut={() => handleCardPressOut(currentServiceIndex)}
                activeOpacity={0.95}
              >
                <LinearGradient
                  colors={popularServices[currentServiceIndex].gradient}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={styles.serviceCardGradient}
                >
                  <View style={[styles.serviceCardContent, { padding: isSmallScreen ? 20 : 28 }]}>
                    <View style={[styles.serviceIconContainer, { width: isSmallScreen ? 60 : 80, height: isSmallScreen ? 60 : 80, borderRadius: isSmallScreen ? 30 : 40, marginBottom: isSmallScreen ? 8 : 12 }]}>
                      <Text style={[styles.serviceIcon, { fontSize: isSmallScreen ? 28 : 36 }]}>{popularServices[currentServiceIndex].icon}</Text>
                    </View>
                    
                    <Text style={[styles.serviceTitle, { fontSize: fontStyles.headingSize - 2 }]}>
                      {t(`home.services.${popularServices[currentServiceIndex].titleKey}`)}
                    </Text>
                    <Text style={[styles.serviceDesc, { fontSize: fontStyles.smallText }]}>
                      {t(`home.services.${popularServices[currentServiceIndex].descKey}`)}
                    </Text>
                    
                    <View style={[styles.featuresContainer, { gap: isSmallScreen ? 6 : 8 }]}>
                      {popularServices[currentServiceIndex].features.map((feature, idx) => (
                        <View key={idx} style={[styles.featureBadge, { paddingHorizontal: isSmallScreen ? 8 : 12, paddingVertical: isSmallScreen ? 4 : 5 }]}>
                          <Text style={[styles.featureBadgeText, { fontSize: fontStyles.smallText - 2 }]}>
                            ✓ {t(`home.services.features.${feature.key}`)}
                          </Text>
                        </View>
                      ))}
                    </View>
                    
                    <View style={[styles.learnMoreContainer, { marginTop: isSmallScreen ? 12 : 16, paddingVertical: isSmallScreen ? 8 : 10, paddingHorizontal: isSmallScreen ? 20 : 24 }]}>
                      <Text style={[styles.learnMoreLink, { fontSize: fontStyles.smallText }]}>{t('home.services.learnMore')}</Text>
                      <Text style={styles.learnMoreArrow}>→</Text>
                    </View>

                    <View style={[styles.decorativeCircle, { width: isSmallScreen ? 100 : 150, height: isSmallScreen ? 100 : 150, top: isSmallScreen ? -20 : -30, right: isSmallScreen ? -20 : -30 }]} />
                    <View style={[styles.decorativeCircle2, { width: isSmallScreen ? 150 : 200, height: isSmallScreen ? 150 : 200, bottom: isSmallScreen ? -30 : -40, left: isSmallScreen ? -30 : -40 }]} />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            <View style={[styles.serviceDotsContainer, { marginTop: isSmallScreen ? 15 : 20, gap: isSmallScreen ? 8 : 12 }]}>
              {popularServices.map((_, index) => {
                const dotScale = index === currentServiceIndex ? 1.3 : 1;
                const dotWidth = index === currentServiceIndex ? (isSmallScreen ? 20 : 24) : (isSmallScreen ? 8 : 10);
                return (
                  <TouchableOpacity key={index} onPress={() => goToServiceSlide(index)} activeOpacity={0.8}>
                    <LinearGradient
                      colors={index === currentServiceIndex ? popularServices[index].gradient : [colors.disabled, colors.border]}
                      start={{x: 0, y: 0}}
                      end={{x: 1, y: 0}}
                      style={[styles.serviceDot, { width: dotWidth, height: isSmallScreen ? 8 : 10, transform: [{ scale: dotScale }], opacity: index === currentServiceIndex ? 1 : 0.5 }]}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.serviceNavigationArrows}>
              <TouchableOpacity style={[styles.serviceNavArrow, { backgroundColor: colors.surface, width: isSmallScreen ? 35 : 40, height: isSmallScreen ? 35 : 40, borderRadius: isSmallScreen ? 17.5 : 20 }]} onPress={() => goToServiceSlide(currentServiceIndex === 0 ? popularServices.length - 1 : currentServiceIndex - 1)}>
                <Text style={[styles.serviceNavArrowText, { color: colors.text, fontSize: isSmallScreen ? 18 : 20 }]}>←</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.serviceNavArrow, { backgroundColor: colors.surface, width: isSmallScreen ? 35 : 40, height: isSmallScreen ? 35 : 40, borderRadius: isSmallScreen ? 17.5 : 20 }]} onPress={() => goToServiceSlide((currentServiceIndex + 1) % popularServices.length)}>
                <Text style={[styles.serviceNavArrowText, { color: colors.text, fontSize: isSmallScreen ? 18 : 20 }]}>→</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* How it works section */}
        <View style={[styles.howItWorksSection, { backgroundColor: isDarkMode ? colors.background : '#ffffff' }]}>
          <View style={styles.sectionHeader}>
            <LinearGradient
              colors={["#0a2a66ff", "#004aadff"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.sectionTitleGradient}
            >
              <Text style={[styles.sectionTitle, { fontSize: fontStyles.headingSize }]}>
                {t('home.howItWorks.title')}
              </Text>
            </LinearGradient>
            <Text style={[styles.sectionSubtitle, { color: isDarkMode ? colors.textSecondary : '#64748b', fontSize: fontStyles.smallText }]}>
              {t('home.howItWorks.subtitle')}
            </Text>
          </View>
          
          <View style={styles.howItWorksCarouselContainer}>
            <Animated.View
              style={[
                styles.howItWorksCarouselSlide,
                { opacity: howItWorksFadeAnim, transform: [{ translateX: howItWorksSlideAnim }] },
              ]}
            >
              <LinearGradient
                colors={howItWorksSlides[currentSlide].gradientColors}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.gradientContainer}
              >
                <View style={styles.glowEffect} />
                <View style={styles.particleContainer}>
                  <Text style={styles.particle}>✦</Text>
                  <Text style={styles.particle2}>✧</Text>
                  <Text style={styles.particle3}>✦</Text>
                </View>
                
                <View style={[styles.illustrationContainer, { backgroundColor: howItWorksSlides[currentSlide].accentColor, width: isSmallScreen ? 40 : 50, height: isSmallScreen ? 40 : 50, borderRadius: isSmallScreen ? 20 : 25 }]}>
                  <Text style={[styles.illustrationIcon, { fontSize: isSmallScreen ? 22 : 28 }]}>{howItWorksSlides[currentSlide].illustration}</Text>
                </View>
                
                <View style={[styles.iconWrapper, { marginBottom: isSmallScreen ? 12 : 16 }]}>
                  <View style={[styles.iconContainer, { width: isSmallScreen ? 70 : 90, height: isSmallScreen ? 70 : 90, borderRadius: isSmallScreen ? 35 : 45 }]}>
                    <Text style={[styles.stepIcon, { fontSize: isSmallScreen ? 32 : 40 }]}>{howItWorksSlides[currentSlide].icon}</Text>
                  </View>
                </View>
                
                <Text style={[styles.stepTitle, { fontSize: fontStyles.headingSize, marginBottom: isSmallScreen ? 8 : 12 }]}>
                  {t(`home.howItWorks.step${currentSlide + 1}.title`)}
                </Text>
                <Text style={[styles.stepDesc, { fontSize: fontStyles.textSize, paddingHorizontal: isSmallScreen ? 10 : 20, marginBottom: isSmallScreen ? 15 : 20 }]}>
                  {t(`home.howItWorks.step${currentSlide + 1}.desc`)}
                </Text>

                <View style={[styles.slideFeaturesContainer, { gap: isSmallScreen ? 6 : 10 }]}>
                  {howItWorksSlides[currentSlide].features.map((feature, idx) => (
                    <View key={idx} style={[styles.slideFeatureBadge, { paddingHorizontal: isSmallScreen ? 12 : 16, paddingVertical: isSmallScreen ? 4 : 6, borderColor: howItWorksSlides[currentSlide].accentColor }]}>
                      <Text style={[styles.slideFeatureBadgeText, { fontSize: fontStyles.smallText - 1 }]}>
                        ✓ {t(`home.howItWorks.step${currentSlide + 1}.features.${idx}`)}
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={[styles.slideProgress, { bottom: isSmallScreen ? 15 : 20, right: isSmallScreen ? 15 : 20, paddingHorizontal: isSmallScreen ? 8 : 12, paddingVertical: isSmallScreen ? 4 : 6, borderRadius: isSmallScreen ? 15 : 20 }]}>
                  <Text style={[styles.slideProgressText, { fontSize: fontStyles.smallText - 2 }]}>
                    {currentSlide + 1} / {howItWorksSlides.length}
                  </Text>
                </View>
              </LinearGradient>
            </Animated.View>

            <View style={[styles.howItWorksDotsContainer, { marginTop: isSmallScreen ? 15 : 20, gap: isSmallScreen ? 8 : 12 }]}>
              {howItWorksSlides.map((_, index) => {
                const dotScale = index === currentSlide ? 1.3 : 1;
                const dotWidth = index === currentSlide ? (isSmallScreen ? 20 : 24) : (isSmallScreen ? 8 : 10);
                return (
                  <TouchableOpacity key={index} onPress={() => goToHowItWorksSlide(index)} activeOpacity={0.8}>
                    <LinearGradient
                      colors={index === currentSlide ? howItWorksSlides[index].gradientColors : [colors.disabled, colors.border]}
                      start={{x: 0, y: 0}}
                      end={{x: 1, y: 0}}
                      style={[styles.howItWorksDot, { width: dotWidth, height: isSmallScreen ? 8 : 10, transform: [{ scale: dotScale }], opacity: index === currentSlide ? 1 : 0.5 }]}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.howItWorksNavigationArrows}>
              <TouchableOpacity style={[styles.howItWorksNavArrow, { backgroundColor: colors.surface, width: isSmallScreen ? 35 : 40, height: isSmallScreen ? 35 : 40, borderRadius: isSmallScreen ? 17.5 : 20 }]} onPress={() => goToHowItWorksSlide(currentSlide === 0 ? howItWorksSlides.length - 1 : currentSlide - 1)}>
                <Text style={[styles.howItWorksNavArrowText, { color: colors.text, fontSize: isSmallScreen ? 18 : 20 }]}>←</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.howItWorksNavArrow, { backgroundColor: colors.surface, width: isSmallScreen ? 35 : 40, height: isSmallScreen ? 35 : 40, borderRadius: isSmallScreen ? 17.5 : 20 }]} onPress={() => goToHowItWorksSlide((currentSlide + 1) % howItWorksSlides.length)}>
                <Text style={[styles.howItWorksNavArrowText, { color: colors.text, fontSize: isSmallScreen ? 18 : 20 }]}>→</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        {/* Booking Dialog */}
        {!isServiceDisabled && (
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
        )}

        {/* Service Dialogs */}
        {showCookDialog && (
          <View style={[styles.dialogOverlay, { backgroundColor: colors.overlay }]}>
            <View style={[styles.dialogBox, { backgroundColor: colors.surface, width: screenWidth * 0.92, maxHeight: screenHeight * 0.85 }]}>
              <DemoCook onClose={() => setShowCookDialog(false)} sendDataToParent={sendDataToParent} />
            </View>
          </View>
        )}

        {showNannyServicesDialog && (
          <View style={[styles.dialogOverlay, { backgroundColor: colors.overlay }]}>
            <View style={[styles.dialogBox, { backgroundColor: colors.surface, width: screenWidth * 0.92, maxHeight: screenHeight * 0.85 }]}>
              <NannyServicesDialog
                open={showNannyServicesDialog}
                handleClose={() => setShowNannyServicesDialog(false)}
                sendDataToParent={sendDataToParent}
                bookingType={{
                  start_date: startDate ? new Date(startDate).toISOString().split("T")[0] : "",
                  start_time: startTime ? new Date(startTime).toTimeString().slice(0, 5) : "",
                  end_date: endDate ? new Date(endDate).toISOString().split("T")[0] : startDate ? new Date(startDate).toISOString().split("T")[0] : "",
                  end_time: endTime ? new Date(endTime).toTimeString().slice(0, 5) : "",
                  timeRange: startTime ? `${new Date(startTime).toTimeString().slice(0, 5)}` : "",
                  bookingPreference: selectedRadioButtonValue,
                  housekeepingRole: selectedType,
                }}
              />
            </View>
          </View>
        )}

        {showMaidServiceDialog && (
          <View style={[styles.dialogOverlay, { backgroundColor: colors.overlay }]}>
            <View style={[styles.dialogBox, { backgroundColor: colors.surface, width: screenWidth * 0.92, maxHeight: screenHeight * 0.85 }]}>
              <MaidServiceDialog
                open={showMaidServiceDialog}
                handleClose={() => setShowMaidServiceDialog(false)}
                sendDataToParent={sendDataToParent}
                bookingType={{
                  start_date: startDate ? new Date(startDate).toISOString().split("T")[0] : "",
                  start_time: startTime ? new Date(startTime).toTimeString().slice(0, 5) : "",
                  end_date: endDate ? new Date(endDate).toISOString().split("T")[0] : startDate ? new Date(startDate).toISOString().split("T")[0] : "",
                  end_time: endTime ? new Date(endTime).toTimeString().slice(0, 5) : "",
                  timeRange: startTime ? `${new Date(startTime).toTimeString().slice(0, 5)}` : "",
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

      {/* Service Selection Dialog for Promotional Offer */}
      <ServiceSelectionDialog
        visible={showServiceSelection}
        onClose={() => setShowServiceSelection(false)}
        onSelectService={handleServiceSelectedFromOffer}
      />

      {/* Agent Registration Modal */}
      <Modal visible={showAgentRegistration} animationType="slide">
        <AgentRegistrationForm onBackToLogin={() => setShowAgentRegistration(false)} />
      </Modal>

      {/* Service Provider Registration */}
      {showRegistration && (
        <ServiceProviderRegistration onBackToLogin={() => setShowRegistration(false)} />
      )}
    </View>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroSection: {
    position: 'relative',
    overflow: 'hidden',
    paddingTop: 20,
    marginBottom: -30,
    zIndex: 1,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  heroContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 30,
    zIndex: 2,
  },
  heroTitle: {
    fontWeight: "bold",
    textAlign: "center",
    color: "#ffffff",
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  heroSubtitle: {
    color: "#ffffff",
    textAlign: "center",
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    lineHeight: 22,
    fontWeight: '500',
  },
  selectorTitle: {
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    letterSpacing: 0.5,
  },
  selectorSubtitle: {
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    fontWeight: '500',
  },
  serviceIconsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  serviceSelectorContainer: {
    alignItems: 'center',
    flex: 1,
  },
  heroIndicators: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    zIndex: 3,
  },
  heroIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  heroIndicatorActive: {
    width: 20,
    backgroundColor: '#fff',
  },
  promotionalSection: {
    marginTop: 20,
    marginBottom: 10,
    paddingHorizontal: 16,
    zIndex: 5,
    paddingBottom: 10,
  },
  offerWrapper: {
    marginBottom: 8,
  },
  broadcastWrapper: {
    marginTop: 4,
    marginBottom: 4,
  },
  servicesSection: {
    padding: 20,
    paddingTop: 30,
    paddingBottom: 40,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginTop: 10,
    zIndex: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  sectionHeader: {
    marginBottom: 30,
    alignItems: 'center',
  },
  sectionTitleGradient: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 25,
    marginBottom: 8,
  },
  sectionTitle: {
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: -0.5,
    color: '#fff',
  },
  sectionSubtitle: {
    textAlign: "center",
    marginTop: 8,
  },
  servicesCarouselContainer: {
    height: 520,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  serviceCarouselSlide: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  serviceCard: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
  },
  disabledServiceCard: {
    opacity: 0.9,
  },
  serviceCardGradient: {
    borderRadius: 24,
    padding: 0,
  },
  serviceCardContent: {
    alignItems: "center",
    gap: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  serviceIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  serviceIcon: {
    fontWeight: '600',
  },
  serviceTitle: {
    fontWeight: "700",
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    letterSpacing: -0.3,
  },
  serviceDesc: {
    color: "rgba(255, 255, 255, 0.95)",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginVertical: 10,
  },
  featureBadge: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  featureBadgeText: {
    color: '#fff',
    fontWeight: '500',
  },
  learnMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  learnMoreLink: {
    color: "#fff",
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  learnMoreArrow: {
    fontSize: 18,
    color: "#fff",
    fontWeight: 'bold',
  },
  decorativeCircle: {
    position: 'absolute',
    borderRadius: 75,
    opacity: 0.5,
  },
  decorativeCircle2: {
    position: 'absolute',
    borderRadius: 100,
    opacity: 0.3,
  },
  serviceDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceDot: {
    borderRadius: 5,
    marginHorizontal: 0,
  },
  serviceNavigationArrows: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    paddingHorizontal: 10,
    transform: [{ translateY: -20 }],
  },
  serviceNavArrow: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  serviceNavArrowText: {
    fontWeight: 'bold',
  },
  howItWorksSection: {
    padding: 20,
    paddingVertical: 40,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginTop: -30,
    zIndex: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  howItWorksCarouselContainer: {
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  howItWorksCarouselSlide: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  gradientContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    borderRadius: 32,
    width: '100%',
    minHeight: 350,
    position: 'relative',
    overflow: 'hidden',
  },
  glowEffect: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  particleContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    bottom: 20,
  },
  particle: {
    position: 'absolute',
    top: 20,
    right: 30,
    fontSize: 24,
    color: 'rgba(255,255,255,0.15)',
    transform: [{ rotate: '15deg' }],
  },
  particle2: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    fontSize: 32,
    color: 'rgba(255,255,255,0.1)',
    transform: [{ rotate: '-10deg' }],
  },
  particle3: {
    position: 'absolute',
    top: 100,
    left: 40,
    fontSize: 20,
    color: 'rgba(255,255,255,0.12)',
    transform: [{ rotate: '45deg' }],
  },
  illustrationContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  illustrationIcon: {},
  iconWrapper: {
    transform: [{ scale: 1.1 }],
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  stepIcon: {
    fontWeight: '300',
  },
  stepTitle: {
    fontWeight: "700",
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: -0.3,
  },
  stepDesc: {
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    lineHeight: 22,
  },
  slideFeaturesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 15,
  },
  slideFeatureBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    borderWidth: 1,
  },
  slideFeatureBadgeText: {
    color: '#fff',
    fontWeight: '600',
  },
  slideProgress: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  slideProgressText: {
    color: '#fff',
    fontWeight: '600',
  },
  howItWorksDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  howItWorksDot: {
    borderRadius: 5,
    marginHorizontal: 0,
  },
  howItWorksNavigationArrows: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    paddingHorizontal: 10,
    transform: [{ translateY: -20 }],
  },
  howItWorksNavArrow: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  howItWorksNavArrowText: {
    fontWeight: 'bold',
  },
  dialogOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  dialogBox: {
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 15,
  },
  serviceIconContainerRectangular: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
    position: 'relative',
  },
  serviceIconContainerRectangularHover: {
    transform: [{ scale: 1.05 }],
    shadowColor: "#004aad",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
    borderColor: "#ffffff",
    borderWidth: 2,
  },
  disabledServiceContainer: {
    opacity: 0.8,
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
    padding: 10,
    alignItems: 'center',
  },
  serviceLabelRectangular: {
    color: '#fff',
    fontWeight: '600',
  },
  disabledService: {
    opacity: 0.7,
  },
  disabledText: {
    color: '#ffd700',
    marginTop: 3,
    fontWeight: '500',
  },
});

export default HomePage;