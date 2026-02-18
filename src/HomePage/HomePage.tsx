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
  TextStyle,
  ViewStyle,
  ImageStyle,
  Animated,
  Dimensions,
} from "react-native";
import { useDispatch } from "react-redux";
import { add } from "../features/bookingTypeSlice";
import { DETAILS } from "../Constants/pagesConstants";
import DateTimePicker from "@react-native-community/datetimepicker";
import RadioButton from '../common/RadioButton';
import ServiceProviderRegistration from '../Registration/ServiceProviderRegistration';
import ServiceDetailsDialog from './ServiceDetailsDialog';
import MaidServiceDialog from "../ServiceDialogs/MaidServiceDialog";
import DemoCook from "../ServiceDialogs/CookServiceDialog";
import NannyServicesDialog from "../ServiceDialogs/NannyServiceDialog";
import LinearGradient from 'react-native-linear-gradient';
import AgentRegistrationForm from '../AgentRegistration/AgentRegistrationForm';
import { useAuth0 } from 'react-native-auth0';
import BookingDialog from '../BookingDialog/BookingDialog';

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
    desc: "Skilled and hygienic cooks who specialize in home-style meals with authentic flavors.",
    icon: "👩‍🍳",
    features: ["Professional chefs", "Hygiene certified", "Custom menus"],
    gradient: ['#0f2027', '#203a43', '#2c5364'],
    accentColor: '#ff6b6b',
    iconBg: '#ffe5e5',
  },
  {
    id: 2,
    title: "Cleaning Help",
    desc: "Reliable maids for daily, deep, or special occasion cleaning with attention to detail.",
    icon: "🧹",
    features: ["Deep cleaning", "Eco-friendly", "Scheduled visits"],
    gradient: ['#0b3b5c', '#1c5985', '#2a7a9e'],
    accentColor: '#4ecdc4',
    iconBg: '#e0f7fa',
  },
  {
    id: 3,
    title: "Caregiver",
    desc: "Trained support for children, seniors, or patients at home with compassionate care.",
    icon: "👶",
    features: ["CPR certified", "Background checked", "24/7 support"],
    gradient: ['#42275a', '#734b6d', '#b4869f'],
    accentColor: '#f8b195',
    iconBg: '#fff0e5',
  },
];

