/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  Platform,
  Alert,
  Animated,
  PanResponder,
  TouchableWithoutFeedback,
  BackHandler,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useDispatch } from 'react-redux';
import { add, add as addBooking } from "../features/bookingTypeSlice";
import dayjs from 'dayjs';
import BookingDialog from '../BookingDialog/BookingDialog';
import CookServicesDialog from '../ServiceDialogs/CookServiceDialog';
import MaidServiceDialog from '../ServiceDialogs/MaidServiceDialog';
import NannyServicesDialog from '../ServiceDialogs/NannyServiceDialog';
import { useAppUser } from '../context/AppUserContext';
import { useTheme } from '../Settings/ThemeContext';
import { DETAILS } from '../Constants/pagesConstants';
import { BRAND } from '../theme/brandColors';
import { useTranslation } from 'react-i18next';
import {
  isServiceOfferedByProvider,
  useServiceProviderProfile,
} from '../hooks/useServiceProviderProfile';

const cookImage = require("../../assets/images/Cooknew.png");
const maidImage = require("../../assets/images/Maidnew.png");
const nannyImage = require("../../assets/images/Nannynew.png");

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_MAX_HEIGHT = Math.min(SCREEN_HEIGHT * 0.82, 560);
const DISMISS_DRAG = 72;
const HEADER_DRAG_ZONE = 96;

interface ServiceOption {
  id: string;
  title: string;
  description: string;
  imageSource: ReturnType<typeof require>;
  accent: string;
  tint: string;
}

interface ServicesDialogProps {
  open: boolean;
  onClose: () => void;
  onServiceSelect?: (serviceType: string) => void;
  sendDataToParent?: (data: string, type?: string) => void;
}

