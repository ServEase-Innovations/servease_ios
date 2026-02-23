// AllBookingsDialog.tsx (updated)
/* eslint-disable */
import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  ScrollView, 
  StyleSheet,
  TouchableWithoutFeedback,
  Alert,
  DimensionValue,
  Linking,
  ActivityIndicator
} from "react-native";
import { Calendar, MapPin, X, Phone, Clock, Loader2, CheckCircle } from "lucide-react-native";
import { getBookingTypeBadge, getServiceTitle, getStatusBadge } from "./../common/BookingUtils";
import PaymentInstance from "../services/paymentInstance";
import dayjs, { Dayjs } from "dayjs";
import { Booking, BookingHistoryResponse } from "./Dashboard";
import axios from "axios";
import { OtpVerificationDialog } from "./OtpVerificationDialog";
import TrackAddress from "./TrackAddress"; // Import the TrackAddress component

// Google Maps API Key
const GOOGLE_MAPS_API_KEY = 'AIzaSyBWoIIAX-gE7fvfAkiquz70WFgDaL7YXSk';

interface AllBookingsDialogProps {
  bookings: BookingHistoryResponse | null;
  serviceProviderId: number | null;
  trigger?: React.ReactNode;
  visible: boolean;
  onClose: () => void;
  onContactClient: (booking: Booking) => void;
}

// Function to format time string to AM/PM format
const formatTimeToAMPM = (timeString: string): string => {
  if (!timeString) return '';
  
  try {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const minute = parseInt(minutes, 10);
    
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    const displayMinute = minute.toString().padStart(2, '0');
    
    return `${displayHour}:${displayMinute} ${period}`;
  } catch (error) {
    console.error('Error formatting time:', error);
    return timeString;
  }
};

// Function to handle calling customer
const handleCallCustomer = (phoneNumber: string, clientName: string) => {
  if (!phoneNumber || phoneNumber === "Contact info not available") {
    Alert.alert("No Contact Info", "Customer contact information is not available.");
    return;
  }
  
  const telLink = `tel:${phoneNumber}`;
  Linking.openURL(telLink).catch(() => {
    Alert.alert("Error", "Could not open phone dialer");
  });
};