// Define slides with dark color themes
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
  const [currentServiceIndex, setCurrentServiceIndex] = useState(0);
  
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
  const { user: auth0User, authorize, clearSession } = useAuth0();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  // Carousel images array
  const carouselImages = [heroImage1, heroImage2, heroImage3];

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
  
  // Smooth carousel with crossfade animation for hero section
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    const startCarousel = () => {
      interval = setInterval(() => {
        const nextIndex = (currentImageIndex + 1) % carouselImages.length;
        
        if (currentImageIndex === 0 && nextIndex === 1) {
          Animated.parallel([
            Animated.timing(fadeAnim1, {
              toValue: 0,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(fadeAnim2, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: true,
            }),
          ]).start(() => {
            setCurrentImageIndex(nextIndex);
            fadeAnim1.setValue(0);
            fadeAnim2.setValue(1);
            fadeAnim3.setValue(0);
          });
        } else if (currentImageIndex === 1 && nextIndex === 2) {
          Animated.parallel([
            Animated.timing(fadeAnim2, {
              toValue: 0,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(fadeAnim3, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: true,
            }),
          ]).start(() => {
            setCurrentImageIndex(nextIndex);
            fadeAnim1.setValue(0);
            fadeAnim2.setValue(0);
            fadeAnim3.setValue(1);
          });
        } else if (currentImageIndex === 2 && nextIndex === 0) {
          Animated.parallel([
            Animated.timing(fadeAnim3, {
              toValue: 0,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(fadeAnim1, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: true,
            }),
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
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [currentImageIndex]);

  // Services carousel with smooth transitions
  useEffect(() => {
    let serviceInterval: NodeJS.Timeout;
    
    const startServiceCarousel = () => {
      serviceInterval = setInterval(() => {
        const nextIndex = (currentServiceIndex + 1) % popularServices.length;
        
        // Animate out current service
        Animated.parallel([
          Animated.timing(serviceFadeAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(serviceSlideAnim, {
            toValue: -50,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Change to next service
          setCurrentServiceIndex(nextIndex);
          
          // Reset position and animate in new service
          serviceSlideAnim.setValue(50);
          Animated.parallel([
            Animated.timing(serviceFadeAnim, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(serviceSlideAnim, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }),
          ]).start();
        });
      }, 5000);
    };
    
    startServiceCarousel();
    
    return () => {
      if (serviceInterval) {
        clearInterval(serviceInterval);
      }
    };
  }, [currentServiceIndex]);

  // How It Works carousel with smooth transitions (matching popular services)
  useEffect(() => {
    let howItWorksInterval: NodeJS.Timeout;
    
    const startHowItWorksCarousel = () => {
      howItWorksInterval = setInterval(() => {
        const nextIndex = (currentSlide + 1) % howItWorksSlides.length;
        
        // Animate out current slide
        Animated.parallel([
          Animated.timing(howItWorksFadeAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(howItWorksSlideAnim, {
            toValue: -50,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Change to next slide
          setCurrentSlide(nextIndex);
          
          // Reset position and animate in new slide
          howItWorksSlideAnim.setValue(50);
          Animated.parallel([
            Animated.timing(howItWorksFadeAnim, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(howItWorksSlideAnim, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }),
          ]).start();
        });
      }, 5000);
    };
    
    startHowItWorksCarousel();
    
    return () => {
      if (howItWorksInterval) {
        clearInterval(howItWorksInterval);
      }
    };
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
          
          if (period === 'PM' && hours < 12) {
            hours += 12;
          } else if (period === 'AM' && hours === 12) {
            hours = 0;
          }
          
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
      end_time: formatTime(bookingDetails.endTime),
      timeRange:
        bookingDetails.startTime && bookingDetails.endTime
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

  // Animation for service cards
  const scaleAnimations = useRef([
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1)
  ]).current;

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

  // Navigate to specific service slide
  const goToServiceSlide = (index: number) => {
    if (index === currentServiceIndex) return;
    
    const direction = index > currentServiceIndex ? -50 : 50;
    
    Animated.parallel([
      Animated.timing(serviceFadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(serviceSlideAnim, {
        toValue: direction,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentServiceIndex(index);
      serviceSlideAnim.setValue(direction * -1);
      Animated.parallel([
        Animated.timing(serviceFadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(serviceSlideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  // Navigate to specific how it works slide
  const goToHowItWorksSlide = (index: number) => {
    if (index === currentSlide) return;
    
    const direction = index > currentSlide ? -50 : 50;
    
    Animated.parallel([
      Animated.timing(howItWorksFadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(howItWorksSlideAnim, {
        toValue: direction,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentSlide(index);
      howItWorksSlideAnim.setValue(direction * -1);
      Animated.parallel([
        Animated.timing(howItWorksFadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(howItWorksSlideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  return (
    <View style={styles.mainContainer}>
      {/* Main Home Page Content */}
      <ScrollView 
        style={styles.container} 
        scrollEnabled={!showRegistration && !showAgentRegistration}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Section with Background Carousel */}
        <View style={styles.heroSection}>
          {/* Background Carousel Images with Smooth Crossfade */}
          <View style={StyleSheet.absoluteFillObject}>
            {/* Image 1 */}
            <Animated.Image
              source={carouselImages[0]}
              style={[
                styles.backgroundImage,
                {
                  opacity: fadeAnim1,
                }
              ]}
              resizeMode="cover"
            />
            
            {/* Image 2 */}
            <Animated.Image
              source={carouselImages[1]}
              style={[
                styles.backgroundImage,
                {
                  opacity: fadeAnim2,
                }
              ]}
              resizeMode="cover"
            />
            
            {/* Image 3 */}
            <Animated.Image
              source={carouselImages[2]}
              style={[
                styles.backgroundImage,
                {
                  opacity: fadeAnim3,
                }
              ]}
              resizeMode="cover"
            />
          </View>
          
          {/* Dark Overlay for better text readability */}
          <View style={styles.overlay} />
          
          {/* Hero Content */}
          <View style={styles.heroContent}>
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
          
          {/* Carousel Indicators */}
          <View style={styles.heroIndicators}>
            {carouselImages.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.heroIndicator,
                  index === currentImageIndex && styles.heroIndicatorActive
                ]}
              />
            ))}
          </View>
        </View>
        
        {/* Services Section - Enhanced Professional Design with Carousel */}
        <View style={styles.servicesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular Services</Text>
            <Text style={styles.sectionSubtitle}>Choose from our trusted professional services</Text>
          </View>
          
          <View style={styles.servicesCarouselContainer}>
            <Animated.View
              style={[
                styles.serviceCarouselSlide,
                {
                  opacity: serviceFadeAnim,
                  transform: [{ translateX: serviceSlideAnim }],
                },
              ]}
            >
              <TouchableOpacity 
                style={styles.serviceCard}
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
                  <View style={styles.serviceCardContent}>
                    <View style={[styles.serviceIconContainer, { backgroundColor: popularServices[currentServiceIndex].iconBg }]}>
                      <Text style={styles.serviceIcon}>{popularServices[currentServiceIndex].icon}</Text>
                    </View>
                    
                    <Text style={styles.serviceTitle}>{popularServices[currentServiceIndex].title}</Text>
                    <Text style={styles.serviceDesc}>{popularServices[currentServiceIndex].desc}</Text>
                    
                    <View style={styles.featuresContainer}>
                      {popularServices[currentServiceIndex].features.map((feature, idx) => (
                        <View key={idx} style={styles.featureBadge}>
                          <Text style={styles.featureBadgeText}>✓ {feature}</Text>
                        </View>
                      ))}
                    </View>
                    
                    <View style={[styles.learnMoreContainer, { backgroundColor: popularServices[currentServiceIndex].accentColor }]}>
                      <Text style={styles.learnMoreLink}>Learn More</Text>
                      <Text style={styles.learnMoreArrow}>→</Text>
                    </View>

                    {/* Decorative elements */}
                    <View style={[styles.decorativeCircle, { backgroundColor: 'rgba(255,255,255,0.1)' }]} />
                    <View style={[styles.decorativeCircle2, { backgroundColor: 'rgba(255,255,255,0.05)' }]} />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* Service Carousel Indicators */}
            <View style={styles.serviceDotsContainer}>
              {popularServices.map((_, index) => {
                const dotScale = index === currentServiceIndex ? 1.3 : 1;
                const dotWidth = index === currentServiceIndex ? 24 : 10;
                
                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => goToServiceSlide(index)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={index === currentServiceIndex 
                        ? popularServices[index].gradient 
                        : ['#4a5568', '#2d3748']}
                      start={{x: 0, y: 0}}
                      end={{x: 1, y: 0}}
                      style={[
                        styles.serviceDot,
                        {
                          width: dotWidth,
                          transform: [{ scale: dotScale }],
                          opacity: index === currentServiceIndex ? 1 : 0.5,
                        }
                      ]}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Service Navigation Arrows */}
            <View style={styles.serviceNavigationArrows}>
              <TouchableOpacity 
                style={styles.serviceNavArrow}
                onPress={() => {
                  const prevIndex = currentServiceIndex === 0 ? popularServices.length - 1 : currentServiceIndex - 1;
                  goToServiceSlide(prevIndex);
                }}
              >
                <Text style={styles.serviceNavArrowText}>←</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.serviceNavArrow}
                onPress={() => {
                  const nextIndex = (currentServiceIndex + 1) % popularServices.length;
                  goToServiceSlide(nextIndex);
                }}
              >
                <Text style={styles.serviceNavArrowText}>→</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* How it works - Now with same carousel style as Popular Services */}
        <View style={styles.howItWorksSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>How It Works</Text>
            <Text style={styles.sectionSubtitle}>Simple steps to premium service</Text>
          </View>
          
          <View style={styles.howItWorksCarouselContainer}>
            <Animated.View
              style={[
                styles.howItWorksCarouselSlide,
                {
                  opacity: howItWorksFadeAnim,
                  transform: [{ translateX: howItWorksSlideAnim }],
                },
              ]}
            >
              <LinearGradient
                colors={howItWorksSlides[currentSlide].gradientColors}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.gradientContainer}
              >
                {/* Decorative Elements */}
                <View style={styles.glowEffect} />
                <View style={styles.particleContainer}>
                  <Text style={styles.particle}>✦</Text>
                  <Text style={styles.particle2}>✧</Text>
                  <Text style={styles.particle3}>✦</Text>
                </View>
                
                <View style={[styles.illustrationContainer, { backgroundColor: howItWorksSlides[currentSlide].accentColor }]}>
                  <Text style={styles.illustrationIcon}>
                    {howItWorksSlides[currentSlide].illustration}
                  </Text>
                </View>
                
                <View style={styles.iconWrapper}>
                  <View style={[styles.iconContainer, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                    <Text style={[styles.stepIcon, { color: '#fff' }]}>
                      {howItWorksSlides[currentSlide].icon}
                    </Text>
                  </View>
                </View>
                
                <Text style={styles.stepTitle}>
                  {howItWorksSlides[currentSlide].title}
                </Text>
                <Text style={styles.stepDesc}>
                  {howItWorksSlides[currentSlide].desc}
                </Text>

                {/* Feature Badges */}
                <View style={styles.slideFeaturesContainer}>
                  {howItWorksSlides[currentSlide].features.map((feature, idx) => (
                    <View key={idx} style={[styles.slideFeatureBadge, { borderColor: howItWorksSlides[currentSlide].accentColor }]}>
                      <Text style={styles.slideFeatureBadgeText}>✓ {feature}</Text>
                    </View>
                  ))}
                </View>

                {/* Progress Indicator */}
                <View style={[styles.slideProgress, { backgroundColor: howItWorksSlides[currentSlide].accentColor }]}>
                  <Text style={styles.slideProgressText}>
                    {currentSlide + 1} / {howItWorksSlides.length}
                  </Text>
                </View>
              </LinearGradient>
            </Animated.View>

            {/* How It Works Carousel Indicators */}
            <View style={styles.howItWorksDotsContainer}>
              {howItWorksSlides.map((_, index) => {
                const dotScale = index === currentSlide ? 1.3 : 1;
                const dotWidth = index === currentSlide ? 24 : 10;
                
                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => goToHowItWorksSlide(index)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={index === currentSlide 
                        ? howItWorksSlides[index].gradientColors 
                        : ['#4a5568', '#2d3748']}
                      start={{x: 0, y: 0}}
                      end={{x: 1, y: 0}}
                      style={[
                        styles.howItWorksDot,
                        {
                          width: dotWidth,
                          transform: [{ scale: dotScale }],
                          opacity: index === currentSlide ? 1 : 0.5,
                        }
                      ]}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* How It Works Navigation Arrows */}
            <View style={styles.howItWorksNavigationArrows}>
              <TouchableOpacity 
                style={styles.howItWorksNavArrow}
                onPress={() => {
                  const prevIndex = currentSlide === 0 ? howItWorksSlides.length - 1 : currentSlide - 1;
                  goToHowItWorksSlide(prevIndex);
                }}
              >
                <Text style={styles.howItWorksNavArrowText}>←</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.howItWorksNavArrow}
                onPress={() => {
                  const nextIndex = (currentSlide + 1) % howItWorksSlides.length;
                  goToHowItWorksSlide(nextIndex);
                }}
              >
                <Text style={styles.howItWorksNavArrowText}>→</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
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
  scrollContent: {
    flexGrow: 1,
  },
  heroSection: {
    minHeight: 600,
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 42, 102, 0.5)',
  },
  heroContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 30,
    zIndex: 2,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
    color: "#ffffff",
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  heroSubtitle: {
    fontSize: 16,
    color: "#ffffff",
    marginBottom: 24,
    textAlign: "center",
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    lineHeight: 22,
  },
  selectorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  selectorSubtitle: {
    fontSize: 15,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  serviceIconsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  serviceSelectorContainer: {
    alignItems: 'center',
    marginHorizontal: 8,
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
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  heroIndicatorActive: {
    backgroundColor: '#fff',
    width: 20,
  },
  servicesSection: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 40,
    backgroundColor: '#f8fafc',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginTop: -40,
    zIndex: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  sectionHeader: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    color: '#1a2b4c',
    letterSpacing: -0.5,
  },
  sectionSubtitle: {
    fontSize: 15,
    color: '#64748b',
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
  serviceCardGradient: {
    borderRadius: 24,
    padding: 0,
  },
  serviceCardContent: {
    alignItems: "center",
    padding: 28,
    gap: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  serviceIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
    fontSize: 36,
  },
  serviceTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    letterSpacing: -0.3,
  },
  serviceDesc: {
    fontSize: 14,
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
    gap: 8,
    marginVertical: 10,
  },
  featureBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  featureBadgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  learnMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  learnMoreLink: {
    fontSize: 15,
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
    top: -30,
    right: -30,
    width: 150,
    height: 150,
    borderRadius: 75,
    opacity: 0.5,
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -40,
    left: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.3,
  },
  serviceDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 12,
  },
  serviceDot: {
    height: 10,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  serviceNavArrowText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a2b4c',
  },
  
  // How It Works Section - Now with carousel style matching Popular Services
  howItWorksSection: {
    backgroundColor: "#ffffff",
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
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  illustrationIcon: {
    fontSize: 28,
  },
  iconWrapper: {
    marginBottom: 16,
    transform: [{ scale: 1.1 }],
  },
  iconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
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
    fontSize: 40,
    fontWeight: '300',
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: -0.3,
  },
  stepDesc: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    paddingHorizontal: 20,
    lineHeight: 22,
    marginBottom: 20,
  },
  slideFeaturesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 10,
    marginBottom: 15,
  },
  slideFeatureBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 25,
    borderWidth: 1,
  },
  slideFeatureBadgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  slideProgress: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  slideProgressText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  howItWorksDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 12,
  },
  howItWorksDot: {
    height: 10,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  howItWorksNavArrowText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a2b4c',
  },
  dialogOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  dialogBox: {
    width: '92%',
    maxHeight: '85%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 15,
  },
  serviceIconContainerRectangular: {
    width: 110,
    height: 160,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.8)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
    position: 'relative',
  },
  serviceIconContainerRectangularHover: {
    transform: [{ scale: 1.05 }],
    shadowColor: "#1976d2",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
    borderColor: "#ffffff",
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    alignItems: 'center',
  },
  serviceLabelRectangular: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  disabledService: {
    opacity: 0.5,
  },
  disabledText: {
    color: '#ff8a8a',
    fontSize: 10,
    marginTop: 3,
  },
});

export default HomePage;