const ServicesDialog: React.FC<ServicesDialogProps> = ({
  open,
  onClose,
  onServiceSelect,
  sendDataToParent
}) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { appUser } = useAppUser();
  const { colors, isDarkMode } = useTheme();
  const { t } = useTranslation();
  const [role, setRole] = useState<string | null>(null);
  const [mounted, setMounted] = useState(open);

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollOffsetY = useRef(0);
  const dragStartY = useRef(0);

  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<'COOK' | 'MAID' | 'NANNY' | ''>('');
  const [selectedService, setSelectedService] = useState('');
  const [selectedOption, setSelectedOption] = useState<string>("Date");
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<dayjs.Dayjs | null>(null);
  const [endTime, setEndTime] = useState<dayjs.Dayjs | null>(null);
  const [showCookDialog, setShowCookDialog] = useState(false);
  const [showMaidServiceDialog, setShowMaidServiceDialog] = useState(false);
  const [showNannyServicesDialog, setShowNannyServicesDialog] = useState(false);

  const isServiceProvider = role === "SERVICE_PROVIDER";
  const serviceProviderId = appUser?.serviceProviderId
    ? Number(appUser.serviceProviderId)
    : null;
  const { housekeepingRoles, isAccountActive, loading: loadingProviderProfile } =
    useServiceProviderProfile(serviceProviderId, isServiceProvider);

  const serviceTypeById: Record<string, 'COOK' | 'MAID' | 'NANNY'> = {
    'home-cook': 'COOK',
    'cleaning-help': 'MAID',
    caregiver: 'NANNY',
  };

  const isServiceInactiveForProvider = (serviceId: string) => {
    const serviceType = serviceTypeById[serviceId];
    if (!serviceType || !isServiceProvider || loadingProviderProfile) return false;
    return !isServiceOfferedByProvider(serviceType, housekeepingRoles, isAccountActive);
  };

  const showProviderInactiveVisual = (serviceId: string) => {
    const serviceType = serviceTypeById[serviceId];
    if (!serviceType || !isServiceProvider) return false;
    if (loadingProviderProfile) return true;
    return !isServiceOfferedByProvider(serviceType, housekeepingRoles, isAccountActive);
  };

  useEffect(() => {
    if (appUser) {
      setRole(appUser.role || "CUSTOMER");
    } else {
      setRole(null);
    }
  }, [appUser]);

  const dismissSheet = useCallback(() => {
    dragY.setValue(0);
    onClose();
  }, [dragY, onClose]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (bookingDialogOpen) {
        return false;
      }
      if (open || mounted) {
        dismissSheet();
        return true;
      }
      return false;
    });
    return () => backHandler.remove();
  }, [open, mounted, bookingDialogOpen, dismissSheet]);

  const sheetVisible = (open || mounted) && !bookingDialogOpen;

  useLayoutEffect(() => {
    if (open && !bookingDialogOpen) {
      setMounted(true);
      scrollOffsetY.current = 0;
      dragY.setValue(0);
      slideAnim.setValue(SCREEN_HEIGHT);
      fadeAnim.setValue(0);
    }
  }, [open, bookingDialogOpen, slideAnim, dragY, fadeAnim]);

  useEffect(() => {
    if (bookingDialogOpen) {
      setMounted(false);
      dragY.setValue(0);
      slideAnim.setValue(SCREEN_HEIGHT);
      fadeAnim.setValue(0);
    }
  }, [bookingDialogOpen, slideAnim, dragY, fadeAnim]);

  useEffect(() => {
    if (!open || bookingDialogOpen) {
      return;
    }

    const animation = Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 9,
        tension: 70,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]);

    animation.start();
    return () => animation.stop();
  }, [open, slideAnim, fadeAnim]);

  useEffect(() => {
    if (open || !mounted || bookingDialogOpen) {
      return;
    }

    const animation = Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]);

    animation.start(({ finished }) => {
      if (finished) {
        setMounted(false);
        dragY.setValue(0);
      }
    });

    return () => animation.stop();
  }, [open, mounted, bookingDialogOpen, slideAnim, dragY, fadeAnim]);

  const finishDismiss = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      dragY.setValue(0);
      slideAnim.setValue(SCREEN_HEIGHT);
      dismissSheet();
    });
  }, [slideAnim, dragY, dismissSheet]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gesture) => {
          const inHeader = dragStartY.current <= HEADER_DRAG_ZONE;
          const downward = gesture.dy > 6 && Math.abs(gesture.dy) > Math.abs(gesture.dx);
          if (!downward) return false;
          return inHeader || scrollOffsetY.current <= 0;
        },
        onMoveShouldSetPanResponderCapture: (_, gesture) => {
          const inHeader = dragStartY.current <= HEADER_DRAG_ZONE;
          const downward = gesture.dy > 8 && Math.abs(gesture.dy) > Math.abs(gesture.dx);
          if (!downward) return false;
          return inHeader || scrollOffsetY.current <= 0;
        },
        onPanResponderGrant: (evt) => {
          dragStartY.current = evt.nativeEvent.locationY;
        },
        onPanResponderMove: (_, gesture) => {
          if (gesture.dy > 0) {
            dragY.setValue(gesture.dy);
          }
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy > DISMISS_DRAG || gesture.vy > 0.45) {
            finishDismiss();
            return;
          }
          Animated.spring(dragY, {
            toValue: 0,
            useNativeDriver: true,
            friction: 8,
            tension: 80,
          }).start();
        },
        onPanResponderTerminate: () => {
          Animated.spring(dragY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        },
      }),
    [dragY, finishDismiss]
  );

  const handleServiceSelect = (serviceId: string) => {
    const serviceType = serviceTypeById[serviceId];
    const serviceName =
      serviceType === 'COOK'
        ? t('home.services.homeCook')
        : serviceType === 'MAID'
          ? t('home.services.cleaningHelp')
          : t('home.services.caregiver');

    if (isServiceProvider) {
      if (!isAccountActive) {
        Alert.alert(
          t('home.serviceProvider.service.inactiveAlert.title'),
          t('home.serviceProvider.service.inactiveAlert.accountInactive'),
          [{ text: t('common.ok') }]
        );
        return;
      }
      if (serviceType && !isServiceOfferedByProvider(serviceType, housekeepingRoles, isAccountActive)) {
        Alert.alert(
          t('home.serviceProvider.service.inactiveAlert.title'),
          t('home.serviceProvider.service.inactiveAlert.notOffered', { service: serviceName }),
          [{ text: t('common.ok') }]
        );
        return;
      }
      Alert.alert(
        t('home.serviceProvider.alert.title'),
        t('home.serviceProvider.alert.message'),
        [{ text: t('common.ok') }]
      );
      return;
    }

    if (!serviceType) return;

    setSelectedType(serviceType);
    setSelectedService(serviceName);
    dragY.setValue(0);
    slideAnim.setValue(SCREEN_HEIGHT);
    fadeAnim.setValue(0);
    setMounted(false);
    setBookingDialogOpen(true);
    onClose();

    if (onServiceSelect) {
      onServiceSelect(serviceId);
    }
  };

  const handleBookingSave = (bookingDetails: any) => {
    const formatDate = (value: any) => {
      if (!value) return "";
      if (typeof value === 'string') {
        return value.split("T")[0];
      }
      return "";
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

    let timeRange = "";
    let timeSlot = "";

    if (selectedOption === "Date") {
      timeRange = `${formatTime(bookingDetails.startTime) || ""}-${formatTime(bookingDetails.endTime) || ""}`;
      timeSlot = `${formatTime(bookingDetails.startTime) || ""}-${formatTime(bookingDetails.endTime) || ""}`;
    } else if (selectedOption === "Short term") {
      timeRange = formatTime(bookingDetails.startTime) || "";
      timeSlot = `${formatTime(bookingDetails.startTime) || ""}-${formatTime(bookingDetails.endTime) || ""}`;
    } else {
      timeRange = formatTime(bookingDetails.startTime) || "";
      timeSlot = formatTime(bookingDetails.startTime) || "";
    }

    const booking = {
      startDate: formatDate(bookingDetails.startDate),
      endDate: formatDate(bookingDetails.endDate || bookingDetails.startDate),
      timeRange: timeRange,
      bookingPreference: selectedOption,
      housekeepingRole: selectedType,
      startTime: formatTime(bookingDetails.startTime),
      endTime: formatTime(bookingDetails.endTime),
      timeSlot: timeSlot
    };

    dispatch(addBooking(booking));
    setBookingDialogOpen(false);

    if (selectedOption === "Date") {
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
      }
    } else if (sendDataToParent) {
      sendDataToParent(DETAILS);
    }
  };

  const handleServiceDialogClose = () => {
    setShowCookDialog(false);
    setShowMaidServiceDialog(false);
    setShowNannyServicesDialog(false);

    if (sendDataToParent) {
      sendDataToParent(DETAILS);
    }
  };

  const getBookingType = () => {
    const formatDateForBooking = (date: string | null) => {
      if (!date) return "";
      try {
        return new Date(date).toISOString().split("T")[0];
      } catch {
        return "";
      }
    };

    const formatTimeForBooking = (time: dayjs.Dayjs | null) => {
      if (!time) return "";
      try {
        return time.format("HH:mm");
      } catch {
        return "";
      }
    };

    let timeRange = "";
    if (startTime && endTime) {
      timeRange = `${formatTimeForBooking(startTime)} - ${formatTimeForBooking(endTime)}`;
    } else if (startTime) {
      timeRange = formatTimeForBooking(startTime);
    }

    return {
      startDate: formatDateForBooking(startDate),
      endDate: formatDateForBooking(endDate || startDate),
      timeRange: timeRange,
      bookingPreference: selectedOption,
      housekeepingRole: selectedType,
      startTime: formatTimeForBooking(startTime),
      endTime: formatTimeForBooking(endTime),
      start_date: formatDateForBooking(startDate),
      start_time: formatTimeForBooking(startTime),
      end_date: formatDateForBooking(endDate || startDate),
      end_time: formatTimeForBooking(endTime)
    };
  };

  const handleOptionChange = (value: string) => {
    setSelectedOption(value);
    setStartDate(null);
    setEndDate(null);
    setStartTime(null);
    setEndTime(null);
  };

  const handleBookingDialogClose = () => {
    setBookingDialogOpen(false);
    setSelectedType('');
    setSelectedOption("Date");
    setStartDate(null);
    setEndDate(null);
    setStartTime(null);
    setEndTime(null);
  };

  const serviceOptions: ServiceOption[] = [
    {
      id: 'home-cook',
      title: 'Home Cook',
      description: 'Verified cooks for hygienic, home-style meals',
      imageSource: cookImage,
      accent: '#0EA5E9',
      tint: '#E0F2FE',
    },
    {
      id: 'cleaning-help',
      title: 'Cleaning Help',
      description: 'Trained maids for thorough home cleaning',
      imageSource: maidImage,
      accent: '#059669',
      tint: '#D1FAE5',
    },
    {
      id: 'caregiver',
      title: 'Caregiver',
      description: 'Compassionate care for children & elderly',
      imageSource: nannyImage,
      accent: '#7C3AED',
      tint: '#EDE9FE',
    },
  ];

  const surface = isDarkMode ? colors.surface : '#FFFFFF';
  const textPrimary = isDarkMode ? colors.textPrimary : BRAND.text;
  const textMuted = isDarkMode ? colors.textSecondary : BRAND.textMuted;
  const borderColor = isDarkMode ? colors.border : BRAND.line;
  const sheetTranslateY = Animated.add(slideAnim, dragY);

  return (
    <>
      {sheetVisible && (
        <Modal
          visible={sheetVisible}
          transparent
          animationType="none"
          onRequestClose={dismissSheet}
          statusBarTranslucent
          presentationStyle="overFullScreen"
        >
          <View style={styles.overlay}>
            <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
              <TouchableWithoutFeedback onPress={dismissSheet}>
                <View style={styles.backdropTap} />
              </TouchableWithoutFeedback>
            </Animated.View>

            <Animated.View
              style={[
                styles.sheet,
                {
                  backgroundColor: surface,
                  maxHeight: SHEET_MAX_HEIGHT,
                  paddingBottom: Math.max(insets.bottom, 16),
                  transform: [{ translateY: sheetTranslateY }],
                },
              ]}
              {...panResponder.panHandlers}
            >
              <View style={styles.handleWrap}>
                <View style={[styles.handle, { backgroundColor: borderColor }]} />
              </View>

              <View style={styles.headerRow}>
                <View style={styles.headerTextWrap}>
                  <Text style={[styles.headerEyebrow, { color: textMuted }]}>
                    {isServiceProvider ? 'Browse only' : 'New booking'}
                  </Text>
                  <Text style={[styles.headerTitle, { color: textPrimary }]}>
                    {isServiceProvider ? 'Our services' : 'Select a service'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={dismissSheet}
                  style={[styles.closeBtn, { backgroundColor: isDarkMode ? colors.card : '#F1F5F9' }]}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel="Close"
                >
                  <Icon name="close" size={20} color={textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                scrollEventThrottle={16}
                onScroll={(e) => {
                  scrollOffsetY.current = e.nativeEvent.contentOffset.y;
                }}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
              >
                {isServiceProvider && (
                  <View style={styles.providerBanner}>
                    <Icon name="info-outline" size={18} color="#B45309" />
                    <Text style={styles.providerBannerText}>
                      {!isAccountActive
                        ? t('home.serviceProvider.banner.accountInactive')
                        : t('home.serviceProvider.banner.viewOnly')}
                    </Text>
                  </View>
                )}

                <Text style={[styles.sectionLabel, { color: textPrimary }]}>
                  What do you need help with?
                </Text>

                <View style={styles.serviceList}>
                  {serviceOptions.map((service) => {
                    const inactive = showProviderInactiveVisual(service.id);
                    const interactionDisabled = isServiceInactiveForProvider(service.id);

                    return (
                    <TouchableOpacity
                      key={service.id}
                      style={[
                        styles.serviceRow,
                        {
                          backgroundColor: isDarkMode ? colors.card : '#FFFFFF',
                          borderColor,
                        },
                        inactive && styles.serviceRowDisabled,
                      ]}
                      onPress={() => handleServiceSelect(service.id)}
                      activeOpacity={interactionDisabled ? 1 : 0.82}
                      accessibilityRole="button"
                      accessibilityLabel={`Select ${service.title}`}
                      accessibilityState={{ disabled: interactionDisabled }}
                    >
                      <View style={[styles.serviceThumbWrap, { backgroundColor: service.tint }]}>
                        <Image
                          source={service.imageSource}
                          style={[styles.serviceThumb, inactive && styles.serviceThumbDisabled]}
                          resizeMode="cover"
                        />
                      </View>

                      <View style={styles.serviceCopy}>
                        <View style={styles.serviceTitleRow}>
                          <Text style={[styles.serviceTitle, { color: textPrimary }, inactive && styles.serviceTitleDisabled]} numberOfLines={1}>
                            {service.title}
                          </Text>
                          {isServiceProvider ? (
                            <View style={[styles.serviceStatusPill, inactive ? styles.serviceStatusPillInactive : styles.serviceStatusPillActive]}>
                              <Text style={styles.serviceStatusPillText}>
                                {inactive
                                  ? t('home.serviceProvider.service.inactive')
                                  : t('home.serviceProvider.service.active')}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                        <Text style={[styles.serviceSubtitle, { color: textMuted }, inactive && styles.serviceSubtitleDisabled]} numberOfLines={2}>
                          {inactive
                            ? !isAccountActive
                              ? t('home.serviceProvider.service.inactiveAlert.accountInactive')
                              : t('home.serviceProvider.service.notOffered')
                            : service.description}
                        </Text>
                      </View>

                      <View style={[styles.serviceCta, { borderColor: inactive ? '#CBD5E1' : service.accent }]}>
                        <Icon name="arrow-forward" size={18} color={inactive ? '#94A3B8' : service.accent} />
                      </View>
                    </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={[styles.footerNote, { color: textMuted }]}>
                  Tap a service to choose dates and continue booking.
                </Text>
              </ScrollView>
            </Animated.View>
          </View>
        </Modal>
      )}

      {!isServiceProvider && (
        <>
          <BookingDialog
            open={bookingDialogOpen}
            onClose={handleBookingDialogClose}
            onSave={handleBookingSave}
            selectedOption={selectedOption}
            onOptionChange={handleOptionChange}
            startDate={startDate}
            endDate={endDate}
            startTime={startTime}
            endTime={endTime}
            setStartDate={setStartDate}
            setEndDate={setEndDate}
            setStartTime={setStartTime}
            setEndTime={setEndTime}
          />

          <CookServicesDialog
            open={showCookDialog}
            handleClose={handleServiceDialogClose}
            sendDataToParent={sendDataToParent}
          />

          {showNannyServicesDialog && (
            <View style={styles.nestedDialogOverlay}>
              <View style={styles.nestedDialogBox}>
                <NannyServicesDialog
                  open={showNannyServicesDialog}
                  handleClose={handleServiceDialogClose}
                  sendDataToParent={sendDataToParent}
                  bookingType={getBookingType()}
                />
              </View>
            </View>
          )}

          {showMaidServiceDialog && (
            <View style={styles.nestedDialogOverlay}>
              <View style={styles.nestedDialogBox}>
                <MaidServiceDialog
                  open={showMaidServiceDialog}
                  handleClose={handleServiceDialogClose}
                  sendDataToParent={sendDataToParent}
                  bookingType={getBookingType()}
                />
              </View>
            </View>
          )}
        </>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.52)',
  },
  backdropTap: {
    flex: 1,
  },
  sheet: {
    width: '100%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: { elevation: 16 },
    }),
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 999,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
  },
  headerTextWrap: {
    flex: 1,
    paddingRight: 12,
  },
  headerEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  providerBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 12,
    marginBottom: 16,
  },
  providerBannerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: '#92400E',
    fontWeight: '500',
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  serviceList: {
    gap: 10,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  serviceRowDisabled: {
    opacity: 0.55,
  },
  serviceThumbDisabled: {
    opacity: 0.65,
  },
  serviceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 2,
  },
  serviceTitleDisabled: {
    color: '#64748B',
  },
  serviceSubtitleDisabled: {
    color: '#94A3B8',
  },
  serviceStatusPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  serviceStatusPillInactive: {
    backgroundColor: '#E2E8F0',
  },
  serviceStatusPillActive: {
    backgroundColor: '#DCFCE7',
  },
  serviceStatusPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155',
  },
  serviceThumbWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceThumb: {
    width: 52,
    height: 52,
  },
  serviceCopy: {
    flex: 1,
    minWidth: 0,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  serviceSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  serviceCta: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  footerNote: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 8,
  },
  nestedDialogOverlay: {
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
  nestedDialogBox: {
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
});

export default ServicesDialog;