export function AllBookingsDialog({ 
  bookings, 
  serviceProviderId, 
  trigger, 
  visible, 
  onClose, 
  onContactClient 
}: AllBookingsDialogProps) {
  const [tab, setTab] = useState<"ongoing" | "future" | "past">("ongoing");
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(dayjs());
  const [data, setData] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalBookings, setTotalBookings] = useState(0);
  const [initialLoad, setInitialLoad] = useState(true);
  
  // Add states for task management
  const [taskStatus, setTaskStatus] = useState<Record<string, "IN_PROGRESS" | "COMPLETED" | undefined>>({});
  const [taskStatusUpdating, setTaskStatusUpdating] = useState<Record<string, boolean>>({});
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [currentBooking, setCurrentBooking] = useState<any>(null);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  
  // Add state for Track Address dialog
  const [trackAddressDialogOpen, setTrackAddressDialogOpen] = useState(false);

  const mapApiBookingToBooking = (apiBooking: any): Booking => {
    let date, timeRange;
    
    if (apiBooking.start_epoch && apiBooking.end_epoch) {
      const startDate = new Date(apiBooking.start_epoch * 1000);
      const endDate = new Date(apiBooking.end_epoch * 1000);
      
      const formattedDate = startDate.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
      
      timeRange = `${startDate.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      })} - ${endDate.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      })}`;
      
      date = formattedDate;
    } else {
      const startDateRaw = apiBooking.startDate || apiBooking.start_date;
      const startTimeStr = apiBooking.startTime || "00:00";
      const endTimeStr = apiBooking.endTime || "00:00";

      const startDate = new Date(startDateRaw);
      const endDate = new Date(startDateRaw);

      const [startHours, startMinutes] = startTimeStr.split(":").map(Number);
      const [endHours, endMinutes] = endTimeStr.split(":").map(Number);

      startDate.setHours(startHours, startMinutes);
      endDate.setHours(endHours, endMinutes);

      timeRange = formatTimeToAMPM(apiBooking.startTime) + " - " + formatTimeToAMPM(apiBooking.endTime);
      
      date = startDate.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
    }

    const clientName = apiBooking.firstname && apiBooking.lastname 
      ? `${apiBooking.firstname} ${apiBooking.lastname}`.trim()
      : apiBooking.firstname 
        ? apiBooking.firstname
        : apiBooking.email || "Client";

    const bookingId = apiBooking.engagement_id || apiBooking.id;

    const amount = apiBooking.base_amount ? 
      `₹${parseFloat(apiBooking.base_amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 
      "₹0";

    const responsibilities = apiBooking.responsibilities || {};

    return {
      id: Number(apiBooking.engagement_id || apiBooking.id),
      serviceProviderId: Number(apiBooking.serviceproviderid || apiBooking.serviceProviderId),
      customerId: Number(apiBooking.customerid || apiBooking.customerId),
      start_date: apiBooking.start_date || apiBooking.startDate,
      endDate: apiBooking.end_date || apiBooking.endDate,
      engagements: "",
      timeslot: apiBooking.startTime && apiBooking.endTime ? 
                `${formatTimeToAMPM(apiBooking.startTime)} - ${formatTimeToAMPM(apiBooking.endTime)}` : 
                "",
      monthlyAmount: Number(apiBooking.base_amount || apiBooking.monthlyAmount || 0),
      paymentMode: "",
      booking_type: apiBooking.booking_type || apiBooking.bookingType || "",
      service_type: apiBooking.service_type || apiBooking.serviceType || "",
      bookingDate: apiBooking.created_at || apiBooking.bookingDate,
      responsibilities,
      housekeepingRole: null,
      mealType: null,
      noOfPersons: responsibilities.tasks?.[0]?.persons || null,
      experience: null,
      childAge: null,
      customerName: clientName,
      serviceProviderName: "",
      address: apiBooking.address || "",
      taskStatus: apiBooking.task_status || apiBooking.taskStatus || "",
      modifiedBy: "",
      modifiedDate: "",
      availableTimeSlots: null,
      customerHolidays: [],
      serviceProviderLeaves: [],
      active: true,
      clientName: clientName,
      service: apiBooking.service_type || apiBooking.serviceType || "",
      date: date,
      time: timeRange,
      location: apiBooking.address || "Address not provided",
      status: apiBooking.task_status || apiBooking.taskStatus || "",
      amount: amount,
      bookingData: {
        ...apiBooking,
        mobileno: apiBooking.mobileno || "",
        contact: apiBooking.mobileno || "Contact info not available",
        today_service: apiBooking.today_service || null
      }
    };
  };

  const fetchBookingsByMonth = async (
    month: number,
    year: number
  ): Promise<BookingHistoryResponse> => {
    if (!serviceProviderId) {
      return { current: [], upcoming: [], past: [] };
    }

    try {
      setLoading(true);
      const formattedMonth = `${year}-${String(month).padStart(2, "0")}`;
      const res = await PaymentInstance.get(
        `/api/service-providers/${serviceProviderId}/engagements?month=${formattedMonth}`
      );

      return res.data;
    } catch (err) {
      console.error("Error fetching bookings:", err);
      Alert.alert("Error", "Failed to load bookings");
      return { current: [], upcoming: [], past: [] };
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  const fetchDataForTab = async (tab: "ongoing" | "future" | "past", monthDate: Dayjs) => {
    if (!serviceProviderId) return;

    try {
      setLoading(true);
      const month = monthDate.month() + 1;
      const year = monthDate.year();
      
      const apiResponse = await fetchBookingsByMonth(month, year);
      
      if (tab === "ongoing") {
        const currentBookings = apiResponse.current || [];
        setData(currentBookings.map(mapApiBookingToBooking));
        setTotalBookings(currentBookings.length);
      } else if (tab === "future") {
        const upcomingBookings = apiResponse.upcoming || [];
        setData(upcomingBookings.map(mapApiBookingToBooking));
        setTotalBookings(upcomingBookings.length);
      } else if (tab === "past") {
        const pastBookings = apiResponse.past || [];
        setData(pastBookings.map(mapApiBookingToBooking));
        setTotalBookings(pastBookings.length);
      }
    } catch (error) {
      console.error("Error fetching data for tab:", error);
      setData([]);
      setTotalBookings(0);
    }
  };

  const handleStartTask = async (bookingId: string, bookingData: any) => {
    if (!bookingId || !bookingData) return;

    const serviceDayId = bookingData.today_service?.service_day_id;
    if (!serviceDayId) {
      Alert.alert("Error", "Service day ID not found. Cannot start service.");
      return;
    }

    const previousStatus = taskStatus[bookingId];

    setTaskStatus(prev => ({ ...prev, [bookingId]: "IN_PROGRESS" }));
    setTaskStatusUpdating(prev => ({ ...prev, [bookingId]: true }));

    try {
      await PaymentInstance.post(
        `api/engagement-service/service-days/${serviceDayId}/start`,
        {},
        { 
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
          } 
        }
      );

      Alert.alert("Service Started", "You have successfully started the service. Task is now IN_PROGRESS");

      await fetchDataForTab(tab, selectedMonth);
    } catch (err) {
      setTaskStatus(prev => ({ ...prev, [bookingId]: previousStatus }));
      
      let errorMessage = "Failed to start service";
      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.message || err.message || errorMessage;
      }
      
      Alert.alert("Error", errorMessage);
    } finally {
      setTaskStatusUpdating(prev => ({ ...prev, [bookingId]: false }));
    }
  };

  const handleStopTask = async (bookingId: string, bookingData: any) => {
    setCurrentBooking({ bookingId, bookingData });
    setOtpDialogOpen(true);
  };

  const handleVerifyOtp = async (otp: string) => {
    if (!currentBooking) return;

    const serviceDayId = currentBooking.bookingData.today_service?.service_day_id;
    if (!serviceDayId) {
      Alert.alert("Error", "Service day ID not found");
      return;
    }

    setVerifyingOtp(true);
    try {
      await PaymentInstance.post(
        `api/engagement-service/service-days/${serviceDayId}/complete`,
        { otp },
        { 
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
          } 
        }
      );

      Alert.alert("Success", "Service completed successfully! Earnings credited to your account.");

      setTaskStatus(prev => ({ ...prev, [currentBooking.bookingId]: "COMPLETED" }));
      
      await fetchDataForTab(tab, selectedMonth);
      
      return Promise.resolve();
    } catch (err) {
      let errorMessage = "Failed to complete service";
      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.message || err.message || errorMessage;
      }
      
      Alert.alert("Error", errorMessage);
      return Promise.reject(err);
    } finally {
      setVerifyingOtp(false);
      setOtpDialogOpen(false);
    }
  };

  // Handle track address button click
  const handleTrackAddress = () => {
    setTrackAddressDialogOpen(true);
  };

  // Handle tab change with month reset
  const handleTabChange = (newValue: "ongoing" | "future" | "past") => {
    // Reset month to default for the new tab
    const defaultMonth = getDefaultMonthForTab(newValue);
    setSelectedMonth(defaultMonth);
    setTab(newValue);
  };

  const getDefaultMonthForTab = (tabType: "ongoing" | "future" | "past"): Dayjs => {
    return dayjs().startOf('month');
  };

  useEffect(() => {
    if (!visible) return;
    
    setData([]);
    setTotalBookings(0);
    // Set initial month based on current tab
    setSelectedMonth(getDefaultMonthForTab(tab));
  }, [visible]);

  useEffect(() => {
    if (!visible || !selectedMonth) return;
    
    fetchDataForTab(tab, selectedMonth);
  }, [selectedMonth, tab, visible]);

  const getMonthName = (date: Dayjs) => {
    return date.format("MMMM YYYY");
  };

  const handleMonthChange = (newDate: Dayjs) => {
    setSelectedMonth(newDate);
  };

  // Enhanced badge component
  interface BadgeProps {
    children: React.ReactNode;
    variant?: "default" | "success" | "warning" | "destructive" | "secondary" | "outline";
    style?: any;
  }

  const Badge = ({ children, variant = "default", style }: BadgeProps) => {
    const getVariantStyle = () => {
      switch (variant) {
        case "success":
          return styles.badgeSuccess;
        case "warning":
          return styles.badgeWarning;
        case "destructive":
          return styles.badgeDestructive;
        case "secondary":
          return styles.badgeSecondary;
        case "outline":
          return styles.badgeOutline;
        default:
          return styles.badgeDefault;
      }
    };

    return (
      <View style={[styles.badge, getVariantStyle(), style]}>
        <Text style={styles.badgeText}>{children}</Text>
      </View>
    );
  };

  // Enhanced button component with disabled state
  interface ButtonProps {
    children: React.ReactNode;
    variant?: "default" | "outline" | "secondary" | "ghost" | "destructive";
    size?: "sm" | "md" | "lg";
    onPress?: () => void;
    disabled?: boolean;
    icon?: React.ReactNode;
    loading?: boolean;
  }

  const Button = ({ 
    children, 
    variant = "default", 
    size = "md", 
    onPress,
    disabled = false,
    icon,
    loading = false
  }: ButtonProps) => {
    const getVariantStyle = () => {
      if (disabled) return styles.buttonDisabled;
      
      switch (variant) {
        case "outline":
          return styles.buttonOutline;
        case "secondary":
          return styles.buttonSecondary;
        case "ghost":
          return styles.buttonGhost;
        case "destructive":
          return styles.buttonDestructive;
        default:
          return styles.buttonDefault;
      }
    };

    const getSizeStyle = () => {
      switch (size) {
        case "sm":
          return styles.buttonSm;
        case "lg":
          return styles.buttonLg;
        default:
          return styles.buttonMd;
      }
    };

    const getTextStyle = () => {
      if (disabled) return styles.buttonDisabledText;
      
      switch (variant) {
        case "outline":
          return styles.buttonOutlineText;
        case "secondary":
          return styles.buttonSecondaryText;
        case "ghost":
          return styles.buttonGhostText;
        case "destructive":
          return styles.buttonDestructiveText;
        default:
          return styles.buttonDefaultText;
      }
    };

    return (
      <TouchableOpacity 
        style={[styles.button, getVariantStyle(), getSizeStyle()]}
        onPress={onPress}
        disabled={disabled || loading}
      >
        <View style={styles.buttonContent}>
          {loading ? (
            <ActivityIndicator size="small" color={variant === "destructive" ? "#ffffff" : "#374151"} />
          ) : (
            <>
              {icon && <View style={styles.buttonIcon}>{icon}</View>}
              <Text style={[styles.buttonText, getTextStyle()]}>
                {children}
              </Text>
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  interface TabButtonProps {
    label: string;
    isActive: boolean;
    onPress: () => void;
  }

  const TabButton = ({ label, isActive, onPress }: TabButtonProps) => (
    <TouchableOpacity 
      style={[styles.tabButton, isActive && styles.tabButtonActive]}
      onPress={onPress}
    >
      <Text style={[styles.tabButtonText, isActive && styles.tabButtonTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  // Enhanced MonthSelector with navigation constraints
  const MonthSelector = () => {
    const currentMonth = dayjs().startOf('month');
    
    const canGoPrev = () => {
      if (tab === "future") {
        return selectedMonth.startOf('month').isAfter(currentMonth, 'month');
      }
      return true;
    };

    const canGoNext = () => {
      if (tab === "past") {
        return selectedMonth.startOf('month').isBefore(currentMonth, 'month');
      }
      return true;
    };

    return (
      <View style={styles.monthSelector}>
        <TouchableOpacity 
          style={[
            styles.monthNavButton, 
            styles.monthNavButtonPrev,
            !canGoPrev() && styles.monthNavButtonDisabled
          ]}
          onPress={() => {
            if (canGoPrev()) {
              const newMonth = selectedMonth.subtract(1, 'month');
              handleMonthChange(newMonth);
            }
          }}
          disabled={!canGoPrev()}
        >
          <Text style={[
            styles.monthNavText,
            !canGoPrev() && styles.monthNavTextDisabled
          ]}>‹</Text>
        </TouchableOpacity>
        
        <View style={styles.monthTextContainer}>
          <Text style={styles.monthText}>
            {getMonthName(selectedMonth)}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={[
            styles.monthNavButton, 
            styles.monthNavButtonNext,
            !canGoNext() && styles.monthNavButtonDisabled
          ]}
          onPress={() => {
            if (canGoNext()) {
              const newMonth = selectedMonth.add(1, 'month');
              handleMonthChange(newMonth);
            }
          }}
          disabled={!canGoNext()}
        >
          <Text style={[
            styles.monthNavText,
            !canGoNext() && styles.monthNavTextDisabled
          ]}>›</Text>
        </TouchableOpacity>
      </View>
    );
  };

  interface SkeletonLoaderProps {
    width: DimensionValue;
    height: number;
    style?: any;
  }

  const SkeletonLoader = ({ width, height, style }: SkeletonLoaderProps) => (
    <View style={[styles.skeleton, { width, height }, style]} />
  );

  const renderResponsibilities = (booking: Booking) => {
    if (!booking.responsibilities) return null;

    return (
      <View style={styles.responsibilitiesSection}>
        <Text style={styles.responsibilitiesTitle}>Responsibilities</Text>
        <View style={styles.responsibilitiesList}>
          {booking.responsibilities?.tasks?.map((task: any, index: number) => {
            const taskLabel = task.persons ? `${task.persons} persons` : "";
            return (
              <Badge key={index} variant="outline" style={styles.responsibilityBadge}>
                <Text style={styles.responsibilityText}>
                  {task.taskType} {taskLabel}
                </Text>
              </Badge>
            );
          })}
          {booking.responsibilities?.add_ons?.map((addon: any, index: number) => (
            <Badge key={`addon-${index}`} variant="outline" style={[styles.responsibilityBadge, styles.addonBadge]}>
              <Text style={styles.responsibilityText}>
                Add-on: {typeof addon === 'object' ? JSON.stringify(addon) : addon}
              </Text>
            </Badge>
          ))}
          {(!booking.responsibilities?.tasks?.length && !booking.responsibilities?.add_ons?.length) && (
            <Text style={styles.noResponsibilitiesText}>No responsibilities listed</Text>
          )}
        </View>
      </View>
    );
  };

  const getTabLabel = (tabType: "ongoing" | "future" | "past") => {
    const baseLabels = {
      ongoing: `Current (${tab === 'ongoing' ? totalBookings : '0'})`,
      future: `Upcoming (${tab === 'future' ? totalBookings : '0'})`,
      past: `Past (${tab === 'past' ? totalBookings : '0'})`
    };
    
    return baseLabels[tabType];
  };

  const getEmptyStateMessage = () => {
    if (tab === "ongoing") {
      return "No current bookings found in this month. All your current bookings for this month will appear here.";
    } else if (tab === "future") {
      return "No upcoming bookings found in this month. All your upcoming bookings for this month will appear here.";
    } else {
      return "No past bookings found in this month. All your past bookings for this month will appear here.";
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <>
      {trigger && (
        <TouchableWithoutFeedback onPress={() => {}}>
          <View>{trigger}</View>
        </TouchableWithoutFeedback>
      )}

      <Modal
        visible={visible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                View all Bookings
              </Text>
              <TouchableOpacity 
                onPress={handleClose}
                style={styles.closeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <View style={styles.tabsContainer}>
              <TabButton 
                label={getTabLabel("ongoing")}
                isActive={tab === "ongoing"}
                onPress={() => handleTabChange("ongoing")}
              />
              <TabButton 
                label={getTabLabel("future")}
                isActive={tab === "future"}
                onPress={() => handleTabChange("future")}
              />
              <TabButton 
                label={getTabLabel("past")}
                isActive={tab === "past"}
                onPress={() => handleTabChange("past")}
              />
            </View>

            <View style={styles.monthInfoContainer}>
              <View style={styles.monthSelectorSection}>
                <MonthSelector />
                <Text style={styles.bookingCount}>
                  {loading ? (
                    <SkeletonLoader width={120} height={16} />
                  ) : (
                    `${totalBookings} booking${totalBookings !== 1 ? 's' : ''} in ${getMonthName(selectedMonth)}`
                  )}
                </Text>
              </View>
            </View>

            <ScrollView 
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
            >
              {loading && initialLoad ? (
                <View style={styles.loadingContainer}>
                  {[1, 2, 3].map((i) => (
                    <View key={i} style={styles.skeletonCard}>
                      <View style={styles.skeletonHeader}>
                        <View style={styles.skeletonHeaderRow}>
                          <SkeletonLoader width="30%" height={12} />
                          <SkeletonLoader width="40%" height={12} />
                        </View>
                        <SkeletonLoader width="60%" height={24} style={styles.skeletonMargin} />
                        <SkeletonLoader width="40%" height={16} />
                      </View>
                      <View style={styles.skeletonContent}>
                        <View style={styles.skeletonRow}>
                          <View style={styles.skeletonInfo}>
                            <SkeletonLoader width="80%" height={16} style={styles.skeletonMargin} />
                            <SkeletonLoader width="60%" height={16} />
                          </View>
                          <SkeletonLoader width="30%" height={20} />
                        </View>
                        <SkeletonLoader width="90%" height={16} style={styles.skeletonMargin} />
                        <View style={styles.skeletonBadges}>
                          <SkeletonLoader width="60%" height={20} style={styles.skeletonMargin} />
                        </View>
                        <SkeletonLoader width="100%" height={36} />
                      </View>
                    </View>
                  ))}
                </View>
              ) : data.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconContainer}>
                    <Calendar size={48} color="#d1d5db" />
                  </View>
                  <Text style={styles.emptyTitle}>
                    {tab === "ongoing" 
                      ? "No current bookings found" 
                      : tab === "future"
                        ? "No upcoming bookings found"
                        : "No past bookings found"
                    } in {getMonthName(selectedMonth)}
                  </Text>
                  <Text style={styles.emptyDescription}>
                    {getEmptyStateMessage()}
                  </Text>
                </View>
              ) : (
                <View style={styles.bookingsContainer}>
                  {data.map((booking) => {
                    // Use the EXACT SAME LOGIC as in Dashboard
                    const todayServiceStatus = booking.bookingData?.today_service?.status;
                    const taskStatusOriginal = booking.taskStatus?.toUpperCase();
                    
                    const isInProgress = todayServiceStatus === 'IN_PROGRESS' || 
                                         taskStatus[booking.id.toString()] === 'IN_PROGRESS' || 
                                         taskStatusOriginal === 'IN_PROGRESS' || 
                                         taskStatusOriginal === 'STARTED';
                    
                    const isCompleted = todayServiceStatus === 'COMPLETED' || 
                                       taskStatusOriginal === 'COMPLETED';
                    
                    const isNotStarted = todayServiceStatus === 'SCHEDULED' || 
                                         taskStatusOriginal === 'NOT_STARTED';

                    const canStart = booking.bookingData?.today_service?.can_start === true;
                    
                    const showStartButton = isNotStarted && canStart;
                    const showCompleteButton = isInProgress;
                    const showCompletedButton = isCompleted;

                    return (
                      <View key={booking.id} style={styles.card}>
                        <View style={styles.cardHeader}>
                          <View style={styles.cardHeaderTop}>
                            <Text style={styles.bookingId}>
                              Booking ID: {booking.id}
                            </Text>
                            <View style={styles.headerBadges}>
                              {getBookingTypeBadge(booking.booking_type || "")}
                              {getStatusBadge(booking.taskStatus || "")}
                            </View>
                          </View>
                          <View style={styles.cardHeaderMain}>
                            <View style={styles.cardHeaderLeft}>
                              <Text style={styles.cardTitle}>
                                {booking.clientName}
                              </Text>
                              <View style={styles.serviceStatusRow}>
                                <Text style={styles.serviceText}>
                                  {getServiceTitle(booking.service)}
                                </Text>
                              </View>
                            </View>
                          </View>
                        </View>

                        <View style={styles.cardContent}>
                          {/* Date, Time and Amount with Phone Icon */}
                          <View style={styles.infoGrid}>
                            <View style={styles.dateTimeSection}>
                              <Text style={styles.infoLabel}>Date & Time</Text>
                              <View style={styles.infoRow}>
                                <Calendar size={14} color="#6b7280" />
                                <Text style={styles.infoText}>
                                  {booking.date} at {booking.time}
                                </Text>
                              </View>
                            </View>
                            <View style={styles.amountSection}>
                              <View style={styles.amountInfo}>
                                <Text style={styles.amountLabel}>Amount</Text>
                                <Text style={styles.amountText}>
                                  {booking.amount}
                                </Text>
                              </View>
                              {booking.bookingData?.mobileno && (
                                <TouchableOpacity
                                  style={styles.phoneButton}
                                  onPress={() => handleCallCustomer(booking.bookingData.mobileno, booking.clientName)}
                                >
                                  <Phone size={16} color="#374151" />
                                </TouchableOpacity>
                              )}
                            </View>
                          </View>

                          {/* Responsibilities Section */}
                          {renderResponsibilities(booking)}

                          {/* Location with Track Address Button - UPDATED */}
                          <View style={styles.locationSection}>
                            <View style={styles.locationHeader}>
                              <Text style={styles.locationLabel}>Address</Text>
                              <TouchableOpacity
                                style={styles.trackButton}
                                onPress={handleTrackAddress}
                              >
                                <MapPin size={14} color="#374151" />
                                <Text style={styles.trackButtonText}>Track Address</Text>
                              </TouchableOpacity>
                            </View>
                            <Text style={styles.locationText}>
                              {booking.location || "Address not provided"}
                            </Text>
                          </View>

                          {/* Today's Service Status Badge */}
                          {todayServiceStatus && (
                            <View style={styles.todayServiceSection}>
                              <Text style={styles.todayServiceLabel}>Today's Service:</Text>
                              <View style={[
                                styles.todayServiceBadge,
                                todayServiceStatus === 'SCHEDULED' && styles.scheduledBadge,
                                todayServiceStatus === 'IN_PROGRESS' && styles.inProgressBadge,
                                todayServiceStatus === 'COMPLETED' && styles.completedBadge
                              ]}>
                                <Text style={[
                                  styles.todayServiceText,
                                  todayServiceStatus === 'SCHEDULED' && styles.scheduledText,
                                  todayServiceStatus === 'IN_PROGRESS' && styles.inProgressText,
                                  todayServiceStatus === 'COMPLETED' && styles.completedText
                                ]}>
                                  {todayServiceStatus}
                                </Text>
                              </View>
                            </View>
                          )}

                          {/* Task Action Buttons */}
                          <View style={styles.taskActionsSection}>
                            <Text style={styles.taskStatusLabel}>
                              {isInProgress 
                                ? "Task In Progress" 
                                : isCompleted 
                                  ? 'Task Completed' 
                                  : isNotStarted
                                    ? 'Not Started' 
                                    : 'Upcoming'
                              }
                            </Text>
                            <View style={styles.taskButtons}>
                              {taskStatusUpdating[booking.id.toString()] ? (
                                <View style={[styles.button, styles.buttonSm]}>
                                  <ActivityIndicator size="small" color="#374151" />
                                </View>
                              ) : showCompleteButton ? (
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onPress={() => handleStopTask(booking.id.toString(), booking.bookingData)}
                                >
                                  Complete Task
                                </Button>
                              ) : showCompletedButton ? (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  disabled
                                  icon={<CheckCircle size={14} color="#10b981" />}
                                >
                                  Completed
                                </Button>
                              ) : showStartButton ? (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onPress={() => handleStartTask(booking.id.toString(), booking.bookingData)}
                                >
                                  Start Task
                                </Button>
                              ) : (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  disabled
                                >
                                  Cannot Start Yet
                                </Button>
                              )}
                            </View>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* OTP Verification Dialog */}
      <OtpVerificationDialog
        open={otpDialogOpen}
        onOpenChange={() => setOtpDialogOpen(false)}
        onVerify={handleVerifyOtp}
        verifying={verifyingOtp}
        bookingInfo={currentBooking ? {
          clientName: currentBooking.bookingData?.firstname || currentBooking.bookingData?.customerName,
          service: getServiceTitle(currentBooking.bookingData?.service_type || currentBooking.bookingData?.serviceType),
          bookingId: currentBooking.bookingData?.engagement_id || currentBooking.bookingData?.id,
        } : undefined}
      />

      {/* Track Address Dialog */}
      <Modal
        visible={trackAddressDialogOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setTrackAddressDialogOpen(false)}
      >
        <TrackAddress 
          onClose={() => setTrackAddressDialogOpen(false)}
          googleMapsApiKey={GOOGLE_MAPS_API_KEY}
        />
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
    height: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#3b82f6',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  closeButton: {
    padding: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#3b82f6',
    backgroundColor: '#ffffff',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  tabButtonTextActive: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  monthInfoContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  monthSelectorSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthNavButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthNavButtonPrev: {
    marginRight: 4,
  },
  monthNavButtonNext: {
    marginLeft: 4,
  },
  monthNavButtonDisabled: {
    backgroundColor: '#f9fafb',
  },
  monthNavText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
  },
  monthNavTextDisabled: {
    color: '#d1d5db',
  },
  monthTextContainer: {
    minWidth: 120,
    alignItems: 'center',
  },
  monthText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
  },
  bookingCount: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  modalBody: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    gap: 16,
  },
  skeletonCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  skeletonHeader: {
    marginBottom: 12,
  },
  skeletonHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  skeletonContent: {
    gap: 12,
  },
  skeletonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skeletonInfo: {
    flex: 1,
    gap: 8,
  },
  skeletonBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skeletonMargin: {
    marginBottom: 4,
  },
  skeleton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconContainer: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 50,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
  bookingsContainer: {
    gap: 16,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },
  cardHeader: {
    padding: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  cardHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookingId: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  headerBadges: {
    flexDirection: 'row',
    gap: 4,
  },
  cardHeaderMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardHeaderLeft: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  serviceStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  serviceText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  cardContent: {
    padding: 16,
    paddingTop: 12,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  dateTimeSection: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#4b5563',
    fontWeight: '500',
  },
  amountSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  amountInfo: {
    alignItems: 'flex-end',
  },
  amountLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  amountText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  phoneButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  responsibilitiesSection: {
    marginBottom: 16,
  },
  responsibilitiesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  responsibilitiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  responsibilityBadge: {
    marginBottom: 4,
  },
  addonBadge: {
    backgroundColor: '#eff6ff',
    borderColor: '#93c5fd',
  },
  responsibilityText: {
    fontSize: 12,
    fontWeight: '500',
  },
  noResponsibilitiesText: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  locationSection: {
    marginBottom: 16,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
  },
  trackButtonText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  locationText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  todayServiceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  todayServiceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  todayServiceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  scheduledBadge: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#93c5fd',
  },
  inProgressBadge: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
  },
  completedBadge: {
    backgroundColor: '#faf5ff',
    borderWidth: 1,
    borderColor: '#d8b4fe',
  },
  todayServiceText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  scheduledText: {
    color: '#1d4ed8',
  },
  inProgressText: {
    color: '#166534',
  },
  completedText: {
    color: '#7c3aed',
  },
  taskActionsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 16,
  },
  taskStatusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  taskButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  // Badge styles
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'white',
    textTransform: 'uppercase',
  },
  badgeDefault: {
    backgroundColor: '#3b82f6',
  },
  badgeSuccess: {
    backgroundColor: '#10b981',
  },
  badgeWarning: {
    backgroundColor: '#f59e0b',
  },
  badgeDestructive: {
    backgroundColor: '#ef4444',
  },
  badgeSecondary: {
    backgroundColor: '#6b7280',
  },
  badgeOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  // Button styles
  button: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  buttonSm: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  buttonMd: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  buttonLg: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  buttonDefault: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  buttonDefaultText: {
    color: 'white',
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderColor: '#d1d5db',
  },
  buttonOutlineText: {
    color: '#374151',
  },
  buttonSecondary: {
    backgroundColor: '#6b7280',
    borderColor: '#6b7280',
  },
  buttonSecondaryText: {
    color: 'white',
  },
  buttonGhost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  buttonGhostText: {
    color: '#374151',
  },
  buttonDestructive: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  buttonDestructiveText: {
    color: 'white',
  },
  buttonDisabled: {
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
  },
  buttonDisabledText: {
    color: '#9ca3af',
  },
});